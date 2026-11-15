import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { LearnerGroup, TrainingProgrammeStatus } from "@prisma/client";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Props) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const programme = await prisma.trainingProgramme.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
    include: {
      courses: {
        include: {
          course: {
            include: {
              sections: {
                include: { lessons: true },
                orderBy: { sortOrder: "asc" },
              },
              quizzes: true,
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      organization: true,
      assignments: {
        include: {
          user: {
            select: { id: true, name: true, email: true, learnerGroup: true },
          },
          organization: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: { assignedAt: "desc" },
      },
      _count: {
        select: {
          certificates: true,
          assignments: true,
        },
      },
    },
  });

  if (!programme) {
    return NextResponse.json({ error: "Training programme not found" }, { status: 404 });
  }

  return NextResponse.json({ programme });
}

export async function PUT(req: NextRequest, { params }: Props) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const programme = await prisma.trainingProgramme.findFirst({
    where: { OR: [{ id }, { slug: id }] },
  });

  if (!programme) {
    return NextResponse.json({ error: "Training programme not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      targetGroup,
      organizationId,
      estimatedDurationMinutes,
      isRequired,
      isRestricted,
      certificateEnabled,
      passingScorePercent,
      status,
      courseIds,
    } = body;

    const updated = await prisma.$transaction(async (tx) => {
      const dataToUpdate: any = {};
      if (title !== undefined) dataToUpdate.title = String(title).trim();
      if (description !== undefined) dataToUpdate.description = String(description).trim();
      if (targetGroup !== undefined) {
        dataToUpdate.targetGroup =
          targetGroup && Object.values(LearnerGroup).includes(targetGroup as LearnerGroup)
            ? (targetGroup as LearnerGroup)
            : null;
      }
      if (organizationId !== undefined) dataToUpdate.organizationId = organizationId || null;
      if (estimatedDurationMinutes !== undefined) {
        dataToUpdate.estimatedDurationMinutes = Number(estimatedDurationMinutes);
      }
      if (isRequired !== undefined) dataToUpdate.isRequired = Boolean(isRequired);
      if (isRestricted !== undefined) dataToUpdate.isRestricted = Boolean(isRestricted);
      if (certificateEnabled !== undefined) {
        dataToUpdate.certificateEnabled = Boolean(certificateEnabled);
      }
      if (passingScorePercent !== undefined) {
        dataToUpdate.passingScorePercent = Number(passingScorePercent);
      }
      if (status && Object.values(TrainingProgrammeStatus).includes(status as TrainingProgrammeStatus)) {
        dataToUpdate.status = status as TrainingProgrammeStatus;
      }

      await tx.trainingProgramme.update({
        where: { id: programme.id },
        data: dataToUpdate,
      });

      // Update courses if provided
      if (Array.isArray(courseIds)) {
        await tx.trainingProgrammeCourse.deleteMany({
          where: { programmeId: programme.id },
        });

        for (let idx = 0; idx < courseIds.length; idx++) {
          const item = courseIds[idx];
          const courseId = typeof item === "string" ? item : item.courseId;
          const isReq = typeof item === "object" && "isRequired" in item ? item.isRequired : true;

          if (courseId) {
            await tx.trainingProgrammeCourse.create({
              data: {
                programmeId: programme.id,
                courseId,
                sortOrder: idx + 1,
                isRequired: Boolean(isReq),
              },
            });
          }
        }
      }

      await tx.auditLog.create({
        data: {
          userId: session.id,
          action: "UPDATE_TRAINING_PROGRAMME",
          target: programme.id,
          details: { changes: Object.keys(dataToUpdate) },
        },
      });

      return tx.trainingProgramme.findUnique({
        where: { id: programme.id },
        include: {
          courses: {
            include: { course: true },
            orderBy: { sortOrder: "asc" },
          },
          organization: true,
        },
      });
    });

    return NextResponse.json({ programme: updated });
  } catch (err: any) {
    console.error("Failed to update programme:", err);
    return NextResponse.json({ error: err.message || "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Props) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const programme = await prisma.trainingProgramme.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: { _count: { select: { assignments: true, certificates: true } } },
  });

  if (!programme) {
    return NextResponse.json({ error: "Training programme not found" }, { status: 404 });
  }

  // If there are certificates or active assignments, soft delete / archive instead
  if (programme._count.certificates > 0 || programme._count.assignments > 0) {
    await prisma.trainingProgramme.update({
      where: { id: programme.id },
      data: { status: TrainingProgrammeStatus.ARCHIVED },
    });
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "ARCHIVE_TRAINING_PROGRAMME",
        target: programme.id,
      },
    });
    return NextResponse.json({
      message: "Programme has existing records; marked as ARCHIVED instead of hard deleted",
      programme: { id: programme.id, status: TrainingProgrammeStatus.ARCHIVED },
    });
  }

  await prisma.trainingProgramme.delete({
    where: { id: programme.id },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      action: "DELETE_TRAINING_PROGRAMME",
      target: programme.id,
    },
  });

  return NextResponse.json({ message: "Programme deleted successfully", id: programme.id });
}
