import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Role, LearnerGroup, PublishStatus, QuizType, CertificateStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "INSTRUCTOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  const learnerGroup = searchParams.get("learnerGroup");
  const orgId = searchParams.get("organizationId");

  // User where clause
  const userWhere: any = { role: Role.LEARNER };
  if (learnerGroup && Object.values(LearnerGroup).includes(learnerGroup as any)) {
    userWhere.learnerGroup = learnerGroup as LearnerGroup;
  }
  if (orgId) {
    userWhere.organizationId = orgId;
  }

  // Enrollment where clause
  const enrollmentWhere: any = {};
  if (courseId) enrollmentWhere.courseId = courseId;
  if (learnerGroup || orgId) {
    enrollmentWhere.user = userWhere;
  }

  // 1. KPI Counts
  const [
    totalLearners,
    activeEnrollments,
    completedEnrollments,
    totalCourses,
    publishedCourses,
    finalAttempts,
    passedFinalAttempts,
    eligibleCount,
    issuedCertCount,
    revokedCertCount,
    supersededCertCount,
  ] = await Promise.all([
    prisma.user.count({ where: userWhere }),
    prisma.enrollment.count({ where: enrollmentWhere }),
    prisma.enrollment.count({ where: { ...enrollmentWhere, isCompleted: true } }),
    prisma.course.count(),
    prisma.course.count({ where: { publishStatus: PublishStatus.published } }),
    prisma.quizAttempt.count({
      where: {
        quiz: { type: QuizType.FINAL, ...(courseId ? { courseId } : {}) },
        status: { in: ["SUBMITTED", "EXPIRED"] },
        ...(learnerGroup || orgId ? { user: userWhere } : {}),
      },
    }),
    prisma.quizAttempt.count({
      where: {
        quiz: { type: QuizType.FINAL, ...(courseId ? { courseId } : {}) },
        status: "SUBMITTED",
        passed: true,
        ...(learnerGroup || orgId ? { user: userWhere } : {}),
      },
    }),
    prisma.certificateEligibility.count({
      where: courseId ? { courseId } : {},
    }),
    prisma.certificate.count({
      where: {
        status: CertificateStatus.VALID,
        ...(courseId ? { courseId } : {}),
      },
    }),
    prisma.certificate.count({
      where: {
        status: CertificateStatus.REVOKED,
        ...(courseId ? { courseId } : {}),
      },
    }),
    prisma.certificate.count({
      where: {
        status: CertificateStatus.SUPERSEDED,
        ...(courseId ? { courseId } : {}),
      },
    }),
  ]);

  // Formulas:
  // Course completion rate = (completed enrollments / active enrollments) * 100
  const courseCompletionRate =
    activeEnrollments > 0 ? Number(((completedEnrollments / activeEnrollments) * 100).toFixed(1)) : 0;

  // Assessment pass rate = (passed final attempts / total submitted final attempts) * 100
  const assessmentPassRate =
    finalAttempts > 0 ? Number(((passedFinalAttempts / finalAttempts) * 100).toFixed(1)) : 0;

  // 2. Grade Distribution
  const gradeAResults = await prisma.quizAttempt.count({
    where: {
      quiz: { type: QuizType.FINAL, ...(courseId ? { courseId } : {}) },
      grade: "A",
      status: "SUBMITTED",
    },
  });

  const gradeBResults = await prisma.quizAttempt.count({
    where: {
      quiz: { type: QuizType.FINAL, ...(courseId ? { courseId } : {}) },
      grade: "B",
      status: "SUBMITTED",
    },
  });

  const provisionalResults = await prisma.quizAttempt.count({
    where: {
      quiz: { type: QuizType.FINAL, ...(courseId ? { courseId } : {}) },
      provisional: true,
      status: "SUBMITTED",
    },
  });

  const failedResults = Math.max(0, finalAttempts - passedFinalAttempts);

  // 3. Enrollments per Course breakdown
  const coursesWithStats = await prisma.course.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      publishStatus: true,
      _count: {
        select: {
          enrollments: true,
          certificates: true,
        },
      },
      enrollments: {
        select: {
          isCompleted: true,
          progressPct: true,
        },
      },
    },
    take: 10,
    orderBy: { createdAt: "asc" },
  });

  const coursePerformance = coursesWithStats.map((c) => {
    const total = c.enrollments.length;
    const completed = c.enrollments.filter((e) => e.isCompleted).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      id: c.id,
      title: c.title,
      slug: c.slug,
      status: c.publishStatus,
      totalEnrollments: total,
      completedEnrollments: completed,
      completionRate: rate,
      certificatesIssued: c._count.certificates,
    };
  });

  // 4. Organization Training Progress breakdown
  const orgs = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      users: {
        select: {
          id: true,
          enrollments: {
            select: { isCompleted: true, progressPct: true },
          },
        },
      },
    },
  });

  const organizationBreakdown = orgs.map((org) => {
    let orgEnrollments = 0;
    let orgCompleted = 0;
    let totalProgress = 0;

    for (const u of org.users) {
      for (const e of u.enrollments) {
        orgEnrollments++;
        totalProgress += e.progressPct;
        if (e.isCompleted) orgCompleted++;
      }
    }

    return {
      id: org.id,
      name: org.name,
      code: org.code,
      memberCount: org.users.length,
      totalEnrollments: orgEnrollments,
      completedEnrollments: orgCompleted,
      completionRate: orgEnrollments > 0 ? Math.round((orgCompleted / orgEnrollments) * 100) : 0,
      avgProgress: orgEnrollments > 0 ? Math.round(totalProgress / orgEnrollments) : 0,
    };
  });

  // 5. Learner Group Progress breakdown
  const groups = [LearnerGroup.FPO, LearnerGroup.FPC, LearnerGroup.STUDENT, LearnerGroup.NAVAL_OFFICER];
  const learnerGroupBreakdown = await Promise.all(
    groups.map(async (grp) => {
      const count = await prisma.user.count({ where: { learnerGroup: grp } });
      const enrolls = await prisma.enrollment.findMany({
        where: { user: { learnerGroup: grp } },
        select: { isCompleted: true, progressPct: true },
      });
      const completed = enrolls.filter((e) => e.isCompleted).length;
      const avgProg =
        enrolls.length > 0 ? Math.round(enrolls.reduce((a, b) => a + b.progressPct, 0) / enrolls.length) : 0;

      return {
        group: grp,
        label: grp === "NAVAL_OFFICER" ? "Naval Officers" : grp === "STUDENT" ? "Students" : grp,
        userCount: count,
        enrollmentCount: enrolls.length,
        completionCount: completed,
        avgProgress: avgProg,
      };
    })
  );

  return NextResponse.json({
    kpis: {
      totalLearners,
      activeEnrollments,
      completedEnrollments,
      courseCompletionRate,
      totalCourses,
      publishedCourses,
      finalAttempts,
      passedFinalAttempts,
      assessmentPassRate,
      eligibleCount,
      issuedCertCount,
      revokedCertCount,
      supersededCertCount,
    },
    grades: {
      gradeA: gradeAResults,
      gradeB: gradeBResults,
      provisional: provisionalResults,
      failed: failedResults,
      total: finalAttempts,
    },
    coursePerformance,
    organizationBreakdown,
    learnerGroupBreakdown,
  });
}
