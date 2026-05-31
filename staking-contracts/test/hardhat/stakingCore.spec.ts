/**
 * Unit tests for StakingCore:
 *   - Deposit happy path (shares minted, pool updated, event emitted)
 *   - Share accounting accuracy
 *   - Pause guard on submit
 *   - Oracle beacon report: rebase, fee distribution
 *   - Access control on all privileged functions
 */
import {ethers, deployments} from "hardhat";
import {expect} from "chai";
import {parseEther, ZeroAddress} from "ethers";
import {anyValue} from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

describe("StakingCore", () => {
  let deployer: SignerWithAddress,
    gov: SignerWithAddress,
    alice: SignerWithAddress,
    bob: SignerWithAddress,
    oracle: SignerWithAddress;

  let stToken: any, stakingCore: any, feeController: any;

  const GOV_ROLE = ethers.keccak256(ethers.toUtf8Bytes("GOV"));
  const ORACLE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ORACLE"));
  const GUARDIAN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("GUARDIAN"));
const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER"));
const REFERRAL_CODE_A = ethers.keccak256(ethers.toUtf8Bytes("CORE_REFERRAL_CODE_A"));
const REFERRAL_CODE_MISSING = ethers.keccak256(ethers.toUtf8Bytes("CORE_REFERRAL_CODE_MISSING"));

  async function deployFresh() {
    [deployer, gov, alice, bob, oracle] = await ethers.getSigners();

    const StToken = await ethers.getContractFactory("StToken");
    stToken = await StToken.deploy();

    const FeeController = await ethers.getContractFactory("FeeController");
    feeController = await FeeController.deploy(
      gov.address,          // gov
      gov.address,          // treasury
      deployer.address,     // operator
      ZeroAddress,          // referral registry (unused in this suite)
      ZeroAddress,          // debt pool (disabled)
      1000,                 // feeBps: 10%
      5000,                 // treasurySplitBps: 50%
      5000,                 // operatorSplitBps: 50%
      0                     // debtPoolSplitBps: 0% (disabled)
    );

    const StakingCore = await ethers.getContractFactory("StakingCore");
    stakingCore = await StakingCore.deploy(stToken.target, gov.address);

    // Grant StakingCore MINTER on StToken.
    await stToken.addMinter(stakingCore.target);

    // Set fee controller (requires GOV role).
    await stakingCore.connect(gov).setFeeController(feeController.target);

    // Grant oracle role.
    await stakingCore.connect(gov).grantRole(ORACLE_ROLE, oracle.address);
  }

  beforeEach(deployFresh);

  // ── Deposits ────────────────────────────────────────────────────────────────

  describe("submit()", () => {
    async function wireReferralCodePath(referrerAddress: string) {
      const ReferralRegistry = await ethers.getContractFactory("ReferralRegistry");
      const referralRegistry = await ReferralRegistry.deploy(gov.address, stToken.target);
      await referralRegistry.connect(gov).grantRole(await referralRegistry.ROUTER(), stakingCore.target);
      await feeController.connect(gov).setRecipients(gov.address, deployer.address, referralRegistry.target, ZeroAddress);

      const ReferralCodeRegistry = await ethers.getContractFactory("ReferralCodeRegistry");
      const referralCodeRegistry = await ReferralCodeRegistry.deploy(gov.address);
      await referralCodeRegistry.connect(gov).registerReferralCode(
        REFERRAL_CODE_A,
        referrerAddress,
        ethers.keccak256(ethers.toUtf8Bytes("campaign:core-test")),
      );
      await stakingCore.connect(gov).setReferralCodeRegistry(referralCodeRegistry.target);

      return {referralRegistry, referralCodeRegistry};
    }

    it("submitWithAttribution mints shares and emits attribution telemetry", async () => {
      const amount = parseEther("1");
      const sourceId = ethers.encodeBytes32String("homepage-banner-v2");

      await expect(
        stakingCore.connect(alice).submitWithAttribution(bob.address, sourceId, {value: amount})
      )
        .to.emit(stakingCore, "SubmittedWithAttribution")
        .withArgs(alice.address, bob.address, sourceId, amount, amount);

      expect(await stToken.sharesOf(alice.address)).to.equal(amount);
      expect(await stToken.totalPooledEther()).to.equal(amount);
    });

    it("submitWithReferralCode resolves code on-chain and records canonical referrer", async () => {
      const amount = parseEther("1");
      const {referralRegistry} = await wireReferralCodePath(bob.address);

      await expect(stakingCore.connect(alice).submitWithReferralCode(REFERRAL_CODE_A, {value: amount}))
        .to.emit(stakingCore, "Submitted")
        .withArgs(alice.address, amount, bob.address, amount);

      expect(await referralRegistry.referrerOf(alice.address)).to.equal(bob.address);
    });

    it("submitWithReferralCode falls back to zero referral when resolver is unset", async () => {
      const amount = parseEther("1");
      await expect(stakingCore.connect(alice).submitWithReferralCode(REFERRAL_CODE_A, {value: amount}))
        .to.emit(stakingCore, "Submitted")
        .withArgs(alice.address, amount, ZeroAddress, amount);
    });

    it("submitWithReferralCode falls back to zero referral when code is not registered", async () => {
      const amount = parseEther("1");
      await wireReferralCodePath(bob.address);
      await expect(stakingCore.connect(alice).submitWithReferralCode(REFERRAL_CODE_MISSING, {value: amount}))
        .to.emit(stakingCore, "Submitted")
        .withArgs(alice.address, amount, ZeroAddress, amount);
    });

    it("submitWithReferralCode falls back to zero referral when resolver reverts", async () => {
      const amount = parseEther("1");
      const RevertingResolver = await ethers.getContractFactory("RevertingReferralCodeRegistry");
      const revertingResolver = await RevertingResolver.deploy();
      await stakingCore.connect(gov).setReferralCodeRegistry(revertingResolver.target);

      await expect(stakingCore.connect(alice).submitWithReferralCode(REFERRAL_CODE_A, {value: amount}))
        .to.emit(stakingCore, "Submitted")
        .withArgs(alice.address, amount, ZeroAddress, amount);
    });

    it("submitWithCodeAttribution emits attribution with resolved referral", async () => {
      const amount = parseEther("1");
      const sourceId = ethers.encodeBytes32String("core-ref-code-src");
      await wireReferralCodePath(bob.address);

      await expect(stakingCore.connect(alice).submitWithCodeAttribution(REFERRAL_CODE_A, sourceId, {value: amount}))
        .to.emit(stakingCore, "SubmittedWithAttribution")
        .withArgs(alice.address, bob.address, sourceId, amount, amount);
    });

    it("mints 1:1 shares on first deposit (bootstrap)", async () => {
      const depositAmount = parseEther("1");
      await stakingCore.connect(alice).submit(ZeroAddress, {value: depositAmount});

      const aliceShares = await stToken.sharesOf(alice.address);
      expect(aliceShares).to.equal(depositAmount);
      expect(await stToken.totalPooledEther()).to.equal(depositAmount);
    });

    it("emits Submitted event with correct args", async () => {
      const amount = parseEther("2");
      await expect(
        stakingCore.connect(alice).submit(bob.address, {value: amount})
      )
        .to.emit(stakingCore, "Submitted")
        .withArgs(alice.address, amount, bob.address, amount); // 1:1 on bootstrap
    });

    it("submit() remains unchanged and does not emit attribution telemetry", async () => {
      const amount = parseEther("1");
      await expect(
        stakingCore.connect(alice).submit(bob.address, {value: amount})
      )
        .to.emit(stakingCore, "Submitted")
        .withArgs(alice.address, amount, bob.address, amount);

      await expect(
        stakingCore.connect(alice).submit(bob.address, {value: amount})
      ).to.not.emit(stakingCore, "SubmittedWithAttribution");
    });

    it("subsequent deposits get proportional shares", async () => {
      // Alice deposits 1 ETH (bootstrap: 1e18 shares, 1 ETH pool).
      await stakingCore.connect(alice).submit(ZeroAddress, {value: parseEther("1")});

      // Simulate 10% reward (pool grows to 1.1 ETH, shares still 1e18).
      await stakingCore.connect(oracle).reportBeacon(0, 0); // no beacon validators yet
      // Manually rebase pool for test: oracle would normally do this.
      // For this test, use oracle to set beaconBalance = 0.1 ETH extra.
      // We need to call reportBeacon with correct args... let's adjust pool via oracle.
      // Actually, since no validators are staked, beacon balance stays 0.
      // Let's use a direct pool adjustment via stToken (MINTER is stakingCore only).
      // We'll test reward accounting separately; here focus on share proportionality.

      // Bob deposits at 1:1 (since beaconBalance == 0, pool == buffered == 1 ETH).
      await stakingCore.connect(bob).submit(ZeroAddress, {value: parseEther("1")});

      const aliceShares = await stToken.sharesOf(alice.address);
      const bobShares = await stToken.sharesOf(bob.address);
      expect(aliceShares).to.equal(bobShares); // equal deposits => equal shares
    });

    it("reverts when msg.value == 0", async () => {
      await expect(
        stakingCore.connect(alice).submit(ZeroAddress, {value: 0})
      ).to.be.reverted;
    });

    it("plain ETH transfer reverts when msg.value == 0", async () => {
      await expect(
        alice.sendTransaction({to: stakingCore.target, value: 0})
      ).to.be.reverted;
    });
  });

  // ── Pause ────────────────────────────────────────────────────────────────────

  describe("pause/unpause", () => {
    it("GUARDIAN can pause submit", async () => {
      await stakingCore.connect(gov).pause(0); // PAUSE_SUBMIT = 0
      await expect(
        stakingCore.connect(alice).submit(ZeroAddress, {value: parseEther("1")})
      ).to.be.reverted;
    });

    it("paused submit also blocks plain ETH transfers", async () => {
      await stakingCore.connect(gov).pause(0);
      await expect(
        alice.sendTransaction({to: stakingCore.target, value: parseEther("1")})
      ).to.be.reverted;
    });

    it("GOV can unpause", async () => {
      await stakingCore.connect(gov).pause(0);
      await stakingCore.connect(gov).unpause(0);
      // Should succeed now.
      await expect(
        stakingCore.connect(alice).submit(ZeroAddress, {value: parseEther("1")})
      ).to.not.be.reverted;
    });

    it("non-GUARDIAN cannot pause", async () => {
      await expect(
        stakingCore.connect(alice).pause(0)
      ).to.be.reverted;
    });
  });

  // ── Oracle reporting ──────────────────────────────────────────────────────────

  describe("reportBeacon()", () => {
    beforeEach(async () => {
      // Alice deposits 10 ETH.
      await stakingCore.connect(alice).submit(ZeroAddress, {value: parseEther("10")});
    });

    it("only ORACLE role can call reportBeacon", async () => {
      await expect(
        stakingCore.connect(alice).reportBeacon(0, 0)
      ).to.be.reverted;
    });

    it("reward rebase: beacon balance increases totalPooledEther", async () => {
      const preTotalPooled = await stToken.totalPooledEther();
      await stakingCore.connect(gov).notifyBeaconDeposit(parseEther("10"));
      // Report 10.5 ETH in beacon (0.5 ETH reward on 10 ETH principal baseline).
      await stakingCore.connect(oracle).reportBeacon(1, parseEther("10.5"));
      const postTotalPooled = await stToken.totalPooledEther();
      // Rewards = 0.5 ETH, fee = 10% = 0.05 ETH minted to treasury/operator.
      // Pool stays at 10.5 because fees are captured via share dilution,
      // not by increasing totalPooledEther beyond actual ETH backing.
      expect(preTotalPooled).to.equal(parseEther("10"));
      expect(postTotalPooled).to.equal(parseEther("10.5"));
    });

    it("fee shares are minted on positive rewards", async () => {
      const govSharesBefore = await stToken.sharesOf(gov.address);
      const deployerSharesBefore = await stToken.sharesOf(deployer.address);

      await stakingCore.connect(gov).notifyBeaconDeposit(parseEther("10"));
      await stakingCore.connect(oracle).reportBeacon(1, parseEther("10.5"));

      const govSharesAfter = await stToken.sharesOf(gov.address);
      const deployerSharesAfter = await stToken.sharesOf(deployer.address);

      // Both treasury (gov) and operator (deployer) receive fee shares.
      expect(govSharesAfter).to.be.gt(govSharesBefore);
      expect(deployerSharesAfter).to.be.gt(deployerSharesBefore);
    });

    it("emits fee-routing telemetry on positive rewards", async () => {
      await stakingCore.connect(gov).notifyBeaconDeposit(parseEther("10"));
      await expect(
        stakingCore.connect(oracle).reportBeacon(1, parseEther("10.5"))
      )
        .to.emit(stakingCore, "FeeRoutingTelemetry")
        .withArgs(
          parseEther("0.5"),
          parseEther("0.05"),
          gov.address,
          parseEther("0.025"),
          anyValue,
          deployer.address,
          parseEther("0.025"),
          anyValue,
        );
    });

    it("slash: beacon balance decrease does not mint fees", async () => {
      await stakingCore.connect(gov).notifyBeaconDeposit(parseEther("10"));
      // First report: no rewards.
      await stakingCore.connect(oracle).reportBeacon(1, parseEther("10"));
      const govSharesAfter1st = await stToken.sharesOf(gov.address);

      // Second report: slash (balance falls).
      await stakingCore.connect(oracle).reportBeacon(1, parseEther("9.5"));
      const govSharesAfter2nd = await stToken.sharesOf(gov.address);

      expect(govSharesAfter2nd).to.equal(govSharesAfter1st); // no new fees on slash
    });

    it("reverts on implausibly large beacon balance", async () => {
      await stakingCore.connect(gov).notifyBeaconDeposit(parseEther("10"));
      // First establish validators.
      await stakingCore.connect(oracle).reportBeacon(1, parseEther("10"));
      // Now report 100× the max plausible.
      await expect(
        stakingCore.connect(oracle).reportBeacon(1, parseEther("6500"))
      ).to.be.revertedWithCustomError(stakingCore, "BeaconBalanceSanityFailed");
    });

    it("reverts when positive report arrives before beacon baseline initialization", async () => {
      await expect(
        stakingCore.connect(oracle).reportBeacon(1, parseEther("10.5"))
      ).to.be.revertedWithCustomError(stakingCore, "BeaconBaselineNotInitialized");
    });

    it("rejects impossible report tuple (0 validators with non-zero balance)", async () => {
      await expect(
        stakingCore.connect(oracle).reportBeacon(0, parseEther("1"))
      ).to.be.revertedWithCustomError(stakingCore, "InvalidBeaconReportTuple");
    });

    it("reverts when baseline notification exceeds buffered ETH", async () => {
      await expect(
        stakingCore.connect(gov).notifyBeaconDeposit(parseEther("10.1"))
      ).to.be.revertedWithCustomError(stakingCore, "BeaconDepositExceedsBuffered");
    });

    it("routes referral fee shares to treasury when referral registry has no referees", async () => {
      const ReferralRegistry = await ethers.getContractFactory("ReferralRegistry");
      const registry = await ReferralRegistry.deploy(gov.address, stToken.target);
      await registry.connect(gov).grantRole(await registry.FEE_CTRL(), stakingCore.target);

      await feeController.connect(gov).setFee(1000, 4000, 4000, 0);
      await feeController.connect(gov).setRecipients(gov.address, deployer.address, registry.target, ZeroAddress);

      await stakingCore.connect(gov).notifyBeaconDeposit(parseEther("10"));

      const treasuryBefore = await stToken.sharesOf(gov.address);
      const operatorBefore = await stToken.sharesOf(deployer.address);
      const registryBefore = await stToken.sharesOf(registry.target);

      await expect(
        stakingCore.connect(oracle).reportBeacon(1, parseEther("10.5"))
      ).to.not.be.reverted;

      const treasuryAfter = await stToken.sharesOf(gov.address);
      const operatorAfter = await stToken.sharesOf(deployer.address);
      const registryAfter = await stToken.sharesOf(registry.target);

      expect(registryAfter - registryBefore).to.equal(0n);
      expect(treasuryAfter - treasuryBefore).to.be.gt(operatorAfter - operatorBefore);
    });

    it("subtracts withdrawal queue lockedEther from totalPooledEther", async () => {
      const MockWithdrawalQueue = await ethers.getContractFactory("MockWithdrawalQueue");
      const mockQueue = await MockWithdrawalQueue.deploy(parseEther("2"));

      await stakingCore.connect(gov).setWithdrawalQueue(mockQueue.target);

      await stakingCore.connect(gov).notifyBeaconDeposit(parseEther("10"));

      // Report 10.5 ETH in beacon (0.5 ETH reward)
      // Without queue: totalPooled = 0 (buffered) + 10.5 (beacon) = 10.5
      // With queue locked 2 ETH: totalPooled = 0 + 10.5 - 2 = 8.5
      await stakingCore.connect(oracle).reportBeacon(1, parseEther("10.5"));

      const postTotalPooled = await stToken.totalPooledEther();
      expect(postTotalPooled).to.equal(parseEther("8.5"));
    });

    it("works correctly when withdrawal queue is not set (address 0)", async () => {
      // withdrawalQueue defaults to address(0), so _queueLockedEther() returns 0
      await stakingCore.connect(gov).notifyBeaconDeposit(parseEther("10"));

      await stakingCore.connect(oracle).reportBeacon(1, parseEther("10.5"));

      const postTotalPooled = await stToken.totalPooledEther();
      // Should be 10.5 since no queue locked ether to subtract
      expect(postTotalPooled).to.equal(parseEther("10.5"));
    });
  });

  // ── Access control matrix ─────────────────────────────────────────────────────

  describe("Access control", () => {
    it("random address cannot call setFeeController", async () => {
      await expect(
        stakingCore.connect(alice).setFeeController(ZeroAddress)
      ).to.be.reverted;
    });

    it("random address cannot call grantRole", async () => {
      await expect(
        stakingCore.connect(alice).grantRole(ORACLE_ROLE, alice.address)
      ).to.be.reverted;
    });

    it("random address cannot call setReferralCodeRegistry", async () => {
      const ReferralCodeRegistry = await ethers.getContractFactory("ReferralCodeRegistry");
      const referralCodeRegistry = await ReferralCodeRegistry.deploy(gov.address);
      await expect(
        stakingCore.connect(alice).setReferralCodeRegistry(referralCodeRegistry.target),
      ).to.be.reverted;
    });

    it("random address cannot call setWithdrawalQueue", async () => {
      await expect(
        stakingCore.connect(alice).setWithdrawalQueue(alice.address)
      ).to.be.reverted;
    });

    it("random address cannot call enableRouterMode", async () => {
      await expect(
        stakingCore.connect(alice).enableRouterMode(stakingCore.target)
      ).to.be.reverted;
    });
  });

  // ── Router mode mutual exclusivity ─────────────────────────────────────────────

  describe("Router mode", () => {
    // Use stakingCore itself as the mock router — it is a contract and already
    // holds MINTER on stToken, satisfying enableRouterMode's validation.
    it("GOV can enable router mode", async () => {
      await expect(stakingCore.connect(gov).enableRouterMode(stakingCore.target))
        .to.emit(stakingCore, "RouterModeEnabled")
        .withArgs(stakingCore.target);
      expect(await stakingCore.routerMode()).to.equal(true);
    });

    it("router mode cannot be enabled twice", async () => {
      await stakingCore.connect(gov).enableRouterMode(stakingCore.target);

      await expect(
        stakingCore.connect(gov).enableRouterMode(stakingCore.target)
      ).to.be.revertedWithCustomError(stakingCore, "RouterModeAlreadyEnabled");
    });

    it("submit reverts when router mode is enabled", async () => {
      await stakingCore.connect(gov).enableRouterMode(stakingCore.target);

      await expect(
        stakingCore.connect(alice).submit(ZeroAddress, {value: parseEther("1")})
      ).to.be.revertedWithCustomError(stakingCore, "RouterModeDisabled");
    });

    it("reportBeacon reverts when router mode is enabled", async () => {
      await stakingCore.connect(gov).enableRouterMode(stakingCore.target);

      await expect(
        stakingCore.connect(oracle).reportBeacon(1, parseEther("10"))
      ).to.be.revertedWithCustomError(stakingCore, "RouterModeDisabled");
    });

    it("notifyBeaconDeposit reverts when router mode is enabled", async () => {
      await stakingCore.connect(gov).enableRouterMode(stakingCore.target);

      await expect(
        stakingCore.connect(gov).notifyBeaconDeposit(parseEther("1"))
      ).to.be.revertedWithCustomError(stakingCore, "RouterModeDisabled");
    });
  });
});
