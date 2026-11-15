import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { LessonMediaType } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== "INSTRUCTOR" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { courseId } = await params;
  const course = await prisma.course.findFirst({
    where: { OR: [{ id: courseId }, { slug: courseId }] },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            orderBy: { sortOrder: "asc" },
            include: { resources: true },
          },
          quizzes: true,
        },
      },
    },
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  return NextResponse.json({ sections: course.sections });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== "INSTRUCTOR" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { courseId } = await params;
  const course = await prisma.course.findFirst({
    where: { OR: [{ id: courseId }, { slug: courseId }] },
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  if (session.role !== "ADMIN" && course.instructorId && course.instructorId !== session.userId) {
    return NextResponse.json({ error: "Forbidden: You cannot modify another instructor's course" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      action,
      sectionId,
      title,
      mediaType,
      type,
      textContent,
      content,
      contentUrl,
      durationMinutes,
      isPreview,
      sortOrder,
      passingPercent,
      timeLimitSec,
    } = body;

    const normAction = String(action || "").toUpperCase();

    if (normAction === "ADD_SECTION" || normAction === "CREATE_SECTION") {
      if (!title) {
        return NextResponse.json({ error: "Section title is required" }, { status: 400 });
      }

      const count = await prisma.section.count({ where: { courseId: course.id } });
      const section = await prisma.section.create({
        data: {
          courseId: course.id,
          title: title.trim(),
          sortOrder: sortOrder !== undefined ? Number(sortOrder) : count + 1,
        },
        include: { lessons: true },
      });

      return NextResponse.json({ success: true, id: section.id, section }, { status: 201 });
    }

    if (normAction === "ADD_LESSON" || normAction === "CREATE_LESSON") {
      let resolvedMediaType = (mediaType || type || "text").toString().toLowerCase();
      if (resolvedMediaType !== "video" && resolvedMediaType !== "pdf") {
        resolvedMediaType = "text";
      }

      if (!sectionId || !title) {
        return NextResponse.json({ error: "sectionId and title are required" }, { status: 400 });
      }

      const section = await prisma.section.findFirst({
        where: { id: sectionId, courseId: course.id },
      });

      if (!section) {
        return NextResponse.json({ error: "Section not found in this course" }, { status: 404 });
      }

      const count = await prisma.lesson.count({ where: { sectionId } });
      const lesson = await prisma.lesson.create({
        data: {
          sectionId,
          title: title.trim(),
          mediaType: resolvedMediaType as LessonMediaType,
          textContent: (textContent || content)?.trim() || null,
          contentUrl: contentUrl?.trim() || null,
          durationMinutes: durationMinutes ? Number(durationMinutes) : 5,
          isPreview: Boolean(isPreview),
          sortOrder: sortOrder !== undefined ? Number(sortOrder) : count + 1,
        },
      });

      return NextResponse.json({ success: true, id: lesson.id, lesson }, { status: 201 });
    }

    if (normAction === "ADD_FINAL_QUIZ" || normAction === "CREATE_FINAL_QUIZ") {
      const quiz = await prisma.quiz.create({
        data: {
          courseId: course.id,
          type: "FINAL",
          title: title ? title.trim() : "Final Comprehensive Examination",
          passingPercent: passingPercent !== undefined ? Number(passingPercent) : 70,
          timeLimitSec: timeLimitSec !== undefined ? Number(timeLimitSec) : 1800,
          maxAttempts: 5,
        },
      });

      return NextResponse.json({ success: true, id: quiz.id, quiz }, { status: 201 });
    }

    return NextResponse.json(
      { error: "Invalid action. Use ADD_SECTION, ADD_LESSON, or CREATE_FINAL_QUIZ." },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to add curriculum item" }, { status: 500 });
  }
}
