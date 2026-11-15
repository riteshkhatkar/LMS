-- Phase 8 Performance Indexes Optimization Migration
-- CreateIndex
CREATE INDEX IF NOT EXISTS "Enrollment_userId_isCompleted_idx" ON "Enrollment"("userId", "isCompleted");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Enrollment_courseId_isCompleted_idx" ON "Enrollment"("courseId", "isCompleted");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ActivityProgress_userId_completed_idx" ON "ActivityProgress"("userId", "completed");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizAttempt_userId_quizId_status_idx" ON "QuizAttempt"("userId", "quizId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizAttempt_status_createdAt_idx" ON "QuizAttempt"("status", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CertificateEligibility_userId_status_idx" ON "CertificateEligibility"("userId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Certificate_courseId_status_idx" ON "Certificate"("courseId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NewsletterRecipient_campaignId_deliveryStatus_idx" ON "NewsletterRecipient"("campaignId", "deliveryStatus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Message_threadId_createdAt_idx" ON "Message"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CourseAssignment_courseId_organizationId_status_idx" ON "CourseAssignment"("courseId", "organizationId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TrainingProgrammeAssignment_programmeId_learnerGroup_idx" ON "TrainingProgrammeAssignment"("programmeId", "learnerGroup");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TrainingProgrammeAssignment_programmeId_status_idx" ON "TrainingProgrammeAssignment"("programmeId", "status");
