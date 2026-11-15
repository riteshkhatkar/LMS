import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { generateUnsubscribeToken } from "@/lib/communication/audience";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  let subscription: any = null;

  if (token) {
    subscription = await prisma.newsletterSubscription.findUnique({
      where: { unsubscribeToken: token },
    });
  } else {
    const session = await getSession();
    if (session) {
      subscription = await prisma.newsletterSubscription.findFirst({
        where: { OR: [{ userId: session.id }, { email: session.email }] },
      });

      if (!subscription) {
        // Create initial default subscription record for the logged in user
        const newToken = generateUnsubscribeToken(session.email);
        subscription = await prisma.newsletterSubscription.create({
          data: {
            email: session.email,
            userId: session.id,
            unsubscribeToken: newToken,
            consentSource: "LEARNER_DASHBOARD",
          },
        });
      }
    }
  }

  if (!subscription) {
    return NextResponse.json({ error: "Subscription record not found" }, { status: 404 });
  }

  return NextResponse.json({
    subscription: {
      email: subscription.email,
      isSubscribed: subscription.isSubscribed,
      generalNews: subscription.generalNews,
      courseAlerts: subscription.courseAlerts,
      trainingAnnouncements: subscription.trainingAnnouncements,
      unsubscribeToken: subscription.unsubscribeToken,
      unsubscribedAt: subscription.unsubscribedAt,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, generalNews, courseAlerts, trainingAnnouncements, isSubscribed } = body;

    let targetId: string | null = null;

    if (token) {
      const existing = await prisma.newsletterSubscription.findUnique({
        where: { unsubscribeToken: token },
      });
      if (existing) targetId = existing.id;
    }

    if (!targetId) {
      const session = await getSession();
      if (session) {
        const existing = await prisma.newsletterSubscription.findFirst({
          where: { OR: [{ userId: session.id }, { email: session.email }] },
        });
        if (existing) targetId = existing.id;
      }
    }

    if (!targetId) {
      return NextResponse.json({ error: "Missing or invalid subscription token / authentication." }, { status: 400 });
    }

    const updated = await prisma.newsletterSubscription.update({
      where: { id: targetId },
      data: {
        isSubscribed: isSubscribed !== undefined ? Boolean(isSubscribed) : undefined,
        generalNews: generalNews !== undefined ? Boolean(generalNews) : undefined,
        courseAlerts: courseAlerts !== undefined ? Boolean(courseAlerts) : undefined,
        trainingAnnouncements: trainingAnnouncements !== undefined ? Boolean(trainingAnnouncements) : undefined,
        unsubscribedAt: isSubscribed === false ? new Date() : (isSubscribed === true ? null : undefined),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Preferences updated successfully.",
      subscription: {
        email: updated.email,
        isSubscribed: updated.isSubscribed,
        generalNews: updated.generalNews,
        courseAlerts: updated.courseAlerts,
        trainingAnnouncements: updated.trainingAnnouncements,
        unsubscribeToken: updated.unsubscribeToken,
        unsubscribedAt: updated.unsubscribedAt,
      },
    });
  } catch (err: any) {
    console.error("Failed to update preferences:", err);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
