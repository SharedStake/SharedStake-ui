/**
 * Unit tests for the withdrawalFinalizer keeper.
 *
 * `finalizeOnce` builds its own JsonRpcProvider / Wallet / Contract from the
 * Config, so the test patches those three constructors on the shared `ethers`
 * module object (see helpers.patchEthers). The keeper imports the same module
 * singleton, so the patch is visible inside it.
 *
 * `verifyGuardianRole` accepts a Contract directly and needs no patching.
 *
 * `finalizeOnce` also acquires a per-contract file lock keyed on
 * `cfg.queueAddress`. Each test uses a UNIQUE queueAddress so the lock files
 * never collide, and afterEach removes any lock files that were created.
 *
 * Covered:
 *   verifyGuardianRole — throws when the role is missing.
 *   finalizeOnce       — skips an empty queue; skips below MIN_BATCH_SIZE;
 *                        throws on insufficient guardian ETH; in dry-run logs
 *                        and returns without submitting finalize().
 */
import {expect} from "chai";
import {ethers} from "ethers";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  verifyGuardianRole,
  finalizeOnce,
  Config,
} from "../../../scripts/keepers/withdrawalFinalizer";
import {
  makeFakeContract,
  makeFakeProvider,
  makeFakeWallet,
  makeFakeTx,
  patchEthers,
  RestoreFn,
} from "./helpers";

const GUARDIAN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("GUARDIAN"));
const GUARDIAN_ADDR = "0x00000000000000000000000000000000000000A1";

/** Unique queue address per test → unique lock file → no cross-test collision. */
let queueCounter = 0;
function uniqueQueueAddress(): string {
  queueCounter += 1;
  return "0x" + queueCounter.toString(16).padStart(40, "0");
}

function lockPathFor(queueAddress: string): string {
  return path.join(os.tmpdir(), `withdrawal-finalizer-${queueAddress.toLowerCase()}.lock`);
}

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    rpcUrl: "http://localhost:8545",
    queueAddress: uniqueQueueAddress(),
    privateKey: "0x" + "1".repeat(64),
    dryRun: false,
    watch: false,
    intervalSec: 120,
    maxBatchSize: 50,
    minBatchSize: 1,
    maxRetries: 5,
    initialBackoffMs: 1,
    ...overrides,
  };
}

