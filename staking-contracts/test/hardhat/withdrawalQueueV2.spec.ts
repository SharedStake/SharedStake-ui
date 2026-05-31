/**
 * Unit tests for WithdrawalQueueV2:
 *   - requestWithdrawals: burns shares, creates request, assigns ID
 *   - finalize: locks ETH, sets eth amount per request
 *   - claimWithdrawal: transfers ETH, marks claimed
 *   - Replay protection (double-claim reverts)
 *   - Claim before finalize reverts
 *   - Batch operations
 *   - Access control on finalize
 *   - Invariant: sum of claimed ETH never exceeds finalized ETH provided
 */
import {ethers} from "hardhat";
import {expect} from "chai";
import {parseEther, ZeroAddress} from "ethers";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

describe("WithdrawalQueueV2", () => {
  let deployer: SignerWithAddress,
    gov: SignerWithAddress,
    oracle: SignerWithAddress,
    alice: SignerWithAddress,
    bob: SignerWithAddress;

  let stToken: any, stakingCore: any, queue: any;

  const ORACLE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ORACLE"));

  async function deployFresh() {
    [deployer, gov, oracle, alice, bob] = await ethers.getSigners();

    const StToken = await ethers.getContractFactory("StToken");
    stToken = await StToken.deploy();

    const StakingCore = await ethers.getContractFactory("StakingCore");
    stakingCore = await StakingCore.deploy(stToken.target, gov.address);
    await stToken.addMinter(stakingCore.target);

    const WithdrawalQueueV2 = await ethers.getContractFactory("WithdrawalQueueV2");
    queue = await WithdrawalQueueV2.deploy(stToken.target, gov.address);
    await queue.connect(gov).grantRole(ORACLE_ROLE, oracle.address);
    // Grant queue MINTER so it can burn shares on requestWithdrawals.
    await stToken.addMinter(queue.target);

    // Give alice and bob stTokens by depositing ETH.
    await stakingCore.connect(alice).submit(ZeroAddress, {value: parseEther("10")});
    await stakingCore.connect(bob).submit(ZeroAddress, {value: parseEther("5")});

    // Approve queue to burn alice's and bob's stTokens.
    // (burnShares is called internally by queue; queue has MINTER role)
    // But requestWithdrawals calls stToken.burnShares(msg.sender, shares)
    // where msg.sender is the queue — the queue holds MINTER, which allows burnShares on any addr.
  }

  beforeEach(deployFresh);

  // ── Request ──────────────────────────────────────────────────────────────────

  describe("requestWithdrawals()", () => {
    it("burns stToken shares and emits WithdrawalRequested", async () => {
      const sharesBefore = await stToken.sharesOf(alice.address);

      const tx = await queue.connect(alice).requestWithdrawals([parseEther("1")], alice.address);
      await tx.wait();

      const sharesAfter = await stToken.sharesOf(alice.address);
      expect(sharesAfter).to.be.lt(sharesBefore);

      await expect(tx).to.emit(queue, "WithdrawalRequested");
    });

    it("assigns sequential request IDs starting at 1", async () => {
      await queue.connect(alice).requestWithdrawals([parseEther("1")], alice.address);
      await queue.connect(alice).requestWithdrawals([parseEther("1")], alice.address);

      const req1 = await queue.getRequest(1);
      const req2 = await queue.getRequest(2);
      expect(req1.owner).to.equal(alice.address);
      expect(req2.owner).to.equal(alice.address);
      expect(await queue.nextRequestId()).to.equal(3n);
    });

    it("reverts for amount below MIN_WITHDRAWAL", async () => {
      await expect(
        queue.connect(alice).requestWithdrawals([parseEther("0.001")], alice.address)
      ).to.be.revertedWithCustomError(queue, "AmountOutOfBounds");
    });

    it("reverts for amount above MAX_WITHDRAWAL", async () => {
      await expect(
        queue.connect(alice).requestWithdrawals([parseEther("1001")], alice.address)
      ).to.be.revertedWithCustomError(queue, "AmountOutOfBounds");
    });

    it("reverts with zero owner address", async () => {
      await expect(
        queue.connect(alice).requestWithdrawals([parseEther("1")], ZeroAddress)
      ).to.be.reverted;
    });

    it("batch request: multiple amounts in one call", async () => {
      const ids = await queue.connect(alice)
        .requestWithdrawals.staticCall([parseEther("1"), parseEther("2")], alice.address);
      expect(ids.length).to.equal(2);
    });
  });

  // ── Finalize ─────────────────────────────────────────────────────────────────

  describe("finalize()", () => {
    beforeEach(async () => {
      await queue.connect(alice).requestWithdrawals([parseEther("1"), parseEther("2")], alice.address);
    });

    it("only GUARDIAN can finalize", async () => {
      await expect(
        queue.connect(alice).finalize(1, {value: parseEther("1")})
      ).to.be.reverted;
    });

    it("GUARDIAN (gov) can finalize a batch", async () => {
      await expect(
        queue.connect(gov).finalize(2, {value: parseEther("3")})
      ).to.emit(queue, "BatchFinalized");
    });

    it("finalizes correct ETH per request at 1:1 rate", async () => {
      await queue.connect(gov).finalize(2, {value: parseEther("3")});

      const req1 = await queue.getRequest(1);
      const req2 = await queue.getRequest(2);

      // ethAmount is locked at request time. At bootstrap, 1 share = 1 wei, so ethAmount ≈ stToken amount.
      expect(req1.ethAmount).to.be.closeTo(parseEther("1"), parseEther("0.001"));
      expect(req2.ethAmount).to.be.closeTo(parseEther("2"), parseEther("0.001"));
    });

    it("reverts if insufficient ETH provided", async () => {
      await expect(
        queue.connect(gov).finalize(1, {value: parseEther("0.0001")})
      ).to.be.revertedWithCustomError(queue, "InsufficientFinalizeEth");
    });

    it("returns excess ETH to caller", async () => {
      const govBefore = await ethers.provider.getBalance(gov.address);

      const tx = await queue.connect(gov).finalize(1, {value: parseEther("2")});
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const govAfter = await ethers.provider.getBalance(gov.address);
      // Gov paid ~1 ETH (finalized) + gas, got ~1 ETH back.
      // Net cost ≈ ~1 ETH + gas.
      expect(govBefore - govAfter - gasUsed).to.be.closeTo(parseEther("1"), parseEther("0.01"));
    });

    it("reverts on invalid request range", async () => {
      // nextRequestId is 3; requesting to finalize id 5 (doesn't exist) should revert.
      await expect(
        queue.connect(gov).finalize(5, {value: parseEther("5")})
      ).to.be.revertedWithCustomError(queue, "InvalidRequestRange");
    });
  });

  // ── Phase-2 mode controls ────────────────────────────────────────────────────

  describe("phase-2 bunker/turbo controls", () => {
    it("only ORACLE can update bunker mode and report timestamp", async () => {
      const ts = (await ethers.provider.getBlock("latest"))!.timestamp;

      await expect(
        queue.connect(alice).updateModeFromOracle(true, ts)
      ).to.be.reverted;

      await queue.connect(oracle).updateModeFromOracle(true, ts);
      expect(await queue.withdrawalMode()).to.equal(1n); // BUNKER
      expect(await queue.lastOracleReportTimestamp()).to.equal(BigInt(ts));
    });

    it("rejects non-monotonic oracle report timestamps", async () => {
      const ts = (await ethers.provider.getBlock("latest"))!.timestamp;
      await queue.connect(oracle).updateModeFromOracle(true, ts);

      await expect(
        queue.connect(oracle).updateModeFromOracle(false, ts)
      )
        .to.be.revertedWithCustomError(queue, "StaleReportTimestamp")
        .withArgs(ts, ts);

      await expect(
        queue.connect(oracle).updateModeFromOracle(false, ts - 1)
      )
        .to.be.revertedWithCustomError(queue, "StaleReportTimestamp")
        .withArgs(ts - 1, ts);
    });

    it("applies bunker finalize constraints (batch-size + minimum age)", async () => {
      await queue.connect(alice).requestWithdrawals(
        [parseEther("1"), parseEther("1"), parseEther("1")],
        alice.address
      );
      await queue.connect(gov).setBunkerMaxRequestsPerFinalize(2);
      await queue.connect(gov).setBunkerMinRequestAge(24 * 60 * 60);

      const ts = (await ethers.provider.getBlock("latest"))!.timestamp;
      await queue.connect(oracle).updateModeFromOracle(true, ts);

      await expect(
        queue.connect(gov).finalize(3, {value: parseEther("3")})
      ).to.be.revertedWithCustomError(queue, "BunkerBatchTooLarge");

      await expect(
        queue.connect(gov).finalize(2, {value: parseEther("2")})
      ).to.be.revertedWithCustomError(queue, "RequestTooYoung");

      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);
      const ts2 = (await ethers.provider.getBlock("latest"))!.timestamp;
      await queue.connect(oracle).updateModeFromOracle(true, ts2);

      await expect(
        queue.connect(gov).finalize(2, {value: parseEther("2")})
      ).to.emit(queue, "BatchFinalized");
    });

    it("keeps turbo mode finalize behavior unaffected", async () => {
      await queue.connect(alice).requestWithdrawals([parseEther("1"), parseEther("1")], alice.address);
      await queue.connect(gov).setBunkerMaxRequestsPerFinalize(1);
      await queue.connect(gov).setBunkerMinRequestAge(30 * 24 * 60 * 60);

      const ts = (await ethers.provider.getBlock("latest"))!.timestamp;
      await queue.connect(oracle).updateModeFromOracle(false, ts); // TURBO

      await expect(
        queue.connect(gov).finalize(2, {value: parseEther("2")})
      ).to.emit(queue, "BatchFinalized");
    });

    it("keeps claims available for already finalized requests in bunker mode", async () => {
      await queue.connect(alice).requestWithdrawals([parseEther("1")], alice.address);
      await queue.connect(gov).finalize(1, {value: parseEther("1")});

      await queue.connect(gov).setBunkerMaxRequestsPerFinalize(1);
      await queue.connect(gov).setBunkerMinRequestAge(365 * 24 * 60 * 60);
      const ts = (await ethers.provider.getBlock("latest"))!.timestamp;
      await queue.connect(oracle).updateModeFromOracle(true, ts);

      const before = await ethers.provider.getBalance(alice.address);
      await queue.connect(alice).claimWithdrawal(1, alice.address);
      const after = await ethers.provider.getBalance(alice.address);
      expect(after).to.be.gt(before);
    });
  });

  // ── Claim ────────────────────────────────────────────────────────────────────

  describe("claimWithdrawal()", () => {
    beforeEach(async () => {
      await queue.connect(alice).requestWithdrawals([parseEther("1")], alice.address);
      await queue.connect(gov).finalize(1, {value: parseEther("1")});
    });

    it("claim delivers ETH to recipient", async () => {
      const recipientBefore = await ethers.provider.getBalance(bob.address);
      await queue.connect(alice).claimWithdrawal(1, bob.address);
      const recipientAfter = await ethers.provider.getBalance(bob.address);
      expect(recipientAfter).to.be.gt(recipientBefore);
    });

    it("marks request as claimed", async () => {
      await queue.connect(alice).claimWithdrawal(1, alice.address);
      const req = await queue.getRequest(1);
      expect(req.claimed).to.be.true;
    });

    it("reverts on double-claim (replay protection)", async () => {
      await queue.connect(alice).claimWithdrawal(1, alice.address);
      await expect(
        queue.connect(alice).claimWithdrawal(1, alice.address)
      ).to.be.revertedWithCustomError(queue, "RequestAlreadyClaimed");
    });

    it("reverts when non-owner tries to claim", async () => {
      await expect(
        queue.connect(bob).claimWithdrawal(1, bob.address)
      ).to.be.revertedWithCustomError(queue, "NotRequestOwner");
    });

    it("reverts when request not yet finalized", async () => {
      await queue.connect(alice).requestWithdrawals([parseEther("1")], alice.address);
      // request 2 is not finalized
      await expect(
        queue.connect(alice).claimWithdrawal(2, alice.address)
      ).to.be.revertedWithCustomError(queue, "RequestNotFinalized");
    });
  });

  // ── Invariant: accounting soundness ──────────────────────────────────────────

  describe("Accounting invariant", () => {
    it("total ETH claimed never exceeds ETH provided in finalize", async () => {
      const amounts = [parseEther("1"), parseEther("1"), parseEther("1")];
      await queue.connect(alice).requestWithdrawals(amounts, alice.address);

      const ethProvided = parseEther("3");
      await queue.connect(gov).finalize(3, {value: ethProvided});

      let totalClaimed = 0n;
      for (let id = 1; id <= 3; id++) {
        await queue.connect(alice).claimWithdrawal(id, alice.address);
        const req = await queue.getRequest(id);
        totalClaimed += req.ethAmount;
      }

      expect(totalClaimed).to.be.lte(ethProvided);
    });
  });

  // ── Batch claim ───────────────────────────────────────────────────────────────

  describe("claimWithdrawals() batch", () => {
    it("claims multiple requests atomically", async () => {
      await queue.connect(alice).requestWithdrawals([parseEther("1"), parseEther("1")], alice.address);
      await queue.connect(gov).finalize(2, {value: parseEther("2")});

      const aliceBefore = await ethers.provider.getBalance(alice.address);
      await queue.connect(alice).claimWithdrawals([1, 2], alice.address);
      const aliceAfter = await ethers.provider.getBalance(alice.address);

      // Alice receives ~2 ETH (minus gas).
      expect(aliceAfter).to.be.gt(aliceBefore);
    });
  });
});
