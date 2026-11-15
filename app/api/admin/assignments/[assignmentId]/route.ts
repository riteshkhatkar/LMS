import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { assignmentId } = await params;
  try {
    const existing = await prisma.courseAssignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Update status to CANCELLED rather than deleting, preserving audit trail
    const updated = await prisma.courseAssignment.update({
      where: { id: assignmentId },
      data: { status: "CANCELLED" },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "COURSE_ASSIGNMENT_CANCELLED",
        target: existing.course.title,
        details: { assignmentId, courseId: existing.courseId },
      },
    });

    return NextResponse.json({ success: true, assignment: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to cancel assignment" }, { status: 500 });
  }
}
