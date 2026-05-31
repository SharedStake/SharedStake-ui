/**
 * balanceMonitor — watches StakingRouter totalPooledEther for anomalous drops
 * and automatically calls emergencyPauseAll() when a suspicious loss is detected.
 *
 * GUARDIAN role is required; this key can pause without the 48h timelock.
 *
 * Usage:
 *   npx ts-node scripts/keepers/balanceMonitor.ts
 *   npx ts-node scripts/keepers/balanceMonitor.ts --dry-run
 *   npx ts-node scripts/keepers/balanceMonitor.ts --watch [--interval=60]
 *
 * Required env vars:
 *   RPC_URL                  JSON-RPC endpoint
 *   ROUTER_ADDRESS           Deployed StakingRouter address
 *   GUARDIAN_PRIVATE_KEY     Private key holding the GUARDIAN role
 *
 * Optional env vars:
 *   ORACLE_ADAPTER_ADDRESS   Optional OracleAdapter/QuorumOracleAdapter for staleness checks
 *   MODULE_IDS               Comma-separated 0x-prefixed bytes32 moduleIds to include
 *                            in emergencyPauseAll(). Defaults to the solo-validator module.
 *   ALERT_THRESHOLD_BPS      Max single-poll ETH drop in basis points before pausing
 *                            (default: 500 = 5% drop triggers pause)
 *   POLL_INTERVAL_SEC        Seconds between balance polls (default: 60)
 *   MAX_ORACLE_AGE_SEC       Alert if oracle is this many seconds stale (default: 3600)
 *   WEBHOOK_URL              Optional: POST anomaly JSON to this URL before pausing
 */
import {ethers} from "ethers";

const ROUTER_ABI = [
  "function totalPooledEther() view returns (uint256)",
  "function emergencyPauseAll(bytes32[] calldata moduleIds) external",
  "function GUARDIAN() view returns (bytes32)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
];
const ORACLE_ADAPTER_ABI = ["function lastReportTime() view returns (uint256)"];

const DEFAULT_MODULE_ID = ethers.keccak256(ethers.toUtf8Bytes("SOLO_VALIDATOR_1"));
const DEFAULT_ALERT_THRESHOLD_BPS = 500; // 5%
const DEFAULT_POLL_INTERVAL_SEC = 60;
const DEFAULT_MAX_ORACLE_AGE_SEC = 3600;

export interface Config {
  rpcUrl: string;
  routerAddress: string;
  guardianKey: string;
  oracleAddress: string | null;
  moduleIds: string[];
  alertThresholdBps: number;
  pollIntervalSec: number;
  maxOracleAgeSec: number;
  webhookUrl: string | null;
  dryRun: boolean;
  watch: boolean;
}

