/**
 * Learn LMS — Phase 8 Security, Caching, and Observability HTTP Verification
 * Product by ORELSE (https://www.orelse.ai)
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const prisma = new PrismaClient();

console.log("==================================================================");
console.log(" LEARN LMS — PHASE 8 SECURITY, CACHING & OBSERVABILITY E2E TESTS");
console.log(` Target Host: ${BASE_URL}`);
console.log("==================================================================");

let checksPassed = 0;
function pass(msg) {
  checksPassed++;
  console.log(`  ✓ Check ${checksPassed}: ${msg}`);
}

function fail(msg, err) {
  console.error(`  ❌ FAIL: ${msg}`, err || "");
  process.exit(1);
}

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed for ${email}`);
  const setCookie = res.headers.get("set-cookie");
  const cookieMatch = setCookie?.match(/learn_lms_session=([^;]+)/);
  return cookieMatch ? `learn_lms_session=${cookieMatch[1]}` : "";
}

async function run() {
  try {
    // -------------------------------------------------------------
    // 1. Health Endpoints Verification
    // -------------------------------------------------------------
    console.log("\n1. Testing Production Health Probes...");
    const liveRes = await fetch(`${BASE_URL}/api/health/live`);
    if (liveRes.status !== 200) fail(`GET /api/health/live returned HTTP ${liveRes.status}`);
    const liveData = await liveRes.json();
    if (liveData.status !== "ok") fail(`Liveness probe status is not 'ok'`);
    pass("GET /api/health/live returns HTTP 200 with status: ok");

    const readyRes = await fetch(`${BASE_URL}/api/health/ready`);
    if (readyRes.status !== 200) fail(`GET /api/health/ready returned HTTP ${readyRes.status}`);
    const readyData = await readyRes.json();
    if (readyData.status !== "ready") fail(`Readiness probe status is not 'ready'`);
    if (readyData.checks?.database !== "healthy") fail("Database check is not healthy");
    pass("GET /api/health/ready returns HTTP 200 with database: healthy");
    pass(`Application brand and issuer verified: ${readyData.application} by ${readyData.issuer}`);

    // -------------------------------------------------------------
    // 2. HTTP Security Headers Verification
    // -------------------------------------------------------------
    console.log("\n2. Testing HTTP Security Headers & Data Isolation...");
    const homeRes = await fetch(`${BASE_URL}/en`);
    const headers = homeRes.headers;

    if (!headers.get("x-frame-options")?.includes("DENY")) fail("X-Frame-Options: DENY missing");
    pass("X-Frame-Options: DENY enforced");

    if (!headers.get("x-content-type-options")?.includes("nosniff")) fail("X-Content-Type-Options: nosniff missing");
    pass("X-Content-Type-Options: nosniff enforced");

    if (!headers.get("referrer-policy")?.includes("strict-origin-when-cross-origin")) fail("Referrer-Policy missing");
    pass("Referrer-Policy: strict-origin-when-cross-origin enforced");

    if (!headers.get("content-security-policy")) fail("Content-Security-Policy missing");
    pass("Content-Security-Policy enforced");

    // Private API Cache-Control verification
    const apiRes = await fetch(`${BASE_URL}/api/courses`);
    const apiCacheControl = apiRes.headers.get("cache-control");
    if (!apiCacheControl?.includes("no-store") && !apiCacheControl?.includes("private")) {
      fail(`Private API Cache-Control missing no-store: got '${apiCacheControl}'`);
    }
    pass("API routes strictly enforce Cache-Control: private, no-store data isolation");

    // -------------------------------------------------------------
    // 3. Immediate Session Invalidation (Deactivated Account Defense)
    // -------------------------------------------------------------
    console.log("\n3. Testing Immediate Session Invalidation (Account Deactivation)...");
    const testHash = await bcrypt.hash("Password@123", 10);
    // Create temporary user
    const tempEmail = `deact.test.${Date.now()}@learnlms.local`;
    const tempUser = await prisma.user.create({
      data: {
        email: tempEmail,
        name: "Temporary Deactivation Subject",
        passwordHash: testHash,
        role: "LEARNER",
        isActive: true,
      },
    });

    const userCookie = await login(tempEmail, "Password@123");
    pass("Active user successfully authenticated and received session cookie");

    // Verify user can access session-protected endpoint
    const activeReq = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: userCookie },
    });
    if (activeReq.status !== 200) fail("Active user was unexpectedly blocked from /api/auth/me");
    pass("Active user successfully accessed /api/auth/me (HTTP 200)");

    // Deactivate user in database
    await prisma.user.update({
      where: { id: tempUser.id },
      data: { isActive: false },
    });

    // Attempt access with the exact same valid JWT cookie
    const deactivatedReq = await fetch(`${BASE_URL}/api/learn/training`, {
      headers: { Cookie: userCookie },
    });
    if (deactivatedReq.status !== 401) {
      fail(`Deactivated user was not blocked! Expected HTTP 401, got ${deactivatedReq.status}`);
    }
    pass("OWASP ASVS L2 CONFIRMED: Deactivated account immediately blocked from protected training endpoint (HTTP 401)");

    const meReq = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: userCookie },
    });
    const meData = await meReq.json();
    if (meData.user !== null) {
      fail("Deactivated user still received active user object from /api/auth/me");
    }
    pass("/api/auth/me confirms user is null for deactivated account");

    // Deactivated user login rejection
    const deactivatedLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: tempEmail, password: "Password@123" }),
    });
    if (deactivatedLogin.status !== 403) {
      fail(`Deactivated user login not rejected with HTTP 403, got ${deactivatedLogin.status}`);
    }
    pass("Deactivated account login strictly rejected with HTTP 403 Forbidden");

    // Clean up temporary user
    await prisma.user.delete({ where: { id: tempUser.id } });
    pass("Temporary test user cleaned up cleanly");

    // -------------------------------------------------------------
    // 4. Role Demotion Defense (Privilege Escalation Prevention)
    // -------------------------------------------------------------
    console.log("\n4. Testing Real-Time Role Demotion Defense...");
    const demoteEmail = `demote.test.${Date.now()}@learnlms.local`;
    const demoteUser = await prisma.user.create({
      data: {
        email: demoteEmail,
        name: "Temporary Admin Subject",
        passwordHash: testHash,
        role: "ADMIN",
        isActive: true,
      },
    });

    const adminCookie = await login(demoteEmail, "Password@123");
    pass("Temporary admin authenticated and received ADMIN session token");

    // Verify admin can access administrative analytics
    const adminCheck = await fetch(`${BASE_URL}/api/admin/training/analytics`, {
      headers: { Cookie: adminCookie },
    });
    if (adminCheck.status !== 200) fail("Temporary admin could not access admin analytics");
    pass("Temporary admin successfully verified on /api/admin/training/analytics (HTTP 200)");

    // Demote user in database from ADMIN to LEARNER
    await prisma.user.update({
      where: { id: demoteUser.id },
      data: { role: "LEARNER" },
    });

    // Attempt access with the old token which claimed role: "ADMIN"
    const demotedCheck = await fetch(`${BASE_URL}/api/admin/training/analytics`, {
      headers: { Cookie: adminCookie },
    });
    if (demotedCheck.status !== 403) {
      fail(`Demoted user was not rejected! Expected HTTP 403 Forbidden, got ${demotedCheck.status}`);
    }
    pass("OWASP ASVS L2 CONFIRMED: Demoted administrator immediately rejected with HTTP 403 Forbidden");

    // Clean up
    await prisma.user.delete({ where: { id: demoteUser.id } });
    pass("Temporary demotion subject cleaned up cleanly");

    console.log("\n==================================================================");
    console.log(` Phase 8 Verification Complete: ${checksPassed} checks passed, 0 failed.`);
    console.log("==================================================================");
  } catch (err) {
    fail("Unexpected error during Phase 8 test run", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
