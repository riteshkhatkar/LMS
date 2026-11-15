import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { canUserAccessProgramme, calculateProgrammeProgress } from "@/lib/training/training";
import { TrainingProgrammeStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find assignments for this user
  const assignmentWhereOr: any[] = [{ userId: session.id }];
  if (session.organizationId) {
    assignmentWhereOr.push({ organizationId: session.organizationId });
  }
  if (session.learnerGroup) {
    assignmentWhereOr.push({ learnerGroup: session.learnerGroup as any });
  }

  const userAssignments = await prisma.trainingProgrammeAssignment.findMany({
    where: { OR: assignmentWhereOr },
    select: { programmeId: true, dueDate: true, status: true },
  });
  const assignedProgrammeIds = new Set(userAssignments.map((a) => a.programmeId));

  // Query programmes: assigned OR published
  const programmes = await prisma.trainingProgramme.findMany({
    where: {
      OR: [
        { id: { in: Array.from(assignedProgrammeIds) } },
        { status: TrainingProgrammeStatus.PUBLISHED },
      ],
    },
    include: {
      courses: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnail: true,
              durationMinutes: true,
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      organization: { select: { name: true, code: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // CONFIDENTIALITY & CLEARANCE FILTER
  const accessibleProgrammes = programmes.filter((p) =>
    canUserAccessProgramme(
      { role: session.role, learnerGroup: session.learnerGroup },
      { isRestricted: p.isRestricted, targetGroup: p.targetGroup }
    )
  );

  // Fetch all enrollments for this user
  const allCourseIds = Array.from(
    new Set(accessibleProgrammes.flatMap((p) => p.courses.map((c) => c.courseId)))
  );

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: session.id,
      courseId: { in: allCourseIds },
    },
    select: {
      courseId: true,
      progressPct: true,
      isCompleted: true,
      assessmentStatus: true,
      finalScore: true,
      finalGrade: true,
    },
  });

  // Fetch certificates for this user
  const certificates = await prisma.certificate.findMany({
    where: {
      userId: session.id,
      status: "VALID",
    },
    select: {
      id: true,
      programmeId: true,
      courseId: true,
      issueDate: true,
      grade: true,
    },
  });

  const result = accessibleProgrammes.map((p) => {
    const isAssigned = assignedProgrammeIds.has(p.id);
    const assignmentMeta = userAssignments.find((a) => a.programmeId === p.id);
    const progress = calculateProgrammeProgress(p.courses, enrollments);

    const pCourseIds = p.courses.map((c) => c.courseId);
    const matchingCert = certificates.find(
      (c) => c.programmeId === p.id || (pCourseIds.includes(c.courseId) && progress.isCompleted)
    );

    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      description: p.description,
      targetGroup: p.targetGroup,
      organization: p.organization?.name || null,
      estimatedDurationMinutes: p.estimatedDurationMinutes,
      isRequired: p.isRequired,
      isRestricted: p.isRestricted,
      certificateEnabled: p.certificateEnabled,
      isAssigned,
      dueDate: assignmentMeta?.dueDate || null,
      assignmentStatus: assignmentMeta?.status || null,
      totalCourses: progress.totalCourses,
      completedCoursesCount: progress.completedCoursesCount,
      overallProgressPct: progress.overallProgressPct,
      isCompleted: progress.isCompleted,
      certificateIssued: !!matchingCert,
      certificateId: matchingCert?.id || null,
      courses: progress.coursesProgress,
    };
  });

  return NextResponse.json({ programmes: result });
}
