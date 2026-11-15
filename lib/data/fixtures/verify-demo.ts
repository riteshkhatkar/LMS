import type { CertificateVerifyResult } from "@/lib/types";

const MOCK_LABEL = "Demo verification — MockLedger mode. Not anchored on a public blockchain.";

export const demoCertificates: Record<string, CertificateVerifyResult> = {
  "DEMO-VALID-001": {
    status: "VALID",
    certificateId: "DEMO-VALID-001",
    issuer: "Learn LMS (Demo Instance)",
    courseName: "FPO Governance Essentials",
    issueDate: "2026-10-12",
    grade: "Grade A",
    outcome: "Pass",
    ledgerMode: "mock",
    ledgerLabel: MOCK_LABEL,
  },
  "DEMO-GRADE-B-001": {
    status: "VALID",
    certificateId: "DEMO-GRADE-B-001",
    issuer: "Learn LMS (Demo Instance)",
    courseName: "Digital Skills & Online Safety",
    issueDate: "2026-10-20",
    grade: "Grade B",
    outcome: "Pass",
    ledgerMode: "mock",
    ledgerLabel: MOCK_LABEL,
  },
  "DEMO-PASS-001": {
    status: "VALID",
    certificateId: "DEMO-PASS-001",
    issuer: "Learn LMS (Demo Instance)",
    courseName: "FPC Operations & Compliance Basics",
    issueDate: "2026-11-01",
    grade: null,
    outcome: "Pass",
    ledgerMode: "mock",
    ledgerLabel: MOCK_LABEL,
  },
  "DEMO-REVOKED-001": {
    status: "REVOKED",
    certificateId: "DEMO-REVOKED-001",
    issuer: "Learn LMS (Demo Instance)",
    courseName: "Getting Started with the Main Application",
    issueDate: "2026-09-05",
    grade: null,
    outcome: "Revoked",
    revocationReason: "Certificate revoked for administrative review (demo example).",
    ledgerMode: "mock",
    ledgerLabel: MOCK_LABEL,
  },
  "DEMO-PENDING-001": {
    status: "PENDING",
    certificateId: "DEMO-PENDING-001",
    issuer: "Learn LMS (Demo Instance)",
    courseName: "FPO Governance Essentials",
    issueDate: "2026-11-13",
    grade: null,
    outcome: "Pending",
    ledgerMode: "mock",
    ledgerLabel: "Demo verification — MockLedger mode. Certificate issuance pending.",
  },
};

export function getDemoCertificate(id: string): CertificateVerifyResult {
  if (demoCertificates[id]) return demoCertificates[id];
  return {
    status: "NOT_FOUND",
    ledgerMode: "mock",
    ledgerLabel: MOCK_LABEL,
  };
}
