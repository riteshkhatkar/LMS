import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const announcement = await prisma.announcement.findUnique({
    where: { id },
  });

  if (!announcement) {
    return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
  }

  const readRecord = await prisma.announcementRead.upsert({
    where: {
      announcementId_userId: {
        announcementId: id,
        userId: session.id,
      },
    },
    update: { readAt: new Date() },
    create: {
      announcementId: id,
      userId: session.id,
    },
  });

  return NextResponse.json({ success: true, readRecord });
}
