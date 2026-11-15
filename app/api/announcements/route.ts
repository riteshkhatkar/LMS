import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { LearnerGroup } from "@prisma/client";
import {
  broadcastCourseAnnouncement,
  broadcastPlatformAnnouncement,
} from "@/lib/communication/notifications";

export async function GET(req: NextRequest) {
  const session = await getSession();
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  const type = searchParams.get("type");

  const where: any = {
    status: "PUBLISHED",
  };

  if (courseId) {
    where.courseId = courseId;
  }
  if (type) {
    where.type = type;
  }

  // Confidentiality filtering
  if (!session) {
    // Unauthenticated public view
    where.isRestricted = false;
    where.targetGroup = null;
  } else if (session.role === "ADMIN") {
    // Admins see all
  } else if (session.role === "INSTRUCTOR") {
    // Instructors see platform announcements + their courses
  } else {
    // Learner: enforce cohort clearance
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { learnerGroup: true },
    });

    const isNaval = user?.learnerGroup === LearnerGroup.NAVAL_OFFICER;

    if (!isNaval) {
      // Civilian learners must NEVER see naval restricted announcements
      where.isRestricted = false;
      where.OR = [
        { targetGroup: null },
        { targetGroup: user?.learnerGroup || undefined },
      ];
    } else {
      // Naval officers can see general + naval restricted
      where.OR = [
        { targetGroup: null },
        { targetGroup: LearnerGroup.NAVAL_OFFICER },
      ];
    }
  }

  const announcements = await prisma.announcement.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    include: {
      author: { select: { id: true, name: true, role: true } },
      course: { select: { id: true, title: true, slug: true } },
      reads: session ? { where: { userId: session.id } } : false,
      _count: { select: { reads: true } },
    },
  });

  const formatted = announcements.map((a: any) => ({
    id: a.id,
    type: a.type,
    title: a.title,
    excerpt: a.excerpt,
    content: a.content,
    category: a.category,
    courseId: a.courseId,
    course: a.course,
    targetGroup: a.targetGroup,
    isRestricted: a.isRestricted,
    publishedAt: a.publishedAt,
    expiresAt: a.expiresAt,
    status: a.status,
    author: a.author,
    readCount: a._count.reads,
    isRead: session ? Boolean(a.reads && a.reads.length > 0) : false,
  }));

  return NextResponse.json({ announcements: formatted });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "INSTRUCTOR")) {
    return NextResponse.json({ error: "Forbidden: Admin or Instructor role required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      title,
      excerpt,
      content,
      type = "PLATFORM",
      category = "general",
      courseId,
      targetGroup,
      isRestricted = false,
      status = "PUBLISHED",
    } = body;

    if (!title?.trim() || !excerpt?.trim()) {
      return NextResponse.json({ error: "Title and excerpt are required." }, { status: 400 });
    }

    // Instructors can only post COURSE announcements to courses they instruct
    if (session.role === "INSTRUCTOR") {
      if (type !== "COURSE" || !courseId) {
        return NextResponse.json({ error: "Instructors can only create course announcements." }, { status: 403 });
      }

      const instructedCourse = await prisma.course.findFirst({
        where: {
          id: courseId,
          OR: [
            { instructorId: session.id },
            { instructorId: session.userId || undefined },
          ],
        },
      });
      if (!instructedCourse) {
        return NextResponse.json({ error: "You are not the designated instructor for this course." }, { status: 403 });
      }
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content?.trim() || null,
        type,
        category,
        courseId: courseId || null,
        targetGroup: targetGroup || null,
        isRestricted: Boolean(isRestricted),
        status,
        authorId: session.id,
      },
    });

    // Broadcast notifications to relevant learners
    if (status === "PUBLISHED") {
      if (announcement.type === "COURSE") {
        await broadcastCourseAnnouncement(prisma, announcement);
      } else {
        await broadcastPlatformAnnouncement(prisma, announcement);
      }
    }

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (err: any) {
    console.error("Failed to create announcement:", err);
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}
