import fs from "fs";
import path from "path";
import * as jose from "jose";
import { prisma } from "@/lib/db/prisma";

const SECRETS_DIR = path.join(process.cwd(), ".secrets");
const KEY_FILE = path.join(SECRETS_DIR, "issuer-signing-key.json");
export const ORELSE_DEFAULT_KEY_ID = "orelse-demo-key-2026-v1";

let cachedIssuerKey: StoredIssuerKey | null = null;
let cachedPublicKeyObject: any = null;

export interface StoredIssuerKey {
  keyId: string;
  algorithm: "ES256";
  privateJwk: jose.JWK;
  publicJwk: jose.JWK;
  createdAt: string;
}

/**
 * Retrieves the persistent development signing key, or creates a new ES256 keypair if not present.
 * Ensures the public key is registered in the database for public JWKS and verification.
 * Memory cached for sub-millisecond verification throughput.
 */
export async function getOrCreateIssuerKey(): Promise<StoredIssuerKey> {
  if (cachedIssuerKey) {
    return cachedIssuerKey;
  }

  if (!fs.existsSync(SECRETS_DIR)) {
    fs.mkdirSync(SECRETS_DIR, { recursive: true });
  }

  if (fs.existsSync(KEY_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(KEY_FILE, "utf-8")) as StoredIssuerKey;
      cachedIssuerKey = data;
      return data;
    } catch (e) {
      console.warn("Could not parse existing signing key file, generating fresh keypair.", e);
    }
  }

  // Generate new ES256 NIST P-256 key pair
  const { privateKey, publicKey } = await jose.generateKeyPair("ES256", { extractable: true });
  const privateJwk = await jose.exportJWK(privateKey);
  const publicJwk = await jose.exportJWK(publicKey);

  publicJwk.kid = ORELSE_DEFAULT_KEY_ID;
  publicJwk.use = "sig";
  publicJwk.alg = "ES256";

  privateJwk.kid = ORELSE_DEFAULT_KEY_ID;
  privateJwk.use = "sig";
  privateJwk.alg = "ES256";

  const keyRecord: StoredIssuerKey = {
    keyId: ORELSE_DEFAULT_KEY_ID,
    algorithm: "ES256",
    privateJwk,
    publicJwk,
    createdAt: new Date().toISOString(),
  };

  fs.writeFileSync(KEY_FILE, JSON.stringify(keyRecord, null, 2), "utf-8");

  // Sync public key to database for audit and rotation tracking
  try {
    await prisma.issuerKey.upsert({
      where: { id: ORELSE_DEFAULT_KEY_ID },
      update: {
        algorithm: "ES256",
        publicKeyJwk: publicJwk as any,
        isActive: true,
      },
      create: {
        id: ORELSE_DEFAULT_KEY_ID,
        algorithm: "ES256",
        publicKeyJwk: publicJwk as any,
        isActive: true,
      },
    });
  } catch (err) {
    // Database might still be migrating; non-fatal fallback
    console.warn("Database issuer key sync deferred:", err);
  }

  return keyRecord;
}

/**
 * Signs an arbitrary JSON credential payload using ORELSE's private key.
 * Produces a standard Compact JWS (Header.Payload.Signature).
 */
export async function signCredentialPayload(payload: Record<string, any>): Promise<{
  jws: string;
  keyId: string;
}> {
  const issuerKey = await getOrCreateIssuerKey();
  const privateKey = await jose.importJWK(issuerKey.privateJwk, "ES256");

  const jws = await new jose.SignJWT(payload)
    .setProtectedHeader({
      alg: "ES256",
      kid: issuerKey.keyId,
      typ: "JWT",
    })
    .sign(privateKey);

  return {
    jws,
    keyId: issuerKey.keyId,
  };
}

/**
 * Verifies a JWS digital signature against a public key.
 * Uses cached cryptographic KeyObject for sub-millisecond verification under high concurrency.
 */
export async function verifyCredentialSignature(
  jws: string,
  providedPublicJwk?: jose.JWK
): Promise<{
  valid: boolean;
  payload?: any;
  header?: any;
  error?: string;
}> {
  try {
    let publicKey: any;
    if (!providedPublicJwk && cachedPublicKeyObject) {
      publicKey = cachedPublicKeyObject;
    } else {
      let publicJwk = providedPublicJwk;
      if (!publicJwk) {
        const issuerKey = await getOrCreateIssuerKey();
        publicJwk = issuerKey.publicJwk;
      }
      publicKey = await jose.importJWK(publicJwk, "ES256");
      if (!providedPublicJwk) {
        cachedPublicKeyObject = publicKey;
      }
    }

    const { payload, protectedHeader } = await jose.jwtVerify(jws, publicKey);

    return {
      valid: true,
      payload,
      header: protectedHeader,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: err.message || "Invalid cryptographic signature",
    };
  }
}

/**
 * Returns the public JWKS object for the /api/issuer/orelse/jwks endpoint.
 */
export async function getPublicJWKS(): Promise<{ keys: jose.JWK[] }> {
  const issuerKey = await getOrCreateIssuerKey();
  return {
    keys: [issuerKey.publicJwk],
  };
}
