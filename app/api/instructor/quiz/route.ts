import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { Role, QuizType } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user || (user.role !== Role.INSTRUCTOR && user.role !== Role.ADMIN)) {
      return NextResponse.json(
        { error: "Instructor or Administrator credentials required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      courseId,
      sectionId,
      title,
      description,
      type,
      passingPercent,
      timeLimitSec,
      maxAttempts,
      questions,
    } = body;

    if (!courseId || !title) {
      return NextResponse.json(
        { error: "courseId and title are required fields" },
        { status: 400 }
      );
    }

    // Verify course exists
    const course = await prisma.course.findFirst({
      where: {
        OR: [{ id: courseId }, { slug: courseId }],
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Validate questions payload if provided
    if (questions && Array.isArray(questions)) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.prompt || typeof q.prompt !== "string") {
          return NextResponse.json(
            { error: `Question ${i + 1} must include a prompt text.` },
            { status: 400 }
          );
        }
        if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
          return NextResponse.json(
            { error: `Question ${i + 1} must have at least 2 options.` },
            { status: 400 }
          );
        }
        const correctCount = q.options.filter((o: { isCorrect?: boolean }) => o.isCorrect).length;
        if (correctCount !== 1) {
          return NextResponse.json(
            { error: `Question ${i + 1} must have exactly one correct option marked.` },
            { status: 400 }
          );
        }
      }
    }

    const quizType = type === "FINAL" ? QuizType.FINAL : QuizType.IN_COURSE;

    // Create quiz with questions and options in an atomic transaction
    const newQuiz = await prisma.$transaction(async (tx) => {
      const createdQuiz = await tx.quiz.create({
        data: {
          courseId: course.id,
          sectionId: sectionId || null,
          title: title.trim(),
          description: description?.trim() || null,
          type: quizType,
          passingPercent: passingPercent ? Number(passingPercent) : 60,
          timeLimitSec: timeLimitSec ? Number(timeLimitSec) : null,
          maxAttempts: maxAttempts ? Number(maxAttempts) : 3,
          isPublished: true,
          isRequired: true,
        },
      });

      if (questions && Array.isArray(questions)) {
        for (let qIdx = 0; qIdx < questions.length; qIdx++) {
          const q = questions[qIdx];
          const createdQuestion = await tx.question.create({
            data: {
              quizId: createdQuiz.id,
              prompt: q.prompt.trim(),
              explanation: q.explanation?.trim() || null,
              sortOrder: qIdx,
              points: q.points ? Number(q.points) : 1,
            },
          });

          for (let oIdx = 0; oIdx < q.options.length; oIdx++) {
            const opt = q.options[oIdx];
            await tx.questionOption.create({
              data: {
                questionId: createdQuestion.id,
                text: opt.text.trim(),
                isCorrect: Boolean(opt.isCorrect),
                sortOrder: oIdx,
              },
            });
          }
        }
      }

      return createdQuiz;
    });

    return NextResponse.json({
      success: true,
      message: "Assessment authored and published successfully.",
      quiz: newQuiz,
    });
  } catch (error) {
    console.error("Create quiz error:", error);
    return NextResponse.json({ error: "Failed to author assessment" }, { status: 500 });
  }
}
