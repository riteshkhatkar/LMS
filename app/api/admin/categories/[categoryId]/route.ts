import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { categoryId } = await params;
  try {
    const body = await req.json();
    const { name, description, sortOrder, isActive } = body;

    const existing = await prisma.courseCategory.findUnique({ where: { id: categoryId } });
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const updated = await prisma.courseCategory.update({
      where: { id: categoryId },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        description: description !== undefined ? description?.trim() || null : undefined,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "CATEGORY_UPDATED",
        target: updated.name,
        details: { categoryId: updated.id, updates: body },
      },
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { categoryId } = await params;
  try {
    // Check if category has courses
    const courseCount = await prisma.course.count({ where: { categoryId } });
    if (courseCount > 0) {
      // Soft-deactivate to prevent breaking courses
      const deactivated = await prisma.courseCategory.update({
        where: { id: categoryId },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        message: `Category has ${courseCount} courses; deactivated rather than deleted.`,
        category: deactivated,
      });
    }

    await prisma.courseCategory.delete({ where: { id: categoryId } });
    return NextResponse.json({ success: true, deleted: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete category" }, { status: 500 });
  }
}
