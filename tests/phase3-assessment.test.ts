import { describe, it, expect } from "vitest";
import { applyGradingRule, DEFAULT_GRADING_RULE } from "@/lib/grading";
import { sanitizeQuestionsForLearner } from "@/lib/assessment/permissions";

describe("Phase 3 Assessment & Grading Engine Tests", () => {
  describe("§7.3 Mandatory Grading Boundaries (10 Boundary Check)", () => {
    it("1. 59% -> FAIL", () => {
      const res = applyGradingRule(59);
      expect(res.outcome).toBe("FAIL");
      expect(res.grade).toBeNull();
      expect(res.provisional).toBe(false);
      expect(res.label).toBe("Fail");
    });

    it("2. 60.00% -> FAIL (Exact pass threshold fails)", () => {
      const res = applyGradingRule(60);
      expect(res.outcome).toBe("FAIL");
      expect(res.grade).toBeNull();
      expect(res.provisional).toBe(false);
      expect(res.label).toBe("Fail");
    });

    it("3. 60.01% -> PASS (Provisional, no grade assigned)", () => {
      const res = applyGradingRule(60.01);
      expect(res.outcome).toBe("PASS");
      expect(res.grade).toBeNull();
      expect(res.provisional).toBe(true);
      expect(res.label).toBe("Pass");
    });

    it("4. 70.00% -> PASS Grade B (Exact lower bound for Grade B)", () => {
      const res = applyGradingRule(70);
      expect(res.outcome).toBe("PASS");
      expect(res.grade).toBe("B");
      expect(res.provisional).toBe(false);
      expect(res.label).toBe("Grade B");
    });

    it("5. 75.00% -> PASS Grade B (Exact upper bound for Grade B)", () => {
      const res = applyGradingRule(75);
      expect(res.outcome).toBe("PASS");
      expect(res.grade).toBe("B");
      expect(res.provisional).toBe(false);
      expect(res.label).toBe("Grade B");
    });

    it("6. 75.01% -> PASS (Provisional, intermediate between B and A)", () => {
      const res = applyGradingRule(75.01);
      expect(res.outcome).toBe("PASS");
      expect(res.grade).toBeNull();
      expect(res.provisional).toBe(true);
      expect(res.label).toBe("Pass");
    });

    it("7. 90.00% -> PASS (Provisional, upper boundary before Grade A)", () => {
      const res = applyGradingRule(90);
      expect(res.outcome).toBe("PASS");
      expect(res.grade).toBeNull();
      expect(res.provisional).toBe(true);
      expect(res.label).toBe("Pass");
    });

    it("8. 90.01% -> PASS Grade A (Strictly above 90% qualifies for Grade A)", () => {
      const res = applyGradingRule(90.01);
      expect(res.outcome).toBe("PASS");
      expect(res.grade).toBe("A");
      expect(res.provisional).toBe(false);
      expect(res.label).toBe("Grade A");
    });

    it("9. 93.00% -> PASS Grade A", () => {
      const res = applyGradingRule(93);
      expect(res.outcome).toBe("PASS");
      expect(res.grade).toBe("A");
      expect(res.provisional).toBe(false);
      expect(res.label).toBe("Grade A");
    });

    it("10. 100.00% -> PASS Grade A", () => {
      const res = applyGradingRule(100);
      expect(res.outcome).toBe("PASS");
      expect(res.grade).toBe("A");
      expect(res.provisional).toBe(false);
      expect(res.label).toBe("Grade A");
    });
  });

  describe("Custom Grading Rule Versions", () => {
    const strictRule = {
      ...DEFAULT_GRADING_RULE,
      version: 2,
      passThreshold: 75,
      gradeBMin: 75,
      gradeBMax: 85,
      gradeAThreshold: 95,
    };

    it("evaluates custom pass threshold at 75", () => {
      expect(applyGradingRule(74.99, strictRule).outcome).toBe("FAIL");
      expect(applyGradingRule(75.0, strictRule).outcome).toBe("FAIL");
      expect(applyGradingRule(75.01, strictRule).outcome).toBe("PASS");
      expect(applyGradingRule(75.01, strictRule).grade).toBe("B");
    });

    it("evaluates custom Grade A threshold at 95", () => {
      expect(applyGradingRule(95.0, strictRule).grade).toBeNull(); // provisional
      expect(applyGradingRule(95.01, strictRule).grade).toBe("A");
    });
  });

  describe("Anti-Cheat Question Sanitization (Server-Side Invariant)", () => {
    const rawQuestions = [
      {
        id: "q-1",
        prompt: "What is an FPO?",
        explanation: "FPO stands for Farmer Producer Organization under the Companies Act.",
        sortOrder: 1,
        points: 5,
        options: [
          { id: "opt-1", text: "Farmer Producer Organization", sortOrder: 1, isCorrect: true },
          { id: "opt-2", text: "Federal Police Office", sortOrder: 2, isCorrect: false },
          { id: "opt-3", text: "Fiscal Planning Operation", sortOrder: 3, isCorrect: false },
        ],
      },
    ];

    it("strips isCorrect and explanation during active learner attempt", () => {
      const sanitized = sanitizeQuestionsForLearner(rawQuestions, false);

      expect(sanitized[0].explanation).toBeUndefined();
      sanitized[0].options.forEach((opt) => {
        expect(opt.isCorrect).toBeUndefined();
        expect(opt).not.toHaveProperty("isCorrect");
      });
    });

    it("includes isCorrect and explanation when review mode is enabled", () => {
      const reviewed = sanitizeQuestionsForLearner(rawQuestions, true);

      expect(reviewed[0].explanation).toBe(
        "FPO stands for Farmer Producer Organization under the Companies Act."
      );
      expect(reviewed[0].options[0].isCorrect).toBe(true);
      expect(reviewed[0].options[1].isCorrect).toBe(false);
      expect(reviewed[0].options[2].isCorrect).toBe(false);
    });
  });

  describe("Calculation & Score Invariants", () => {
    it("handles zero earned marks correctly without division errors", () => {
      const totalPoints = 100;
      const pointsEarned = 0;
      const score = Math.round((pointsEarned / totalPoints) * 10000) / 100;
      expect(score).toBe(0);
      const res = applyGradingRule(score);
      expect(res.outcome).toBe("FAIL");
    });

    it("rounds float percentages precisely avoiding IEEE-754 precision issues", () => {
      // 18 out of 25 = 72%
      const score = Math.round((18 / 25) * 10000) / 100;
      expect(score).toBe(72);
      const res = applyGradingRule(score);
      expect(res.grade).toBe("B");
    });
  });
});
