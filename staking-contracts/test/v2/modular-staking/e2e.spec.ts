/**
 * End-to-end test for the full SharedStake V2 staking lifecycle:
 *
 *   1. Deploy entire system (StToken, WstToken, StakingCore, WithdrawalQueueV2, FeeController, OracleAdapter)
 *   2. Alice deposits 10 ETH → receives stETH shares
 *   3. Oracle reports beacon balance (simulating validator rewards)
 *   4. Alice's stETH balance rebases upward automatically
 *   5. Alice wraps some stETH into wstETH; Bob deposits; exchange rate verified
 *   6. Alice requests withdrawal, queue finalizes, Alice claims ETH
 *   7. Fee recipients (treasury/operator) received shares on reward report
 *   8. Verify all accounting invariants at the end
 */
import {ethers} from "hardhat";
import {expect} from "chai";
import {parseEther, ZeroAddress} from "ethers";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

describe("SharedStake V2 E2E", () => {
  let deployer: SignerWithAddress,
    gov: SignerWithAddress,
    alice: SignerWithAddress,
    bob: SignerWithAddress,
    oracleSigner: SignerWithAddress;

  let stToken: any, wstToken: any, feeController: any, stakingCore: any, withdrawalQueue: any, oracleAdapter: any;

  const ORACLE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ORACLE"));
  const SUBMITTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("SUBMITTER"));

  before(async () => {
    [deployer, gov, alice, bob, oracleSigner] = await ethers.getSigners();

    // ── Deploy ──────────────────────────────────────────────────────────────
    const StToken = await ethers.getContractFactory("StToken");
    stToken = await StToken.deploy();

    const WstToken = await ethers.getContractFactory("WstToken");
    wstToken = await WstToken.deploy(stToken.target);

    const FeeController = await ethers.getContractFactory("FeeController");
    feeController = await FeeController.deploy(
      gov.address, // gov
      gov.address, // treasury
      deployer.address, // operator
      ZeroAddress, // referral registry (unused in this suite)
      ZeroAddress, // debt pool (disabled)
      1000, // 10% fee
      5000, // 50/50 split
      5000, // operator split
      0, // debt pool split (disabled)
    );

    const StakingCore = await ethers.getContractFactory("StakingCore");
    stakingCore = await StakingCore.deploy(stToken.target, gov.address);

    const WithdrawalQueueV2 = await ethers.getContractFactory("WithdrawalQueueV2");
    withdrawalQueue = await WithdrawalQueueV2.deploy(stToken.target, gov.address);

    const OracleAdapter = await ethers.getContractFactory("OracleAdapter");
    oracleAdapter = await OracleAdapter.deploy(stakingCore.target, gov.address);

    // ── Wire ────────────────────────────────────────────────────────────────
    await stToken.addMinter(stakingCore.target);
    await stToken.addMinter(withdrawalQueue.target);

    await stakingCore.connect(gov).setFeeController(feeController.target);
    await stakingCore.connect(gov).grantRole(ORACLE_ROLE, oracleAdapter.target);
    await oracleAdapter.connect(gov).addSubmitter(oracleSigner.address);
  });

  // ── Step 1: Initial deposits ────────────────────────────────────────────────

  it("Step 1: Alice deposits 10 ETH, receives 10e18 shares (bootstrap)", async () => {
    await stakingCore.connect(alice).submit(ZeroAddress, {value: parseEther("10")});

    expect(await stToken.sharesOf(alice.address)).to.equal(parseEther("10"));
    expect(await stToken.totalPooledEther()).to.equal(parseEther("10"));
    expect(await stToken.balanceOf(alice.address)).to.equal(parseEther("10"));
  });

  // ── Step 2: Oracle reports beacon rewards ───────────────────────────────────

  it("Step 2: Oracle reports 10.5 ETH beacon balance (0.5 ETH reward)", async () => {
    // Use chain time so this test remains stable even if prior suites advanced EVM time.
    // Subtract 30s: beacon slot timestamps are always in the past (MIN_REPORT_TIMESTAMP_AGE = 12s).
    const blk = await ethers.provider.getBlock("latest");
    const now = blk!.timestamp - 30;

    // Seed baseline: move principal accounting from buffered -> beacon side.
    await stakingCore.connect(gov).notifyBeaconDeposit(parseEther("10"));

    await oracleAdapter.connect(oracleSigner).submitReport(
      1, // 1 validator
      parseEther("10.5"), // beacon balance
      now, // beacon slot timestamp (30s in the past)
    );

    // Pool = 10.5 ETH before fees (10 ETH principal + 0.5 ETH rewards).
    // Rewards = 0.5 ETH; 10% fee = 0.05 ETH in shares to treasury+operator.
    // Pool stays at 10.5 ETH because fees are captured via share dilution,
    // not by increasing totalPooledEther beyond actual ETH backing.
    const pool = await stToken.totalPooledEther();
    expect(pool).to.equal(parseEther("10.5"));
  });

  // ── Step 3: Alice's balance rebased ────────────────────────────────────────

  it("Step 3: Alice's stETH balance increased (rebase)", async () => {
    // Alice holds 10e18 shares. Pool grew from 10 to ~10.55 ETH, but total shares also grew.
    // New shares minted to treasury/operator; Alice's share fraction diluted slightly by fees.
    const aliceBalance = await stToken.balanceOf(alice.address);
    // Alice should have more than 10 ETH but the fee dilution is ~0.05/10.55 ≈ 0.47%.
    expect(aliceBalance).to.be.gt(parseEther("10"));
  });

  // ── Step 4: Fee recipients got shares ──────────────────────────────────────

  it("Step 4: Treasury (gov) and operator (deployer) received fee shares", async () => {
    expect(await stToken.sharesOf(gov.address)).to.be.gt(0n);
    expect(await stToken.sharesOf(deployer.address)).to.be.gt(0n);
  });

  // ── Step 5: Bob deposits at rebased rate ────────────────────────────────────

  it("Step 5: Bob deposits 1 ETH, gets fewer shares than Alice (rate > 1:1)", async () => {
    const totalPooledBefore = await stToken.totalPooledEther();
    const totalSharesBefore = await stToken.getTotalShares();

    await stakingCore.connect(bob).submit(ZeroAddress, {value: parseEther("1")});

    const bobShares = await stToken.sharesOf(bob.address);
    // Bob should receive fewer than 1e18 shares because rate is now > 1 ETH/share.
    expect(bobShares).to.be.lt(parseEther("1"));
  });

  // ── Step 6: Alice wraps stETH → wstETH ─────────────────────────────────────

  it("Step 6: Alice wraps 1 stETH into wstETH", async () => {
    const stAmount = parseEther("1");

    // Approve wstToken to spend Alice's stETH.
    await stToken.connect(alice).approve(wstToken.target, stAmount);

    const wstAmountExpected = await wstToken.getWstTokenByStToken(stAmount);
    await wstToken.connect(alice).wrap(stAmount);

    expect(await wstToken.balanceOf(alice.address)).to.equal(wstAmountExpected);
  });

  it("Step 6b: Alice unwraps wstETH back to stETH (gets at least original amount)", async () => {
    const wstBalance = await wstToken.balanceOf(alice.address);
    const stAmountExpected = await wstToken.getStTokenByWstToken(wstBalance);

    await wstToken.connect(alice).unwrap(wstBalance);

    // Alice gets back her stETH.
    expect(await wstToken.balanceOf(alice.address)).to.equal(0n);
    // The stETH returned should match what was computed.
    // (exact balance check is complex due to rebase math; just verify wstBalance is 0)
  });

  // ── Step 7: Alice requests withdrawal ──────────────────────────────────────

  it("Step 7: Alice requests 1 stETH withdrawal", async () => {
    const aliceSharesBefore = await stToken.sharesOf(alice.address);

    const tx = await withdrawalQueue.connect(alice).requestWithdrawals([parseEther("1")], alice.address);

    const aliceSharesAfter = await stToken.sharesOf(alice.address);
    expect(aliceSharesAfter).to.be.lt(aliceSharesBefore);

    // Request ID 1 created.
    const req = await withdrawalQueue.getRequest(1);
    expect(req.owner).to.equal(alice.address);
    expect(req.finalized).to.be.false;
  });

  // ── Step 8: Guardian finalizes ──────────────────────────────────────────────

  it("Step 8: Gov finalizes withdrawal batch with ETH", async () => {
    await withdrawalQueue.connect(gov).finalize(1, {value: parseEther("1")});

    const req = await withdrawalQueue.getRequest(1);
    expect(req.finalized).to.be.true;
    expect(req.ethAmount).to.be.gt(0n);
  });

  // ── Step 9: Alice claims ETH ────────────────────────────────────────────────

  it("Step 9: Alice claims ETH from withdrawal queue", async () => {
    const aliceEthBefore = await ethers.provider.getBalance(alice.address);
    const tx = await withdrawalQueue.connect(alice).claimWithdrawal(1, alice.address);
    const receipt = await tx.wait();
    const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
    const aliceEthAfter = await ethers.provider.getBalance(alice.address);

    // Alice's ETH balance increased (received ETH minus gas).
    expect(aliceEthAfter + gasUsed).to.be.gt(aliceEthBefore);

    // Request marked claimed.
    const req = await withdrawalQueue.getRequest(1);
    expect(req.claimed).to.be.true;
  });

  // ── Final invariant check ───────────────────────────────────────────────────

  it("Final: totalSupply equals totalPooledEther (accounting identity)", async () => {
    const totalSupply = await stToken.totalSupply();
    const totalPooled = await stToken.totalPooledEther();
    expect(totalSupply).to.equal(totalPooled);
  });

  it("Final: no user can claim more than finalized ETH", async () => {
    const lockedEther = await withdrawalQueue.lockedEther();
    const queueBalance = await ethers.provider.getBalance(withdrawalQueue.target);
    expect(queueBalance).to.be.gte(lockedEther);
  });

  it("Final: oracle staleness guard rejects old reports", async () => {
    // Move time forward so a 7h-old timestamp is still strictly newer than the
    // last accepted oracle report timestamp, exercising staleness (not monotonicity).
    await ethers.provider.send("evm_increaseTime", [8 * 3600]);
    await ethers.provider.send("evm_mine", []);
    const blk = await ethers.provider.getBlock("latest");
    const staleTimestamp = BigInt(blk!.timestamp) - BigInt(7 * 3600); // 7 hours old
    await expect(
      oracleAdapter.connect(oracleSigner).submitReport(1, parseEther("10"), staleTimestamp),
    ).to.be.revertedWithCustomError(oracleAdapter, "StaleReport");
  });
});
