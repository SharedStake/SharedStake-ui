/**
 * Unit tests for StakingRouter:
 *   - Module registration & metadata
 *   - submit() default-module routing
 *   - submitToModule() targeted routing
 *   - Mint cap enforcement (per module)
 *   - Pause guard (PAUSE_SUBMIT) and per-module pause
 *   - Module beacon balance reporting (delta-only accounting)
 *   - Default module switching
 *   - Access control matrix
 */
import {ethers} from "hardhat";
import {expect} from "chai";
import {parseEther, ZeroAddress} from "ethers";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

const SOLO = ethers.keccak256(ethers.toUtf8Bytes("SOLO_MOD_1"));
const SECONDARY = ethers.keccak256(ethers.toUtf8Bytes("SOLO_MOD_2"));
const WRONG_ID = ethers.keccak256(ethers.toUtf8Bytes("SOLO_MOD_WRONG"));
const POLICY = ethers.keccak256(ethers.toUtf8Bytes("INSTITUTIONAL_POLICY_A"));
const SOURCE_A = ethers.keccak256(ethers.toUtf8Bytes("SOURCE_ATTR_A"));
const SOURCE_B = ethers.keccak256(ethers.toUtf8Bytes("SOURCE_ATTR_B"));
const REFERRAL_CODE_A = ethers.keccak256(ethers.toUtf8Bytes("ALICE_CODE_A"));
const REFERRAL_CODE_MISSING = ethers.keccak256(ethers.toUtf8Bytes("MISSING_CODE"));

