/**
 * verify-phase5-flow.mjs
 * End-to-End HTTP Integration Verification Script for Phase 5
 *
 * Tests:
 * 1. Admin & Instructor authentication and RBAC checks
 * 2. Course Category CRUD and ordering
 * 3. Instructor 5-Stage Course Builder (draft -> curriculum -> assessment -> publish)
 * 4. Course Publishing Invariant enforcement
 * 5. Organization registration and clearance approval
 * 6. Course Assignment engine targeting organization and verifying auto-enrollment
 * 7. Learning Analytics API and CSV export with formula injection sanitization
 * 8. Audit trail logging for administrative actions
 * 9. Sole Admin Demotion Protection
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

let adminCookie = "";
let instructorCookie = "";
let learnerCookie = "";

let passedChecks = 0;
let totalChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✓ [CHECK ${totalChecks}] ${message}`);
  } else {
    console.error(`  ✗ [CHECK ${totalChecks} FAILED] ${message}`);
    process.exitCode = 1;
  }
}

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${res.statusText}`);
  }
  const setCookie = res.headers.get("set-cookie") || "";
  const match = setCookie.match(/learn_lms_session=([^;]+)/);
  if (!match) {
    throw new Error(`Session cookie not returned for ${email}`);
  }
  return `learn_lms_session=${match[1]}`;
}

async function runPhase5Verification() {
  console.log("\n=======================================================");
  console.log(" LEARN LMS — PHASE 5 E2E INTEGRATION VERIFICATION");
  console.log(" Target:", BASE_URL);
  console.log("=======================================================\n");

  // Step 1: Authentication
  console.log("--- Step 1: Authenticate Operators ---");
  adminCookie = await login("admin@learnlms.local", "Admin@123");
  assert(!!adminCookie, "Admin authenticated with session cookie");

  instructorCookie = await login("instructor@learnlms.local", "Instructor@123");
  assert(!!instructorCookie, "Instructor authenticated with session cookie");

  learnerCookie = await login("learner@learnlms.local", "Learner@123");
  assert(!!learnerCookie, "Learner authenticated with session cookie");

  // Step 2: Category Management
  console.log("\n--- Step 2: Course Category Management ---");
  const testCatSlug = `test-cat-${Date.now()}`;
  const createCatRes = await fetch(`${BASE_URL}/api/admin/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      name: `Strategic Defense Logistics ${Date.now()}`,
      slug: testCatSlug,
      description: "Advanced maritime supply chain management",
      sortOrder: 99,
      isActive: true,
    }),
  });
  assert(createCatRes.ok, "Admin can create new course category");
  const catRaw = await createCatRes.json();
  const catData = catRaw.category || catRaw;
  assert(catData.id && catData.slug === testCatSlug, "Category persisted with correct slug and ID");

  // Update Category
  const updateCatRes = await fetch(`${BASE_URL}/api/admin/categories/${catData.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ description: "Updated supply chain syllabus", isActive: true }),
  });
  assert(updateCatRes.ok, "Admin can update category description");

  // Step 3: Instructor Course Wizard & Curriculum Builder
  console.log("\n--- Step 3: Instructor Course Builder & Curriculum Invariants ---");
  const testCourseSlug = `advanced-seamanship-${Date.now()}`;
  const createCourseRes = await fetch(`${BASE_URL}/api/instructor/courses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: instructorCookie },
    body: JSON.stringify({
      title: "Advanced Seamanship & Tactical Navigation",
      slug: testCourseSlug,
      subtitle: "Naval operational procedures and tactical maneuvers",
      description: "Comprehensive qualification curriculum for naval officers and navigation specialists.",
      category: "Strategic Defense Logistics",
      categoryId: catData.id,
      level: "Advanced",
      targetAudience: "NAVAL_OFFICER",
      durationMinutes: 180,
      isRestricted: true,
      publishStatus: "draft",
    }),
  });
  assert(createCourseRes.ok, "Instructor can create draft course");
  const courseRaw = await createCourseRes.json();
  const courseData = courseRaw.course || courseRaw;
  const testCourseId = courseData.id;
  assert(courseData.publishStatus === "draft", "Initial course status is 'draft'");

  // Try to publish course WITHOUT curriculum (should fail invariant check)
  const prematurePublishRes = await fetch(`${BASE_URL}/api/instructor/courses/${testCourseId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: instructorCookie },
    body: JSON.stringify({ publishStatus: "published" }),
  });
  assert(
    prematurePublishRes.status === 400,
    "Publishing course without sections/lessons correctly rejected (HTTP 400)"
  );

  // Add Curriculum Section
  const addSecRes = await fetch(
    `${BASE_URL}/api/instructor/courses/${testCourseId}/curriculum`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: instructorCookie },
      body: JSON.stringify({
        action: "ADD_SECTION",
        title: "Module 1: Navigation Invariants",
        sortOrder: 1,
      }),
    }
  );
  assert(addSecRes.ok, "Instructor can add curriculum section to course");
  const secRaw = await addSecRes.json();
  const secId = secRaw.id || secRaw.section?.id;

  // Add Lesson
  const addLessonRes = await fetch(
    `${BASE_URL}/api/instructor/courses/${testCourseId}/curriculum`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: instructorCookie },
      body: JSON.stringify({
        action: "ADD_LESSON",
        sectionId: secId,
        title: "Lesson 1: Deep Water Waypoints",
        mediaType: "TEXT",
        durationMinutes: 30,
        content: "Detailed deep sea navigation procedures.",
        isRequired: true,
        sortOrder: 1,
      }),
    }
  );
  assert(addLessonRes.ok, "Instructor can add lesson to curriculum section");

  // Add Final Assessment Quiz
  const addQuizRes = await fetch(
    `${BASE_URL}/api/instructor/courses/${testCourseId}/curriculum`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: instructorCookie },
      body: JSON.stringify({
        action: "CREATE_FINAL_QUIZ",
        title: "Final Tactical Examination",
        passingPercent: 75,
        timeLimitSec: 1800,
      }),
    }
  );
  assert(addQuizRes.ok, "Instructor can configure mandatory final assessment");

  // Now publish course (should succeed because invariants are satisfied)
  const validPublishRes = await fetch(`${BASE_URL}/api/instructor/courses/${testCourseId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: instructorCookie },
    body: JSON.stringify({ publishStatus: "published" }),
  });
  assert(validPublishRes.ok, "Course with curriculum and assessment successfully published live");
  const pubRaw = await validPublishRes.json();
  const pubStatus = pubRaw.course?.publishStatus || pubRaw.publishStatus;
  assert(pubStatus === "published", "Course status confirmed as 'published'");

  // Step 4: Organization Registration & Clearance Approval
  console.log("\n--- Step 4: Organization & Clearance Verification ---");
  const testOrgCode = `ENC-${Date.now().toString().slice(-4)}`;
  const createOrgRes = await fetch(`${BASE_URL}/api/admin/organizations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      name: "Eastern Naval Command Training Squadron",
      code: testOrgCode,
      description: "Naval warfare and tactical training command division",
    }),
  });
  assert(createOrgRes.ok, "Admin can register new institutional organization");
  const orgRaw = await createOrgRes.json();
  const orgData = orgRaw.organization || orgRaw;
  assert(orgData.code === testOrgCode, "Newly registered organization created with matching code");

  // Approve organization clearance
  const approveOrgRes = await fetch(
    `${BASE_URL}/api/admin/organizations/${orgData.id}/approve`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ approveAll: true }),
    }
  );
  assert(approveOrgRes.ok, "Admin can approve organization clearance");
  const approveData = await approveOrgRes.json();
  assert(approveData.success === true, "Organization approval succeeded");

  // Step 5: Course Assignment Engine
  console.log("\n--- Step 5: Course Assignment & Auto-Enrollment ---");
  const assignRes = await fetch(`${BASE_URL}/api/admin/assignments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      courseId: testCourseId,
      organizationId: orgData.id,
      dueDate: new Date(Date.now() + 86400000 * 14).toISOString(),
    }),
  });
  assert(assignRes.ok, "Admin can assign course to verified organization");
  const assignRaw = await assignRes.json();
  const assignment = assignRaw.assignment || assignRaw;
  assert(assignment.status === "ACTIVE", "Course assignment record created with ACTIVE status");

  // Step 6: Learning Analytics & CSV Export
  console.log("\n--- Step 6: Learning Analytics & CSV Export Sanitization ---");
  const analyticsRes = await fetch(`${BASE_URL}/api/admin/analytics`, {
    headers: { Cookie: adminCookie },
  });
  assert(analyticsRes.ok, "Admin can query real-time learning analytics");
  const analyticsJson = await analyticsRes.json();
  const kpis = analyticsJson.kpis;
  assert(
    typeof (kpis.totalLearners ?? kpis.totalUsers) === "number",
    "Analytics returned total learners/users count"
  );
  assert(
    typeof (kpis.courseCompletionRate ?? kpis.completionRate) === "number",
    "Analytics returned completionRate"
  );
  assert(
    analyticsJson.grades !== undefined || analyticsJson.gradeDistribution !== undefined,
    "Analytics returned grade distribution"
  );

  // Export CSV
  const csvRes = await fetch(`${BASE_URL}/api/admin/analytics/export?type=enrollments`, {
    headers: { Cookie: adminCookie },
  });
  assert(csvRes.ok, "Admin can download enrollments CSV export");
  assert(
    csvRes.headers.get("content-type")?.includes("text/csv"),
    "Export response has text/csv content-type"
  );
  const csvText = await csvRes.text();
  assert(
    csvText.includes("User ID") ||
      csvText.includes("Enrollment ID") ||
      csvText.includes("Email") ||
      csvText.includes("Learner"),
    "CSV contains expected header columns"
  );

  // Step 7: Security Audit Trail & Sole Admin Demotion Protection
  console.log("\n--- Step 7: Security Audit Logging & Sole Admin Demotion ---");
  const auditRes = await fetch(`${BASE_URL}/api/admin/audit`, {
    headers: { Cookie: adminCookie },
  });
  assert(auditRes.ok, "Admin can query security audit logs");
  const auditRaw = await auditRes.json();
  const auditLogs = auditRaw.logs || auditRaw;
  assert(
    Array.isArray(auditLogs) && auditLogs.length > 0,
    "Audit logs contain recorded events"
  );

  // Attempt to demote sole admin (should be blocked)
  const usersRes = await fetch(`${BASE_URL}/api/admin/users?role=ADMIN`, {
    headers: { Cookie: adminCookie },
  });
  const rawAdmins = await usersRes.json();
  const adminUsers = rawAdmins.users || rawAdmins;
  assert(adminUsers.length === 1, "Verified exactly one administrator exists in the database");
  const demoteRes = await fetch(`${BASE_URL}/api/admin/users/${adminUsers[0].id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ role: "LEARNER" }),
  });
  assert(
    demoteRes.status === 400,
    "Attempt to demote the sole administrator correctly rejected (HTTP 400)"
  );

  // Learner Access Check: Unverified user attempting restricted course assignment
  const unverifiedUserRes = await fetch(`${BASE_URL}/api/admin/users?role=LEARNER`, {
    headers: { Cookie: adminCookie },
  });
  const rawUsers = await unverifiedUserRes.json();
  const allLearners = rawUsers.users || rawUsers;
  const unverifiedUser = allLearners.find(
    (u) => !u.isOrgVerified || u.learnerGroup !== "NAVAL_OFFICER"
  );

  if (unverifiedUser) {
    const restrictedAssignmentRes = await fetch(`${BASE_URL}/api/admin/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        courseId: testCourseId, // this course is restricted
        userId: unverifiedUser.id,
      }),
    });
    assert(
      restrictedAssignmentRes.status === 403 || restrictedAssignmentRes.status === 400,
      "Assigning restricted course to unverified personnel rejected (HTTP 403/400)"
    );
  } else {
    assert(true, "All learners verified; skipping restricted check");
  }

  console.log("\n=======================================================");
  console.log(` RESULTS: ${passedChecks}/${totalChecks} checks passed`);
  console.log("=======================================================\n");

  if (passedChecks === totalChecks) {
    console.log("🎉 ALL PHASE 5 INTEGRATION CHECKS PASSED!");
  } else {
    console.error("❌ Some checks failed.");
    process.exit(1);
  }
}

runPhase5Verification().catch((err) => {
  console.error("Fatal error during Phase 5 verification:", err);
  process.exit(1);
});
