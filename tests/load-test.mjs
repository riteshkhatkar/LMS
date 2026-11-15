/**
 * Learn LMS — Phase 8 Concurrency & Load Testing Suite
 * Simulates concurrent multi-role traffic across public, authenticated, and administrative endpoints.
 * Profiles concurrency levels: 10, 50, and 100 concurrent requests.
 * Measures: Throughput (RPS), p50, p95, p99 latencies, error rates.
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

console.log("==================================================================");
console.log(" LEARN LMS — CONCURRENCY & STRESS PERFORMANCE PROFILER");
console.log(` Target Host: ${BASE_URL}`);
console.log("==================================================================");

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

function calculatePercentiles(latencies) {
  if (latencies.length === 0) return { p50: 0, p95: 0, p99: 0, min: 0, max: 0, avg: 0 };
  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.50)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];
  const min = latencies[0];
  const max = latencies[latencies.length - 1];
  const avg = Math.round(latencies.reduce((sum, v) => sum + v, 0) / latencies.length);
  return { p50, p95, p99, min, max, avg };
}

async function runScenario(name, concurrency, totalRequests, taskFn) {
  console.log(`\n--- Running Scenario: ${name} (Concurrency: ${concurrency}, Requests: ${totalRequests}) ---`);
  const latencies = [];
  let errorCount = 0;
  let completed = 0;

  const startTime = Date.now();

  // Run in chunks matching concurrency
  for (let i = 0; i < totalRequests; i += concurrency) {
    const batchSize = Math.min(concurrency, totalRequests - i);
    const promises = Array.from({ length: batchSize }).map(async () => {
      const reqStart = Date.now();
      try {
        await taskFn();
        const elapsed = Date.now() - reqStart;
        latencies.push(elapsed);
      } catch (err) {
        errorCount++;
      } finally {
        completed++;
      }
    });
    await Promise.all(promises);
  }

  const durationSec = (Date.now() - startTime) / 1000;
  const rps = (completed / durationSec).toFixed(1);
  const stats = calculatePercentiles(latencies);
  const errorRate = ((errorCount / totalRequests) * 100).toFixed(2);

  console.log(`   - Throughput: ${rps} req/sec`);
  console.log(`   - Latency: Avg ${stats.avg}ms | p50 ${stats.p50}ms | p95 ${stats.p95}ms | p99 ${stats.p99}ms (Min: ${stats.min}ms, Max: ${stats.max}ms)`);
  console.log(`   - Error Rate: ${errorRate}% (${errorCount}/${totalRequests} failed)`);

  return { name, concurrency, totalRequests, rps, stats, errorRate, errorCount };
}

async function main() {
  // Step 1: Establish Sessions
  console.log("\n1. Establishing authenticated test sessions...");
  const adminCookie = await login("admin@learnlms.local", "Admin@123");
  const learnerCookie = await login("learner@learnlms.local", "Learner@123");
  console.log("   ✅ Admin and Learner sessions established.");

  const results = [];

  // Scenario 1: Public Catalog & Health (Concurrency 10)
  results.push(await runScenario(
    "Public Course Catalog & Health Probes",
    10,
    50,
    async () => {
      const res = await fetch(`${BASE_URL}/api/courses`);
      await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }
  ));

  // Scenario 2: Public QR Certificate Verification (Concurrency 50)
  results.push(await runScenario(
    "Public QR Certificate Verification",
    50,
    100,
    async () => {
      const res = await fetch(`${BASE_URL}/api/certificates/LLMS-DEMO-2026-BE13/verify`);
      await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }
  ));

  // Scenario 3: Authenticated Learner Dashboard & Training (Concurrency 50)
  results.push(await runScenario(
    "Authenticated Learner Training Programmes",
    50,
    100,
    async () => {
      const res = await fetch(`${BASE_URL}/api/learn/training`, {
        headers: { Cookie: learnerCookie },
      });
      await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }
  ));

  // Scenario 4: Admin Training Analytics & Operations (Concurrency 50)
  results.push(await runScenario(
    "Admin Real-Time Training Analytics",
    50,
    100,
    async () => {
      const res = await fetch(`${BASE_URL}/api/admin/training/analytics`, {
        headers: { Cookie: adminCookie },
      });
      await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }
  ));

  // Scenario 5: High Concurrency Stress Test (Concurrency 100)
  results.push(await runScenario(
    "Peak Concurrent Public & Cryptographic Probes",
    100,
    200,
    async () => {
      const res = await fetch(`${BASE_URL}/api/issuer/orelse/jwks`);
      await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }
  ));

  console.log("\n==================================================================");
  console.log(" 📊 LOAD & CONCURRENCY TEST SUMMARY REPORT");
  console.log("==================================================================");
  console.log("| Scenario | Concurrency | Total Req | Throughput (RPS) | p50 (ms) | p95 (ms) | p99 (ms) | Error Rate |");
  console.log("| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |");
  for (const r of results) {
    console.log(`| ${r.name} | ${r.concurrency} | ${r.totalRequests} | ${r.rps} req/s | ${r.stats.p50}ms | ${r.stats.p95}ms | ${r.stats.p99}ms | ${r.errorRate}% |`);
  }
  console.log("==================================================================");

  const totalErrors = results.reduce((acc, r) => acc + r.errorCount, 0);
  if (totalErrors === 0) {
    console.log("🎉 ALL CONCURRENCY PROFILES PASSED WITH 0% ERROR RATE!");
  } else {
    console.error(`⚠️ Load test completed with ${totalErrors} errors.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Load test error:", err);
  process.exit(1);
});
