import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let pref = await prisma.notificationPreference.findUnique({
    where: { userId: session.id },
  });

  if (!pref) {
    pref = await prisma.notificationPreference.create({
      data: {
        userId: session.id,
        inAppEnabled: true,
        emailEnabled: false,
        courseUpdates: true,
        announcements: true,
        messages: true,
        assessmentAlerts: true,
      },
    });
  }

  return NextResponse.json({ preferences: pref });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updated = await prisma.notificationPreference.upsert({
      where: { userId: session.id },
      update: {
        inAppEnabled: body.inAppEnabled !== undefined ? Boolean(body.inAppEnabled) : undefined,
        emailEnabled: body.emailEnabled !== undefined ? Boolean(body.emailEnabled) : undefined,
        courseUpdates: body.courseUpdates !== undefined ? Boolean(body.courseUpdates) : undefined,
        announcements: body.announcements !== undefined ? Boolean(body.announcements) : undefined,
        messages: body.messages !== undefined ? Boolean(body.messages) : undefined,
        assessmentAlerts: body.assessmentAlerts !== undefined ? Boolean(body.assessmentAlerts) : undefined,
      },
      create: {
        userId: session.id,
        inAppEnabled: body.inAppEnabled ?? true,
        emailEnabled: body.emailEnabled ?? false,
        courseUpdates: body.courseUpdates ?? true,
        announcements: body.announcements ?? true,
        messages: body.messages ?? true,
        assessmentAlerts: body.assessmentAlerts ?? true,
      },
    });

    return NextResponse.json({ preferences: updated });
  } catch (err: any) {
    console.error("Failed to update notification preferences:", err);
    return NextResponse.json({ error: "Failed to update notification preferences" }, { status: 500 });
  }
}
