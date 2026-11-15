import { describe, it, expect } from "vitest";
import { LearnerGroup } from "@prisma/client";
import {
  isUserEligibleForCohort,
  isSubscriptionPermitted,
  generateUnsubscribeToken,
} from "../lib/communication/audience";
import {
  buildRfc8058Headers,
  generateNewsletterEmailHtml,
  LocalDemoDeliveryAdapter,
} from "../lib/communication/delivery";
import { sanitizeMessageContent } from "../lib/communication/moderation";

describe("Phase 6 — Communication, Newsletters & Moderation Unit Tests", () => {
  describe("1. Audience Targeting & Naval Clearance Rules", () => {
    it("should allow any user when sendToAll is true", () => {
      expect(isUserEligibleForCohort(LearnerGroup.NAVAL_OFFICER, undefined, true)).toBe(true);
      expect(isUserEligibleForCohort(LearnerGroup.FPO, undefined, true)).toBe(true);
      expect(isUserEligibleForCohort(null, undefined, true)).toBe(true);
    });

    it("should strictly isolate NAVAL_OFFICER when targeted solely to naval personnel", () => {
      const navalCohort = [LearnerGroup.NAVAL_OFFICER];
      expect(isUserEligibleForCohort(LearnerGroup.NAVAL_OFFICER, navalCohort)).toBe(true);
      expect(isUserEligibleForCohort(LearnerGroup.FPO, navalCohort)).toBe(false);
      expect(isUserEligibleForCohort(LearnerGroup.FPC, navalCohort)).toBe(false);
      expect(isUserEligibleForCohort(LearnerGroup.STUDENT, navalCohort)).toBe(false);
      expect(isUserEligibleForCohort(null, navalCohort)).toBe(false);
    });

    it("should exclude NAVAL_OFFICER from civilian-only campaigns for strict operational segregation", () => {
      const civilianCohorts = [LearnerGroup.FPO, LearnerGroup.FPC, LearnerGroup.STUDENT];
      expect(isUserEligibleForCohort(LearnerGroup.NAVAL_OFFICER, civilianCohorts)).toBe(false);
      expect(isUserEligibleForCohort(LearnerGroup.FPO, civilianCohorts)).toBe(true);
      expect(isUserEligibleForCohort(LearnerGroup.FPC, civilianCohorts)).toBe(true);
      expect(isUserEligibleForCohort(LearnerGroup.STUDENT, civilianCohorts)).toBe(true);
    });

    it("should correctly handle multi-cohort inclusion when naval is part of wider mix", () => {
      const mixedCohorts = [LearnerGroup.FPO, LearnerGroup.NAVAL_OFFICER];
      expect(isUserEligibleForCohort(LearnerGroup.NAVAL_OFFICER, mixedCohorts)).toBe(true);
      expect(isUserEligibleForCohort(LearnerGroup.FPO, mixedCohorts)).toBe(true);
      expect(isUserEligibleForCohort(LearnerGroup.STUDENT, mixedCohorts)).toBe(false);
    });
  });

  describe("2. Subscription Preferences & Suppression Filtering", () => {
    it("should suppress all communications if isSubscribed is false", () => {
      const unsubbed = {
        isSubscribed: false,
        generalNews: true,
        courseAlerts: true,
        trainingAnnouncements: true,
      };
      expect(isSubscriptionPermitted(unsubbed, "general")).toBe(false);
      expect(isSubscriptionPermitted(unsubbed, "courses")).toBe(false);
      expect(isSubscriptionPermitted(unsubbed, "training")).toBe(false);
    });

    it("should respect category switches when subscribed", () => {
      const selective = {
        isSubscribed: true,
        generalNews: true,
        courseAlerts: false,
        trainingAnnouncements: true,
      };
      expect(isSubscriptionPermitted(selective, "general")).toBe(true);
      expect(isSubscriptionPermitted(selective, "courses")).toBe(false);
      expect(isSubscriptionPermitted(selective, "training")).toBe(true);
    });

    it("should generate cryptographically sound opaque unsubscribe tokens", () => {
      const token1 = generateUnsubscribeToken("user1@example.com");
      const token2 = generateUnsubscribeToken("user1@example.com");
      expect(token1).toMatch(/^unsub_[a-f0-9]{32}$/);
      expect(token2).toMatch(/^unsub_[a-f0-9]{32}$/);
      expect(token1).not.toBe(token2);
    });
  });

  describe("3. RFC 8058 Header Compliance & Email Rendering", () => {
    it("should construct valid RFC 8058 List-Unsubscribe headers", () => {
      const token = "test_token_12345";
      const siteUrl = "http://localhost:3000";
      const headers = buildRfc8058Headers(token, siteUrl);

      expect(headers["List-Unsubscribe"]).toBe("<http://localhost:3000/api/newsletter/unsubscribe/test_token_12345>");
      expect(headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    });

    it("should generate email HTML with ORELSE branding and direct unsubscribe links", () => {
      const { html, text } = generateNewsletterEmailHtml({
        subject: "Platform Release 2026",
        body: "Hello from Learn LMS.\n\nPlease check your new dashboard.",
        recipient: {
          email: "learner@learnlms.local",
          unsubscribeToken: "token_abc_xyz",
        },
        siteUrl: "http://localhost:3000",
      });

      expect(html).toContain("Learn LMS");
      expect(html).toContain("Product by ORELSE");
      expect(html).toContain("www.orelse.ai");
      expect(html).toContain("Platform Release 2026");
      expect(html).toContain("/api/newsletter/unsubscribe/token_abc_xyz");
      expect(html).toContain("/en/newsletter/preferences?token=token_abc_xyz");
      expect(text).toContain("Learn LMS by ORELSE");
    });
  });

  describe("4. LocalDemoDeliveryAdapter Functionality", () => {
    it("should simulate newsletter batch dispatch with SIMULATED status without external network", async () => {
      const adapter = new LocalDemoDeliveryAdapter();
      expect(adapter.name).toBe("local-demo");

      const campaign = {
        id: "camp_1",
        title: "Winter Brief",
        subject: "Subject Line",
        body: "Body Content",
      };

      const recipients = [
        { email: "user1@example.com", unsubscribeToken: "token1" },
        { email: "user2@example.com", unsubscribeToken: "token2" },
      ];

      const res = await adapter.sendNewsletterBatch(campaign, recipients);
      expect(res.success).toBe(true);
      expect(res.total).toBe(2);
      expect(res.delivered).toBe(2);
      expect(res.results[0].status).toBe("SIMULATED");
      expect(res.results[1].status).toBe("SIMULATED");
    });
  });

  describe("5. Message Moderation & Sanitization", () => {
    it("should strip malicious script tags from messages", () => {
      const raw = "Hello <script>alert('xss')</script>World!";
      const res = sanitizeMessageContent(raw);
      expect(res.isValid).toBe(true);
      expect(res.cleanText).toBe("Hello World!");
    });

    it("should strip arbitrary HTML tags while preserving text content", () => {
      const raw = "<b>Bold</b> and <i>italic</i> and <a href='http://bad'>link</a>";
      const res = sanitizeMessageContent(raw);
      expect(res.isValid).toBe(true);
      expect(res.cleanText).toBe("Bold and italic and link");
    });

    it("should reject empty or whitespace-only messages", () => {
      expect(sanitizeMessageContent("").isValid).toBe(false);
      expect(sanitizeMessageContent("   \n\t  ").isValid).toBe(false);
    });

    it("should enforce maximum character boundaries", () => {
      const longText = "a".repeat(300);
      const res = sanitizeMessageContent(longText, 250);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("exceeds maximum allowed length");
    });
  });
});
