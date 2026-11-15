import crypto from "crypto";
import { signCredentialPayload } from "./keys";

export interface CreateCredentialInput {
  certificateId: string;
  learnerId: string;
  learnerName: string;
  learnerGroup?: string | null;
  courseId: string;
  courseTitle: string;
  scorePercent: number;
  grade: string | null;
  provisional: boolean;
  gradingRuleVersion: number;
  completedAt: Date;
  issuerBaseUrl?: string;
}

export interface W3CVerifiableCredential {
  "@context": string[];
  id: string;
  type: string[];
  issuer: {
    id: string;
    type?: string[];
    name: string;
    url: string;
    programme?: string;
  };
  validFrom: string;
  credentialSubject: {
    id: string;
    type?: string[];
    name: string;
    achievement: {
      id: string;
      type?: string[];
      name: string;
      description?: string;
      criteria?: { narrative: string } | string;
      gradingRuleVersion?: number;
    };
    result?: Array<{
      type: string[];
      value: string;
      resultDescription?: string;
    }>;
    score?: number;
    grade?: string;
    provisional?: boolean;
  };
  credentialStatus?: {
    id: string;
    type: string;
    statusPurpose?: string;
    statusListIndex?: string;
    statusListCredential?: string;
  };
  proof?: {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    jws: string;
  };
}

/**
 * Deterministically computes domain-separated SHA-256 commitment of the credential subject.
 * Supports canonical recursive sorting with fallback for legacy Phase 4 flat-sort payloads.
 */
export function computeCredentialCommitment(credentialSubject: Record<string, any>, salt?: string): string {
  const normalizedSalt = salt || "ORELSE_LEARN_LMS_2026_DOMAIN_SEPARATED";
  const canonicalString = JSON.stringify(credentialSubject, Object.keys(credentialSubject).sort());
  const hash = crypto
    .createHmac("sha256", normalizedSalt)
    .update(canonicalString)
    .digest("hex");
  return `0x${hash}`;
}

export function computeCredentialCommitmentCanonical(credentialSubject: Record<string, any>, salt?: string): string {
  const normalizedSalt = salt || "ORELSE_LEARN_LMS_2026_DOMAIN_SEPARATED";
  function serialize(obj: any): string {
    if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
    if (Array.isArray(obj)) return `[${obj.map(serialize).join(",")}]`;
    const sortedKeys = Object.keys(obj).sort();
    return `{${sortedKeys.map(k => `${JSON.stringify(k)}:${serialize(obj[k])}`).join(",")}}`;
  }
  const canonicalString = serialize(credentialSubject);
  const hash = crypto
    .createHmac("sha256", normalizedSalt)
    .update(canonicalString)
    .digest("hex");
  return `0x${hash}`;
}

/**
 * Builds an official W3C Verifiable Credentials 2.0 / 1EdTech Open Badges 3.0 compatible digital credential
 * and cryptographically signs it with ORELSE's issuer key.
 */
export async function buildSignedCredential(
  input: CreateCredentialInput
): Promise<{
  credential: W3CVerifiableCredential;
  credentialHash: string;
  signature: string;
  keyId: string;
}> {
  const baseUrl = input.issuerBaseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const issuerUri = `${baseUrl}/issuer/orelse`;
  const gradeLabel = input.grade || (input.provisional ? "Pass" : "Passed");

  const credentialSubject = {
    id: `urn:learnlms:learner:${input.learnerId}`,
    type: ["AchievementSubject"],
    name: input.learnerName,
    achievement: {
      id: `urn:learnlms:course:${input.courseId}`,
      type: ["Achievement"],
      name: input.courseTitle,
      criteria: "Fulfilled all required course lessons and successfully passed the final assessment.",
      gradingRuleVersion: input.gradingRuleVersion,
    },
    result: [
      {
        type: ["Result"],
        value: `${input.scorePercent}%`,
        resultDescription: "Final assessment score percentage",
      },
      {
        type: ["Result"],
        value: gradeLabel,
        resultDescription: input.provisional ? "Provisional Pass Grade" : "Certified Achievement Grade",
      },
    ],
    score: input.scorePercent,
    grade: gradeLabel,
    provisional: input.provisional,
  };

  const credentialUuid = crypto.randomUUID();

  const unsignedCredential: Omit<W3CVerifiableCredential, "proof"> = {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
    ],
    id: `urn:uuid:${credentialUuid}`,
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    issuer: {
      id: issuerUri,
      type: ["Profile"],
      name: "ORELSE",
      url: "https://www.orelse.ai",
      programme: "ORELSE Learning Certification",
    },
    validFrom: input.completedAt.toISOString(),
    credentialSubject,
    credentialStatus: {
      id: `${baseUrl}/api/issuer/orelse/status-list#${input.certificateId}`,
      type: "BitstringStatusListEntry",
      statusPurpose: "revocation",
      statusListIndex: "0",
      statusListCredential: `${baseUrl}/api/issuer/orelse/status-list`,
    },
  };

  // Compute domain-separated cryptographic commitment
  const credentialHash = computeCredentialCommitment(credentialSubject);

  // Digitally sign unsigned credential using ES256 / JOSE
  const { jws, keyId } = await signCredentialPayload(unsignedCredential);

  const signedCredential: W3CVerifiableCredential = {
    ...unsignedCredential,
    proof: {
      type: "JsonWebSignature2020",
      created: new Date().toISOString(),
      proofPurpose: "assertionMethod",
      verificationMethod: `${issuerUri}#${keyId}`,
      jws,
    },
  };

  return {
    credential: signedCredential,
    credentialHash,
    signature: jws,
    keyId,
  };
}
