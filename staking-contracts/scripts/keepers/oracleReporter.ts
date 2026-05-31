/**
 * oracleReporter — keeper that fetches validator balances from the beacon
 * chain and submits a sanity-checked report to OracleAdapter.
 *
 * Uses the standard Beacon REST API (https://ethereum.github.io/beacon-APIs/)
 * — endpoint `GET /eth/v1/beacon/states/head/validators?id=<pubkey>` returns
 * each validator's effective balance and status. We sum the balances of all
 * configured pubkeys and report `(numActive, totalBalance, timestamp)` to
 * the adapter.
 *
 * Usage:
 *   npx ts-node scripts/keepers/oracleReporter.ts
 *   npx ts-node scripts/keepers/oracleReporter.ts --dry-run
 *   npx ts-node scripts/keepers/oracleReporter.ts --watch [--interval=900]
 *
 * Required env vars:
 *   BEACON_API_URL              Beacon node REST endpoint (e.g. https://...)
 *   ORACLE_ADAPTER_ADDRESS      OracleAdapter deployment address
 *   SUBMITTER_PRIVATE_KEY       Private key of SUBMITTER role-holder
 *   VALIDATOR_PUBKEYS           Comma-separated 0x-prefixed validator pubkeys
 *
 * Optional env vars:
 *   RPC_URL                     EL JSON-RPC endpoint (defaults to inferred from PROVIDER_URL)
 *   PROVIDER_URL                Alias for RPC_URL
 *   MIN_REPORT_INTERVAL         Seconds between reports (default 21600 — 6h)
 *   MAX_RETRIES                 Default 5
 *   BACKOFF_MS                  Default 5000 (doubled on each retry)
 *
 * Beacon API balance is denominated in Gwei. We multiply by 1e9 to convert
 * to wei for on-chain reporting.
 */
import {ethers} from "ethers";

const ORACLE_ADAPTER_ABI = [
  "function lastReportTime() view returns (uint256)",
  "function maxStalenessSeconds() view returns (uint256)",
  "function submitReport(uint256 beaconValidators, uint256 beaconBalance, uint256 reportTimestamp)",
  "function SUBMITTER() view returns (bytes32)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
];

// Explicit gas limit for submitReport — avoid relying on automatic estimation
// which can fail under network congestion.
const GAS_ORACLE_REPORT = 200_000n;

// Timeout for Beacon API HTTP fetches. Without this, a hung beacon node would
// stall the keeper indefinitely.
const BEACON_API_TIMEOUT_MS = 10_000;

