import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { revokeCertificate } from "@/lib/certification/issuance";
import { Role } from "@prisma/client";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ certificateId: string }> }
) {
  try {
    const { certificateId } = await context.params;
    const user = await getSession();

    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Administrator authorization required" }, { status: 403 });
    }

    const body = await request.json();
    const { reason } = body;

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json({ error: "An auditable revocation reason is required" }, { status: 400 });
    }

    const result = await revokeCertificate(certificateId, reason.trim(), {
      id: user.id,
      email: user.email,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Certificate revoked successfully",
      certificate: result.certificate,
    });
  } catch (error) {
    console.error("Admin revoke certificate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
