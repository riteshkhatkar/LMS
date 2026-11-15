import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { LearnerGroup, TrainingProgrammeStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  // Count programmes by status
  const [totalProgrammes, publishedCount, draftCount, archivedCount] = await Promise.all([
    prisma.trainingProgramme.count(),
    prisma.trainingProgramme.count({ where: { status: TrainingProgrammeStatus.PUBLISHED } }),
    prisma.trainingProgramme.count({ where: { status: TrainingProgrammeStatus.DRAFT } }),
    prisma.trainingProgramme.count({ where: { status: TrainingProgrammeStatus.ARCHIVED } }),
  ]);

  // Fetch all programmes with their courses and assignments
  const programmes = await prisma.trainingProgramme.findMany({
    include: {
      courses: {
        select: { courseId: true, isRequired: true },
      },
      assignments: true,
      _count: {
        select: { certificates: true },
      },
    },
  });

  // Calculate participant numbers per target group
  const groupStats: Record<string, { assigned: number; completed: number }> = {
    FPO: { assigned: 0, completed: 0 },
    FPC: { assigned: 0, completed: 0 },
    NAVAL_OFFICER: { assigned: 0, completed: 0 },
    STUDENT: { assigned: 0, completed: 0 },
  };

  let totalAssigned = 0;
  let totalCompleted = 0;

  for (const prog of programmes) {
    const directUserIds = new Set<string>();
    const orgIds = new Set<string>();
    const learnerGroups = new Set<string>();

    for (const a of prog.assignments) {
      if (a.userId) directUserIds.add(a.userId);
      if (a.organizationId) orgIds.add(a.organizationId);
      if (a.learnerGroup) learnerGroups.add(a.learnerGroup);
    }

    const userWhereOr: any[] = [];
    if (directUserIds.size > 0) userWhereOr.push({ id: { in: Array.from(directUserIds) } });
    if (orgIds.size > 0) userWhereOr.push({ organizationId: { in: Array.from(orgIds) } });
    if (learnerGroups.size > 0) userWhereOr.push({ learnerGroup: { in: Array.from(learnerGroups) as any } });

    if (userWhereOr.length > 0) {
      const users = await prisma.user.findMany({
        where: { role: "LEARNER", OR: userWhereOr },
        select: { id: true, learnerGroup: true },
      });

      const requiredCourseIds = prog.courses.filter((c) => c.isRequired).map((c) => c.courseId);
      const userIds = users.map((u) => u.id);

      // High Performance Batch Query: Eliminate N+1 DB roundtrips by querying all relevant completed enrollments in one call
      const completedSet = new Set<string>();
      if (requiredCourseIds.length > 0 && userIds.length > 0) {
        const completedEnrollments = await prisma.enrollment.findMany({
          where: {
            userId: { in: userIds },
            courseId: { in: requiredCourseIds },
            OR: [
              { isCompleted: true },
              { progressPct: 100, assessmentStatus: "PASSED" },
            ],
          },
          select: { userId: true, courseId: true },
        });
        for (const e of completedEnrollments) {
          completedSet.add(`${e.userId}:${e.courseId}`);
        }
      }

      for (const u of users) {
        totalAssigned++;
        const gKey = u.learnerGroup || "STUDENT";
        if (groupStats[gKey]) {
          groupStats[gKey].assigned++;
        }

        if (requiredCourseIds.length > 0) {
          let completedReqCount = 0;
          for (const cId of requiredCourseIds) {
            if (completedSet.has(`${u.id}:${cId}`)) {
              completedReqCount++;
            }
          }

          if (completedReqCount >= requiredCourseIds.length) {
            totalCompleted++;
            if (groupStats[gKey]) {
              groupStats[gKey].completed++;
            }
          }
        }
      }
    }
  }

  const completionRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 1000) / 10 : 0;

  return NextResponse.json({
    metrics: {
      totalProgrammes,
      publishedCount,
      draftCount,
      archivedCount,
      totalAssigned,
      totalCompleted,
      completionRate,
      groupStats,
    },
    programmes: programmes.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      targetGroup: p.targetGroup,
      status: p.status,
      coursesCount: p.courses.length,
      assignmentsCount: p.assignments.length,
      certificatesCount: p._count.certificates,
    })),
  });
}
