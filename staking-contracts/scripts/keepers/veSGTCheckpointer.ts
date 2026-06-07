/**
 * veSGTCheckpointer — refreshes decaying VoteEscrowV2 checkpoints before
 * governance proposal snapshots.
 *
 * VoteEscrowV2 stores ERC20Votes checkpoints lazily. Voting power decays with
 * time, but getPastVotes() reads the latest written checkpoint before the
 * snapshot block. This keeper calls checkpointMany() for stale lock holders so
 * proposal snapshots use current decayed power.
 *
 * Usage:
 *   npx ts-node scripts/keepers/veSGTCheckpointer.ts --dry-run
 *   npx ts-node scripts/keepers/veSGTCheckpointer.ts --watch --interval=300
 *   npx ts-node scripts/keepers/veSGTCheckpointer.ts --once
 *
 * Required env vars:
 *   RPC_URL                  JSON-RPC endpoint
 *   VOTE_ESCROW_ADDRESS      Deployed VoteEscrowV2 address
 *   VESGT_KEEPER_PRIVATE_KEY Any funded EOA; checkpointMany() is permissionless
 *
 * Optional env vars:
 *   BATCH_SIZE               Accounts per checkpointMany() call (default: 50)
 *   POLL_INTERVAL_SEC        Seconds between sweeps in --watch mode (default: 300)
 *   WEBHOOK_URL              POST a JSON summary after each sweep
 *   FROM_BLOCK               First block to scan VoteEscrowV2 events (default: 0)
 */
import {ethers} from "ethers";

const VOTE_ESCROW_ABI = [
  "event LockCreated(address indexed provider, uint256 amount, uint256 start, uint256 end, uint256 votingPower)",
  "event Withdraw(address indexed provider, uint256 value, uint256 timestamp)",
  "function checkpointMany(address[] calldata accounts) external",
  "function locked(address) view returns (uint256 amount, uint256 start, uint256 end, uint256 lastDepositTime, uint256 penaltyRateAtLock)",
  "function projectedBalanceOf(address account) view returns (uint256)",
  "function mintedForLock(address) view returns (uint256)",
];

const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_POLL_INTERVAL_SEC = 300;

type EventKind = "lock" | "withdraw";

interface HolderEvent {
  kind: EventKind;
  account: string;
  blockNumber: number;
  logIndex: number;
}

export interface Config {
  rpcUrl: string;
  veAddress: string;
  keeperKey: string | null;
  batchSize: number;
  pollIntervalSec: number;
  webhookUrl: string | null;
  fromBlock: number;
  dryRun: boolean;
  watch: boolean;
}

function parsePositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function loadConfig(): Config {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const watch = args.includes("--watch");
  const intervalArg = args.find(a => a.startsWith("--interval="));
  const pollIntervalSec = intervalArg
    ? parseInt(intervalArg.split("=")[1], 10)
    : parsePositiveInt("POLL_INTERVAL_SEC", DEFAULT_POLL_INTERVAL_SEC);

  if (!Number.isFinite(pollIntervalSec) || pollIntervalSec <= 0) {
    throw new Error("Poll interval must be a positive integer");
  }

  const req = (name: string): string => {
    const v = process.env[name];
    if (!v) throw new Error(`Missing required env var: ${name}`);
    return v;
  };

  const keeperKey = process.env.VESGT_KEEPER_PRIVATE_KEY ?? process.env.KEEPER_PRIVATE_KEY ?? null;
  if (!dryRun && !keeperKey) {
    throw new Error("Missing required env var: VESGT_KEEPER_PRIVATE_KEY");
  }

  return {
    rpcUrl: req("RPC_URL"),
    veAddress: req("VOTE_ESCROW_ADDRESS"),
    keeperKey,
    batchSize: parsePositiveInt("BATCH_SIZE", DEFAULT_BATCH_SIZE),
    pollIntervalSec,
    webhookUrl: process.env.WEBHOOK_URL ?? null,
    fromBlock: parseInt(process.env.FROM_BLOCK ?? "0", 10),
    dryRun,
    watch,
  };
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function postWebhook(url: string, payload: object) {
  try {
    await fetch(url, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload),
    });
  } catch {
    /* best-effort alerting only */
  }
}

