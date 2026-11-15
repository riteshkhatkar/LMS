import { prisma } from "../lib/db/prisma.ts";
import { verifyCertificateById } from "../lib/certification/verification.ts";
import { signCredentialPayload, verifyCredentialSignature } from "../lib/certification/keys.ts";

async function profile() {
  console.log("==================================================================");
  console.log(" LEARN LMS — MICRO-BENCHMARK & BOTTLENECK ISOLATION PROFILER");
  console.log("==================================================================\n");

  // 1. Cryptographic Key Operations
  console.log("1. Profiling Cryptographic Operations (ES256 Sign & Verify):");
  const testPayload = { sub: "user-123", certId: "LLMS-DEMO-2026-TEST", score: 95 };
  
  // Warmup
  await signCredentialPayload(testPayload);

  const signTimes = [];
  const verifyTimes = [];

  for (let i = 0; i < 50; i++) {
    const t0 = performance.now();
    const { jws } = await signCredentialPayload(testPayload);
    signTimes.push(performance.now() - t0);

    const t1 = performance.now();
    await verifyCredentialSignature(jws);
    verifyTimes.push(performance.now() - t1);
  }

  const avgSign = (signTimes.reduce((a, b) => a + b, 0) / signTimes.length).toFixed(2);
  const avgVerify = (verifyTimes.reduce((a, b) => a + b, 0) / verifyTimes.length).toFixed(2);
  console.log(`   - ES256 Sign Time (avg over 50 iterations): ${avgSign} ms`);
  console.log(`   - ES256 Verify Time (avg over 50 iterations): ${avgVerify} ms`);

  // 2. Database Connection Pool & Query Latency
  console.log("\n2. Profiling Database Connection Pool & Query Latency (PostgreSQL 18):");
  const dbTimes = [];
  for (let i = 0; i < 50; i++) {
    const t0 = performance.now();
    await prisma.$queryRaw`SELECT 1 as ping`;
    dbTimes.push(performance.now() - t0);
  }
  const avgDb = (dbTimes.reduce((a, b) => a + b, 0) / dbTimes.length).toFixed(2);
  const minDb = Math.min(...dbTimes).toFixed(2);
  const maxDb = Math.max(...dbTimes).toFixed(2);
  console.log(`   - Raw Ping Query Time: Avg ${avgDb} ms (Min: ${minDb} ms, Max: ${maxDb} ms)`);

  // 3. Certificate Verification Execution Time
  console.log("\n3. Profiling Certificate Verification by ID:");
  const certTimes = [];
  for (let i = 0; i < 20; i++) {
    const t0 = performance.now();
    await verifyCertificateById("LLMS-DEMO-2026-BE13");
    certTimes.push(performance.now() - t0);
  }
  const avgCert = (certTimes.reduce((a, b) => a + b, 0) / certTimes.length).toFixed(2);
  console.log(`   - Full Certificate Verification: Avg ${avgCert} ms`);

  // 4. Training Programme Query Execution Time
  console.log("\n4. Profiling Learner Training Query Pipeline:");
  const tProg0 = performance.now();
  const programmes = await prisma.trainingProgramme.findMany({
    include: {
      courses: {
        include: { course: true },
      },
      organization: true,
    },
  });
  const progElapsed = (performance.now() - tProg0).toFixed(2);
  console.log(`   - Training Programmes Query (Count: ${programmes.length}): ${progElapsed} ms`);

  // 5. Admin Training Analytics Pipeline Execution Time (Post-Batching)
  console.log("\n5. Profiling Admin Analytics Pipeline Execution Time:");
  const tAnalytics0 = performance.now();
  const totalCount = await prisma.trainingProgramme.count();
  const progs = await prisma.trainingProgramme.findMany({
    include: {
      courses: { select: { courseId: true, isRequired: true } },
      assignments: true,
      _count: { select: { certificates: true } },
    },
  });
  const analyticsElapsed = (performance.now() - tAnalytics0).toFixed(2);
  console.log(`   - Analytics Pipeline Query: ${analyticsElapsed} ms`);

  console.log("\n==================================================================");
  console.log(" Micro-benchmark completed successfully.");
  console.log("==================================================================");

  await prisma.$disconnect();
}

profile().catch(console.error);
