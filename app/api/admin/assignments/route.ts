import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { LearnerGroup } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  const orgId = searchParams.get("organizationId");

  const where: any = {};
  if (courseId) where.courseId = courseId;
  if (orgId) where.organizationId = orgId;

  const assignments = await prisma.courseAssignment.findMany({
    where,
    include: {
      course: {
        select: { id: true, title: true, slug: true, isRestricted: true },
      },
      organization: {
        select: { id: true, name: true, code: true },
      },
      user: {
        select: { id: true, name: true, email: true, learnerGroup: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ assignments });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { courseId, type, userId, organizationId, learnerGroup, dueDate } = body;
    const resolvedType =
      type ||
      (organizationId ? "ORGANIZATION" : userId ? "LEARNER" : learnerGroup ? "LEARNER_GROUP" : undefined);

    if (!courseId || !resolvedType) {
      return NextResponse.json({ error: "courseId and assignment type are required" }, { status: 400 });
    }

    const course = await prisma.course.findFirst({
      where: { OR: [{ id: courseId }, { slug: courseId }] },
      include: { audiences: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const parsedDueDate = dueDate ? new Date(dueDate) : null;
    let createdAssignment;
    let enrolledCount = 0;
    const errors: string[] = [];

    if (resolvedType === "LEARNER") {
      if (!userId) {
        return NextResponse.json({ error: "userId is required for individual learner assignment" }, { status: 400 });
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { organization: true },
      });

      if (!targetUser) {
        return NextResponse.json({ error: "Target learner not found" }, { status: 404 });
      }

      // Security check for restricted training (e.g. Naval)
      if (course.isRestricted && (!targetUser.isOrgVerified || targetUser.learnerGroup !== "NAVAL_OFFICER")) {
        return NextResponse.json(
          { error: "Security Policy: Restricted course cannot be assigned to unverified organization members." },
          { status: 403 }
        );
      }

      // Idempotent assignment check
      let existing = await prisma.courseAssignment.findFirst({
        where: { courseId: course.id, userId: targetUser.id },
      });

      if (!existing) {
        createdAssignment = await prisma.courseAssignment.create({
          data: {
            courseId: course.id,
            userId: targetUser.id,
            assignedBy: session.email,
            dueDate: parsedDueDate,
            status: "ACTIVE",
          },
          include: { course: true, user: true },
        });
      } else {
        createdAssignment = existing;
      }

      // Idempotent enrollment check: enroll if not enrolled
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: targetUser.id, courseId: course.id } },
      });

      if (!existingEnrollment) {
        await prisma.enrollment.create({
          data: {
            userId: targetUser.id,
            courseId: course.id,
            progressPct: 0,
            assessmentStatus: "NOT_STARTED",
          },
        });
        enrolledCount = 1;
      }
    } else if (resolvedType === "ORGANIZATION") {
      if (!organizationId) {
        return NextResponse.json({ error: "organizationId is required for organization assignment" }, { status: 400 });
      }

      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: { users: true },
      });

      if (!org) {
        return NextResponse.json({ error: "Organization not found" }, { status: 404 });
      }

      // Security check: cannot assign restricted course to an unverified organization
      const hasOnlyUnverifiedMembers = org.users.length > 0 && org.users.every((u) => !u.isOrgVerified);
      if (course.isRestricted && hasOnlyUnverifiedMembers) {
        return NextResponse.json(
          { error: "Security Policy: Restricted course cannot be assigned to an unverified organization." },
          { status: 403 }
        );
      }

      let existing = await prisma.courseAssignment.findFirst({
        where: { courseId: course.id, organizationId: org.id },
      });

      if (!existing) {
        createdAssignment = await prisma.courseAssignment.create({
          data: {
            courseId: course.id,
            organizationId: org.id,
            assignedBy: session.email,
            dueDate: parsedDueDate,
            status: "ACTIVE",
          },
          include: { course: true, organization: true },
        });
      } else {
        createdAssignment = existing;
      }

      // Enroll eligible organization members idempotently
      for (const member of org.users) {
        if (course.isRestricted && !member.isOrgVerified) {
          errors.push(`Skipped ${member.email}: Organization membership not verified for restricted course.`);
          continue;
        }

        const existingEnroll = await prisma.enrollment.findUnique({
          where: { userId_courseId: { userId: member.id, courseId: course.id } },
        });

        if (!existingEnroll) {
          await prisma.enrollment.create({
            data: {
              userId: member.id,
              courseId: course.id,
              progressPct: 0,
              assessmentStatus: "NOT_STARTED",
            },
          });
          enrolledCount++;
        }
      }
    } else if (resolvedType === "LEARNER_GROUP") {
      if (!learnerGroup || !Object.values(LearnerGroup).includes(learnerGroup as any)) {
        return NextResponse.json({ error: "Valid learnerGroup is required" }, { status: 400 });
      }

      let existing = await prisma.courseAssignment.findFirst({
        where: { courseId: course.id, learnerGroup: learnerGroup as LearnerGroup },
      });

      if (!existing) {
        createdAssignment = await prisma.courseAssignment.create({
          data: {
            courseId: course.id,
            learnerGroup: learnerGroup as LearnerGroup,
            assignedBy: session.email,
            dueDate: parsedDueDate,
            status: "ACTIVE",
          },
          include: { course: true },
        });
      } else {
        createdAssignment = existing;
      }

      // Enroll matching group members idempotently
      const groupUsers = await prisma.user.findMany({
        where: { learnerGroup: learnerGroup as LearnerGroup },
      });

      for (const member of groupUsers) {
        if (course.isRestricted && !member.isOrgVerified) {
          errors.push(`Skipped ${member.email}: Unverified organizational status.`);
          continue;
        }

        const existingEnroll = await prisma.enrollment.findUnique({
          where: { userId_courseId: { userId: member.id, courseId: course.id } },
        });

        if (!existingEnroll) {
          await prisma.enrollment.create({
            data: {
              userId: member.id,
              courseId: course.id,
              progressPct: 0,
              assessmentStatus: "NOT_STARTED",
            },
          });
          enrolledCount++;
        }
      }
    } else {
      return NextResponse.json({ error: "Invalid assignment type. Must be LEARNER, ORGANIZATION, or LEARNER_GROUP." }, { status: 400 });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "COURSE_ASSIGNED",
        target: course.title,
        details: {
          assignmentId: createdAssignment?.id,
          type,
          targetRef: userId || organizationId || learnerGroup,
          enrolledCount,
          errorsCount: errors.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      assignment: createdAssignment,
      enrolledCount,
      errors: errors.length > 0 ? errors : undefined,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create course assignment" }, { status: 500 });
  }
}
