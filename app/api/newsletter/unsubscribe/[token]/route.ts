import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const subscription = await prisma.newsletterSubscription.findUnique({
    where: { unsubscribeToken: token },
    select: {
      email: true,
      isSubscribed: true,
      unsubscribedAt: true,
    },
  });

  if (!subscription) {
    return NextResponse.json({ error: "Invalid unsubscribe token" }, { status: 404 });
  }

  return NextResponse.json({
    email: subscription.email,
    isSubscribed: subscription.isSubscribed,
    unsubscribedAt: subscription.unsubscribedAt,
  });
}

/**
 * RFC 8058 One-Click Unsubscribe Handler
 * An email client sends POST to this endpoint to immediately revoke subscription.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const subscription = await prisma.newsletterSubscription.findUnique({
    where: { unsubscribeToken: token },
  });

  if (!subscription) {
    return NextResponse.json({ error: "Invalid unsubscribe token" }, { status: 404 });
  }

  const updated = await prisma.newsletterSubscription.update({
    where: { id: subscription.id },
    data: {
      isSubscribed: false,
      unsubscribedAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    message: "You have been successfully unsubscribed from Learn LMS communications.",
    email: updated.email,
    isSubscribed: false,
    unsubscribedAt: updated.unsubscribedAt,
  });
}
