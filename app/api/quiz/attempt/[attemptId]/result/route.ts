import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { Role, QuizAttemptStatus, QuizType } from "@prisma/client";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await context.params;
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            course: true,
            questions: {
              orderBy: { sortOrder: "asc" },
              include: {
                options: {
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    // Role and ownership check
    const isOwner = attempt.userId === user.id;
    const isStaff = user.role === Role.ADMIN || user.role === Role.INSTRUCTOR;

    if (!isOwner && !isStaff) {
      return NextResponse.json(
        { error: "Unauthorized access to assessment result" },
        { status: 403 }
      );
    }

    // Only completed or expired attempts have accessible results
    if (attempt.status === QuizAttemptStatus.IN_PROGRESS) {
      return NextResponse.json(
        { error: "Assessment is still in progress" },
        { status: 400 }
      );
    }

    const answerMap = new Map<string, { selectedOptionId: string | null; isCorrect: boolean | null; pointsAwarded: number | null }>();
    for (const ans of attempt.answers) {
      answerMap.set(ans.questionId, {
        selectedOptionId: ans.selectedOptionId,
        isCorrect: ans.isCorrect,
        pointsAwarded: ans.pointsAwarded,
      });
    }

    // Check certificate eligibility status if final assessment
    let certificateEligibility: {
      status: string;
      completedAt: Date;
    } | null = null;

    if (attempt.quiz.type === QuizType.FINAL && attempt.passed) {
      const eligibility = await prisma.certificateEligibility.findUnique({
        where: { attemptId: attempt.id },
      });
      if (eligibility) {
        certificateEligibility = {
          status: eligibility.status,
          completedAt: eligibility.completedAt,
        };
      }
    }

    // Prepare review questions with explanations and correct flags
    const reviewQuestions = attempt.quiz.questions.map((q) => {
      const userAns = answerMap.get(q.id);
      return {
        id: q.id,
        prompt: q.prompt,
        points: q.points,
        explanation: q.explanation,
        selectedOptionId: userAns?.selectedOptionId || null,
        isCorrect: userAns?.isCorrect ?? false,
        pointsAwarded: userAns?.pointsAwarded ?? 0,
        options: q.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          isCorrect: opt.isCorrect,
        })),
      };
    });

    return NextResponse.json({
      attemptId: attempt.id,
      quizId: attempt.quizId,
      quizTitle: attempt.quiz.title,
      quizType: attempt.quiz.type,
      courseId: attempt.quiz.courseId,
      courseTitle: attempt.quiz.course.title,
      status: attempt.status,
      attemptNum: attempt.attemptNum,
      maxAttempts: attempt.quiz.maxAttempts,
      scorePercent: attempt.scorePercent,
      pointsEarned: attempt.pointsEarned,
      totalPoints: attempt.totalPoints,
      passed: attempt.passed,
      grade: attempt.grade,
      provisional: attempt.provisional,
      gradingRuleVersion: attempt.gradingRuleVersion,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      questions: reviewQuestions,
      certificateEligibility,
    });
  } catch (error) {
    console.error("Fetch result error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve assessment result" },
      { status: 500 }
    );
  }
}
