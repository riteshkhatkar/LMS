import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const campaign = await prisma.newsletterCampaign.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      recipients: {
        take: 50,
        orderBy: { deliveredAt: "desc" },
        select: {
          id: true,
          email: true,
          deliveryChannel: true,
          deliveryStatus: true,
          deliveredAt: true,
          attemptCount: true,
          errorCategory: true,
        },
      },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // Aggregate delivery status counts
  const statusCounts = await prisma.newsletterRecipient.groupBy({
    by: ["deliveryStatus"],
    where: { campaignId: id },
    _count: true,
  });

  return NextResponse.json({
    campaign,
    statusCounts: statusCounts.reduce((acc, curr) => {
      acc[curr.deliveryStatus] = curr._count;
      return acc;
    }, {} as Record<string, number>),
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.newsletterCampaign.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (existing.status === "COMPLETED" || existing.status === "PROCESSING") {
    return NextResponse.json({ error: "Cannot edit an already sent or processing campaign" }, { status: 400 });
  }

  try {
    const data = await req.json();
    const updated = await prisma.newsletterCampaign.update({
      where: { id },
      data: {
        title: data.title?.trim() ?? existing.title,
        subject: data.subject?.trim() ?? existing.subject,
        previewText: data.previewText !== undefined ? data.previewText?.trim() || null : existing.previewText,
        description: data.description !== undefined ? data.description?.trim() || null : existing.description,
        body: data.body?.trim() ?? existing.body,
        audienceDefinition: data.audienceDefinition ?? existing.audienceDefinition,
        deliveryChannel: data.deliveryChannel ?? existing.deliveryChannel,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : existing.scheduledAt,
      },
    });

    return NextResponse.json({ campaign: updated });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.newsletterCampaign.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (existing.status === "PROCESSING") {
    return NextResponse.json({ error: "Cannot delete a campaign that is currently processing" }, { status: 400 });
  }

  await prisma.newsletterCampaign.delete({ where: { id } });
  return NextResponse.json({ success: true, message: "Campaign deleted successfully" });
}