describe("keepers/withdrawalFinalizer", () => {
  let restore: RestoreFn | null = null;
  const createdLocks: string[] = [];

  afterEach(() => {
    if (restore) {
      restore();
      restore = null;
    }
    // finalizeOnce releases its own lock via releaseLock(); sweep anything left.
    for (const lock of createdLocks) {
      try {
        fs.unlinkSync(lock);
      } catch {
        /* already gone — fine */
      }
    }
    createdLocks.length = 0;
  });

  describe("verifyGuardianRole", () => {
    it("throws when the guardian does not hold the role", async () => {
      const queue = makeFakeContract({
        GUARDIAN: async () => GUARDIAN_ROLE,
        hasRole: async () => false,
      });
      let threw = false;
      try {
        await verifyGuardianRole(queue, GUARDIAN_ADDR);
      } catch (err) {
        threw = true;
        expect((err as Error).message).to.contain("does not hold the GUARDIAN role");
      }
      expect(threw, "expected verifyGuardianRole to throw").to.equal(true);
    });
  });

  describe("finalizeOnce", () => {
    /**
     * Wire up patched ethers so finalizeOnce sees our fakes. `contractMethods`
     * supplies the QueueV2 method implementations; `balanceWei` is what the
     * fake provider's getBalance returns.
     */
    function wire(cfg: Config, contractMethods: Record<string, unknown>, balanceWei: bigint) {
      createdLocks.push(lockPathFor(cfg.queueAddress));
      const queue = makeFakeContract(contractMethods, cfg.queueAddress);
      restore = patchEthers({
        JsonRpcProvider: function () {
          return makeFakeProvider(balanceWei);
        },
        Wallet: function () {
          return makeFakeWallet(GUARDIAN_ADDR);
        },
        Contract: function () {
          return queue;
        },
      });
      return queue;
    }

    it("skips when the queue is empty (lastFinalized >= next-1)", async () => {
      const cfg = makeConfig();
      // next=5, lastFinalized=4 → fromId=5, lastId=4 → lastId < fromId.
      const queue = wire(
        cfg,
        {
          lastFinalizedRequestId: async () => 4n,
          nextRequestId: async () => 5n,
          getRequest: async () => {
            throw new Error("getRequest should not be called for an empty queue");
          },
          finalize: async () => makeFakeTx(),
        },
        ethers.parseEther("100"),
      );

      await finalizeOnce(cfg);

      expect(queue.__calls.finalize.length).to.equal(0);
      expect(queue.__calls.getRequest.length).to.equal(0);
    });

    it("skips when pending requests are below MIN_BATCH_SIZE", async () => {
      // next=4, lastFinalized=1 → pending = 4-1 ... fromId=2,lastId=3 → 2 pending.
      const cfg = makeConfig({minBatchSize: 5});
      const queue = wire(
        cfg,
        {
          lastFinalizedRequestId: async () => 1n,
          nextRequestId: async () => 4n,
          getRequest: async () => {
            throw new Error("getRequest should not be called below MIN_BATCH_SIZE");
          },
          finalize: async () => makeFakeTx(),
        },
        ethers.parseEther("100"),
      );

      await finalizeOnce(cfg);

      expect(queue.__calls.finalize.length).to.equal(0);
      expect(queue.__calls.getRequest.length).to.equal(0);
    });

    it("throws when the guardian ETH balance is insufficient", async () => {
      const cfg = makeConfig();
      // One pending request needing 10 ETH, but guardian holds only 1 ETH.
      const queue = wire(
        cfg,
        {
          lastFinalizedRequestId: async () => 0n,
          nextRequestId: async () => 2n,
          getRequest: async () => ({
            owner: GUARDIAN_ADDR,
            stShares: ethers.parseEther("10"),
            ethAmount: ethers.parseEther("10"),
            finalized: false,
            claimed: false,
          }),
          finalize: async () => makeFakeTx(),
        },
        ethers.parseEther("1"),
      );

      let threw = false;
      try {
        await finalizeOnce(cfg);
      } catch (err) {
        threw = true;
        expect((err as Error).message).to.contain("guardian balance");
      }
      expect(threw, "expected finalizeOnce to throw on insufficient balance").to.equal(true);
      expect(queue.__calls.finalize.length).to.equal(0);
    });

    it("in dry-run logs and returns without submitting finalize()", async () => {
      const cfg = makeConfig({dryRun: true});
      // One pending request needing 5 ETH; guardian holds 100 ETH (sufficient).
      const queue = wire(
        cfg,
        {
          lastFinalizedRequestId: async () => 0n,
          nextRequestId: async () => 2n,
          getRequest: async () => ({
            owner: GUARDIAN_ADDR,
            stShares: ethers.parseEther("5"),
            ethAmount: ethers.parseEther("5"),
            finalized: false,
            claimed: false,
          }),
          finalize: async () => makeFakeTx(),
        },
        ethers.parseEther("100"),
      );

      await finalizeOnce(cfg);

      // Dry-run: getRequest was read to total the ETH, but finalize() never submitted.
      expect(queue.__calls.getRequest.length).to.equal(1);
      expect(queue.__calls.finalize.length).to.equal(0);
    });

    it("submits finalize() with the correct ETH value when not in dry-run", async () => {
      const cfg = makeConfig({dryRun: false});
      // Two pending requests: 3 ETH + 7 ETH = 10 ETH total; finalize to id 2.
      const ethA = ethers.parseEther("3");
      const ethB = ethers.parseEther("7");
      const queue = wire(
        cfg,
        {
          lastFinalizedRequestId: async () => 0n,
          nextRequestId: async () => 3n,
          getRequest: async (id: bigint) => ({
            owner: GUARDIAN_ADDR,
            stShares: 0n,
            ethAmount: id === 1n ? ethA : ethB,
            finalized: false,
            claimed: false,
          }),
          finalize: async () => makeFakeTx(),
        },
        ethers.parseEther("100"),
      );

      await finalizeOnce(cfg);

      expect(queue.__calls.finalize.length).to.equal(1);
      const [lastRequestId, txOpts] = queue.__calls.finalize[0] as [bigint, {value: bigint}];
      expect(lastRequestId).to.equal(2n);
      expect(txOpts.value).to.equal(ethA + ethB);
    });
  });
});