function normalizeEvent(kind: EventKind, event: ethers.EventLog): HolderEvent {
  const account = event.args?.provider ?? event.args?.[0];
  if (!account) throw new Error(`Malformed ${kind} event without provider`);
  return {
    kind,
    account,
    blockNumber: Number(event.blockNumber),
    logIndex: Number((event as any).index ?? (event as any).logIndex ?? 0),
  };
}

async function getActiveLockHolders(ve: ethers.Contract, fromBlock: number): Promise<string[]> {
  const [lockEvents, withdrawEvents] = await Promise.all([
    ve.queryFilter(ve.filters.LockCreated(), fromBlock),
    ve.queryFilter(ve.filters.Withdraw(), fromBlock),
  ]);

  const events = [
    ...lockEvents.map(e => normalizeEvent("lock", e as ethers.EventLog)),
    ...withdrawEvents.map(e => normalizeEvent("withdraw", e as ethers.EventLog)),
  ].sort((a, b) => a.blockNumber - b.blockNumber || a.logIndex - b.logIndex);

  const active = new Set<string>();
  for (const event of events) {
    const account = event.account.toLowerCase();
    if (event.kind === "lock") active.add(account);
    else active.delete(account);
  }

  const stillOpen: string[] = [];
  for (const account of active) {
    const lock = await ve.locked(account);
    if (lock.amount > 0n) stillOpen.push(account);
  }
  return stillOpen;
}

async function isStale(ve: ethers.Contract, account: string): Promise<boolean> {
  const [minted, projected]: [bigint, bigint] = await Promise.all([
    ve.mintedForLock(account),
    ve.projectedBalanceOf(account),
  ]);
  return minted > projected;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function checkOnce(
  ve: ethers.Contract,
  signer: ethers.Signer | null,
  cfg: Config,
): Promise<{holders: number; stale: number; txCount: number}> {
  const timestamp = new Date().toISOString();
  console.log(`[veSGT] ${timestamp} scanning from block ${cfg.fromBlock}`);

  const holders = await getActiveLockHolders(ve, cfg.fromBlock);
  const staleChecks = await Promise.all(holders.map(holder => isStale(ve, holder)));
  const stale = holders.filter((_, i) => staleChecks[i]);

  console.log(`[veSGT] holders=${holders.length} stale=${stale.length}`);
  if (stale.length === 0) {
    return {holders: holders.length, stale: 0, txCount: 0};
  }

  let txCount = 0;
  for (const batch of chunk(stale, cfg.batchSize)) {
    if (cfg.dryRun) {
      console.log(`[veSGT] --dry-run would checkpoint ${batch.length} account(s): ${batch.join(",")}`);
      continue;
    }

    if (!signer) throw new Error("Cannot checkpoint without KEEPER_PRIVATE_KEY");
    const tx = await (ve.connect(signer) as any).checkpointMany(batch);
    const receipt = await tx.wait();
    console.log(`[veSGT] checkpointed=${batch.length} tx=${tx.hash} block=${receipt?.blockNumber}`);
    txCount++;
  }

  if (cfg.webhookUrl) {
    await postWebhook(cfg.webhookUrl, {
      event: "sharedstake.veSGT.checkpoint",
      timestamp,
      veAddress: await ve.getAddress(),
      holders: holders.length,
      stale: stale.length,
      txCount,
      dryRun: cfg.dryRun,
    });
  }

  return {holders: holders.length, stale: stale.length, txCount};
}

async function main() {
  const cfg = loadConfig();
  const provider = new ethers.JsonRpcProvider(cfg.rpcUrl);
  const signer = cfg.keeperKey ? new ethers.Wallet(cfg.keeperKey, provider) : null;
  const ve = new ethers.Contract(cfg.veAddress, VOTE_ESCROW_ABI, provider);

  console.log(`[veSGT] ve=${cfg.veAddress} dryRun=${cfg.dryRun}`);
  if (signer) console.log(`[veSGT] keeper=${await signer.getAddress()}`);

  if (!cfg.watch) {
    await checkOnce(ve, signer, cfg);
    return;
  }

  console.log(`[veSGT] watch mode: polling every ${cfg.pollIntervalSec}s`);
  while (true) {
    try {
      await checkOnce(ve, signer, cfg);
    } catch (error) {
      console.error("[veSGT] sweep failed:", error);
    }
    await sleep(cfg.pollIntervalSec * 1000);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
