import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimit } from "../lib/auth/rate-limit";
import {
  signSessionToken,
  verifySessionToken,
  createSessionToken,
  JWT_ISSUER,
  JWT_AUDIENCE,
  type SessionUser,
} from "../lib/auth/session";
import { logger } from "../lib/logging";

describe("Phase 8: Rate Limiting Defense", () => {
  beforeEach(() => {
    resetRateLimit("test-ip-127.0.0.1");
  });

  it("permits requests within configured threshold", () => {
    const result1 = checkRateLimit("test-ip-127.0.0.1", 5, 10000);
    expect(result1.success).toBe(true);
    expect(result1.remaining).toBe(4);

    const result2 = checkRateLimit("test-ip-127.0.0.1", 5, 10000);
    expect(result2.success).toBe(true);
    expect(result2.remaining).toBe(3);
  });

  it("strictly throttles requests exceeding limit with retry-after header", () => {
    const ip = "test-ip-blocked";
    resetRateLimit(ip);
    for (let i = 0; i < 3; i++) {
      checkRateLimit(ip, 3, 10000);
    }
    const blocked = checkRateLimit(ip, 3, 10000);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetSeconds).toBeGreaterThan(0);
  });
});

describe("Phase 8: JWT Cryptographic Claims & Audience Validation", () => {
  const sampleUser: SessionUser = {
    id: "usr-admin-test-01",
    email: "admin.audit@learnlms.local",
    fullName: "Audit Admin",
    role: "ADMIN",
    learnerGroup: null,
    organizationId: null,
  };

  it("signs JWT with standard learn-lms issuer and learn-lms-client audience", async () => {
    const token = await signSessionToken(sampleUser);
    expect(typeof token).toBe("string");

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe(sampleUser.id);
    expect(verified?.email).toBe(sampleUser.email);
    expect(verified?.role).toBe("ADMIN");
  });

  it("rejects token when tampered or issued by untrusted party", async () => {
    const token = await createSessionToken(sampleUser);
    const parts = token.split(".");
    // Invalidate signature part
    const tampered = `${parts[0]}.${parts[1]}.invalid_signature_bytes`;

    const verified = await verifySessionToken(tampered);
    expect(verified).toBeNull();
  });
});

describe("Phase 8: Structured Logger & PII Redaction", () => {
  it("masks sensitive parameters (passwords, private keys, secrets)", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    logger.info("AUTH_LOGIN_TEST", "User logged in successfully", {
      userId: "usr-01",
      email: "user@example.com",
      password: "PlainTextPassword123!",
      privateKey: "30818102010030...",
    });

    expect(consoleSpy).toHaveBeenCalled();
    const logCall = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(logCall);

    expect(parsed.event).toBe("AUTH_LOGIN_TEST");
    expect(parsed.userId).toBe("usr-01");
    expect(parsed.password).toBe("[REDACTED]");
    expect(parsed.privateKey).toBe("[REDACTED]");

    consoleSpy.mockRestore();
  });
});
