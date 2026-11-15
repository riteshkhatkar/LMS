import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { sanitizeMessageContent } from "@/lib/communication/moderation";
import { createNotification } from "@/lib/communication/notifications";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const courseId = searchParams.get("courseId");

  const where: any = {};
  if (type) where.type = type;
  if (courseId) where.courseId = courseId;

  if (session.role === "ADMIN") {
    // Admin has platform-wide oversight
  } else if (session.role === "INSTRUCTOR") {
    // Instructor sees participated threads or course QA for their courses
    where.OR = [
      { participants: { some: { userId: session.id } } },
      { course: { instructorId: session.id } },
    ];
  } else {
    // Learner only sees threads they participate in
    where.participants = { some: { userId: session.id } };
  }

  const threads = await prisma.messageThread.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      creator: { select: { id: true, name: true, role: true } },
      course: { select: { id: true, title: true, slug: true } },
      participants: {
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { id: true, body: true, createdAt: true, senderId: true },
      },
      _count: { select: { messages: true } },
    },
  });

  const formatted = threads.map((t) => {
    const userPart = t.participants.find((p) => p.userId === session.id);
    const lastMessage = t.messages[0] || null;
    const hasUnread = Boolean(
      lastMessage &&
      lastMessage.senderId !== session.id &&
      (!userPart?.lastReadAt || new Date(userPart.lastReadAt) < new Date(lastMessage.createdAt))
    );

    return {
      id: t.id,
      type: t.type,
      subject: t.subject,
      status: t.status,
      courseId: t.courseId,
      course: t.course,
      creator: t.creator,
      participants: t.participants.map((p) => ({
        userId: p.userId,
        name: p.user.name,
        role: p.user.role,
        lastReadAt: p.lastReadAt,
      })),
      messageCount: t._count.messages,
      lastMessage,
      hasUnread,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    };
  });

  return NextResponse.json({ threads: formatted });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { subject, type = "COURSE_QA", courseId, initialMessage } = body;

    const sanitizedSubject = sanitizeMessageContent(subject || "", 150);
    if (!sanitizedSubject.isValid) {
      return NextResponse.json({ error: sanitizedSubject.error || "Valid subject required." }, { status: 400 });
    }

    const sanitizedBody = sanitizeMessageContent(initialMessage || "", 3000);
    if (!sanitizedBody.isValid) {
      return NextResponse.json({ error: sanitizedBody.error || "Valid initial message required." }, { status: 400 });
    }

    // Determine initial participants
    const participantUserIds = new Set<string>([session.id]);

    if (type === "COURSE_QA" && courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { instructorId: true },
      });
      if (course?.instructorId) {
        participantUserIds.add(course.instructorId);
      }
    } else if (type === "SUPPORT") {
      // Add first active admin to participant list
      const admin = await prisma.user.findFirst({
        where: { role: "ADMIN", isActive: true },
        select: { id: true },
      });
      if (admin) {
        participantUserIds.add(admin.id);
      }
    }

    // Create thread and initial message in transaction
    const thread = await prisma.messageThread.create({
      data: {
        subject: sanitizedSubject.cleanText,
        type,
        courseId: courseId || null,
        status: "OPEN",
        createdBy: session.id,
        participants: {
          create: Array.from(participantUserIds).map((uId) => ({
            userId: uId,
            lastReadAt: uId === session.id ? new Date() : null,
          })),
        },
        messages: {
          create: {
            senderId: session.id,
            body: sanitizedBody.cleanText,
            moderationStatus: "APPROVED",
          },
        },
      },
      include: {
        participants: { include: { user: { select: { id: true, name: true } } } },
        messages: true,
      },
    });

    // Notify other participants
    for (const recipientId of participantUserIds) {
      if (recipientId !== session.id) {
        await createNotification(prisma, {
          userId: recipientId,
          eventType: "MESSAGE_RECEIVED",
          title: `New Discussion: ${sanitizedSubject.cleanText}`,
          body: sanitizedBody.cleanText.substring(0, 120),
          destination: `/learn/messages?thread=${thread.id}`,
          deduplicationKey: `notif_thread_${thread.id}_${recipientId}`,
        });
      }
    }

    return NextResponse.json({ thread }, { status: 201 });
  } catch (err: any) {
    console.error("Failed to create thread:", err);
    return NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
  }
}
