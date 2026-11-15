import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to enrol" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    const course = await prisma.course.findFirst({
      where: {
        OR: [{ id: courseId }, { slug: courseId }],
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // Check existing enrollment to flag alreadyEnrolled
    const existing = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id,
        },
      },
    });

    // Upsert enrollment to guarantee idempotency and prevent duplicate records
    const enrollment =
      existing ||
      (await prisma.enrollment.create({
        data: {
          userId: user.id,
          courseId: course.id,
          progressPct: 0,
        },
      }));

    return NextResponse.json({
      success: true,
      enrollment,
      alreadyEnrolled: !!existing,
    });
  } catch (error) {
    console.error("Enrollment error:", error);
    return NextResponse.json(
      { error: "Failed to process course enrollment" },
      { status: 500 }
    );
  }
}
