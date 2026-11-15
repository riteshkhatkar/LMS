import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId } = await params;
  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    include: {
      creator: { select: { id: true, name: true, role: true } },
      course: { select: { id: true, title: true, slug: true, instructorId: true } },
      participants: {
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: { id: true, name: true, role: true } },
        },
      },
    },
  });

  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  // Access check
  const isParticipant = thread.participants.some((p) => p.userId === session.id);
  const isAdmin = session.role === "ADMIN";
  const isInstructor = session.role === "INSTRUCTOR" && thread.course?.instructorId === session.id;

  if (!isParticipant && !isAdmin && !isInstructor) {
    return NextResponse.json({ error: "Forbidden: Not authorized to view this thread" }, { status: 403 });
  }

  // Update caller's lastReadAt
  if (isParticipant) {
    await prisma.messageThreadParticipant.updateMany({
      where: { threadId, userId: session.id },
      data: { lastReadAt: new Date() },
    });
  } else if (isAdmin || isInstructor) {
    // Auto-join as observer/participant
    await prisma.messageThreadParticipant.upsert({
      where: { threadId_userId: { threadId, userId: session.id } },
      update: { lastReadAt: new Date() },
      create: { threadId, userId: session.id, lastReadAt: new Date() },
    });
  }

  return NextResponse.json({ thread });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId } = await params;
  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    include: { course: true },
  });

  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const isCreator = thread.createdBy === session.id;
  const isAdmin = session.role === "ADMIN";
  const isCourseInstructor = session.role === "INSTRUCTOR" && thread.course?.instructorId === session.id;

  if (!isCreator && !isAdmin && !isCourseInstructor) {
    return NextResponse.json({ error: "Forbidden: Not permitted to modify thread status" }, { status: 403 });
  }

  const body = await req.json();
  const { status } = body;

  if (!["OPEN", "RESOLVED", "CLOSED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status value. Must be OPEN, RESOLVED, or CLOSED." }, { status: 400 });
  }

  const updated = await prisma.messageThread.update({
    where: { id: threadId },
    data: { status },
  });

  return NextResponse.json({ thread: updated });
}
