import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { generateNewsletterEmailHtml, buildRfc8058Headers } from "@/lib/communication/delivery";
import { resolveAudienceRecipients, AudienceDefinition } from "@/lib/communication/audience";

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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const audience = campaign.audienceDefinition as AudienceDefinition;
  const eligibleRecipients = await resolveAudienceRecipients(prisma, audience);

  const sampleRecipient = eligibleRecipients[0] || {
    email: session.email || "admin@learnlms.local",
    userId: session.id,
    name: "Preview Learner",
    unsubscribeToken: "preview_sample_unsubscribe_token_2026",
  };

  const { html, text } = generateNewsletterEmailHtml({
    subject: campaign.subject,
    body: campaign.body,
    recipient: sampleRecipient,
    siteUrl,
    senderName: campaign.senderName,
  });

  const rfc8058Headers = buildRfc8058Headers(sampleRecipient.unsubscribeToken, siteUrl);

  return NextResponse.json({
    preview: {
      campaignId: campaign.id,
      title: campaign.title,
      subject: campaign.subject,
      senderName: campaign.senderName,
      senderEmail: campaign.senderEmail || "noreply@learnlms.local",
      recipientEstimate: eligibleRecipients.length,
      sampleRecipient: {
        email: sampleRecipient.email,
        name: sampleRecipient.name,
      },
      rfc8058Headers,
      html,
      text,
    },
  });
}
