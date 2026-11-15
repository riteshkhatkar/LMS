import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { issueCertificateForLearner } from "@/lib/certification/issuance";
import { Role } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, targetUserId } = body;

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    // Determine target learner: self or admin-specified user
    let recipientUserId = user.id;
    if (targetUserId && targetUserId !== user.id) {
      if (user.role !== Role.ADMIN) {
        return NextResponse.json(
          { error: "Administrator authorization required to issue certificates for other learners" },
          { status: 403 }
        );
      }
      recipientUserId = targetUserId;
    }

    const result = await issueCertificateForLearner(recipientUserId, courseId, {
      id: user.id,
      email: user.email,
      role: user.role,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      alreadyIssued: result.alreadyIssued,
      certificate: result.certificate,
    });
  } catch (error) {
    console.error("Certificate issuance API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
