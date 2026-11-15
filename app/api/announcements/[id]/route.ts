import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  const { id } = await params;

  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, role: true } },
      course: { select: { id: true, title: true, slug: true } },
    },
  });

  if (!announcement) {
    return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
  }

  // If user is authenticated, record read
  if (session) {
    await prisma.announcementRead.upsert({
      where: {
        announcementId_userId: {
          announcementId: id,
          userId: session.id,
        },
      },
      update: {},
      create: {
        announcementId: id,
        userId: session.id,
      },
    });
  }

  return NextResponse.json({ announcement });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "INSTRUCTOR")) {
    return NextResponse.json({ error: "Forbidden: Admin or Instructor access required" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
  }

  if (session.role === "INSTRUCTOR" && existing.authorId !== session.id) {
    return NextResponse.json({ error: "Forbidden: You can only edit your own announcements" }, { status: 403 });
  }

  const body = await req.json();
  const updated = await prisma.announcement.update({
    where: { id },
    data: {
      title: body.title?.trim() ?? existing.title,
      excerpt: body.excerpt?.trim() ?? existing.excerpt,
      content: body.content !== undefined ? body.content?.trim() || null : existing.content,
      status: body.status ?? existing.status,
      category: body.category ?? existing.category,
      isRestricted: body.isRestricted !== undefined ? Boolean(body.isRestricted) : existing.isRestricted,
    },
  });

  return NextResponse.json({ announcement: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "INSTRUCTOR")) {
    return NextResponse.json({ error: "Forbidden: Admin or Instructor access required" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
  }

  if (session.role === "INSTRUCTOR" && existing.authorId !== session.id) {
    return NextResponse.json({ error: "Forbidden: You can only delete your own announcements" }, { status: 403 });
  }

  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ success: true, message: "Announcement deleted" });
}
