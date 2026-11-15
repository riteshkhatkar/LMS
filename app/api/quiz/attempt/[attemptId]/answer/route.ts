import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { QuizAttemptStatus } from "@prisma/client";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await context.params;
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { questionId, selectedOptionId } = body;

    if (!questionId) {
      return NextResponse.json({ error: "questionId is required" }, { status: 400 });
    }

    // 1. Fetch attempt and verify ownership
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              where: { id: questionId },
              include: { options: true },
            },
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized access to another learner's attempt" },
        { status: 403 }
      );
    }

    // 2. Validate attempt status
    if (attempt.status !== QuizAttemptStatus.IN_PROGRESS) {
      return NextResponse.json(
        { error: `Cannot modify attempt in ${attempt.status} status` },
        { status: 400 }
      );
    }

    // 3. Check server-side timer expiration
    const now = new Date();
    if (attempt.expiresAt && now > attempt.expiresAt) {
      await prisma.quizAttempt.update({
        where: { id: attempt.id },
        data: { status: QuizAttemptStatus.EXPIRED },
      });
      return NextResponse.json(
        { error: "Assessment time has expired", status: QuizAttemptStatus.EXPIRED },
        { status: 403 }
      );
    }

    // 4. Validate question belongs to this quiz
    const question = attempt.quiz.questions[0];
    if (!question) {
      return NextResponse.json(
        { error: "Question does not belong to this assessment" },
        { status: 400 }
      );
    }

    // 5. Validate selected option belongs to question (if provided)
    if (selectedOptionId) {
      const validOption = question.options.some((opt) => opt.id === selectedOptionId);
      if (!validOption) {
        return NextResponse.json(
          { error: "Selected option is not valid for this question" },
          { status: 400 }
        );
      }
    }

    // 6. Upsert the answer
    await prisma.attemptAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId: attempt.id,
          questionId,
        },
      },
      update: {
        selectedOptionId: selectedOptionId || null,
        answeredAt: now,
      },
      create: {
        attemptId: attempt.id,
        questionId,
        selectedOptionId: selectedOptionId || null,
        answeredAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      questionId,
      selectedOptionId,
    });
  } catch (error) {
    console.error("Save answer error:", error);
    return NextResponse.json({ error: "Failed to record answer" }, { status: 500 });
  }
}
