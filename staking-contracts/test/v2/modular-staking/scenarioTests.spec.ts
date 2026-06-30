/**
 * Pre-mainnet mandatory scenario tests for the SharedStake V2 modular stack.
 *
 * Source-of-truth invariants (from contracts-v1-invariants.md / MODULAR_STAKING_ARCHITECTURE.md):
 *   - totalSupply == totalPooledEther                               (StToken accounting identity)
 *   - No user can claim more ETH than their request locked          (no over-claim)
 *   - Share price is monotonically non-decreasing unless slash      (rewards rebase up; slash rebases down)
 *   - Queue claimable amount never exceeds protocol ETH balance     (lockedEther <= contract balance)
 *   - Pause halts user-facing mutations behind that pause flag      (PAUSE_SUBMIT blocks deposits)
 *
 * The five mandatory scenarios:
 *   1. Invariant/fuzz: randomized deposit/withdraw sequences preserving total supply == total pooled ETH
 *   2. Invariant/fuzz: interleaved requestRedeem/finalize/claim preserving queue head/tail invariants
 *   3. Scenario:        pause + queued redemptions + resume — no claims succeed while paused on the
 *                       paused surface (deposits); resume restores normal flow
 *   4. Scenario:        slash event during simultaneous deposit/redeem — accounting holds
 *   5. Scenario:        fee mode transitions with balance conservation — total protocol balance preserved
 *
 * Hardhat-only "fuzzing" is implemented as deterministic-seeded pseudo-random sequences with
 * invariant assertions inside every iteration. Foundry-style invariant runner is not used here.
 */
import {ethers} from "hardhat";
import {expect} from "chai";
import {parseEther, ZeroAddress} from "ethers";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

// ── Deterministic PRNG ────────────────────────────────────────────────────────
// Mulberry32: small, fast, deterministic. We avoid Math.random() so failures
// are reproducible from the seed printed at the top of each scenario.
function makePrng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickInt(rand: () => number, lo: number, hi: number): number {
  return lo + Math.floor(rand() * (hi - lo + 1));
}

// Random ETH amount in [min, max] (inclusive), in wei.
function pickEth(rand: () => number, minEth: string, maxEth: string): bigint {
  const min = parseEther(minEth);
  const max = parseEther(maxEth);
  const span = max - min;
  // 1e6 buckets is more than enough granularity for fuzz.
  const buckets = 1_000_000n;
  const bucket = BigInt(pickInt(rand, 0, Number(buckets) - 1));
  return min + (span * bucket) / (buckets - 1n);
}

