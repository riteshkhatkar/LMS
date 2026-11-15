import { NextRequest, NextResponse } from "next/server";
import { verifyCertificateById } from "@/lib/certification/verification";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ certificateId: string }> }
) {
  try {
    const { certificateId } = await context.params;
    const result = await verifyCertificateById(certificateId);
    return NextResponse.json({ result });
  } catch (error) {
    console.error("Verification API error:", error);
    return NextResponse.json(
      {
        result: {
          status: "VERIFY_ERROR",
          certificateId: "UNKNOWN",
          issuer: "ORELSE",
          ledgerMode: "mock",
          ledgerLabel: "Verification Temporarily Unavailable",
        },
      },
      { status: 500 }
    );
  }
}
