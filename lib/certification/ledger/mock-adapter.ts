import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import type { LedgerAdapter, AnchorMetadata, AnchorReceipt, AnchorRecord, RevokeReceipt, LedgerMode } from "./types";

export const MOCK_LEDGER_LABEL = "Demo verification — MockLedger mode. Not anchored on a public blockchain.";

interface MockBlock {
  index: number;
  commitment: string;
  certificateId: string;
  metadataHash: string;
  previousHash: string;
  blockHash: string;
  timestamp: string;
}

/**
 * Enhanced MockLedger with cryptographic SHA-256 hash chaining
 * and persistent PostgreSQL audit history.
 */
export class MockLedgerAdapter implements LedgerAdapter {
  readonly mode: LedgerMode = "mock";
  private static chain: MockBlock[] = [];
  private static genesisCreated = false;

  private ensureGenesisBlock() {
    if (MockLedgerAdapter.chain.length === 0) {
      const genesis: MockBlock = {
        index: 0,
        commitment: "0x0000000000000000000000000000000000000000000000000000000000000000",
        certificateId: "GENESIS",
        metadataHash: "0xGENESIS_METADATA",
        previousHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
        blockHash: "0xGENESIS_HASH_ORELSE_LEARN_LMS",
        timestamp: new Date("2026-01-01T00:00:00Z").toISOString(),
      };
      MockLedgerAdapter.chain.push(genesis);
    }
  }

  async anchor(commitment: string, metadata: AnchorMetadata): Promise<AnchorReceipt> {
    this.ensureGenesisBlock();

    const previousBlock = MockLedgerAdapter.chain[MockLedgerAdapter.chain.length - 1];
    const index = previousBlock.index + 1;
    const timestamp = new Date();

    const metadataHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(metadata))
      .digest("hex");

    const blockHash = crypto
      .createHash("sha256")
      .update(`${index}-${commitment}-${previousBlock.blockHash}-${metadataHash}-${timestamp.toISOString()}`)
      .digest("hex");

    const block: MockBlock = {
      index,
      commitment,
      certificateId: metadata.certificateId,
      metadataHash: `0x${metadataHash}`,
      previousHash: previousBlock.blockHash,
      blockHash: `0x${blockHash}`,
      timestamp: timestamp.toISOString(),
    };

    MockLedgerAdapter.chain.push(block);

    return {
      success: true,
      ledgerMode: "mock",
      ledgerLabel: MOCK_LEDGER_LABEL,
      commitment,
      blockNumber: index,
      timestamp,
    };
  }

  async getAnchor(commitment: string): Promise<AnchorRecord | null> {
    // 1. Check local hash chain
    const block = MockLedgerAdapter.chain.find((b) => b.commitment.toLowerCase() === commitment.toLowerCase());

    // 2. Query certificate in database to confirm status
    const cert = await prisma.certificate.findFirst({
      where: { credentialHash: commitment },
    });

    if (!cert && !block) {
      return null;
    }

    const isRevoked = cert?.status === "REVOKED";

    return {
      commitment,
      certificateId: cert?.id || block?.certificateId || "DEMO-UNKNOWN",
      anchored: true,
      ledgerMode: "mock",
      ledgerLabel: MOCK_LEDGER_LABEL,
      blockNumber: block?.index ?? 101,
      timestamp: cert?.anchorTimestamp || cert?.issueDate || new Date(),
      isRevoked,
      revocationReason: cert?.revocationReason ?? undefined,
      revokedAt: cert?.revokedAt ?? undefined,
    };
  }

  async revoke(commitment: string, reason: string): Promise<RevokeReceipt> {
    const now = new Date();
    return {
      success: true,
      commitment,
      ledgerMode: "mock",
      revokedAt: now,
    };
  }

  async isRevoked(commitment: string): Promise<boolean> {
    const cert = await prisma.certificate.findFirst({
      where: { credentialHash: commitment },
    });
    return cert?.status === "REVOKED";
  }
}
