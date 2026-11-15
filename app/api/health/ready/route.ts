import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logging";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, "healthy" | "unhealthy"> = {
    database: "unhealthy",
    ledger: "healthy",
  };

  let allHealthy = true;

  // 1. Database Connectivity Probe
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "healthy";
  } catch (err) {
    allHealthy = false;
    checks.database = "unhealthy";
    logger.error("HEALTH_CHECK_FAILURE", "Database readiness probe failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // 2. Ledger Configuration Probe
  const ledgerMode = process.env.LEDGER_MODE || "mock";
  if (ledgerMode === "local_evm") {
    try {
      const rpcUrl = process.env.EVM_RPC_URL || "http://127.0.0.1:8545";
      const res = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
        signal: AbortSignal.timeout(2000),
      });
      if (!res.ok) checks.ledger = "unhealthy";
    } catch {
      checks.ledger = "unhealthy";
    }
  }

  const durationMs = Date.now() - startTime;
  const status = allHealthy ? "ready" : "not_ready";
  const statusCode = allHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status,
      application: "Learn LMS",
      issuer: "ORELSE",
      checks,
      responseTimeMs: durationMs,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}
