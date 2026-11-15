import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PublishStatus, LearnerGroup } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "INSTRUCTOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        include: { questions: { include: { options: true } } },
      },
      audiences: true,
      courseCategory: true,
      instructor: { select: { id: true, name: true, email: true } },
      gradingRules: { orderBy: { version: "desc" } },
    },
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  return NextResponse.json({ course });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { courseId } = await params;
  try {
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
      instructorId,
    } = body;

    const course = await prisma.course.findFirst({
      where: { OR: [{ id: courseId }, { slug: courseId }] },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Validate publishing requirements if transitioning to published
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
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update audiences if supplied
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
          instructorId: instructorId !== undefined ? instructorId : undefined,
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
        action: "COURSE_UPDATED",
        target: updated.title,
        details: { courseId: updated.id, updates: body },
      },
    });

    return NextResponse.json({ success: true, course: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update course" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { courseId } = await params;
  try {
    const course = await prisma.course.findFirst({
      where: { OR: [{ id: courseId }, { slug: courseId }] },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Soft-archive to preserve enrollments and historical certificate data
    const archived = await prisma.course.update({
      where: { id: course.id },
      data: { publishStatus: PublishStatus.archived },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "COURSE_ARCHIVED",
        target: course.title,
        details: { courseId: course.id, reason: "Administrative course archival" },
      },
    });

    return NextResponse.json({ success: true, course: archived, message: "Course archived successfully." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to archive course" }, { status: 500 });
  }
}
