import {
  PrismaClient,
  Role,
  LearnerGroup,
  LessonMediaType,
  PublishStatus,
  QuizType,
  QuizAttemptStatus,
  TrainingProgrammeStatus,
  ContentVerificationStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { demoCourses } from "../lib/data/fixtures/courses";
import { getOrCreateIssuerKey } from "../lib/certification/keys";
import { issueCertificateForLearner, revokeCertificate } from "../lib/certification/issuance";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Learn LMS database seeding (Phase 3 Assessment Engine)...");

  // 1. Seed Organizations
  console.log("Seeding Organizations...");
  const navalOrg = await prisma.organization.upsert({
    where: { code: "WNC-TRG" },
    update: {
      name: "Western Naval Command — Training Division",
      description: "Naval operational command training and digital technical readiness unit.",
    },
    create: {
      name: "Western Naval Command — Training Division",
      code: "WNC-TRG",
      description: "Naval operational command training and digital technical readiness unit.",
    },
  });

  const fpoOrg = await prisma.organization.upsert({
    where: { code: "MAHA-FPO" },
    update: {
      name: "Maharashtra Agri FPO Federation",
      description: "Apex collective supporting agricultural producer organisations.",
    },
    create: {
      name: "Maharashtra Agri FPO Federation",
      code: "MAHA-FPO",
      description: "Apex collective supporting agricultural producer organisations.",
    },
  });

  const fpcOrg = await prisma.organization.upsert({
    where: { code: "SAHYADRI-FPC" },
    update: {
      name: "Sahyadri Farmer Producer Company",
      description: "Producer company specializing in horticulture value addition and export.",
    },
    create: {
      name: "Sahyadri Farmer Producer Company",
      code: "SAHYADRI-FPC",
      description: "Producer company specializing in horticulture value addition and export.",
    },
  });

  // 1b. Seed Categories
  console.log("Seeding Course Categories...");
  const categoriesData = [
    { name: "FPO Governance", slug: "fpo-governance", description: "Statutory compliance, bylaws, and board governance for FPOs.", sortOrder: 1 },
    { name: "FPC Operations", slug: "fpc-operations", description: "Business planning, accounting, GST, and supply chain operations.", sortOrder: 2 },
    { name: "Digital Skills", slug: "digital-skills", description: "Productivity tools, digital record keeping, and MIS reporting.", sortOrder: 3 },
    { name: "Professional Development", slug: "professional-dev", description: "Leadership, communication, and managerial training.", sortOrder: 4 },
    { name: "Application Training", slug: "app-training", description: "Hands-on walkthroughs of institutional enterprise software.", sortOrder: 5 },
    { name: "Naval Training", slug: "naval-training", description: "Restricted operational command and technical readiness training.", sortOrder: 6 },
  ];

  const seededCategories: Record<string, string> = {};
  for (const cat of categoriesData) {
    const record = await prisma.courseCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, sortOrder: cat.sortOrder, isActive: true },
      create: { name: cat.name, slug: cat.slug, description: cat.description, sortOrder: cat.sortOrder, isActive: true },
    });
    seededCategories[cat.slug] = record.id;
  }

  // 2. Hash default passwords
  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
  const instructorPasswordHash = await bcrypt.hash("Instructor@123", 10);
  const learnerPasswordHash = await bcrypt.hash("Learner@123", 10);

  // 3. Seed Users
  console.log("Seeding Users...");
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@learnlms.local" },
    update: {
      name: "Aaditya Deshmukh (Admin)",
      role: Role.ADMIN,
      passwordHash: adminPasswordHash,
      isOrgVerified: true,
    },
    create: {
      email: "admin@learnlms.local",
      name: "Aaditya Deshmukh (Admin)",
      role: Role.ADMIN,
      passwordHash: adminPasswordHash,
      isOrgVerified: true,
    },
  });

  const instructorUser = await prisma.user.upsert({
    where: { email: "instructor@learnlms.local" },
    update: {
      name: "Commander Rajesh Sharma",
      role: Role.INSTRUCTOR,
      passwordHash: instructorPasswordHash,
      organizationId: navalOrg.id,
      isOrgVerified: true,
    },
    create: {
      email: "instructor@learnlms.local",
      name: "Commander Rajesh Sharma",
      role: Role.INSTRUCTOR,
      passwordHash: instructorPasswordHash,
      organizationId: navalOrg.id,
      isOrgVerified: true,
    },
  });

  const learnerUser = await prisma.user.upsert({
    where: { email: "learner@learnlms.local" },
    update: {
      name: "Lt. Vikram Rathore",
      role: Role.LEARNER,
      learnerGroup: LearnerGroup.NAVAL_OFFICER,
      organizationId: navalOrg.id,
      isOrgVerified: true,
      passwordHash: learnerPasswordHash,
    },
    create: {
      email: "learner@learnlms.local",
      name: "Lt. Vikram Rathore",
      role: Role.LEARNER,
      learnerGroup: LearnerGroup.NAVAL_OFFICER,
      organizationId: navalOrg.id,
      isOrgVerified: true,
      passwordHash: learnerPasswordHash,
    },
  });

  const fpoUser = await prisma.user.upsert({
    where: { email: "fpo.user@learnlms.local" },
    update: {
      name: "Suresh Patil",
      role: Role.LEARNER,
      learnerGroup: LearnerGroup.FPO,
      organizationId: fpoOrg.id,
      isOrgVerified: true,
      passwordHash: learnerPasswordHash,
    },
    create: {
      email: "fpo.user@learnlms.local",
      name: "Suresh Patil",
      role: Role.LEARNER,
      learnerGroup: LearnerGroup.FPO,
      organizationId: fpoOrg.id,
      isOrgVerified: true,
      passwordHash: learnerPasswordHash,
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: "student.user@learnlms.local" },
    update: {
      name: "Ananya Kulkarni",
      role: Role.LEARNER,
      learnerGroup: LearnerGroup.STUDENT,
      isOrgVerified: false,
      passwordHash: learnerPasswordHash,
    },
    create: {
      email: "student.user@learnlms.local",
      name: "Ananya Kulkarni",
      role: Role.LEARNER,
      learnerGroup: LearnerGroup.STUDENT,
      isOrgVerified: false,
      passwordHash: learnerPasswordHash,
    },
  });

  // 4. Seed Courses, Sections & Lessons
  console.log("Seeding Courses, Sections, and Lessons...");
  for (const c of demoCourses) {
    const catSlug = c.category.toLowerCase().includes("fpo")
      ? "fpo-governance"
      : c.category.toLowerCase().includes("fpc")
      ? "fpc-operations"
      : c.category.toLowerCase().includes("naval")
      ? "naval-training"
      : c.category.toLowerCase().includes("application")
      ? "app-training"
      : "digital-skills";
    const categoryId = seededCategories[catSlug];

    const course = await prisma.course.upsert({
      where: { slug: c.slug },
      update: {
        title: c.title,
        subtitle: c.subtitle,
        excerpt: c.excerpt,
        description: c.description,
        learningOutcomes: c.learningOutcomes,
        prerequisites: c.prerequisites,
        category: c.category,
        categoryId,
        instructorId: instructorUser.id,
        topicTags: c.topicTags,
        level: c.level,
        language: c.language,
        durationMinutes: c.durationMinutes,
        thumbnail: c.thumbnail,
        instructorName: c.instructor.name,
        instructorTitle: c.instructor.title,
        instructorBio: c.instructor.bio,
        instructorIsDemo: c.instructor.isDemo,
        quizCount: c.quizCount,
        certificateAvailable: c.certificateAvailable,
        publishStatus: PublishStatus.published,
        requiredContentPercent: c.assessmentPolicy.requiredContentPercent,
        finalQuizQuestions: c.assessmentPolicy.finalQuizQuestions,
        timeLimitMinutes: c.assessmentPolicy.timeLimitMinutes,
        maxAttempts: c.assessmentPolicy.maxAttempts,
        passingScorePercent: c.assessmentPolicy.passingScorePercent,
        certificateOnPass: c.assessmentPolicy.certificateOnPass,
        enrollmentCount: c.enrollmentCount,
      },
      create: {
        slug: c.slug,
        title: c.title,
        subtitle: c.subtitle,
        excerpt: c.excerpt,
        description: c.description,
        learningOutcomes: c.learningOutcomes,
        prerequisites: c.prerequisites,
        category: c.category,
        categoryId,
        instructorId: instructorUser.id,
        topicTags: c.topicTags,
        level: c.level,
        language: c.language,
        durationMinutes: c.durationMinutes,
        thumbnail: c.thumbnail,
        instructorName: c.instructor.name,
        instructorTitle: c.instructor.title,
        instructorBio: c.instructor.bio,
        instructorIsDemo: c.instructor.isDemo,
        quizCount: c.quizCount,
        certificateAvailable: c.certificateAvailable,
        publishStatus: PublishStatus.published,
        requiredContentPercent: c.assessmentPolicy.requiredContentPercent,
        finalQuizQuestions: c.assessmentPolicy.finalQuizQuestions,
        timeLimitMinutes: c.assessmentPolicy.timeLimitMinutes,
        maxAttempts: c.assessmentPolicy.maxAttempts,
        passingScorePercent: c.assessmentPolicy.passingScorePercent,
        certificateOnPass: c.assessmentPolicy.certificateOnPass,
        enrollmentCount: c.enrollmentCount,
      },
    });

    // Seed default GradingRule version 1 for this course
    await prisma.gradingRule.upsert({
      where: {
        courseId_version: {
          courseId: course.id,
          version: 1,
        },
      },
      update: {
        passThreshold: 60.0,
        gradeBMin: 70.0,
        gradeBMax: 75.0,
        gradeAThreshold: 90.0,
        isActive: true,
      },
      create: {
        courseId: course.id,
        version: 1,
        passThreshold: 60.0,
        gradeBMin: 70.0,
        gradeBMax: 75.0,
        gradeAThreshold: 90.0,
        isActive: true,
        isDefault: true,
      },
    });

    // Seed Sections and Lessons
    for (let sIdx = 0; sIdx < c.sections.length; sIdx++) {
      const s = c.sections[sIdx];
      let section = await prisma.section.findFirst({
        where: { courseId: course.id, sortOrder: sIdx },
      });

      if (!section) {
        section = await prisma.section.create({
          data: {
            courseId: course.id,
            title: s.title,
            sortOrder: sIdx,
            hasQuiz: s.hasQuiz || sIdx === 0, // Ensure first section has quiz
          },
        });
      } else {
        section = await prisma.section.update({
          where: { id: section.id },
          data: { title: s.title, hasQuiz: s.hasQuiz || sIdx === 0 },
        });
      }

      for (let lIdx = 0; lIdx < s.lessons.length; lIdx++) {
        const l = s.lessons[lIdx];
        const mediaType =
          l.mediaType === "video"
            ? LessonMediaType.video
            : l.mediaType === "pdf"
            ? LessonMediaType.pdf
            : LessonMediaType.text;

        let lesson = await prisma.lesson.findFirst({
          where: { sectionId: section.id, sortOrder: lIdx },
        });

        const textContent =
          mediaType === LessonMediaType.text
            ? `### ${l.title}\n\nWelcome to this lesson in **${s.title}**.\n\nKey learning objectives for this unit:\n- Understand the core terminology and workflows\n- Review practical operational scenarios\n- Apply concepts to everyday administrative tasks.\n\n*Review the key concepts above and select "Mark as Complete" to record your progress.*`
            : null;

        if (!lesson) {
          await prisma.lesson.create({
            data: {
              sectionId: section.id,
              title: l.title,
              mediaType,
              durationMinutes: l.durationMinutes,
              isPreview: l.isPreview,
              hasQuiz: l.hasQuiz,
              sortOrder: lIdx,
              textContent,
            },
          });
        } else {
          await prisma.lesson.update({
            where: { id: lesson.id },
            data: {
              title: l.title,
              mediaType,
              durationMinutes: l.durationMinutes,
              isPreview: l.isPreview,
              hasQuiz: l.hasQuiz,
              textContent: textContent || undefined,
            },
          });
        }
      }
    }
  }

  // 5. Seed In-Course Quizzes & Final Assessments with Questions
  console.log("Seeding Quizzes, Questions, and MCQ Options...");

  const allCourses = await prisma.course.findMany({
    include: { sections: true },
  });

  for (const crs of allCourses) {
    const firstSection = crs.sections[0];

    // A. Type A — In-Course Section Quiz
    let inCourseQuiz = await prisma.quiz.findFirst({
      where: { courseId: crs.id, type: QuizType.IN_COURSE },
    });

    if (!inCourseQuiz) {
      inCourseQuiz = await prisma.quiz.create({
        data: {
          courseId: crs.id,
          sectionId: firstSection?.id || null,
          type: QuizType.IN_COURSE,
          title: `${crs.title} — Fundamentals Check`,
          description: "Verify your comprehension of the core section concepts before proceeding.",
          passingPercent: 60,
          maxAttempts: 5,
          isRequired: true,
          isPublished: true,
          sortOrder: 1,
        },
      });

      // Questions for In-Course Quiz
      await createQuestionWithOptions(inCourseQuiz.id, 1, {
        prompt: "What is the primary operational objective of the training module?",
        explanation: "The training module focuses on digital readiness, standard procedures, and auditable accountability.",
        points: 1,
        options: [
          { text: "Operational competency and compliance workflow mastery", isCorrect: true },
          { text: "Purely theoretical study without practical workflows", isCorrect: false },
          { text: "Replacing all internal auditing tools with external spreadsheets", isCorrect: false },
          { text: "Optional reading without required assessments", isCorrect: false },
        ],
      });

      await createQuestionWithOptions(inCourseQuiz.id, 2, {
        prompt: "How are sensitive system changes or master records tracked in the platform?",
        explanation: "All administrative operations generate an immutable audit log timestamped in PostgreSQL.",
        points: 1,
        options: [
          { text: "Changes are automatically saved to audit logs with timestamps and user references", isCorrect: true },
          { text: "Changes are deleted after 24 hours to conserve database space", isCorrect: false },
          { text: "Users manually write log entries in paper notebooks", isCorrect: false },
          { text: "Logs are only kept if an instructor manually enables debug mode", isCorrect: false },
        ],
      });
    }

    // B. Type B — Final Course Assessment
    let finalQuiz = await prisma.quiz.findFirst({
      where: { courseId: crs.id, type: QuizType.FINAL },
    });

    if (!finalQuiz) {
      finalQuiz = await prisma.quiz.create({
        data: {
          courseId: crs.id,
          type: QuizType.FINAL,
          title: `${crs.title} — Final Certification Assessment`,
          description: "Comprehensive final evaluation. Achieving strictly above 60% passes the course and qualifies for certificate generation.",
          passingPercent: 60,
          timeLimitSec: 1800, // 30 minutes
          maxAttempts: 3,
          isRequired: true,
          isPublished: true,
          sortOrder: 10,
        },
      });

      // Question 1
      await createQuestionWithOptions(finalQuiz.id, 1, {
        prompt: "Which stakeholder group is responsible for statutory ROC and annual compliance oversight?",
        explanation: "Under company law, the Board of Directors and designated company officers bear fiduciary responsibility.",
        points: 2,
        options: [
          { text: "The Board of Directors and authorized administrative officers", isCorrect: true },
          { text: "Only temporary casual laborers", isCorrect: false },
          { text: "Third-party courier delivery vendors", isCorrect: false },
          { text: "Unregistered external casual visitors", isCorrect: false },
        ],
      });

      // Question 2
      await createQuestionWithOptions(finalQuiz.id, 2, {
        prompt: "What is the consequence of failing to record farmer produce collections daily in the logistics register?",
        explanation: "Failure to log inward stock causes inventory reconciliation discrepancies and delayed member payments.",
        points: 2,
        options: [
          { text: "Inventory reconciliation errors and payment disbursement delays", isCorrect: true },
          { text: "Automatic doubling of warehouse storage capacity", isCorrect: false },
          { text: "Immediate tax exemption granted by government authorities", isCorrect: false },
          { text: "No operational or financial impact whatsoever", isCorrect: false },
        ],
      });

      // Question 3
      await createQuestionWithOptions(finalQuiz.id, 3, {
        prompt: "According to the institutional grading policy (§7.3), which outcome applies to an assessment score of exactly 60%?",
        explanation: "The grading specification mandates that scores strictly above 60% pass; exactly 60% fails.",
        points: 2,
        options: [
          { text: "FAIL — The threshold requires strictly above 60.0% to pass", isCorrect: true },
          { text: "PASS with Grade A", isCorrect: false },
          { text: "PASS with Grade B", isCorrect: false },
          { text: "Automatic rounding to 75%", isCorrect: false },
        ],
      });

      // Question 4
      await createQuestionWithOptions(finalQuiz.id, 4, {
        prompt: "Which security practice is mandatory when handling sensitive member records and login credentials?",
        explanation: "Password confidentiality and two-factor authentication protect institutional integrity.",
        points: 2,
        options: [
          { text: "Maintaining credential confidentiality and enabling multi-factor protection", isCorrect: true },
          { text: "Writing master passwords on sticky notes attached to public terminals", isCorrect: false },
          { text: "Sharing user passwords across all members in a public group chat", isCorrect: false },
          { text: "Disabling all security controls to speed up login times", isCorrect: false },
        ],
      });

      // Question 5
      await createQuestionWithOptions(finalQuiz.id, 5, {
        prompt: "What happens to digital certificate eligibility once a learner passes the mandatory final assessment and completes all lessons?",
        explanation: "Meeting all completion criteria persists an immutable CertificateEligibility record in PostgreSQL.",
        points: 2,
        options: [
          { text: "A CertificateEligibility record is persisted in PostgreSQL for verification in Phase 4", isCorrect: true },
          { text: "The learner account is permanently deleted from the database", isCorrect: false },
          { text: "All completed lesson records are immediately wiped", isCorrect: false },
          { text: "The course is locked forever and cannot be reviewed", isCorrect: false },
        ],
      });
    }
  }

  // 6. Seed Sample Assessment Attempts & Certificate Eligibility
  console.log("Seeding Sample Quiz Attempts & Certificate Eligibility...");
  const mainAppCourse = allCourses.find((c) => c.slug === "getting-started-main-application");

  if (mainAppCourse) {
    // 6a. Ensure learner enrollment is 100% complete
    const learnerEnrollment = await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: learnerUser.id,
          courseId: mainAppCourse.id,
        },
      },
      update: {
        progressPct: 100.0,
        isCompleted: true,
        finalScore: 92.0,
        finalGrade: "A",
        assessmentStatus: "PASSED",
        completedAt: new Date(),
      },
      create: {
        userId: learnerUser.id,
        courseId: mainAppCourse.id,
        progressPct: 100.0,
        isCompleted: true,
        finalScore: 92.0,
        finalGrade: "A",
        assessmentStatus: "PASSED",
        completedAt: new Date(),
      },
    });

    // Mark all lessons in mainAppCourse as completed for learnerUser
    const allMainAppLessons = mainAppCourse.sections.flatMap((s) => s.id);
    const lessons = await prisma.lesson.findMany({
      where: { sectionId: { in: allMainAppLessons } },
    });

    for (const l of lessons) {
      await prisma.activityProgress.upsert({
        where: {
          userId_lessonId: {
            userId: learnerUser.id,
            lessonId: l.id,
          },
        },
        update: { completed: true, progressPct: 100 },
        create: {
          userId: learnerUser.id,
          lessonId: l.id,
          completed: true,
          progressPct: 100,
        },
      });
    }

    // 6b. Seed passed final exam attempt for learnerUser
    const mainFinalQuiz = await prisma.quiz.findFirst({
      where: { courseId: mainAppCourse.id, type: QuizType.FINAL },
    });

    if (mainFinalQuiz) {
      const existingAttempt = await prisma.quizAttempt.findFirst({
        where: { userId: learnerUser.id, quizId: mainFinalQuiz.id },
      });

      if (!existingAttempt) {
        const passedAttempt = await prisma.quizAttempt.create({
          data: {
            userId: learnerUser.id,
            quizId: mainFinalQuiz.id,
            status: QuizAttemptStatus.SUBMITTED,
            attemptNum: 1,
            scorePercent: 92.0,
            pointsEarned: 10,
            totalPoints: 10,
            passed: true,
            grade: "A",
            provisional: false,
            gradingRuleVersion: 1,
            startedAt: new Date(Date.now() - 3600000),
            submittedAt: new Date(Date.now() - 1800000),
          },
        });

        // Seed CertificateEligibility record (Phase 4 boundary)
        await prisma.certificateEligibility.upsert({
          where: {
            userId_courseId: {
              userId: learnerUser.id,
              courseId: mainAppCourse.id,
            },
          },
          update: {
            attemptId: passedAttempt.id,
            finalScore: 92.0,
            grade: "A",
            gradingRuleVersion: 1,
            status: "ELIGIBLE",
            completedAt: new Date(),
          },
          create: {
            userId: learnerUser.id,
            courseId: mainAppCourse.id,
            attemptId: passedAttempt.id,
            finalScore: 92.0,
            grade: "A",
            gradingRuleVersion: 1,
            status: "ELIGIBLE",
            completedAt: new Date(),
          },
        });
      }
    }
  }

  // 6c. Seed a failed attempt for studentUser to illustrate retry flow
  const fpoCourse = allCourses.find((c) => c.slug === "fpo-governance-essentials");
  if (fpoCourse) {
    const fpoFinalQuiz = await prisma.quiz.findFirst({
      where: { courseId: fpoCourse.id, type: QuizType.FINAL },
    });

    if (fpoFinalQuiz) {
      await prisma.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: studentUser.id,
            courseId: fpoCourse.id,
          },
        },
        update: {
          progressPct: 80.0,
          assessmentStatus: "FAILED",
          finalScore: 55.0,
          isCompleted: false,
        },
        create: {
          userId: studentUser.id,
          courseId: fpoCourse.id,
          progressPct: 80.0,
          assessmentStatus: "FAILED",
          finalScore: 55.0,
          isCompleted: false,
        },
      });

      const existingFailed = await prisma.quizAttempt.findFirst({
        where: { userId: studentUser.id, quizId: fpoFinalQuiz.id },
      });

      if (!existingFailed) {
        await prisma.quizAttempt.create({
          data: {
            userId: studentUser.id,
            quizId: fpoFinalQuiz.id,
            status: QuizAttemptStatus.SUBMITTED,
            attemptNum: 1,
            scorePercent: 55.0,
            pointsEarned: 5,
            totalPoints: 10,
            passed: false,
            grade: null,
            provisional: false,
            gradingRuleVersion: 1,
            startedAt: new Date(Date.now() - 7200000),
            submittedAt: new Date(Date.now() - 5400000),
          },
        });
      }
    }
  }

  // 7. Seed Phase 4 ORELSE Digital Certificates
  console.log("Seeding Phase 4 ORELSE Digital Credentials & MockLedger Anchors...");
  await getOrCreateIssuerKey();

  // 7a. Issue Scenario A: Grade A Certificate for learnerUser on Getting Started course
  if (mainAppCourse) {
    const certARes = await issueCertificateForLearner(learnerUser.id, mainAppCourse.id, {
      id: adminUser.id,
      email: adminUser.email,
      role: "ADMIN",
    });
    if (certARes.certificate) {
      console.log(`  - Seeded Grade A Certificate: ${certARes.certificate.id} (${certARes.certificate.status})`);
    }
  }

  // 7b. Seed Scenario B: Grade B Certificate for fpoUser on FPC course
  const fpcCourse = allCourses.find((c) => c.slug === "fpc-operations-compliance-basics");
  if (fpcCourse) {
    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: fpoUser.id,
          courseId: fpcCourse.id,
        },
      },
      update: {
        progressPct: 100.0,
        assessmentStatus: "PASSED",
        finalScore: 72.0,
        finalGrade: "Grade B",
        isCompleted: true,
      },
      create: {
        userId: fpoUser.id,
        courseId: fpcCourse.id,
        progressPct: 100.0,
        assessmentStatus: "PASSED",
        finalScore: 72.0,
        finalGrade: "Grade B",
        isCompleted: true,
      },
    });

    const fpcFinalQuiz = await prisma.quiz.findFirst({
      where: { courseId: fpcCourse.id, type: QuizType.FINAL },
    });

    if (fpcFinalQuiz) {
      const passedAttemptB = await prisma.quizAttempt.create({
        data: {
          userId: fpoUser.id,
          quizId: fpcFinalQuiz.id,
          status: QuizAttemptStatus.SUBMITTED,
          attemptNum: 1,
          scorePercent: 72.0,
          pointsEarned: 7,
          totalPoints: 10,
          passed: true,
          grade: "B",
          provisional: false,
          gradingRuleVersion: 1,
          startedAt: new Date(Date.now() - 5000000),
          submittedAt: new Date(Date.now() - 4000000),
        },
      });

      await prisma.certificateEligibility.upsert({
        where: {
          userId_courseId: {
            userId: fpoUser.id,
            courseId: fpcCourse.id,
          },
        },
        update: {
          attemptId: passedAttemptB.id,
          finalScore: 72.0,
          grade: "Grade B",
          gradingRuleVersion: 1,
          status: "ELIGIBLE",
        },
        create: {
          userId: fpoUser.id,
          courseId: fpcCourse.id,
          attemptId: passedAttemptB.id,
          finalScore: 72.0,
          grade: "Grade B",
          gradingRuleVersion: 1,
          status: "ELIGIBLE",
        },
      });

      const certBRes = await issueCertificateForLearner(fpoUser.id, fpcCourse.id, {
        id: adminUser.id,
        email: adminUser.email,
        role: "ADMIN",
      });
      if (certBRes.certificate) {
        console.log(`  - Seeded Grade B Certificate: ${certBRes.certificate.id} (${certBRes.certificate.status})`);
      }
    }
  }

  // 7c. Seed Scenario E: Revoked Demo Certificate
  const digitalSkillsCourse = allCourses.find((c) => c.slug === "digital-skills-online-safety");
  if (digitalSkillsCourse) {
    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: learnerUser.id,
          courseId: digitalSkillsCourse.id,
        },
      },
      update: {
        progressPct: 100.0,
        assessmentStatus: "PASSED",
        finalScore: 85.0,
        finalGrade: "Pass",
        isCompleted: true,
      },
      create: {
        userId: learnerUser.id,
        courseId: digitalSkillsCourse.id,
        progressPct: 100.0,
        assessmentStatus: "PASSED",
        finalScore: 85.0,
        finalGrade: "Pass",
        isCompleted: true,
      },
    });

    const dsFinalQuiz = await prisma.quiz.findFirst({
      where: { courseId: digitalSkillsCourse.id, type: QuizType.FINAL },
    });

    if (dsFinalQuiz) {
      const dsAttempt = await prisma.quizAttempt.create({
        data: {
          userId: learnerUser.id,
          quizId: dsFinalQuiz.id,
          status: QuizAttemptStatus.SUBMITTED,
          attemptNum: 1,
          scorePercent: 85.0,
          pointsEarned: 8,
          totalPoints: 10,
          passed: true,
          grade: null,
          provisional: true,
          gradingRuleVersion: 1,
          startedAt: new Date(Date.now() - 6000000),
          submittedAt: new Date(Date.now() - 5000000),
        },
      });

      await prisma.certificateEligibility.upsert({
        where: {
          userId_courseId: {
            userId: learnerUser.id,
            courseId: digitalSkillsCourse.id,
          },
        },
        update: {
          attemptId: dsAttempt.id,
          finalScore: 85.0,
          grade: "Pass",
          gradingRuleVersion: 1,
          status: "ELIGIBLE",
        },
        create: {
          userId: learnerUser.id,
          courseId: digitalSkillsCourse.id,
          attemptId: dsAttempt.id,
          finalScore: 85.0,
          grade: "Pass",
          gradingRuleVersion: 1,
          status: "ELIGIBLE",
        },
      });

      const certRevokeRes = await issueCertificateForLearner(learnerUser.id, digitalSkillsCourse.id, {
        id: adminUser.id,
        email: adminUser.email,
        role: "ADMIN",
      });

      if (certRevokeRes.certificate) {
        await revokeCertificate(
          certRevokeRes.certificate.id,
          "Certificate revoked for administrative identity verification (demo review).",
          { id: adminUser.id, email: adminUser.email }
        );
        console.log(`  - Seeded Revoked Certificate: ${certRevokeRes.certificate.id} (REVOKED)`);
      }
    }
  }

  // 7. Seed Sample Course Assignments
  console.log("Seeding Course Assignments...");
  const assignFpoCourse = await prisma.course.findUnique({ where: { slug: "fpo-governance-essentials" } });
  const assignNavCourse = await prisma.course.findUnique({ where: { slug: "naval-technical-readiness" } });

  if (assignFpoCourse) {
    const existingAssign = await prisma.courseAssignment.findFirst({
      where: { courseId: assignFpoCourse.id, organizationId: fpoOrg.id },
    });
    if (!existingAssign) {
      await prisma.courseAssignment.create({
        data: {
          courseId: assignFpoCourse.id,
          organizationId: fpoOrg.id,
          assignedBy: adminUser.email,
          dueDate: new Date(Date.now() + 30 * 86400000),
          status: "ACTIVE",
        },
      });
      console.log("  - Seeded Organization Course Assignment: FPO Governance -> MAHA-FPO");
    }
  }

  if (assignNavCourse) {
    const existingNavAssign = await prisma.courseAssignment.findFirst({
      where: { courseId: assignNavCourse.id, organizationId: navalOrg.id },
    });
    if (!existingNavAssign) {
      await prisma.courseAssignment.create({
        data: {
          courseId: assignNavCourse.id,
          organizationId: navalOrg.id,
          assignedBy: adminUser.email,
          dueDate: new Date(Date.now() + 60 * 86400000),
          status: "ACTIVE",
        },
      });
      console.log("  - Seeded Organization Course Assignment: Naval Readiness -> WNC-TRG");
    }
  }

  // 8. Seed Initial Audit Logs
  console.log("Seeding Initial Audit Logs...");
  const existingAudit = await prisma.auditLog.count();
  if (existingAudit === 0) {
    await prisma.auditLog.createMany({
      data: [
        {
          userId: adminUser.id,
          action: "ORGANIZATION_VERIFIED",
          target: "Western Naval Command (WNC-TRG)",
          details: { verifiedBy: adminUser.email, reason: "Command training authorization authenticated" },
        },
        {
          userId: adminUser.id,
          action: "COURSE_PUBLISHED",
          target: "FPO Governance, Compliance & Statutory Norms",
          details: { version: 1, publishStatus: "published" },
        },
        {
          userId: adminUser.id,
          action: "COURSE_ASSIGNED",
          target: "MAHA-FPO Federation",
          details: { courseSlug: "fpo-governance-essentials", type: "ORGANIZATION" },
        },
      ],
    });
    console.log("  - Seeded 3 administrative audit log records.");
  }

  // 14. Phase 6: Seed Communication, Newsletters, Announcements, Messaging & Notifications
  console.log("Seeding Phase 6 Communication & Newsletter System...");

  // 14a. Notification Preferences
  const usersToSeedPreferences = [adminUser, instructorUser, learnerUser, fpoUser, studentUser];
  for (const u of usersToSeedPreferences) {
    await prisma.notificationPreference.upsert({
      where: { userId: u.id },
      update: { inAppEnabled: true, emailEnabled: false, courseUpdates: true, announcements: true, messages: true, assessmentAlerts: true },
      create: { userId: u.id, inAppEnabled: true, emailEnabled: false, courseUpdates: true, announcements: true, messages: true, assessmentAlerts: true },
    });
  }

  // 14b. Newsletter Subscriptions
  for (const u of usersToSeedPreferences) {
    const token = `unsub_${u.id.substring(0, 12)}_${Buffer.from(u.email).toString("hex").substring(0, 12)}`;
    await prisma.newsletterSubscription.upsert({
      where: { email: u.email },
      update: {
        userId: u.id,
        isSubscribed: true,
        generalNews: true,
        courseAlerts: true,
        trainingAnnouncements: true,
      },
      create: {
        email: u.email,
        userId: u.id,
        isSubscribed: true,
        generalNews: true,
        courseAlerts: true,
        trainingAnnouncements: true,
        unsubscribeToken: token,
        consentSource: "LEARNER_REGISTRATION",
      },
    });
  }

  // Public subscriber
  const publicUnsubToken = "unsub_public_demo_newsletter_subscriber_token_2026";
  await prisma.newsletterSubscription.upsert({
    where: { email: "public.subscriber@example.org" },
    update: { isSubscribed: true },
    create: {
      email: "public.subscriber@example.org",
      isSubscribed: true,
      generalNews: true,
      courseAlerts: true,
      trainingAnnouncements: true,
      unsubscribeToken: publicUnsubToken,
      consentSource: "PUBLIC_PORTAL",
    },
  });

  // 14c. Announcements (Platform & Course)
  const platformAnnounce = await prisma.announcement.upsert({
    where: { id: "announcement-platform-winter-2026" },
    update: {
      title: "Learn LMS 2026 Winter Release & Platform Capabilities",
      excerpt: "Announcing comprehensive newsletter broadcasts, unified messaging, and enhanced digital credential verification.",
      content: "Welcome to the Learn LMS Winter 2026 update by ORELSE. This release introduces institutional newsletter delivery, course announcements, two-way learner-instructor messaging, and real-time in-app notifications.",
      type: "PLATFORM",
      category: "platform",
      status: "PUBLISHED",
      authorId: adminUser.id,
    },
    create: {
      id: "announcement-platform-winter-2026",
      title: "Learn LMS 2026 Winter Release & Platform Capabilities",
      excerpt: "Announcing comprehensive newsletter broadcasts, unified messaging, and enhanced digital credential verification.",
      content: "Welcome to the Learn LMS Winter 2026 update by ORELSE. This release introduces institutional newsletter delivery, course announcements, two-way learner-instructor messaging, and real-time in-app notifications.",
      type: "PLATFORM",
      category: "platform",
      status: "PUBLISHED",
      authorId: adminUser.id,
    },
  });

  // Find a course for course announcement
  const demoCourse = await prisma.course.findFirst({
    where: { slug: "naval-operations-safety" },
  });

  if (demoCourse) {
    await prisma.announcement.upsert({
      where: { id: "announcement-naval-navigation-update" },
      update: {
        title: "Naval Navigation System Maintenance & Sensor Calibration Guidelines",
        excerpt: "Updated bridge radar and sensor calibration protocols have been published for Module 2.",
        content: "All personnel enrolled in Naval Operations & Safety must review the sensor calibration safety protocol before attempting the final assessment.",
        type: "COURSE",
        category: "curriculum",
        courseId: demoCourse.id,
        targetGroup: LearnerGroup.NAVAL_OFFICER,
        isRestricted: true,
        status: "PUBLISHED",
        authorId: instructorUser.id,
      },
      create: {
        id: "announcement-naval-navigation-update",
        title: "Naval Navigation System Maintenance & Sensor Calibration Guidelines",
        excerpt: "Updated bridge radar and sensor calibration protocols have been published for Module 2.",
        content: "All personnel enrolled in Naval Operations & Safety must review the sensor calibration safety protocol before attempting the final assessment.",
        type: "COURSE",
        category: "curriculum",
        courseId: demoCourse.id,
        targetGroup: LearnerGroup.NAVAL_OFFICER,
        isRestricted: true,
        status: "PUBLISHED",
        authorId: instructorUser.id,
      },
    });

    // Mark platform announcement as read by learner
    await prisma.announcementRead.upsert({
      where: {
        announcementId_userId: {
          announcementId: platformAnnounce.id,
          userId: learnerUser.id,
        },
      },
      update: {},
      create: {
        announcementId: platformAnnounce.id,
        userId: learnerUser.id,
      },
    });
  }

  // 14d. Message Threads (Support & Course Q&A)
  const supportThread = await prisma.messageThread.upsert({
    where: { id: "thread-support-blockchain-demo" },
    update: {
      subject: "Inquiry on QR Code Credential Verification",
      status: "OPEN",
    },
    create: {
      id: "thread-support-blockchain-demo",
      type: "SUPPORT",
      subject: "Inquiry on QR Code Credential Verification",
      status: "OPEN",
      createdBy: learnerUser.id,
      organizationId: navalOrg.id,
    },
  });

  await prisma.messageThreadParticipant.upsert({
    where: { threadId_userId: { threadId: supportThread.id, userId: learnerUser.id } },
    update: {},
    create: { threadId: supportThread.id, userId: learnerUser.id },
  });

  await prisma.messageThreadParticipant.upsert({
    where: { threadId_userId: { threadId: supportThread.id, userId: adminUser.id } },
    update: {},
    create: { threadId: supportThread.id, userId: adminUser.id },
  });

  const existingMsgCount = await prisma.message.count({ where: { threadId: supportThread.id } });
  if (existingMsgCount === 0) {
    await prisma.message.create({
      data: {
        threadId: supportThread.id,
        senderId: learnerUser.id,
        body: "Hello Support Team, how long does on-chain anchor confirmation take when verifying my certificate on Polygon Amoy?",
      },
    });
    await prisma.message.create({
      data: {
        threadId: supportThread.id,
        senderId: adminUser.id,
        body: "Hello Lt. Rathore! Verification against the local MockLedger is instantaneous. For Polygon Amoy, anchoring occurs in batches every 5 minutes.",
      },
    });
  }

  // 14e. Newsletter Campaign Demo
  const demoCampaign = await prisma.newsletterCampaign.upsert({
    where: { id: "campaign-monthly-digest-vol-1" },
    update: {
      title: "Learn LMS Monthly Digest — Vol. 1",
      subject: "Important Platform Updates & Upcoming Agritech & Naval Courses",
      body: "Welcome to our monthly digest! We have launched new training modules for FPO Governance and Naval Operational Safety. Please log in to check your personalized dashboard.",
      status: "COMPLETED",
      recipientCount: 3,
      deliveredCount: 3,
      sentAt: new Date(),
    },
    create: {
      id: "campaign-monthly-digest-vol-1",
      title: "Learn LMS Monthly Digest — Vol. 1",
      description: "Monthly educational newsletter sent to active learners across all cohorts.",
      subject: "Important Platform Updates & Upcoming Agritech & Naval Courses",
      previewText: "New training modules launched for FPO Governance and Naval Operations.",
      body: "Welcome to our monthly digest! We have launched new training modules for FPO Governance and Naval Operational Safety. Please log in to check your personalized dashboard.",
      audienceDefinition: { cohorts: ["FPO", "FPC", "STUDENT", "NAVAL_OFFICER"] },
      deliveryChannel: "EMAIL",
      status: "COMPLETED",
      senderName: "Learn LMS — ORELSE",
      senderEmail: "newsletter@learnlms.local",
      recipientCount: 3,
      deliveredCount: 3,
      sentAt: new Date(),
      createdBy: adminUser.id,
    },
  });

  const campaignRecipients = [learnerUser, fpoUser, studentUser];
  for (const r of campaignRecipients) {
    const existingRecipient = await prisma.newsletterRecipient.findFirst({
      where: { campaignId: demoCampaign.id, email: r.email },
    });
    if (!existingRecipient) {
      await prisma.newsletterRecipient.create({
        data: {
          campaignId: demoCampaign.id,
          email: r.email,
          userId: r.id,
          deliveryChannel: "EMAIL",
          deliveryStatus: "SIMULATED",
          deliveredAt: new Date(),
          attemptCount: 1,
        },
      });
    }
  }

  // 14f. In-App Notifications
  const notificationsToSeed = [
    {
      userId: learnerUser.id,
      eventType: "PLATFORM_ANNOUNCEMENT",
      title: "Platform Update Released",
      body: "Learn LMS 2026 Winter Release features are now available.",
      destination: "/learn/notifications",
      deduplicationKey: `notif_seed_platform_${learnerUser.id}`,
      isRead: true,
      readAt: new Date(),
    },
    {
      userId: learnerUser.id,
      eventType: "COURSE_ANNOUNCEMENT",
      title: "New Course Announcement",
      body: "Updated Sensor Calibration Guidelines in Naval Operations & Safety.",
      destination: "/courses/naval-operations-safety",
      deduplicationKey: `notif_seed_course_${learnerUser.id}`,
      isRead: false,
    },
    {
      userId: learnerUser.id,
      eventType: "CERTIFICATE_ISSUED",
      title: "Certificate Issued & Anchored",
      body: "Your certificate for Naval Operations & Safety has been anchored with ID ORELSE-CERT-WNC-2026-0001.",
      destination: "/verify",
      deduplicationKey: `notif_seed_cert_${learnerUser.id}`,
      isRead: false,
    },
    {
      userId: adminUser.id,
      eventType: "MESSAGE_RECEIVED",
      title: "New Support Inquiry",
      body: "Lt. Vikram Rathore submitted an inquiry regarding QR Code Verification.",
      destination: "/admin",
      deduplicationKey: `notif_seed_support_${adminUser.id}`,
      isRead: false,
    },
  ];

  for (const n of notificationsToSeed) {
    await prisma.notification.upsert({
      where: { deduplicationKey: n.deduplicationKey },
      update: {},
      create: n,
    });
  }

  console.log("  - Seeded communication, newsletters, announcements, messages and notifications.");

  // ==========================================
  // PHASE 7: Application Training & Guided Steps
  // ==========================================
  console.log("Seeding Phase 7 Training Programmes & Guided Procedural Steps...");

  // 1. Ensure FPC Learner User exists
  const fpcUser = await prisma.user.upsert({
    where: { email: "fpc.user@learnlms.local" },
    update: {
      name: "Kavita Shinde",
      role: Role.LEARNER,
      learnerGroup: LearnerGroup.FPC,
      organizationId: fpcOrg.id,
      isOrgVerified: true,
      passwordHash: learnerPasswordHash,
    },
    create: {
      email: "fpc.user@learnlms.local",
      name: "Kavita Shinde",
      role: Role.LEARNER,
      learnerGroup: LearnerGroup.FPC,
      organizationId: fpcOrg.id,
      isOrgVerified: true,
      passwordHash: learnerPasswordHash,
    },
  });

  // 2. Fetch courses
  const gettingStartedCourse = await prisma.course.findUnique({
    where: { slug: "getting-started-main-application" },
    include: {
      sections: {
        include: { lessons: true },
      },
    },
  });

  const fpoCourseObj = await prisma.course.findUnique({
    where: { slug: "fpo-governance-essentials" },
  });

  const fpcCourseObj = await prisma.course.findUnique({
    where: { slug: "fpc-operations-compliance-basics" },
  });

  let navalCourseObj = await prisma.course.findFirst({
    where: {
      OR: [
        { slug: "naval-operations-safety" },
        { slug: "naval-technical-readiness" },
      ],
    },
  });

  if (!navalCourseObj) {
    navalCourseObj = await prisma.course.findFirst({
      where: { isRestricted: true },
    });
  }

  // 3. Seed Guided Training Steps for Lessons
  if (gettingStartedCourse && gettingStartedCourse.sections.length > 0) {
    const allLessons = gettingStartedCourse.sections.flatMap((s) => s.lessons);
    if (allLessons.length > 0) {
      const firstLesson = allLessons[0];
      await prisma.trainingStep.deleteMany({ where: { lessonId: firstLesson.id } });

      await prisma.trainingStep.createMany({
        data: [
          {
            lessonId: firstLesson.id,
            stepNumber: 1,
            title: "Access Platform & Verify Authorization",
            instruction: "Navigate to the secure login gateway at localhost:3000/login and authenticate using your assigned credentials.",
            actionType: "NAVIGATE",
            uiElementTarget: "Login Form > Email & Password fields",
            verificationBadge: ContentVerificationStatus.DEMO,
            disclaimer: "Demonstration content — pending application-specific verification",
            sortOrder: 1,
          },
          {
            lessonId: firstLesson.id,
            stepNumber: 2,
            title: "Select Your Operational Workspace",
            instruction: "From the top navigation bar, locate the 'My Training' portal to inspect your assigned onboarding tracks.",
            actionType: "CLICK",
            uiElementTarget: "Top Navigation > My Training",
            verificationBadge: ContentVerificationStatus.DEMO,
            disclaimer: "Demonstration content — pending application-specific verification",
            sortOrder: 2,
          },
          {
            lessonId: firstLesson.id,
            stepNumber: 3,
            title: "Inspect Member Registry & Producer Records",
            instruction: "Review the simulated producer list and ensure member status is verified before initiating ledger transactions.",
            actionType: "VERIFY",
            uiElementTarget: "Registry Table > Verification Status Badge",
            verificationBadge: ContentVerificationStatus.DEMO,
            disclaimer: "Demonstration content — pending application-specific verification",
            sortOrder: 3,
          },
        ],
      });
    }

    if (allLessons.length > 1) {
      const secondLesson = allLessons[1];
      await prisma.trainingStep.deleteMany({ where: { lessonId: secondLesson.id } });

      await prisma.trainingStep.createMany({
        data: [
          {
            lessonId: secondLesson.id,
            stepNumber: 1,
            title: "Initialize Producer Record",
            instruction: "Click 'New Record' button to open the producer registration form modal.",
            actionType: "CLICK",
            uiElementTarget: "Action Toolbar > Button[New Record]",
            verificationBadge: ContentVerificationStatus.DEMO,
            disclaimer: "Demonstration content — pending application-specific verification",
            sortOrder: 1,
          },
          {
            lessonId: secondLesson.id,
            stepNumber: 2,
            title: "Input Compliance Identifiers",
            instruction: "Enter the FPO/FPC registration number and upload identity verification documents.",
            actionType: "INPUT",
            uiElementTarget: "Form Input > Registration Code",
            verificationBadge: ContentVerificationStatus.DEMO,
            disclaimer: "Demonstration content — pending application-specific verification",
            sortOrder: 2,
          },
        ],
      });
    }
  }

  // 4. Seed 3 Core Demo Programmes
  // Programme 1: FPO Member Training
  const fpoProgramme = await prisma.trainingProgramme.upsert({
    where: { slug: "using-main-application-fpo-members" },
    update: {
      title: "Using the Main Application — FPO Member Training",
      description: "Comprehensive step-by-step training for Farmer Producer Organisation (FPO) directors and member delegates to master application workflows, producer records, and compliance routines.",
      targetGroup: LearnerGroup.FPO,
      organizationId: fpoOrg.id,
      status: TrainingProgrammeStatus.PUBLISHED,
      estimatedDurationMinutes: 180,
      isRequired: true,
      isRestricted: false,
      certificateEnabled: true,
      passingScorePercent: 60.0,
      createdBy: adminUser.id,
    },
    create: {
      title: "Using the Main Application — FPO Member Training",
      slug: "using-main-application-fpo-members",
      description: "Comprehensive step-by-step training for Farmer Producer Organisation (FPO) directors and member delegates to master application workflows, producer records, and compliance routines.",
      targetGroup: LearnerGroup.FPO,
      organizationId: fpoOrg.id,
      status: TrainingProgrammeStatus.PUBLISHED,
      estimatedDurationMinutes: 180,
      isRequired: true,
      isRestricted: false,
      certificateEnabled: true,
      passingScorePercent: 60.0,
      createdBy: adminUser.id,
    },
  });

  await prisma.trainingProgrammeCourse.deleteMany({ where: { programmeId: fpoProgramme.id } });
  if (gettingStartedCourse) {
    await prisma.trainingProgrammeCourse.create({
      data: {
        programmeId: fpoProgramme.id,
        courseId: gettingStartedCourse.id,
        sortOrder: 1,
        isRequired: true,
      },
    });
  }
  if (fpoCourseObj) {
    await prisma.trainingProgrammeCourse.create({
      data: {
        programmeId: fpoProgramme.id,
        courseId: fpoCourseObj.id,
        sortOrder: 2,
        isRequired: true,
      },
    });
  }

  // Programme 2: FPC Operations Training
  const fpcProgramme = await prisma.trainingProgramme.upsert({
    where: { slug: "using-main-application-fpc-operations" },
    update: {
      title: "Using the Main Application — FPC Operations Training",
      description: "Advanced operational training for Farmer Producer Company (FPC) management teams, covering accounting, GST reconciliation, inventory batches, and statutory filing.",
      targetGroup: LearnerGroup.FPC,
      organizationId: fpcOrg.id,
      status: TrainingProgrammeStatus.PUBLISHED,
      estimatedDurationMinutes: 240,
      isRequired: true,
      isRestricted: false,
      certificateEnabled: true,
      passingScorePercent: 65.0,
      createdBy: adminUser.id,
    },
    create: {
      title: "Using the Main Application — FPC Operations Training",
      slug: "using-main-application-fpc-operations",
      description: "Advanced operational training for Farmer Producer Company (FPC) management teams, covering accounting, GST reconciliation, inventory batches, and statutory filing.",
      targetGroup: LearnerGroup.FPC,
      organizationId: fpcOrg.id,
      status: TrainingProgrammeStatus.PUBLISHED,
      estimatedDurationMinutes: 240,
      isRequired: true,
      isRestricted: false,
      certificateEnabled: true,
      passingScorePercent: 65.0,
      createdBy: adminUser.id,
    },
  });

  await prisma.trainingProgrammeCourse.deleteMany({ where: { programmeId: fpcProgramme.id } });
  if (gettingStartedCourse) {
    await prisma.trainingProgrammeCourse.create({
      data: {
        programmeId: fpcProgramme.id,
        courseId: gettingStartedCourse.id,
        sortOrder: 1,
        isRequired: true,
      },
    });
  }
  if (fpcCourseObj) {
    await prisma.trainingProgrammeCourse.create({
      data: {
        programmeId: fpcProgramme.id,
        courseId: fpcCourseObj.id,
        sortOrder: 2,
        isRequired: true,
      },
    });
  }

  // Programme 3: Naval Officers Platform Orientation
  const navalProgramme = await prisma.trainingProgramme.upsert({
    where: { slug: "learn-lms-naval-officer-orientation" },
    update: {
      title: "Learn LMS Platform Orientation — Naval Officers",
      description: "Restricted platform orientation for Naval Officers. Covers secure LMS technical operations, access management, and training record verification. Strictly for platform use; contains no unverified military tactical procedures.",
      targetGroup: LearnerGroup.NAVAL_OFFICER,
      organizationId: navalOrg.id,
      status: TrainingProgrammeStatus.PUBLISHED,
      estimatedDurationMinutes: 150,
      isRequired: true,
      isRestricted: true,
      certificateEnabled: true,
      passingScorePercent: 70.0,
      createdBy: adminUser.id,
    },
    create: {
      title: "Learn LMS Platform Orientation — Naval Officers",
      slug: "learn-lms-naval-officer-orientation",
      description: "Restricted platform orientation for Naval Officers. Covers secure LMS technical operations, access management, and training record verification. Strictly for platform use; contains no unverified military tactical procedures.",
      targetGroup: LearnerGroup.NAVAL_OFFICER,
      organizationId: navalOrg.id,
      status: TrainingProgrammeStatus.PUBLISHED,
      estimatedDurationMinutes: 150,
      isRequired: true,
      isRestricted: true,
      certificateEnabled: true,
      passingScorePercent: 70.0,
      createdBy: adminUser.id,
    },
  });

  await prisma.trainingProgrammeCourse.deleteMany({ where: { programmeId: navalProgramme.id } });
  if (navalCourseObj) {
    await prisma.trainingProgrammeCourse.create({
      data: {
        programmeId: navalProgramme.id,
        courseId: navalCourseObj.id,
        sortOrder: 1,
        isRequired: true,
      },
    });
  }

  // 5. Seed Training Programme Cohort Assignments
  await prisma.trainingProgrammeAssignment.deleteMany({
    where: { programmeId: fpoProgramme.id },
  });
  await prisma.trainingProgrammeAssignment.create({
    data: {
      programmeId: fpoProgramme.id,
      organizationId: fpoOrg.id,
      learnerGroup: LearnerGroup.FPO,
      assignedBy: adminUser.id,
      status: "ACTIVE",
    },
  });
  await prisma.trainingProgrammeAssignment.create({
    data: {
      programmeId: fpoProgramme.id,
      userId: fpoUser.id,
      assignedBy: adminUser.id,
      status: "ACTIVE",
    },
  });

  await prisma.trainingProgrammeAssignment.deleteMany({
    where: { programmeId: fpcProgramme.id },
  });
  await prisma.trainingProgrammeAssignment.create({
    data: {
      programmeId: fpcProgramme.id,
      organizationId: fpcOrg.id,
      learnerGroup: LearnerGroup.FPC,
      assignedBy: adminUser.id,
      status: "ACTIVE",
    },
  });
  await prisma.trainingProgrammeAssignment.create({
    data: {
      programmeId: fpcProgramme.id,
      userId: fpcUser.id,
      assignedBy: adminUser.id,
      status: "ACTIVE",
    },
  });

  await prisma.trainingProgrammeAssignment.deleteMany({
    where: { programmeId: navalProgramme.id },
  });
  await prisma.trainingProgrammeAssignment.create({
    data: {
      programmeId: navalProgramme.id,
      organizationId: navalOrg.id,
      learnerGroup: LearnerGroup.NAVAL_OFFICER,
      assignedBy: adminUser.id,
      status: "ACTIVE",
    },
  });
  await prisma.trainingProgrammeAssignment.create({
    data: {
      programmeId: navalProgramme.id,
      userId: learnerUser.id,
      assignedBy: adminUser.id,
      status: "ACTIVE",
    },
  });

  console.log("  - Seeded 3 Core Training Programmes, guided steps, and cohort assignments.");

  console.log("✅ Database seeding completed successfully!");
  console.log(`Seeded Accounts & Roles:
  - Admin:      admin@learnlms.local / Admin@123
  - Instructor: instructor@learnlms.local / Instructor@123
  - Learner:    learner@learnlms.local / Learner@123 (Naval Officer · Completed Course + Certificate Eligible)
  - FPO User:   fpo.user@learnlms.local / Learner@123 (FPO Member)
  - Student:    student.user@learnlms.local / Learner@123 (Student · Failed Final Exam on Attempt 1)
  `);
}

// Helper to create questions with options
async function createQuestionWithOptions(
  quizId: string,
  sortOrder: number,
  data: {
    prompt: string;
    explanation: string;
    points: number;
    options: Array<{ text: string; isCorrect: boolean }>;
  }
) {
  const question = await prisma.question.create({
    data: {
      quizId,
      prompt: data.prompt,
      explanation: data.explanation,
      points: data.points,
      sortOrder,
    },
  });

  for (let idx = 0; idx < data.options.length; idx++) {
    const opt = data.options[idx];
    await prisma.questionOption.create({
      data: {
        questionId: question.id,
        text: opt.text,
        isCorrect: opt.isCorrect,
        sortOrder: idx,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
