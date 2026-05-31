import {ethers} from "hardhat";
import {expect} from "chai";
import {parseEther, ZeroAddress} from "ethers";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

describe("Governance + Referral hardening", () => {
  describe("ReferralCodeRegistry", () => {
    let gov: SignerWithAddress;
    let codeAdmin: SignerWithAddress;
    let referrer: SignerWithAddress;
    let outsider: SignerWithAddress;
    let registry: any;

    beforeEach(async () => {
      [, gov, codeAdmin, referrer, outsider] = await ethers.getSigners();
      const ReferralCodeRegistry = await ethers.getContractFactory("ReferralCodeRegistry");
      registry = await ReferralCodeRegistry.deploy(gov.address);
    });

    it("registers and resolves referral codes with metadata", async () => {
      const codeHash = ethers.keccak256(ethers.toUtf8Bytes("ALICE_PARTNER_CODE"));
      const metadata = ethers.keccak256(ethers.toUtf8Bytes("campaign:homepage-v2"));

      await expect(
        registry.connect(gov).registerReferralCode(codeHash, referrer.address, metadata),
      )
        .to.emit(registry, "ReferralCodeRegistered")
        .withArgs(codeHash, referrer.address, metadata);

      expect(await registry.resolveReferralCode(codeHash)).to.equal(referrer.address);
      const rec = await registry.getReferralCode(codeHash);
      expect(rec.referrer).to.equal(referrer.address);
      expect(rec.metadataHash).to.equal(metadata);
      expect(rec.exists).to.equal(true);
    });

    it("supports update and revoke with CODE_ADMIN role", async () => {
      const codeHash = ethers.keccak256(ethers.toUtf8Bytes("REF_CODE_UPDATE_TEST"));
      const metadataA = ethers.keccak256(ethers.toUtf8Bytes("campaign:a"));
      const metadataB = ethers.keccak256(ethers.toUtf8Bytes("campaign:b"));

      const codeAdminRole = await registry.CODE_ADMIN();
      await registry.connect(gov).grantRole(codeAdminRole, codeAdmin.address);

      await registry.connect(codeAdmin).registerReferralCode(codeHash, referrer.address, metadataA);

      await expect(
        registry.connect(codeAdmin).updateReferralCode(codeHash, outsider.address, metadataB),
      )
        .to.emit(registry, "ReferralCodeUpdated")
        .withArgs(codeHash, referrer.address, outsider.address, metadataB);

      expect(await registry.resolveReferralCode(codeHash)).to.equal(outsider.address);

      await expect(registry.connect(codeAdmin).revokeReferralCode(codeHash))
        .to.emit(registry, "ReferralCodeRevoked")
        .withArgs(codeHash, outsider.address, metadataB);
      expect(await registry.resolveReferralCode(codeHash)).to.equal(ZeroAddress);
    });

    it("enforces CODE_ADMIN role and revoke behavior", async () => {
      const codeHash = ethers.keccak256(ethers.toUtf8Bytes("ROLE_TEST_CODE"));
      const metadata = ethers.keccak256(ethers.toUtf8Bytes("campaign:role-test"));
      const codeAdminRole = await registry.CODE_ADMIN();

      await registry.connect(gov).grantRole(codeAdminRole, codeAdmin.address);
      await registry.connect(codeAdmin).registerReferralCode(codeHash, referrer.address, metadata);

      await registry.connect(gov).revokeRole(codeAdminRole, codeAdmin.address);
      await expect(
        registry.connect(codeAdmin).updateReferralCode(codeHash, outsider.address, metadata),
      ).to.be.reverted;

      await expect(
        registry.connect(outsider).registerReferralCode(codeHash, outsider.address, metadata),
      ).to.be.reverted;
    });
  });

  describe("ReferralRegistry", () => {
    let deployer: SignerWithAddress;
    let gov: SignerWithAddress;
    let router: SignerWithAddress;
    let feeCtl: SignerWithAddress;
    let referrer: SignerWithAddress;
    let referee: SignerWithAddress;
    let outsider: SignerWithAddress;

    let stToken: any;
    let registry: any;

    beforeEach(async () => {
      [deployer, gov, router, feeCtl, referrer, referee, outsider] = await ethers.getSigners();

      const StToken = await ethers.getContractFactory("StToken");
      stToken = await StToken.deploy();
      await stToken.addMinter(deployer.address);

      const ReferralRegistry = await ethers.getContractFactory("ReferralRegistry");
      registry = await ReferralRegistry.deploy(gov.address, stToken.target);

      await registry.connect(gov).grantRole(await registry.ROUTER(), router.address);
      await registry.connect(gov).grantRole(await registry.FEE_CTRL(), feeCtl.address);
    });

    it("records referral deposits and updates per-referrer stats", async () => {
      const amount = parseEther("5");
      const shares = parseEther("5");
      await registry.connect(router).recordDeposit(referrer.address, referee.address, amount, shares);

      const rec = await registry.getRecord(referrer.address, referee.address);
      expect(rec.totalReferredEth).to.equal(amount);
      expect(rec.totalReferredShares).to.equal(shares);
      expect(rec.firstReferralTime).to.be.gt(0n);

      const stats = await registry.getReferrerStats(referrer.address);
      expect(stats.totalReferredEth).to.equal(amount);
      expect(stats.totalReferredShares).to.equal(shares);
      expect(stats.refereeCount).to.equal(1n);
      expect(stats.rewardDebt).to.equal(0n);
    });

    it("rejects self-referral and enforces ROUTER role", async () => {
      await expect(
        registry.connect(router).recordDeposit(referrer.address, referrer.address, 1n, 1n),
      ).to.be.revertedWithCustomError(registry, "SelfReferral");

      await expect(registry.connect(outsider).recordDeposit(referrer.address, referee.address, 1n, 1n)).to.be.reverted;
    });

    it("distributes and claims referral fee shares via MasterChef-style accrual", async () => {
      // Setup: record a deposit so referrer has referred ETH
      const amount = parseEther("5");
      const shares = parseEther("5");
      await registry.connect(router).recordDeposit(referrer.address, referee.address, amount, shares);

      // Deposit fee shares
      const feeShares = parseEther("10");
      await stToken.mintShares(registry.target, feeShares);
      await stToken.setTotalPooledEther(feeShares);
      await registry.connect(feeCtl).depositReferralFeeShares(feeShares);

      // Verify pending reward
      const pending = await registry.pendingReward(referrer.address);
      expect(pending).to.equal(feeShares);

      // Claim
      const beforeShares = await stToken.sharesOf(referrer.address);
      await registry.connect(referrer).claimFees();
      const afterShares = await stToken.sharesOf(referrer.address);

      expect(afterShares - beforeShares).to.equal(feeShares);
      expect(await registry.pendingReward(referrer.address)).to.equal(0n);
    });

    it("claims exact share amount even when stToken share price is > 1", async () => {
      const amount = parseEther("5");
      const shares = parseEther("5");
      await registry.connect(router).recordDeposit(referrer.address, referee.address, amount, shares);

      const feeShares = parseEther("10");
      await stToken.mintShares(registry.target, feeShares);
      // Force a 2:1 pooled/share price to catch token-vs-share payout bugs.
      await stToken.setTotalPooledEther(parseEther("20"));
      await registry.connect(feeCtl).depositReferralFeeShares(feeShares);

      const beforeShares = await stToken.sharesOf(referrer.address);
      await registry.connect(referrer).claimFees();
      const afterShares = await stToken.sharesOf(referrer.address);

      expect(afterShares - beforeShares).to.equal(feeShares);
    });

    it("reverts claim when nothing accrued", async () => {
      await expect(registry.connect(referrer).claimFees()).to.be.revertedWithCustomError(
        registry,
        "NoFeesToClaim",
      );
    });

    it("reverts claim when min referral stake not met", async () => {
      const amount = parseEther("0.5"); // below 1 ether min
      const shares = parseEther("0.5");
      await registry.connect(router).recordDeposit(referrer.address, referee.address, amount, shares);

      const feeShares = parseEther("1");
      await stToken.mintShares(registry.target, feeShares);
      await stToken.setTotalPooledEther(feeShares);
      await registry.connect(feeCtl).depositReferralFeeShares(feeShares);

      await expect(registry.connect(referrer).claimFees()).to.be.revertedWithCustomError(
        registry,
        "MinStakeNotMet",
      );
    });

    it("enforces GOV-only fee parameter updates and cap", async () => {
      await expect(registry.connect(outsider).setReferralFeeBps(600)).to.be.reverted;

      await expect(registry.connect(gov).setReferralFeeBps(3001)).to.be.revertedWithCustomError(
        registry,
        "FeeTooHigh",
      );

      await registry.connect(gov).setReferralFeeBps(600);
      expect(await registry.referralFeeBps()).to.equal(600n);
    });

    it("blocks referee from being re-referred", async () => {
      const amount = parseEther("5");
      const shares = parseEther("5");
      await registry.connect(router).recordDeposit(referrer.address, referee.address, amount, shares);

      // Second referrer tries to refer same referee
      await registry.connect(router).recordDeposit(outsider.address, referee.address, amount, shares);
      const rec = await registry.getRecord(outsider.address, referee.address);
      expect(rec.totalReferredEth).to.equal(0n); // no-op
    });

    it("accrues repeated deposits from same referee to canonical referrer", async () => {
      const first = parseEther("5");
      const second = parseEther("3");
      const firstShares = parseEther("5");
      const secondShares = parseEther("3");

      await registry.connect(router).recordDeposit(referrer.address, referee.address, first, firstShares);
      await registry.connect(router).recordDeposit(referrer.address, referee.address, second, secondShares);

      const rec = await registry.getRecord(referrer.address, referee.address);
      expect(rec.totalReferredEth).to.equal(first + second);
      expect(rec.totalReferredShares).to.equal(firstShares + secondShares);

      const stats = await registry.getReferrerStats(referrer.address);
      expect(stats.refereeCount).to.equal(1n);
      expect(stats.totalReferredEth).to.equal(first + second);
      expect(stats.totalReferredShares).to.equal(firstShares + secondShares);
    });
  });

  describe("GovernanceTimelock", () => {
    it("sets min delay and proposer/executor roles at deploy", async () => {
      const [gov, proposer, executor] = await ethers.getSigners();
      const minDelay = 48 * 60 * 60;

      const GovernanceTimelock = await ethers.getContractFactory("GovernanceTimelock");
      const timelock = await GovernanceTimelock.deploy(minDelay, [proposer.address], [executor.address], gov.address);

      expect(await timelock.getMinDelay()).to.equal(BigInt(minDelay));
      expect(await timelock.hasRole(await timelock.PROPOSER_ROLE(), proposer.address)).to.equal(true);
      expect(await timelock.hasRole(await timelock.EXECUTOR_ROLE(), executor.address)).to.equal(true);
      expect(await timelock.hasRole(await timelock.TIMELOCK_ADMIN_ROLE(), gov.address)).to.equal(true);
    });
  });

  describe("VoteEscrowV2 hardening", () => {
    it("reverts increase_unlock_time on expired locks", async () => {
      const [holder, timelockAdmin] = await ethers.getSigners();

      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const sgt = await MockERC20.deploy("SharedStake Governance Token", "SGT");

      const VoteEscrowV2 = await ethers.getContractFactory("VoteEscrowV2");
      const voteEscrow = await VoteEscrowV2.deploy(
        "Vote Escrow SGT",
        "veSGT",
        sgt.target,
        parseEther("1"),
        timelockAdmin.address,
      );

      const lockAmount = parseEther("100");
      await sgt.mint(holder.address, lockAmount);
      await sgt.connect(holder).approve(voteEscrow.target, lockAmount);
      await voteEscrow.connect(holder).create_lock(lockAmount, 7);

      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      await expect(voteEscrow.connect(holder).increase_unlock_time(7)).to.be.revertedWithCustomError(
        voteEscrow,
        "LockExpired",
      );
    });

    it("keeps voting power aligned and increases from decayed level on extension", async () => {
      const [holder, timelockAdmin] = await ethers.getSigners();

      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const sgt = await MockERC20.deploy("SharedStake Governance Token", "SGT");

      const VoteEscrowV2 = await ethers.getContractFactory("VoteEscrowV2");
      const voteEscrow = await VoteEscrowV2.deploy(
        "Vote Escrow SGT",
        "veSGT",
        sgt.target,
        parseEther("1"),
        timelockAdmin.address,
      );

      const lockAmount = parseEther("200");
      await sgt.mint(holder.address, lockAmount);
      await sgt.connect(holder).approve(voteEscrow.target, lockAmount);
      await voteEscrow.connect(holder).create_lock(lockAmount, 30);

      await ethers.provider.send("evm_increaseTime", [5 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      await voteEscrow.checkpoint(holder.address);
      const decayedMinted = await voteEscrow.mintedForLock(holder.address);
      const decayedBalance = await voteEscrow.balanceOf(holder.address);
      expect(decayedBalance).to.equal(decayedMinted);

      await voteEscrow.connect(holder).increase_unlock_time(7);
      const afterMinted = await voteEscrow.mintedForLock(holder.address);
      const afterBalance = await voteEscrow.balanceOf(holder.address);

      expect(afterBalance).to.equal(afterMinted);
      expect(afterMinted).to.be.gt(decayedMinted);
    });

    it("burns stale voting power via permissionless checkpoint after expiry", async () => {
      const [holder, timelockAdmin] = await ethers.getSigners();

      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const sgt = await MockERC20.deploy("SharedStake Governance Token", "SGT");

      const VoteEscrowV2 = await ethers.getContractFactory("VoteEscrowV2");
      const voteEscrow = await VoteEscrowV2.deploy(
        "Vote Escrow SGT",
        "veSGT",
        sgt.target,
        parseEther("1"),
        timelockAdmin.address,
      );

      const lockAmount = parseEther("100");
      await sgt.mint(holder.address, lockAmount);
      await sgt.connect(holder).approve(voteEscrow.target, lockAmount);
      await voteEscrow.connect(holder).create_lock(lockAmount, 7);

      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      await voteEscrow.checkpoint(holder.address);
      expect(await voteEscrow.balanceOf(holder.address)).to.equal(0n);
      expect(await voteEscrow.mintedForLock(holder.address)).to.equal(0n);
    });

    it("rejects transfers of veSGT", async () => {
      const [holder, receiver, timelockAdmin] = await ethers.getSigners();

      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const sgt = await MockERC20.deploy("SharedStake Governance Token", "SGT");

      const VoteEscrowV2 = await ethers.getContractFactory("VoteEscrowV2");
      const voteEscrow = await VoteEscrowV2.deploy(
        "Vote Escrow SGT",
        "veSGT",
        sgt.target,
        parseEther("1"),
        timelockAdmin.address,
      );

      const lockAmount = parseEther("100");
      await sgt.mint(holder.address, lockAmount);
      await sgt.connect(holder).approve(voteEscrow.target, lockAmount);
      await voteEscrow.connect(holder).create_lock(lockAmount, 30);

      await expect(
        voteEscrow.connect(holder).transfer(receiver.address, 1),
      ).to.be.revertedWithCustomError(voteEscrow, "NonTransferable");
    });
  });

  describe("SharedStakeGovernor", () => {
    let gov: SignerWithAddress;
    let proposer: SignerWithAddress;
    let outsider: SignerWithAddress;

    let sgt: any;
    let voteEscrow: any;
    let timelock: any;
    let governor: any;

    async function mineBlocks(count: number): Promise<void> {
      for (let i = 0; i < count; i++) {
        await ethers.provider.send("evm_mine", []);
      }
    }

    async function mineBlocksFast(count: number): Promise<void> {
      if (count <= 0) return;
      await ethers.provider.send("hardhat_mine", [`0x${count.toString(16)}`]);
    }

    beforeEach(async () => {
      [gov, proposer, outsider] = await ethers.getSigners();

      const GovernanceTimelock = await ethers.getContractFactory("GovernanceTimelock");
      timelock = await GovernanceTimelock.deploy(48 * 60 * 60, [], [], gov.address);

      const MockERC20 = await ethers.getContractFactory("MockERC20");
      sgt = await MockERC20.deploy("SharedStake Governance Token", "SGT");

      const VoteEscrowV2 = await ethers.getContractFactory("VoteEscrowV2");
      voteEscrow = await VoteEscrowV2.deploy("Vote Escrow SGT", "veSGT", sgt.target, parseEther("1"), timelock.target);

      const SharedStakeGovernor = await ethers.getContractFactory("SharedStakeGovernor");
      governor = await SharedStakeGovernor.deploy(voteEscrow.target, timelock.target);
    });

    it("exposes expected governance parameters", async () => {
      expect(await governor.name()).to.equal("SharedStakeGovernor");
      expect(await governor.votingDelay()).to.equal(7200n);
      expect(await governor.votingPeriod()).to.equal(40320n);
      expect(await governor.proposalThreshold()).to.equal(parseEther("1000"));
      expect(await governor.quorumNumerator()).to.equal(4n);
    });

    it("enforces proposal threshold via delegated veSGT voting power", async () => {
      const targets = [ZeroAddress];
      const values = [0n];
      const calldatas = ["0x"];
      const description = "test proposal";

      await expect(governor.connect(outsider).propose(targets, values, calldatas, description)).to.be.reverted;

      const lockAmount = parseEther("2000");
      await sgt.mint(proposer.address, lockAmount);
      await sgt.connect(proposer).approve(voteEscrow.target, lockAmount);
      await voteEscrow.connect(proposer).create_lock(lockAmount, 1095);
      await voteEscrow.connect(proposer).delegate(proposer.address);
      await mineBlocks(2);

      await expect(governor.connect(proposer).propose(targets, values, calldatas, description)).to.not.be.reverted;
    });

    it("runs propose -> vote -> queue -> execute through timelock", async () => {
      const minDelay = 48 * 60 * 60;
      await timelock.connect(gov).grantRole(await timelock.PROPOSER_ROLE(), governor.target);
      await timelock.connect(gov).grantRole(await timelock.EXECUTOR_ROLE(), governor.target);

      const lockAmount = parseEther("2000");
      await sgt.mint(proposer.address, lockAmount);
      await sgt.connect(proposer).approve(voteEscrow.target, lockAmount);
      await voteEscrow.connect(proposer).create_lock(lockAmount, 1095);
      await voteEscrow.connect(proposer).delegate(proposer.address);
      await mineBlocks(2);

      const newMinLockedAmount = parseEther("2");
      const targets = [voteEscrow.target];
      const values = [0n];
      const calldatas = [voteEscrow.interface.encodeFunctionData("setMinLockedAmount", [newMinLockedAmount])];
      const description = "Governance: raise minimum lock amount";
      const descriptionHash = ethers.id(description);

      const proposalId = await governor.connect(proposer).propose.staticCall(targets, values, calldatas, description);
      await governor.connect(proposer).propose(targets, values, calldatas, description);

      await mineBlocksFast(Number(await governor.votingDelay()) + 1);
      await governor.connect(proposer).castVote(proposalId, 1); // 1 = For
      await mineBlocksFast(Number(await governor.votingPeriod()) + 1);

      await governor.connect(proposer).queue(targets, values, calldatas, descriptionHash);

      await expect(governor.connect(proposer).execute(targets, values, calldatas, descriptionHash)).to.be.reverted;
      expect(await voteEscrow.minLockedAmount()).to.equal(parseEther("1"));

      await ethers.provider.send("evm_increaseTime", [minDelay + 1]);
      await ethers.provider.send("evm_mine", []);
      await governor.connect(proposer).execute(targets, values, calldatas, descriptionHash);

      expect(await voteEscrow.minLockedAmount()).to.equal(newMinLockedAmount);
    });
  });
});
