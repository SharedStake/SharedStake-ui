import {ethers} from "hardhat";
import {expect} from "chai";
import {parseEther} from "ethers";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

describe("OldVeth2WithdrawalQueue", () => {
  let deployer: SignerWithAddress,
    gov: SignerWithAddress,
    guardian: SignerWithAddress,
    alice: SignerWithAddress,
    bob: SignerWithAddress;

  let vEth2: any, queue: any;

  const REDEMPTION_RATE = parseEther("1.1");
  const GUARDIAN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("GUARDIAN"));

  async function deployFresh() {
    [deployer, gov, guardian, alice, bob] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    vEth2 = await MockERC20.deploy("Mock old vEth2", "mvETH2");

    const OldVeth2WithdrawalQueue = await ethers.getContractFactory("OldVeth2WithdrawalQueue");
    queue = await OldVeth2WithdrawalQueue.deploy(vEth2.target, REDEMPTION_RATE, gov.address);
    await queue.connect(gov).grantRole(GUARDIAN_ROLE, guardian.address);

    await vEth2.mint(alice.address, parseEther("20"));
    await vEth2.mint(bob.address, parseEther("20"));
    await vEth2.connect(alice).approve(queue.target, parseEther("20"));
    await vEth2.connect(bob).approve(queue.target, parseEther("20"));
  }

  beforeEach(deployFresh);

  describe("requestWithdrawals()", () => {
    it("escrows vEth2, quotes ETH at the current redemption rate, and assigns FIFO IDs", async () => {
      const tx = await queue.connect(alice).requestWithdrawal(parseEther("1"));

      await expect(tx)
        .to.emit(queue, "WithdrawalRequested")
        .withArgs(alice.address, alice.address, 1, parseEther("1"), parseEther("1.1"));

      const req = await queue.getRequest(1);
      expect(req.owner).to.equal(alice.address);
      expect(req.vEth2Amount).to.equal(parseEther("1"));
      expect(req.ethAmount).to.equal(parseEther("1.1"));
      expect(await queue.nextRequestId()).to.equal(2n);
      expect(await queue.pendingVeth2()).to.equal(parseEther("1"));
      expect(await vEth2.balanceOf(queue.target)).to.equal(parseEther("1"));
    });

    it("supports batch requests with sequential IDs", async () => {
      const ids = await queue.connect(alice).requestWithdrawals.staticCall([parseEther("1"), parseEther("2")]);
      expect(ids).to.deep.equal([1n, 2n]);

      await queue.connect(alice).requestWithdrawals([parseEther("1"), parseEther("2")]);
      expect(await queue.nextRequestId()).to.equal(3n);
      expect(await queue.pendingVeth2()).to.equal(parseEther("3"));
    });

    it("reverts for empty batches and out-of-bounds amounts", async () => {
      await expect(queue.connect(alice).requestWithdrawals([])).to.be.revertedWithCustomError(queue, "InvalidAmount");

      await expect(queue.connect(alice).requestWithdrawal(parseEther("0.001")))
        .to.be.revertedWithCustomError(queue, "AmountOutOfBounds")
        .withArgs(parseEther("0.001"));
    });

    it("locks each request price at request time even if governance updates the rate later", async () => {
      await queue.connect(alice).requestWithdrawal(parseEther("1"));
      await expect(queue.connect(gov).setRedemptionRate(parseEther("0.9")))
        .to.emit(queue, "RedemptionRateUpdated")
        .withArgs(parseEther("1.1"), parseEther("0.9"));
      await queue.connect(alice).requestWithdrawal(parseEther("1"));

      expect((await queue.getRequest(1)).ethAmount).to.equal(parseEther("1.1"));
      expect((await queue.getRequest(2)).ethAmount).to.equal(parseEther("0.9"));
    });
  });

  describe("finalize()", () => {
    beforeEach(async () => {
      await queue.connect(alice).requestWithdrawal(parseEther("1"));
      await queue.connect(bob).requestWithdrawal(parseEther("2"));
    });

    it("only GUARDIAN finalizes and finalizes strictly from the FIFO head", async () => {
      await expect(queue.connect(alice).finalize(1, {value: parseEther("1.1")})).to.be.reverted;

      await expect(queue.connect(guardian).finalize(2, {value: parseEther("3.3")}))
        .to.emit(queue, "BatchFinalized")
        .withArgs(1, 2, parseEther("3.3"));

      expect(await queue.lastFinalizedRequestId()).to.equal(2n);
      expect(await queue.lockedEther()).to.equal(parseEther("3.3"));
      expect(await queue.pendingVeth2()).to.equal(0n);
      expect((await queue.getRequest(1)).finalized).to.equal(true);
      expect((await queue.getRequest(2)).finalized).to.equal(true);
    });

    it("reverts for invalid ranges, oversized batches, young requests, and insufficient ETH", async () => {
      await expect(queue.connect(guardian).finalize(3, {value: parseEther("3.3")})).to.be.revertedWithCustomError(
        queue,
        "InvalidRequestRange",
      );

      await queue.connect(gov).setFinalizeLimits(1, 0);
      await expect(queue.connect(guardian).finalize(2, {value: parseEther("3.3")}))
        .to.be.revertedWithCustomError(queue, "FinalizeBatchTooLarge")
        .withArgs(2, 1);

      await queue.connect(gov).setFinalizeLimits(128, 1_000);
      await expect(queue.connect(guardian).finalize(1, {value: parseEther("1.1")})).to.be.revertedWithCustomError(
        queue,
        "RequestTooYoung",
      );

      await queue.connect(gov).setFinalizeLimits(128, 0);
      await expect(queue.connect(guardian).finalize(1, {value: parseEther("1")})).to.be.revertedWithCustomError(
        queue,
        "InsufficientFinalizeEth",
      );
    });

    it("records excess finalize ETH as a pull refund", async () => {
      await queue.connect(guardian).finalize(1, {value: parseEther("2")});
      expect(await queue.pendingRefunds(guardian.address)).to.equal(parseEther("0.9"));
      expect(await queue.totalPendingRefunds()).to.equal(parseEther("0.9"));

      await expect(queue.connect(gov).recoverEth(gov.address, parseEther("0.1"))).to.be.revertedWithCustomError(
        queue,
        "InsufficientBalance",
      );

      const before = await ethers.provider.getBalance(queue.target);
      await queue.connect(guardian).withdrawRefund();
      expect(await ethers.provider.getBalance(queue.target)).to.equal(before - parseEther("0.9"));
      expect(await queue.pendingRefunds(guardian.address)).to.equal(0n);
      expect(await queue.totalPendingRefunds()).to.equal(0n);
    });
  });

  describe("cancelWithdrawal()", () => {
    it("lets the request owner cancel before finalization and allows finalization to advance over canceled IDs", async () => {
      await queue.connect(alice).requestWithdrawal(parseEther("1"));

      await expect(queue.connect(bob).cancelWithdrawal(1))
        .to.be.revertedWithCustomError(queue, "NotRequestOwner")
        .withArgs(1, bob.address);

      await expect(queue.connect(alice).cancelWithdrawal(1))
        .to.emit(queue, "WithdrawalCanceled")
        .withArgs(alice.address, alice.address, 1, parseEther("1"));

      expect(await queue.pendingVeth2()).to.equal(0n);
      expect(await vEth2.balanceOf(alice.address)).to.equal(parseEther("20"));

      await expect(queue.connect(guardian).finalize(1, {value: 0}))
        .to.emit(queue, "BatchFinalized")
        .withArgs(1, 1, 0);

      await expect(queue.connect(alice).claimWithdrawal(1)).to.be.revertedWithCustomError(queue, "RequestCanceled");
    });

    it("does not allow canceling finalized requests", async () => {
      await queue.connect(alice).requestWithdrawal(parseEther("1"));
      await queue.connect(guardian).finalize(1, {value: parseEther("1.1")});

      await expect(queue.connect(alice).cancelWithdrawal(1)).to.be.revertedWithCustomError(
        queue,
        "RequestAlreadyFinalized",
      );
    });
  });

  describe("claimWithdrawal()", () => {
    beforeEach(async () => {
      await queue.connect(alice).requestWithdrawal(parseEther("1"));
      await queue.connect(guardian).finalize(1, {value: parseEther("1.1")});
    });

    it("claims finalized ETH only to the request owner and prevents double-claims", async () => {
      await expect(queue.connect(alice).claimWithdrawal(1))
        .to.emit(queue, "WithdrawalClaimed")
        .withArgs(alice.address, alice.address, 1, parseEther("1.1"));

      expect(await queue.lockedEther()).to.equal(0n);
      expect((await queue.getRequest(1)).claimed).to.equal(true);

      await expect(queue.connect(alice).claimWithdrawal(1)).to.be.revertedWithCustomError(
        queue,
        "RequestAlreadyClaimed",
      );
    });

    it("reverts for non-owner claims and claims before finalization", async () => {
      await expect(queue.connect(bob).claimWithdrawal(1))
        .to.be.revertedWithCustomError(queue, "NotRequestOwner")
        .withArgs(1, bob.address);

      await queue.connect(alice).requestWithdrawal(parseEther("1"));
      await expect(queue.connect(alice).claimWithdrawal(2)).to.be.revertedWithCustomError(queue, "RequestNotFinalized");
    });

    it("batch-claims atomically and reverts duplicate request IDs", async () => {
      await queue.connect(alice).requestWithdrawal(parseEther("1"));
      await queue.connect(guardian).finalize(2, {value: parseEther("1.1")});

      await expect(queue.connect(alice).claimWithdrawals([1, 1])).to.be.revertedWithCustomError(
        queue,
        "RequestAlreadyClaimed",
      );

      await queue.connect(alice).claimWithdrawals([1, 2]);
      expect(await queue.lockedEther()).to.equal(0n);
    });
  });

  describe("governance controls and recoveries", () => {
    it("gates settings and pause controls behind GOV", async () => {
      await expect(queue.connect(alice).setRequestLimits(parseEther("1"), parseEther("2"))).to.be.reverted;

      await expect(queue.connect(gov).setRequestLimits(parseEther("1"), parseEther("5")))
        .to.emit(queue, "RequestLimitsUpdated")
        .withArgs(parseEther("1"), parseEther("5"));

      const pauseRequests = await queue.PAUSE_REQUESTS();
      await queue.connect(gov).togglePause(pauseRequests);
      await expect(queue.connect(alice).requestWithdrawal(parseEther("1"))).to.be.revertedWithCustomError(
        queue,
        "IsPaused",
      );
    });

    it("protects locked ETH and unfinalized vEth2 from recovery", async () => {
      await queue.connect(alice).requestWithdrawal(parseEther("1"));

      await expect(queue.connect(gov).recoverRedeemedVeth2(gov.address, parseEther("1"))).to.be.revertedWithCustomError(
        queue,
        "InsufficientBalance",
      );

      await queue.connect(guardian).finalize(1, {value: parseEther("1.1")});

      await expect(queue.connect(gov).recoverEth(gov.address, parseEther("0.1"))).to.be.revertedWithCustomError(
        queue,
        "InsufficientBalance",
      );

      await queue.connect(gov).recoverRedeemedVeth2(gov.address, parseEther("1"));
      expect(await vEth2.balanceOf(gov.address)).to.equal(parseEther("1"));

      await deployer.sendTransaction({to: queue.target, value: parseEther("0.2")});
      await queue.connect(gov).recoverEth(gov.address, parseEther("0.2"));
      expect(await queue.availableEther()).to.equal(0n);
    });
  });
});
