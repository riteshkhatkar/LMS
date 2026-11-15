import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { organizationId } = await params;
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, approveAll = false, reason = "Administrative credential verification" } = body;

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    let affectedCount = 0;

    if (userId) {
      // Approve specific user in org
      const user = await prisma.user.findFirst({
        where: { id: userId, organizationId },
      });
      if (!user) {
        return NextResponse.json({ error: "User not found in this organization" }, { status: 404 });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { isOrgVerified: true },
      });
      affectedCount = 1;

      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: "ORGANIZATION_MEMBERSHIP_VERIFIED",
          target: `${user.email} (${org.name})`,
          details: { verifiedUserId: user.id, organizationId: org.id, reason },
        },
      });
    } else if (approveAll) {
      // Bulk approve unverified members
      const updateRes = await prisma.user.updateMany({
        where: { organizationId, isOrgVerified: false },
        data: { isOrgVerified: true },
      });
      affectedCount = updateRes.count;

      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: "ORGANIZATION_BULK_MEMBERSHIP_VERIFIED",
          target: org.name,
          details: { organizationId: org.id, approvedCount: affectedCount, reason },
        },
      });
    } else {
      return NextResponse.json({ error: "Specify userId or approveAll: true" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      affectedCount,
      message: `Successfully verified ${affectedCount} organization member(s).`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to approve organization members" }, { status: 500 });
  }
}
