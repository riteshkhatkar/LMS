import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Administrator authorization required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};
    if (courseId) {
      where.courseId = courseId;
    }
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { course: { title: { contains: search, mode: "insensitive" } } },
      ];
    }

    const certificates = await prisma.certificate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            learnerGroup: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        events: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    return NextResponse.json({ certificates });
  } catch (error) {
    console.error("Admin fetch certificates error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
