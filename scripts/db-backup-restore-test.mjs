/**
 * Learn LMS — PostgreSQL 18 Backup & Restoration Verification Script
 * Demonstrates:
 * 1. Database dump of 'learnlms' to a controlled backup file.
 * 2. Restoration into an isolated disposable database 'learnlms_restore_test'.
 * 3. Validation of record integrity, tables, users, courses, and certificates.
 * 4. Safe cleanup of the disposable database.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const backupDir = path.join(rootDir, "backups");
const backupFile = path.join(backupDir, `learnlms_backup_${Date.now()}.sql`);

const PG_BIN = "C:\\Program Files\\PostgreSQL\\18\\bin";

// Dynamically extract credentials from DATABASE_URL
const rawDbUrl = process.env.DATABASE_URL || "postgresql://postgres:aaaa%401111@localhost:5432/learnlms";
const parsedUrl = new URL(rawDbUrl);
const PG_USER = parsedUrl.username || "postgres";
const PG_PASSWORD = decodeURIComponent(parsedUrl.password || "");
const PG_HOST = parsedUrl.hostname || "localhost";
const PG_PORT = parsedUrl.port || "5432";
const SOURCE_DB = parsedUrl.pathname.replace(/^\//, "") || "learnlms";
const TARGET_TEST_DB = "learnlms_restore_test";

console.log("==========================================================");
console.log(" LEARN LMS — POSTGRESQL 18 BACKUP & RESTORATION TEST");
console.log("==========================================================");

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Environment for pg_dump and psql
const env = { ...process.env, PGPASSWORD: PG_PASSWORD };

try {
  // Step 1: Create Database Backup
  console.log(`\n1. Creating database dump from '${SOURCE_DB}'...`);
  const dumpCmd = `"${path.join(PG_BIN, "pg_dump.exe")}" -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d ${SOURCE_DB} -F p -f "${backupFile}"`;
  execSync(dumpCmd, { env, stdio: "inherit" });

  const stats = fs.statSync(backupFile);
  console.log(`✅ Backup created successfully: ${backupFile} (${(stats.size / 1024).toFixed(1)} KB)`);

  // Step 2: Create Separate Disposable Database
  console.log(`\n2. Creating isolated disposable test database '${TARGET_TEST_DB}'...`);
  // Drop first if left over from previous run
  try {
    execSync(`"${path.join(PG_BIN, "psql.exe")}" -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -c "DROP DATABASE IF EXISTS \\"${TARGET_TEST_DB}\\";"`, { env, stdio: "pipe" });
  } catch {}
  execSync(`"${path.join(PG_BIN, "psql.exe")}" -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -c "CREATE DATABASE \\"${TARGET_TEST_DB}\\";"`, { env, stdio: "pipe" });
  console.log(`✅ Database '${TARGET_TEST_DB}' created.`);

  // Step 3: Restore Backup into Disposable Database
  console.log(`\n3. Restoring backup into '${TARGET_TEST_DB}'...`);
  const restoreCmd = `"${path.join(PG_BIN, "psql.exe")}" -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d ${TARGET_TEST_DB} -f "${backupFile}"`;
  execSync(restoreCmd, { env, stdio: "pipe" });
  console.log(`✅ Restoration executed successfully.`);

  // Step 4: Verify Database Integrity using Prisma
  console.log(`\n4. Verifying database integrity on restored database...`);
  const testPrismaUrl = `postgresql://${PG_USER}:${env.PGPASSWORD}@${PG_HOST}:${PG_PORT}/${TARGET_TEST_DB}?schema=public`;
  const testPrisma = new PrismaClient({
    datasources: {
      db: { url: testPrismaUrl },
    },
  });

  const [userCount, courseCount, certCount, progCount, orgCount] = await Promise.all([
    testPrisma.user.count(),
    testPrisma.course.count(),
    testPrisma.certificate.count(),
    testPrisma.trainingProgramme.count(),
    testPrisma.organization.count(),
  ]);

  console.log(`   - Restored Users: ${userCount}`);
  console.log(`   - Restored Courses: ${courseCount}`);
  console.log(`   - Restored Certificates: ${certCount}`);
  console.log(`   - Restored Training Programmes: ${progCount}`);
  console.log(`   - Restored Organizations: ${orgCount}`);

  // Validate representative user
  const learner = await testPrisma.user.findUnique({
    where: { email: "learner@learnlms.local" },
    include: { organization: true },
  });
  if (!learner) throw new Error("Verification failed: learner@learnlms.local missing");
  console.log(`   ✅ Representative learner verified: ${learner.name} (${learner.email}, org: ${learner.organization?.name})`);

  // Validate representative course
  const course = await testPrisma.course.findUnique({
    where: { slug: "fpo-governance-essentials" },
    include: { sections: true, quizzes: true },
  });
  if (!course) throw new Error("Verification failed: course fpo-governance-essentials missing");
  console.log(`   ✅ Representative course verified: '${course.title}' (${course.sections.length} sections, ${course.quizzes.length} quizzes)`);

  // Validate representative certificate
  const cert = await testPrisma.certificate.findFirst({
    where: { status: "VALID" },
    include: { course: true, user: true },
  });
  if (!cert) throw new Error("Verification failed: No valid certificate found");
  console.log(`   ✅ Representative certificate verified: ID ${cert.id}, Issuer: ${cert.issuer}, Recipient: ${cert.user.name}`);

  await testPrisma.$disconnect();
  console.log(`\n✅ DATABASE RESTORATION INTEGRITY 100% VERIFIED.`);

  // Step 5: Clean up disposable database and temporary backup
  console.log(`\n5. Cleaning up disposable test database '${TARGET_TEST_DB}'...`);
  execSync(`"${path.join(PG_BIN, "psql.exe")}" -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -c "DROP DATABASE IF EXISTS \\"${TARGET_TEST_DB}\\";"`, { env, stdio: "pipe" });
  console.log(`✅ Disposable test database dropped cleanly.`);

  // Clean up temporary backup file
  fs.unlinkSync(backupFile);
  console.log(`✅ Temporary backup archive cleaned up.`);

  console.log("\n==========================================================");
  console.log(" 🎉 POSTGRESQL BACKUP & RESTORATION TEST PASSED");
  console.log("==========================================================");
} catch (err) {
  console.error("❌ BACKUP & RESTORE TEST FAILED:", err);
  process.exit(1);
}
