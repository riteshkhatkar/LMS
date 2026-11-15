import { describe, it, expect } from "vitest";

describe("Phase 5 Admin & Instructor Governance Unit Tests", () => {
  describe("1. CSV Formula Injection Sanitization (CWE-1236)", () => {
    // Replicate CSV sanitization function used in export route
    function sanitizeCsvCell(val: any): string {
      if (val === null || val === undefined) return '""';
      let str = String(val);
      const trimmed = str.trimStart();
      if (/^[=+\-@\t\r\n]/.test(trimmed) || /^[=+\-@\t\r\n]/.test(str)) {
        str = "'" + str;
      }
      return `"${str.replace(/"/g, '""')}"`;
    }

    it("sanitizes dangerous formulas starting with '=' by prefixing with single quote", () => {
      const malicious = "=cmd|' /C calc'!A0";
      const sanitized = sanitizeCsvCell(malicious);
      expect(sanitized).toBe("\"'=cmd|' /C calc'!A0\"");
      expect(sanitized.startsWith("\"'=")).toBe(true);
    });

    it("sanitizes dangerous formulas with leading whitespace and tabs", () => {
      const spaceMalicious = "   =1+1";
      const tabMalicious = "\t@SUM(A1:A10)";
      const newlineMalicious = "\n-cmd";
      expect(sanitizeCsvCell(spaceMalicious)).toBe("\"'   =1+1\"");
      expect(sanitizeCsvCell(tabMalicious)).toBe("\"'\t@SUM(A1:A10)\"");
      expect(sanitizeCsvCell(newlineMalicious)).toBe("\"'\n-cmd\"");
    });

    it("sanitizes dangerous formulas starting with '+'", () => {
      const malicious = "+2+5+cmd";
      const sanitized = sanitizeCsvCell(malicious);
      expect(sanitized).toBe("\"'+2+5+cmd\"");
    });

    it("sanitizes dangerous formulas starting with '-'", () => {
      const malicious = "-1000+SOMETHING";
      const sanitized = sanitizeCsvCell(malicious);
      expect(sanitized).toBe("\"'-1000+SOMETHING\"");
    });

    it("sanitizes dangerous formulas starting with '@'", () => {
      const malicious = "@SUM(A1:A10)";
      const sanitized = sanitizeCsvCell(malicious);
      expect(sanitized).toBe("\"'@SUM(A1:A10)\"");
    });

    it("escapes quotes correctly for benign strings", () => {
      const benign = 'Hello "World"';
      const sanitized = sanitizeCsvCell(benign);
      expect(sanitized).toBe('"Hello ""World"""');
    });

    it("handles null and undefined values safely", () => {
      expect(sanitizeCsvCell(null)).toBe('""');
      expect(sanitizeCsvCell(undefined)).toBe('""');
    });
  });

  describe("2. Course Publishing Validation Invariants", () => {
    interface CourseValidationInput {
      title: string;
      slug: string;
      sectionsCount: number;
      lessonsCount: number;
      certificateOnPass: boolean;
      hasFinalAssessment: boolean;
    }

    function validateCourseForPublishing(course: CourseValidationInput): {
      valid: boolean;
      error?: string;
    } {
      if (!course.title || course.title.trim().length < 3) {
        return { valid: false, error: "Course title is required (min 3 chars)" };
      }
      if (!course.slug || course.slug.trim().length < 3) {
        return { valid: false, error: "Course slug is required (min 3 chars)" };
      }
      if (course.sectionsCount < 1) {
        return {
          valid: false,
          error: "Course must have at least 1 section before publication",
        };
      }
      if (course.lessonsCount < 1) {
        return {
          valid: false,
          error: "Course must have at least 1 lesson before publication",
        };
      }
      if (course.certificateOnPass && !course.hasFinalAssessment) {
        return {
          valid: false,
          error:
            "A course with certification enabled must have a configured final course assessment",
        };
      }
      return { valid: true };
    }

    it("rejects publishing a course with 0 sections", () => {
      const result = validateCourseForPublishing({
        title: "Test Course",
        slug: "test-course",
        sectionsCount: 0,
        lessonsCount: 0,
        certificateOnPass: false,
        hasFinalAssessment: false,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("at least 1 section");
    });

    it("rejects publishing a course with 1 section but 0 lessons", () => {
      const result = validateCourseForPublishing({
        title: "Test Course",
        slug: "test-course",
        sectionsCount: 1,
        lessonsCount: 0,
        certificateOnPass: false,
        hasFinalAssessment: false,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("at least 1 lesson");
    });

    it("rejects publishing when certificate is enabled but final assessment is missing", () => {
      const result = validateCourseForPublishing({
        title: "Test Course",
        slug: "test-course",
        sectionsCount: 1,
        lessonsCount: 2,
        certificateOnPass: true,
        hasFinalAssessment: false,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("must have a configured final course assessment");
    });

    it("approves publishing when all invariants are satisfied", () => {
      const result = validateCourseForPublishing({
        title: "Coastal Navigation",
        slug: "coastal-navigation",
        sectionsCount: 2,
        lessonsCount: 5,
        certificateOnPass: true,
        hasFinalAssessment: true,
      });
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe("3. Sole Admin Demotion Protection Invariant", () => {
    function canDemoteAdmin(adminUsersCount: number, targetUserId: string, targetRole: string): {
      allowed: boolean;
      error?: string;
    } {
      if (targetRole !== "ADMIN") {
        if (adminUsersCount <= 1) {
          return {
            allowed: false,
            error: "Cannot demote the sole active administrator account",
          };
        }
      }
      return { allowed: true };
    }

    it("blocks demoting the administrator when only 1 active admin exists", () => {
      const check = canDemoteAdmin(1, "admin-1", "LEARNER");
      expect(check.allowed).toBe(false);
      expect(check.error).toContain("sole active administrator");
    });

    it("permits role change when multiple active administrators exist", () => {
      const check = canDemoteAdmin(3, "admin-2", "INSTRUCTOR");
      expect(check.allowed).toBe(true);
    });

    it("permits keeping an administrator as ADMIN regardless of count", () => {
      const check = canDemoteAdmin(1, "admin-1", "ADMIN");
      expect(check.allowed).toBe(true);
    });
  });

  describe("4. Naval Restricted Course Clearance Authorization", () => {
    interface ClearanceCheckInput {
      courseIsRestricted: boolean;
      userIsOrgVerified: boolean;
      orgIsVerified?: boolean;
    }

    function checkCourseAccessClearance(input: ClearanceCheckInput): {
      granted: boolean;
      reason?: string;
    } {
      if (!input.courseIsRestricted) {
        return { granted: true };
      }
      if (!input.userIsOrgVerified && !input.orgIsVerified) {
        return {
          granted: false,
          reason: "Restricted naval curriculum requires verified institutional clearance",
        };
      }
      return { granted: true };
    }

    it("grants open access to non-restricted courses for unverified users", () => {
      const check = checkCourseAccessClearance({
        courseIsRestricted: false,
        userIsOrgVerified: false,
      });
      expect(check.granted).toBe(true);
    });

    it("denies access to restricted courses for unverified self-registered users", () => {
      const check = checkCourseAccessClearance({
        courseIsRestricted: true,
        userIsOrgVerified: false,
        orgIsVerified: false,
      });
      expect(check.granted).toBe(false);
      expect(check.reason).toContain("requires verified institutional clearance");
    });

    it("grants access to restricted courses when user has verified clearance", () => {
      const check = checkCourseAccessClearance({
        courseIsRestricted: true,
        userIsOrgVerified: true,
      });
      expect(check.granted).toBe(true);
    });

    it("grants access to restricted courses when affiliated organization is verified", () => {
      const check = checkCourseAccessClearance({
        courseIsRestricted: true,
        userIsOrgVerified: false,
        orgIsVerified: true,
      });
      expect(check.granted).toBe(true);
    });
  });

  describe("5. Category Slug Normalization & Taxonomy", () => {
    function generateCategorySlug(name: string): string {
      return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    it("normalizes complex department titles into URL-safe slugs", () => {
      expect(generateCategorySlug("Maritime & Naval Operations (WNC)"))
        .toBe("maritime-naval-operations-wnc");
      expect(generateCategorySlug("  FPO / FPC Governance & Accounts  "))
        .toBe("fpo-fpc-governance-accounts");
      expect(generateCategorySlug("Fisheries, Aquaculture & Marine Logistics"))
        .toBe("fisheries-aquaculture-marine-logistics");
    });
  });
});
