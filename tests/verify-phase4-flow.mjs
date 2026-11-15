// End-to-end HTTP integration test for Phase 4 Digital Certification, ORELSE Branding & Ledger
const BASE_URL = "http://localhost:3000";

async function run() {
  console.log("=== PHASE 4 DIGITAL CERTIFICATION & VERIFICATION E2E TESTS ===\n");
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

  // 1. Public JWKS & Issuer Profile
  console.log("\n--- 1. Public JWKS & ORELSE Issuer Profile ---");
  const jwksRes = await fetch(`${BASE_URL}/api/issuer/orelse/jwks`);
  assert(jwksRes.status === 200, "GET /api/issuer/orelse/jwks returns 200");
  const jwksData = await jwksRes.json();
  assert(Array.isArray(jwksData.keys) && jwksData.keys.length > 0, "JWKS contains public keys array");
  const primaryKey = jwksData.keys[0];
  assert(primaryKey.kid === "orelse-demo-key-2026-v1", "Key ID matches orelse-demo-key-2026-v1");
  assert(primaryKey.kty === "EC" && primaryKey.crv === "P-256", "Key algorithm is ECDSA P-256 (ES256)");
  assert(primaryKey.d === undefined, "Private key 'd' is NOT exposed in public JWKS");

  const issuerPageRes = await fetch(`${BASE_URL}/en/issuer/orelse`);
  assert(issuerPageRes.status === 200, "GET /en/issuer/orelse returns 200");
  const issuerHtml = await issuerPageRes.text();
  assert(issuerHtml.includes("ORELSE"), "Issuer page prominently displays ORELSE branding");
  assert(issuerHtml.includes("ORELSE Learning Certification"), "Issuer page displays credential programme");

  // 2. Admin Login & Certificate Registry Inspection
  console.log("\n--- 2. Admin Login & Certificate Management Registry ---");
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

  const adminCertsRes = await fetch(`${BASE_URL}/api/admin/certificates`, {
    headers: { Cookie: adminSessionCookie },
  });
  assert(adminCertsRes.status === 200, "GET /api/admin/certificates returns 200");
  const adminCertsData = await adminCertsRes.json();
  assert(adminCertsData.certificates.length >= 2, "Admin receives list of seeded certificates");

  const validCert = adminCertsData.certificates.find(
    (c) => c.status === "VALID" && c.user.email === "learner@learnlms.local"
  );
  assert(validCert !== undefined, "Found valid issued certificate for learner@learnlms.local");
  console.log(`   Inspecting Valid Certificate ID: ${validCert.id}`);

  // Also find another user's certificate to verify cross-learner privacy
  const otherUserCert = adminCertsData.certificates.find(
    (c) => c.user.email !== "learner@learnlms.local"
  );

  // 3. Learner Login & Certificate Access
  console.log("\n--- 3. Learner Login & Certificate Viewing ---");
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

  // Verify learner CAN access their own certificate
  const learnerCertRes = await fetch(`${BASE_URL}/api/certificates/${validCert.id}`, {
    headers: { Cookie: learnerSessionCookie },
  });
  assert(learnerCertRes.status === 200, "Learner can query their own certificate");
  const certDetails = await learnerCertRes.json();
  assert(certDetails.certificate.issuer === "ORELSE", "Certificate issuer is ORELSE");
  assert(certDetails.certificate.signature !== null, "Certificate has digital JWS signature");

  // Verify cross-user isolation: Learner CANNOT access another learner's private certificate
  if (otherUserCert) {
    const forbiddenRes = await fetch(`${BASE_URL}/api/certificates/${otherUserCert.id}`, {
      headers: { Cookie: learnerSessionCookie },
    });
    assert(forbiddenRes.status === 403, "Cross-learner access denied (403 Forbidden) for other learner's credential");
  }

  // 4. Vector PDF Certificate Download
  console.log("\n--- 4. Professional Vector PDF Certificate Generation & Download ---");
  const pdfDownloadRes = await fetch(`${BASE_URL}/api/certificates/${validCert.id}/download`, {
    headers: { Cookie: learnerSessionCookie },
  });
  assert(pdfDownloadRes.status === 200, "GET /api/certificates/[id]/download returns 200");
  assert(
    pdfDownloadRes.headers.get("content-type") === "application/pdf",
    "Content-Type is application/pdf"
  );
  const pdfBuffer = await pdfDownloadRes.arrayBuffer();
  assert(pdfBuffer.byteLength > 10000, `Generated PDF buffer size is substantial (${pdfBuffer.byteLength} bytes)`);
  const pdfHeader = Buffer.from(pdfBuffer.slice(0, 5)).toString("ascii");
  assert(pdfHeader === "%PDF-", "PDF header matches '%PDF-' specification");

  // 5. Public Multi-Step Verification
  console.log("\n--- 5. Public QR Verification & Cryptographic Validation ---");
  const publicVerifyApiRes = await fetch(`${BASE_URL}/api/certificates/${validCert.id}/verify`);
  assert(publicVerifyApiRes.status === 200, "Public verification API returns 200");
  const verifyData = await publicVerifyApiRes.json();
  const vResult = verifyData.result;
  assert(vResult.status === "VALID", "Verification status is VALID");
  assert(vResult.issuer === "ORELSE", "Verified issuer is ORELSE");
  assert(vResult.signatureValid === true, "Cryptographic ES256 signature is verified");
  assert(vResult.integrityValid === true, "Commitment hash integrity is verified");
  assert(vResult.ledgerMode === "mock" || vResult.ledgerMode === "local_evm", "Ledger mode is verified");

  const verifyHtmlRes = await fetch(`${BASE_URL}/en/verify/${validCert.id}`);
  assert(verifyHtmlRes.status === 200, "Public HTML verification route returns 200");
  const verifyHtml = await verifyHtmlRes.text();
  assert(verifyHtml.includes("Certificate is valid"), "HTML page shows 'Certificate is valid'");
  assert(verifyHtml.includes("ORELSE"), "HTML page attributes issuer to ORELSE");

  // 6. Security Invariant: Learner Cannot Revoke Certificate
  console.log("\n--- 6. Security Invariant: RBAC Revocation Authorization ---");
  const unauthorizedRevokeRes = await fetch(`${BASE_URL}/api/admin/certificates/${validCert.id}/revoke`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: learnerSessionCookie, // Non-admin user
    },
    body: JSON.stringify({ reason: "Malicious attempt to revoke" }),
  });
  assert(
    unauthorizedRevokeRes.status === 403,
    "Non-admin learner is forbidden (403) from revoking certificates"
  );

  // 7. Admin Revocation with Auditable Reason
  console.log("\n--- 7. Administrator Certificate Revocation & Public Status Update ---");
  // Find a cert to revoke or use a test one
  const certToRevoke = adminCertsData.certificates.find(
    (c) => c.status === "VALID" && c.id !== validCert.id
  ) || validCert;

  const revokeRes = await fetch(`${BASE_URL}/api/admin/certificates/${certToRevoke.id}/revoke`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminSessionCookie,
    },
    body: JSON.stringify({
      reason: "Administrative audit test — Formal revocation verification",
    }),
  });
  assert(revokeRes.status === 200, "Admin can revoke certificate with reason");

  // Re-verify immediately through public API
  const reVerifyRes = await fetch(`${BASE_URL}/api/certificates/${certToRevoke.id}/verify`);
  const reVerifyData = await reVerifyRes.json();
  assert(reVerifyData.result.status === "REVOKED", "Public verification immediately reports status REVOKED");
  assert(
    reVerifyData.result.revocationReason.includes("Administrative audit test"),
    "Public verification accurately displays revocation reason"
  );

  // 8. Admin Reissuance & Superseded Relationship
  console.log("\n--- 8. Administrator Reissuance & Superseded Audit Trail ---");
  const reissueRes = await fetch(`${BASE_URL}/api/admin/certificates/${certToRevoke.id}/reissue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminSessionCookie,
    },
    body: JSON.stringify({
      reason: "Reissuance with corrected metadata after audit review",
    }),
  });
  assert(reissueRes.status === 200, "Admin can reissue certificate");
  const reissueData = await reissueRes.json();
  const newCertId = reissueData.newCertificate.id;
  assert(newCertId !== certToRevoke.id, "New certificate has a distinct, new ID");
  assert(reissueData.newCertificate.status === "VALID", "Newly reissued certificate status is VALID");

  console.log(`\n========================================`);
  console.log(`🎉 ALL ${passed}/${total} PHASE 4 E2E TESTS PASSED!`);
  console.log(`========================================\n`);
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
