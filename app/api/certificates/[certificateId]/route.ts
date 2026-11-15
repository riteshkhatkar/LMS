import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ certificateId: string }> }
) {
  try {
    const { certificateId } = await context.params;
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const cert = await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            learnerGroup: true,
          },
        },
        events: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!cert) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    // Role check: Only owner or Staff (Admin / Instructor) can view full private credential details
    const isOwner = cert.userId === user.id;
    const isStaff = user.role === Role.ADMIN || user.role === Role.INSTRUCTOR;

    if (!isOwner && !isStaff) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ certificate: cert });
  } catch (error) {
    console.error("Fetch certificate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
