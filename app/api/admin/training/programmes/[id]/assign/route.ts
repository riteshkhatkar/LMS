import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { LearnerGroup } from "@prisma/client";

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Props) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const programme = await prisma.trainingProgramme.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      courses: true,
    },
  });

  if (!programme) {
    return NextResponse.json({ error: "Training programme not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { userId, organizationId, learnerGroup, dueDate } = body;

    if (!userId && !organizationId && !learnerGroup) {
      return NextResponse.json(
        { error: "Must specify at least one target: userId, organizationId, or learnerGroup" },
        { status: 400 }
      );
    }

    const validatedGroup =
      learnerGroup && Object.values(LearnerGroup).includes(learnerGroup)
        ? (learnerGroup as LearnerGroup)
        : null;

    const parsedDueDate = dueDate ? new Date(dueDate) : null;

    // Create Programme Assignment
    const assignment = await prisma.trainingProgrammeAssignment.create({
      data: {
        programmeId: programme.id,
        userId: userId || null,
        organizationId: organizationId || null,
        learnerGroup: validatedGroup,
        assignedBy: session.id,
        dueDate: parsedDueDate,
        status: "ACTIVE",
      },
    });

    // Ensure constituent courses are also assigned to the same target
    for (const pc of programme.courses) {
      await prisma.courseAssignment.create({
        data: {
          courseId: pc.courseId,
          userId: userId || null,
          organizationId: organizationId || null,
          learnerGroup: validatedGroup,
          assignedBy: session.id,
          dueDate: parsedDueDate,
          status: "ACTIVE",
        },
      });
    }

    // Determine target users to notify
    const targetUserIds: string[] = [];
    if (userId) {
      targetUserIds.push(userId);
    } else if (organizationId) {
      const orgUsers = await prisma.user.findMany({
        where: { organizationId, role: "LEARNER" },
        select: { id: true },
      });
      targetUserIds.push(...orgUsers.map((u) => u.id));
    } else if (validatedGroup) {
      const groupUsers = await prisma.user.findMany({
        where: { learnerGroup: validatedGroup, role: "LEARNER" },
        select: { id: true },
      });
      targetUserIds.push(...groupUsers.map((u) => u.id));
    }

    // Dispatch notifications
    for (const uid of targetUserIds) {
      await prisma.notification.create({
        data: {
          userId: uid,
          eventType: "COURSE_ASSIGNED",
          title: "New Training Programme Assigned",
          body: `You have been assigned the training programme: ${programme.title}.`,
          destination: `/training`,
          deduplicationKey: `train_assign_${programme.id}_${uid}_${Date.now()}`,
          isRead: false,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "ASSIGN_TRAINING_PROGRAMME",
        target: programme.id,
        details: {
          assignmentId: assignment.id,
          userId,
          organizationId,
          learnerGroup: validatedGroup,
          notifiedUsersCount: targetUserIds.length,
        },
      },
    });

    return NextResponse.json(
      {
        message: "Training programme assigned successfully",
        assignment,
        notifiedUsersCount: targetUserIds.length,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Failed to assign training programme:", err);
    return NextResponse.json({ error: err.message || "Assignment failed" }, { status: 500 });
  }
}
