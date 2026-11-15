import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { checkQuizAccess, sanitizeQuestionsForLearner } from "@/lib/assessment/permissions";
import { QuizPlayerView } from "@/components/quiz/QuizPlayerView";
import { QuizResultView } from "@/components/quiz/QuizResultView";
import { Lock, ArrowLeft, BookOpen, AlertCircle, Award } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { QuizAttemptStatus, QuizType } from "@prisma/client";

interface Props {
  params: Promise<{
    locale: string;
    courseId: string;
    quizId: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { quizId } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { title: true },
  });

  return {
    title: quiz ? `${quiz.title} | Learn LMS` : "Assessment | Learn LMS",
    robots: { index: false, follow: false },
  };
}

export default async function QuizPage({ params }: Props) {
  const { locale, courseId, quizId } = await params;
  const session = await getSession();

  if (!session) {
    redirect(`/${locale}/login?redirect=/${locale}/learn/course/${courseId}/quiz/${quizId}`);
  }

  // 1. Resolve Course & Quiz
  const course = await prisma.course.findFirst({
    where: {
      OR: [{ id: courseId }, { slug: courseId }],
    },
    include: {
      gradingRules: {
        where: { isActive: true },
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  if (!course) {
    notFound();
  }

  const quiz = await prisma.quiz.findFirst({
    where: {
      id: quizId,
      courseId: course.id,
    },
    include: {
      questions: {
        orderBy: { sortOrder: "asc" },
        include: {
          options: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  if (!quiz) {
    notFound();
  }

  // 2. Check Assessment Access & Pre-requisite Locks
  const access = await checkQuizAccess(session, quiz.id);

  if (!access.allowed) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-[#1A1A2E]">Assessment Locked</h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            {access.message}
          </p>
        </div>

        {access.reason === "LOCKED_PROGRESS" && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 max-w-md mx-auto space-y-3 shadow-xs">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600">Learning Progress</span>
              <span className="text-[#3E9BDB] font-bold">
                {Math.round(access.currentProgressPercent ?? 0)}% / {access.requiredContentPercent}% Required
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#3E9BDB] h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      ((access.currentProgressPercent ?? 0) / (access.requiredContentPercent ?? 1)) * 100
                    )
                  )}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Please complete all mandatory lessons in the curriculum before attempting the final assessment.
            </p>
          </div>
        )}

        <div className="pt-2 flex justify-center gap-3">
          <Button as="a" href={`/${locale}/courses/${course.slug}`} variant="secondary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Course Overview
          </Button>
          <Button as="a" href={`/${locale}/learn/my-learning`} variant="primary" className="bg-[#3E9BDB]">
            <BookOpen className="h-4 w-4 mr-2" />
            My Learning
          </Button>
        </div>
      </div>
    );
  }

  // 3. Check for previous submitted attempt to show result (if no active in-progress attempt)
  if (!access.activeAttemptId) {
    const latestSubmittedAttempt = await prisma.quizAttempt.findFirst({
      where: {
        userId: session.id,
        quizId: quiz.id,
        status: { in: [QuizAttemptStatus.SUBMITTED, QuizAttemptStatus.EXPIRED] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        answers: true,
      },
    });

    // If max attempts reached and learner completed it, show result directly
    if (latestSubmittedAttempt && access.attemptsUsed && access.attemptsUsed >= quiz.maxAttempts) {
      const answerMap = new Map(latestSubmittedAttempt.answers.map((a) => [a.questionId, a]));

      const reviewQuestions = quiz.questions.map((q) => {
        const a = answerMap.get(q.id);
        return {
          id: q.id,
          prompt: q.prompt,
          points: q.points,
          explanation: q.explanation,
          selectedOptionId: a?.selectedOptionId || null,
          isCorrect: a?.isCorrect ?? false,
          pointsAwarded: a?.pointsAwarded ?? 0,
          options: q.options.map((opt) => ({
            id: opt.id,
            text: opt.text,
            isCorrect: opt.isCorrect,
          })),
        };
      });

      return (
        <QuizResultView
          locale={locale}
          result={{
            attemptId: latestSubmittedAttempt.id,
            quizId: quiz.id,
            quizTitle: quiz.title,
            quizType: quiz.type,
            courseId: course.id,
            courseTitle: course.title,
            scorePercent: latestSubmittedAttempt.scorePercent ?? 0,
            pointsEarned: latestSubmittedAttempt.pointsEarned ?? 0,
            totalPoints: latestSubmittedAttempt.totalPoints ?? 0,
            passed: latestSubmittedAttempt.passed ?? false,
            grade: latestSubmittedAttempt.grade,
            provisional: latestSubmittedAttempt.provisional,
            attemptNum: latestSubmittedAttempt.attemptNum,
            maxAttempts: quiz.maxAttempts,
            questions: reviewQuestions,
          }}
        />
      );
    }
  }

  // 4. Start or resume attempt
  const now = new Date();
  let attempt = access.activeAttemptId
    ? await prisma.quizAttempt.findUnique({
        where: { id: access.activeAttemptId },
        include: { answers: true },
      })
    : null;

  if (!attempt) {
    const pastCount = await prisma.quizAttempt.count({
      where: {
        userId: session.id,
        quizId: quiz.id,
        status: { in: [QuizAttemptStatus.SUBMITTED, QuizAttemptStatus.EXPIRED] },
      },
    });

    const expiresAt = quiz.timeLimitSec
      ? new Date(now.getTime() + quiz.timeLimitSec * 1000)
      : null;

    attempt = await prisma.quizAttempt.create({
      data: {
        userId: session.id,
        quizId: quiz.id,
        status: QuizAttemptStatus.IN_PROGRESS,
        attemptNum: pastCount + 1,
        gradingRuleVersion: course.gradingRules[0]?.version ?? 1,
        startedAt: now,
        expiresAt,
      },
      include: { answers: true },
    });
  }

  // Calculate remaining seconds
  let remainingSeconds: number | null = null;
  if (attempt.expiresAt) {
    const diff = attempt.expiresAt.getTime() - Date.now();
    remainingSeconds = Math.max(0, Math.floor(diff / 1000));
  }

  const initialAnswers: Record<string, string> = {};
  for (const a of attempt.answers) {
    if (a.selectedOptionId) {
      initialAnswers[a.questionId] = a.selectedOptionId;
    }
  }

  const sanitizedQuestions = sanitizeQuestionsForLearner(quiz.questions, false);

  return (
    <div className="py-8 bg-slate-50 min-h-[calc(100vh-160px)]">
      <QuizPlayerView
        locale={locale}
        attemptId={attempt.id}
        attemptNum={attempt.attemptNum}
        maxAttempts={quiz.maxAttempts}
        quiz={{
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          type: quiz.type,
          passingPercent: quiz.passingPercent,
          timeLimitSec: quiz.timeLimitSec,
          courseId: course.id,
          courseTitle: course.title,
        }}
        questions={sanitizedQuestions}
        initialAnswers={initialAnswers}
        initialRemainingSeconds={remainingSeconds}
      />
    </div>
  );
}
