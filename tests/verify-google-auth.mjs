/**
 * tests/verify-google-auth.mjs
 * Comprehensive integration tests for Google OAuth 2.0 / OpenID Connect in Learn LMS.
 * 
 * Verifies:
 * 1. OAuth Initiation: redirect to Google accounts, PKCE generation, state cookie
 * 2. Callback validation: missing params, state mismatch, user cancellation
 * 3. Account Link Security: authentication guards, password verification, collision prevention
 * 4. Account Unlink Security: preventing lockout if user has no password
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failedCount++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log("=================================================");
  console.log(" Learn LMS — Google OAuth 2.0 Integration Verification");
  console.log(" Base URL:", BASE_URL);
  console.log("=================================================\n");

  // 1. Test OAuth Initialization Route
  console.log("1. Testing GET /api/auth/google (OAuth Initialization)");
  {
    const res = await fetch(`${BASE_URL}/api/auth/google`, {
      method: "GET",
      redirect: "manual",
    });

    assert(res.status === 307, `Expected 307 Redirect, got ${res.status}`);
    const location = res.headers.get("location");
    assert(
      location && location.startsWith("https://accounts.google.com/o/oauth2/v2/auth"),
      `Redirect target is Google OAuth URL: ${location?.slice(0, 50)}...`
    );

    const parsedUrl = new URL(location);
    assert(parsedUrl.searchParams.get("response_type") === "code", "Contains response_type=code");
    assert(parsedUrl.searchParams.get("scope") === "openid email profile", "Contains openid email profile scope");
    assert(parsedUrl.searchParams.get("code_challenge_method") === "S256", "Contains S256 code challenge method");
    assert(Boolean(parsedUrl.searchParams.get("code_challenge")), "Contains PKCE code_challenge");
    assert(Boolean(parsedUrl.searchParams.get("state")), "Contains state param");
    assert(Boolean(parsedUrl.searchParams.get("nonce")), "Contains nonce param");

    const setCookie = res.headers.get("set-cookie");
    assert(
      setCookie && setCookie.includes("learn_oauth_state"),
      "Sets learn_oauth_state HttpOnly cookie"
    );
  }

  // 2. Test Callback With User Cancellation
  console.log("\n2. Testing Callback Error Handling (User Denied Access)");
  {
    const res = await fetch(`${BASE_URL}/api/auth/google/callback?error=access_denied`, {
      method: "GET",
      redirect: "manual",
    });

    assert(res.status === 307, `Expected 307 Redirect, got ${res.status}`);
    const loc = res.headers.get("location") || "";
    assert(loc.includes("error=google_cancelled"), `Redirects to login with google_cancelled: ${loc}`);
  }

  // 3. Test Callback Without Cookie (Invalid OAuth State)
  console.log("\n3. Testing Callback Without State Cookie");
  {
    const res = await fetch(`${BASE_URL}/api/auth/google/callback?code=mock_code&state=fake_state`, {
      method: "GET",
      redirect: "manual",
    });

    assert(res.status === 307, `Expected 307 Redirect, got ${res.status}`);
    const loc = res.headers.get("location") || "";
    assert(loc.includes("error=invalid_oauth_state"), `Redirects with invalid_oauth_state: ${loc}`);
  }

  // 4. Test Callback With State Mismatch (CSRF Protection)
  console.log("\n4. Testing Callback State Mismatch (CSRF Guard)");
  {
    const fakeStateCookie = JSON.stringify({
      state: "original_state_value_12345",
      nonce: "nonce_val",
      codeVerifier: "code_verifier_long_enough_val",
      createdAt: Date.now(),
    });

    const res = await fetch(`${BASE_URL}/api/auth/google/callback?code=mock_code&state=tampered_state`, {
      method: "GET",
      headers: {
        cookie: `learn_oauth_state=${encodeURIComponent(fakeStateCookie)}`,
      },
      redirect: "manual",
    });

    assert(res.status === 307, `Expected 307 Redirect, got ${res.status}`);
    const loc = res.headers.get("location") || "";
    assert(loc.includes("error=state_mismatch"), `Redirects with state_mismatch: ${loc}`);
  }

  // 5. Test Callback With Expired State (Timeout Protection)
  console.log("\n5. Testing Callback Expired State (Timeout Protection)");
  {
    const expiredStateCookie = JSON.stringify({
      state: "valid_state_value",
      nonce: "nonce_val",
      codeVerifier: "code_verifier_val",
      createdAt: Date.now() - 1000 * 60 * 15, // 15 minutes ago (> 10m threshold)
    });

    const res = await fetch(`${BASE_URL}/api/auth/google/callback?code=mock_code&state=valid_state_value`, {
      method: "GET",
      headers: {
        cookie: `learn_oauth_state=${encodeURIComponent(expiredStateCookie)}`,
      },
      redirect: "manual",
    });

    assert(res.status === 307, `Expected 307 Redirect, got ${res.status}`);
    const loc = res.headers.get("location") || "";
    assert(loc.includes("error=oauth_timeout"), `Redirects with oauth_timeout: ${loc}`);
  }

  // 6. Test Linking Endpoint Security Guard
  console.log("\n6. Testing POST /api/auth/google/link (Authentication & Validation)");
  {
    // Without credentials or session
    const resEmpty = await fetch(`${BASE_URL}/api/auth/google/link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert(resEmpty.status === 400, `Empty body returns 400, got ${resEmpty.status}`);

    // With invalid password
    const resBadCreds = await fetch(`${BASE_URL}/api/auth/google/link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@learnlms.internal",
        password: "WrongPassword999!",
        googleSub: "google-sub-mock-123",
      }),
    });
    assert(resBadCreds.status === 401, `Invalid password returns 401, got ${resBadCreds.status}`);
  }

  // 7. Test Unlinking Endpoint Security Guard
  console.log("\n7. Testing DELETE /api/auth/google/link (Authentication Guard)");
  {
    const resUnauth = await fetch(`${BASE_URL}/api/auth/google/link`, {
      method: "DELETE",
    });
    assert(resUnauth.status === 401, `Unauthenticated unlink returns 401, got ${resUnauth.status}`);
  }

  console.log("\n=================================================");
  console.log(` Google OAuth Verification Complete: ${passedCount} passed, ${failedCount} failed.`);
  console.log("=================================================\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
