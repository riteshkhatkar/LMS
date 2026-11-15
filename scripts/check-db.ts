import { prisma } from "../lib/db/prisma";

async function main() {
  const tables: any = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`;
  console.log("Tables in database:", tables.map((t: any) => t.table_name));
}

main().finally(() => prisma.$disconnect());