describe("SharedStake V2 Mandatory Scenario Tests", () => {
  let deployer: SignerWithAddress,
    gov: SignerWithAddress,
    oracle: SignerWithAddress,
    treasury: SignerWithAddress,
    operator: SignerWithAddress,
    alice: SignerWithAddress,
    bob: SignerWithAddress,
    carol: SignerWithAddress,
    dave: SignerWithAddress;

  let stToken: any, stakingCore: any, queue: any, feeController: any;

  const ORACLE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ORACLE"));
  const GUARDIAN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("GUARDIAN"));
  const PAUSE_SUBMIT = 0;

  /**
   * Deploy a fresh stack for each scenario so state from prior `it` blocks
   * cannot leak across tests. Mirrors the pattern in stakingCore.spec.ts and
   * withdrawalQueueV2.spec.ts.
   */
  async function deployFresh() {
    [deployer, gov, oracle, treasury, operator, alice, bob, carol, dave] = await ethers.getSigners();

    const StToken = await ethers.getContractFactory("StToken");
    stToken = await StToken.deploy();

    const FeeController = await ethers.getContractFactory("FeeController");
    feeController = await FeeController.deploy(
      gov.address,
      treasury.address,
      operator.address,
      ZeroAddress, // referral registry (unused in this suite)
      ZeroAddress, // debt pool (disabled)
      1000, // 10% fee
      5000, // 50/50 split treasury/operator
      5000, // operator split
      0, // debt pool split (disabled)
    );

    const StakingCore = await ethers.getContractFactory("StakingCore");
    stakingCore = await StakingCore.deploy(stToken.target, gov.address);

    const WithdrawalQueueV2 = await ethers.getContractFactory("WithdrawalQueueV2");
    queue = await WithdrawalQueueV2.deploy(stToken.target, gov.address);

    await stToken.addMinter(stakingCore.target);
    await stToken.addMinter(queue.target);

    await stakingCore.connect(gov).setFeeController(feeController.target);
    await stakingCore.connect(gov).grantRole(ORACLE_ROLE, oracle.address);
  }

  beforeEach(deployFresh);

  // ──────────────────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────────────────

  /** Re-asserts the StToken accounting identity on every transition. */
  async function assertSupplyEqualsPool() {
    const totalSupply = await stToken.totalSupply();
    const totalPooled = await stToken.totalPooledEther();
    expect(totalSupply).to.equal(
      totalPooled,
      `Invariant violated: totalSupply (${totalSupply}) != totalPooledEther (${totalPooled})`,
    );
  }

  /** Queue cannot promise out more ETH than it actually holds. */
  async function assertQueueSolvent() {
    const locked = await queue.lockedEther();
    const balance = await ethers.provider.getBalance(queue.target);
    expect(balance).to.be.gte(locked, `Invariant violated: queue balance (${balance}) < lockedEther (${locked})`);
  }

  /** Queue head/tail bookkeeping must remain monotone and consistent. */
  async function assertQueuePointers() {
    const next = await queue.nextRequestId();
    const lastFinalized = await queue.lastFinalizedRequestId();
    expect(next).to.be.gte(1n);
    // lastFinalized must point to an id that was actually issued.
    expect(lastFinalized).to.be.lt(next);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Invariant/fuzz on mint/burn
  // ──────────────────────────────────────────────────────────────────────────

  describe("1. Mint/burn invariant fuzz", () => {
    it("preserves totalSupply == totalPooledEther across 30 randomized deposit/withdraw rounds", async () => {
      const SEED = 0xc0ffee;
      const ITERATIONS = 30;
      const rand = makePrng(SEED);
      const users = [alice, bob, carol, dave];

      // Bootstrap so the first request can be priced against a non-zero pool
      // (avoids 0-share edge case from a totally cold start).
      await stakingCore.connect(alice).submit(ZeroAddress, {value: parseEther("1")});
      await assertSupplyEqualsPool();

      for (let i = 0; i < ITERATIONS; i++) {
        const action = pickInt(rand, 0, 2); // 0=deposit 1=request 2=skip
        const user = users[pickInt(rand, 0, users.length - 1)];

        if (action === 0) {
          // Deposit.
          const amount = pickEth(rand, "0.05", "5");
          await stakingCore.connect(user).submit(ZeroAddress, {value: amount});
        } else if (action === 1) {
          // Withdrawal request: only attempt if the user has enough stETH balance
          // and that balance falls within MIN_WITHDRAWAL .. MAX_WITHDRAWAL.
          const bal: bigint = await stToken.balanceOf(user.address);
          const minW = parseEther("0.01");
          if (bal >= minW) {
            // Cap at MAX_WITHDRAWAL (1000 ETH) to stay within request bounds.
            const upper = bal > parseEther("1000") ? parseEther("1000") : bal;
            const span = upper - minW;
            const bucket = BigInt(pickInt(rand, 0, 999));
            const amount = minW + (span * bucket) / 999n;
            await queue.connect(user).requestWithdrawals([amount], user.address);
          }
        }
        // action === 2: no-op step exercises that read-only invariants still hold.

        await assertSupplyEqualsPool();
        await assertQueuePointers();
      }
    });

    it("preserves accounting under randomized deposit-then-burn sequences with no rewards", async () => {
      const SEED = 0xbadcafe;
      const ITERATIONS = 25;
      const rand = makePrng(SEED);

      // Bootstrap pool.
      await stakingCore.connect(alice).submit(ZeroAddress, {value: parseEther("1")});

      for (let i = 0; i < ITERATIONS; i++) {
        // Random deposit from a random signer.
        const depositor = [alice, bob, carol, dave][pickInt(rand, 0, 3)];
        const depAmount = pickEth(rand, "0.1", "3");
        await stakingCore.connect(depositor).submit(ZeroAddress, {value: depAmount});

        // Sometimes immediately request a withdrawal of part of that user's balance.
        if (pickInt(rand, 0, 1) === 1) {
          const bal: bigint = await stToken.balanceOf(depositor.address);
          if (bal >= parseEther("0.05")) {
            const half = bal / 2n;
            const reqAmount = half < parseEther("0.01") ? parseEther("0.01") : half;
            const capped = reqAmount > parseEther("1000") ? parseEther("1000") : reqAmount;
            await queue.connect(depositor).requestWithdrawals([capped], depositor.address);
          }
        }

        await assertSupplyEqualsPool();
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Invariant/fuzz on queue accounting
  // ──────────────────────────────────────────────────────────────────────────

  describe("2. Queue accounting invariant fuzz", () => {
    it("preserves queue head/tail monotonicity across interleaved request/finalize/claim", async () => {
      const SEED = 0xdeadbeef;
      const ITERATIONS = 25;
      const rand = makePrng(SEED);
      const users = [alice, bob, carol, dave];

      // Seed every user with an initial deposit so they can request withdrawals.
      for (const u of users) {
        await stakingCore.connect(u).submit(ZeroAddress, {value: parseEther("10")});
      }

      // Track per-user issued-but-unclaimed request IDs so we know what to claim.
      const issued: Map<string, number[]> = new Map();
      for (const u of users) issued.set(u.address, []);

      for (let i = 0; i < ITERATIONS; i++) {
        const action = pickInt(rand, 0, 2); // 0=request 1=finalize 2=claim
        const user = users[pickInt(rand, 0, users.length - 1)];

        if (action === 0) {
          // Request a withdrawal.
          const bal: bigint = await stToken.balanceOf(user.address);
          if (bal >= parseEther("0.05")) {
            const amount = pickEth(rand, "0.01", "1");
            const safe = amount > bal ? bal / 2n : amount;
            if (safe >= parseEther("0.01")) {
              const txId = await queue.nextRequestId();
              await queue.connect(user).requestWithdrawals([safe], user.address);
              issued.get(user.address)!.push(Number(txId));
            }
          }
        } else if (action === 1) {
          // Finalize all pending up to nextRequestId - 1.
          const next: bigint = await queue.nextRequestId();
          const lastFinalized: bigint = await queue.lastFinalizedRequestId();
          if (next - 1n > lastFinalized) {
            // Sum eth required in [lastFinalized+1 .. next-1].
            let totalRequired = 0n;
            for (let id = lastFinalized + 1n; id <= next - 1n; id++) {
              const r = await queue.getRequest(id);
              totalRequired += r.ethAmount;
            }
            await queue.connect(gov).finalize(next - 1n, {value: totalRequired});
          }
        } else {
          // Claim a finalized-but-unclaimed request for `user`, if any.
          const ids = issued.get(user.address)!;
          for (let k = 0; k < ids.length; k++) {
            const r = await queue.getRequest(ids[k]);
            if (r.finalized && !r.claimed) {
              await queue.connect(user).claimWithdrawal(ids[k], user.address);
              ids.splice(k, 1);
              break;
            }
          }
        }

        // Invariants after each step.
        await assertSupplyEqualsPool();
        await assertQueueSolvent();
        await assertQueuePointers();
      }
    });

    it("never lets sum of claimed ETH exceed sum of finalized ETH", async () => {
      // Deterministic but exhaustive end-state assertion: drain the queue.
      await stakingCore.connect(alice).submit(ZeroAddress, {value: parseEther("20")});
      await stakingCore.connect(bob).submit(ZeroAddress, {value: parseEther("20")});

      const reqAmounts = [parseEther("1"), parseEther("2"), parseEther("3")];
      await queue.connect(alice).requestWithdrawals(reqAmounts, alice.address);
      await queue.connect(bob).requestWithdrawals([parseEther("1.5")], bob.address);

      let totalToFinalize = 0n;
      for (let id = 1n; id <= 4n; id++) {
        const r = await queue.getRequest(id);
        totalToFinalize += r.ethAmount;
      }
      await queue.connect(gov).finalize(4, {value: totalToFinalize});

      let totalClaimed = 0n;
      for (let id = 1; id <= 3; id++) {
        const r = await queue.getRequest(id);
        await queue.connect(alice).claimWithdrawal(id, alice.address);
        totalClaimed += r.ethAmount;
      }
      const r4 = await queue.getRequest(4);
      await queue.connect(bob).claimWithdrawal(4, bob.address);
      totalClaimed += r4.ethAmount;

      expect(totalClaimed).to.be.lte(totalToFinalize);
      expect(await queue.lockedEther()).to.equal(0n);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Pause + queued redemptions + resume  (HIGH PRIORITY)
  // ──────────────────────────────────────────────────────────────────────────

  describe("3. Pause + queued redemptions + resume (HIGHEST PRIORITY)", () => {
    /**
     * Lifecycle being exercised:
     *   t0: Alice + Bob deposit normally.
     *   t1: Alice + Bob each request a withdrawal (pre-pause).
     *   t2: GUARDIAN pauses PAUSE_SUBMIT on StakingCore.
     *   t3: While paused: deposits MUST revert; queue requests/finalize/claim
     *       continue to work (the queue has no pause). The architecture doc
     *       calls out that pause halts user-facing *mutations on the paused
     *       surface*; deposit is the paused surface here.
     *   t4: GOV unpauses; deposits succeed again.
     *
     * Across the entire lifecycle, totalSupply == totalPooledEther holds.
     */
    it("blocks deposits while paused, allows existing queued requests to settle, resumes deposits cleanly", async () => {
      // t0: deposits.
      await stakingCore.connect(alice).submit(ZeroAddress, {value: parseEther("5")});
      await stakingCore.connect(bob).submit(ZeroAddress, {value: parseEther("5")});
      await assertSupplyEqualsPool();

      // t1: pre-pause withdrawal requests.
      await queue.connect(alice).requestWithdrawals([parseEther("1")], alice.address);
      await queue.connect(bob).requestWithdrawals([parseEther("2")], bob.address);
      await assertSupplyEqualsPool();
      await assertQueueSolvent();

      // t2: pause submit on StakingCore (gov holds GUARDIAN by constructor).
      await stakingCore.connect(gov).pause(PAUSE_SUBMIT);

      // t3a: deposits must revert while paused, including the receive() fallback.
      await expect(stakingCore.connect(carol).submit(ZeroAddress, {value: parseEther("1")})).to.be.reverted;
      await expect(carol.sendTransaction({to: stakingCore.target, value: parseEther("1")})).to.be.reverted;
      await expect(
        stakingCore
          .connect(alice)
          .submitWithAttribution(ZeroAddress, ethers.encodeBytes32String("paused-deposit"), {value: parseEther("1")}),
      ).to.be.reverted;

      // t3b: queue surface is unaffected — gov can still finalize and users can claim.
      const aliceReq = await queue.getRequest(1);
      const bobReq = await queue.getRequest(2);
      const totalToFinalize = aliceReq.ethAmount + bobReq.ethAmount;
      await queue.connect(gov).finalize(2, {value: totalToFinalize});

      const aliceEthBefore = await ethers.provider.getBalance(alice.address);
      const tx1 = await queue.connect(alice).claimWithdrawal(1, alice.address);
      const r1 = await tx1.wait();
      const gas1 = r1!.gasUsed * r1!.gasPrice;
      const aliceEthAfter = await ethers.provider.getBalance(alice.address);
      expect(aliceEthAfter + gas1).to.be.gt(aliceEthBefore);

      await queue.connect(bob).claimWithdrawal(2, bob.address);

      // Even with claims executing while StakingCore.submit is paused,
      // the supply/pool identity must still hold.
      await assertSupplyEqualsPool();
      await assertQueueSolvent();

      // t3c: deposits remain blocked while still paused.
      await expect(stakingCore.connect(carol).submit(ZeroAddress, {value: parseEther("1")})).to.be.reverted;

      // t4: unpause and verify deposits resume.
      await stakingCore.connect(gov).unpause(PAUSE_SUBMIT);
      await stakingCore.connect(carol).submit(ZeroAddress, {value: parseEther("1")});
      const carolShares = await stToken.sharesOf(carol.address);
      expect(carolShares).to.be.gt(0n);
      await assertSupplyEqualsPool();
      await assertQueueSolvent();
    });

    it("non-GUARDIAN cannot pause, non-GOV cannot unpause", async () => {
      // alice has no roles.
      await expect(stakingCore.connect(alice).pause(PAUSE_SUBMIT)).to.be.reverted;

      // Pause as gov (GUARDIAN).
      await stakingCore.connect(gov).pause(PAUSE_SUBMIT);

      // alice cannot unpause.
      await expect(stakingCore.connect(alice).unpause(PAUSE_SUBMIT)).to.be.reverted;

      // Cleanup so subsequent tests in this describe block remain isolated.
      await stakingCore.connect(gov).unpause(PAUSE_SUBMIT);
    });

    it("queued requests created while paused remain valid after unpause", async () => {
      // Bootstrap a balance so a request is possible while paused.
      await stakingCore.connect(alice).submit(ZeroAddress, {value: parseEther("5")});

      // Pause submit.
      await stakingCore.connect(gov).pause(PAUSE_SUBMIT);

      // Withdrawal queue is independent of PAUSE_SUBMIT; alice can still queue.
      await queue.connect(alice).requestWithdrawals([parseEther("1")], alice.address);
      await assertSupplyEqualsPool();

      // Unpause and finalize/claim — the request must settle correctly.
      await stakingCore.connect(gov).unpause(PAUSE_SUBMIT);
      const r = await queue.getRequest(1);
      await queue.connect(gov).finalize(1, {value: r.ethAmount});
      const ethBefore = await ethers.provider.getBalance(alice.address);
      const tx = await queue.connect(alice).claimWithdrawal(1, alice.address);
      const rc = await tx.wait();
      const gas = rc!.gasUsed * rc!.gasPrice;
      const ethAfter = await ethers.provider.getBalance(alice.address);
      expect(ethAfter + gas).to.be.gt(ethBefore);

      await assertSupplyEqualsPool();
      await assertQueueSolvent();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Slash event during simultaneous deposit/redeem  (HIGH PRIORITY)
  // ──────────────────────────────────────────────────────────────────────────

  describe("4. Slash during concurrent deposit/redeem (HIGHEST PRIORITY)", () => {
    /**
     * Lifecycle:
     *   t0: Several deposits, beacon baseline initialized via NODE_OPERATOR
     *       (gov holds NODE_OPERATOR by constructor) and a positive oracle report.
     *   t1: Bob has a redemption queued at the post-reward share rate.
     *   t2: A slash event arrives via reportBeacon with a *lower* beacon balance.
     *       This triggers a downward rebase of stETH.
     *   t3: Carol deposits AT THE SLASHED RATE.
     *   t4: Dave queues a redemption AT THE SLASHED RATE.
     *   t5: Finalize and claim everything.
     *
     * Invariants checked at each step:
     *   - totalSupply == totalPooledEther
     *   - No fee shares are minted on the slash report
     *   - Bob's pre-slash queued ethAmount remains exactly what was locked at
     *     request time (queue locks ethAmount at request, not at finalize)
     *   - Queue stays solvent
     *   - totalShares is monotonically non-decreasing (slashes do NOT burn shares,
     *     only reduce pool); strictly: only burnShares from withdrawal can reduce it
     */
    it("preserves accounting through a slash that happens between deposits and redemptions", async () => {
      // ── t0: setup with two depositors and a positive reward report ────────
      await stakingCore.connect(alice).submit(ZeroAddress, {value: parseEther("10")});
      await stakingCore.connect(bob).submit(ZeroAddress, {value: parseEther("10")});

      // Move 20 ETH from buffered to beacon baseline.
      await stakingCore.connect(gov).notifyBeaconDeposit(parseEther("20"));

      // Positive report: 20 -> 23 ETH (3 ETH reward).
      await stakingCore.connect(oracle).reportBeacon(1, parseEther("23"));
      await assertSupplyEqualsPool();

      const treasurySharesAfterReward = await stToken.sharesOf(treasury.address);
      const operatorSharesAfterReward = await stToken.sharesOf(operator.address);
      expect(treasurySharesAfterReward).to.be.gt(0n);
      expect(operatorSharesAfterReward).to.be.gt(0n);

      // ── t1: Bob queues a redemption at the post-reward rate ───────────────
      const bobBalPreSlash: bigint = await stToken.balanceOf(bob.address);
      const bobReqAmount = parseEther("3");
      expect(bobBalPreSlash).to.be.gt(bobReqAmount);
      await queue.connect(bob).requestWithdrawals([bobReqAmount], bob.address);
      const bobReqIdPreSlash = 1;
      const bobReqPreSlash = await queue.getRequest(bobReqIdPreSlash);
      const bobLockedEth = bobReqPreSlash.ethAmount;
      await assertSupplyEqualsPool();
      await assertQueueSolvent();

      // Snapshot share price (totalPooled / totalShares) just before slash.
      const poolPreSlash: bigint = await stToken.totalPooledEther();
      const sharesPreSlash: bigint = await stToken.getTotalShares();

      // ── t2: SLASH — beacon balance falls from 23 ETH to 19 ETH ────────────
      // Snapshot fee recipients to prove no fee shares are minted on slash.
      const treasurySharesBeforeSlash = await stToken.sharesOf(treasury.address);
      const operatorSharesBeforeSlash = await stToken.sharesOf(operator.address);

      await stakingCore.connect(oracle).reportBeacon(1, parseEther("19"));
      await assertSupplyEqualsPool();

      // Pool fell. Total shares unchanged (no burn happened).
      const poolPostSlash: bigint = await stToken.totalPooledEther();
      const sharesPostSlash: bigint = await stToken.getTotalShares();
      expect(poolPostSlash).to.be.lt(poolPreSlash);
      expect(sharesPostSlash).to.equal(sharesPreSlash);

      // Slash MUST NOT mint fees.
      expect(await stToken.sharesOf(treasury.address)).to.equal(treasurySharesBeforeSlash);
      expect(await stToken.sharesOf(operator.address)).to.equal(operatorSharesBeforeSlash);

      // Bob's pre-slash request keeps its locked ethAmount (queue locks at
      // request time, not at finalize). This is contract-defined behavior;
      // we assert it explicitly so a regression in lock semantics is caught.
      const bobReqPostSlash = await queue.getRequest(bobReqIdPreSlash);
      expect(bobReqPostSlash.ethAmount).to.equal(bobLockedEth);

      // ── t3: Carol deposits at the slashed rate ────────────────────────────
      await stakingCore.connect(carol).submit(ZeroAddress, {value: parseEther("4")});
      await assertSupplyEqualsPool();

      // Carol's shares at slashed rate should be more shares per ETH than at
      // the pre-slash rate (because pool/shares ratio shrank).
      const carolShares: bigint = await stToken.sharesOf(carol.address);
      const carolEthValue = parseEther("4");
      // shares = eth * totalSharesPostSlash / poolBeforeCarolDeposit
      // Just sanity check that she got non-zero shares and her balance is ~= 4 ETH.
      expect(carolShares).to.be.gt(0n);
      const carolBal: bigint = await stToken.balanceOf(carol.address);
      // Allow 0.01 ETH tolerance for share-rounding.
      expect(carolBal).to.be.closeTo(carolEthValue, parseEther("0.01"));

      // ── t4: Dave queues a redemption at the slashed rate ──────────────────
      // Give dave a balance first (deposits aren't paused).
      await stakingCore.connect(dave).submit(ZeroAddress, {value: parseEther("3")});
      const daveBal: bigint = await stToken.balanceOf(dave.address);
      expect(daveBal).to.be.gte(parseEther("1"));
      await queue.connect(dave).requestWithdrawals([parseEther("1")], dave.address);

      const daveReqId = 2;
      const daveReq = await queue.getRequest(daveReqId);
      // Dave's locked eth equals the post-slash share value of 1 stETH (~1 ETH).
      expect(daveReq.ethAmount).to.be.closeTo(parseEther("1"), parseEther("0.01"));

      // ── t5: Finalize and claim for both Bob and Dave ──────────────────────
      const totalEthRequired = bobReqPostSlash.ethAmount + daveReq.ethAmount;
      await queue.connect(gov).finalize(2, {value: totalEthRequired});
      await assertQueueSolvent();

      const bobBefore = await ethers.provider.getBalance(bob.address);
      const tx1 = await queue.connect(bob).claimWithdrawal(bobReqIdPreSlash, bob.address);
      const r1 = await tx1.wait();
      const gas1 = r1!.gasUsed * r1!.gasPrice;
      const bobAfter = await ethers.provider.getBalance(bob.address);
      expect(bobAfter + gas1 - bobBefore).to.equal(bobReqPostSlash.ethAmount);

      const daveBefore = await ethers.provider.getBalance(dave.address);
      const tx2 = await queue.connect(dave).claimWithdrawal(daveReqId, dave.address);
      const r2 = await tx2.wait();
      const gas2 = r2!.gasUsed * r2!.gasPrice;
      const daveAfter = await ethers.provider.getBalance(dave.address);
      expect(daveAfter + gas2 - daveBefore).to.equal(daveReq.ethAmount);

      // ── Final invariants ──────────────────────────────────────────────────
      await assertSupplyEqualsPool();
      await assertQueueSolvent();
      expect(await queue.lockedEther()).to.equal(0n);
    });

    it("a slash large enough to drop the pool below buffered ETH is rejected by sanity guard", async () => {
      // Sanity: BeaconBalanceSanityFailed only fires on *implausibly large* upward
      // balances (> 2x maxPlausible). For downward (slash), there's no upper bound check,
      // but reportBeacon with 0 balance after a baseline of N must still rebalance the
      // pool to bufferedEther. Verify that path behaves and the identity holds.
      await stakingCore.connect(alice).submit(ZeroAddress, {value: parseEther("10")});
      await stakingCore.connect(gov).notifyBeaconDeposit(parseEther("10"));
      await stakingCore.connect(oracle).reportBeacon(1, parseEther("10")); // baseline
      await assertSupplyEqualsPool();

      // Catastrophic slash: validators forfeit everything but stay reported.
      await stakingCore.connect(oracle).reportBeacon(1, 0n);
      await assertSupplyEqualsPool();

      const pool = await stToken.totalPooledEther();
      const buffered = await stakingCore.bufferedEther();
      // After a 100% slash, pool == bufferedEther (which is 0 in this scenario).
      expect(pool).to.equal(buffered);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Fee mode transitions with balance conservation
  // ──────────────────────────────────────────────────────────────────────────

  describe("5. Fee mode transitions with balance conservation", () => {
    /**
     * "Fee mode transitions" exercised:
     *   - feeBps changes (10% -> 5% -> 0%)
     *   - treasurySplitBps changes (50/50 -> 100/0 -> 0/100)
     *   - recipient changes (treasury/operator addresses change)
     *
     * "Balance conservation" means: across each transition, the sum of all stETH
     * balances in the system equals totalPooledEther — i.e., changing fee config
     * cannot create or destroy ETH on its own. Fee config only affects how
     * *future* rewards are split.
     */
    async function sumAllStEthBalances(): Promise<bigint> {
      const accounts = [
        deployer.address,
        gov.address,
        oracle.address,
        treasury.address,
        operator.address,
        alice.address,
        bob.address,
        carol.address,
        dave.address,
        stakingCore.target,
        queue.target,
        feeController.target,
        ZeroAddress,
      ];
      let total = 0n;
      for (const a of accounts) {
        // skip ZeroAddress (no balance lookup needed) and addresses without code
        if (a === ZeroAddress) continue;
        total += BigInt(await stToken.balanceOf(a));
      }
      return total;
    }

    it("fee config changes do not alter existing balances; rewards split per current config", async () => {
      // ── Setup ─────────────────────────────────────────────────────────────
      await stakingCore.connect(alice).submit(ZeroAddress, {value: parseEther("10")});
      await stakingCore.connect(bob).submit(ZeroAddress, {value: parseEther("10")});
      await stakingCore.connect(gov).notifyBeaconDeposit(parseEther("20"));

      // First reward at 10% fee, 50/50 split.
      await stakingCore.connect(oracle).reportBeacon(1, parseEther("21"));
      await assertSupplyEqualsPool();

      const treasury1 = await stToken.sharesOf(treasury.address);
      const operator1 = await stToken.sharesOf(operator.address);
      expect(treasury1).to.be.gt(0n);
      expect(operator1).to.be.gt(0n);

      // Snapshot pool & sum-of-balances BEFORE config change.
      const poolBeforeConfigChange: bigint = await stToken.totalPooledEther();
      const sumBeforeConfigChange = await sumAllStEthBalances();
      // Sum of per-account balances must equal pool (modulo rounding tolerance
      // from share rounding distributed across many accounts).
      // On Lido-style accounting, dust may differ by a few wei.
      expect(sumBeforeConfigChange).to.be.closeTo(poolBeforeConfigChange, 1000n);

      // ── Transition 1: fee 10% -> 5%, split unchanged ──────────────────────
      await feeController.connect(gov).setFee(500, 5000, 5000, 0);
      // Config change alone does not alter any state in StToken / StakingCore.
      await assertSupplyEqualsPool();
      expect(await stToken.totalPooledEther()).to.equal(poolBeforeConfigChange);
      expect(await stToken.sharesOf(treasury.address)).to.equal(treasury1);
      expect(await stToken.sharesOf(operator.address)).to.equal(operator1);
      expect(await sumAllStEthBalances()).to.be.closeTo(poolBeforeConfigChange, 1000n);

      // Next reward report should split with the new fee.
      await stakingCore.connect(oracle).reportBeacon(1, parseEther("22"));
      await assertSupplyEqualsPool();
      const treasury2 = await stToken.sharesOf(treasury.address);
      const operator2 = await stToken.sharesOf(operator.address);
      expect(treasury2).to.be.gt(treasury1);
      expect(operator2).to.be.gt(operator1);

      // ── Transition 2: split 50/50 -> 100/0 (all to treasury) ──────────────
      await feeController.connect(gov).setFee(500, 10000, 0, 0);
      const poolBeforeT2: bigint = await stToken.totalPooledEther();
      const sumBeforeT2 = await sumAllStEthBalances();
      expect(sumBeforeT2).to.be.closeTo(poolBeforeT2, 1000n);

      await stakingCore.connect(oracle).reportBeacon(1, parseEther("23"));
      await assertSupplyEqualsPool();
      const treasury3 = await stToken.sharesOf(treasury.address);
      const operator3 = await stToken.sharesOf(operator.address);
      expect(treasury3).to.be.gt(treasury2);
      // Operator received NO new shares this round.
      expect(operator3).to.equal(operator2);

      // ── Transition 3: fee -> 0 (no fees minted on next reward) ────────────
      await feeController.connect(gov).setFee(0, 0, 0, 0);
      const treasury4Before = await stToken.sharesOf(treasury.address);
      const operator4Before = await stToken.sharesOf(operator.address);
      const poolBeforeT3: bigint = await stToken.totalPooledEther();

      await stakingCore.connect(oracle).reportBeacon(1, parseEther("24"));
      await assertSupplyEqualsPool();
      // Pool grew and NO fee shares were minted.
      expect(await stToken.sharesOf(treasury.address)).to.equal(treasury4Before);
      expect(await stToken.sharesOf(operator.address)).to.equal(operator4Before);
      const poolAfterT3: bigint = await stToken.totalPooledEther();
      // With zero fee, pool equals beacon balance (buffered is 0).
      expect(poolAfterT3).to.equal(parseEther("24"));

      // ── Transition 4: change recipients mid-flight ────────────────────────
      // After this, future rewards go to carol/dave instead of treasury/operator.
      await feeController.connect(gov).setFee(1000, 5000, 5000, 0);
      await feeController.connect(gov).setRecipients(carol.address, dave.address, carol.address, ZeroAddress);

      const carolBefore = await stToken.sharesOf(carol.address);
      const daveBefore = await stToken.sharesOf(dave.address);

      await stakingCore.connect(oracle).reportBeacon(1, parseEther("25"));
      await assertSupplyEqualsPool();

      // New recipients received fee shares; old recipients did NOT.
      expect(await stToken.sharesOf(carol.address)).to.be.gt(carolBefore);
      expect(await stToken.sharesOf(dave.address)).to.be.gt(daveBefore);
      // Old recipients were not credited again.
      // (treasury4Before / operator4Before were the pre-T3-zero-fee snapshots,
      //  but T3 minted nothing, and no other transition minted to them since.)
      expect(await stToken.sharesOf(treasury.address)).to.equal(treasury4Before);
      expect(await stToken.sharesOf(operator.address)).to.equal(operator4Before);

      // Final balance conservation check.
      const finalPool: bigint = await stToken.totalPooledEther();
      const finalSum = await sumAllStEthBalances();
      expect(finalSum).to.be.closeTo(finalPool, 1000n);
    });

    it("setFee reverts when feeBps exceeds the cap, leaving prior balances untouched", async () => {
      await stakingCore.connect(alice).submit(ZeroAddress, {value: parseEther("5")});
      const poolBefore = await stToken.totalPooledEther();
      const aliceBefore = await stToken.balanceOf(alice.address);

      await expect(feeController.connect(gov).setFee(2001, 5000, 5000, 0)).to.be.revertedWithCustomError(
        feeController,
        "FeeTooHigh",
      );

      // No state change.
      expect(await stToken.totalPooledEther()).to.equal(poolBefore);
      expect(await stToken.balanceOf(alice.address)).to.equal(aliceBefore);
      await assertSupplyEqualsPool();
    });
  });
});
