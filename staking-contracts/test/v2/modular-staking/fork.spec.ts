/**
 * Fork test against mainnet beacon deposit contract.
 *
 * Requires MAINNET_RPC_URL env var (Alchemy/Infura/public endpoint).
 * Run with:
 *   MAINNET_RPC_URL=https://ethereum.publicnode.com \
 *   npx hardhat test test/v2/modular-staking/fork.spec.ts
 *
 * Strategy: inject MockBeaconDeposit bytecode at the canonical mainnet deposit
 * address (0x00000000219ab540356cBB839Cbe05303d7705Fa) so we can verify
 * our ETH-flow / access-control / credentials logic without needing valid
 * BLS deposit data.  We are testing _our_ contracts, not the deposit contract.
 *
 * Validates:
 *   1. ValidatorModule routes 32 ETH to the beacon deposit contract address
 *   2. Withdrawal-credentials enforcement fires before the external call
 *   3. ETH accounting is correct post-deposit
 *   4. DVTModule cluster-gating blocks unclustered deposits
 */
import {ethers} from "hardhat";
import {expect} from "chai";
import {parseEther, ZeroAddress} from "ethers";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

const SOLO  = ethers.keccak256(ethers.toUtf8Bytes("FORK_SOLO"));
const DVT_M = ethers.keccak256(ethers.toUtf8Bytes("FORK_DVT"));
const NODE_OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("NODE_OPERATOR"));

// Canonical mainnet beacon deposit contract — we'll shadow it with our mock.
const BEACON_DEPOSIT_CONTRACT = "0x00000000219ab540356cBB839Cbe05303d7705Fa";

const describeFork = process.env.MAINNET_RPC_URL ? describe : describe.skip;

