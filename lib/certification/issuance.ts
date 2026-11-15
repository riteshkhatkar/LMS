import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { buildSignedCredential } from "./credential";
import { getLedgerAdapter } from "./ledger";
import { CertificateStatus, LedgerMode } from "@prisma/client";

export interface IssueCertificateResult {
  success: boolean;
  certificate?: any;
  alreadyIssued?: boolean;
  error?: string;
}

/**
 * Generates an unpredictable, formatted certificate identifier.
 * Format:
 *   - Staging/Demo: LLMS-DEMO-2026-XXXX
 *   - Production:   LLMS-PROD-2026-XXXX
 * (where XXXX is 4-character hex)
 */
export function generateCertificateId(year: number = 2026, environment?: "production" | "demo"): string {
  const isProd = environment === "production" || process.env.CERTIFICATE_ENVIRONMENT === "production";
  const prefix = isProd ? "LLMS-PROD" : "LLMS-DEMO";
  const randomPart = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}-${year}-${randomPart}`;
}

/**
 * Issues an institutional digital certificate for an eligible learner.
 * Enforces server-side authority, idempotency, and cryptographic integrity.
 */
export async function issueCertificateForLearner(
  userId: string,
  courseId: string,
  actor?: { id: string; email?: string; role?: string }
): Promise<IssueCertificateResult> {
  // 1. Resolve Course (by id or slug)
  const course = await prisma.course.findFirst({
    where: {
      OR: [{ id: courseId }, { slug: courseId }],
    },
  });

  if (!course) {
    return { success: false, error: "Course not found" };
  }

  // 2. Query User
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { success: false, error: "Learner record not found" };
  }

  // 3. Query Enrollment & Progress
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: course.id,
      },
    },
  });

  if (!enrollment) {
    return { success: false, error: "Learner is not enrolled in this course" };
  }

  if (enrollment.progressPct < 100) {
    return {
      success: false,
      error: `Learner has not fulfilled all required learning activities (Current progress: ${Math.round(enrollment.progressPct)}%)`,
    };
  }

  // 4. Query Certificate Eligibility Record
  const eligibility = await prisma.certificateEligibility.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: course.id,
      },
    },
    include: {
      attempt: true,
    },
  });

  if (!eligibility) {
    return {
      success: false,
      error: "Learner has not satisfied assessment criteria for certificate eligibility",
    };
  }

  // 5. Idempotency Check: Existing Active Certificate
  const existingCert = await prisma.certificate.findFirst({
    where: {
      userId: user.id,
      courseId: course.id,
      status: CertificateStatus.VALID,
    },
  });

  if (existingCert) {
    return {
      success: true,
      alreadyIssued: true,
      certificate: existingCert,
    };
  }

  // 6. Build Signed Credential (W3C VC 2.0 / Open Badges 3.0)
  let certificateId = generateCertificateId();
  // Ensure ID collision avoidance
  while (await prisma.certificate.findUnique({ where: { id: certificateId } })) {
    certificateId = generateCertificateId();
  }

  const { credential, credentialHash, signature, keyId } = await buildSignedCredential({
    certificateId,
    learnerId: user.id,
    learnerName: user.name || "Learner",
    learnerGroup: user.learnerGroup,
    courseId: course.id,
    courseTitle: course.title,
    scorePercent: eligibility.finalScore,
    grade: eligibility.grade,
    provisional: eligibility.attempt.provisional,
    gradingRuleVersion: eligibility.gradingRuleVersion,
    completedAt: eligibility.completedAt,
  });

  // 7. Anchor Credential in Configured Ledger (MockLedger or EVM)
  const ledger = getLedgerAdapter();
  const anchorReceipt = await ledger.anchor(credentialHash, {
    certificateId,
    courseId: course.id,
    learnerId: user.id,
    issueDate: eligibility.completedAt,
    gradingRuleVersion: eligibility.gradingRuleVersion,
  });

  // 8. Persist in PostgreSQL atomically
  const result = await prisma.$transaction(async (tx) => {
    const cert = await tx.certificate.create({
      data: {
        id: certificateId,
        userId: user.id,
        courseId: course.id,
        eligibilityId: eligibility.id,
        status: CertificateStatus.VALID,
        issueDate: eligibility.completedAt,
        grade: eligibility.grade,
        outcome: "Pass",
        scorePercent: eligibility.finalScore,
        provisional: eligibility.attempt.provisional,
        gradingRuleVersion: eligibility.gradingRuleVersion,
        issuer: "ORELSE",
        issuerId: "ORELSE-DEMO-ISSUER-001",
        issuerUri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/issuer/orelse`,
        signedCredential: credential as any,
        credentialHash,
        signature,
        keyId,
        ledgerMode: anchorReceipt.ledgerMode as LedgerMode,
        ledgerLabel: anchorReceipt.ledgerLabel,
        txHash: anchorReceipt.txHash,
        blockNumber: anchorReceipt.blockNumber,
        anchorTimestamp: anchorReceipt.timestamp,
      },
    });

    // Update eligibility record status
    await tx.certificateEligibility.update({
      where: { id: eligibility.id },
      data: { status: "ISSUED" },
    });

    // Record audit event
    await tx.certificateEvent.create({
      data: {
        certificateId: cert.id,
        eventType: "ISSUED",
        actor: actor?.email || user.email,
        actorId: actor?.id || user.id,
        metadata: {
          ledgerMode: anchorReceipt.ledgerMode,
          txHash: anchorReceipt.txHash,
          blockNumber: anchorReceipt.blockNumber,
          score: eligibility.finalScore,
          grade: eligibility.grade,
        },
      },
    });

    return cert;
  });

  return {
    success: true,
    certificate: result,
  };
}

