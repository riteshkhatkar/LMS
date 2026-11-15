import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PublishStatus, LearnerGroup } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "INSTRUCTOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const audience = searchParams.get("audience");

  const where: any = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status && Object.values(PublishStatus).includes(status as any)) {
    where.publishStatus = status as PublishStatus;
  }

  if (category) {
    where.category = category;
  }

  if (audience && Object.values(LearnerGroup).includes(audience as any)) {
    where.audiences = {
      some: { learnerGroup: audience as LearnerGroup },
    };
  }

  const courses = await prisma.course.findMany({
    where,
    include: {
      courseCategory: true,
      instructor: {
        select: { id: true, name: true, email: true },
      },
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
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
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
      instructorName,
      instructorId,
      isRestricted = false,
      audiences = [],
      publishStatus = "draft",
    } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: "Course title and slug are required" }, { status: 400 });
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
        instructorName: instructorName || session.email,
        instructorTitle: "Course Instructor",
        instructorBio: "Experienced institutional trainer.",
        instructorId: instructorId || session.userId,
        isRestricted: Boolean(isRestricted),
        publishStatus: publishStatus as PublishStatus,
        audiences: {
          create: audiences
            .filter((g: string) => Object.values(LearnerGroup).includes(g as any))
            .map((g: LearnerGroup) => ({ learnerGroup: g })),
        },
        gradingRules: {
          create: {
            version: 1,
            passThreshold: 60.0,
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
        action: "COURSE_CREATED",
        target: course.title,
        details: { courseId: course.id, slug: course.slug },
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
