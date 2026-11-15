import { prisma } from "../lib/db/prisma";
import fs from "fs";
import crypto from "crypto";
import path from "path";

async function main() {
  console.log("Establishing version-controlled Prisma baseline migration...");

  const migrationDir = path.resolve("prisma/migrations/20261114120000_init_baseline");
  const sqlPath = path.join(migrationDir, "migration.sql");
  const sqlContent = fs.readFileSync(sqlPath, "utf8");
  const checksum = crypto.createHash("sha256").update(sqlContent).digest("hex");
  const migrationName = "20261114120000_init_baseline";
  const id = crypto.randomUUID();

  // Create _prisma_migrations table if not exists
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" VARCHAR(36) PRIMARY KEY,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "applied_steps_count" INTEGER NOT NULL DEFAULT 1
    );
  `);

  // Clear old entries if any
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "_prisma_migrations"`);

  // Insert baseline record
  await prisma.$executeRawUnsafe(
    `INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
     VALUES ($1, $2, CURRENT_TIMESTAMP, $3, 1)`,
    id,
    checksum,
    migrationName
  );
  console.log(`✅ Successfully recorded baseline migration: ${migrationName} (Checksum: ${checksum.slice(0, 12)}...)`);
}

main().finally(() => prisma.$disconnect());
