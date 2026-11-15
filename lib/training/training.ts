import { LearnerGroup, Role } from "@prisma/client";

export interface UserAccessContext {
  role: Role | string;
  learnerGroup?: LearnerGroup | string | null;
}

export interface ProgrammeAccessContext {
  isRestricted: boolean;
  targetGroup?: LearnerGroup | string | null;
}

/**
 * Confidentiality & Clearance Guard:
 * Strictly segregates restricted military/naval orientation from civilian learners.
 * Only ADMIN or NAVAL_OFFICER can view or access restricted programmes.
 */
export function canUserAccessProgramme(
  user: UserAccessContext,
  programme: ProgrammeAccessContext
): boolean {
  if (user.role === Role.ADMIN || user.role === "ADMIN") {
    return true;
  }

  if (programme.isRestricted) {
    return user.learnerGroup === LearnerGroup.NAVAL_OFFICER || user.learnerGroup === "NAVAL_OFFICER";
  }

  return true;
}

export interface ConstituentCourseProgress {
  courseId: string;
  title: string;
  slug: string;
  isRequired: boolean;
  sortOrder: number;
  isEnrolled: boolean;
  progressPct: number;
  isCompleted: boolean;
  assessmentStatus: string;
  finalScore?: number | null;
  finalGrade?: string | null;
}

export interface ProgrammeProgressResult {
  totalCourses: number;
  totalRequiredCourses: number;
  completedCoursesCount: number;
  completedRequiredCount: number;
  overallProgressPct: number;
  isCompleted: boolean;
  allRequiredPassed: boolean;
  coursesProgress: ConstituentCourseProgress[];
}

/**
 * Calculates learner progress across all constituent courses of a Training Programme.
 */
export function calculateProgrammeProgress(
  programmeCourses: Array<{
    courseId: string;
    isRequired: boolean;
    sortOrder: number;
    course: {
      id: string;
      title: string;
      slug: string;
    };
  }>,
  enrollments: Array<{
    courseId: string;
    progressPct: number;
    isCompleted: boolean;
    assessmentStatus: string;
    finalScore?: number | null;
    finalGrade?: string | null;
  }>
): ProgrammeProgressResult {
  const enrollmentMap = new Map<string, (typeof enrollments)[0]>();
  for (const enr of enrollments) {
    enrollmentMap.set(enr.courseId, enr);
  }

  const coursesProgress: ConstituentCourseProgress[] = [];
  let totalPctSum = 0;
  let requiredCount = 0;
  let completedRequired = 0;
  let completedCount = 0;

  for (const pc of programmeCourses) {
    const enr = enrollmentMap.get(pc.courseId);
    const isEnrolled = !!enr;
    const progressPct = enr?.progressPct ?? 0;
    // A course is strictly complete if marked isCompleted OR progressPct >= 100 with PASSED assessment
    const isCompleted = !!(
      enr &&
      (enr.isCompleted || (enr.progressPct >= 100 && enr.assessmentStatus === "PASSED"))
    );

    if (pc.isRequired) {
      requiredCount++;
      if (isCompleted) {
        completedRequired++;
      }
    }

    if (isCompleted) {
      completedCount++;
    }

    totalPctSum += progressPct;

    coursesProgress.push({
      courseId: pc.courseId,
      title: pc.course.title,
      slug: pc.course.slug,
      isRequired: pc.isRequired,
      sortOrder: pc.sortOrder,
      isEnrolled,
      progressPct,
      isCompleted,
      assessmentStatus: enr?.assessmentStatus ?? "NOT_STARTED",
      finalScore: enr?.finalScore ?? null,
      finalGrade: enr?.finalGrade ?? null,
    });
  }

  const totalCourses = programmeCourses.length;
  const overallProgressPct =
    totalCourses > 0 ? Math.round((totalPctSum / totalCourses) * 10) / 10 : 0;
  const allRequiredPassed = requiredCount === 0 || completedRequired >= requiredCount;
  const isCompleted = totalCourses > 0 && allRequiredPassed;

  return {
    totalCourses,
    totalRequiredCourses: requiredCount,
    completedCoursesCount: completedCount,
    completedRequiredCount: completedRequired,
    overallProgressPct,
    isCompleted,
    allRequiredPassed,
    coursesProgress,
  };
}

/**
 * Creates URL-friendly slug from string.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
