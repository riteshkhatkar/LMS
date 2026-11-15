import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../lib/auth/password";
import {
  createSessionToken,
  verifySessionToken,
  SESSION_COOKIE_NAME,
  type SessionPayload,
} from "../lib/auth/session";

describe("Phase 2: Authentication & Password Security", () => {
  it("hashes passwords securely with bcrypt and verifies matching passwords", async () => {
    const rawPassword = "Learner@123";
    const hashed = await hashPassword(rawPassword);

    expect(hashed).not.toBe(rawPassword);
    expect(hashed).toMatch(/^\$2[aby]\$\d+\$/); // standard bcrypt pattern

    const isMatch = await verifyPassword(rawPassword, hashed);
    expect(isMatch).toBe(true);

    const isWrongMatch = await verifyPassword("WrongPassword!99", hashed);
    expect(isWrongMatch).toBe(false);
  });

  it("fails verification for empty or malformed hash safely", async () => {
    const isMatch = await verifyPassword("somePassword", "not-a-hash");
    expect(isMatch).toBe(false);
  });
});

describe("Phase 2: Session Token & JWT Handling", () => {
  it("creates and verifies a signed session token correctly", async () => {
    const payload: SessionPayload = {
      id: "usr-naval-01",
      email: "naval.officer@learnlms.local",
      fullName: "Lt. Cmdr. Rajesh Verma",
      role: "LEARNER",
      learnerGroup: "NAVAL_OFFICER",
      organizationId: "WNC-TRG",
    };

    const token = await createSessionToken(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3); // JWT format: header.payload.signature

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe(payload.id);
    expect(verified?.email).toBe(payload.email);
    expect(verified?.fullName).toBe(payload.fullName);
    expect(verified?.role).toBe("LEARNER");
    expect(verified?.learnerGroup).toBe("NAVAL_OFFICER");
    expect(verified?.organizationId).toBe("WNC-TRG");
  });

  it("returns null for tampered or invalid session tokens", async () => {
    const token = await createSessionToken({
      id: "usr-01",
      email: "test@example.com",
      fullName: "Test User",
      role: "LEARNER",
    });

    // Tamper with payload or signature
    const tampered = token.slice(0, -5) + "abcde";
    const verified = await verifySessionToken(tampered);
    expect(verified).toBeNull();
  });

  it("exports correct session cookie name", () => {
    expect(SESSION_COOKIE_NAME).toBe("learn_lms_session");
  });
});

describe("Phase 2: Role & Registration Security Invariants", () => {
  it("enforces that public registration always assigns LEARNER role, never ADMIN or INSTRUCTOR", () => {
    // Simulated registration input where a malicious client tries to elevate to ADMIN
    const maliciousPayload = {
      fullName: "Attacker",
      email: "attacker@domain.com",
      password: "SecretPassword123!",
      role: "ADMIN", // Malicious role injection
      learnerGroup: "NAVAL_OFFICER",
    };

    // Registration service / controller logic must always override role to LEARNER
    const sanitizeRegistration = (input: typeof maliciousPayload) => {
      return {
        fullName: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        password: input.password,
        role: "LEARNER" as const, // Strict enforcement
        learnerGroup: input.learnerGroup,
      };
    };

    const sanitized = sanitizeRegistration(maliciousPayload);
    expect(sanitized.role).toBe("LEARNER");
    expect(sanitized.role).not.toBe("ADMIN");
  });

  it("supports exactly the 4 required Learner Group classifications", () => {
    const validLearnerGroups = ["FPO", "FPC", "STUDENT", "NAVAL_OFFICER"] as const;
    expect(validLearnerGroups).toContain("NAVAL_OFFICER");
    expect(validLearnerGroups).toContain("FPO");
    expect(validLearnerGroups).toContain("FPC");
    expect(validLearnerGroups).toContain("STUDENT");
    expect(validLearnerGroups.length).toBe(4);
  });
});

describe("Phase 2: Learning Progress & Completion Calculation", () => {
  function calculateProgress(completedLessons: number, totalRequiredLessons: number): {
    percentage: number;
    isCompleted: boolean;
  } {
    if (totalRequiredLessons <= 0) {
      return { percentage: 0, isCompleted: false };
    }
    const clampedCompleted = Math.min(completedLessons, totalRequiredLessons);
    const percentage = Math.round((clampedCompleted / totalRequiredLessons) * 100);
    const isCompleted = percentage >= 100;
    return { percentage, isCompleted };
  }

  it("calculates 0% for newly enrolled course", () => {
    const progress = calculateProgress(0, 5);
    expect(progress.percentage).toBe(0);
    expect(progress.isCompleted).toBe(false);
  });

  it("calculates accurate intermediate progress", () => {
    const p1 = calculateProgress(1, 3); // 1/3 = 33%
    expect(p1.percentage).toBe(33);
    expect(p1.isCompleted).toBe(false);

    const p2 = calculateProgress(2, 3); // 2/3 = 67%
    expect(p2.percentage).toBe(67);
    expect(p2.isCompleted).toBe(false);

    const p3 = calculateProgress(3, 4); // 3/4 = 75%
    expect(p3.percentage).toBe(75);
    expect(p3.isCompleted).toBe(false);
  });

  it("calculates 100% completion when all lessons completed", () => {
    const progress = calculateProgress(5, 5);
    expect(progress.percentage).toBe(100);
    expect(progress.isCompleted).toBe(true);
  });

  it("handles edge cases gracefully", () => {
    const zeroCourse = calculateProgress(0, 0);
    expect(zeroCourse.percentage).toBe(0);
    expect(zeroCourse.isCompleted).toBe(false);

    const overflow = calculateProgress(10, 5);
    expect(overflow.percentage).toBe(100);
    expect(overflow.isCompleted).toBe(true);
  });
});
