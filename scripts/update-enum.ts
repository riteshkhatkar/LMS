import { prisma } from "../lib/db/prisma";

async function main() {
  const values = ['SIGNING', 'SIGNED', 'ANCHOR_PENDING', 'ANCHORED', 'ISSUANCE_FAILED', 'REVOCATION_PENDING'];
  for (const v of values) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "CertificateStatus" ADD VALUE IF NOT EXISTS '${v}'`);
      console.log("Added/verified enum value:", v);
    } catch (e: any) {
      console.log("Enum update note:", v, e.message);
    }
  }
}

main().finally(() => prisma.$disconnect());
