import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { sanitizeMessageContent } from "@/lib/communication/moderation";
import { createNotification } from "@/lib/communication/notifications";

export async function POST(
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
      course: true,
      participants: true,
    },
  });

  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  if (thread.status === "CLOSED") {
    return NextResponse.json({ error: "Cannot send messages in a closed thread." }, { status: 400 });
  }

  const isParticipant = thread.participants.some((p) => p.userId === session.id);
  const isAdmin = session.role === "ADMIN";
  const isInstructor = session.role === "INSTRUCTOR" && thread.course?.instructorId === session.id;

  if (!isParticipant && !isAdmin && !isInstructor) {
    return NextResponse.json({ error: "Forbidden: Not permitted to reply to this thread" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { body: messageText } = body;

    const sanitized = sanitizeMessageContent(messageText || "", 3000);
    if (!sanitized.isValid) {
      return NextResponse.json({ error: sanitized.error || "Valid message body required." }, { status: 400 });
    }

    // Ensure sender is in participants
    await prisma.messageThreadParticipant.upsert({
      where: { threadId_userId: { threadId, userId: session.id } },
      update: { lastReadAt: new Date() },
      create: { threadId, userId: session.id, lastReadAt: new Date() },
    });

    const message = await prisma.message.create({
      data: {
        threadId,
        senderId: session.id,
        body: sanitized.cleanText,
        moderationStatus: "APPROVED",
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    });

    // Update thread updatedAt
    await prisma.messageThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });

    // Notify other thread participants
    for (const p of thread.participants) {
      if (p.userId !== session.id) {
        await createNotification(prisma, {
          userId: p.userId,
          eventType: "MESSAGE_RECEIVED",
          title: `Reply in: ${thread.subject}`,
          body: sanitized.cleanText.substring(0, 100),
          destination: `/learn/messages?thread=${thread.id}`,
          deduplicationKey: `notif_reply_${message.id}_${p.userId}`,
        });
      }
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (err: any) {
    console.error("Failed to post message:", err);
    return NextResponse.json({ error: "Failed to post message" }, { status: 500 });
  }
}
