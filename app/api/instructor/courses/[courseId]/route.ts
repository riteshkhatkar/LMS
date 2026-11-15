import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PublishStatus, LearnerGroup, QuizType } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== "INSTRUCTOR" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden: Instructor access required" }, { status: 403 });
  }

  const { courseId } = await params;
  const course = await prisma.course.findFirst({
    where: { OR: [{ id: courseId }, { slug: courseId }] },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
        include: { lessons: { orderBy: { sortOrder: "asc" } } },
      },
      quizzes: {
        include: { questions: true },
      },
      audiences: true,
      courseCategory: true,
      gradingRules: { orderBy: { version: "desc" } },
    },
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  // Authorization check: instructor can only view own course, admin can view all
  if (session.role !== "ADMIN" && course.instructorId && course.instructorId !== session.userId) {
    return NextResponse.json({ error: "Forbidden: You are not authorized to manage this course" }, { status: 403 });
  }

  return NextResponse.json({ course });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== "INSTRUCTOR" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden: Instructor access required" }, { status: 403 });
  }

  const { courseId } = await params;
  try {
    const course = await prisma.course.findFirst({
      where: { OR: [{ id: courseId }, { slug: courseId }] },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (session.role !== "ADMIN" && course.instructorId && course.instructorId !== session.userId) {
      return NextResponse.json({ error: "Forbidden: You cannot modify another instructor's course" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      subtitle,
      description,
      category,
      categoryId,
      level,
      language,
      durationMinutes,
      thumbnail,
      isRestricted,
      publishStatus,
      audiences,
      requiredContentPercent,
      passingScorePercent,
      certificateAvailable,
    } = body;

    // Strict validation when publishing
    if (publishStatus === PublishStatus.published && course.publishStatus !== PublishStatus.published) {
      const sectionCount = await prisma.section.count({ where: { courseId: course.id } });
      const lessonCount = await prisma.lesson.count({
        where: { section: { courseId: course.id } },
      });

      if (sectionCount === 0 || lessonCount === 0) {
        return NextResponse.json(
          { error: "Validation failed: Course must contain at least one section and lesson before publishing." },
          { status: 400 }
        );
      }

      // Check if certification enabled, must have final assessment
      if (certificateAvailable ?? course.certificateAvailable) {
        const finalQuiz = await prisma.quiz.findFirst({
          where: { courseId: course.id, type: QuizType.FINAL },
        });
        if (!finalQuiz) {
          return NextResponse.json(
            { error: "Validation failed: A course with certification enabled must have a configured Final Assessment before publishing." },
            { status: 400 }
          );
        }
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (Array.isArray(audiences)) {
        await tx.courseAudience.deleteMany({ where: { courseId: course.id } });
        if (audiences.length > 0) {
          await tx.courseAudience.createMany({
            data: audiences
              .filter((g: string) => Object.values(LearnerGroup).includes(g as any))
              .map((g: LearnerGroup) => ({ courseId: course.id, learnerGroup: g })),
          });
        }
      }

      return await tx.course.update({
        where: { id: course.id },
        data: {
          title: title !== undefined ? title.trim() : undefined,
          subtitle: subtitle !== undefined ? subtitle.trim() : undefined,
          description: description !== undefined ? description.trim() : undefined,
          category: category !== undefined ? category : undefined,
          categoryId: categoryId !== undefined ? categoryId : undefined,
          level: level !== undefined ? level : undefined,
          language: language !== undefined ? language : undefined,
          durationMinutes: durationMinutes !== undefined ? Number(durationMinutes) : undefined,
          thumbnail: thumbnail !== undefined ? thumbnail : undefined,
          isRestricted: isRestricted !== undefined ? Boolean(isRestricted) : undefined,
          publishStatus: publishStatus !== undefined ? (publishStatus as PublishStatus) : undefined,
          publishedAt: publishStatus === PublishStatus.published && !course.publishedAt ? new Date() : undefined,
          requiredContentPercent: requiredContentPercent !== undefined ? Number(requiredContentPercent) : undefined,
          passingScorePercent: passingScorePercent !== undefined ? Number(passingScorePercent) : undefined,
          certificateAvailable: certificateAvailable !== undefined ? Boolean(certificateAvailable) : undefined,
        },
        include: {
          audiences: true,
          courseCategory: true,
        },
      });
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: publishStatus === PublishStatus.published ? "COURSE_PUBLISHED" : "COURSE_UPDATED",
        target: updated.title,
        details: { courseId: updated.id, author: session.email, publishStatus },
      },
    });

    return NextResponse.json({ success: true, course: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update course" }, { status: 500 });
  }
}
