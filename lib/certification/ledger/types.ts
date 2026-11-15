export type LedgerMode = "mock" | "local_evm" | "public_testnet";

export interface AnchorMetadata {
  certificateId: string;
  courseId: string;
  learnerId: string;
  issueDate: Date;
  gradingRuleVersion: number;
}

export interface AnchorReceipt {
  success: boolean;
  ledgerMode: LedgerMode;
  ledgerLabel: string;
  commitment: string;
  txHash?: string;
  blockNumber?: number;
  timestamp: Date;
  error?: string;
}

export interface AnchorRecord {
  commitment: string;
  certificateId: string;
  anchored: boolean;
  ledgerMode: LedgerMode;
  ledgerLabel: string;
  txHash?: string;
  blockNumber?: number;
  timestamp: Date;
  isRevoked: boolean;
  revocationReason?: string;
  revokedAt?: Date;
}

export interface RevokeReceipt {
  success: boolean;
  commitment: string;
  ledgerMode: LedgerMode;
  txHash?: string;
  revokedAt: Date;
  error?: string;
}

export interface LedgerAdapter {
  readonly mode: LedgerMode;
  anchor(commitment: string, metadata: AnchorMetadata): Promise<AnchorReceipt>;
  getAnchor(commitment: string): Promise<AnchorRecord | null>;
  revoke(commitment: string, reason: string): Promise<RevokeReceipt>;
  isRevoked(commitment: string): Promise<boolean>;
}
