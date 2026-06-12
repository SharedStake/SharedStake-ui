/**
 * End-to-end test for the StakingRouter + ValidatorModule architecture.
 * Mirrors `e2e.spec.ts` but exercises the new modular path:
 *
 *   1. Deploy full stack: StToken, WstToken, FeeController, WithdrawalQueueV2,
 *      StakingRouter, ValidatorModule (with MockBeaconDeposit), OracleAdapter.
 *   2. Wire roles: router gets MINTER on stToken, queue gets MINTER, register
 *      module + set default, oracleAdapter gets ORACLE on validator module,
 *      gov gets GUARDIAN on the queue (already in queue's constructor).
 *   3. Alice deposits 10 ETH → gets stToken shares.
 *   4. NODE_OPERATOR pushes 32 ETH chunk to (mock) beacon — sets baseline.
 *   5. Oracle reports 10.5 ETH → Alice's stToken balance increases (rebase).
 *   6. Fee shares minted to treasury / operator.
 *   7. Bob deposits 1 ETH at rebased rate → fewer shares than 1:1.
 *   8. Alice wraps 1 stETH → wstETH; unwraps back.
 *   9. Alice requests withdrawal of 1 stETH (via WithdrawalQueueV2 directly).
 *  10. Guardian finalizes with 1 ETH → Alice claims → receives ETH.
 *  11. Invariant checks.
 */
import {ethers} from "hardhat";
import {expect} from "chai";
import {parseEther, ZeroAddress} from "ethers";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

const SOLO = ethers.keccak256(ethers.toUtf8Bytes("E2E_ROUTER_SOLO"));

const ORACLE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ORACLE"));
const NODE_OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("NODE_OPERATOR"));

