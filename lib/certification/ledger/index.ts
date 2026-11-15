import { MockLedgerAdapter } from "./mock-adapter";
import { EVMTestnetAdapter } from "./evm-adapter";
import type { LedgerAdapter, LedgerMode } from "./types";

export * from "./types";
export * from "./mock-adapter";
export * from "./evm-adapter";

let mockAdapterInstance: MockLedgerAdapter | null = null;
let evmAdapterInstance: EVMTestnetAdapter | null = null;

/**
 * Returns the appropriate LedgerAdapter instance based on configuration or override.
 */
export function getLedgerAdapter(modeOverride?: LedgerMode): LedgerAdapter {
  const selectedMode = modeOverride || (process.env.LEDGER_MODE as LedgerMode) || "mock";

  if (selectedMode === "public_testnet" || selectedMode === "local_evm") {
    if (!evmAdapterInstance) {
      evmAdapterInstance = new EVMTestnetAdapter();
    }
    return evmAdapterInstance;
  }

  if (!mockAdapterInstance) {
    mockAdapterInstance = new MockLedgerAdapter();
  }
  return mockAdapterInstance;
}
