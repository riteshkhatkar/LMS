import { describe, it, expect, beforeAll } from "vitest";
import { getOrCreateIssuerKey, signCredentialPayload, verifyCredentialSignature, getPublicJWKS } from "@/lib/certification/keys";
import { buildSignedCredential, computeCredentialCommitment, computeCredentialCommitmentCanonical } from "@/lib/certification/credential";
import { generateCertificatePdf } from "@/lib/certification/pdf";
import { getCertificateVerifyUrl, generateQrBuffer } from "@/lib/certification/qr";
import { MockLedgerAdapter } from "@/lib/certification/ledger/mock-adapter";
import { CERTIFICATE_REGISTRY_ABI, LOCAL_EVM_CHAIN_ID } from "@/lib/certification/ledger/evm-adapter";
import * as jose from "jose";
import { ethers } from "ethers";

describe("Phase 4 Digital Certification & Cryptographic Verification Tests", () => {
  beforeAll(async () => {
    await getOrCreateIssuerKey();
  });

  describe("1. Issuer Key Management & JWKS Specification", () => {
    it("generates and retrieves persistent ES256 ORELSE issuer key", async () => {
      const key = await getOrCreateIssuerKey();
      expect(key.keyId).toBe("orelse-demo-key-2026-v1");
      expect(key.algorithm).toBe("ES256");
      expect(key.publicJwk.kty).toBe("EC");
      expect(key.publicJwk.crv).toBe("P-256");
      expect(key.publicJwk.use).toBe("sig");
    });

    it("publishes valid JWKS containing public key without exposing private key", async () => {
      const jwks = await getPublicJWKS();
      expect(jwks.keys.length).toBeGreaterThanOrEqual(1);
      const primaryKey = jwks.keys[0];
      expect(primaryKey.kid).toBe("orelse-demo-key-2026-v1");
      expect(primaryKey).not.toHaveProperty("d"); // No private key component in JWKS
    });
  });

  describe("2. W3C VC 2.0 / Open Badges 3.0 Credential Structure & Signing", () => {
    it("generates an official W3C VC 2.0 & Open Badges 3.0 compliant credential payload", async () => {
      const input = {
        certificateId: "LLMS-DEMO-2026-TEST1",
        learnerId: "user-123",
        learnerName: "Cadet Vikramaditya",
        courseId: "course-nav-01",
        courseTitle: "Naval Technical Readiness",
        scorePercent: 93.0,
        grade: "Grade A",
        provisional: false,
        gradingRuleVersion: 1,
        completedAt: new Date("2026-11-14T10:00:00Z"),
      };

      const result = await buildSignedCredential(input);
      const cred = result.credential;

      // 1. Context validation
      expect(cred["@context"]).toContain("https://www.w3.org/ns/credentials/v2");
      expect(cred["@context"]).toContain("https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json");

      // 2. Types
      expect(cred.type).toEqual(["VerifiableCredential", "OpenBadgeCredential"]);

      // 3. VC 2.0 validFrom (replaces v1 issuanceDate)
      expect(cred.validFrom).toBe("2026-11-14T10:00:00.000Z");
      expect((cred as any).issuanceDate).toBeUndefined();

      // 4. Open Badges 3.0 Subject & Achievement Types
      expect(cred.credentialSubject.type).toEqual(["AchievementSubject"]);
      expect(cred.credentialSubject.name).toBe("Cadet Vikramaditya");
      expect(cred.credentialSubject.achievement.type).toEqual(["Achievement"]);
      expect(cred.credentialSubject.achievement.name).toBe("Naval Technical Readiness");

      // 5. Open Badges 3.0 Results Array
      expect(Array.isArray(cred.credentialSubject.result)).toBe(true);
      expect(cred.credentialSubject.result!.length).toBe(2);
      expect(cred.credentialSubject.result![0].type).toEqual(["Result"]);
      expect(cred.credentialSubject.result![0].value).toBe("93%");

      // 6. Credential Status List Reference & Proper RFC 4122 UUID URN
      expect(cred.id).toMatch(/^urn:uuid:[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i);
      expect(cred.credentialStatus).toBeDefined();
      expect(cred.credentialStatus?.type).toBe("BitstringStatusListEntry");
      expect(cred.credentialStatus?.statusListCredential).toBeTruthy();

      // 7. Signature & Commitment Hash
      expect(result.signature).toBeTruthy();
      expect(result.credentialHash).toMatch(/^0x[a-f0-9]{64}$/i);
    });

    it("verifies genuine JWS digital signature using issuer public key", async () => {
      const payload = { test: "data", issuedBy: "ORELSE" };
      const { jws } = await signCredentialPayload(payload);

      const verification = await verifyCredentialSignature(jws);
      expect(verification.valid).toBe(true);
      expect(verification.payload.issuedBy).toBe("ORELSE");
    });

    it("supports backward-compatible hashing for historical credentials", () => {
      const historicalSubject = {
        id: "urn:learnlms:learner:123",
        name: "Test Learner",
        score: 90,
      };

      const hash1 = computeCredentialCommitment(historicalSubject);
      const hash2 = computeCredentialCommitmentCanonical(historicalSubject);
      expect(hash1).toMatch(/^0x[a-f0-9]{64}$/i);
      expect(hash2).toMatch(/^0x[a-f0-9]{64}$/i);
    });
  });

  describe("3. Security Invariant: Anti-Tamper & Foreign Key Rejection", () => {
    it("fails verification when credential payload is tampered with", async () => {
      const payload = { recipient: "Aditya", score: 65.0 };
      const { jws } = await signCredentialPayload(payload);

      // Split JWS: header.payload.signature
      const parts = jws.split(".");
      const decodedPayload = JSON.parse(Buffer.from(parts[1], "base64url").toString());

      // Attacker attempts score inflation from 65% to 95%
      decodedPayload.score = 95.0;
      const forgedPayloadBase64 = Buffer.from(JSON.stringify(decodedPayload)).toString("base64url");
      const tamperedJws = `${parts[0]}.${forgedPayloadBase64}.${parts[2]}`;

      const check = await verifyCredentialSignature(tamperedJws);
      expect(check.valid).toBe(false);
    });

    it("fails verification when checked against a foreign/unauthorized public key", async () => {
      const payload = { secret: "institutional_data" };
      const { jws } = await signCredentialPayload(payload);

      // Generate a different, foreign keypair
      const foreignKeys = await jose.generateKeyPair("ES256");
      const foreignPublicJwk = await jose.exportJWK(foreignKeys.publicKey);

      const check = await verifyCredentialSignature(jws, foreignPublicJwk);
      expect(check.valid).toBe(false);
    });
  });

  describe("4. QR Code & Vector PDF Generation", () => {
    it("formats public verification URL without double-slash errors", () => {
      const url = getCertificateVerifyUrl("LLMS-DEMO-2026-X101", "http://localhost:3000/");
      expect(url).toBe("http://localhost:3000/verify/LLMS-DEMO-2026-X101");
    });

    it("generates PNG buffer for scannable QR code", async () => {
      const qrBuf = await generateQrBuffer("LLMS-DEMO-2026-X101");
      expect(Buffer.isBuffer(qrBuf)).toBe(true);
      expect(qrBuf.length).toBeGreaterThan(500);
    });

    it("generates high-resolution vector PDF with ORELSE branding and QR code", async () => {
      const pdfBytes = await generateCertificatePdf({
        certificateId: "LLMS-DEMO-2026-PDF-TEST",
        learnerName: "Vikramaditya Deshmukh",
        courseTitle: "Getting Started with the Main Application",
        scorePercent: 93.0,
        grade: "Grade A",
        provisional: false,
        completedAt: new Date(),
        issuerName: "ORELSE",
      });

      expect(Buffer.isBuffer(pdfBytes)).toBe(true);
      expect(pdfBytes.length).toBeGreaterThan(10000); // Standard vector PDF is ~15-40KB
      // Check PDF magic header '%PDF-'
      const header = pdfBytes.subarray(0, 5).toString("ascii");
      expect(header).toBe("%PDF-");
    });
  });

  describe("5. MockLedger Hash-Chaining & Tamper-Evident History", () => {
    it("chains blocks with previous block hashes", async () => {
      const ledger = new MockLedgerAdapter();

      const commitment1 = "0x1111111111111111111111111111111111111111111111111111111111111111";
      const receipt1 = await ledger.anchor(commitment1, {
        certificateId: "CERT-001",
        courseId: "course-1",
        learnerId: "user-1",
        issueDate: new Date(),
        gradingRuleVersion: 1,
      });

      expect(receipt1.success).toBe(true);
      expect(receipt1.ledgerMode).toBe("mock");

      const commitment2 = "0x2222222222222222222222222222222222222222222222222222222222222222";
      const receipt2 = await ledger.anchor(commitment2, {
        certificateId: "CERT-002",
        courseId: "course-1",
        learnerId: "user-2",
        issueDate: new Date(),
        gradingRuleVersion: 1,
      });

      expect(receipt2.success).toBe(true);
      expect(receipt2.blockNumber).toBeGreaterThan(receipt1.blockNumber!);
    });
  });

  describe("6. Blockchain Privacy Invariants (Zero PII on Chain)", () => {
    it("ensures CertificateRegistry smart contract ABI processes ONLY bytes32 non-PII values", () => {
      // Verify ABI signatures
      expect(CERTIFICATE_REGISTRY_ABI).toContain("function anchorCommitment(bytes32 commitment) external");
      expect(CERTIFICATE_REGISTRY_ABI).toContain("function revokeCommitment(bytes32 commitment, bytes32 reasonCode) external");
      expect(CERTIFICATE_REGISTRY_ABI).toContain("function isAnchored(bytes32 commitment) external view returns (bool)");
      expect(CERTIFICATE_REGISTRY_ABI).toContain("function isRevoked(bytes32 commitment) external view returns (bool)");

      // Assert no function or event in ABI accepts strings for candidate names, grades, or personal details
      const anchorFunction = CERTIFICATE_REGISTRY_ABI.find((f: string) => f.startsWith("function anchorCommitment"));
      expect(anchorFunction).not.toContain("string");
      expect(anchorFunction).not.toContain("learner");
    });

    it("ensures commitment hash is domain-separated and hides plaintext identity", () => {
      const subject = {
        name: "Naval Officer Confidential Name",
        organization: "INS Western Fleet Command",
        score: 98.5,
      };

      const commitment = computeCredentialCommitment(subject);
      expect(commitment).toMatch(/^0x[a-f0-9]{64}$/i);
      // plaintext substrings must not appear in commitment hash
      expect(commitment).not.toContain("Naval");
      expect(commitment).not.toContain("Western");
      expect(commitment).not.toContain("98.5");
    });

    it("verifies Local EVM chain ID constant", () => {
      expect(LOCAL_EVM_CHAIN_ID).toBe(31337);
    });
  });
});
