/**
 * depositSweep — keeper that pushes 32-ETH chunks from the ValidatorModule
 * buffer into the canonical beacon-chain deposit contract.
 *
 * Watches `ValidatorModule._bufferedEther` and, whenever it crosses 32 ETH,
 * issues `depositToBeaconChain(pubkey, withdrawal_credentials, signature,
 * deposit_data_root)` with credentials from environment variables.
 *
 * Usage:
 *   npx ts-node scripts/keepers/depositSweep.ts
 *   npx ts-node scripts/keepers/depositSweep.ts --dry-run
 *   npx ts-node scripts/keepers/depositSweep.ts --watch [--interval=60]
 *
 * Required env vars:
 *   RPC_URL                  JSON-RPC endpoint
 *   MODULE_ADDRESS           Deployed ValidatorModule address
 *   KEEPER_PRIVATE_KEY       Private key of NODE_OPERATOR
 *   VALIDATOR_PUBKEY_HEX     0x-prefixed 48-byte BLS pubkey
 *   WITHDRAWAL_CREDS_HEX     0x-prefixed 32-byte withdrawal credentials
 *   SIGNATURE_HEX            0x-prefixed 96-byte BLS signature
 *   DEPOSIT_DATA_ROOT_HEX    0x-prefixed 32-byte SSZ deposit-data-root
 *
 * Optional env vars:
 *   MAX_RETRIES              Default 5
 *   BACKOFF_MS               Initial backoff (default 5000); doubled on each retry
 *
 * NOTE: Each call burns one set of validator credentials. For multi-validator
 * keepers, supply the credentials via a JSON file referenced by VALIDATORS_FILE
 * (extended use-case left out of this minimal implementation).
 */
import {ethers} from "ethers";

const VALIDATOR_MODULE_ABI = [
  "function bufferedEther() view returns (uint256)",
  "function DEPOSIT_AMOUNT() view returns (uint256)",
  "function expectedWithdrawalCredentials() view returns (bytes32)",
  "function depositToBeaconChain(bytes pubkey, bytes withdrawal_credentials, bytes signature, bytes32 deposit_data_root)",
  "function NODE_OPERATOR() view returns (bytes32)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
];

// Explicit gas limit for the beacon-chain deposit. This call always processes
// a single validator in this script, so a flat budget is sufficient.
const GAS_BEACON_DEPOSIT = 300_000n;

export interface Config {
  rpcUrl: string;
  moduleAddress: string;
  privateKey: string;
  pubkey: string;
  creds: string;
  signature: string;
  depositDataRoot: string;
  dryRun: boolean;
  watch: boolean;
  intervalSec: number;
  maxRetries: number;
  initialBackoffMs: number;
}

function loadConfig(): Config {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const watch = args.includes("--watch");
  const intervalArg = args.find(a => a.startsWith("--interval="));
  const intervalSec = intervalArg ? parseInt(intervalArg.split("=")[1], 10) : 60;

  const required = (name: string): string => {
    const v = process.env[name];
    if (!v) throw new Error(`Missing required env var ${name}`);
    return v;
  };

  return {
    rpcUrl: required("RPC_URL"),
    moduleAddress: required("MODULE_ADDRESS"),
    privateKey: required("KEEPER_PRIVATE_KEY"),
    pubkey: required("VALIDATOR_PUBKEY_HEX"),
    creds: required("WITHDRAWAL_CREDS_HEX"),
    signature: required("SIGNATURE_HEX"),
    depositDataRoot: required("DEPOSIT_DATA_ROOT_HEX"),
    dryRun,
    watch,
    intervalSec,
    maxRetries: parseInt(process.env.MAX_RETRIES ?? "5", 10),
    initialBackoffMs: parseInt(process.env.BACKOFF_MS ?? "5000", 10),
  };
}

