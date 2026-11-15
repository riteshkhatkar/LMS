import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "INSTRUCTOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await prisma.courseCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: { courses: true },
      },
    },
  });

  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, slug, description, sortOrder } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-");

    const category = await prisma.courseCategory.create({
      data: {
        name: name.trim(),
        slug: cleanSlug,
        description: description?.trim() || null,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
        isActive: true,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "CATEGORY_CREATED",
        target: category.name,
        details: { categoryId: category.id, slug: category.slug },
      },
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "A category with this name or slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message || "Failed to create category" }, { status: 500 });
  }
}
