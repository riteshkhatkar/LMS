// End-to-end HTTP integration test for Phase 3 Assessment & Grading Engine
const BASE_URL = "http://localhost:3000";

async function run() {
  console.log("=== PHASE 3 ASSESSMENT & GRADING ENGINE E2E TESTS ===\n");
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (!condition) {
      console.error(`❌ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    } else {
      passed++;
      console.log(`✅ PASS: ${message}`);
    }
  }

  // 1. Admin Login & Grading Rule Version Management
  console.log("\n--- 1. Admin Login & Grading Rule Version Management ---");
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@learnlms.local",
      password: "Admin@123",
    }),
  });
  assert(adminLoginRes.status === 200, "Admin login returns 200");
  const adminCookies = adminLoginRes.headers.get("set-cookie") || "";
  const adminSessionCookie = adminCookies.split(";")[0];

  // Query rules for fpo-governance-essentials
  const rulesRes = await fetch(`${BASE_URL}/api/admin/grading/fpo-governance-essentials`, {
    headers: { Cookie: adminSessionCookie },
  });
  assert(rulesRes.status === 200, "GET /api/admin/grading/fpo-governance-essentials returns 200");
  const rulesData = await rulesRes.json();
  assert(rulesData.rules.length >= 1, "At least one active grading rule returned");
  const activeRule = rulesData.activeRule;
  assert(typeof activeRule.passThreshold === "number" && activeRule.passThreshold >= 50, "Active rule has valid numeric passThreshold");
  assert(typeof activeRule.gradeAThreshold === "number" && activeRule.gradeAThreshold > activeRule.gradeBMax, "Active rule gradeAThreshold is strictly above gradeBMax");
  assert(activeRule.gradeBMin <= activeRule.gradeBMax, "Active rule gradeB range is valid");

  // Test Admin publishing new version
  const targetPass = activeRule.passThreshold >= 65 ? 62 : 65;
  const newRuleRes = await fetch(`${BASE_URL}/api/admin/grading/fpo-governance-essentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminSessionCookie,
    },
    body: JSON.stringify({
      passThreshold: targetPass,
      gradeBMin: 70,
      gradeBMax: 80,
      gradeAThreshold: 92,
    }),
  });
  assert(newRuleRes.status === 200, "POST /api/admin/grading publishes new rule version");
  const newRuleData = await newRuleRes.json();
  assert(newRuleData.rule.version > activeRule.version, "Rule version incremented");
  assert(newRuleData.rule.passThreshold === targetPass, `New passThreshold is ${targetPass}%`);

  // 2. Instructor Login & Quiz Authoring
  console.log("\n--- 2. Instructor Login & Quiz Authoring ---");
  const instLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "instructor@learnlms.local",
      password: "Instructor@123",
    }),
  });
  assert(instLoginRes.status === 200, "Instructor login returns 200");
  const instCookies = instLoginRes.headers.get("set-cookie") || "";
  const instSessionCookie = instCookies.split(";")[0];

  // Instructor authors a new in-course quiz
  const createQuizRes = await fetch(`${BASE_URL}/api/instructor/quiz`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: instSessionCookie,
    },
    body: JSON.stringify({
      courseId: "fpo-governance-essentials",
      title: "Interactive Review Quiz (Instructor Created)",
      type: "IN_COURSE",
      timeLimitSec: 600,
      maxAttempts: 3,
      isRequired: true,
      questions: [
        {
          prompt: "Which register is mandatory for member dividend distribution?",
          points: 10,
          explanation: "Section 58 of the Act mandates maintaining the Dividend Distribution Register.",
          options: [
            { text: "Dividend Register", isCorrect: true },
            { text: "Visitor Log", isCorrect: false },
            { text: "Equipment Inventory", isCorrect: false },
          ],
        },
      ],
    }),
  });
  assert(
    createQuizRes.status === 200 || createQuizRes.status === 201,
    "Instructor successfully created new quiz"
  );
  const createdQuizData = await createQuizRes.json();
  assert(createdQuizData.quiz.id.length > 0, "Created quiz has valid ID");

  // 3. Learner Login & Assessment Exploration
  console.log("\n--- 3. Learner Login & Quiz Exploration ---");
  const learnerLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "learner@learnlms.local",
      password: "Learner@123",
    }),
  });
  assert(learnerLoginRes.status === 200, "Learner login returns 200");
  const learnerCookies = learnerLoginRes.headers.get("set-cookie") || "";
  const learnerSessionCookie = learnerCookies.split(";")[0];

  // Query quizzes for course
  const courseQuizzesRes = await fetch(`${BASE_URL}/api/courses/fpo-governance-essentials/quizzes`, {
    headers: { Cookie: learnerSessionCookie },
  });
  assert(courseQuizzesRes.status === 200, "GET /api/courses/fpo-governance-essentials/quizzes returns 200");
  const quizzesData = await courseQuizzesRes.json();
  assert(quizzesData.quizzes.length >= 2, "Returns in-course quizzes and final assessment");

  const inCourseQuiz = quizzesData.quizzes.find((q) => q.type === "IN_COURSE");
  assert(inCourseQuiz !== undefined, "Found in-course quiz");

  // 4. Anti-Cheat Security: Sanitized Questions on Attempt Start
  console.log("\n--- 4. Anti-Cheat Question Sanitization Verification ---");
  const startQuizRes = await fetch(`${BASE_URL}/api/quiz/${inCourseQuiz.id}/start`, {
    method: "POST",
    headers: { Cookie: learnerSessionCookie },
  });
  assert(startQuizRes.status === 200, "POST /api/quiz/{id}/start starts/resumes attempt");
  const startData = await startQuizRes.json();
  const attemptId = startData.attemptId;
  assert(typeof attemptId === "string", "Valid attemptId returned");
  assert(startData.questions.length > 0, "Quiz questions returned");

  // Verify that isCorrect and explanation are NOT present in learner's payload
  for (const q of startData.questions) {
    assert(q.explanation === undefined, "Teacher explanation is hidden during active attempt");
    for (const opt of q.options) {
      assert(opt.isCorrect === undefined, "Option isCorrect is hidden during active attempt");
    }
  }

  // 5. Saving Answers & Server-Side Submission
  console.log("\n--- 5. Answer Auto-save & Authoritative Server Scoring ---");
  const firstQuestion = startData.questions[0];
  const firstOption = firstQuestion.options[0];

  const answerRes = await fetch(`${BASE_URL}/api/quiz/attempt/${attemptId}/answer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: learnerSessionCookie,
    },
    body: JSON.stringify({
      questionId: firstQuestion.id,
      selectedOptionId: firstOption.id,
    }),
  });
  assert(answerRes.status === 200, "Answer saved successfully");

  // Submit attempt
  const submitRes = await fetch(`${BASE_URL}/api/quiz/attempt/${attemptId}/submit`, {
    method: "POST",
    headers: { Cookie: learnerSessionCookie },
  });
  assert(submitRes.status === 200, "Submit attempt returns 200");
  const submitData = await submitRes.json();
  const evalResult = submitData.result;
  assert(evalResult.status === "SUBMITTED", "Attempt status is SUBMITTED");
  assert(typeof evalResult.scorePercent === "number", "Score percentage calculated on server");
  assert(evalResult.passed !== undefined, "Pass/Fail outcome determined");

  // 6. Review Results Mode: Explanations now visible
  console.log("\n--- 6. Post-Submission Review Mode & Feedback ---");
  const resultRes = await fetch(`${BASE_URL}/api/quiz/attempt/${attemptId}/result`, {
    headers: { Cookie: learnerSessionCookie },
  });
  assert(resultRes.status === 200, "GET /api/quiz/attempt/{id}/result returns 200");
  const resultData = await resultRes.json();
  assert(resultData.questions.length > 0, "Review questions returned");
  const reviewedQ = resultData.questions[0];
  assert(
    reviewedQ.options.some((o) => o.isCorrect === true),
    "Review mode displays correct answer keys"
  );
  assert(
    typeof reviewedQ.explanation === "string" && reviewedQ.explanation.length > 0,
    "Review mode displays pedagogical explanation"
  );

  // 7. Security: Progress Lock on Final Assessment for Learner with 0% progress
  console.log("\n--- 7. Final Assessment Progress Gating ---");
  const finalQuiz = quizzesData.quizzes.find((q) => q.type === "FINAL");
  if (finalQuiz) {
    const lockedRes = await fetch(`${BASE_URL}/api/quiz/${finalQuiz.id}/start`, {
      method: "POST",
      headers: { Cookie: learnerSessionCookie }, // learner has 0% progress in fpo-governance-essentials
    });
    assert(
      lockedRes.status === 403,
      "Final assessment denied (403) for learner without completed prerequisites"
    );
    const lockedData = await lockedRes.json();
    assert(
      lockedData.reason === "LOCKED_PROGRESS",
      `Final assessment blocked with reason: LOCKED_PROGRESS (Got: ${lockedData.reason})`
    );
  }

  // 8. Completed Learner Certificate Eligibility on Finished Course
  console.log("\n--- 8. Certificate Eligibility Record Verification ---");
  const completedQuizzesRes = await fetch(
    `${BASE_URL}/api/courses/getting-started-main-application/quizzes`,
    {
      headers: { Cookie: learnerSessionCookie },
    }
  );
  assert(completedQuizzesRes.status === 200, "GET quizzes for completed course returns 200");
  const completedData = await completedQuizzesRes.json();
  assert(
    completedData.course.isCompleted === true,
    "Learner course isCompleted is true on completed course"
  );
  assert(
    completedData.course.progressPct === 100,
    "Learner course progressPct is 100% on completed course"
  );

  console.log(`\n========================================`);
  console.log(`🎉 ALL ${passed}/${total} PHASE 3 E2E TESTS PASSED!`);
  console.log(`========================================\n`);
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
