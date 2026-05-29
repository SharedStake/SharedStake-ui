import { Contract, JsonRpcProvider, getAddress } from "ethers";
import { CodeStatus, Prisma } from "@prisma/client";
import { env } from "../env.js";
import { prisma } from "../db.js";

const CURSOR_ID = "deposit_recorded_sync";

const REFERRAL_REGISTRY_ABI = [
  "event DepositRecorded(address indexed referrer, address indexed referee, uint256 ethAmount, uint256 shares)"
];

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function getStartBlock(provider: JsonRpcProvider): Promise<number> {
  const cursor = await prisma.syncCursor.findUnique({ where: { id: CURSOR_ID } });
  if (cursor) return Number(cursor.lastProcessedBlock + 1n);

  if (env.SYNC_START_BLOCK !== undefined) {
    return Number(env.SYNC_START_BLOCK);
  }

  const latest = await provider.getBlockNumber();
  return Math.max(latest - 5000, 0);
}

async function persistCursor(blockNumber: number): Promise<void> {
  await prisma.syncCursor.upsert({
    where: { id: CURSOR_ID },
    update: { lastProcessedBlock: BigInt(blockNumber) },
    create: { id: CURSOR_ID, lastProcessedBlock: BigInt(blockNumber) }
  });
}

async function processRange(
  contract: Contract,
  fromBlock: number,
  toBlock: number
): Promise<void> {
  if (toBlock < fromBlock) return;

  const events = await contract.queryFilter(contract.filters.DepositRecorded(), fromBlock, toBlock);

  for (const event of events) {
    if (!("args" in event) || !event.args || event.index == null || !event.transactionHash || event.blockNumber == null) {
      continue;
    }

    const referrerAddress = getAddress(String(event.args.referrer));
    const refereeAddress = getAddress(String(event.args.referee));
    const ethAmount = event.args.ethAmount.toString();
    const shares = event.args.shares.toString();

    try {
      await prisma.onchainReferralEvent.create({
        data: {
          txHash: event.transactionHash,
          logIndex: event.index,
          blockNumber: BigInt(event.blockNumber),
          referrerAddress,
          refereeAddress,
          ethAmount,
          shares
        }
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }
      throw error;
    }

    const activeCode = await prisma.referralCode.findFirst({
      where: { referrerAddress, status: CodeStatus.ACTIVE },
      select: { code: true }
    });

    if (!activeCode) {
      console.warn(
        `[sync][divergence] onchain referral for referrer ${referrerAddress} has no active backend code mapping (tx=${event.transactionHash})`
      );
    }
  }

  await persistCursor(toBlock);
  console.log(`[sync] processed DepositRecorded events for blocks ${fromBlock}-${toBlock} (${events.length} events)`);
}

async function run() {
  const rpcUrl = required("RPC_URL", env.RPC_URL);
  const registryAddress = getAddress(
    required("ONCHAIN_REFERRAL_REGISTRY_ADDRESS", env.ONCHAIN_REFERRAL_REGISTRY_ADDRESS)
  );

  const provider = new JsonRpcProvider(rpcUrl, env.CHAIN_ID);
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== env.CHAIN_ID) {
    console.warn(
      `[sync] chain id mismatch: expected ${env.CHAIN_ID}, provider returned ${network.chainId}`
    );
  }

  const contract = new Contract(registryAddress, REFERRAL_REGISTRY_ABI, provider);
  let nextBlock = await getStartBlock(provider);

  console.log(
    `[sync] watching ReferralRegistry=${registryAddress} from block ${nextBlock}, confirmations=${env.SYNC_CONFIRMATIONS}`
  );

  while (true) {
    const latest = await provider.getBlockNumber();
    const safeTo = latest - env.SYNC_CONFIRMATIONS;

    if (safeTo >= nextBlock) {
      const toBlock = Math.min(safeTo, nextBlock + env.SYNC_MAX_BLOCK_RANGE - 1);
      await processRange(contract, nextBlock, toBlock);
      nextBlock = toBlock + 1;
    }

    await new Promise(resolve => setTimeout(resolve, env.SYNC_POLL_INTERVAL_MS));
  }
}

run()
  .catch(async error => {
    console.error("[sync] fatal", error);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
