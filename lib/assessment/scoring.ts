import { prisma } from "@/lib/db/prisma";
import { applyGradingRule, DEFAULT_GRADING_RULE, type GradeResult } from "@/lib/grading";
import { QuizAttemptStatus, QuizType } from "@prisma/client";

export interface EvaluationResult {
  attemptId: string;
  status: QuizAttemptStatus;
  pointsEarned: number;
  totalPoints: number;
  scorePercent: number;
  passed: boolean;
  grade: string | null;
  provisional: boolean;
  gradeLabel: string;
  gradingRuleVersion: number;
  isEligibleForCertificate: boolean;
}

/**
 * Authoritatively evaluates and finalizes a quiz attempt on the server.
 * Uses integer-safe scoring and adheres strictly to the applicable grading rule version.
 */
export async function evaluateAttempt(attemptId: string): Promise<EvaluationResult> {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch attempt with quiz, questions, options, and submitted answers
    const attempt = await tx.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            course: true,
            questions: {
              orderBy: { sortOrder: "asc" },
              include: {
                options: {
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
          },
        },
        answers: true,
        user: true,
      },
    });

    if (!attempt) {
      throw new Error("ATTEMPT_NOT_FOUND");
    }

    // Idempotency: If already submitted, return recorded outcome without mutation
    if (attempt.status === QuizAttemptStatus.SUBMITTED && attempt.scorePercent !== null) {
      return {
        attemptId: attempt.id,
        status: attempt.status,
        pointsEarned: attempt.pointsEarned ?? 0,
        totalPoints: attempt.totalPoints ?? 0,
        scorePercent: attempt.scorePercent,
        passed: attempt.passed ?? false,
        grade: attempt.grade,
        provisional: attempt.provisional,
        gradeLabel: attempt.grade ? `Grade ${attempt.grade}` : attempt.passed ? "Pass" : "Fail",
        gradingRuleVersion: attempt.gradingRuleVersion,
        isEligibleForCertificate: attempt.quiz.type === QuizType.FINAL && (attempt.passed ?? false),
      };
    }

    // Check timer expiration
    const now = new Date();
    const isExpired = attempt.expiresAt ? now > attempt.expiresAt : false;

    // 2. Fetch applicable grading rule version captured at attempt start
    const gradingRule =
      (await tx.gradingRule.findUnique({
        where: {
          courseId_version: {
            courseId: attempt.quiz.courseId,
            version: attempt.gradingRuleVersion,
          },
        },
      })) || DEFAULT_GRADING_RULE;

    // 3. Calculate points and evaluate each question
    const questions = attempt.quiz.questions;
    let totalPoints = 0;
    let pointsEarned = 0;

    const answerMap = new Map<string, string | null>();
    for (const ans of attempt.answers) {
      answerMap.set(ans.questionId, ans.selectedOptionId);
    }

    for (const q of questions) {
      totalPoints += q.points;
      const selectedOptionId = answerMap.get(q.id);

      let isCorrect = false;
      if (selectedOptionId) {
        const matchingOption = q.options.find((opt) => opt.id === selectedOptionId);
        if (matchingOption && matchingOption.isCorrect) {
          isCorrect = true;
          pointsEarned += q.points;
        }
      }

      // Upsert answer evaluation
      const pointsAwarded = isCorrect ? q.points : 0;
      await tx.attemptAnswer.upsert({
        where: {
          attemptId_questionId: {
            attemptId: attempt.id,
            questionId: q.id,
          },
        },
        update: {
          selectedOptionId,
          isCorrect,
          pointsAwarded,
        },
        create: {
          attemptId: attempt.id,
          questionId: q.id,
          selectedOptionId,
          isCorrect,
          pointsAwarded,
        },
      });
    }

    // 4. Calculate score percentage (rounded to 2 decimal places)
    const rawPercent = totalPoints > 0 ? (pointsEarned / totalPoints) * 100 : 0;
    const scorePercent = Math.round(rawPercent * 100) / 100;

    // 5. Apply deterministic decimal-safe grading rule
    const gradeResult: GradeResult = applyGradingRule(scorePercent, {
      id: gradingRule.id,
      courseId: attempt.quiz.courseId,
      passThreshold: gradingRule.passThreshold,
      gradeAThreshold: gradingRule.gradeAThreshold,
      gradeBMin: gradingRule.gradeBMin,
      gradeBMax: gradingRule.gradeBMax,
      version: gradingRule.version,
      createdAt: gradingRule.createdAt,
    });

    const passed = !isExpired && gradeResult.outcome === "PASS";
    const status = isExpired ? QuizAttemptStatus.EXPIRED : QuizAttemptStatus.SUBMITTED;

    // 6. Update the QuizAttempt record
    await tx.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        status,
        pointsEarned,
        totalPoints,
        scorePercent,
        passed,
        grade: passed ? gradeResult.grade : null,
        provisional: gradeResult.provisional,
        submittedAt: now,
      },
    });

    const isFinalExam = attempt.quiz.type === QuizType.FINAL;
    let isEligibleForCertificate = false;

    // 7. If Final Assessment, update Enrollment and CertificateEligibility
    if (isFinalExam) {
      const enrollment = await tx.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: attempt.userId,
            courseId: attempt.quiz.courseId,
          },
        },
      });

      if (enrollment) {
        const learningCompleted = enrollment.progressPct >= 100;
        const courseCompleted = learningCompleted && passed;

        await tx.enrollment.update({
          where: { id: enrollment.id },
          data: {
            finalScore: scorePercent,
            finalGrade: passed ? (gradeResult.grade || "Pass") : "Fail",
            assessmentStatus: passed ? "PASSED" : "FAILED",
            isCompleted: courseCompleted,
            completedAt: courseCompleted ? (enrollment.completedAt || now) : null,
          },
        });

        // Persist immutable CertificateEligibility record for Phase 4
        if (courseCompleted) {
          isEligibleForCertificate = true;
          await tx.certificateEligibility.upsert({
            where: {
              userId_courseId: {
                userId: attempt.userId,
                courseId: attempt.quiz.courseId,
              },
            },
            update: {
              attemptId: attempt.id,
              finalScore: scorePercent,
              grade: gradeResult.grade || "Pass",
              gradingRuleVersion: attempt.gradingRuleVersion,
              completedAt: now,
              status: "ELIGIBLE",
            },
            create: {
              userId: attempt.userId,
              courseId: attempt.quiz.courseId,
              attemptId: attempt.id,
              finalScore: scorePercent,
              grade: gradeResult.grade || "Pass",
              gradingRuleVersion: attempt.gradingRuleVersion,
              completedAt: now,
              status: "ELIGIBLE",
            },
          });
        }
      }
    }

    return {
      attemptId: attempt.id,
      status,
      pointsEarned,
      totalPoints,
      scorePercent,
      passed,
      grade: passed ? gradeResult.grade : null,
      provisional: gradeResult.provisional,
      gradeLabel: gradeResult.label,
      gradingRuleVersion: attempt.gradingRuleVersion,
      isEligibleForCertificate,
    };
  });
}
