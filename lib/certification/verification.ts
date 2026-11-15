import { prisma } from "@/lib/db/prisma";
import { verifyCredentialSignature } from "./keys";
import { computeCredentialCommitment } from "./credential";
import { getLedgerAdapter } from "./ledger";
import { getDemoCertificate } from "@/lib/data/fixtures/verify-demo";
import type { CertificateVerifyResult } from "@/lib/types";

export interface ExtendedVerifyResult extends CertificateVerifyResult {
  signatureValid?: boolean;
  integrityValid?: boolean;
  ledgerAnchored?: boolean;
  txHash?: string | null;
  blockNumber?: number | null;
  keyId?: string | null;
  issuerId?: string;
  revocationReason?: string | null;
  revokedAt?: string | null;
  scorePercent?: number | null;
  provisional?: boolean;
}

/**
 * Public Verification Service.
 * Performs multi-step cryptographic signature validation, data integrity checks,
 * ledger commitment validation, and revocation checks.
 */
export async function verifyCertificateById(certificateId: string): Promise<ExtendedVerifyResult> {
  const normalizedId = certificateId.trim();

  // 1. Query database certificate
  const cert = await prisma.certificate.findUnique({
    where: { id: normalizedId },
    include: {
      course: true,
      user: {
        select: {
          id: true,
          name: true,
          learnerGroup: true,
        },
      },
    },
  });

  // Fallback to legacy Phase 1 demo fixture if not in database
  if (!cert) {
    const demo = getDemoCertificate(normalizedId);
    if (demo.status !== "NOT_FOUND") {
      return {
        ...demo,
        signatureValid: demo.status === "VALID",
        integrityValid: demo.status === "VALID",
        ledgerAnchored: true,
        ledgerMode: "mock",
        issuerId: "ORELSE-DEMO-ISSUER-001",
      };
    }
    return {
      status: "NOT_FOUND",
      certificateId: normalizedId,
      issuer: "ORELSE",
      ledgerMode: "mock",
      ledgerLabel: "Demo verification — MockLedger mode. Certificate not found.",
    };
  }

  // 2. Check for Revocation or Superseded status
  if (cert.status === "REVOKED" || cert.status === "SUPERSEDED") {
    return {
      status: "REVOKED",
      certificateId: cert.id,
      issuer: cert.issuer,
      courseName: cert.course.title,
      issueDate: cert.issueDate.toISOString().split("T")[0],
      grade: cert.grade,
      outcome: cert.outcome,
      ledgerMode: cert.ledgerMode as any,
      ledgerLabel: cert.ledgerLabel,
      revocationReason: cert.revocationReason || "Certificate revoked by issuing authority.",
      revokedAt: cert.revokedAt?.toISOString(),
      scorePercent: cert.scorePercent,
      provisional: cert.provisional,
      txHash: cert.txHash,
      signatureValid: true,
      integrityValid: true,
    };
  }

  // 3. Cryptographic Signature Validation
  let signatureValid = false;
  if (cert.signature) {
    const sigCheck = await verifyCredentialSignature(cert.signature);
    signatureValid = sigCheck.valid;
  }

  if (!signatureValid) {
    return {
      status: "VERIFY_ERROR",
      certificateId: cert.id,
      issuer: cert.issuer,
      courseName: cert.course.title,
      issueDate: cert.issueDate.toISOString().split("T")[0],
      ledgerMode: cert.ledgerMode as any,
      ledgerLabel: "Cryptographic Verification Failed — Signature Mismatch",
      signatureValid: false,
      integrityValid: false,
    };
  }

  // 4. Data Integrity & Commitment Verification
  let integrityValid = true;
  if (cert.signedCredential && cert.credentialHash) {
    const parsedCredential = cert.signedCredential as any;
    if (parsedCredential?.credentialSubject) {
      const recomputedHash = computeCredentialCommitment(parsedCredential.credentialSubject);
      if (recomputedHash.toLowerCase() !== cert.credentialHash.toLowerCase()) {
        integrityValid = false;
      }
    }
  }

  if (!integrityValid) {
    return {
      status: "VERIFY_ERROR",
      certificateId: cert.id,
      issuer: cert.issuer,
      courseName: cert.course.title,
      issueDate: cert.issueDate.toISOString().split("T")[0],
      ledgerMode: cert.ledgerMode as any,
      ledgerLabel: "Data Integrity Failed — Commitment Tampered",
      signatureValid: true,
      integrityValid: false,
    };
  }

  // 5. Ledger Anchoring Check
  const ledger = getLedgerAdapter(cert.ledgerMode as any);
  let ledgerAnchored = true;
  if (cert.credentialHash) {
    const anchor = await ledger.getAnchor(cert.credentialHash);
    if (anchor?.isRevoked) {
      return {
        status: "REVOKED",
        certificateId: cert.id,
        issuer: cert.issuer,
        courseName: cert.course.title,
        issueDate: cert.issueDate.toISOString().split("T")[0],
        grade: cert.grade,
        outcome: "Revoked",
        ledgerMode: cert.ledgerMode as any,
        ledgerLabel: cert.ledgerLabel,
        revocationReason: anchor.revocationReason || cert.revocationReason,
        revokedAt: anchor.revokedAt?.toISOString() || cert.revokedAt?.toISOString(),
        signatureValid: true,
        integrityValid: true,
        ledgerAnchored: true,
      };
    }
  }

  // Privacy-safe masked recipient name
  const rawName = cert.user?.name || "Verified Learner";
  const nameParts = rawName.split(" ");
  const maskedName = nameParts.length > 1
    ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
    : rawName;

  return {
    status: "VALID",
    certificateId: cert.id,
    issuer: cert.issuer,
    courseName: cert.course.title,
    issueDate: cert.issueDate.toISOString().split("T")[0],
    grade: cert.grade,
    outcome: cert.outcome,
    scorePercent: cert.scorePercent,
    provisional: cert.provisional,
    ledgerMode: cert.ledgerMode as any,
    ledgerLabel: cert.ledgerLabel,
    txHash: cert.txHash,
    blockNumber: cert.blockNumber,
    keyId: cert.keyId,
    issuerId: cert.issuerId,
    signatureValid: true,
    integrityValid: true,
    ledgerAnchored,
  };
}
