import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where: any = {};
  if (status) {
    where.status = status;
  }

  const campaigns = await prisma.newsletterCampaign.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      _count: { select: { recipients: true } },
    },
  });

  return NextResponse.json({ campaigns });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, subject, previewText, description, body: contentBody, audienceDefinition, deliveryChannel = "EMAIL", scheduledAt } = body;

    if (!title?.trim() || !subject?.trim() || !contentBody?.trim()) {
      return NextResponse.json({ error: "Title, subject, and body are required." }, { status: 400 });
    }

    const campaign = await prisma.newsletterCampaign.create({
      data: {
        title: title.trim(),
        subject: subject.trim(),
        previewText: previewText?.trim() || null,
        description: description?.trim() || null,
        body: contentBody.trim(),
        audienceDefinition: audienceDefinition || { sendToAll: true },
        deliveryChannel,
        status: scheduledAt ? "SCHEDULED" : "DRAFT",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        createdBy: session.id,
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err: any) {
    console.error("Failed to create newsletter campaign:", err);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
