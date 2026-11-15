import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { slugify } from "@/lib/training/training";
import { LearnerGroup, TrainingProgrammeStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const targetGroup = searchParams.get("targetGroup")?.trim();
  const status = searchParams.get("status")?.trim();

  const where: any = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }
  if (targetGroup && Object.values(LearnerGroup).includes(targetGroup as LearnerGroup)) {
    where.targetGroup = targetGroup as LearnerGroup;
  }
  if (status && Object.values(TrainingProgrammeStatus).includes(status as TrainingProgrammeStatus)) {
    where.status = status as TrainingProgrammeStatus;
  }

  const programmes = await prisma.trainingProgramme.findMany({
    where,
    include: {
      courses: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              durationMinutes: true,
              publishStatus: true,
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      organization: {
        select: { id: true, name: true, code: true },
      },
      _count: {
        select: {
          assignments: true,
          certificates: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ programmes });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      title,
      slug: customSlug,
      description,
      targetGroup,
      organizationId,
      estimatedDurationMinutes = 120,
      isRequired = true,
      isRestricted = false,
      certificateEnabled = true,
      passingScorePercent = 60.0,
      courseIds = [],
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Programme title is required" }, { status: 400 });
    }

    const baseSlug = customSlug?.trim() || slugify(title);
    if (!baseSlug) {
      return NextResponse.json({ error: "Valid slug or title is required" }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = await prisma.trainingProgramme.findUnique({
      where: { slug: baseSlug },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Programme with slug '${baseSlug}' already exists` },
        { status: 409 }
      );
    }

    const validatedTargetGroup =
      targetGroup && Object.values(LearnerGroup).includes(targetGroup as LearnerGroup)
        ? (targetGroup as LearnerGroup)
        : null;

    const programme = await prisma.$transaction(async (tx) => {
      const created = await tx.trainingProgramme.create({
        data: {
          title: title.trim(),
          slug: baseSlug,
          description: description?.trim() || "",
          targetGroup: validatedTargetGroup,
          organizationId: organizationId || null,
          estimatedDurationMinutes: Number(estimatedDurationMinutes) || 120,
          isRequired: Boolean(isRequired),
          isRestricted: Boolean(isRestricted),
          certificateEnabled: Boolean(certificateEnabled),
          passingScorePercent: Number(passingScorePercent) || 60.0,
          status: TrainingProgrammeStatus.DRAFT,
          createdBy: session.id,
        },
      });

      if (Array.isArray(courseIds) && courseIds.length > 0) {
        for (let idx = 0; idx < courseIds.length; idx++) {
          const item = courseIds[idx];
          const courseId = typeof item === "string" ? item : item.courseId;
          const isReq = typeof item === "object" && "isRequired" in item ? item.isRequired : true;

          if (courseId) {
            await tx.trainingProgrammeCourse.create({
              data: {
                programmeId: created.id,
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
          action: "CREATE_TRAINING_PROGRAMME",
          target: created.id,
          details: {
            title: created.title,
            slug: created.slug,
            coursesCount: courseIds.length,
          },
        },
      });

      return tx.trainingProgramme.findUnique({
        where: { id: created.id },
        include: {
          courses: {
            include: { course: true },
            orderBy: { sortOrder: "asc" },
          },
          organization: true,
        },
      });
    });

    return NextResponse.json({ programme }, { status: 201 });
  } catch (err: any) {
    console.error("Failed to create training programme:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
