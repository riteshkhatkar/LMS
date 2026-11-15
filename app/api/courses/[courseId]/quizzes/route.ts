import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { checkQuizAccess } from "@/lib/assessment/permissions";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await context.params;
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve course by id or slug
    const course = await prisma.course.findFirst({
      where: {
        OR: [{ id: courseId }, { slug: courseId }],
      },
      include: {
        quizzes: {
          where: { isPublished: true },
          orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
          include: {
            questions: {
              select: { id: true, points: true },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Fetch user's attempts across all quizzes in this course
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId: user.id,
        quiz: { courseId: course.id },
      },
      orderBy: { createdAt: "desc" },
    });

    // Check enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id,
        },
      },
    });

    const quizzesWithStatus = await Promise.all(
      course.quizzes.map(async (quiz) => {
        const quizAttempts = attempts.filter((a) => a.quizId === quiz.id);
        const access = await checkQuizAccess(user, quiz.id);

        const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
        const highestScore = quizAttempts
          .filter((a) => a.scorePercent !== null)
          .reduce((max, a) => Math.max(max, a.scorePercent ?? 0), 0);

        const passed = quizAttempts.some((a) => a.passed === true);

        return {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          type: quiz.type,
          sectionId: quiz.sectionId,
          passingPercent: quiz.passingPercent,
          timeLimitSec: quiz.timeLimitSec,
          maxAttempts: quiz.maxAttempts,
          questionCount: quiz.questions.length,
          totalPoints,
          attemptsUsed: quizAttempts.filter((a) => a.status !== "IN_PROGRESS").length,
          highestScore: quizAttempts.length > 0 ? highestScore : null,
          passed,
          access,
        };
      })
    );

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
        requiredContentPercent: course.requiredContentPercent,
        progressPct: enrollment?.progressPct ?? 0,
        isCompleted: enrollment?.isCompleted ?? false,
      },
      quizzes: quizzesWithStatus,
    });
  } catch (error) {
    console.error("Fetch quizzes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
