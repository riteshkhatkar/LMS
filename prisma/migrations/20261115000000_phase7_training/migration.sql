-- CreateEnum
CREATE TYPE "TrainingProgrammeStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentVerificationStatus" AS ENUM ('DEMO', 'VERIFIED', 'PENDING_REVIEW');

-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN     "programmeId" TEXT;

-- AlterTable
ALTER TABLE "CertificateEligibility" ADD COLUMN     "programmeId" TEXT;

-- CreateTable
CREATE TABLE "TrainingProgramme" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetGroup" "LearnerGroup",
    "organizationId" TEXT,
    "status" "TrainingProgrammeStatus" NOT NULL DEFAULT 'DRAFT',
    "estimatedDurationMinutes" INTEGER NOT NULL DEFAULT 120,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isRestricted" BOOLEAN NOT NULL DEFAULT false,
    "certificateEnabled" BOOLEAN NOT NULL DEFAULT true,
    "passingScorePercent" DOUBLE PRECISION NOT NULL DEFAULT 60.0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingProgramme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingProgrammeCourse" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingProgrammeCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingProgrammeAssignment" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT,
    "learnerGroup" "LearnerGroup",
    "assignedBy" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "TrainingProgrammeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingStep" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "actionType" TEXT,
    "uiElementTarget" TEXT,
    "screenshotUrl" TEXT,
    "verificationBadge" "ContentVerificationStatus" NOT NULL DEFAULT 'DEMO',
    "disclaimer" TEXT NOT NULL DEFAULT 'Demonstration content — pending application-specific verification',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainingProgramme_slug_key" ON "TrainingProgramme"("slug");

-- CreateIndex
CREATE INDEX "TrainingProgramme_targetGroup_idx" ON "TrainingProgramme"("targetGroup");

-- CreateIndex
CREATE INDEX "TrainingProgramme_organizationId_idx" ON "TrainingProgramme"("organizationId");

-- CreateIndex
CREATE INDEX "TrainingProgramme_status_idx" ON "TrainingProgramme"("status");

-- CreateIndex
CREATE INDEX "TrainingProgramme_isRestricted_idx" ON "TrainingProgramme"("isRestricted");

-- CreateIndex
CREATE INDEX "TrainingProgrammeCourse_programmeId_idx" ON "TrainingProgrammeCourse"("programmeId");

-- CreateIndex
CREATE INDEX "TrainingProgrammeCourse_courseId_idx" ON "TrainingProgrammeCourse"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingProgrammeCourse_programmeId_courseId_key" ON "TrainingProgrammeCourse"("programmeId", "courseId");

-- CreateIndex
CREATE INDEX "TrainingProgrammeAssignment_programmeId_idx" ON "TrainingProgrammeAssignment"("programmeId");

-- CreateIndex
CREATE INDEX "TrainingProgrammeAssignment_userId_idx" ON "TrainingProgrammeAssignment"("userId");

-- CreateIndex
CREATE INDEX "TrainingProgrammeAssignment_organizationId_idx" ON "TrainingProgrammeAssignment"("organizationId");

-- CreateIndex
CREATE INDEX "TrainingProgrammeAssignment_learnerGroup_idx" ON "TrainingProgrammeAssignment"("learnerGroup");

-- CreateIndex
CREATE INDEX "TrainingProgrammeAssignment_status_idx" ON "TrainingProgrammeAssignment"("status");

-- CreateIndex
CREATE INDEX "TrainingStep_lessonId_idx" ON "TrainingStep"("lessonId");

-- CreateIndex
CREATE INDEX "TrainingStep_stepNumber_idx" ON "TrainingStep"("stepNumber");

-- CreateIndex
CREATE INDEX "Certificate_programmeId_idx" ON "Certificate"("programmeId");

-- CreateIndex
CREATE INDEX "CertificateEligibility_programmeId_idx" ON "CertificateEligibility"("programmeId");

-- AddForeignKey
ALTER TABLE "CertificateEligibility" ADD CONSTRAINT "CertificateEligibility_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "TrainingProgramme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "TrainingProgramme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgramme" ADD CONSTRAINT "TrainingProgramme_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgrammeCourse" ADD CONSTRAINT "TrainingProgrammeCourse_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "TrainingProgramme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgrammeCourse" ADD CONSTRAINT "TrainingProgrammeCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgrammeAssignment" ADD CONSTRAINT "TrainingProgrammeAssignment_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "TrainingProgramme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgrammeAssignment" ADD CONSTRAINT "TrainingProgrammeAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgrammeAssignment" ADD CONSTRAINT "TrainingProgrammeAssignment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingStep" ADD CONSTRAINT "TrainingStep_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
