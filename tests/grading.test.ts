import { describe, it, expect } from "vitest";
import { applyGradingRule } from "@/lib/grading";

describe("Grading Engine Boundary Tests", () => {
  it("scores 59 as FAIL", () => {
    const result = applyGradingRule(59);
    expect(result.outcome).toBe("FAIL");
    expect(result.grade).toBeNull();
    expect(result.provisional).toBe(false);
    expect(result.label).toBe("Fail");
  });

  it("scores 60 as FAIL (exact threshold fails)", () => {
    const result = applyGradingRule(60);
    expect(result.outcome).toBe("FAIL");
    expect(result.grade).toBeNull();
    expect(result.provisional).toBe(false);
    expect(result.label).toBe("Fail");
  });

  it("scores 60.01 as PASS, provisional, no grade", () => {
    const result = applyGradingRule(60.01);
    expect(result.outcome).toBe("PASS");
    expect(result.grade).toBeNull();
    expect(result.provisional).toBe(true);
    expect(result.label).toBe("Pass");
  });

  it("scores 69.99 as PASS, provisional, no grade", () => {
    const result = applyGradingRule(69.99);
    expect(result.outcome).toBe("PASS");
    expect(result.grade).toBeNull();
    expect(result.provisional).toBe(true);
    expect(result.label).toBe("Pass");
  });

  it("scores 70 as PASS, Grade B, not provisional", () => {
    const result = applyGradingRule(70);
    expect(result.outcome).toBe("PASS");
    expect(result.grade).toBe("B");
    expect(result.provisional).toBe(false);
    expect(result.label).toBe("Grade B");
  });

  it("scores 72.5 as PASS, Grade B, not provisional", () => {
    const result = applyGradingRule(72.5);
    expect(result.outcome).toBe("PASS");
    expect(result.grade).toBe("B");
    expect(result.provisional).toBe(false);
    expect(result.label).toBe("Grade B");
  });

  it("scores 75 as PASS, Grade B, not provisional (inclusive upper bound)", () => {
    const result = applyGradingRule(75);
    expect(result.outcome).toBe("PASS");
    expect(result.grade).toBe("B");
    expect(result.provisional).toBe(false);
    expect(result.label).toBe("Grade B");
  });

  it("scores 75.01 as PASS, provisional, no grade", () => {
    const result = applyGradingRule(75.01);
    expect(result.outcome).toBe("PASS");
    expect(result.grade).toBeNull();
    expect(result.provisional).toBe(true);
    expect(result.label).toBe("Pass");
  });

  it("scores 90 as PASS, provisional, no grade (90 is NOT Grade A)", () => {
    const result = applyGradingRule(90);
    expect(result.outcome).toBe("PASS");
    expect(result.grade).toBeNull();
    expect(result.provisional).toBe(true);
    expect(result.label).toBe("Pass");
  });

  it("scores 90.01 as PASS, Grade A, not provisional", () => {
    const result = applyGradingRule(90.01);
    expect(result.outcome).toBe("PASS");
    expect(result.grade).toBe("A");
    expect(result.provisional).toBe(false);
    expect(result.label).toBe("Grade A");
  });

  it("scores 93 as PASS, Grade A, not provisional", () => {
    const result = applyGradingRule(93);
    expect(result.outcome).toBe("PASS");
    expect(result.grade).toBe("A");
    expect(result.provisional).toBe(false);
    expect(result.label).toBe("Grade A");
  });

  it("scores 100 as PASS, Grade A, not provisional", () => {
    const result = applyGradingRule(100);
    expect(result.outcome).toBe("PASS");
    expect(result.grade).toBe("A");
    expect(result.provisional).toBe(false);
    expect(result.label).toBe("Grade A");
  });
});