function loadConfig(): Config {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const watch = args.includes("--watch") || !args.includes("--once");
  const intervalArg = args.find(a => a.startsWith("--interval="));
  const pollIntervalSec = intervalArg
    ? parseInt(intervalArg.split("=")[1], 10)
    : parseInt(process.env.POLL_INTERVAL_SEC ?? String(DEFAULT_POLL_INTERVAL_SEC), 10);

  const req = (name: string): string => {
    const v = process.env[name];
    if (!v) throw new Error(`Missing required env var: ${name}`);
    return v;
  };

  const rawModuleIds = process.env.MODULE_IDS;
  const moduleIds = rawModuleIds
    ? rawModuleIds.split(",").map(s => s.trim()).filter(Boolean)
    : [DEFAULT_MODULE_ID];

  return {
    rpcUrl: req("RPC_URL"),
    routerAddress: req("ROUTER_ADDRESS"),
    guardianKey: req("GUARDIAN_PRIVATE_KEY"),
    oracleAddress: process.env.ORACLE_ADAPTER_ADDRESS ?? null,
    moduleIds,
    alertThresholdBps: parseInt(process.env.ALERT_THRESHOLD_BPS ?? String(DEFAULT_ALERT_THRESHOLD_BPS), 10),
    pollIntervalSec,
    maxOracleAgeSec: parseInt(process.env.MAX_ORACLE_AGE_SEC ?? String(DEFAULT_MAX_ORACLE_AGE_SEC), 10),
    webhookUrl: process.env.WEBHOOK_URL ?? null,
    dryRun,
    watch,
  };
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function postWebhook(url: string, payload: object) {
  try {
    const {default: https} = await import("https");
    const body = JSON.stringify(payload);
    const u = new URL(url);
    return new Promise<void>((resolve) => {
      const req = https.request(
        {hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, method: "POST",
         headers: {"Content-Type": "application/json", "Content-Length": Buffer.byteLength(body)}},
        () => resolve()
      );
      req.on("error", () => resolve());
      req.write(body);
      req.end();
    });
  } catch { /* non-fatal */ }
}

export async function verifyGuardianRole(router: ethers.Contract, guardian: string) {
  const GUARDIAN_ROLE: string = await router.GUARDIAN();
  const has: boolean = await router.hasRole(GUARDIAN_ROLE, guardian);
  if (!has) {
    throw new Error(`Address ${guardian} does not hold the GUARDIAN role on router ${await router.getAddress()}`);
  }
}

export async function triggerPause(router: ethers.Contract, cfg: Config, reason: string) {
  console.error(`[monitor] ANOMALY DETECTED: ${reason}`);

  if (cfg.webhookUrl) {
    await postWebhook(cfg.webhookUrl, {
      event: "sharedstake.anomaly",
      reason,
      timestamp: new Date().toISOString(),
      router: await router.getAddress(),
      moduleIds: cfg.moduleIds,
    });
  }

  if (cfg.dryRun) {
    console.log("[monitor] --dry-run: would call emergencyPauseAll(", cfg.moduleIds, ")");
    return;
  }

  console.log("[monitor] Calling emergencyPauseAll(", cfg.moduleIds, ")...");
  const tx = await (router as any).emergencyPauseAll(cfg.moduleIds);
  const rcpt = await tx.wait();
  console.log(`[monitor] Protocol PAUSED. tx=${tx.hash} block=${rcpt?.blockNumber}`);
}

export interface State {
  lastPooledEther: bigint | null;
  paused: boolean;
}

export async function checkOnce(
  router: ethers.Contract,
  cfg: Config,
  state: State,
  oracle: ethers.Contract | null = null,
): Promise<void> {
  const totalPooled: bigint = await router.totalPooledEther();
  const ts = new Date().toISOString();
  const nowSec = Math.floor(Date.now() / 1000);

  if (state.paused) {
    console.log(`[monitor] ${ts} Protocol already paused. totalPooled=${ethers.formatEther(totalPooled)} ETH`);
    return;
  }

  if (state.lastPooledEther === null) {
    // First poll — establish baseline
    state.lastPooledEther = totalPooled;
    console.log(`[monitor] ${ts} Baseline: totalPooled=${ethers.formatEther(totalPooled)} ETH`);
    return;
  }

  if (oracle && cfg.maxOracleAgeSec > 0) {
    const lastReportTime: bigint = await oracle.lastReportTime();
    if (lastReportTime > 0n) {
      const ageSec = nowSec - Number(lastReportTime);
      if (ageSec > cfg.maxOracleAgeSec) {
        await triggerPause(
          router,
          cfg,
          `oracle report stale by ${ageSec}s (threshold=${cfg.maxOracleAgeSec}s)`,
        );
        state.paused = true;
        return;
      }
    } else {
      console.warn("[monitor] oracle has no report yet; staleness check deferred");
    }
  }

  const prev = state.lastPooledEther;
  console.log(`[monitor] ${ts} totalPooled=${ethers.formatEther(totalPooled)} ETH (prev=${ethers.formatEther(prev)} ETH)`);

  if (totalPooled < prev) {
    const dropWei = prev - totalPooled;
    // Drop in basis points relative to previous balance (1 bps = 0.01%)
    const dropBps = prev > 0n ? Number((dropWei * 10000n) / prev) : 0;
    console.warn(`[monitor] Balance dropped ${ethers.formatEther(dropWei)} ETH (${dropBps} bps)`);

    if (dropBps >= cfg.alertThresholdBps) {
      await triggerPause(
        router,
        cfg,
        `totalPooledEther dropped ${dropBps} bps (${ethers.formatEther(dropWei)} ETH) in one poll — threshold=${cfg.alertThresholdBps} bps`,
      );
      state.paused = true;
      return;
    }
  }

  state.lastPooledEther = totalPooled;
}

async function main() {
  const cfg = loadConfig();

  const provider = new ethers.JsonRpcProvider(cfg.rpcUrl);
  const wallet = new ethers.Wallet(cfg.guardianKey, provider);
  const router = new ethers.Contract(cfg.routerAddress, ROUTER_ABI, wallet);
  const oracle = cfg.oracleAddress
    ? new ethers.Contract(cfg.oracleAddress, ORACLE_ADAPTER_ABI, wallet)
    : null;

  console.log(`[monitor] Starting balance monitor`);
  console.log(`[monitor] Router: ${cfg.routerAddress}`);
  console.log(`[monitor] Guardian: ${wallet.address}`);
  console.log(`[monitor] Alert threshold: ${cfg.alertThresholdBps} bps`);
  console.log(`[monitor] Module IDs: ${cfg.moduleIds.join(", ")}`);
  if (oracle) {
    console.log(`[monitor] Oracle staleness threshold: ${cfg.maxOracleAgeSec}s`);
  } else {
    console.log("[monitor] Oracle staleness checks disabled (ORACLE_ADAPTER_ADDRESS unset)");
  }
  if (cfg.dryRun) console.log("[monitor] DRY-RUN mode — no on-chain transactions");

  // Verify GUARDIAN role before entering the loop
  await verifyGuardianRole(router, wallet.address);
  console.log("[monitor] GUARDIAN role confirmed");

  const state: State = {lastPooledEther: null, paused: false};

  if (!cfg.watch) {
    await checkOnce(router, cfg, state, oracle);
    return;
  }

  console.log(`[monitor] Watch mode: polling every ${cfg.pollIntervalSec}s`);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await checkOnce(router, cfg, state, oracle);
    } catch (err) {
      console.error("[monitor] Poll error:", (err as Error).message);
    }
    await sleep(cfg.pollIntervalSec * 1000);
  }
}

// Only run the keeper loop when executed directly (ts-node / node), not when
// the module is imported by unit tests.
if (require.main === module) {
  main().catch(err => {
    console.error("[monitor] Fatal:", err);
    process.exit(1);
  });
}
