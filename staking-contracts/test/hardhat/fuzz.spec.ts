import {ethers} from "hardhat";
import {expect} from "chai";
import {parseEther, ZeroAddress} from "ethers";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Fuzz-style invariant tests for modular-staking contracts.
 * Uses multiple edge-case values to probe invariants rather than
 * true property-based random generation (which is better suited
 * to Foundry/Crytic for stateful EVM contracts).
 */
describe("ModularStaking Fuzz / Invariants", () => {
  let deployer: SignerWithAddress, gov: SignerWithAddress, alice: SignerWithAddress, bob: SignerWithAddress;
  let stToken: any, stakingCore: any, feeController: any, queue: any;

  async function deployFresh() {
    [deployer, gov, alice, bob] = await ethers.getSigners();

    const StToken = await ethers.getContractFactory("StToken");
    stToken = await StToken.deploy();

    const FeeController = await ethers.getContractFactory("FeeController");
    feeController = await FeeController.deploy(gov.address, gov.address, deployer.address, ZeroAddress, ZeroAddress, 1000, 5000, 5000, 0);

    const StakingCore = await ethers.getContractFactory("StakingCore");
    stakingCore = await StakingCore.deploy(stToken.target, gov.address);

    const WithdrawalQueueV2 = await ethers.getContractFactory("WithdrawalQueueV2");
    queue = await WithdrawalQueueV2.deploy(stToken.target, gov.address);

    await stToken.addMinter(stakingCore.target);
    await stToken.addMinter(queue.target);
    await stakingCore.connect(gov).setFeeController(feeController.target);
  }

  beforeEach(async () => {
    await deployFresh();
  });

  // ── ShareMath Invariants ─────────────────────────────────────────────────

  it("ShareMath: getSharesByPooledEth(0) == 0 for any state", async () => {
    const shares = await stToken.getSharesByPooledEth(0n);
    expect(shares).to.equal(0n);
  });

  it("ShareMath: first depositor gets shares 1:1 (bootstrap)", async () => {
    await stakingCore.connect(alice).submit(ZeroAddress, {value: parseEther("1")});
    expect(await stToken.sharesOf(alice.address)).to.equal(parseEther("1"));
  });

  it("ShareMath: first depositor with 1 wei gets 1 share", async () => {
    await stakingCore.connect(alice).submit(ZeroAddress, {value: 1n});
    expect(await stToken.sharesOf(alice.address)).to.equal(1n);
  });

  it("ShareMath: deposit round-trip does not inflate shares", async () => {
    await stakingCore.connect(alice).submit(ZeroAddress, {value: parseEther("10")});
    const aliceShares = await stToken.sharesOf(alice.address);

    await stakingCore.connect(bob).submit(ZeroAddress, {value: parseEther("10")});
    const bobShares = await stToken.sharesOf(bob.address);

    expect(bobShares).to.equal(aliceShares);
  });

  // ── FeeController Invariants ─────────────────────────────────────────────

  it("FeeController: fees never exceed rewards for many values", async () => {
    const testValues = [
      0n, 1n, 100n, parseEther("1"), parseEther("100"),
      parseEther("1000"), parseEther("100000")
    ];
    for (const rewards of testValues) {
      const [treasury, operator, debtPool, referral] = await feeController.computeFees(rewards);
      const totalFee = (rewards * 1000n) / 10000n;
      expect(treasury + operator + debtPool + referral).to.equal(totalFee);
    }
  });

  it("FeeController: zero rewards => zero fees", async () => {
    const [treasury, operator, debtPool, referral] = await feeController.computeFees(0n);
    expect(treasury).to.equal(0n);
    expect(operator).to.equal(0n);
    expect(debtPool).to.equal(0n);
    expect(referral).to.equal(0n);
  });

  it("FeeController: treasury + operator + referral + debtPool == totalFee for edge cases", async () => {
    const edgeCases = [1n, 9999n, 10000n, 10001n, parseEther("0.0001"), parseEther("999999")];
    for (const rewards of edgeCases) {
      const [treasury, operator, debtPool, referral] = await feeController.computeFees(rewards);
      const totalFee = (rewards * 1000n) / 10000n;
      expect(treasury + operator + debtPool + referral).to.equal(totalFee);
    }
  });

  // ── StakingCore Invariants ───────────────────────────────────────────────

  it("StakingCore: totalPooledEther == sum of all deposits before oracle", async () => {
    const amounts = [parseEther("1"), parseEther("2.5"), parseEther("0.001"), 1n, 100n];
    let sum = 0n;
    for (const amt of amounts) {
      await stakingCore.connect(alice).submit(ZeroAddress, {value: amt});
      sum += amt;
    }
    expect(await stToken.totalPooledEther()).to.equal(sum);
  });

  it("StakingCore: submit with 0 ETH reverts", async () => {
    await expect(stakingCore.connect(alice).submit(ZeroAddress)).to.be.reverted;
  });

  it("StakingCore: shares of all holders sum to total shares", async () => {
    await stakingCore.connect(alice).submit(ZeroAddress, {value: parseEther("10")});
    await stakingCore.connect(bob).submit(ZeroAddress, {value: parseEther("5")});
    const totalShares = await stToken.getTotalShares();
    const aliceShares = await stToken.sharesOf(alice.address);
    const bobShares = await stToken.sharesOf(bob.address);
    expect(aliceShares + bobShares).to.equal(totalShares);
  });

  // ── WithdrawalQueueV2 Invariants ─────────────────────────────────────────

  it("WithdrawalQueueV2: request below MIN reverts", async () => {
    await stakingCore.connect(alice).submit(ZeroAddress, {value: parseEther("1")});
    await expect(
      queue.connect(alice).requestWithdrawals([100n], alice.address)
    ).to.be.revertedWithCustomError(queue, "AmountOutOfBounds");
  });

  it("WithdrawalQueueV2: request above MAX reverts", async () => {
    await stakingCore.connect(alice).submit(ZeroAddress, {value: parseEther("2000")});
    await expect(
      queue.connect(alice).requestWithdrawals([parseEther("1001")], alice.address)
    ).to.be.revertedWithCustomError(queue, "AmountOutOfBounds");
  });

  it("WithdrawalQueueV2: request burns shares and reduces pool", async () => {
    await stakingCore.connect(alice).submit(ZeroAddress, {value: parseEther("10")});
    const prePool = await stToken.totalPooledEther();
    const preShares = await stToken.getTotalShares();

    await queue.connect(alice).requestWithdrawals([parseEther("1")], alice.address);

    const postPool = await stToken.totalPooledEther();
    const postShares = await stToken.getTotalShares();

    expect(postPool).to.be.lt(prePool);
    expect(postShares).to.be.lt(preShares);
  });

  // ── AccessControl Invariants ────────────────────────────────────────────

  it("StakingCore: non-GOV cannot set fee controller", async () => {
    await expect(stakingCore.connect(alice).setFeeController(deployer.address)).to.be.reverted;
  });

  it("StakingCore: non-ORACLE cannot report beacon", async () => {
    await expect(stakingCore.connect(alice).reportBeacon(1, parseEther("32"))).to.be.reverted;
  });

  it("WithdrawalQueueV2: non-GUARDIAN cannot finalize", async () => {
    await expect(queue.connect(alice).finalize(1)).to.be.reverted;
  });

  // ── Reentrancy / Edge Case Invariants ────────────────────────────────────

  it("StakingCore: direct ETH transfer without submit reverts if 0 value", async () => {
    await expect(
      alice.sendTransaction({to: stakingCore.target, value: 0n})
    ).to.be.reverted;
  });

  it("StakingCore: multiple deposits from same user accumulate shares correctly", async () => {
    const amounts = [parseEther("1"), parseEther("2"), parseEther("3")];
    let expectedShares = 0n;

    for (const amt of amounts) {
      const preShares = await stToken.sharesOf(alice.address);
      await stakingCore.connect(alice).submit(ZeroAddress, {value: amt});
      const postShares = await stToken.sharesOf(alice.address);
      const minted = postShares - preShares;
      expect(minted).to.be.gt(0n);
      expectedShares += minted;
    }

    expect(await stToken.sharesOf(alice.address)).to.equal(expectedShares);
  });

  it("StakingCore: deposits with unusual wei amounts still mint shares", async () => {
    const weirdAmounts = [1n, 7n, 42n, 1337n, 999999n, 1000000001n];
    for (const amt of weirdAmounts) {
      await stakingCore.connect(alice).submit(ZeroAddress, {value: amt});
      const shares = await stToken.sharesOf(alice.address);
      expect(shares).to.be.gt(0n);
    }
  });
});
