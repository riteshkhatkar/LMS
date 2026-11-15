-- DropForeignKey
ALTER TABLE "CourseAnnouncement" DROP CONSTRAINT "CourseAnnouncement_courseId_fkey";

-- DropForeignKey
ALTER TABLE "NewsletterPreference" DROP CONSTRAINT "NewsletterPreference_userId_fkey";

-- DropForeignKey
ALTER TABLE "NewsletterRecipient" DROP CONSTRAINT "NewsletterRecipient_newsletterId_fkey";

-- DropIndex
DROP INDEX "NewsletterRecipient_newsletterId_idx";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "editedAt" TIMESTAMP(3),
ADD COLUMN     "moderationStatus" TEXT NOT NULL DEFAULT 'APPROVED';

-- AlterTable
ALTER TABLE "MessageThread" ADD COLUMN     "courseId" TEXT,
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'COURSE_QA';

-- AlterTable
ALTER TABLE "NewsletterRecipient" DROP COLUMN "newsletterId",
DROP COLUMN "sentAt",
DROP COLUMN "status",
ADD COLUMN     "attemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "campaignId" TEXT NOT NULL,
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "deliveryChannel" TEXT NOT NULL DEFAULT 'EMAIL',
ADD COLUMN     "deliveryStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "errorCategory" TEXT,
ADD COLUMN     "lastAttemptAt" TIMESTAMP(3),
ADD COLUMN     "userId" TEXT;

-- DropTable
DROP TABLE "CourseAnnouncement";

-- DropTable
DROP TABLE "Newsletter";

-- DropTable
DROP TABLE "NewsletterPreference";

-- CreateTable
CREATE TABLE "NewsletterCampaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "previewText" TEXT,
    "body" TEXT NOT NULL,
    "audienceDefinition" JSONB NOT NULL,
    "deliveryChannel" TEXT NOT NULL DEFAULT 'EMAIL',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "senderName" TEXT NOT NULL DEFAULT 'Learn LMS — ORELSE',
    "senderEmail" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscription" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "isSubscribed" BOOLEAN NOT NULL DEFAULT true,
    "generalNews" BOOLEAN NOT NULL DEFAULT true,
    "courseAlerts" BOOLEAN NOT NULL DEFAULT true,
    "trainingAnnouncements" BOOLEAN NOT NULL DEFAULT true,
    "unsubscribeToken" TEXT NOT NULL,
    "consentSource" TEXT NOT NULL DEFAULT 'PUBLIC_PORTAL',
    "consentTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PLATFORM',
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "courseId" TEXT,
    "targetGroup" "LearnerGroup",
    "isRestricted" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementRead" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementRead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "destination" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "deduplicationKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "courseUpdates" BOOLEAN NOT NULL DEFAULT true,
    "announcements" BOOLEAN NOT NULL DEFAULT true,
    "messages" BOOLEAN NOT NULL DEFAULT true,
    "assessmentAlerts" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewsletterCampaign_status_idx" ON "NewsletterCampaign"("status");

-- CreateIndex
CREATE INDEX "NewsletterCampaign_createdBy_idx" ON "NewsletterCampaign"("createdBy");

-- CreateIndex
CREATE INDEX "NewsletterCampaign_createdAt_idx" ON "NewsletterCampaign"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscription_email_key" ON "NewsletterSubscription"("email");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscription_userId_key" ON "NewsletterSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscription_unsubscribeToken_key" ON "NewsletterSubscription"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "NewsletterSubscription_email_idx" ON "NewsletterSubscription"("email");

-- CreateIndex
CREATE INDEX "NewsletterSubscription_unsubscribeToken_idx" ON "NewsletterSubscription"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "NewsletterSubscription_isSubscribed_idx" ON "NewsletterSubscription"("isSubscribed");

-- CreateIndex
CREATE INDEX "Announcement_type_idx" ON "Announcement"("type");

-- CreateIndex
CREATE INDEX "Announcement_courseId_idx" ON "Announcement"("courseId");

-- CreateIndex
CREATE INDEX "Announcement_targetGroup_idx" ON "Announcement"("targetGroup");

-- CreateIndex
CREATE INDEX "Announcement_status_idx" ON "Announcement"("status");

-- CreateIndex
CREATE INDEX "Announcement_publishedAt_idx" ON "Announcement"("publishedAt");

-- CreateIndex
CREATE INDEX "AnnouncementRead_announcementId_idx" ON "AnnouncementRead"("announcementId");

-- CreateIndex
CREATE INDEX "AnnouncementRead_userId_idx" ON "AnnouncementRead"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementRead_announcementId_userId_key" ON "AnnouncementRead"("announcementId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_deduplicationKey_key" ON "Notification"("deduplicationKey");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_eventType_idx" ON "Notification"("eventType");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "Message_moderationStatus_idx" ON "Message"("moderationStatus");

-- CreateIndex
CREATE INDEX "MessageThread_type_idx" ON "MessageThread"("type");

-- CreateIndex
CREATE INDEX "MessageThread_courseId_idx" ON "MessageThread"("courseId");

-- CreateIndex
CREATE INDEX "MessageThread_status_idx" ON "MessageThread"("status");

-- CreateIndex
CREATE INDEX "MessageThread_createdBy_idx" ON "MessageThread"("createdBy");

-- CreateIndex
CREATE INDEX "MessageThread_organizationId_idx" ON "MessageThread"("organizationId");

-- CreateIndex
CREATE INDEX "NewsletterRecipient_campaignId_idx" ON "NewsletterRecipient"("campaignId");

-- CreateIndex
CREATE INDEX "NewsletterRecipient_userId_idx" ON "NewsletterRecipient"("userId");

-- CreateIndex
CREATE INDEX "NewsletterRecipient_deliveryStatus_idx" ON "NewsletterRecipient"("deliveryStatus");

-- AddForeignKey
ALTER TABLE "NewsletterCampaign" ADD CONSTRAINT "NewsletterCampaign_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterRecipient" ADD CONSTRAINT "NewsletterRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "NewsletterCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterRecipient" ADD CONSTRAINT "NewsletterRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterSubscription" ADD CONSTRAINT "NewsletterSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageThread" ADD CONSTRAINT "MessageThread_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageThread" ADD CONSTRAINT "MessageThread_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageThread" ADD CONSTRAINT "MessageThread_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