describe("StakingRouter E2E (SharedStake V2 modular)", () => {
  let deployer: SignerWithAddress,
    gov: SignerWithAddress,
    alice: SignerWithAddress,
    bob: SignerWithAddress,
    oracleSigner: SignerWithAddress;

  let stToken: any,
    wstToken: any,
    feeController: any,
    router: any,
    validatorModule: any,
    mockBeaconDeposit: any,
    withdrawalQueue: any,
    oracleAdapter: any;
  let expectedWithdrawalCreds: string;

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

    const StakingRouter = await ethers.getContractFactory("StakingRouter");
    router = await StakingRouter.deploy(stToken.target, gov.address);

    const MockBeaconDeposit = await ethers.getContractFactory("MockBeaconDeposit");
    mockBeaconDeposit = await MockBeaconDeposit.deploy();

    const ValidatorModule = await ethers.getContractFactory("ValidatorModule");
    validatorModule = await ValidatorModule.deploy(router.target, SOLO, gov.address, mockBeaconDeposit.target);

    const WithdrawalQueueV2 = await ethers.getContractFactory("WithdrawalQueueV2");
    withdrawalQueue = await WithdrawalQueueV2.deploy(stToken.target, gov.address);

    const OracleAdapter = await ethers.getContractFactory("OracleAdapter");
    oracleAdapter = await OracleAdapter.deploy(validatorModule.target, gov.address);

    // ── Wire ────────────────────────────────────────────────────────────────
    await stToken.addMinter(router.target);
    await stToken.addMinter(withdrawalQueue.target);

    await router.connect(gov).setFeeController(feeController.target);
    await router.connect(gov).registerModule(SOLO, validatorModule.target, 0);
    await router.connect(gov).setDefaultModule(SOLO);

    await validatorModule.connect(gov).grantRole(ORACLE_ROLE, oracleAdapter.target);
    await validatorModule.connect(gov).grantRole(NODE_OPERATOR_ROLE, gov.address);
    await oracleAdapter.connect(gov).addSubmitter(oracleSigner.address);
    expectedWithdrawalCreds = ethers.hexlify(ethers.randomBytes(32));
    await validatorModule.connect(gov).setExpectedWithdrawalCredentials(expectedWithdrawalCreds);

    // Relax maxDeltaBps for E2E tests so we can simulate realistic rewards.
    await router.connect(gov).setMaxDeltaBps(1000);
  });

  // ── Step 1: Alice deposits ──────────────────────────────────────────────────
  it("Step 1: Alice deposits 10 ETH via the router (1:1 bootstrap)", async () => {
    await router.connect(alice).submit(ZeroAddress, {value: parseEther("10")});
    expect(await stToken.sharesOf(alice.address)).to.equal(parseEther("10"));
    expect(await stToken.totalPooledEther()).to.equal(parseEther("10"));
    expect(await stToken.balanceOf(alice.address)).to.equal(parseEther("10"));
    expect(await validatorModule.bufferedEther()).to.equal(parseEther("10"));
  });

  // ── Step 2: NODE_OPERATOR pushes 32 ETH to mock beacon ─────────────────────
  it("Step 2: top up to 32 ETH and push to mock beacon (baseline = 32 ETH)", async () => {
    // Need an additional 22 ETH in the buffer so we can push 32 ETH downstream.
    await router.connect(bob).submit(ZeroAddress, {value: parseEther("22")});
    expect(await validatorModule.bufferedEther()).to.equal(parseEther("32"));

    const pubkey = ethers.hexlify(ethers.randomBytes(48));
    const creds = expectedWithdrawalCreds;
    const sig = ethers.hexlify(ethers.randomBytes(96));
    const root = ethers.hexlify(ethers.randomBytes(32));

    await validatorModule.connect(gov).approvePubkey(pubkey);
    await validatorModule.connect(gov).depositToBeaconChain(pubkey, creds, sig, root);

    expect(await validatorModule.bufferedEther()).to.equal(0n);
    expect(await router.moduleBeaconBalance(SOLO)).to.equal(parseEther("32"));
    // totalPooledEther unchanged (32 buffered → 32 on beacon, no new shares).
    expect(await stToken.totalPooledEther()).to.equal(parseEther("32"));
  });

  // ── Step 3: Oracle reports gain → rebase ───────────────────────────────────
  it("Step 3: Oracle reports 32.5 ETH beacon balance (0.5 ETH reward, fees minted)", async () => {
    // Use chain timestamp (not Date.now()) so the staleness guard is robust to
    // tests in other suites that advance evm time via `evm_increaseTime`.
    const blk = await ethers.provider.getBlock("latest");
    const now = blk!.timestamp - 30; // beacon slot timestamps are always in the past (MIN_REPORT_TIMESTAMP_AGE = 12s)
    await oracleAdapter.connect(oracleSigner).submitReport(1, parseEther("32.5"), now);

    // Pool stays at 32.5 ETH because fees are captured via share dilution,
    // not by increasing totalPooledEther beyond actual ETH backing.
    const pool = await stToken.totalPooledEther();
    expect(pool).to.equal(parseEther("32.5"));
  });

  // ── Step 4: Alice's balance rebased upward ─────────────────────────────────
  it("Step 4: Alice's stETH balance increased after rebase", async () => {
    const aliceBalance = await stToken.balanceOf(alice.address);
    expect(aliceBalance).to.be.gt(parseEther("10"));
  });

  // ── Step 5: Fee recipients got shares ───────────────────────────────────────
  it("Step 5: Treasury (gov) and operator (deployer) received fee shares", async () => {
    expect(await stToken.sharesOf(gov.address)).to.be.gt(0n);
    expect(await stToken.sharesOf(deployer.address)).to.be.gt(0n);
  });

  // ── Step 6: Bob deposits at rebased rate ───────────────────────────────────
  it("Step 6: A new deposit at rebased rate yields fewer shares than ETH", async () => {
    // Bob already deposited 22 ETH at the bootstrap rate; deposit again to test rebased rate.
    const totalSharesBefore = await stToken.getTotalShares();
    const totalPooledBefore = await stToken.totalPooledEther();

    const depositAmt = parseEther("1");
    const expectedShares = (depositAmt * totalSharesBefore) / totalPooledBefore;

    const bobSharesBefore = await stToken.sharesOf(bob.address);
    await router.connect(bob).submit(ZeroAddress, {value: depositAmt});
    const bobSharesAfter = await stToken.sharesOf(bob.address);

    const newlyMinted = bobSharesAfter - bobSharesBefore;
    expect(newlyMinted).to.equal(expectedShares);
    // Rate has moved above 1, so newly minted shares < deposit amount.
    expect(newlyMinted).to.be.lt(depositAmt);
  });

  // ── Step 7: Wrap / unwrap stETH ────────────────────────────────────────────
  it("Step 7: Alice wraps 1 stETH → wstETH and unwraps back", async () => {
    const stAmount = parseEther("1");

    await stToken.connect(alice).approve(wstToken.target, stAmount);
    const wstExpected = await wstToken.getWstTokenByStToken(stAmount);
    await wstToken.connect(alice).wrap(stAmount);

    const wstBalance = await wstToken.balanceOf(alice.address);
    expect(wstBalance).to.equal(wstExpected);

    await wstToken.connect(alice).unwrap(wstBalance);
    expect(await wstToken.balanceOf(alice.address)).to.equal(0n);
  });

  // ── Step 8: Alice requests withdrawal ──────────────────────────────────────
  it("Step 8: Alice requests 1 stETH withdrawal", async () => {
    const aliceSharesBefore = await stToken.sharesOf(alice.address);
    await withdrawalQueue.connect(alice).requestWithdrawals([parseEther("1")], alice.address);
    const aliceSharesAfter = await stToken.sharesOf(alice.address);
    expect(aliceSharesAfter).to.be.lt(aliceSharesBefore);

    const req = await withdrawalQueue.getRequest(1);
    expect(req.owner).to.equal(alice.address);
    expect(req.finalized).to.be.false;
  });

  // ── Step 9: Guardian finalizes ─────────────────────────────────────────────
  it("Step 9: Gov finalizes the request with sufficient ETH", async () => {
    await withdrawalQueue.connect(gov).finalize(1, {value: parseEther("1.1")});
    const req = await withdrawalQueue.getRequest(1);
    expect(req.finalized).to.be.true;
    expect(req.ethAmount).to.be.gt(0n);
  });

  // ── Step 10: Alice claims ──────────────────────────────────────────────────
  it("Step 10: Alice claims ETH from the queue", async () => {
    const aliceEthBefore = await ethers.provider.getBalance(alice.address);
    const tx = await withdrawalQueue.connect(alice).claimWithdrawal(1, alice.address);
    const receipt = await tx.wait();
    const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
    const aliceEthAfter = await ethers.provider.getBalance(alice.address);

    expect(aliceEthAfter + gasUsed).to.be.gt(aliceEthBefore);

    const req = await withdrawalQueue.getRequest(1);
    expect(req.claimed).to.be.true;
  });

  // ── Step 11: Final invariants ──────────────────────────────────────────────
  it("Final: totalSupply == totalPooledEther", async () => {
    expect(await stToken.totalSupply()).to.equal(await stToken.totalPooledEther());
  });

  it("Final: WithdrawalQueueV2 balance ≥ lockedEther", async () => {
    const locked = await withdrawalQueue.lockedEther();
    const bal = await ethers.provider.getBalance(withdrawalQueue.target);
    expect(bal).to.be.gte(locked);
  });

  it("Final: totalEthOf([SOLO]) approximately matches stToken.totalPooledEther", async () => {
    // Module accounting (bufferedEther + beaconBalance) should track totalPooledEther
    // up to fee-distribution effects — fees expand totalPooledEther without expanding
    // the module's underlying ETH custody (the fee is a virtual reward attribution).
    const moduleSum = await router.totalEthOf([SOLO]);
    const totalPooled = await stToken.totalPooledEther();
    // Within ~5% (fees + withdrawal effects).
    const diff = totalPooled > moduleSum ? totalPooled - moduleSum : moduleSum - totalPooled;
    expect(diff).to.be.lt(totalPooled / 20n);
  });
});
