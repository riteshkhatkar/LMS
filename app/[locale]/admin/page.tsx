import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const metadata: Metadata = {
  title: "Admin Portal | Learn LMS",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{
    locale: string;
  }>;
}

export default async function AdminDashboardPage({ params }: Props) {
  const { locale } = await params;
  const session = await getSession();

  if (!session) {
    redirect(`/${locale}/login?redirect=/${locale}/admin`);
  }

  if (session.role !== "ADMIN") {
    redirect(`/${locale}/learn/my-learning`);
  }

  // 1. Fetch KPI metrics from PostgreSQL
  const [
    userCount,
    orgCount,
    courseCount,
    enrollmentCount,
    attemptCount,
    certEligibleCount,
    certIssuedCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.course.count(),
    prisma.enrollment.count(),
    prisma.quizAttempt.count(),
    prisma.certificateEligibility.count(),
    prisma.certificate.count(),
  ]);

  // 2. Fetch courses with relations
  const rawCourses = await prisma.course.findMany({
    include: {
      gradingRules: {
        orderBy: { version: "desc" },
      },
      sections: {
        include: { lessons: true },
      },
      quizzes: true,
      enrollments: true,
      courseCategory: true,
      instructor: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: {
          sections: true,
          enrollments: true,
          quizzes: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const courses = rawCourses.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    gradingRules: c.gradingRules.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  }));

  // 3. Fetch certificates for management console
  const rawCertificates = await prisma.certificate.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        include: { organization: true },
      },
      course: true,
    },
  });

  const certificates = rawCertificates.map((c) => ({
    id: c.id,
    userId: c.userId,
    userName: c.user.name || "Learner",
    userEmail: c.user.email,
    learnerGroup: c.user.learnerGroup,
    orgName: c.user.organization?.name,
    courseId: c.courseId,
    courseTitle: c.course.title,
    scorePercent: c.scorePercent,
    grade: c.grade,
    provisional: c.provisional,
    status: c.status,
    ledgerMode: c.ledgerMode,
    issueDate: c.issueDate.toISOString(),
    revocationReason: c.revocationReason,
    txHash: c.txHash,
  }));

  // 4. Fetch recent assessment attempts
  const rawAttempts = await prisma.quizAttempt.findMany({
    where: { status: { in: ["SUBMITTED", "EXPIRED"] } },
    include: {
      user: {
        include: { organization: true },
      },
      quiz: {
        include: { course: true },
      },
      eligibility: true,
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  const recentAttempts = rawAttempts.map((att) => ({
    ...att,
    createdAt: att.createdAt.toISOString(),
    updatedAt: att.updatedAt.toISOString(),
    startedAt: att.startedAt ? att.startedAt.toISOString() : null,
    submittedAt: att.submittedAt ? att.submittedAt.toISOString() : null,
  }));

  return (
    <AdminDashboardClient
      userEmail={session.email}
      userName={session.name || "Administrator"}
      locale={locale}
      counts={{
        userCount,
        orgCount,
        courseCount,
        enrollmentCount,
        attemptCount,
        certEligibleCount,
        certIssuedCount,
      }}
      courses={courses}
      certificates={certificates}
      recentAttempts={recentAttempts}
    />
  );
}
