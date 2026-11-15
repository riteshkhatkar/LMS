import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Role, LearnerGroup } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      learnerGroup: true,
      organizationId: true,
      isOrgVerified: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      organization: true,
      enrollments: {
        include: {
          course: {
            select: { id: true, title: true, slug: true },
          },
        },
      },
      quizAttempts: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          quiz: {
            select: { id: true, title: true, type: true },
          },
        },
      },
      certificates: {
        orderBy: { createdAt: "desc" },
        include: {
          course: {
            select: { id: true, title: true },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { userId } = await params;
  try {
    const body = await req.json();
    const { role, isActive, isOrgVerified, organizationId, learnerGroup } = body;

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Role validation
    if (role && !Object.values(Role).includes(role as any)) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    // Protect sole administrator from being demoted
    if (existing.role === Role.ADMIN && role && role !== Role.ADMIN) {
      const adminCount = await prisma.user.count({ where: { role: Role.ADMIN, isActive: true } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot demote the sole active administrator account." },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        role: role !== undefined ? (role as Role) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        isOrgVerified: isOrgVerified !== undefined ? Boolean(isOrgVerified) : undefined,
        organizationId: organizationId !== undefined ? organizationId : undefined,
        learnerGroup: learnerGroup !== undefined ? (learnerGroup as LearnerGroup) : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        learnerGroup: true,
        organizationId: true,
        isOrgVerified: true,
        isActive: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: role && role !== existing.role ? "USER_ROLE_CHANGED" : "USER_UPDATED",
        target: updated.email,
        details: {
          targetUserId: updated.id,
          previousRole: existing.role,
          newRole: updated.role,
          isActive: updated.isActive,
          isOrgVerified: updated.isOrgVerified,
        },
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update user" }, { status: 500 });
  }
}
