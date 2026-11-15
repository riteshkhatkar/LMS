import { prisma } from "@/lib/db/prisma";
import { type SessionUser } from "@/lib/auth/session";
import { QuizType, QuizAttemptStatus, Role } from "@prisma/client";

export interface QuizAccessCheck {
  allowed: boolean;
  reason?:
    | "NOT_ENROLLED"
    | "RESTRICTED_ACCESS"
    | "LOCKED_PROGRESS"
    | "MAX_ATTEMPTS_REACHED"
    | "NOT_FOUND";
  message?: string;
  activeAttemptId?: string;
  attemptsUsed?: number;
  maxAttempts?: number;
  requiredContentPercent?: number;
  currentProgressPercent?: number;
}

export async function checkQuizAccess(
  user: SessionUser,
  quizId: string
): Promise<QuizAccessCheck> {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      course: {
        include: {
          assignments: true,
        },
      },
    },
  });

  if (!quiz) {
    return { allowed: false, reason: "NOT_FOUND", message: "Quiz not found" };
  }

  // Admins and Instructors always have preview access
  if (user.role === Role.ADMIN || user.role === Role.INSTRUCTOR) {
    return { allowed: true, attemptsUsed: 0, maxAttempts: quiz.maxAttempts };
  }

  // 1. Enrollment check
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: quiz.courseId,
      },
    },
  });

  if (!enrollment) {
    return {
      allowed: false,
      reason: "NOT_ENROLLED",
      message: "You must be enrolled in this course to take this assessment.",
    };
  }

  // 2. Organization / Restricted Course access check
  if (quiz.course.isRestricted) {
    const isAssigned = quiz.course.assignments.some(
      (a) => a.organizationId === user.organizationId
    );
    if (!isAssigned) {
      return {
        allowed: false,
        reason: "RESTRICTED_ACCESS",
        message: "This assessment is restricted to verified organization personnel.",
      };
    }
  }

  // 3. Final Assessment Lock: Required Learning Content check
  if (quiz.type === QuizType.FINAL) {
    const requiredPercent = quiz.course.requiredContentPercent;
    const currentProgress = enrollment.progressPct;

    if (currentProgress < requiredPercent) {
      return {
        allowed: false,
        reason: "LOCKED_PROGRESS",
        message: `Final Assessment is locked. You must complete at least ${requiredPercent}% of the course lessons before attempting the final assessment (Current: ${Math.round(currentProgress)}%).`,
        requiredContentPercent: requiredPercent,
        currentProgressPercent: currentProgress,
      };
    }
  }

  // 4. Attempt Limits check
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      userId: user.id,
      quizId: quiz.id,
    },
    orderBy: { createdAt: "desc" },
  });

  // Check if there is an in-progress attempt to resume
  const activeAttempt = attempts.find(
    (a) => a.status === QuizAttemptStatus.IN_PROGRESS && (!a.expiresAt || new Date() <= a.expiresAt)
  );

  const completedAttempts = attempts.filter(
    (a) => a.status === QuizAttemptStatus.SUBMITTED || a.status === QuizAttemptStatus.EXPIRED
  );

  if (!activeAttempt && completedAttempts.length >= quiz.maxAttempts) {
    return {
      allowed: false,
      reason: "MAX_ATTEMPTS_REACHED",
      message: `You have reached the maximum allowed attempts (${quiz.maxAttempts}) for this assessment.`,
      attemptsUsed: completedAttempts.length,
      maxAttempts: quiz.maxAttempts,
    };
  }

  return {
    allowed: true,
    activeAttemptId: activeAttempt?.id,
    attemptsUsed: completedAttempts.length,
    maxAttempts: quiz.maxAttempts,
  };
}

/**
 * Strips secret answer keys and teacher explanations from questions sent to the client during an active attempt.
 */
export function sanitizeQuestionsForLearner(
  questions: Array<{
    id: string;
    prompt: string;
    explanation?: string | null;
    sortOrder: number;
    points: number;
    options: Array<{ id: string; text: string; sortOrder: number; isCorrect?: boolean }>;
  }>,
  includeAnswers: boolean = false
) {
  return questions.map((q) => {
    const sanitizedOptions = q.options.map((opt) => {
      const optionObj: { id: string; text: string; sortOrder: number; isCorrect?: boolean } = {
        id: opt.id,
        text: opt.text,
        sortOrder: opt.sortOrder,
      };
      if (includeAnswers && opt.isCorrect !== undefined) {
        optionObj.isCorrect = opt.isCorrect;
      }
      return optionObj;
    });

    const questionObj: {
      id: string;
      prompt: string;
      sortOrder: number;
      points: number;
      options: typeof sanitizedOptions;
      explanation?: string;
    } = {
      id: q.id,
      prompt: q.prompt,
      sortOrder: q.sortOrder,
      points: q.points,
      options: sanitizedOptions,
    };

    if (includeAnswers && q.explanation) {
      questionObj.explanation = q.explanation;
    }

    return questionObj;
  });
}
