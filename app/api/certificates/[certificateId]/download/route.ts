import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { generateCertificatePdf } from "@/lib/certification/pdf";
import { Role } from "@prisma/client";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ certificateId: string }> }
) {
  try {
    const { certificateId } = await context.params;
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: "Authentication required to download certificate" }, { status: 401 });
    }

    const cert = await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        course: true,
        user: true,
      },
    });

    if (!cert) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    // Role check: Only owner or Staff can download
    const isOwner = cert.userId === user.id;
    const isStaff = user.role === Role.ADMIN || user.role === Role.INSTRUCTOR;

    if (!isOwner && !isStaff) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Generate PDF on the server
    const pdfBuffer = await generateCertificatePdf({
      certificateId: cert.id,
      learnerName: cert.user.name || "Learner",
      courseTitle: cert.course.title,
      scorePercent: cert.scorePercent || 0,
      grade: cert.grade,
      provisional: cert.provisional,
      completedAt: cert.issueDate,
      issuerName: cert.issuer,
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    });

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${cert.id}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("PDF download error:", error);
    return NextResponse.json({ error: "Failed to generate certificate PDF" }, { status: 500 });
  }
}
