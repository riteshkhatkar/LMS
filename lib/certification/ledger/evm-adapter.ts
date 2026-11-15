import { ethers } from "ethers";
import type { LedgerAdapter, AnchorMetadata, AnchorReceipt, AnchorRecord, RevokeReceipt, LedgerMode } from "./types";

export const POLYGON_AMOY_CHAIN_ID = 80002;
export const POLYGON_AMOY_NETWORK_NAME = "Polygon Amoy Testnet";
export const LOCAL_EVM_CHAIN_ID = 31337;
export const LOCAL_EVM_NETWORK_NAME = "Local EVM Blockchain";

/**
 * Privacy-preserving ABI for the CertificateRegistry smart contract.
 * Note: Only domain-separated bytes32 commitments and non-PII reason codes are processed.
 */
export const CERTIFICATE_REGISTRY_ABI = [
  "function anchorCommitment(bytes32 commitment) external",
  "function revokeCommitment(bytes32 commitment, bytes32 reasonCode) external",
  "function isAnchored(bytes32 commitment) external view returns (bool)",
  "function isRevoked(bytes32 commitment) external view returns (bool)",
  "function getRevocationReasonCode(bytes32 commitment) external view returns (bytes32)",
  "function getCommitment(bytes32 commitment) external view returns (bool anchored, uint256 timestamp, address issuer, bool revoked, uint256 revokedAt, bytes32 reasonCode)",
  "event CertificateAnchored(bytes32 indexed commitment, address indexed issuer, uint256 timestamp)",
  "event CertificateRevoked(bytes32 indexed commitment, address indexed revoker, bytes32 indexed reasonCode, uint256 timestamp)",
];

export interface EVMAdapterConfig {
  rpcUrl?: string;
  chainId?: number;
  contractAddress?: string;
  privateKey?: string;
}

/**
 * EVM Ledger Adapter using ethers.js v6.
 * Connects to a running Local EVM (e.g. Hardhat / Anvil) or Polygon Amoy Testnet.
 */
export class EVMTestnetAdapter implements LedgerAdapter {
  readonly mode: LedgerMode;
  private rpcUrl: string;
  private chainId: number;
  private contractAddress?: string;
  private privateKey?: string;

  constructor(config?: EVMAdapterConfig) {
    this.rpcUrl = config?.rpcUrl || process.env.EVM_RPC_URL || "http://127.0.0.1:8545";
    this.chainId = config?.chainId || Number(process.env.EVM_CHAIN_ID || LOCAL_EVM_CHAIN_ID);
    this.contractAddress = config?.contractAddress || process.env.EVM_CONTRACT_ADDRESS;
    this.privateKey = config?.privateKey || process.env.EVM_SIGNER_PRIVATE_KEY;
    this.mode = this.chainId === LOCAL_EVM_CHAIN_ID ? "local_evm" : "public_testnet";
  }

  get isConfigured(): boolean {
    return Boolean(this.contractAddress && this.privateKey && ethers.isAddress(this.contractAddress));
  }

  private getNetworkLabel(): string {
    if (this.chainId === LOCAL_EVM_CHAIN_ID) {
      return `${LOCAL_EVM_NETWORK_NAME} (Chain ID: ${this.chainId})`;
    }
    return `${POLYGON_AMOY_NETWORK_NAME} (Chain ID: ${this.chainId})`;
  }

  async anchor(commitment: string, metadata?: AnchorMetadata): Promise<AnchorReceipt> {
    const commitmentBytes32 = commitment.startsWith("0x") ? commitment : `0x${commitment}`;

    if (!this.isConfigured) {
      return {
        success: false,
        ledgerMode: this.mode,
        ledgerLabel: `${this.getNetworkLabel()} (Not Configured)`,
        commitment,
        timestamp: new Date(),
        error: "EVM adapter requires contract address and signer private key",
      };
    }

    try {
      const provider = new ethers.JsonRpcProvider(this.rpcUrl, this.chainId);
      const wallet = new ethers.Wallet(this.privateKey!, provider);
      const contract = new ethers.Contract(this.contractAddress!, CERTIFICATE_REGISTRY_ABI, wallet);

      const tx = await contract.anchorCommitment(commitmentBytes32);
      const receipt = await tx.wait(1);

      return {
        success: true,
        ledgerMode: this.mode,
        ledgerLabel: this.getNetworkLabel(),
        commitment,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        timestamp: new Date(),
      };
    } catch (err: any) {
      console.error("EVM anchoring transaction failed:", err);
      return {
        success: false,
        ledgerMode: this.mode,
        ledgerLabel: `${this.getNetworkLabel()} (Anchoring Error)`,
        commitment,
        timestamp: new Date(),
        error: err.message || "Failed to submit on-chain transaction",
      };
    }
  }

  async getAnchor(commitment: string): Promise<AnchorRecord | null> {
    const commitmentBytes32 = commitment.startsWith("0x") ? commitment : `0x${commitment}`;

    if (!this.isConfigured) {
      return null;
    }

    try {
      const provider = new ethers.JsonRpcProvider(this.rpcUrl, this.chainId);
      const contract = new ethers.Contract(this.contractAddress!, CERTIFICATE_REGISTRY_ABI, provider);

      const anchored: boolean = await contract.isAnchored(commitmentBytes32);
      if (!anchored) return null;

      const isRevoked: boolean = await contract.isRevoked(commitmentBytes32);
      let revocationReason: string | undefined;

      if (isRevoked) {
        const reasonCode: string = await contract.getRevocationReasonCode(commitmentBytes32);
        revocationReason = `On-Chain Revocation (Reason Code: ${reasonCode.slice(0, 10)}...)`;
      }

      return {
        commitment,
        certificateId: "ON_CHAIN_COMMITMENT",
        anchored: true,
        ledgerMode: this.mode,
        ledgerLabel: this.getNetworkLabel(),
        timestamp: new Date(),
        isRevoked,
        revocationReason,
      };
    } catch (err) {
      console.warn("EVM anchor query failed:", err);
      return null;
    }
  }

  async revoke(commitment: string, reason: string): Promise<RevokeReceipt> {
    const commitmentBytes32 = commitment.startsWith("0x") ? commitment : `0x${commitment}`;
    const now = new Date();

    if (!this.isConfigured) {
      return {
        success: false,
        commitment,
        ledgerMode: this.mode,
        revokedAt: now,
        error: "EVM adapter not configured",
      };
    }

    try {
      const provider = new ethers.JsonRpcProvider(this.rpcUrl, this.chainId);
      const wallet = new ethers.Wallet(this.privateKey!, provider);
      const contract = new ethers.Contract(this.contractAddress!, CERTIFICATE_REGISTRY_ABI, wallet);

      // Convert reason string into a privacy-preserving non-PII bytes32 reason code
      const reasonCode = ethers.keccak256(ethers.toUtf8Bytes(reason || "REASON_ADMINISTRATIVE"));

      const tx = await contract.revokeCommitment(commitmentBytes32, reasonCode);
      const receipt = await tx.wait(1);

      return {
        success: true,
        commitment,
        ledgerMode: this.mode,
        txHash: receipt.hash,
        revokedAt: now,
      };
    } catch (err: any) {
      return {
        success: false,
        commitment,
        ledgerMode: this.mode,
        revokedAt: now,
        error: err.message,
      };
    }
  }

  async isRevoked(commitment: string): Promise<boolean> {
    const anchor = await this.getAnchor(commitment);
    return Boolean(anchor?.isRevoked);
  }
}
