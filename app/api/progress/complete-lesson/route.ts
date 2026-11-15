import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { courseId, lessonId, timeSpentSeconds } = body;

    if (!courseId || !lessonId) {
      return NextResponse.json(
        { error: "courseId and lessonId are required" },
        { status: 400 }
      );
    }

    // 1. Resolve course by ID or slug
    const course = await prisma.course.findFirst({
      where: {
        OR: [{ id: courseId }, { slug: courseId }],
      },
      include: {
        sections: {
          orderBy: { sortOrder: "asc" },
          include: {
            lessons: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // 2. Resolve target lesson
    const allLessons = course.sections.flatMap((s) => s.lessons);
    const targetLesson =
      allLessons.find((l) => l.id === lessonId) ||
      allLessons[0];

    if (!targetLesson) {
      return NextResponse.json(
        { error: "No lessons available in course" },
        { status: 404 }
      );
    }

    // 3. Ensure enrollment exists (upsert)
    const enrollment = await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        courseId: course.id,
        progressPct: 0,
      },
    });

    // 4. Mark lesson activity as completed
    await prisma.activityProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: targetLesson.id,
        },
      },
      update: {
        completed: true,
        completedAt: new Date(),
        progressPct: 100,
      },
      create: {
        userId: user.id,
        lessonId: targetLesson.id,
        completed: true,
        completedAt: new Date(),
        progressPct: 100,
      },
    });

    // 5. Count total completed lessons in this course
    const allLessonIds = allLessons.map((l) => l.id);
    const completedProgresses = await prisma.activityProgress.findMany({
      where: {
        userId: user.id,
        lessonId: { in: allLessonIds },
        completed: true,
      },
    });

    const completedLessons = completedProgresses.length;
    const totalLessons = allLessonIds.length;
    const progressPct =
      totalLessons > 0
        ? Math.min(100, Math.round((completedLessons / totalLessons) * 100))
        : 0;

    // 6. Update enrollment progress percentage
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progressPct,
        completedAt: progressPct >= 100 ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      lessonId: targetLesson.id,
      completed: true,
      completedLessons,
      totalLessons,
      progressPct,
      progressPercentage: progressPct,
      isCompleted: progressPct >= 100,
    });
  } catch (error) {
    console.error("Complete lesson error:", error);
    return NextResponse.json(
      { error: "Failed to record lesson progress" },
      { status: 500 }
    );
  }
}