describe("StakingRouter", () => {
  let deployer: SignerWithAddress,
    gov: SignerWithAddress,
    guardian: SignerWithAddress,
    alice: SignerWithAddress,
    bob: SignerWithAddress,
    oracle: SignerWithAddress,
    impostor: SignerWithAddress;

  let stToken: any, router: any, mod1: any, mod2: any, feeController: any;

  const ORACLE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ORACLE"));
  const GOV_ROLE = ethers.keccak256(ethers.toUtf8Bytes("GOV"));
  const GUARDIAN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("GUARDIAN"));
  const NODE_OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("NODE_OPERATOR"));

  let mockBeaconDeposit: any;
  let expectedWithdrawalCreds: string;

  async function runtimeCodeHash(addr: string): Promise<string> {
    const code = await ethers.provider.getCode(addr);
    return ethers.keccak256(code);
  }

  async function impersonateAccount(account: string): Promise<any> {
    await ethers.provider.send("hardhat_impersonateAccount", [account]);
    await ethers.provider.send("hardhat_setBalance", [account, ethers.toBeHex(parseEther("1"))]);
    return await ethers.getSigner(account);
  }

  async function stopImpersonatingAccount(account: string) {
    await ethers.provider.send("hardhat_stopImpersonatingAccount", [account]);
  }

  async function deployFresh() {
    [deployer, gov, guardian, alice, bob, oracle, impostor] = await ethers.getSigners();

    const StToken = await ethers.getContractFactory("StToken");
    stToken = await StToken.deploy();

    const FeeController = await ethers.getContractFactory("FeeController");
    feeController = await FeeController.deploy(
      gov.address,
      gov.address, // treasury
      deployer.address, // operator
      ZeroAddress, // referral registry (unused in this suite)
      ZeroAddress, // debt pool (disabled)
      1000,
      5000,
      5000,
      0,
    );

    const StakingRouter = await ethers.getContractFactory("StakingRouter");
    router = await StakingRouter.deploy(stToken.target, gov.address);

    // Mock beacon deposit contract for hardhat tests — accepts ETH without
    // performing real validator processing.
    const MockBeaconDeposit = await ethers.getContractFactory("MockBeaconDeposit");
    mockBeaconDeposit = await MockBeaconDeposit.deploy();

    const ValidatorModule = await ethers.getContractFactory("ValidatorModule");
    mod1 = await ValidatorModule.deploy(router.target, SOLO, gov.address, mockBeaconDeposit.target);
    mod2 = await ValidatorModule.deploy(router.target, SECONDARY, gov.address, mockBeaconDeposit.target);

    // Grant router MINTER on stToken.
    await stToken.addMinter(router.target);

    // GOV wires fee controller, registers module, sets default.
    await router.connect(gov).setFeeController(feeController.target);
    await router.connect(gov).registerModule(SOLO, mod1.target, parseEther("100"));
    await router.connect(gov).setDefaultModule(SOLO);

    // GOV grants guardian role to dedicated guardian signer for tests.
    await router.connect(gov).grantRole(GUARDIAN_ROLE, guardian.address);

    // Oracle signer gets ORACLE on the module so it can call reportBeacon.
    await mod1.connect(gov).grantRole(ORACLE_ROLE, oracle.address);

    // Gov gets NODE_OPERATOR on mod1 so tests can drive depositToBeaconChain.
    await mod1.connect(gov).grantRole(NODE_OPERATOR_ROLE, gov.address);
    expectedWithdrawalCreds = ethers.hexlify(ethers.randomBytes(32));
    await mod1.connect(gov).setExpectedWithdrawalCredentials(expectedWithdrawalCreds);
    await mod2.connect(gov).setExpectedWithdrawalCredentials(expectedWithdrawalCreds);
  }

  beforeEach(deployFresh);

  // ── Module registration ────────────────────────────────────────────────────

  describe("Module registration", () => {
    it("registers module with addr/type/cap, marks active", async () => {
      const info = await router.modules(SOLO);
      expect(info.addr).to.equal(mod1.target);
      expect(info.moduleType).to.equal(ethers.keccak256(ethers.toUtf8Bytes("SOLO_VALIDATOR")));
      expect(info.mintCapEth).to.equal(parseEther("100"));
      expect(info.active).to.be.true;
      expect(info.paused).to.be.false;
    });

    it("reverts on duplicate registration", async () => {
      await expect(
        router.connect(gov).registerModule(SOLO, mod1.target, parseEther("50")),
      ).to.be.revertedWithCustomError(router, "ModuleAlreadyRegistered");
    });

    it("rejects re-registering the same module address under a different id", async () => {
      await expect(
        router.connect(gov).registerModule(SECONDARY, mod1.target, parseEther("50")),
      ).to.be.revertedWithCustomError(router, "ModuleAddressAlreadyRegistered");
    });

    it("non-GOV cannot register a module", async () => {
      await expect(router.connect(alice).registerModule(SECONDARY, mod2.target, 0)).to.be.reverted;
    });

    it("rejects zero address module", async () => {
      await expect(router.connect(gov).registerModule(SECONDARY, ZeroAddress, 0)).to.be.reverted;
    });

    it("rejects non-contract module addresses", async () => {
      await expect(router.connect(gov).registerModule(SECONDARY, alice.address, 0)).to.be.revertedWithCustomError(
        router,
        "ModuleAddressNotContract",
      );
    });

    it("rejects registration when module is wired to a different router", async () => {
      const StakingRouter = await ethers.getContractFactory("StakingRouter");
      const foreignRouter = await StakingRouter.deploy(stToken.target, gov.address);

      const ValidatorModule = await ethers.getContractFactory("ValidatorModule");
      const foreignModule = await ValidatorModule.deploy(
        foreignRouter.target,
        SECONDARY,
        gov.address,
        mockBeaconDeposit.target,
      );

      await expect(
        router.connect(gov).registerModule(SECONDARY, foreignModule.target, 0),
      ).to.be.revertedWithCustomError(router, "ModuleRouterMismatch");
    });

    it("rejects registration when module internal id does not match router id", async () => {
      const ValidatorModule = await ethers.getContractFactory("ValidatorModule");
      const wrongIdModule = await ValidatorModule.deploy(
        router.target,
        SECONDARY,
        gov.address,
        mockBeaconDeposit.target,
      );

      await expect(router.connect(gov).registerModule(WRONG_ID, wrongIdModule.target, 0)).to.be.revertedWithCustomError(
        router,
        "ModuleIdMismatch",
      );
    });

    it("enforced code-hash allowlist blocks unallowlisted module registration", async () => {
      const StakingRouter = await ethers.getContractFactory("StakingRouter");
      const router2 = await StakingRouter.deploy(stToken.target, gov.address);

      const ValidatorModule = await ethers.getContractFactory("ValidatorModule");
      const mod = await ValidatorModule.deploy(router2.target, SECONDARY, gov.address, mockBeaconDeposit.target);

      await router2.connect(gov).enableCodeHashEnforcement();
      await expect(router2.connect(gov).registerModule(SECONDARY, mod.target, 0)).to.be.revertedWithCustomError(
        router2,
        "ModuleCodeHashNotAllowed",
      );

      const moduleType = await mod.moduleType();
      const codeHash = await runtimeCodeHash(mod.target as string);
      await router2.connect(gov).setModuleCodeHashAllowed(moduleType, codeHash, true);

      await expect(router2.connect(gov).registerModule(SECONDARY, mod.target, 0)).to.not.be.reverted;
    });
  });

  // ── Deposits via submit() ───────────────────────────────────────────────────

  describe("submit() (default module)", () => {
    async function wireReferralCodePath(referrerAddress: string) {
      const ReferralRegistry = await ethers.getContractFactory("ReferralRegistry");
      const referralRegistry = await ReferralRegistry.deploy(gov.address, stToken.target);
      await referralRegistry.connect(gov).grantRole(await referralRegistry.ROUTER(), router.target);
      await feeController
        .connect(gov)
        .setRecipients(gov.address, deployer.address, referralRegistry.target, ZeroAddress);

      const ReferralCodeRegistry = await ethers.getContractFactory("ReferralCodeRegistry");
      const referralCodeRegistry = await ReferralCodeRegistry.deploy(gov.address);
      await referralCodeRegistry
        .connect(gov)
        .registerReferralCode(
          REFERRAL_CODE_A,
          referrerAddress,
          ethers.keccak256(ethers.toUtf8Bytes("campaign:router-test")),
        );
      await router.connect(gov).setReferralCodeRegistry(referralCodeRegistry.target);

      return {referralRegistry, referralCodeRegistry};
    }

    it("routes 1 ETH to default module, mints 1:1 shares (bootstrap)", async () => {
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("1")});
      expect(await stToken.sharesOf(alice.address)).to.equal(parseEther("1"));
      expect(await stToken.totalPooledEther()).to.equal(parseEther("1"));
      expect(await mod1.bufferedEther()).to.equal(parseEther("1"));
    });

    it("emits Deposited with moduleId and referral", async () => {
      const amount = parseEther("2");
      await expect(router.connect(alice).submit(bob.address, {value: amount}))
        .to.emit(router, "Deposited")
        .withArgs(SOLO, alice.address, amount, amount, bob.address); // 1:1 bootstrap
    });

    it("submitWithSource emits attribution telemetry and mints shares on default module", async () => {
      const amount = parseEther("2");
      await expect(router.connect(alice).submitWithSource(bob.address, SOURCE_A, {value: amount}))
        .to.emit(router, "DepositAttributed")
        .withArgs(SOLO, alice.address, SOURCE_A, amount, amount, bob.address);

      expect(await stToken.sharesOf(alice.address)).to.equal(amount);
      expect(await stToken.totalPooledEther()).to.equal(amount);
      expect(await mod1.bufferedEther()).to.equal(amount);
    });

    it("submitWithReferralCode resolves code on-chain and records canonical referrer", async () => {
      const amount = parseEther("1");
      const {referralRegistry} = await wireReferralCodePath(bob.address);

      await expect(router.connect(alice).submitWithReferralCode(REFERRAL_CODE_A, {value: amount}))
        .to.emit(router, "Deposited")
        .withArgs(SOLO, alice.address, amount, amount, bob.address);

      expect(await referralRegistry.referrerOf(alice.address)).to.equal(bob.address);
    });

    it("submitWithReferralCode falls back to zero referral when resolver is unset", async () => {
      const amount = parseEther("1");
      await expect(router.connect(alice).submitWithReferralCode(REFERRAL_CODE_A, {value: amount}))
        .to.emit(router, "Deposited")
        .withArgs(SOLO, alice.address, amount, amount, ZeroAddress);
    });

    it("submitWithReferralCode falls back to zero referral when code is not registered", async () => {
      const amount = parseEther("1");
      await wireReferralCodePath(bob.address);

      await expect(router.connect(alice).submitWithReferralCode(REFERRAL_CODE_MISSING, {value: amount}))
        .to.emit(router, "Deposited")
        .withArgs(SOLO, alice.address, amount, amount, ZeroAddress);
    });

    it("submitWithReferralCode falls back to zero referral when resolver reverts", async () => {
      const amount = parseEther("1");
      const RevertingResolver = await ethers.getContractFactory("RevertingReferralCodeRegistry");
      const revertingResolver = await RevertingResolver.deploy();
      await router.connect(gov).setReferralCodeRegistry(revertingResolver.target);

      await expect(router.connect(alice).submitWithReferralCode(REFERRAL_CODE_A, {value: amount}))
        .to.emit(router, "Deposited")
        .withArgs(SOLO, alice.address, amount, amount, ZeroAddress);
    });

    it("submitWithSourceAndReferralCode emits attribution with resolved referral", async () => {
      const amount = parseEther("1");
      await wireReferralCodePath(bob.address);

      await expect(router.connect(alice).submitWithSourceAndReferralCode(REFERRAL_CODE_A, SOURCE_A, {value: amount}))
        .to.emit(router, "DepositAttributed")
        .withArgs(SOLO, alice.address, SOURCE_A, amount, amount, bob.address);
    });

    it("default submit path is unchanged and does not emit attribution telemetry", async () => {
      const amount = parseEther("1");
      const tx = await router.connect(alice).submit(ZeroAddress, {value: amount});
      const receipt = await tx.wait();

      const attributionLogs = receipt!.logs.filter((log: any) => {
        try {
          return router.interface.parseLog(log)?.name === "DepositAttributed";
        } catch {
          return false;
        }
      });

      expect(attributionLogs.length).to.equal(0);
      expect(await stToken.sharesOf(alice.address)).to.equal(amount);
      expect(await stToken.totalPooledEther()).to.equal(amount);
      expect(await mod1.bufferedEther()).to.equal(amount);
    });

    it("reverts when msg.value == 0", async () => {
      await expect(router.connect(alice).submit(ZeroAddress, {value: 0})).to.be.reverted;
    });

    it("plain ETH transfer reverts when msg.value == 0", async () => {
      await expect(alice.sendTransaction({to: router.target, value: 0})).to.be.reverted;
    });

    it("reverts if defaultModuleId not set", async () => {
      // Deploy a fresh router with no default set.
      const StakingRouter = await ethers.getContractFactory("StakingRouter");
      const router2 = await StakingRouter.deploy(stToken.target, gov.address);
      await expect(router2.connect(alice).submit(ZeroAddress, {value: parseEther("1")})).to.be.revertedWithCustomError(
        router2,
        "DefaultModuleNotSet",
      );
    });

    it("reverts tiny deposits when the current exchange rate would mint zero shares", async () => {
      await router.connect(gov).setMaxDeltaBps(1000);
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("32")});

      const pubkey = ethers.hexlify(ethers.randomBytes(48));
      const creds = expectedWithdrawalCreds;
      const sig = ethers.hexlify(ethers.randomBytes(96));
      const root = ethers.hexlify(ethers.randomBytes(32));
      await mod1.connect(gov).depositToBeaconChain(pubkey, creds, sig, root);
      await mod1.connect(oracle).reportBeacon(1, parseEther("33"));

      await expect(router.connect(bob).submit(ZeroAddress, {value: 1n})).to.be.reverted;
    });

    it("setReferralCodeRegistry is GOV-only", async () => {
      const ReferralCodeRegistry = await ethers.getContractFactory("ReferralCodeRegistry");
      const referralCodeRegistry = await ReferralCodeRegistry.deploy(gov.address);
      await expect(router.connect(alice).setReferralCodeRegistry(referralCodeRegistry.target)).to.be.reverted;
    });
  });

  // ── submitToModule ─────────────────────────────────────────────────────────

  describe("submitToModule()", () => {
    beforeEach(async () => {
      await router.connect(gov).registerModule(SECONDARY, mod2.target, 0);
    });

    it("routes to chosen module, leaves default-module buffer untouched", async () => {
      await router.connect(alice).submitToModule(SECONDARY, ZeroAddress, {value: parseEther("3")});
      expect(await mod2.bufferedEther()).to.equal(parseEther("3"));
      expect(await mod1.bufferedEther()).to.equal(0n);
    });

    it("submitToModuleWithSource emits attribution telemetry and routes to chosen module", async () => {
      const amount = parseEther("3");
      await expect(router.connect(alice).submitToModuleWithSource(SECONDARY, bob.address, SOURCE_B, {value: amount}))
        .to.emit(router, "DepositAttributed")
        .withArgs(SECONDARY, alice.address, SOURCE_B, amount, amount, bob.address);

      expect(await mod2.bufferedEther()).to.equal(amount);
      expect(await mod1.bufferedEther()).to.equal(0n);
      expect(await stToken.sharesOf(alice.address)).to.equal(amount);
    });

    it("reverts on unregistered module id", async () => {
      const fake = ethers.keccak256(ethers.toUtf8Bytes("DOES_NOT_EXIST"));
      await expect(
        router.connect(alice).submitToModule(fake, ZeroAddress, {value: parseEther("1")}),
      ).to.be.revertedWithCustomError(router, "ModuleNotRegistered");
    });
  });

  // ── Mint cap ───────────────────────────────────────────────────────────────

  describe("Mint cap enforcement", () => {
    it("rejects deposit that would exceed cap", async () => {
      // Cap is 100 ETH on SOLO. Fill with 99, then try 2 more.
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("99")});
      await expect(router.connect(alice).submit(ZeroAddress, {value: parseEther("2")})).to.be.revertedWithCustomError(
        router,
        "MintCapExceeded",
      );
    });

    it("accepts deposit exactly at cap", async () => {
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("100")});
      expect(await mod1.totalEth()).to.equal(parseEther("100"));
    });

    it("cap=0 means unlimited", async () => {
      await router.connect(gov).setMintCap(SOLO, 0);
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("500")});
      expect(await mod1.bufferedEther()).to.equal(parseEther("500"));
    });

    it("counts pending beacon principal toward cap during report lag window", async () => {
      await router.connect(gov).setMintCap(SOLO, parseEther("64"));
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("64")});

      const pubkey = ethers.hexlify(ethers.randomBytes(48));
      const creds = expectedWithdrawalCreds;
      const sig = ethers.hexlify(ethers.randomBytes(96));
      const root = ethers.hexlify(ethers.randomBytes(32));
      await mod1.connect(gov).depositToBeaconChain(pubkey, creds, sig, root);

      // Module's internal totalEth() is temporarily lower until the next report,
      // but cap checks must include pending principal tracked by the router.
      expect(await mod1.totalEth()).to.equal(parseEther("32"));
      expect(await router.moduleBeaconBalance(SOLO)).to.equal(parseEther("32"));

      await expect(router.connect(bob).submit(ZeroAddress, {value: parseEther("1")})).to.be.revertedWithCustomError(
        router,
        "MintCapExceeded",
      );
    });

    it("setMintCap is GOV-only", async () => {
      await expect(router.connect(alice).setMintCap(SOLO, parseEther("1"))).to.be.reverted;
    });
  });

  // ── Per-module inflow limiter ─────────────────────────────────────────────

  describe("Per-module inflow limiter", () => {
    it("blocks excess inflow in the same window (ETH submit path)", async () => {
      await router.connect(gov).setModuleInflowLimit(SOLO, 3600, parseEther("5"));

      await router.connect(alice).submit(ZeroAddress, {value: parseEther("4")});
      await expect(router.connect(alice).submit(ZeroAddress, {value: parseEther("2")}))
        .to.be.revertedWithCustomError(router, "InflowLimitExceeded")
        .withArgs(SOLO, parseEther("6"), parseEther("5"));
    });

    it("resets limiter after the window elapses", async () => {
      await router.connect(gov).setModuleInflowLimit(SOLO, 60, parseEther("5"));

      await router.connect(alice).submit(ZeroAddress, {value: parseEther("4")});
      await expect(router.connect(alice).submit(ZeroAddress, {value: parseEther("2")})).to.be.revertedWithCustomError(
        router,
        "InflowLimitExceeded",
      );

      await ethers.provider.send("evm_increaseTime", [61]);
      await ethers.provider.send("evm_mine", []);

      await expect(router.connect(alice).submit(ZeroAddress, {value: parseEther("2")})).to.not.be.reverted;
      expect(await mod1.bufferedEther()).to.equal(parseEther("6"));
    });

    it("inflow limiter also applies to submitWithSource path", async () => {
      await router.connect(gov).setModuleInflowLimit(SOLO, 3600, parseEther("5"));

      await router.connect(alice).submitWithSource(ZeroAddress, SOURCE_A, {value: parseEther("4")});
      await expect(router.connect(alice).submitWithSource(ZeroAddress, SOURCE_A, {value: parseEther("2")}))
        .to.be.revertedWithCustomError(router, "InflowLimitExceeded")
        .withArgs(SOLO, parseEther("6"), parseEther("5"));
    });

    it("disabled global config (zeroed) allows flows", async () => {
      await router.connect(gov).setModuleInflowLimit(SOLO, 3600, parseEther("1"));
      await router.connect(gov).setModuleInflowLimit(SOLO, 0, 0);

      await expect(router.connect(alice).submit(ZeroAddress, {value: parseEther("3")})).to.not.be.reverted;
      await expect(router.connect(alice).submit(ZeroAddress, {value: parseEther("3")})).to.not.be.reverted;
    });

    it("setModuleInflowLimit is GOV-only", async () => {
      await expect(router.connect(alice).setModuleInflowLimit(SOLO, 3600, parseEther("1"))).to.be.reverted;
    });
  });

  // ── Global inflow limiter ────────────────────────────────────────────────

  describe("Global inflow limiter", () => {
    it("blocks aggregate inflow across multiple modules in the same window", async () => {
      await router.connect(gov).registerModule(SECONDARY, mod2.target, 0);
      await router.connect(gov).setGlobalInflowLimit(3600, parseEther("5"));

      await router.connect(alice).submit(ZeroAddress, {value: parseEther("4")});
      await expect(router.connect(alice).submitToModule(SECONDARY, ZeroAddress, {value: parseEther("2")}))
        .to.be.revertedWithCustomError(router, "GlobalInflowLimitExceeded")
        .withArgs(parseEther("6"), parseEther("5"));
    });

    it("resets global inflow limiter after the window elapses", async () => {
      await router.connect(gov).setGlobalInflowLimit(60, parseEther("5"));

      await router.connect(alice).submit(ZeroAddress, {value: parseEther("4")});
      await expect(router.connect(alice).submit(ZeroAddress, {value: parseEther("2")})).to.be.revertedWithCustomError(
        router,
        "GlobalInflowLimitExceeded",
      );

      await ethers.provider.send("evm_increaseTime", [61]);
      await ethers.provider.send("evm_mine", []);

      await expect(router.connect(alice).submit(ZeroAddress, {value: parseEther("2")})).to.not.be.reverted;
    });

    it("disabled config (zeroed) allows flows", async () => {
      await router.connect(gov).setGlobalInflowLimit(3600, parseEther("1"));
      await router.connect(gov).setGlobalInflowLimit(0, 0);

      await expect(router.connect(alice).submit(ZeroAddress, {value: parseEther("3")})).to.not.be.reverted;
      await expect(router.connect(alice).submit(ZeroAddress, {value: parseEther("3")})).to.not.be.reverted;
    });

    it("setGlobalInflowLimit is GOV-only", async () => {
      await expect(router.connect(alice).setGlobalInflowLimit(3600, parseEther("1"))).to.be.reverted;
    });
  });

  // ── Institutional policy gating ───────────────────────────────────────────

  describe("Institutional policy gating", () => {
    async function deployPolicyRegistry() {
      const InstitutionalPolicyRegistry = await ethers.getContractFactory("InstitutionalPolicyRegistry");
      return InstitutionalPolicyRegistry.deploy(gov.address);
    }

    async function deployPolicyLstModule(moduleId: string) {
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const lstToken = await MockERC20.deploy("Mock LST", "mLST");

      const MockLSTPriceOracle = await ethers.getContractFactory("MockLSTPriceOracle");
      const oracleContract = await MockLSTPriceOracle.deploy(parseEther("1"));

      const LSTWrapModule = await ethers.getContractFactory("LSTWrapModule");
      const lstModule = await LSTWrapModule.deploy(router.target, moduleId, lstToken.target, gov.address);

      await router.connect(gov).registerModule(moduleId, lstModule.target, parseEther("10"));
      await lstModule.connect(gov).setPriceOracle(oracleContract.target);
      await lstToken.mint(alice.address, parseEther("10"));
      await lstToken.connect(alice).approve(lstModule.target, parseEther("10"));

      return {lstModule};
    }

    it("policy disabled keeps behavior unchanged", async () => {
      const registry = await deployPolicyRegistry();
      await registry.connect(gov).createPolicy(POLICY, 1, gov.address); // AllowlistOnly

      await router.connect(gov).setModulePolicy(SOLO, POLICY);
      // Registry unset => checks disabled even with policy id configured.
      await expect(router.connect(alice).submit(ZeroAddress, {value: parseEther("1")})).to.not.be.reverted;

      await router.connect(gov).setPolicyRegistry(registry.target);
      await router.connect(gov).setModulePolicy(SOLO, ethers.ZeroHash);
      // Module policy unset => checks disabled even with registry configured.
      await expect(router.connect(bob).submit(ZeroAddress, {value: parseEther("1")})).to.not.be.reverted;
    });

    it("allowlist mode denies non-allowlisted and allows allowlisted", async () => {
      const registry = await deployPolicyRegistry();
      await registry.connect(gov).createPolicy(POLICY, 1, gov.address); // AllowlistOnly
      await router.connect(gov).setPolicyRegistry(registry.target);
      await router.connect(gov).setModulePolicy(SOLO, POLICY);

      await expect(router.connect(alice).submit(ZeroAddress, {value: parseEther("1")}))
        .to.be.revertedWithCustomError(router, "PolicyDenied")
        .withArgs(SOLO, POLICY, alice.address);

      await registry.connect(gov).setAllowlisted(POLICY, alice.address, true);
      await expect(router.connect(alice).submit(ZeroAddress, {value: parseEther("1")})).to.not.be.reverted;

      // Wrap path should enforce policy on recipient too.
      const LST_POLICY_MOD = ethers.keccak256(ethers.toUtf8Bytes("LST_POLICY_MOD_A"));
      const {lstModule} = await deployPolicyLstModule(LST_POLICY_MOD);
      await router.connect(gov).setModulePolicy(LST_POLICY_MOD, POLICY);

      await registry.connect(gov).setAllowlisted(POLICY, alice.address, false);
      await expect(lstModule.connect(alice).wrapLST(parseEther("1"), alice.address))
        .to.be.revertedWithCustomError(router, "PolicyDenied")
        .withArgs(LST_POLICY_MOD, POLICY, alice.address);

      await registry.connect(gov).setAllowlisted(POLICY, alice.address, true);
      await expect(lstModule.connect(alice).wrapLST(parseEther("1"), alice.address)).to.not.be.reverted;
    });

    it("policy enforcement applies to submitWithSource path", async () => {
      const registry = await deployPolicyRegistry();
      await registry.connect(gov).createPolicy(POLICY, 1, gov.address); // AllowlistOnly
      await router.connect(gov).setPolicyRegistry(registry.target);
      await router.connect(gov).setModulePolicy(SOLO, POLICY);

      await expect(router.connect(alice).submitWithSource(ZeroAddress, SOURCE_A, {value: parseEther("1")}))
        .to.be.revertedWithCustomError(router, "PolicyDenied")
        .withArgs(SOLO, POLICY, alice.address);

      await registry.connect(gov).setAllowlisted(POLICY, alice.address, true);
      await expect(router.connect(alice).submitWithSource(ZeroAddress, SOURCE_A, {value: parseEther("1")})).to.not.be
        .reverted;
    });

    it("blocklist mode denies blocked user", async () => {
      const registry = await deployPolicyRegistry();
      await registry.connect(gov).createPolicy(POLICY, 2, gov.address); // BlocklistOnly
      await router.connect(gov).setPolicyRegistry(registry.target);
      await router.connect(gov).setModulePolicy(SOLO, POLICY);

      await registry.connect(gov).setBlocklisted(POLICY, alice.address, true);
      await expect(router.connect(alice).submit(ZeroAddress, {value: parseEther("1")}))
        .to.be.revertedWithCustomError(router, "PolicyDenied")
        .withArgs(SOLO, POLICY, alice.address);

      await expect(router.connect(bob).submit(ZeroAddress, {value: parseEther("1")})).to.not.be.reverted;
    });

    it("setting policy registry and module policy is GOV-only", async () => {
      const registry = await deployPolicyRegistry();
      await expect(router.connect(alice).setPolicyRegistry(registry.target)).to.be.reverted;

      await expect(router.connect(alice).setModulePolicy(SOLO, POLICY)).to.be.reverted;
    });
  });

  // ── Pause ──────────────────────────────────────────────────────────────────

  describe("Pause", () => {
    it("GUARDIAN can pause submit; deposit reverts", async () => {
      await router.connect(guardian).pause(0); // PAUSE_SUBMIT = 0
      await expect(router.connect(alice).submit(ZeroAddress, {value: parseEther("1")})).to.be.reverted;
    });

    it("paused submit also blocks plain ETH transfers", async () => {
      await router.connect(guardian).pause(0);
      await expect(alice.sendTransaction({to: router.target, value: parseEther("1")})).to.be.reverted;
    });

    it("GOV can unpause", async () => {
      await router.connect(guardian).pause(0);
      await router.connect(gov).unpause(0);
      await expect(router.connect(alice).submit(ZeroAddress, {value: parseEther("1")})).to.not.be.reverted;
    });

    it("non-GUARDIAN cannot pause", async () => {
      await expect(router.connect(alice).pause(0)).to.be.reverted;
    });

    it("module-level pause blocks deposits to that module only", async () => {
      await router.connect(gov).registerModule(SECONDARY, mod2.target, 0);
      await router.connect(guardian).pauseModule(SOLO);

      await expect(router.connect(alice).submit(ZeroAddress, {value: parseEther("1")})).to.be.revertedWithCustomError(
        router,
        "ModulePaused",
      );

      // SECONDARY still accepts.
      await router.connect(alice).submitToModule(SECONDARY, ZeroAddress, {value: parseEther("1")});
      expect(await mod2.bufferedEther()).to.equal(parseEther("1"));
    });

    it("emergencyPauseAll pauses submit and listed modules", async () => {
      await router.connect(gov).registerModule(SECONDARY, mod2.target, 0);
      await router.connect(guardian).emergencyPauseAll([SOLO, SECONDARY]);
      const info1 = await router.modules(SOLO);
      const info2 = await router.modules(SECONDARY);
      expect(info1.paused).to.be.true;
      expect(info2.paused).to.be.true;
      await expect(router.connect(alice).submit(ZeroAddress, {value: parseEther("1")})).to.be.reverted;
    });
  });

  // ── Module beacon reporting ────────────────────────────────────────────────

  describe("Module beacon reporting", () => {
    beforeEach(async () => {
      // Alice deposits 32 ETH (one validator's worth) so we have a sensible state.
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("32")});
      // Relax maxDeltaBps for these tests so we can simulate realistic rewards
      // (1.5%–3%) without hitting the 1% mainnet default.
      await router.connect(gov).setMaxDeltaBps(1000);
    });

    it("only registered module addr can call reportModuleBeaconBalance", async () => {
      await expect(
        router.connect(impostor).reportModuleBeaconBalance(SOLO, parseEther("32")),
      ).to.be.revertedWithCustomError(router, "NotModule");
    });

    it("positive delta increases totalPooledEther and mints fees with exact 50/50 split", async () => {
      // First move one validator principal (32 ETH) from buffer to beacon.
      const pubkey = ethers.hexlify(ethers.randomBytes(48));
      const creds = expectedWithdrawalCreds;
      const sig = ethers.hexlify(ethers.randomBytes(96));
      const root = ethers.hexlify(ethers.randomBytes(32));
      await mod1.connect(gov).depositToBeaconChain(pubkey, creds, sig, root);

      // Validator module reports 32.5 ETH on beacon (delta +0.5 ETH reward).
      // FeeController is configured with feeBps=1000 (10%) and treasurySplitBps=5000 (50%).
      // → totalFee = 0.05 ETH, treasuryAmount = 0.025 ETH, operatorAmount = 0.025 ETH.
      // Treasury = gov, Operator = deployer.
      const govSharesBefore = await stToken.sharesOf(gov.address);
      const deployerSharesBefore = await stToken.sharesOf(deployer.address);
      const tx = await mod1.connect(oracle).reportBeacon(1, parseEther("32.5"));
      const receipt = await tx.wait();
      const govSharesAfter = await stToken.sharesOf(gov.address);
      const deployerSharesAfter = await stToken.sharesOf(deployer.address);

      expect(await stToken.totalPooledEther()).to.be.gt(parseEther("32"));
      expect(govSharesAfter).to.be.gt(govSharesBefore);
      expect(deployerSharesAfter).to.be.gt(deployerSharesBefore);

      const parsedRouterLogs = receipt!.logs
        .map((log: any) => {
          try {
            return router.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .filter((log: any) => log !== null);

      const feeTelemetry = parsedRouterLogs.find((log: any) => log.name === "FeeRoutingTelemetry");
      expect(feeTelemetry).to.not.equal(undefined);
      expect(feeTelemetry!.args.moduleId).to.equal(SOLO);
      expect(feeTelemetry!.args.rewards).to.equal(parseEther("0.5"));
      expect(feeTelemetry!.args.treasuryAmount).to.equal(parseEther("0.025"));
      expect(feeTelemetry!.args.operatorAmount).to.equal(parseEther("0.025"));
      expect(feeTelemetry!.args.totalFeeAmount).to.equal(parseEther("0.05"));
      expect(feeTelemetry!.args.totalPooledBeforeFees).to.equal(parseEther("32.5"));
      expect(feeTelemetry!.args.totalPooledAfterFees).to.equal(parseEther("32.5")); // pool stays at real backing
      expect(feeTelemetry!.args.treasuryShares).to.be.gt(0n);
      expect(feeTelemetry!.args.operatorShares).to.be.gt(0n);

      const feeSharesMinted = parsedRouterLogs.find((log: any) => log.name === "FeeSharesMinted");
      expect(feeSharesMinted).to.not.equal(undefined);
      expect(feeSharesMinted!.args.treasury).to.equal(gov.address);
      expect(feeSharesMinted!.args.operator).to.equal(deployer.address);
      expect(feeTelemetry!.args.treasuryShares).to.equal(feeSharesMinted!.args.treasuryShares);
      expect(feeTelemetry!.args.operatorShares).to.equal(feeSharesMinted!.args.operatorShares);

      // Exact-ish: under a 50/50 split, treasury and operator must end up with
      // share counts within 5% of each other. (Discretization aside, both fee
      // amounts are equal in ETH terms and minted at the same exchange rate.)
      const treasuryShares = govSharesAfter - govSharesBefore;
      const operatorShares = deployerSharesAfter - deployerSharesBefore;
      expect(treasuryShares).to.be.gt(0n);
      expect(operatorShares).to.be.gt(0n);
      expect(treasuryShares).to.be.gte((operatorShares * 95n) / 100n);
      expect(treasuryShares).to.be.lte((operatorShares * 105n) / 100n);
    });

    it("routes referral fee shares to treasury when referral registry has zero referred volume", async () => {
      const ReferralRegistry = await ethers.getContractFactory("ReferralRegistry");
      const registry = await ReferralRegistry.deploy(gov.address, stToken.target);

      await registry.connect(gov).grantRole(await registry.FEE_CTRL(), router.target);
      await registry.connect(gov).grantRole(await registry.ROUTER(), router.target);

      // Keep feeBps at 10%, but reserve 20% of that fee for referrals.
      await feeController.connect(gov).setFee(1000, 4000, 4000, 0);
      await feeController.connect(gov).setRecipients(gov.address, deployer.address, registry.target, ZeroAddress);

      const pubkey = ethers.hexlify(ethers.randomBytes(48));
      const creds = expectedWithdrawalCreds;
      const sig = ethers.hexlify(ethers.randomBytes(96));
      const root = ethers.hexlify(ethers.randomBytes(32));
      await mod1.connect(gov).depositToBeaconChain(pubkey, creds, sig, root);

      const treasuryBefore = await stToken.sharesOf(gov.address);
      const operatorBefore = await stToken.sharesOf(deployer.address);
      const registryBefore = await stToken.sharesOf(registry.target);

      await expect(mod1.connect(oracle).reportBeacon(1, parseEther("32.5"))).to.not.be.reverted;

      const treasuryAfter = await stToken.sharesOf(gov.address);
      const operatorAfter = await stToken.sharesOf(deployer.address);
      const registryAfter = await stToken.sharesOf(registry.target);

      expect(registryAfter - registryBefore).to.equal(0n);
      expect(treasuryAfter - treasuryBefore).to.be.gt(operatorAfter - operatorBefore);
    });

    it("rejects reports with validator count above deposited validator count", async () => {
      await expect(mod1.connect(oracle).reportBeacon(1, parseEther("32")))
        .to.be.revertedWithCustomError(mod1, "BeaconValidatorCountSanityFailed")
        .withArgs(1, 0);
    });

    it("double notifyBeaconDeposit inflates baseline only once — second call adds to existing baseline", async () => {
      // beforeEach already staked 32 ETH; top up with 32 more so we have 64 buffered.
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("32")});
      expect(await mod1.bufferedEther()).to.equal(parseEther("64"));

      // First push: 32 ETH from buffer → baseline becomes 32.
      const pubkey1 = ethers.hexlify(ethers.randomBytes(48));
      const creds1 = expectedWithdrawalCreds;
      const sig1 = ethers.hexlify(ethers.randomBytes(96));
      const root1 = ethers.hexlify(ethers.randomBytes(32));
      await mod1.connect(gov).depositToBeaconChain(pubkey1, creds1, sig1, root1);
      expect(await router.moduleBeaconBalance(SOLO)).to.equal(parseEther("32"));

      // Malicious caller (non-module) cannot drive notifyBeaconDeposit directly.
      await expect(
        router.connect(impostor).notifyBeaconDeposit(SOLO, parseEther("1000")),
      ).to.be.revertedWithCustomError(router, "NotModule");

      // Second legitimate push: another 32 ETH → baseline accumulates to 64.
      const pubkey2 = ethers.hexlify(ethers.randomBytes(48));
      const creds2 = expectedWithdrawalCreds;
      const sig2 = ethers.hexlify(ethers.randomBytes(96));
      const root2 = ethers.hexlify(ethers.randomBytes(32));
      await mod1.connect(gov).depositToBeaconChain(pubkey2, creds2, sig2, root2);
      expect(await router.moduleBeaconBalance(SOLO)).to.equal(parseEther("64"));

      // Oracle reports the principal (64 ETH on beacon) — delta 0 vs. baseline,
      // so totalPooledEther must remain at 64 and no fee shares are minted.
      const totalPooledBefore = await stToken.totalPooledEther();
      const govSharesBefore = await stToken.sharesOf(gov.address);
      const deployerSharesBefore = await stToken.sharesOf(deployer.address);

      await expect(mod1.connect(oracle).reportBeacon(2, parseEther("64")))
        .to.emit(router, "ModuleBeaconReported")
        .withArgs(SOLO, parseEther("64"), 0);

      expect(await stToken.totalPooledEther()).to.equal(totalPooledBefore);
      expect(await stToken.totalPooledEther()).to.equal(parseEther("64"));
      expect(await stToken.sharesOf(gov.address)).to.equal(govSharesBefore);
      expect(await stToken.sharesOf(deployer.address)).to.equal(deployerSharesBefore);
    });

    it("negative delta (slash) decreases totalPooledEther without minting fees", async () => {
      // First push 32 ETH from buffer to (mock) beacon contract. This calls
      // notifyBeaconDeposit on the router, setting moduleBeaconBalance baseline = 32.
      const pubkey = ethers.hexlify(ethers.randomBytes(48));
      const creds = expectedWithdrawalCreds;
      const sig = ethers.hexlify(ethers.randomBytes(96));
      const root = ethers.hexlify(ethers.randomBytes(32));
      await mod1.connect(gov).depositToBeaconChain(pubkey, creds, sig, root);

      // Now totalPooledEther is still 32 (32 buffered → 32 on beacon, accounting unchanged).
      // Oracle reports baseline (32 ETH) — no delta, no fees.
      await mod1.connect(oracle).reportBeacon(1, parseEther("32"));
      const sharesBefore = await stToken.sharesOf(gov.address);

      // Slash: validator drops to 31 ETH.
      await mod1.connect(oracle).reportBeacon(1, parseEther("31"));
      const sharesAfter = await stToken.sharesOf(gov.address);
      expect(sharesAfter).to.equal(sharesBefore); // no fees on loss
      // totalPooledEther should be ~31 (down from 32).
      expect(await stToken.totalPooledEther()).to.be.lt(parseEther("32.0001"));
      expect(await stToken.totalPooledEther()).to.be.gte(parseEther("31"));
    });

    it("notifyBeaconDeposit baseline math: 32 ETH push then 33 ETH report yields +1 ETH delta", async () => {
      const pubkey = ethers.hexlify(ethers.randomBytes(48));
      const creds = expectedWithdrawalCreds;
      const sig = ethers.hexlify(ethers.randomBytes(96));
      const root = ethers.hexlify(ethers.randomBytes(32));
      await mod1.connect(gov).depositToBeaconChain(pubkey, creds, sig, root);

      const govSharesAfter1 = await stToken.sharesOf(gov.address);
      await mod1.connect(oracle).reportBeacon(1, parseEther("33"));
      const govSharesAfter2 = await stToken.sharesOf(gov.address);
      expect(govSharesAfter2).to.be.gt(govSharesAfter1);
    });
  });

  // ── Default module switching ──────────────────────────────────────────────

  describe("Default module switching", () => {
    it("setDefaultModule routes future submits to the new module", async () => {
      await router.connect(gov).registerModule(SECONDARY, mod2.target, 0);
      await router.connect(gov).setDefaultModule(SECONDARY);
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("1")});
      expect(await mod2.bufferedEther()).to.equal(parseEther("1"));
      expect(await mod1.bufferedEther()).to.equal(0n);
    });

    it("setDefaultModule reverts for unregistered module id", async () => {
      const fake = ethers.keccak256(ethers.toUtf8Bytes("FAKE"));
      await expect(router.connect(gov).setDefaultModule(fake)).to.be.revertedWithCustomError(
        router,
        "ModuleNotRegistered",
      );
    });

    it("non-GOV cannot setDefaultModule", async () => {
      await expect(router.connect(alice).setDefaultModule(SOLO)).to.be.reverted;
    });
  });

  // ── Access control ─────────────────────────────────────────────────────────

  describe("Access control", () => {
    it("non-GOV cannot setFeeController", async () => {
      await expect(router.connect(alice).setFeeController(feeController.target)).to.be.reverted;
    });

    it("totalEthOf sums across given modules", async () => {
      await router.connect(gov).registerModule(SECONDARY, mod2.target, 0);
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("4")});
      await router.connect(alice).submitToModule(SECONDARY, ZeroAddress, {value: parseEther("6")});
      expect(await router.totalEthOf([SOLO, SECONDARY])).to.equal(parseEther("10"));
    });

    it("non-GOV cannot configure code-hash allowlist controls", async () => {
      const validatorType = await mod1.moduleType();
      const validatorCodeHash = await runtimeCodeHash(mod1.target as string);

      await expect(router.connect(alice).setModuleCodeHashAllowed(validatorType, validatorCodeHash, true)).to.be
        .reverted;
    });
  });

  // ── Module action gating ─────────────────────────────────────────────────

  describe("Module action gating", () => {
    const LST_GATED = ethers.keccak256(ethers.toUtf8Bytes("LST_WRAP_GATED"));
    let lstToken: any, lstModule: any, oracleContract: any;

    beforeEach(async () => {
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      lstToken = await MockERC20.deploy("Mock LST", "mLST");

      const MockLSTPriceOracle = await ethers.getContractFactory("MockLSTPriceOracle");
      oracleContract = await MockLSTPriceOracle.deploy(parseEther("1"));

      const LSTWrapModule = await ethers.getContractFactory("LSTWrapModule");
      lstModule = await LSTWrapModule.deploy(router.target, LST_GATED, lstToken.target, gov.address);
      await lstModule.connect(gov).setPriceOracle(oracleContract.target);
      await router.connect(gov).registerModule(LST_GATED, lstModule.target, parseEther("10"));
    });

    it("validator modules cannot call LST-only wrap path", async () => {
      const validatorSigner = await impersonateAccount(mod1.target as string);
      const action = router.interface.getFunction("wrapFromModule")!.selector;
      await expect(router.connect(validatorSigner).wrapFromModule(SOLO, alice.address, parseEther("1")))
        .to.be.revertedWithCustomError(router, "ModuleTypeActionMismatch")
        .withArgs(SOLO, await mod1.moduleType(), action);
      await stopImpersonatingAccount(mod1.target as string);
    });

    it("LST modules cannot call validator-only report path", async () => {
      const lstSigner = await impersonateAccount(lstModule.target as string);
      const action = router.interface.getFunction("reportModuleBeaconBalance")!.selector;
      await expect(router.connect(lstSigner).reportModuleBeaconBalance(LST_GATED, parseEther("1")))
        .to.be.revertedWithCustomError(router, "ModuleTypeActionMismatch")
        .withArgs(LST_GATED, await lstModule.moduleType(), action);
      await stopImpersonatingAccount(lstModule.target as string);
    });
  });

  // ── LST wrap module — happy path ──────────────────────────────────────────

  describe("LST wrap module — happy path", () => {
    const LST_MOD = ethers.keccak256(ethers.toUtf8Bytes("LST_WRAP_TEST"));
    let lstToken: any, lstModule: any, oracleContract: any;

    beforeEach(async () => {
      // Deploy a vanilla ERC20 to stand in as the LST.
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      lstToken = await MockERC20.deploy("Mock LST", "mLST");

      // 1:1 price oracle (1 LST = 1 ETH, both 18 decimals).
      const MockLSTPriceOracle = await ethers.getContractFactory("MockLSTPriceOracle");
      oracleContract = await MockLSTPriceOracle.deploy(parseEther("1"));

      // Deploy LST module wired to router with a 10 ETH cap.
      const LSTWrapModule = await ethers.getContractFactory("LSTWrapModule");
      lstModule = await LSTWrapModule.deploy(router.target, LST_MOD, lstToken.target, gov.address);

      await router.connect(gov).registerModule(LST_MOD, lstModule.target, parseEther("10"));
      await lstModule.connect(gov).setPriceOracle(oracleContract.target);

      // Fund Alice with LST and approve the module.
      await lstToken.mint(alice.address, parseEther("100"));
      await lstToken.connect(alice).approve(lstModule.target, parseEther("100"));
    });

    it("wrapLST mints stToken shares 1:1 and tracks LST custody", async () => {
      const sharesBefore = await stToken.sharesOf(alice.address);
      const totalPooledBefore = await stToken.totalPooledEther();

      await lstModule.connect(alice).wrapLST(parseEther("1"), alice.address);

      const sharesAfter = await stToken.sharesOf(alice.address);
      const minted = sharesAfter - sharesBefore;

      expect(minted).to.be.gt(0n);
      // 1:1 oracle, fresh module, no rebases → expect exactly 1e18 shares.
      expect(minted).to.equal(parseEther("1"));
      expect(await lstModule.lstHeld()).to.equal(parseEther("1"));
      expect(await lstToken.balanceOf(lstModule.target)).to.equal(parseEther("1"));
      expect(await stToken.totalPooledEther()).to.equal(totalPooledBefore + parseEther("1"));
    });

    it("unwrapLST burns stToken and returns LST", async () => {
      // Wrap first.
      await lstModule.connect(alice).wrapLST(parseEther("1"), alice.address);
      expect(await lstModule.lstHeld()).to.equal(parseEther("1"));

      const stBalanceBefore = await stToken.balanceOf(alice.address);
      const lstBalanceBefore = await lstToken.balanceOf(alice.address);
      const sharesBefore = await stToken.sharesOf(alice.address);

      // Unwrap exactly the amount we wrapped.
      await lstModule.connect(alice).unwrapLST(stBalanceBefore, alice.address);

      const sharesAfter = await stToken.sharesOf(alice.address);
      expect(sharesAfter).to.be.lt(sharesBefore);
      // Module's LST balance returns to 0.
      expect(await lstModule.lstHeld()).to.equal(0n);
      expect(await lstToken.balanceOf(lstModule.target)).to.equal(0n);
      // Alice gets her LST back.
      expect(await lstToken.balanceOf(alice.address)).to.equal(lstBalanceBefore + parseEther("1"));
    });

    it("mint cap exceeded reverts with MintCapExceeded", async () => {
      // Re-register a fresh LST module with a 0.5 ETH cap. Use a different
      // moduleId since LST_MOD is already taken by beforeEach.
      const TIGHT = ethers.keccak256(ethers.toUtf8Bytes("LST_WRAP_TIGHT"));
      const LSTWrapModule = await ethers.getContractFactory("LSTWrapModule");
      const tightModule = await LSTWrapModule.deploy(router.target, TIGHT, lstToken.target, gov.address);
      await router.connect(gov).registerModule(TIGHT, tightModule.target, parseEther("0.5"));
      await tightModule.connect(gov).setPriceOracle(oracleContract.target);

      await lstToken.connect(alice).approve(tightModule.target, parseEther("100"));

      // Attempt to wrap 1 LST (= 1 ETH equiv) into a 0.5 ETH cap → revert.
      await expect(tightModule.connect(alice).wrapLST(parseEther("1"), alice.address)).to.be.revertedWithCustomError(
        router,
        "MintCapExceeded",
      );
    });

    it("enforces inflow limiter on LST wrap mint path", async () => {
      await router.connect(gov).setModuleInflowLimit(LST_MOD, 3600, parseEther("1"));

      await lstModule.connect(alice).wrapLST(parseEther("1"), alice.address);
      await expect(lstModule.connect(alice).wrapLST(parseEther("0.1"), alice.address))
        .to.be.revertedWithCustomError(router, "InflowLimitExceeded")
        .withArgs(LST_MOD, parseEther("1.1"), parseEther("1"));
    });

    it("enforces global inflow limiter on LST wrap mint path", async () => {
      await router.connect(gov).setGlobalInflowLimit(3600, parseEther("1"));

      await lstModule.connect(alice).wrapLST(parseEther("1"), alice.address);
      await expect(lstModule.connect(alice).wrapLST(parseEther("0.1"), alice.address))
        .to.be.revertedWithCustomError(router, "GlobalInflowLimitExceeded")
        .withArgs(parseEther("1.1"), parseEther("1"));
    });

    it("reverts tiny wraps when the current exchange rate would mint zero shares", async () => {
      await router.connect(gov).setMaxDeltaBps(1000);
      await router.connect(alice).submit(ZeroAddress, {value: parseEther("32")});

      const pubkey = ethers.hexlify(ethers.randomBytes(48));
      const creds = expectedWithdrawalCreds;
      const sig = ethers.hexlify(ethers.randomBytes(96));
      const root = ethers.hexlify(ethers.randomBytes(32));
      await mod1.connect(gov).depositToBeaconChain(pubkey, creds, sig, root);
      await mod1.connect(oracle).reportBeacon(1, parseEther("33"));

      await expect(lstModule.connect(alice).wrapLST(1n, alice.address)).to.be.reverted;
    });
  });
});