/**
 * Wrap fetch with an AbortController-backed timeout. A hung beacon node would
 * otherwise stall the keeper indefinitely.
 */
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {signal: controller.signal});
    return res;
  } catch (e) {
    if ((e as Error).name === "AbortError") {
      throw new Error(`Beacon API timeout after ${timeoutMs}ms: ${url}`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

interface ValidatorInfo {
  pubkey: string;
  balanceGwei: bigint;
  status: string;
}

export interface Config {
  beaconApi: string;
  rpcUrl: string;
  oracleAddress: string;
  privateKey: string;
  pubkeys: string[];
  dryRun: boolean;
  watch: boolean;
  intervalSec: number;
  minReportIntervalSec: number;
  maxRetries: number;
  initialBackoffMs: number;
}

function loadConfig(): Config {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const watch = args.includes("--watch");
  const intervalArg = args.find(a => a.startsWith("--interval="));
  const intervalSec = intervalArg ? parseInt(intervalArg.split("=")[1], 10) : 900;

  const required = (name: string): string => {
    const v = process.env[name];
    if (!v) throw new Error(`Missing required env var ${name}`);
    return v;
  };

  const pubkeys = required("VALIDATOR_PUBKEYS")
    .split(",")
    .map(s => s.trim())
    .filter(s => s.length > 0);
  if (pubkeys.length === 0) throw new Error("VALIDATOR_PUBKEYS contained no usable entries");

  return {
    beaconApi: required("BEACON_API_URL").replace(/\/+$/, ""),
    rpcUrl: process.env.RPC_URL ?? process.env.PROVIDER_URL ?? required("RPC_URL"),
    oracleAddress: required("ORACLE_ADAPTER_ADDRESS"),
    privateKey: required("SUBMITTER_PRIVATE_KEY"),
    pubkeys,
    dryRun,
    watch,
    intervalSec,
    minReportIntervalSec: parseInt(process.env.MIN_REPORT_INTERVAL ?? "21600", 10),
    maxRetries: parseInt(process.env.MAX_RETRIES ?? "5", 10),
    initialBackoffMs: parseInt(process.env.BACKOFF_MS ?? "5000", 10),
  };
}

function isActiveStatus(status: string): boolean {
  // Beacon API status is one of: pending_initialized, pending_queued,
  // active_ongoing, active_exiting, active_slashed, exited_unslashed,
  // exited_slashed, withdrawal_possible, withdrawal_done.
  return status.startsWith("active_") || status === "withdrawal_possible";
}

async function fetchValidatorInfo(beaconApi: string, pubkey: string): Promise<ValidatorInfo | null> {
  // /eth/v1/beacon/states/head/validators?id=<pubkey> returns array of validators.
  const url = `${beaconApi}/eth/v1/beacon/states/head/validators?id=${pubkey}`;
  const res = await fetchWithTimeout(url, BEACON_API_TIMEOUT_MS);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`beacon API ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as {
    data?: Array<{balance: string; status: string; validator: {pubkey: string}}>;
  };
  if (!json.data || json.data.length === 0) return null;

  const entry = json.data[0];
  return {
    pubkey: entry.validator.pubkey,
    balanceGwei: BigInt(entry.balance),
    status: entry.status,
  };
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

export async function reportOnce(cfg: Config) {
  const provider = new ethers.JsonRpcProvider(cfg.rpcUrl);
  const wallet = new ethers.Wallet(cfg.privateKey, provider);
  const adapter = new ethers.Contract(cfg.oracleAddress, ORACLE_ADAPTER_ABI, wallet);

  const latestBlock = await provider.getBlock("latest");
  if (!latestBlock) {
    throw new Error("Could not fetch latest block for report timestamp");
  }

  const lastReport: bigint = await adapter.lastReportTime();
  const now = Number(latestBlock.timestamp);
  if (lastReport > 0n && now - Number(lastReport) < cfg.minReportIntervalSec) {
    console.log(
      `[oracle] last report ${now - Number(lastReport)}s ago (< ${cfg.minReportIntervalSec}s); skipping`
    );
    return;
  }

  let totalBalanceGwei = 0n;
  let activeCount = 0;
  for (const pk of cfg.pubkeys) {
    const info = await fetchValidatorInfo(cfg.beaconApi, pk);
    if (!info) {
      console.warn(`[oracle] validator ${pk} not found on beacon; skipping`);
      continue;
    }
    console.log(`[oracle] ${pk.slice(0, 14)}… balance=${info.balanceGwei} Gwei status=${info.status}`);
    if (isActiveStatus(info.status)) {
      totalBalanceGwei += info.balanceGwei;
      activeCount += 1;
    }
  }

  if (activeCount === 0) {
    console.log("[oracle] no active validators yet; skipping report");
    return;
  }

  const totalBalanceWei = totalBalanceGwei * 10n ** 9n;
  console.log(
    `[oracle] reporting validators=${activeCount}, total=${ethers.formatEther(totalBalanceWei)} ETH, ts=${now}`
  );

  if (cfg.dryRun) {
    console.log("[oracle] --dry-run: would call submitReport()");
    return;
  }

  let attempt = 0;
  let backoff = cfg.initialBackoffMs;
  while (attempt < cfg.maxRetries) {
    try {
      const tx = await adapter.submitReport(activeCount, totalBalanceWei, now, {gasLimit: GAS_ORACLE_REPORT});
      console.log(`[oracle] tx submitted: ${tx.hash} (gasLimit=${GAS_ORACLE_REPORT})`);
      const rcpt = await tx.wait();
      console.log(`[oracle] confirmed in block ${rcpt?.blockNumber}`);
      return;
    } catch (err) {
      attempt += 1;
      console.error(`[oracle] attempt ${attempt} failed:`, (err as Error).message);
      if (attempt >= cfg.maxRetries) throw err;
      await sleep(backoff);
      backoff *= 2;
    }
  }
}

export async function verifySubmitterRole(oracle: ethers.Contract, submitter: string): Promise<void> {
  const SUBMITTER_ROLE: string = await oracle.SUBMITTER();
  const has: boolean = await oracle.hasRole(SUBMITTER_ROLE, submitter);
  if (!has) {
    throw new Error(
      `Address ${submitter} does not hold the SUBMITTER role on oracle ${await oracle.getAddress()}`
    );
  }
}

async function main() {
  const cfg = loadConfig();

  // Verify the SUBMITTER role once before entering any work loop.
  {
    const provider = new ethers.JsonRpcProvider(cfg.rpcUrl);
    const wallet = new ethers.Wallet(cfg.privateKey, provider);
    const oracle = new ethers.Contract(cfg.oracleAddress, ORACLE_ADAPTER_ABI, wallet);
    await verifySubmitterRole(oracle, wallet.address);
    console.log("[oracle] SUBMITTER role confirmed");
  }

  if (!cfg.watch) {
    await reportOnce(cfg);
    return;
  }

  console.log(`[oracle] watch mode (poll every ${cfg.intervalSec}s)`);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await reportOnce(cfg);
    } catch (err) {
      console.error("[oracle] cycle error:", (err as Error).message);
    }
    await sleep(cfg.intervalSec * 1000);
  }
}

// Only run the keeper loop when executed directly (ts-node / node), not when
// the module is imported by unit tests.
if (require.main === module) {
  main().catch(err => {
    console.error("[oracle] fatal:", err);
    process.exit(1);
  });
}