/**
 * Revokes an issued certificate with an auditable reason.
 */
export async function revokeCertificate(
  certificateId: string,
  reason: string,
  actor: { id: string; email?: string }
): Promise<{ success: boolean; certificate?: any; error?: string }> {
  const cert = await prisma.certificate.findUnique({
    where: { id: certificateId },
  });

  if (!cert) {
    return { success: false, error: "Certificate not found" };
  }

  if (cert.status === CertificateStatus.REVOKED) {
    return { success: false, error: "Certificate is already revoked" };
  }

  // Anchor revocation in configured ledger
  const ledger = getLedgerAdapter(cert.ledgerMode as any);
  if (cert.credentialHash) {
    await ledger.revoke(cert.credentialHash, reason);
  }

  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const c = await tx.certificate.update({
      where: { id: certificateId },
      data: {
        status: CertificateStatus.REVOKED,
        revokedAt: now,
        revocationReason: reason,
        revokedByUserId: actor.id,
      },
    });

    await tx.certificateEvent.create({
      data: {
        certificateId,
        eventType: "REVOKED",
        actor: actor.email || actor.id,
        actorId: actor.id,
        reason,
        metadata: {
          revokedAt: now.toISOString(),
          reason,
        },
      },
    });

    return c;
  });

  return { success: true, certificate: updated };
}

/**
 * Reissues a certificate, superseding the original credential while preserving historical records.
 */
export async function reissueCertificate(
  oldCertificateId: string,
  reason: string,
  actor: { id: string; email?: string }
): Promise<IssueCertificateResult> {
  const oldCert = await prisma.certificate.findUnique({
    where: { id: oldCertificateId },
  });

  if (!oldCert) {
    return { success: false, error: "Original certificate not found" };
  }

  // Revoke old certificate with SUPERSEDED status
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.certificate.update({
      where: { id: oldCertificateId },
      data: {
        status: CertificateStatus.SUPERSEDED,
        revokedAt: now,
        revocationReason: `Superseded: ${reason}`,
        revokedByUserId: actor.id,
      },
    });

    await tx.certificateEvent.create({
      data: {
        certificateId: oldCertificateId,
        eventType: "SUPERSEDED",
        actor: actor.email || actor.id,
        actorId: actor.id,
        reason,
      },
    });
  });

  // Issue new certificate
  const newCertResult = await issueCertificateForLearner(oldCert.userId, oldCert.courseId, actor);
  if (!newCertResult.success || !newCertResult.certificate) {
    return newCertResult;
  }

  // Link superseded relationship
  await prisma.certificate.update({
    where: { id: oldCertificateId },
    data: { supersededById: newCertResult.certificate.id },
  });

  await prisma.certificateEvent.create({
    data: {
      certificateId: newCertResult.certificate.id,
      eventType: "REISSUED",
      actor: actor.email || actor.id,
      actorId: actor.id,
      metadata: {
        supersedesCertificateId: oldCertificateId,
        reason,
      },
    },
  });

  return newCertResult;
}