function validateHex(name: string, value: string, expectedBytes: number) {
  if (!/^0x[0-9a-fA-F]+$/.test(value)) {
    throw new Error(`${name}: not 0x-hex`);
  }
  const byteLen = (value.length - 2) / 2;
  if (byteLen !== expectedBytes) {
    throw new Error(`${name}: expected ${expectedBytes} bytes, got ${byteLen}`);
  }
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

export async function sweepOnce(cfg: Config) {
  const provider = new ethers.JsonRpcProvider(cfg.rpcUrl);
  const wallet = new ethers.Wallet(cfg.privateKey, provider);
  const module = new ethers.Contract(cfg.moduleAddress, VALIDATOR_MODULE_ABI, wallet);

  const buffered: bigint = await module.bufferedEther();
  const depositAmount: bigint = await module.DEPOSIT_AMOUNT();
  const expectedCreds: string = await module.expectedWithdrawalCredentials();

  if (expectedCreds === ethers.ZeroHash) {
    throw new Error("Module expectedWithdrawalCredentials is unset");
  }
  if (expectedCreds.toLowerCase() !== cfg.creds.toLowerCase()) {
    throw new Error(
      `Configured WITHDRAWAL_CREDS_HEX does not match module expectedWithdrawalCredentials (${expectedCreds})`,
    );
  }

  console.log(`[sweep] bufferedEther=${ethers.formatEther(buffered)} ETH (threshold=${ethers.formatEther(depositAmount)} ETH)`);

  if (buffered < depositAmount) {
    console.log("[sweep] insufficient buffer, nothing to do");
    return;
  }

  if (cfg.dryRun) {
    console.log("[sweep] --dry-run: would call depositToBeaconChain()");
    return;
  }

  let attempt = 0;
  let backoff = cfg.initialBackoffMs;
  while (attempt < cfg.maxRetries) {
    try {
      const tx = await module.depositToBeaconChain(
        cfg.pubkey,
        cfg.creds,
        cfg.signature,
        cfg.depositDataRoot,
        {gasLimit: GAS_BEACON_DEPOSIT}
      );
      console.log(`[sweep] tx submitted: ${tx.hash} (gasLimit=${GAS_BEACON_DEPOSIT})`);
      const rcpt = await tx.wait();
      console.log(`[sweep] confirmed in block ${rcpt?.blockNumber} (gas=${rcpt?.gasUsed?.toString()})`);
      return;
    } catch (err) {
      attempt += 1;
      console.error(`[sweep] attempt ${attempt} failed:`, (err as Error).message);
      if (attempt >= cfg.maxRetries) throw err;
      await sleep(backoff);
      backoff *= 2;
    }
  }
}

export async function verifyNodeOperatorRole(module: ethers.Contract, operator: string): Promise<void> {
  const NODE_OPERATOR_ROLE: string = await module.NODE_OPERATOR();
  const has: boolean = await module.hasRole(NODE_OPERATOR_ROLE, operator);
  if (!has) {
    throw new Error(
      `Address ${operator} does not hold the NODE_OPERATOR role on module ${await module.getAddress()}`
    );
  }
}

async function main() {
  const cfg = loadConfig();
  validateHex("VALIDATOR_PUBKEY_HEX", cfg.pubkey, 48);
  validateHex("WITHDRAWAL_CREDS_HEX", cfg.creds, 32);
  validateHex("SIGNATURE_HEX", cfg.signature, 96);
  validateHex("DEPOSIT_DATA_ROOT_HEX", cfg.depositDataRoot, 32);

  // Verify the NODE_OPERATOR role once before entering any work loop.
  {
    const provider = new ethers.JsonRpcProvider(cfg.rpcUrl);
    const wallet = new ethers.Wallet(cfg.privateKey, provider);
    const module = new ethers.Contract(cfg.moduleAddress, VALIDATOR_MODULE_ABI, wallet);
    await verifyNodeOperatorRole(module, wallet.address);
    console.log("[sweep] NODE_OPERATOR role confirmed");
  }

  if (!cfg.watch) {
    await sweepOnce(cfg);
    return;
  }

  console.log(`[sweep] watch mode enabled (poll every ${cfg.intervalSec}s)`);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await sweepOnce(cfg);
    } catch (err) {
      console.error("[sweep] cycle error:", (err as Error).message);
    }
    await sleep(cfg.intervalSec * 1000);
  }
}

// Only run the keeper loop when executed directly (ts-node / node), not when
// the module is imported by unit tests.
if (require.main === module) {
  main().catch(err => {
    console.error("[sweep] fatal:", err);
    process.exit(1);
  });
}
