export type GradeOutcome = "FAIL" | "PASS";
export type GradeLetter = "A" | "B" | null;

export interface GradeResult {
  outcome: GradeOutcome;
  grade: GradeLetter;
  /** True when this band is not fully confirmed with client */
  provisional: boolean;
  scorePercent: number;
  label: string;
}

export interface GradingRule {
  id: string;
  courseId: string;
  passThreshold: number;
  gradeAThreshold: number;
  gradeBMin: number;
  gradeBMax: number;
  version: number;
  createdAt: Date;
}

/**
 * Apply grading rule to a score percentage.
 *
 * Bands (spec §7.3):
 *  score <= 60      → FAIL (exact 60 fails)
 *  60 < score < 70  → PASS, no grade (provisional)
 *  70 <= score <= 75 → PASS, Grade B (confirmed)
 *  75 < score <= 90  → PASS, no grade (provisional)
 *  score > 90       → PASS, Grade A (confirmed)
 *
 * Uses integer-safe comparison (multiply by 100 to avoid float issues).
 */
export function applyGradingRule(
  scorePercent: number,
  rule: GradingRule = DEFAULT_GRADING_RULE
): GradeResult {
  const score100 = Math.round(scorePercent * 100);
  const pass100 = Math.round(rule.passThreshold * 100);
  const gradeBMin100 = Math.round(rule.gradeBMin * 100);
  const gradeBMax100 = Math.round(rule.gradeBMax * 100);
  const gradeA100 = Math.round(rule.gradeAThreshold * 100);

  if (score100 <= pass100) {
    return { outcome: "FAIL", grade: null, provisional: false, scorePercent, label: "Fail" };
  }
  if (score100 < gradeBMin100) {
    return { outcome: "PASS", grade: null, provisional: true, scorePercent, label: "Pass" };
  }
  if (score100 <= gradeBMax100) {
    return { outcome: "PASS", grade: "B", provisional: false, scorePercent, label: "Grade B" };
  }
  if (score100 <= gradeA100) {
    return { outcome: "PASS", grade: null, provisional: true, scorePercent, label: "Pass" };
  }
  return { outcome: "PASS", grade: "A", provisional: false, scorePercent, label: "Grade A" };
}

export const DEFAULT_GRADING_RULE: GradingRule = {
  id: "default",
  courseId: "*",
  passThreshold: 60,
  gradeAThreshold: 90,
  gradeBMin: 70,
  gradeBMax: 75,
  version: 1,
  createdAt: new Date("2026-01-01"),
};
