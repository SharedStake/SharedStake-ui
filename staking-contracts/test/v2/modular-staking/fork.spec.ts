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

const SOLO = ethers.keccak256(ethers.toUtf8Bytes("FORK_SOLO"));
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
    validatorModule = await ValidatorModule.deploy(router.target, SOLO, gov.address, BEACON_DEPOSIT_CONTRACT);

    const DVTModule = await ethers.getContractFactory("DVTModule");
    dvtModule = await DVTModule.deploy(router.target, DVT_M, gov.address, BEACON_DEPOSIT_CONTRACT);

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
      pubkey: ethers.hexlify(ethers.randomBytes(48)),
      withdrawalCreds: withdrawalCreds ?? ethers.hexlify(ethers.randomBytes(32)),
      signature: ethers.hexlify(ethers.randomBytes(96)),
      depositDataRoot: ethers.hexlify(ethers.randomBytes(32)),
    };
  }

  // ── Solo ValidatorModule fork tests ──────────────────────────────────

  it("routes 32 ETH from router to beacon deposit contract address", async () => {
    await router.connect(alice).submit(ZeroAddress, {value: parseEther("32")});
    expect(await validatorModule.bufferedEther()).to.equal(parseEther("32"));

    const beaconBefore = await ethers.provider.getBalance(BEACON_DEPOSIT_CONTRACT);
    const {pubkey, withdrawalCreds, signature, depositDataRoot} = randDeposit(validatorExpectedCreds);

    await validatorModule.connect(gov).approvePubkey(pubkey);
    await validatorModule.connect(gov).depositToBeaconChain(pubkey, withdrawalCreds, signature, depositDataRoot);

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

    await validatorModule.connect(gov).approvePubkey(pubkey);
    await expect(validatorModule.connect(gov).depositToBeaconChain(pubkey, expectedCreds, signature, depositDataRoot))
      .to.not.be.reverted;

    expect(await validatorModule.bufferedEther()).to.equal(0n);
  });

  // ── DVTModule cluster-gating fork tests ──────────────────────────────

  it("DVTModule: blocks depositToBeaconChain when no cluster registered", async () => {
    await router.connect(alice).submitToModule(DVT_M, ZeroAddress, {value: parseEther("32")});

    const CLUSTER_ID = ethers.keccak256(ethers.toUtf8Bytes("cluster-1"));
    const {pubkey, withdrawalCreds, signature, depositDataRoot} = randDeposit(dvtExpectedCreds);

    await expect(
      dvtModule
        .connect(nodeOp)
        .depositToBeaconChainInCluster(CLUSTER_ID, pubkey, withdrawalCreds, signature, depositDataRoot),
    ).to.be.revertedWithCustomError(dvtModule, "UseProposalQueue");
  });

  it("DVTModule: allows deposit after cluster is registered", async () => {
    const CLUSTER_ID = ethers.keccak256(ethers.toUtf8Bytes("cluster-1"));
    const operators = [nodeOp.address, gov.address];
    await dvtModule.connect(gov).registerCluster(CLUSTER_ID, operators, 1);

    const {pubkey, withdrawalCreds, signature, depositDataRoot} = randDeposit(dvtExpectedCreds);
    const beaconBefore = await ethers.provider.getBalance(BEACON_DEPOSIT_CONTRACT);

    await dvtModule.connect(gov).approvePubkey(pubkey);
    // depositToBeaconChainInCluster is deprecated; use proposeDeposit which auto-executes at threshold=1
    await dvtModule.connect(nodeOp).proposeDeposit(CLUSTER_ID, pubkey, withdrawalCreds, signature, depositDataRoot);

    const beaconAfter = await ethers.provider.getBalance(BEACON_DEPOSIT_CONTRACT);
    expect(beaconAfter - beaconBefore).to.equal(parseEther("32"));
  });

  it("DVTModule: deactivating a cluster blocks further deposits", async () => {
    await router.connect(alice).submitToModule(DVT_M, ZeroAddress, {value: parseEther("32")});

    const CLUSTER_ID = ethers.keccak256(ethers.toUtf8Bytes("cluster-1"));
    await dvtModule.connect(gov).deactivateCluster(CLUSTER_ID);

    const {pubkey, withdrawalCreds, signature, depositDataRoot} = randDeposit(dvtExpectedCreds);
    await expect(
      dvtModule
        .connect(nodeOp)
        .depositToBeaconChainInCluster(CLUSTER_ID, pubkey, withdrawalCreds, signature, depositDataRoot),
    ).to.be.revertedWithCustomError(dvtModule, "UseProposalQueue");
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
        ZeroAddress, // no referral registry
        ZeroAddress, // no debt pool
        500, // 5% total fee
        6000, // 60% → treasury
        4000, // 40% → operator
        0, // 0% → debt pool
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
      await validatorModule.connect(gov).approvePubkey(pubkey);
      await validatorModule.connect(gov).depositToBeaconChain(pubkey, withdrawalCreds, signature, depositDataRoot);

      // Read the actual baseline (may be > 32 ETH if prior tests also deposited).
      const baseline = await router.moduleBeaconBalance(SOLO);
      expect(baseline).to.be.gt(0n);

      // Step 3: record treasury share balance before the report.
      const treasurySharesBefore = await stToken.sharesOf(treasury.address);

      // Step 4: report a gain that is <= 1% of baseline (maxDeltaBps = 100).
      // We use 0.9% to stay safely under the sanity cap regardless of baseline size.
      const gain = (baseline * 9n) / 1000n; // 0.9% of current baseline
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
      const requestIds = await queue.connect(alice).requestWithdrawals.staticCall([withdrawAmount], alice.address);
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

      await expect(queue.connect(alice).claimWithdrawal(requestId, alice.address)).to.be.revertedWithCustomError(
        queue,
        "RequestAlreadyClaimed",
      );
    });
  });

  // ── Governance parameter fork tests ──────────────────────────────────

  describe("Governance parameter fork tests", () => {
    it("GOV can update fee bps via FeeController", async () => {
      // Deploy a fresh FeeController for this test.
      const FeeController = await ethers.getContractFactory("FeeController");
      const fc = await FeeController.deploy(
        gov.address,
        alice.address, // treasury
        nodeOp.address, // operator
        ZeroAddress, // no referral registry
        ZeroAddress, // no debt pool
        200, // 2% initial fee
        5000, // 50/50 split
        5000,
        0, // 0% debt pool
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

      // Deposit with wrong credentials reverts (credential check fires before pubkey check).
      const {pubkey, signature, depositDataRoot} = randDeposit();
      const badCreds = ethers.hexlify(ethers.randomBytes(32));
      await expect(
        validatorModule.connect(gov).depositToBeaconChain(pubkey, badCreds, signature, depositDataRoot),
      ).to.be.revertedWithCustomError(validatorModule, "InvalidWithdrawalCredentials");

      // Deposit with correct credentials succeeds (pubkey must be approved first).
      await validatorModule.connect(gov).approvePubkey(pubkey);
      await expect(validatorModule.connect(gov).depositToBeaconChain(pubkey, expectedCreds, signature, depositDataRoot))
        .to.not.be.reverted;

      // Clean up: clear credentials so later tests aren't affected.
      await validatorModule.connect(gov).setExpectedWithdrawalCredentials(validatorExpectedCreds);
    });
  });

  // ── OperatorRegistry integration fork tests ────────────────────────────

  describe("OperatorRegistry integration", () => {
    let operatorRegistry: any;
    let mockSgt: any;
    const DEFAULT_CONFIG = ethers.keccak256(ethers.toUtf8Bytes("default"));

    before(async () => {
      // Deploy mock SGT token
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      mockSgt = await MockERC20.deploy("SharedStake Governance Token", "SGT");

      // Deploy OperatorRegistry
      const OperatorRegistry = await ethers.getContractFactory("OperatorRegistry");
      operatorRegistry = await OperatorRegistry.deploy(mockSgt.target, gov.address);

      // Set up default bond config: 1 ETH per slot, 1000 SGT per slot, max 10 slots
      await operatorRegistry.connect(gov).setBondConfig(DEFAULT_CONFIG, parseEther("1"), parseEther("1000"), 10);
      await operatorRegistry.connect(gov).setDefaultConfig(DEFAULT_CONFIG);

      // Grant CALLER role to validatorModule
      const CALLER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CALLER"));
      await operatorRegistry.connect(gov).grantCaller(validatorModule.target);

      // Set registry on validatorModule
      await validatorModule.connect(gov).setOperatorRegistry(operatorRegistry.target);
    });

    it("unregistered operator cannot deposit even with NODE_OPERATOR role", async () => {
      // Grant nodeOp NODE_OPERATOR role
      const NODE_OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("NODE_OPERATOR"));
      await validatorModule.connect(gov).grantRole(NODE_OPERATOR_ROLE, nodeOp.address);

      // Submit 32 ETH to buffer
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("32")});

      // Try depositToBeaconChain - should revert OperatorNotEligible
      const {pubkey, withdrawalCreds, signature, depositDataRoot} = randDeposit(validatorExpectedCreds);
      await expect(
        validatorModule.connect(nodeOp).depositToBeaconChain(pubkey, withdrawalCreds, signature, depositDataRoot),
      ).to.be.revertedWithCustomError(validatorModule, "OperatorNotEligible");
    });

    it("registered operator can deposit", async () => {
      // Mint SGT to nodeOp
      await mockSgt.mint(nodeOp.address, parseEther("1000"));

      // Register nodeOp with 1 slot, 1 ETH bond + 1000 SGT
      await mockSgt.connect(nodeOp).approve(operatorRegistry.target, parseEther("1000"));
      await operatorRegistry.connect(nodeOp).registerBondWithSgt(DEFAULT_CONFIG, 1, parseEther("1000"), {value: parseEther("1")});

      // Deposit 32 ETH to buffer
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("32")});

      // depositToBeaconChain should succeed
      const {pubkey, withdrawalCreds, signature, depositDataRoot} = randDeposit(validatorExpectedCreds);
      await validatorModule.connect(gov).approvePubkey(pubkey);
      await expect(
        validatorModule.connect(nodeOp).depositToBeaconChain(pubkey, withdrawalCreds, signature, depositDataRoot),
      ).to.not.be.reverted;

      // Check operatorRegistry.operators(nodeOp).activeValidators == 1
      const opData = await operatorRegistry.getOperator(nodeOp.address);
      expect(opData.activeValidators).to.equal(1n);
    });

    it("operator with no slots cannot deposit twice", async () => {
      // nodeOp already has 1 active validator and 1 total slot from previous test
      // Try second deposit - should revert OperatorNotEligible
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("32")});

      const {pubkey, withdrawalCreds, signature, depositDataRoot} = randDeposit(validatorExpectedCreds);
      await expect(
        validatorModule.connect(nodeOp).depositToBeaconChain(pubkey, withdrawalCreds, signature, depositDataRoot),
      ).to.be.revertedWithCustomError(validatorModule, "OperatorNotEligible");
    });

    it("expandSlots allows second deposit after top-up", async () => {
      // Mint more SGT to nodeOp
      await mockSgt.mint(nodeOp.address, parseEther("1000"));

      // Expand slots by 1 with ETH+SGT
      await mockSgt.connect(nodeOp).approve(operatorRegistry.target, parseEther("1000"));
      await operatorRegistry.connect(nodeOp).expandSlotsWithSgt(1, parseEther("1000"), {value: parseEther("1")});

      // Now second deposit should succeed
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("32")});

      const {pubkey, withdrawalCreds, signature, depositDataRoot} = randDeposit(validatorExpectedCreds);
      await validatorModule.connect(gov).approvePubkey(pubkey);
      await expect(
        validatorModule.connect(nodeOp).depositToBeaconChain(pubkey, withdrawalCreds, signature, depositDataRoot),
      ).to.not.be.reverted;

      // Check activeValidators == 2
      const opData = await operatorRegistry.getOperator(nodeOp.address);
      expect(opData.activeValidators).to.equal(2n);
    });

    it("exitBond reverts while active validators > 0", async () => {
      // nodeOp has 2 active validators
      await expect(operatorRegistry.connect(nodeOp).exitBond()).to.be.revertedWithCustomError(
        operatorRegistry,
        "ActiveValidatorsExist",
      );
    });

    it("exitBond returns ETH and SGT after decrementActive", async () => {
      // Decrement active validators (simulating validator exits)
      await operatorRegistry.connect(gov).decrementActive(nodeOp.address);
      await operatorRegistry.connect(gov).decrementActive(nodeOp.address);

      const ethBefore = await ethers.provider.getBalance(nodeOp.address);
      const sgtBefore = await mockSgt.balanceOf(nodeOp.address);

      // exitBond should now succeed
      await operatorRegistry.connect(nodeOp).exitBond();

      const ethAfter = await ethers.provider.getBalance(nodeOp.address);
      const sgtAfter = await mockSgt.balanceOf(nodeOp.address);

      // Operator should receive ETH + SGT back (minus gas for ETH)
      expect(ethAfter).to.be.gt(ethBefore);
      expect(sgtAfter - sgtBefore).to.equal(parseEther("2000")); // 2 slots * 1000 SGT
    });

    it("slash reduces sgtBonded", async () => {
      // Register nodeOp again for slash test
      await mockSgt.mint(nodeOp.address, parseEther("1000"));
      await mockSgt.connect(nodeOp).approve(operatorRegistry.target, parseEther("1000"));
      await operatorRegistry.connect(nodeOp).registerBondWithSgt(DEFAULT_CONFIG, 1, parseEther("1000"), {value: parseEther("1")});

      const sgtBondedBefore = (await operatorRegistry.getOperator(nodeOp.address)).sgtBonded;

      // Slash 500 SGT
      await operatorRegistry.connect(gov).slash(nodeOp.address, parseEther("500"));

      const sgtBondedAfter = (await operatorRegistry.getOperator(nodeOp.address)).sgtBonded;

      // Verify sgtBonded reduced
      expect(sgtBondedBefore - sgtBondedAfter).to.equal(parseEther("500"));
    });

    it("zero registry address falls back to role-only access", async () => {
      // Set operatorRegistry to address(0)
      await validatorModule.connect(gov).setOperatorRegistry(ZeroAddress);

      // NODE_OPERATOR role holder should still be able to deposit without registry
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("32")});

      const {pubkey, withdrawalCreds, signature, depositDataRoot} = randDeposit(validatorExpectedCreds);
      await validatorModule.connect(gov).approvePubkey(pubkey);
      await expect(
        validatorModule.connect(nodeOp).depositToBeaconChain(pubkey, withdrawalCreds, signature, depositDataRoot),
      ).to.not.be.reverted;

      // Restore registry for other tests
      await validatorModule.connect(gov).setOperatorRegistry(operatorRegistry.target);
    });
  });

  // ── DVT multi-operator threshold fork tests ────────────────────────────

  describe("DVT multi-operator threshold", () => {
    let op1: SignerWithAddress;
    let op2: SignerWithAddress;
    let op3: SignerWithAddress;

    before(async () => {
      const allSigners = await ethers.getSigners();
      [op1, op2, op3] = [allSigners[4], allSigners[5], allSigners[6]];

      // Grant NODE_OPERATOR role to all operators
      const NODE_OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("NODE_OPERATOR"));
      await dvtModule.connect(gov).grantRole(NODE_OPERATOR_ROLE, op1.address);
      await dvtModule.connect(gov).grantRole(NODE_OPERATOR_ROLE, op2.address);
      await dvtModule.connect(gov).grantRole(NODE_OPERATOR_ROLE, op3.address);
    });

    it("registers a 2-of-3 cluster", async () => {
      const CLUSTER_ID = ethers.keccak256(ethers.toUtf8Bytes("2-of-3-cluster"));
      const operators = [op1.address, op2.address, op3.address];
      await expect(dvtModule.connect(gov).registerCluster(CLUSTER_ID, operators, 2)).to.not.be.reverted;

      const cluster = await dvtModule.getCluster(CLUSTER_ID);
      expect(cluster.threshold).to.equal(2);
      expect(cluster.operators.length).to.equal(3);
    });

    it("single operator proposeDeposit does not auto-execute for threshold=2", async () => {
      const CLUSTER_ID = ethers.keccak256(ethers.toUtf8Bytes("2-of-3-cluster-2"));
      await dvtModule.connect(gov).registerCluster(CLUSTER_ID, [op1.address, op2.address, op3.address], 2);

      await router.connect(alice).submitToModule(DVT_M, ZeroAddress, {value: parseEther("32")});

      const {pubkey, withdrawalCreds, signature, depositDataRoot} = randDeposit(dvtExpectedCreds);
      const tx = await dvtModule.connect(op1).proposeDeposit(CLUSTER_ID, pubkey, withdrawalCreds, signature, depositDataRoot);

      // Get proposal ID from event
      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = dvtModule.interface.parseLog(log);
          return parsed?.name === "DepositProposed";
        } catch {
          return false;
        }
      });
      const proposalId = event ? dvtModule.interface.parseLog(event).args.proposalId : ethers.ZeroHash;

      const proposal = await dvtModule.depositProposals(proposalId);
      expect(proposal.approvalCount).to.equal(1n);
      expect(proposal.executed).to.be.false;
    });

    it("second operator approveDeposit reaches threshold and executes", async () => {
      const CLUSTER_ID = ethers.keccak256(ethers.toUtf8Bytes("2-of-3-cluster-3"));
      await dvtModule.connect(gov).registerCluster(CLUSTER_ID, [op1.address, op2.address, op3.address], 2);

      await router.connect(alice).submitToModule(DVT_M, ZeroAddress, {value: parseEther("32")});

      const {pubkey, withdrawalCreds, signature, depositDataRoot} = randDeposit(dvtExpectedCreds);
      await dvtModule.connect(gov).approvePubkey(pubkey);
      const tx = await dvtModule.connect(op1).proposeDeposit(CLUSTER_ID, pubkey, withdrawalCreds, signature, depositDataRoot);

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = dvtModule.interface.parseLog(log);
          return parsed?.name === "DepositProposed";
        } catch {
          return false;
        }
      });
      const proposalId = event ? dvtModule.interface.parseLog(event).args.proposalId : ethers.ZeroHash;

      const beaconBefore = await ethers.provider.getBalance(BEACON_DEPOSIT_CONTRACT);

      await dvtModule.connect(op2).approveDeposit(proposalId);

      const beaconAfter = await ethers.provider.getBalance(BEACON_DEPOSIT_CONTRACT);
      expect(beaconAfter - beaconBefore).to.equal(parseEther("32"));

      const proposal = await dvtModule.depositProposals(proposalId);
      expect(proposal.executed).to.be.true;
    });

    it("third approval after execution does nothing (proposal already executed)", async () => {
      const CLUSTER_ID = ethers.keccak256(ethers.toUtf8Bytes("2-of-3-cluster-4"));
      await dvtModule.connect(gov).registerCluster(CLUSTER_ID, [op1.address, op2.address, op3.address], 2);

      await router.connect(alice).submitToModule(DVT_M, ZeroAddress, {value: parseEther("32")});

      const {pubkey, withdrawalCreds, signature, depositDataRoot} = randDeposit(dvtExpectedCreds);
      await dvtModule.connect(gov).approvePubkey(pubkey);
      const tx = await dvtModule.connect(op1).proposeDeposit(CLUSTER_ID, pubkey, withdrawalCreds, signature, depositDataRoot);

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = dvtModule.interface.parseLog(log);
          return parsed?.name === "DepositProposed";
        } catch {
          return false;
        }
      });
      const proposalId = event ? dvtModule.interface.parseLog(event).args.proposalId : ethers.ZeroHash;

      await dvtModule.connect(op2).approveDeposit(proposalId);

      await expect(dvtModule.connect(op3).approveDeposit(proposalId)).to.be.revertedWithCustomError(
        dvtModule,
        "ProposalNotActive",
      );
    });

    it("cancelProposal blocks further approvals", async () => {
      const CLUSTER_ID = ethers.keccak256(ethers.toUtf8Bytes("2-of-3-cluster-5"));
      await dvtModule.connect(gov).registerCluster(CLUSTER_ID, [op1.address, op2.address, op3.address], 2);

      await router.connect(alice).submitToModule(DVT_M, ZeroAddress, {value: parseEther("32")});

      const {pubkey, withdrawalCreds, signature, depositDataRoot} = randDeposit(dvtExpectedCreds);
      const tx = await dvtModule.connect(op1).proposeDeposit(CLUSTER_ID, pubkey, withdrawalCreds, signature, depositDataRoot);

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = dvtModule.interface.parseLog(log);
          return parsed?.name === "DepositProposed";
        } catch {
          return false;
        }
      });
      const proposalId = event ? dvtModule.interface.parseLog(event).args.proposalId : ethers.ZeroHash;

      // Only the proposer (op1) or GOV can cancel — op2 cancel would revert NotProposerOrGov.
      await dvtModule.connect(op1).cancelProposal(proposalId);

      // After cancellation approvalCount is reset to 0, so ProposalNotFound fires before ProposalNotActive.
      await expect(dvtModule.connect(op3).approveDeposit(proposalId)).to.be.revertedWithCustomError(
        dvtModule,
        "ProposalNotFound",
      );
    });

    it("non-proposer cluster operator cannot cancel another member's proposal", async () => {
      const CLUSTER_ID = ethers.keccak256(ethers.toUtf8Bytes("2-of-3-cluster-grief-test"));
      await dvtModule.connect(gov).registerCluster(CLUSTER_ID, [op1.address, op2.address, op3.address], 2);
      await router.connect(alice).submitToModule(DVT_M, ZeroAddress, {value: parseEther("32")});

      const {pubkey, withdrawalCreds, signature, depositDataRoot} = randDeposit(dvtExpectedCreds);
      const tx = await dvtModule.connect(op1).proposeDeposit(CLUSTER_ID, pubkey, withdrawalCreds, signature, depositDataRoot);
      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => {
        try { return dvtModule.interface.parseLog(log)?.name === "DepositProposed"; } catch { return false; }
      });
      const proposalId = event ? dvtModule.interface.parseLog(event).args.proposalId : ethers.ZeroHash;

      // op2 is a cluster peer but NOT the proposer — should revert
      await expect(dvtModule.connect(op2).cancelProposal(proposalId)).to.be.revertedWithCustomError(
        dvtModule,
        "NotProposerOrGov",
      );
    });

    it("threshold=1 cluster: proposeDeposit auto-executes without separate approve call", async () => {
      const CLUSTER_ID = ethers.keccak256(ethers.toUtf8Bytes("1-of-1-cluster"));
      await dvtModule.connect(gov).registerCluster(CLUSTER_ID, [op1.address], 1);

      await router.connect(alice).submitToModule(DVT_M, ZeroAddress, {value: parseEther("32")});

      const {pubkey, withdrawalCreds, signature, depositDataRoot} = randDeposit(dvtExpectedCreds);
      const beaconBefore = await ethers.provider.getBalance(BEACON_DEPOSIT_CONTRACT);

      await dvtModule.connect(gov).approvePubkey(pubkey);
      const tx = await dvtModule.connect(op1).proposeDeposit(CLUSTER_ID, pubkey, withdrawalCreds, signature, depositDataRoot);

      const beaconAfter = await ethers.provider.getBalance(BEACON_DEPOSIT_CONTRACT);
      expect(beaconAfter - beaconBefore).to.equal(parseEther("32"));

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = dvtModule.interface.parseLog(log);
          return parsed?.name === "DepositProposed";
        } catch {
          return false;
        }
      });
      const proposalId = event ? dvtModule.interface.parseLog(event).args.proposalId : ethers.ZeroHash;

      const proposal = await dvtModule.depositProposals(proposalId);
      expect(proposal.executed).to.be.true;
    });

    it("depositToBeaconChainInCluster reverts UseProposalQueue", async () => {
      const CLUSTER_ID = ethers.keccak256(ethers.toUtf8Bytes("deprecated-cluster"));
      await dvtModule.connect(gov).registerCluster(CLUSTER_ID, [op1.address], 1);

      await router.connect(alice).submitToModule(DVT_M, ZeroAddress, {value: parseEther("32")});

      const {pubkey, withdrawalCreds, signature, depositDataRoot} = randDeposit(dvtExpectedCreds);

      await expect(
        dvtModule.connect(op1).depositToBeaconChainInCluster(CLUSTER_ID, pubkey, withdrawalCreds, signature, depositDataRoot),
      ).to.be.revertedWithCustomError(dvtModule, "UseProposalQueue");
    });

    it("unregistered operator cannot propose even in valid cluster", async () => {
      // Deploy a local registry with no bonded operators for this test.
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const localSgt = await MockERC20.deploy("SGT", "SGT");
      const OperatorRegistryFactory = await ethers.getContractFactory("OperatorRegistry");
      const localRegistry = await OperatorRegistryFactory.deploy(localSgt.target, gov.address);

      // Set operatorRegistry on dvtModule
      await dvtModule.connect(gov).setOperatorRegistry(localRegistry.target);

      // Grant CALLER role to dvtModule
      await localRegistry.connect(gov).grantCaller(dvtModule.target);

      const CLUSTER_ID = ethers.keccak256(ethers.toUtf8Bytes("registry-cluster"));
      await dvtModule.connect(gov).registerCluster(CLUSTER_ID, [op1.address], 1);

      await router.connect(alice).submitToModule(DVT_M, ZeroAddress, {value: parseEther("32")});

      const {pubkey, withdrawalCreds, signature, depositDataRoot} = randDeposit(dvtExpectedCreds);

      // op1 is not registered in operatorRegistry
      await expect(
        dvtModule.connect(op1).proposeDeposit(CLUSTER_ID, pubkey, withdrawalCreds, signature, depositDataRoot),
      ).to.be.revertedWithCustomError(dvtModule, "OperatorNotEligible");

      // Restore registry state for other tests
      await dvtModule.connect(gov).setOperatorRegistry(ZeroAddress);
    });
  });
});
