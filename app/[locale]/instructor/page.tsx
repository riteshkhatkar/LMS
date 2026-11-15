import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { InstructorDashboardClient } from "@/components/instructor/InstructorDashboardClient";

export const metadata: Metadata = {
  title: "Instructor Portal | Learn LMS",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{
    locale: string;
  }>;
}

export default async function InstructorDashboardPage({ params }: Props) {
  const { locale } = await params;
  const session = await getSession();

  if (!session) {
    redirect(`/${locale}/login?redirect=/${locale}/instructor`);
  }

  if (session.role !== "INSTRUCTOR" && session.role !== "ADMIN") {
    redirect(`/${locale}/learn/my-learning`);
  }

  // 1. Fetch courses with sections, lessons, quizzes, questions, enrollments, users
  const rawCourses = await prisma.course.findMany({
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
        include: { lessons: true },
      },
      quizzes: {
        orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
        include: {
          questions: true,
          attempts: true,
        },
      },
      enrollments: {
        include: {
          user: {
            include: { organization: true },
          },
        },
      },
      courseCategory: true,
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
    enrollments: c.enrollments.map((en) => ({
      ...en,
      enrolledAt: en.enrolledAt.toISOString(),
      completedAt: en.completedAt ? en.completedAt.toISOString() : null,
      user: {
        ...en.user,
        createdAt: en.user.createdAt.toISOString(),
        updatedAt: en.user.updatedAt.toISOString(),
      },
    })),
  }));

  // 2. Fetch recent student assessment attempts
  const courseIds = courses.map((c) => c.id);
  const rawAttempts = await prisma.quizAttempt.findMany({
    where: {
      quiz: { courseId: { in: courseIds } },
      status: { in: ["SUBMITTED", "EXPIRED"] },
    },
    include: {
      user: {
        include: { organization: true },
      },
      quiz: {
        include: { course: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const recentStudentAttempts = rawAttempts.map((att) => ({
    ...att,
    createdAt: att.createdAt.toISOString(),
    updatedAt: att.updatedAt.toISOString(),
    startedAt: att.startedAt ? att.startedAt.toISOString() : null,
    submittedAt: att.submittedAt ? att.submittedAt.toISOString() : null,
  }));

  // 3. Fetch categories for wizard
  const rawCategories = await prisma.courseCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const categories = rawCategories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
  }));

  return (
    <InstructorDashboardClient
      userEmail={session.email}
      userName={session.name || "Instructor"}
      userRole={session.role}
      locale={locale}
      courses={courses}
      recentStudentAttempts={recentStudentAttempts}
      categories={categories}
    />
  );
}
