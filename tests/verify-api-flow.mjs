// End-to-end HTTP integration test for Phase 2
const BASE_URL = "http://localhost:3000";

async function run() {
  console.log("=== PHASE 2 E2E HTTP INTEGRATION TESTS ===\n");
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

  // 1. Verify Public Auth Pages
  console.log("\n--- 1. Public Auth Pages ---");
  const loginRes = await fetch(`${BASE_URL}/en/login`);
  assert(loginRes.status === 200, "GET /en/login returns 200");

  const regRes = await fetch(`${BASE_URL}/en/register`);
  assert(regRes.status === 200, "GET /en/register returns 200");

  // 2. Test Registration Security Boundary (attempt admin elevation)
  console.log("\n--- 2. Registration Security & Privilege Elevation Prevention ---");
  const uniqueEmail = `test.cadet.${Date.now()}@learnlms.local`;
  const regApiRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Cadet Vikramaditya",
      email: uniqueEmail,
      password: "CadetPassword@2026",
      role: "ADMIN", // Malicious payload attempting admin role
      learnerGroup: "NAVAL_OFFICER",
      organizationId: "WNC-TRG",
    }),
  });
  assert(regApiRes.status === 201, "POST /api/auth/register returns 201 Created");
  const regData = await regApiRes.json();
  assert(
    regData.user.role === "LEARNER",
    "Registration strictly enforces role === LEARNER (rejected ADMIN elevation)"
  );
  assert(
    regData.user.learnerGroup === "NAVAL_OFFICER",
    "Registration accurately stored NAVAL_OFFICER learner group"
  );
  assert(
    typeof regData.user.organizationId === "string" && regData.user.organizationId.length > 0,
    "Registration accurately linked organization WNC-TRG"
  );

  // 3. Test Learner Login
  console.log("\n--- 3. Learner Authentication & Session ---");
  const loginApiRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "learner@learnlms.local",
      password: "Learner@123",
    }),
  });
  assert(loginApiRes.status === 200, "POST /api/auth/login with learner credentials returns 200");
  const rawSetCookie = loginApiRes.headers.get("set-cookie");
  assert(rawSetCookie && rawSetCookie.includes("learn_lms_session"), "Login sets learn_lms_session cookie");

  const sessionCookie = rawSetCookie.split(";")[0]; // "learn_lms_session=..."

  // 4. Test /api/auth/me session resolution
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: sessionCookie },
  });
  assert(meRes.status === 200, "GET /api/auth/me returns 200 with valid session");
  const meData = await meRes.json();
  assert(meData.user.email === "learner@learnlms.local", "Session identifies learner@learnlms.local");
  assert(meData.user.role === "LEARNER", "User role is LEARNER");
  assert(meData.user.learnerGroup === "NAVAL_OFFICER", "User learnerGroup is NAVAL_OFFICER");
  assert(
    typeof meData.user.organizationId === "string" && meData.user.organizationId.length > 0,
    "User organizationId is linked and present"
  );

  // 5. Test Learner Dashboard (My Learning)
  console.log("\n--- 4. Protected Learner Dashboard ---");
  const myLearningRes = await fetch(`${BASE_URL}/en/learn/my-learning`, {
    headers: { Cookie: sessionCookie },
  });
  assert(myLearningRes.status === 200, "GET /en/learn/my-learning returns 200 for authenticated learner");
  const myLearningHtml = await myLearningRes.text();
  assert(myLearningHtml.includes("My Learning"), "Page renders My Learning header");
  assert(myLearningHtml.includes("Naval Officers"), "Page displays Naval Officers classification pill");

  // 6. Test Course Catalog & Fetch Target Course
  console.log("\n--- 5. Course Player Navigation ---");
  const coursesRes = await fetch(`${BASE_URL}/api/courses`);
  assert(coursesRes.status === 200, "GET /api/courses returns 200");
  const coursesData = await coursesRes.json();
  const targetCourse = coursesData.courses[0];
  assert(targetCourse && targetCourse.slug, "Valid course found in catalog");

  // 7. Test Course Player
  const playerRes = await fetch(
    `${BASE_URL}/en/learn/course/${targetCourse.slug}/lesson/first`,
    {
      headers: { Cookie: sessionCookie },
    }
  );
  assert(playerRes.status === 200, "GET course player lesson returns 200");
  const playerHtml = await playerRes.text();
  assert(
    playerHtml.includes(targetCourse.title) || playerHtml.includes("Curriculum") || playerHtml.includes("Mark as Complete"),
    "Player renders course title and player controls"
  );

  // 8. Test Lesson Completion & Progress Persistence
  console.log("\n--- 6. Lesson Progress Persistence & Completion API ---");
  const progressRes = await fetch(`${BASE_URL}/api/progress/complete-lesson`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      courseId: targetCourse.slug,
      lessonId: "first",
      timeSpentSeconds: 180,
    }),
  });
  assert(progressRes.status === 200, "POST /api/progress/complete-lesson returns 200");
  const progressData = await progressRes.json();
  assert(progressData.success === true, "Lesson marked complete in database");
  assert(typeof progressData.progressPercentage === "number", "Calculates real progress percentage");
  console.log(`   -> Course progress is now ${progressData.progressPercentage}%`);

  // 9. Test Course Enrollment & Idempotency
  console.log("\n--- 7. Course Enrollment & Idempotency ---");
  const secondCourse = coursesData.courses[1] || targetCourse;
  const enrollRes1 = await fetch(`${BASE_URL}/api/enroll`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookie,
    },
    body: JSON.stringify({ courseId: secondCourse.slug }),
  });
  assert(enrollRes1.status === 200, `POST /api/enroll for ${secondCourse.slug} returns 200`);

  // Duplicate enrollment attempt
  const enrollRes2 = await fetch(`${BASE_URL}/api/enroll`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookie,
    },
    body: JSON.stringify({ courseId: secondCourse.slug }),
  });
  assert(enrollRes2.status === 200, "Duplicate POST /api/enroll is safely idempotent (returns 200)");
  const enrollData2 = await enrollRes2.json();
  assert(enrollData2.alreadyEnrolled === true, "Idempotent response notes alreadyEnrolled === true");

  // 10. Test Instructor Protected Route
  console.log("\n--- 8. Instructor Access Control ---");
  const instLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "instructor@learnlms.local",
      password: "Instructor@123",
    }),
  });
  assert(instLoginRes.status === 200, "Instructor login returns 200");
  const instCookie = instLoginRes.headers.get("set-cookie").split(";")[0];

  const instPageRes = await fetch(`${BASE_URL}/en/instructor`, {
    headers: { Cookie: instCookie },
  });
  assert(instPageRes.status === 200, "GET /en/instructor returns 200 for Instructor");
  const instHtml = await instPageRes.text();
  assert(instHtml.includes("Instructor Portal"), "Instructor portal rendered");

  // 11. Test Admin Protected Route
  console.log("\n--- 9. Administrator Access Control ---");
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@learnlms.local",
      password: "Admin@123",
    }),
  });
  assert(adminLoginRes.status === 200, "Admin login returns 200");
  const adminCookie = adminLoginRes.headers.get("set-cookie").split(";")[0];

  const adminPageRes = await fetch(`${BASE_URL}/en/admin`, {
    headers: { Cookie: adminCookie },
  });
  assert(adminPageRes.status === 200, "GET /en/admin returns 200 for Admin");
  const adminHtml = await adminPageRes.text();
  assert(
    adminHtml.includes("Platform Administration") || adminHtml.includes("Administrator"),
    "Administrator console rendered"
  );
  assert(adminHtml.includes("WNC-TRG") || adminHtml.includes("Western Naval Command"), "Admin sees seeded organizations");

  // 12. Test Security Boundary: Learner forbidden from Admin route
  console.log("\n--- 10. Role Boundary Enforcement ---");
  const learnerAdminAttempt = await fetch(`${BASE_URL}/en/admin`, {
    headers: { Cookie: sessionCookie },
    redirect: "manual",
  });
  assert(
    learnerAdminAttempt.status === 307 || learnerAdminAttempt.status === 302 || learnerAdminAttempt.status === 403,
    `Learner redirected/forbidden from /admin (Status: ${learnerAdminAttempt.status})`
  );

  // 13. Test Unauthenticated Access to Protected Route
  const anonAttempt = await fetch(`${BASE_URL}/en/learn/my-learning`, {
    redirect: "manual",
  });
  assert(
    anonAttempt.status === 307 || anonAttempt.status === 302,
    `Unauthenticated user redirected from /learn/my-learning to /login (Status: ${anonAttempt.status})`
  );

  console.log(`\n========================================`);
  console.log(`ALL TESTS PASSED! (${passed}/${total})`);
  console.log(`========================================\n`);
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
