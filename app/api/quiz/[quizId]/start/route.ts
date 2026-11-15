import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { checkQuizAccess, sanitizeQuestionsForLearner } from "@/lib/assessment/permissions";
import { QuizAttemptStatus } from "@prisma/client";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await context.params;
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // 1. Permission & Access Checks
    const access = await checkQuizAccess(user, quizId);
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.message || "Access denied", reason: access.reason },
        { status: 403 }
      );
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        course: {
          include: {
            gradingRules: {
              where: { isActive: true },
              orderBy: { version: "desc" },
              take: 1,
            },
          },
        },
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
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const now = new Date();

    // 2. Check for active resumable attempt
    let attempt = access.activeAttemptId
      ? await prisma.quizAttempt.findUnique({
          where: { id: access.activeAttemptId },
          include: { answers: true },
        })
      : null;

    // 3. If no active attempt, create a new one
    if (!attempt) {
      const pastAttemptsCount = await prisma.quizAttempt.count({
        where: {
          userId: user.id,
          quizId: quiz.id,
          status: { in: [QuizAttemptStatus.SUBMITTED, QuizAttemptStatus.EXPIRED] },
        },
      });

      const attemptNum = pastAttemptsCount + 1;
      const gradingVersion = quiz.course.gradingRules[0]?.version ?? 1;

      const expiresAt = quiz.timeLimitSec
        ? new Date(now.getTime() + quiz.timeLimitSec * 1000)
        : null;

      attempt = await prisma.quizAttempt.create({
        data: {
          userId: user.id,
          quizId: quiz.id,
          status: QuizAttemptStatus.IN_PROGRESS,
          attemptNum,
          gradingRuleVersion: gradingVersion,
          startedAt: now,
          expiresAt,
        },
        include: { answers: true },
      });
    }

    // Calculate remaining seconds
    let remainingSeconds: number | null = null;
    if (attempt.expiresAt) {
      const remainingMs = attempt.expiresAt.getTime() - Date.now();
      remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    }

    // Map existing answers
    const answersMap: Record<string, string> = {};
    for (const ans of attempt.answers) {
      if (ans.selectedOptionId) {
        answersMap[ans.questionId] = ans.selectedOptionId;
      }
    }

    // Strip answers and explanations
    const sanitizedQuestions = sanitizeQuestionsForLearner(quiz.questions, false);

    return NextResponse.json({
      attemptId: attempt.id,
      attemptNum: attempt.attemptNum,
      maxAttempts: quiz.maxAttempts,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        type: quiz.type,
        passingPercent: quiz.passingPercent,
        timeLimitSec: quiz.timeLimitSec,
        courseId: quiz.courseId,
        courseTitle: quiz.course.title,
      },
      questions: sanitizedQuestions,
      answers: answersMap,
      expiresAt: attempt.expiresAt,
      remainingSeconds,
    });
  } catch (error) {
    console.error("Start quiz error:", error);
    return NextResponse.json({ error: "Failed to initialize quiz attempt" }, { status: 500 });
  }
}