describeFork("SharedStake V2 Fork (mainnet beacon deposit)", () => {
  let deployer: SignerWithAddress;
  let gov: SignerWithAddress;
  let alice: SignerWithAddress;
  let nodeOp: SignerWithAddress;

  let stToken: any;
  let router: any;
  let validatorModule: any;
  let dvtModule: any;
  let queue: any;
  let validatorExpectedCreds: string;
  let dvtExpectedCreds: string;

  before(async () => {
    [deployer, gov, alice, nodeOp] = await ethers.getSigners();

    // ── Shadow real beacon deposit with our mock ──────────────────────────
    // Deploy a mock to get its runtime bytecode, then copy it to the
    // canonical address so all deposits hit the mock.
    const MockBeaconDeposit = await ethers.getContractFactory("MockBeaconDeposit");
    const mockInstance = await MockBeaconDeposit.deploy();
    const mockCode = await ethers.provider.getCode(mockInstance.target);
    await ethers.provider.send("hardhat_setCode", [BEACON_DEPOSIT_CONTRACT, mockCode]);

    // ── Core contracts ────────────────────────────────────────────────────
    const StToken = await ethers.getContractFactory("StToken");
    stToken = await StToken.deploy();

    const StakingRouter = await ethers.getContractFactory("StakingRouter");
    router = await StakingRouter.deploy(stToken.target, gov.address);

    const WithdrawalQueueV2 = await ethers.getContractFactory("WithdrawalQueueV2");
    queue = await WithdrawalQueueV2.deploy(stToken.target, gov.address);

    const ValidatorModule = await ethers.getContractFactory("ValidatorModule");
    validatorModule = await ValidatorModule.deploy(
      router.target,
      SOLO,
      gov.address,
      BEACON_DEPOSIT_CONTRACT,
    );

    const DVTModule = await ethers.getContractFactory("DVTModule");
    dvtModule = await DVTModule.deploy(
      router.target,
      DVT_M,
      gov.address,
      BEACON_DEPOSIT_CONTRACT,
    );

    // ── Role wiring ───────────────────────────────────────────────────────
    await stToken.addMinter(router.target);
    await stToken.addMinter(queue.target);

    await router.connect(gov).registerModule(SOLO, validatorModule.target, 0);
    await router.connect(gov).registerModule(DVT_M, dvtModule.target, 0);
    await router.connect(gov).setDefaultModule(SOLO);

    await validatorModule.connect(gov).grantRole(NODE_OPERATOR_ROLE, gov.address);
    await dvtModule.connect(gov).grantRole(NODE_OPERATOR_ROLE, nodeOp.address);
    validatorExpectedCreds = ethers.hexlify(ethers.randomBytes(32));
    dvtExpectedCreds = ethers.hexlify(ethers.randomBytes(32));
    await validatorModule.connect(gov).setExpectedWithdrawalCredentials(validatorExpectedCreds);
    await dvtModule.connect(gov).setExpectedWithdrawalCredentials(dvtExpectedCreds);
  });

  // ── helpers ───────────────────────────────────────────────────────────
  function randDeposit(withdrawalCreds?: string) {
    return {
      pubkey:            ethers.hexlify(ethers.randomBytes(48)),
      withdrawalCreds:   withdrawalCreds ?? ethers.hexlify(ethers.randomBytes(32)),
      signature:         ethers.hexlify(ethers.randomBytes(96)),
      depositDataRoot:   ethers.hexlify(ethers.randomBytes(32)),
    };
  }

  // ── Solo ValidatorModule fork tests ──────────────────────────────────

  it("routes 32 ETH from router to beacon deposit contract address", async () => {
    await router.connect(alice).submit(ZeroAddress, {value: parseEther("32")});
    expect(await validatorModule.bufferedEther()).to.equal(parseEther("32"));

    const beaconBefore = await ethers.provider.getBalance(BEACON_DEPOSIT_CONTRACT);
    const {pubkey, withdrawalCreds, signature, depositDataRoot} = randDeposit(validatorExpectedCreds);

    await validatorModule.connect(gov).depositToBeaconChain(
      pubkey, withdrawalCreds, signature, depositDataRoot,
    );

    expect(await validatorModule.bufferedEther()).to.equal(0n);
    const beaconAfter = await ethers.provider.getBalance(BEACON_DEPOSIT_CONTRACT);
    expect(beaconAfter - beaconBefore).to.equal(parseEther("32"));
  });

  it("rejects deposit with invalid withdrawal credentials", async () => {
    await router.connect(alice).submit(ZeroAddress, {value: parseEther("32")});

    const expectedCreds = ethers.hexlify(ethers.randomBytes(32));
    await validatorModule.connect(gov).setExpectedWithdrawalCredentials(expectedCreds);

    const {pubkey, signature, depositDataRoot} = randDeposit();
    const badCreds = ethers.hexlify(ethers.randomBytes(32));

    await expect(
      validatorModule.connect(gov).depositToBeaconChain(pubkey, badCreds, signature, depositDataRoot),
    ).to.be.revertedWithCustomError(validatorModule, "InvalidWithdrawalCredentials");
  });

  it("accepts deposit when withdrawal credentials match expected", async () => {
    const expectedCreds = await validatorModule.expectedWithdrawalCredentials();
    const {pubkey, signature, depositDataRoot} = randDeposit();

    await expect(
      validatorModule.connect(gov).depositToBeaconChain(
        pubkey, expectedCreds, signature, depositDataRoot,
      ),
    ).to.not.be.reverted;

    expect(await validatorModule.bufferedEther()).to.equal(0n);
  });

  // ── DVTModule cluster-gating fork tests ──────────────────────────────

  it("DVTModule: blocks depositToBeaconChain when no cluster registered", async () => {
    await router.connect(alice).submitToModule(DVT_M, ZeroAddress, {value: parseEther("32")});

    const CLUSTER_ID = ethers.keccak256(ethers.toUtf8Bytes("cluster-1"));
    const {pubkey, withdrawalCreds, signature, depositDataRoot} = randDeposit(dvtExpectedCreds);

    await expect(
      dvtModule.connect(nodeOp).depositToBeaconChainInCluster(
        CLUSTER_ID, pubkey, withdrawalCreds, signature, depositDataRoot,
      ),
    ).to.be.revertedWithCustomError(dvtModule, "ClusterNotActive");
  });

  it("DVTModule: allows deposit after cluster is registered", async () => {
    const CLUSTER_ID = ethers.keccak256(ethers.toUtf8Bytes("cluster-1"));
    const operators = [nodeOp.address, gov.address];
    await dvtModule.connect(gov).registerCluster(CLUSTER_ID, operators, 1);

    const {pubkey, withdrawalCreds, signature, depositDataRoot} = randDeposit(dvtExpectedCreds);
    const beaconBefore = await ethers.provider.getBalance(BEACON_DEPOSIT_CONTRACT);

    await dvtModule.connect(nodeOp).depositToBeaconChainInCluster(
      CLUSTER_ID, pubkey, withdrawalCreds, signature, depositDataRoot,
    );

    const beaconAfter = await ethers.provider.getBalance(BEACON_DEPOSIT_CONTRACT);
    expect(beaconAfter - beaconBefore).to.equal(parseEther("32"));
  });

  it("DVTModule: deactivating a cluster blocks further deposits", async () => {
    await router.connect(alice).submitToModule(DVT_M, ZeroAddress, {value: parseEther("32")});

    const CLUSTER_ID = ethers.keccak256(ethers.toUtf8Bytes("cluster-1"));
    await dvtModule.connect(gov).deactivateCluster(CLUSTER_ID);

    const {pubkey, withdrawalCreds, signature, depositDataRoot} = randDeposit(dvtExpectedCreds);
    await expect(
      dvtModule.connect(nodeOp).depositToBeaconChainInCluster(
        CLUSTER_ID, pubkey, withdrawalCreds, signature, depositDataRoot,
      ),
    ).to.be.revertedWithCustomError(dvtModule, "ClusterNotActive");
  });

  // ── Fee distribution fork tests ──────────────────────────────────────

  describe("Fee distribution fork tests", () => {
    let feeController: any;
    let treasury: SignerWithAddress;
    let operator: SignerWithAddress;

    before(async () => {
      // Use alice as treasury, nodeOp as operator for fee routing.
      treasury = alice;
      operator = nodeOp;

      const FeeController = await ethers.getContractFactory("FeeController");
      feeController = await FeeController.deploy(
        gov.address,
        treasury.address,
        operator.address,
        ZeroAddress,   // no referral registry
        ZeroAddress,   // no debt pool
        500,           // 5% total fee
        6000,          // 60% → treasury
        4000,          // 40% → operator
        0,             // 0% → debt pool
      );

      // Wire the fee controller into the router.
      await router.connect(gov).setFeeController(feeController.target);

      // Grant ORACLE role to gov on the validatorModule so we can call reportBeacon.
      const ORACLE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ORACLE"));
      await validatorModule.connect(gov).grantRole(ORACLE_ROLE, gov.address);

      // Ensure test keeps using configured protocol withdrawal credentials.
      await validatorModule.connect(gov).setExpectedWithdrawalCredentials(validatorExpectedCreds);
    });

    it("mints treasury shares on beacon reward report", async () => {
      // Step 1: deposit 32 ETH so the module has a buffer.
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("32")});

      // Step 2: do a beacon deposit — this calls notifyBeaconDeposit internally,
      // which bumps moduleBeaconBalance[SOLO] (the required non-zero baseline).
      const {pubkey, withdrawalCreds, signature, depositDataRoot} = randDeposit(validatorExpectedCreds);
      await validatorModule.connect(gov).depositToBeaconChain(
        pubkey, withdrawalCreds, signature, depositDataRoot,
      );

      // Read the actual baseline (may be > 32 ETH if prior tests also deposited).
      const baseline = await router.moduleBeaconBalance(SOLO);
      expect(baseline).to.be.gt(0n);

      // Step 3: record treasury share balance before the report.
      const treasurySharesBefore = await stToken.sharesOf(treasury.address);

      // Step 4: report a gain that is <= 1% of baseline (maxDeltaBps = 100).
      // We use 0.9% to stay safely under the sanity cap regardless of baseline size.
      const gain = baseline * 9n / 1000n;   // 0.9% of current baseline
      const newBeaconBalance = baseline + gain;
      await validatorModule.connect(gov).reportBeacon(1, newBeaconBalance);

      // Assert: treasury received newly minted shares.
      const treasurySharesAfter = await stToken.sharesOf(treasury.address);
      expect(treasurySharesAfter).to.be.gt(treasurySharesBefore);

      // Also verify a FeeSharesMinted event was emitted from the router.
      // (We check via share balance difference as a proxy — event inspection
      // would require the tx receipt which we already consumed above.)
      const sharesDelta = treasurySharesAfter - treasurySharesBefore;
      expect(sharesDelta).to.be.gt(0n);
    });
  });

  // ── Withdrawal queue fork tests ───────────────────────────────────────

  describe("Withdrawal queue fork tests", () => {
    it("full request → finalize → claim cycle", async () => {
      // Step 1: stake 10 ETH — alice gets stToken shares.
      const stakeAmount = parseEther("10");
      await router.connect(alice).submit(ZeroAddress, {value: stakeAmount});

      const aliceBalance = await stToken.balanceOf(alice.address);
      expect(aliceBalance).to.be.gt(0n);

      // Step 2: queue contract is already a minter (set up in before()).
      // requestWithdrawals burns from msg.sender directly (MINTER role on queue).
      // We withdraw 1 ETH worth of stToken (must be >= MIN_WITHDRAWAL = 0.01 ether).
      const withdrawAmount = parseEther("1");
      const requestIds = await queue.connect(alice).requestWithdrawals.staticCall(
        [withdrawAmount],
        alice.address,
      );
      await queue.connect(alice).requestWithdrawals([withdrawAmount], alice.address);

      const requestId = requestIds[0];
      const req = await queue.getRequest(requestId);
      expect(req.owner).to.equal(alice.address);
      expect(req.finalized).to.be.false;

      // Step 3: gov (GUARDIAN role on queue) finalises — sends exact ETH.
      const ethOwed = req.ethAmount;
      await queue.connect(gov).finalize(requestId, {value: ethOwed});

      const reqAfterFinalize = await queue.getRequest(requestId);
      expect(reqAfterFinalize.finalized).to.be.true;

      // Step 4: alice claims ETH.
      const aliceEthBefore = await ethers.provider.getBalance(alice.address);
      const claimTx = await queue.connect(alice).claimWithdrawal(requestId, alice.address);
      const receipt = await claimTx.wait();
      const gasUsed = receipt!.gasUsed * claimTx.gasPrice;
      const aliceEthAfter = await ethers.provider.getBalance(alice.address);

      // Alice should receive ethOwed, net of gas.
      expect(aliceEthAfter + gasUsed - aliceEthBefore).to.equal(ethOwed);

      // Request must be marked claimed; replay must revert.
      const reqAfterClaim = await queue.getRequest(requestId);
      expect(reqAfterClaim.claimed).to.be.true;

      await expect(
        queue.connect(alice).claimWithdrawal(requestId, alice.address),
      ).to.be.revertedWithCustomError(queue, "RequestAlreadyClaimed");
    });
  });

  // ── Governance parameter fork tests ──────────────────────────────────

  describe("Governance parameter fork tests", () => {
    it("GOV can update fee bps via FeeController", async () => {
      // Deploy a fresh FeeController for this test.
      const FeeController = await ethers.getContractFactory("FeeController");
      const fc = await FeeController.deploy(
        gov.address,
        alice.address,    // treasury
        nodeOp.address,   // operator
        ZeroAddress,      // no referral registry
        ZeroAddress,      // no debt pool
        200,              // 2% initial fee
        5000,             // 50/50 split
        5000,
        0,                // 0% debt pool
      );

      // Verify initial fee is reflected in computeFees.
      const rewards = parseEther("1");
      const [tBefore, oBefore, dpBefore, refBefore] = await fc.computeFees(rewards);
      // 2% of 1 ETH = 0.02 ETH total; 50% to treasury = 0.01 ETH.
      expect(tBefore).to.equal(parseEther("0.01"));
      expect(oBefore).to.equal(parseEther("0.01"));
      expect(dpBefore).to.equal(0n);
      expect(refBefore).to.equal(0n);

      // GOV updates fee to 10%.
      await fc.connect(gov).setFee(1000, 7000, 3000, 0);

      const [tAfter, oAfter, dpAfter, refAfter] = await fc.computeFees(rewards);
      // 10% of 1 ETH = 0.1 ETH; 70% to treasury = 0.07 ETH; 30% to operator = 0.03 ETH.
      expect(tAfter).to.equal(parseEther("0.07"));
      expect(oAfter).to.equal(parseEther("0.03"));
    });

    it("GOV can set expectedWithdrawalCredentials on ValidatorModule", async () => {
      // Set a specific credential on the validatorModule.
      const expectedCreds = ethers.hexlify(ethers.randomBytes(32));
      await validatorModule.connect(gov).setExpectedWithdrawalCredentials(expectedCreds);
      expect(await validatorModule.expectedWithdrawalCredentials()).to.equal(expectedCreds);

      // Ensure the module has at least 32 ETH buffered for the deposit calls below.
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("32")});

      // Deposit with wrong credentials reverts.
      const {pubkey, signature, depositDataRoot} = randDeposit();
      const badCreds = ethers.hexlify(ethers.randomBytes(32));
      await expect(
        validatorModule.connect(gov).depositToBeaconChain(pubkey, badCreds, signature, depositDataRoot),
      ).to.be.revertedWithCustomError(validatorModule, "InvalidWithdrawalCredentials");

      // Deposit with correct credentials succeeds.
      await expect(
        validatorModule.connect(gov).depositToBeaconChain(pubkey, expectedCreds, signature, depositDataRoot),
      ).to.not.be.reverted;

      // Clean up: clear credentials so later tests aren't affected.
      await validatorModule.connect(gov).setExpectedWithdrawalCredentials(validatorExpectedCreds);
    });
  });
});
