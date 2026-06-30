/**
 * veSGTCheckpointer — refreshes decaying VoteEscrowV2 voting-power checkpoints
 * before governance proposal snapshots.
 *
 * VoteEscrowV2 uses ERC20Votes checkpoints. Voting power decays linearly to 0
 * at lock expiry, but checkpoints only update when a user interacts or when
 * checkpoint(account) is called explicitly. If a holder's checkpoint is stale
 * at the proposal snapshot block, getPastVotes() returns their original
 * (inflated) voting power rather than the decayed value.
 *
 * Run this keeper before each governance proposal's voting-delay window closes
 * to ensure all active lock holders have current checkpoints.
 *
 * Usage:
 *   npx ts-node scripts/keepers/veSGTCheckpointer.ts
 *   npx ts-node scripts/keepers/veSGTCheckpointer.ts --dry-run
 *   npx ts-node scripts/keepers/veSGTCheckpointer.ts --watch [--interval=300]
 *   npx ts-node scripts/keepers/veSGTCheckpointer.ts --once
 *
 * Required env vars:
 *   RPC_URL                  JSON-RPC endpoint
 *   VOTE_ESCROW_ADDRESS      Deployed VoteEscrowV2 address
 *   KEEPER_PRIVATE_KEY       Any EOA — checkpointMany() is permissionless
 *
 * Optional env vars:
 *   BATCH_SIZE               Accounts per checkpointMany() call (default: 50)
 *   POLL_INTERVAL_SEC        Seconds between sweeps in --watch mode (default: 300)
 *   WEBHOOK_URL              POST a JSON summary after each sweep
 *   FROM_BLOCK               Block to start scanning LockCreated events (default: 0)
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

export interface Config {
  rpcUrl: string;
  veAddress: string;
  keeperKey: string;
  batchSize: number;
  pollIntervalSec: number;
  webhookUrl: string | null;
  fromBlock: number;
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

  return {
    rpcUrl: req("RPC_URL"),
    veAddress: req("VOTE_ESCROW_ADDRESS"),
    keeperKey: req("KEEPER_PRIVATE_KEY"),
    batchSize: parseInt(process.env.BATCH_SIZE ?? String(DEFAULT_BATCH_SIZE), 10),
    pollIntervalSec,
    webhookUrl: process.env.WEBHOOK_URL ?? null,
    fromBlock: parseInt(process.env.FROM_BLOCK ?? "0", 10),
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
    return new Promise<void>(resolve => {
      const req = https.request(
        {
          hostname: u.hostname,
          port: u.port || 443,
          path: u.pathname + u.search,
          method: "POST",
          headers: {"Content-Type": "application/json", "Content-Length": Buffer.byteLength(body)},
        },
        () => resolve(),
      );
      req.on("error", () => resolve());
      req.write(body);
      req.end();
    });
  } catch {
    /* non-fatal */
  }
}

/** Collect all addresses that have ever created a lock and not yet fully withdrawn. */
async function getActiveLockHolders(ve: ethers.Contract, fromBlock: number): Promise<string[]> {
  const lockFilter = ve.filters.LockCreated();
  const withdrawFilter = ve.filters.Withdraw();

  const [lockEvents, withdrawEvents] = await Promise.all([
    ve.queryFilter(lockFilter, fromBlock),
    ve.queryFilter(withdrawFilter, fromBlock),
  ]);

  const locked = new Set<string>();
  for (const e of lockEvents) {
    locked.add((e as ethers.EventLog).args[0]);
  }
  for (const e of withdrawEvents) {
    locked.delete((e as ethers.EventLog).args[0]);
  }

  return Array.from(locked);
}

/** Returns true if the account's on-chain checkpoint is behind its projected decay. */
async function isStale(ve: ethers.Contract, account: string): Promise<boolean> {
  const [minted, projected]: [bigint, bigint] = await Promise.all([
    ve.mintedForLock(account),
    ve.projectedBalanceOf(account),
  ]);
  return minted > projected;
}

export async function checkOnce(ve: ethers.Contract, signer: ethers.Signer, cfg: Config): Promise<void> {
  const ts = new Date().toISOString();
  console.log(`[veSGT] ${ts} Scanning active lock holders from block ${cfg.fromBlock}...`);

  const holders = await getActiveLockHolders(ve, cfg.fromBlock);
  console.log(`[veSGT] ${ts} Found ${holders.length} active lock holder(s).`);

  // Filter to only stale accounts to save gas
  const staleChecks = await Promise.all(holders.map(h => isStale(ve, h)));
  const stale = holders.filter((_, i) => staleChecks[i]);
  console.log(`[veSGT] ${ts} ${stale.length} account(s) need checkpointing.`);

  if (stale.length === 0) {
    console.log(`[veSGT] ${ts} All checkpoints up to date.`);
    return;
  }

  let txCount = 0;
  for (let i = 0; i < stale.length; i += cfg.batchSize) {
    const batch = stale.slice(i, i + cfg.batchSize);
    if (cfg.dryRun) {
      console.log(`[veSGT] --dry-run: would checkpoint batch [${i}..${i + batch.length - 1}]:`, batch);
    } else {
      const tx = await (ve.connect(signer) as any).checkpointMany(batch);
      const rcpt = await tx.wait();
      console.log(`[veSGT] Checkpointed ${batch.length} accounts. tx=${tx.hash} block=${rcpt?.blockNumber}`);
      txCount++;
    }
  }

  if (cfg.webhookUrl) {
    await postWebhook(cfg.webhookUrl, {
      event: "sharedstake.veSGT.checkpoint",
      timestamp: ts,
      veAddress: await ve.getAddress(),
      totalHolders: holders.length,
      staleCount: stale.length,
      txCount,
      dryRun: cfg.dryRun,
    });
  }
}

async function main() {
  const cfg = loadConfig();
  const provider = new ethers.JsonRpcProvider(cfg.rpcUrl);
  const signer = new ethers.Wallet(cfg.keeperKey, provider);
  const ve = new ethers.Contract(cfg.veAddress, VOTE_ESCROW_ABI, provider);

  console.log(`[veSGT] keeper=${await signer.getAddress()} ve=${cfg.veAddress} dryRun=${cfg.dryRun}`);

  if (!cfg.watch) {
    await checkOnce(ve, signer, cfg);
    return;
  }

  console.log(`[veSGT] Watch mode: polling every ${cfg.pollIntervalSec}s`);
  while (true) {
    try {
      await checkOnce(ve, signer, cfg);
    } catch (err) {
      console.error("[veSGT] Error during sweep:", err);
    }
    await sleep(cfg.pollIntervalSec * 1000);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
