import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "INSTRUCTOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizations = await prisma.organization.findMany({
    include: {
      _count: {
        select: {
          users: true,
          assignments: true,
        },
      },
      users: {
        select: {
          id: true,
          isOrgVerified: true,
          enrollments: {
            select: {
              progressPct: true,
              isCompleted: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Calculate training completion stats per organization
  const orgsWithStats = organizations.map((org) => {
    let totalEnrollments = 0;
    let completedEnrollments = 0;
    let totalProgress = 0;

    for (const u of org.users) {
      for (const e of u.enrollments) {
        totalEnrollments++;
        totalProgress += e.progressPct;
        if (e.isCompleted) completedEnrollments++;
      }
    }

    const verifiedMembers = org.users.filter((u) => u.isOrgVerified).length;
    const avgProgress = totalEnrollments > 0 ? Math.round(totalProgress / totalEnrollments) : 0;
    const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

    return {
      id: org.id,
      name: org.name,
      code: org.code,
      description: org.description,
      createdAt: org.createdAt,
      memberCount: org._count.users,
      verifiedMemberCount: verifiedMembers,
      assignmentCount: org._count.assignments,
      totalEnrollments,
      completedEnrollments,
      avgProgress,
      completionRate,
    };
  });

  return NextResponse.json({ organizations: orgsWithStats });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, code, description } = body;

    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required" }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().trim().replace(/[^A-Z0-9-]/g, "-");

    const org = await prisma.organization.create({
      data: {
        name: name.trim(),
        code: cleanCode,
        description: description?.trim() || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "ORGANIZATION_CREATED",
        target: org.name,
        details: { organizationId: org.id, code: org.code },
      },
    });

    return NextResponse.json({ success: true, organization: org }, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "An organization with this code already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message || "Failed to create organization" }, { status: 500 });
  }
}
