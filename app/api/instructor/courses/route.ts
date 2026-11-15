import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PublishStatus, LearnerGroup } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "INSTRUCTOR" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden: Instructor access required" }, { status: 403 });
  }

  // Instructors see courses they instruct or are assigned to (Admins see all)
  const where: any = {};
  if (session.role !== "ADMIN") {
    where.OR = [
      { instructorId: session.userId },
      { instructorName: { contains: session.name || session.email, mode: "insensitive" } },
    ];
  }

  const courses = await prisma.course.findMany({
    where,
    include: {
      courseCategory: true,
      audiences: true,
      _count: {
        select: {
          sections: true,
          quizzes: true,
          enrollments: true,
          certificates: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ courses });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "INSTRUCTOR" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden: Instructor access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      title,
      subtitle,
      description,
      slug,
      category,
      categoryId,
      level = "beginner",
      language = "en",
      durationMinutes = 60,
      thumbnail = "/brand/course-default.jpg",
      isRestricted = false,
      audiences = [],
      requiredContentPercent = 80,
      finalQuizQuestions = 10,
      passingScorePercent = 60,
      certificateAvailable = true,
    } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: "Title and slug are required" }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-");

    const course = await prisma.course.create({
      data: {
        title: title.trim(),
        subtitle: subtitle?.trim() || title.trim(),
        excerpt: subtitle?.trim() || title.trim(),
        description: description?.trim() || title.trim(),
        slug: cleanSlug,
        category: category || "General",
        categoryId: categoryId || null,
        level,
        language,
        durationMinutes: Number(durationMinutes) || 60,
        thumbnail,
        instructorName: session.name || "Instructor",
        instructorTitle: "Course Instructor",
        instructorBio: "Verified course author and instructor.",
        instructorId: session.userId,
        isRestricted: Boolean(isRestricted),
        publishStatus: PublishStatus.draft,
        requiredContentPercent: Number(requiredContentPercent) || 80,
        finalQuizQuestions: Number(finalQuizQuestions) || 10,
        passingScorePercent: Number(passingScorePercent) || 60,
        certificateAvailable: Boolean(certificateAvailable),
        audiences: {
          create: audiences
            .filter((g: string) => Object.values(LearnerGroup).includes(g as any))
            .map((g: LearnerGroup) => ({ learnerGroup: g })),
        },
        gradingRules: {
          create: {
            version: 1,
            passThreshold: Number(passingScorePercent) || 60.0,
            gradeAThreshold: 90.0,
            gradeBMin: 70.0,
            gradeBMax: 75.0,
            isActive: true,
            isDefault: true,
          },
        },
      },
      include: {
        audiences: true,
        courseCategory: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "COURSE_DRAFT_CREATED",
        target: course.title,
        details: { courseId: course.id, slug: course.slug, author: session.email },
      },
    });

    return NextResponse.json({ success: true, course }, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "A course with this slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message || "Failed to create course" }, { status: 500 });
  }
}
