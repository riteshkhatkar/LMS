import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== "INSTRUCTOR" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { courseId } = await params;
  const course = await prisma.course.findFirst({
    where: { OR: [{ id: courseId }, { slug: courseId }] },
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  if (session.role !== "ADMIN" && course.instructorId && course.instructorId !== session.userId) {
    return NextResponse.json({ error: "Forbidden: You are not authorized to view this course's learners" }, { status: 403 });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: course.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          learnerGroup: true,
          isOrgVerified: true,
          organization: { select: { name: true, code: true } },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  // Query final assessment attempts for these learners
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      quiz: { courseId: course.id, type: "FINAL" },
      userId: { in: enrollments.map((e) => e.userId) },
    },
    orderBy: { createdAt: "desc" },
  });

  const attemptMap = new Map<string, any>();
  for (const a of attempts) {
    if (!attemptMap.has(a.userId)) {
      attemptMap.set(a.userId, a);
    }
  }

  // Query certificates
  const certificates = await prisma.certificate.findMany({
    where: { courseId: course.id },
    select: { userId: true, id: true, status: true, grade: true, issueDate: true },
  });

  const certMap = new Map<string, any>();
  for (const c of certificates) {
    certMap.set(c.userId, c);
  }

  const learners = enrollments.map((e) => {
    const latestAttempt = attemptMap.get(e.userId);
    const cert = certMap.get(e.userId);

    return {
      userId: e.user.id,
      name: e.user.name,
      email: e.user.email,
      learnerGroup: e.user.learnerGroup,
      organization: e.user.organization,
      isOrgVerified: e.user.isOrgVerified,
      enrolledAt: e.enrolledAt,
      completedAt: e.completedAt,
      progressPct: Math.round(e.progressPct),
      isCompleted: e.isCompleted,
      finalScore: latestAttempt ? latestAttempt.scorePercent : e.finalScore,
      finalGrade: latestAttempt ? latestAttempt.grade : e.finalGrade,
      passed: latestAttempt ? latestAttempt.passed : e.isCompleted,
      attemptStatus: latestAttempt ? latestAttempt.status : "NOT_STARTED",
      certificate: cert || null,
    };
  });

  return NextResponse.json({
    course: { id: course.id, title: course.title, slug: course.slug },
    learners,
    totalEnrolled: learners.length,
    totalCompleted: learners.filter((l) => l.isCompleted).length,
  });
}
