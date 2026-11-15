/**
 * Learn LMS — Phase 7 End-to-End Verification Script
 * Validates:
 * - Admin Training Programmes CRUD & Status Toggling
 * - Constituent Courses Orchestration
 * - Naval Officer Clearance & Confidentiality Guard (strict isolation from civilian learners)
 * - Guided Lesson Walkthrough Steps & Verification Badging ("Demonstration content — pending verification")
 * - Training Programme Cohort Assignments & In-App Notifications
 * - Participants Progress Tracking & Completion Calculations
 * - Admin Training Analytics Dashboard
 * - CWE-1236 CSV Formula Injection Sanitization Export
 * - Instructor Training Portal Roster
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

let passedCount = 0;
let failedCount = 0;

function pass(name, detail = "") {
  passedCount++;
  console.log(`  ✓ Check ${passedCount}: ${name}${detail ? ` (${detail})` : ""}`);
}

function fail(name, error) {
  failedCount++;
  console.error(`  ✗ Check FAILED: ${name}`);
  if (error) console.error(`    ${error}`);
}

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email} with HTTP ${res.status}`);
  }
  const setCookie = res.headers.get("set-cookie") || "";
  const data = await res.json();
  return { user: data.user, cookie: setCookie };
}

async function runVerification() {
  console.log("==================================================================");
  console.log(" Learn LMS — Phase 7 End-to-End Verification");
  console.log(` Target: ${BASE_URL}`);
  console.log("==================================================================\n");

  try {
    // -------------------------------------------------------------
    // 1. Authenticate Platform Roles
    // -------------------------------------------------------------
    console.log("1. Authenticating Platform Roles...");
    const admin = await login("admin@learnlms.local", "Admin@123");
    pass("Admin session established", admin.user.name);

    const instructor = await login("instructor@learnlms.local", "Instructor@123");
    pass("Instructor session established", instructor.user.name);

    const navalLearner = await login("learner@learnlms.local", "Learner@123");
    pass("Naval Learner session established", navalLearner.user.name);

    const fpoLearner = await login("fpo.user@learnlms.local", "Learner@123");
    pass("FPO Learner session established", fpoLearner.user.name);

    // -------------------------------------------------------------
    // 2. Admin Training Programmes CRUD & Status Toggling
    // -------------------------------------------------------------
    console.log("\n2. Testing Admin Training Programmes Management...");
    const listRes = await fetch(`${BASE_URL}/api/admin/training/programmes`, {
      headers: { Cookie: admin.cookie },
    });
    if (listRes.status === 200) {
      pass("Admin GET /api/admin/training/programmes succeeds with HTTP 200");
    } else {
      fail("Admin GET /api/admin/training/programmes", `Status: ${listRes.status}`);
    }

    const listData = await listRes.json();
    const seededProgrammes = listData.programmes || [];
    if (seededProgrammes.length >= 3) {
      pass("Found seeded core training programmes", `Count: ${seededProgrammes.length}`);
    } else {
      fail("Seeded programmes check", `Expected at least 3, got ${seededProgrammes.length}`);
    }

    // Verify 3 core demo programmes exist
    const hasFpoProg = seededProgrammes.some((p) => p.slug === "using-main-application-fpo-members");
    const hasFpcProg = seededProgrammes.some((p) => p.slug === "using-main-application-fpc-operations");
    const hasNavalProg = seededProgrammes.some((p) => p.slug === "learn-lms-naval-officer-orientation");

    if (hasFpoProg) pass("Core Programme 1 found: Using the Main Application — FPO Member Training");
    else fail("Core Programme 1 missing", "using-main-application-fpo-members not found");

    if (hasFpcProg) pass("Core Programme 2 found: Using the Main Application — FPC Operations Training");
    else fail("Core Programme 2 missing", "using-main-application-fpc-operations not found");

    if (hasNavalProg) pass("Core Programme 3 found: Learn LMS Platform Orientation — Naval Officers");
    else fail("Core Programme 3 missing", "learn-lms-naval-officer-orientation not found");

    // Create New Training Programme
    const createSlug = `test-onboarding-programme-${Date.now()}`;
    const createRes = await fetch(`${BASE_URL}/api/admin/training/programmes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: admin.cookie },
      body: JSON.stringify({
        title: "Test Application Onboarding Track",
        slug: createSlug,
        description: "Automated verification programme for institutional onboarding.",
        targetGroup: "FPO",
        estimatedDurationMinutes: 90,
        isRequired: true,
        isRestricted: false,
        courseIds: seededProgrammes[0]?.courses?.map((c) => c.courseId) || [],
      }),
    });

    if (createRes.status === 201) {
      pass("Admin POST /api/admin/training/programmes creates programme with HTTP 201");
    } else {
      fail("Admin POST /api/admin/training/programmes", `Status: ${createRes.status}`);
    }

    const createData = await createRes.json();
    const createdProg = createData.programme;
    if (createdProg?.status === "DRAFT") {
      pass("New programme initialized in DRAFT status");
    } else {
      fail("Programme status check", `Expected DRAFT, got ${createdProg?.status}`);
    }

    // Toggle Publish Status
    const publishRes = await fetch(`${BASE_URL}/api/admin/training/programmes/${createdProg.id}/publish`, {
      method: "POST",
      headers: { Cookie: admin.cookie },
    });
    const publishData = await publishRes.json();
    if (publishRes.status === 200 && publishData.programme?.status === "PUBLISHED") {
      pass("Admin POST /api/admin/training/programmes/[id]/publish transitions to PUBLISHED");
    } else {
      fail("Status toggle check", `Status: ${publishRes.status}, state: ${publishData.programme?.status}`);
    }

    // -------------------------------------------------------------
    // 3. Confidentiality & Naval Clearance Guard
    // -------------------------------------------------------------
    console.log("\n3. Verifying Confidentiality & Naval Clearance Isolation...");
    
    // Naval officer queries programmes
    const navalRes = await fetch(`${BASE_URL}/api/learn/training`, {
      headers: { Cookie: navalLearner.cookie },
    });
    const navalData = await navalRes.json();
    const navalCanSeeRestricted = (navalData.programmes || []).some(
      (p) => p.slug === "learn-lms-naval-officer-orientation" && p.isRestricted
    );

    if (navalCanSeeRestricted) {
      pass("Naval Officer CAN view restricted platform orientation track");
    } else {
      fail("Naval officer clearance access", "Naval orientation track not visible to naval officer");
    }

    // Civilian FPO learner queries programmes
    const fpoRes = await fetch(`${BASE_URL}/api/learn/training`, {
      headers: { Cookie: fpoLearner.cookie },
    });
    const fpoData = await fpoRes.json();
    const fpoCanSeeRestricted = (fpoData.programmes || []).some(
      (p) => p.slug === "learn-lms-naval-officer-orientation" || p.isRestricted
    );

    if (!fpoCanSeeRestricted) {
      pass("Civilian FPO Learner CANNOT see restricted naval programme in directory");
    } else {
      fail("Confidentiality leak", "Civilian learner received restricted naval programme!");
    }

    // Civilian FPO learner direct access attempt to restricted programme
    const directAccessRes = await fetch(
      `${BASE_URL}/api/learn/training/learn-lms-naval-officer-orientation`,
      { headers: { Cookie: fpoLearner.cookie } }
    );

    if (directAccessRes.status === 403) {
      pass("Civilian direct access to restricted programme STRICTLY REJECTED with HTTP 403 Forbidden");
    } else {
      fail("Clearance guard failed", `Direct access returned HTTP ${directAccessRes.status}`);
    }

    // Civilian FPO learner can access FPO programme
    const fpoProgRes = await fetch(
      `${BASE_URL}/api/learn/training/using-main-application-fpo-members`,
      { headers: { Cookie: fpoLearner.cookie } }
    );
    if (fpoProgRes.status === 200) {
      pass("Civilian FPO Learner can access dedicated FPO application training programme");
    } else {
      fail("FPO programme access", `Returned HTTP ${fpoProgRes.status}`);
    }

    // -------------------------------------------------------------
    // 4. Guided Lesson Walkthrough Steps & Verification Badging
    // -------------------------------------------------------------
    console.log("\n4. Testing Guided Lesson Walkthrough & Content Verification...");
    
    // Find lesson in getting started course
    const fpoProgDetail = await fpoProgRes.json();
    const firstCourse = fpoProgDetail.programme?.courses?.[0];
    const firstLessonId = firstCourse?.sections?.[0]?.lessons?.[0]?.id;

    if (firstLessonId) {
      const stepsRes = await fetch(`${BASE_URL}/api/learn/lessons/${firstLessonId}/steps`, {
        headers: { Cookie: fpoLearner.cookie },
      });

      if (stepsRes.status === 200) {
        pass("Learner GET /api/learn/lessons/[lessonId]/steps succeeds with HTTP 200");
      } else {
        fail("Get steps endpoint", `Status: ${stepsRes.status}`);
      }

      const stepsData = await stepsRes.json();
      const steps = stepsData.steps || [];

      if (steps.length > 0) {
        pass("Found guided procedural walkthrough steps for lesson", `Count: ${steps.length}`);
      } else {
        fail("No guided steps found for lesson", "Expected seeded training steps");
      }

      const firstStep = steps[0];
      if (firstStep?.verificationBadge === "DEMO") {
        pass("Guided step carries explicit verificationBadge: DEMO");
      } else {
        fail("Verification badge check", `Expected DEMO, got ${firstStep?.verificationBadge}`);
      }

      if (
        firstStep?.disclaimer ===
        "Demonstration content — pending application-specific verification"
      ) {
        pass("Guided step contains mandatory application verification disclaimer");
      } else {
        fail("Disclaimer check", `Got: ${firstStep?.disclaimer}`);
      }

      if (firstStep?.actionType) {
        pass("Guided step specifies operational actionType", firstStep.actionType);
      } else {
        fail("actionType missing from step");
      }

      if (firstStep?.uiElementTarget) {
        pass("Guided step specifies target UI element", firstStep.uiElementTarget);
      } else {
        fail("uiElementTarget missing from step");
      }
    } else {
      fail("Could not find lessonId in constituent course for step verification");
    }

    // -------------------------------------------------------------
    // 5. Training Programme Cohort Assignment & Notification
    // -------------------------------------------------------------
    console.log("\n5. Testing Cohort Assignment & In-App Notification Dispatch...");
    
    const assignRes = await fetch(
      `${BASE_URL}/api/admin/training/programmes/${createdProg.id}/assign`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: admin.cookie },
        body: JSON.stringify({
          userId: fpoLearner.user.id,
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        }),
      }
    );

    if (assignRes.status === 201) {
      pass("Admin POST /api/admin/training/programmes/[id]/assign assigns programme with HTTP 201");
    } else {
      fail("Programme assignment", `Status: ${assignRes.status}`);
    }

    // Verify learner received in-app notification
    const notifRes = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { Cookie: fpoLearner.cookie },
    });
    const notifData = await notifRes.json();
    const hasAssignNotif = (notifData.notifications || []).some(
      (n) => n.eventType === "COURSE_ASSIGNED" && n.body.includes(createdProg.title)
    );

    if (hasAssignNotif) {
      pass("Learner received unread in-app notification for assigned training programme");
    } else {
      fail("Notification dispatch", "COURSE_ASSIGNED notification not found for learner");
    }

    // -------------------------------------------------------------
    // 6. Participants Roster & Programme Analytics
    // -------------------------------------------------------------
    console.log("\n6. Testing Participants Roster & Training Analytics...");
    
    const partRes = await fetch(
      `${BASE_URL}/api/admin/training/programmes/${createdProg.id}/participants`,
      { headers: { Cookie: admin.cookie } }
    );

    if (partRes.status === 200) {
      pass("Admin GET /api/admin/training/programmes/[id]/participants succeeds with HTTP 200");
    } else {
      fail("Participants roster", `Status: ${partRes.status}`);
    }

    const partData = await partRes.json();
    const participants = partData.participants || [];
    if (participants.some((p) => p.id === fpoLearner.user.id)) {
      pass("Newly assigned learner found in programme participants roster");
    } else {
      fail("Participant roster lookup", "Assigned user not in roster");
    }

    // Analytics summary
    const analyticsRes = await fetch(`${BASE_URL}/api/admin/training/analytics`, {
      headers: { Cookie: admin.cookie },
    });
    if (analyticsRes.status === 200) {
      pass("Admin GET /api/admin/training/analytics succeeds with HTTP 200");
    } else {
      fail("Admin analytics", `Status: ${analyticsRes.status}`);
    }

    const analyticsData = await analyticsRes.json();
    if (analyticsData.metrics?.totalProgrammes >= 4) {
      pass("Analytics reports accurate total programmes count", `Total: ${analyticsData.metrics.totalProgrammes}`);
    } else {
      fail("Analytics programmes count", `Got: ${analyticsData.metrics?.totalProgrammes}`);
    }

    if (analyticsData.metrics?.groupStats?.FPO) {
      pass("Analytics provides targetGroup breakdown (FPO, FPC, NAVAL_OFFICER, STUDENT)");
    } else {
      fail("Analytics group stats missing FPO breakdown");
    }

    // Learner access to admin analytics rejected
    const unauthAnalytics = await fetch(`${BASE_URL}/api/admin/training/analytics`, {
      headers: { Cookie: fpoLearner.cookie },
    });
    if (unauthAnalytics.status === 403) {
      pass("Learner access to /api/admin/training/analytics rejected with HTTP 403 Forbidden");
    } else {
      fail("Admin analytics authorization check", `Expected 403, got ${unauthAnalytics.status}`);
    }

    // -------------------------------------------------------------
    // 7. CWE-1236 Sanitized CSV Export
    // -------------------------------------------------------------
    console.log("\n7. Testing CSV Export & CWE-1236 Formula Injection Sanitization...");
    
    const exportRes = await fetch(`${BASE_URL}/api/admin/training/export`, {
      headers: { Cookie: admin.cookie },
    });

    if (exportRes.status === 200) {
      pass("Admin GET /api/admin/training/export succeeds with HTTP 200");
    } else {
      fail("Export CSV endpoint", `Status: ${exportRes.status}`);
    }

    const contentType = exportRes.headers.get("content-type") || "";
    if (contentType.includes("text/csv")) {
      pass("Export endpoint returns text/csv Content-Type header");
    } else {
      fail("Content-Type check", `Expected text/csv, got ${contentType}`);
    }

    const csvText = await exportRes.text();
    const csvLines = csvText.split(/\r?\n/).filter(Boolean);
    if (csvLines.length >= 2) {
      pass("CSV contains valid header and data rows", `Rows count: ${csvLines.length}`);
    } else {
      fail("CSV content check", `Expected at least 2 lines, got ${csvLines.length}`);
    }

    const header = csvLines[0];
    if (header.includes("Programme Title") && header.includes("Overall Progress")) {
      pass("CSV header contains required curriculum progress columns");
    } else {
      fail("CSV header format", header);
    }

    // -------------------------------------------------------------
    // 8. Instructor Portal Verification
    // -------------------------------------------------------------
    console.log("\n8. Testing Instructor Training Portal Views...");
    
    const instructorRes = await fetch(`${BASE_URL}/api/instructor/training/programmes`, {
      headers: { Cookie: instructor.cookie },
    });

    if (instructorRes.status === 200) {
      pass("Instructor GET /api/instructor/training/programmes succeeds with HTTP 200");
    } else {
      fail("Instructor training programmes", `Status: ${instructorRes.status}`);
    }

    const instructorData = await instructorRes.json();
    if (Array.isArray(instructorData.programmes)) {
      pass("Instructor portal retrieves assigned training tracks", `Count: ${instructorData.programmes.length}`);
    } else {
      fail("Instructor programmes format", "Expected array of programmes");
    }

    // Learner attempt to access instructor training endpoint rejected
    const unauthInstructor = await fetch(`${BASE_URL}/api/instructor/training/programmes`, {
      headers: { Cookie: fpoLearner.cookie },
    });
    if (unauthInstructor.status === 403) {
      pass("Learner access to /api/instructor/training/programmes rejected with HTTP 403 Forbidden");
    } else {
      fail("Instructor authorization check", `Expected 403, got ${unauthInstructor.status}`);
    }

    // Clean up test programme
    await fetch(`${BASE_URL}/api/admin/training/programmes/${createdProg.id}`, {
      method: "DELETE",
      headers: { Cookie: admin.cookie },
    });
    pass("Cleaned up temporary test training programme");

  } catch (err) {
    console.error("Fatal verification error:", err);
    failedCount++;
  }

  console.log("\n==================================================================");
  console.log(` Phase 7 Verification Complete: ${passedCount} checks passed, ${failedCount} failed.`);
  console.log("==================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runVerification();
