import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { CoursePlayerView } from "@/components/player/CoursePlayerView";

interface Props {
  params: Promise<{
    locale: string;
    courseId: string;
    lessonId: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseId, lessonId } = await params;
  const lesson = await prisma.lesson.findFirst({
    where: {
      OR: [
        { id: lessonId },
        { section: { course: { OR: [{ id: courseId }, { slug: courseId }] } } },
      ],
    },
    include: { section: { include: { course: true } } },
  });

  if (!lesson) {
    return { title: "Lesson | Learn LMS" };
  }

  return {
    title: `${lesson.title} - ${lesson.section.course.title} | Learn LMS`,
    robots: { index: false, follow: false },
  };
}

export default async function CoursePlayerPage({ params }: Props) {
  const { locale, courseId, lessonId } = await params;

  const session = await getSession();
  if (!session) {
    redirect(`/${locale}/login?redirect=/${locale}/learn/course/${courseId}/lesson/${lessonId}`);
  }

  // 1. Fetch Course with Sections & Lessons
  const course = await prisma.course.findFirst({
    where: {
      OR: [{ id: courseId }, { slug: courseId }],
    },
    include: {
      quizzes: {
        where: { isPublished: true },
        orderBy: { sortOrder: "asc" },
      },
      sections: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            orderBy: { sortOrder: "asc" },
            include: {
              trainingSteps: {
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  // 2. Ensure Enrollment exists (auto-enroll if navigating directly)
  const enrollment = await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: session.id,
        courseId: course.id,
      },
    },
    update: {},
    create: {
      userId: session.id,
      courseId: course.id,
      progressPct: 0,
    },
  });

  // 3. Fetch completed progress for this learner in this course
  const allLessonIds = course.sections.flatMap((s) => s.lessons.map((l) => l.id));
  const progresses = await prisma.activityProgress.findMany({
    where: {
      userId: session.id,
      lessonId: { in: allLessonIds },
      completed: true,
    },
  });
  const completedSet = new Set(progresses.map((p) => p.lessonId));

  // 4. Flatten lessons for sequential navigation
  const flatLessons = course.sections.flatMap((s) =>
    s.lessons.map((l) => ({
      ...l,
      sectionId: s.id,
      sectionTitle: s.title,
    }))
  );

  let currentIndex = flatLessons.findIndex((l) => l.id === lessonId);
  if (currentIndex === -1 && flatLessons.length > 0) {
    currentIndex = 0;
  }
  if (currentIndex === -1) {
    notFound();
  }

  const currentLessonData = flatLessons[currentIndex];
  const currentSectionData = course.sections.find((s) => s.id === currentLessonData.sectionId)!;

  const prevLesson =
    currentIndex > 0
      ? { id: flatLessons[currentIndex - 1].id, title: flatLessons[currentIndex - 1].title }
      : null;

  const nextLesson =
    currentIndex < flatLessons.length - 1
      ? { id: flatLessons[currentIndex + 1].id, title: flatLessons[currentIndex + 1].title }
      : null;

  // 4. Fetch quiz attempts for this learner in this course
  const quizAttempts = await prisma.quizAttempt.findMany({
    where: {
      userId: session.id,
      quiz: { courseId: course.id },
    },
  });

  const quizStatusMap = new Map<string, { passed: boolean; scorePercent: number | null }>();
  for (const a of quizAttempts) {
    const existing = quizStatusMap.get(a.quizId);
    if (!existing || (a.passed && !existing.passed) || (a.scorePercent ?? 0) > (existing.scorePercent ?? 0)) {
      quizStatusMap.set(a.quizId, { passed: a.passed ?? false, scorePercent: a.scorePercent });
    }
  }

  // Format sections for player view
  const formattedSections = course.sections.map((s) => {
    const sectionQuiz = course.quizzes.find((q) => q.sectionId === s.id);
    const quizStatus = sectionQuiz ? quizStatusMap.get(sectionQuiz.id) : undefined;

    return {
      id: s.id,
      title: s.title,
      sortOrder: s.sortOrder,
      hasQuiz: s.hasQuiz,
      quiz: sectionQuiz
        ? {
            id: sectionQuiz.id,
            title: sectionQuiz.title,
            type: sectionQuiz.type as "IN_COURSE" | "FINAL",
            sectionId: sectionQuiz.sectionId,
            passed: quizStatus?.passed ?? false,
            scorePercent: quizStatus?.scorePercent ?? null,
          }
        : null,
      lessons: s.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        mediaType: l.mediaType as "video" | "pdf" | "text",
        durationMinutes: l.durationMinutes,
        textContent: l.textContent,
        contentUrl: l.contentUrl,
        sortOrder: l.sortOrder,
        completed: completedSet.has(l.id),
      })),
    };
  });

  const finalExamQuiz = course.quizzes.find((q) => q.type === "FINAL");
  const finalExamStatus = finalExamQuiz ? quizStatusMap.get(finalExamQuiz.id) : undefined;
  const finalQuizSummary = finalExamQuiz
    ? {
        id: finalExamQuiz.id,
        title: finalExamQuiz.title,
        type: finalExamQuiz.type as "IN_COURSE" | "FINAL",
        passed: finalExamStatus?.passed ?? false,
        scorePercent: finalExamStatus?.scorePercent ?? null,
      }
    : null;

  const currentLessonFormatted = {
    id: currentLessonData.id,
    title: currentLessonData.title,
    mediaType: currentLessonData.mediaType as "video" | "pdf" | "text",
    durationMinutes: currentLessonData.durationMinutes,
    textContent: currentLessonData.textContent,
    contentUrl: currentLessonData.contentUrl,
    sortOrder: currentLessonData.sortOrder,
    completed: completedSet.has(currentLessonData.id),
    trainingSteps: (currentLessonData as any).trainingSteps?.map((st: any) => ({
      id: st.id,
      stepNumber: st.stepNumber,
      title: st.title,
      instruction: st.instruction,
      actionType: st.actionType,
      uiElementTarget: st.uiElementTarget,
      screenshotUrl: st.screenshotUrl,
      verificationBadge: st.verificationBadge,
      disclaimer: st.disclaimer,
      sortOrder: st.sortOrder,
    })) || [],
  };

  return (
    <CoursePlayerView
      locale={locale}
      course={{
        id: course.id,
        title: course.title,
        slug: course.slug,
        sections: formattedSections,
      }}
      currentLesson={currentLessonFormatted}
      currentSection={{
        id: currentSectionData.id,
        title: currentSectionData.title,
        sortOrder: currentSectionData.sortOrder,
        hasQuiz: currentSectionData.hasQuiz,
        lessons: formattedSections.find((s) => s.id === currentSectionData.id)!.lessons,
      }}
      prevLesson={prevLesson}
      nextLesson={nextLesson}
      initialProgressPct={Math.round(enrollment.progressPct)}
      finalQuiz={finalQuizSummary}
      requiredContentPercent={course.requiredContentPercent}
    />
  );
}
