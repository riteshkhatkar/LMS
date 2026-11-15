import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Role, LearnerGroup } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const role = searchParams.get("role");
  const group = searchParams.get("group");
  const orgId = searchParams.get("organizationId");

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role && Object.values(Role).includes(role as any)) {
    where.role = role as Role;
  }

  if (group && Object.values(LearnerGroup).includes(group as any)) {
    where.learnerGroup = group as LearnerGroup;
  }

  if (orgId) {
    where.organizationId = orgId;
  }

  const users = await prisma.user.findMany({
    where,
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
      organization: {
        select: { id: true, name: true, code: true },
      },
      _count: {
        select: {
          enrollments: true,
          quizAttempts: true,
          certificates: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}
