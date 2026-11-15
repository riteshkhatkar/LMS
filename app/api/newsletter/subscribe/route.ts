import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateUnsubscribeToken } from "@/lib/communication/audience";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, generalNews = true, courseAlerts = true, trainingAnnouncements = true } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if registered user
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    const existingSub = await prisma.newsletterSubscription.findUnique({
      where: { email: normalizedEmail },
    });

    const token = existingSub?.unsubscribeToken || generateUnsubscribeToken(normalizedEmail);

    const subscription = await prisma.newsletterSubscription.upsert({
      where: { email: normalizedEmail },
      update: {
        isSubscribed: true,
        generalNews: Boolean(generalNews),
        courseAlerts: Boolean(courseAlerts),
        trainingAnnouncements: Boolean(trainingAnnouncements),
        unsubscribedAt: null,
      },
      create: {
        email: normalizedEmail,
        userId: existingUser?.id || null,
        isSubscribed: true,
        generalNews: Boolean(generalNews),
        courseAlerts: Boolean(courseAlerts),
        trainingAnnouncements: Boolean(trainingAnnouncements),
        unsubscribeToken: token,
        consentSource: "PUBLIC_PORTAL",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully subscribed to Learn LMS updates.",
      subscription: {
        email: subscription.email,
        isSubscribed: subscription.isSubscribed,
        generalNews: subscription.generalNews,
        courseAlerts: subscription.courseAlerts,
        trainingAnnouncements: subscription.trainingAnnouncements,
        unsubscribeToken: subscription.unsubscribeToken,
      },
    });
  } catch (err: any) {
    console.error("Subscription error:", err);
    return NextResponse.json({ error: "Failed to process subscription" }, { status: 500 });
  }
}
