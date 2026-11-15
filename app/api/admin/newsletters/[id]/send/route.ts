import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getCommunicationDeliveryAdapter } from "@/lib/communication/delivery";
import { resolveAudienceRecipients, AudienceDefinition } from "@/lib/communication/audience";
import { createNotification } from "@/lib/communication/notifications";

export async function POST(
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
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (campaign.status === "COMPLETED" || campaign.status === "PROCESSING") {
    return NextResponse.json({ error: `Cannot send campaign with status '${campaign.status}'` }, { status: 400 });
  }

  // Mark PROCESSING
  await prisma.newsletterCampaign.update({
    where: { id },
    data: { status: "PROCESSING" },
  });

  try {
    const audience = campaign.audienceDefinition as AudienceDefinition;
    const recipients = await resolveAudienceRecipients(prisma, audience);

    if (recipients.length === 0) {
      await prisma.newsletterCampaign.update({
        where: { id },
        data: {
          status: "COMPLETED",
          recipientCount: 0,
          deliveredCount: 0,
          sentAt: new Date(),
        },
      });
      return NextResponse.json({
        success: true,
        message: "No eligible recipients matched the targeting criteria.",
        deliveredCount: 0,
      });
    }

    const adapter = getCommunicationDeliveryAdapter();
    const deliveryBatch = await adapter.sendNewsletterBatch(
      {
        id: campaign.id,
        title: campaign.title,
        subject: campaign.subject,
        body: campaign.body,
        senderName: campaign.senderName,
        senderEmail: campaign.senderEmail || undefined,
      },
      recipients
    );

    // Persist recipients in DB
    for (const r of deliveryBatch.results) {
      await prisma.newsletterRecipient.create({
        data: {
          campaignId: campaign.id,
          email: r.email,
          userId: r.userId || null,
          deliveryChannel: campaign.deliveryChannel,
          deliveryStatus: r.status,
          attemptCount: 1,
          deliveredAt: new Date(),
        },
      });

      // If IN_APP or BOTH is requested and user is registered, dispatch in-app notification
      if ((campaign.deliveryChannel === "IN_APP" || campaign.deliveryChannel === "BOTH") && r.userId) {
        await createNotification(prisma, {
          userId: r.userId,
          eventType: "PLATFORM_ANNOUNCEMENT",
          title: campaign.title,
          body: campaign.previewText || campaign.subject,
          destination: "/learn/notifications",
          deduplicationKey: `notif_newsletter_${campaign.id}_${r.userId}`,
        });
      }
    }

    const completedCampaign = await prisma.newsletterCampaign.update({
      where: { id },
      data: {
        status: "COMPLETED",
        recipientCount: deliveryBatch.total,
        deliveredCount: deliveryBatch.delivered,
        failedCount: deliveryBatch.failed,
        sentAt: new Date(),
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "NEWSLETTER_SENT",
        target: campaign.title,
        details: {
          campaignId: campaign.id,
          recipientCount: deliveryBatch.total,
          deliveredCount: deliveryBatch.delivered,
          deliveryChannel: campaign.deliveryChannel,
          adapter: adapter.name,
        },
      },
    });

    return NextResponse.json({
      success: true,
      campaign: completedCampaign,
      delivery: {
        total: deliveryBatch.total,
        delivered: deliveryBatch.delivered,
        failed: deliveryBatch.failed,
        adapter: adapter.name,
      },
    });
  } catch (err: any) {
    console.error("Failed to send campaign:", err);
    await prisma.newsletterCampaign.update({
      where: { id },
      data: { status: "FAILED" },
    });
    return NextResponse.json({ error: "Campaign dispatch failed" }, { status: 500 });
  }
}
