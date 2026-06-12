/**
 * upgrades.spec.ts — UUPS proxy upgrade safety tests for the modular-staking stack.
 *
 * Verifies that:
 *  1. Proxies can be deployed (initialize runs, storage correct).
 *  2. `upgradeTo` is GOV-gated; outsiders are rejected.
 *  3. A V2 implementation contract upgrades successfully, preserving state.
 */
import {ethers, upgrades} from "hardhat";
import {expect} from "chai";
import {ZeroAddress, parseEther} from "ethers";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

const MODULE_ID = ethers.keccak256(ethers.toUtf8Bytes("UPGRADE_TEST_MODULE"));

describe("UUPS upgrade safety", () => {
  let deployer: SignerWithAddress;
  let gov: SignerWithAddress;
  let outsider: SignerWithAddress;

  beforeEach(async () => {
    [deployer, gov, outsider] = await ethers.getSigners();
  });

  // ── StakingRouter ──────────────────────────────────────────────────────────

  describe("StakingRouter", () => {
    let stToken: any;
    let router: any;

    beforeEach(async () => {
      const StToken = await ethers.getContractFactory("StToken");
      stToken = await StToken.deploy();

      const StakingRouter = await ethers.getContractFactory("StakingRouter");
      router = await upgrades.deployProxy(StakingRouter, [stToken.target, gov.address], {kind: "uups", initializer: "initialize"});
      await router.waitForDeployment();
      await stToken.addMinter(router.target);
    });

    it("initialize sets ST_TOKEN and grants GOV role", async () => {
      expect(await router.ST_TOKEN()).to.equal(stToken.target);
      expect(await router.hasRole(await router.GOV(), gov.address)).to.be.true;
    });

    it("maxDeltaBps initialised to 100 in proxy storage", async () => {
      expect(await router.maxDeltaBps()).to.equal(100n);
    });

    it("outsider cannot upgradeTo", async () => {
      const StakingRouterV2 = await ethers.getContractFactory("StakingRouter");
      const v2Impl = await StakingRouterV2.deploy();
      await expect(
        router.connect(outsider).upgradeTo(await v2Impl.getAddress()),
      ).to.be.reverted;
    });

    it("gov can upgrade to a new implementation while preserving state", async () => {
      // Submit some ETH so totalPooledEther is non-zero
      const MockBeaconDeposit = await ethers.getContractFactory("MockBeaconDeposit");
      const mockBeacon = await MockBeaconDeposit.deploy();
      const ValidatorModule = await ethers.getContractFactory("ValidatorModule");
      const mod = await upgrades.deployProxy(ValidatorModule, [router.target, MODULE_ID, gov.address, mockBeacon.target], {kind: "uups", initializer: "initialize"});
      await mod.waitForDeployment();
      await router.connect(gov).registerModule(MODULE_ID, mod.target, parseEther("100"));
      await router.connect(gov).setDefaultModule(MODULE_ID);

      await router.connect(outsider).submit(ZeroAddress, {value: parseEther("1")});
      const pooledBefore = await ethers.getContractAt("StToken", stToken.target).then((t: any) => t.totalPooledEther());

      // Upgrade (must be signed by GOV)
      const StakingRouterV2 = await ethers.getContractFactory("StakingRouter", gov);
      await upgrades.upgradeProxy(await router.getAddress(), StakingRouterV2, {kind: "uups"});

      // State preserved
      expect(await router.ST_TOKEN()).to.equal(stToken.target);
      const pooledAfter = await ethers.getContractAt("StToken", stToken.target).then((t: any) => t.totalPooledEther());
      expect(pooledAfter).to.equal(pooledBefore);
      expect(await router.maxDeltaBps()).to.equal(100n);
    });
  });

  // ── ValidatorModule ────────────────────────────────────────────────────────

  describe("ValidatorModule", () => {
    let stToken: any;
    let router: any;
    let mod: any;
    let mockBeacon: any;

    beforeEach(async () => {
      const StToken = await ethers.getContractFactory("StToken");
      stToken = await StToken.deploy();

      const StakingRouter = await ethers.getContractFactory("StakingRouter");
      router = await upgrades.deployProxy(StakingRouter, [stToken.target, gov.address], {kind: "uups", initializer: "initialize"});
      await router.waitForDeployment();
      await stToken.addMinter(router.target);

      const MockBeaconDeposit = await ethers.getContractFactory("MockBeaconDeposit");
      mockBeacon = await MockBeaconDeposit.deploy();

      const ValidatorModule = await ethers.getContractFactory("ValidatorModule");
      mod = await upgrades.deployProxy(ValidatorModule, [router.target, MODULE_ID, gov.address, mockBeacon.target], {kind: "uups", initializer: "initialize"});
      await mod.waitForDeployment();
    });

    it("initialize sets ROUTER and MODULE_ID", async () => {
      expect(await mod.ROUTER()).to.equal(router.target);
      expect(await mod.MODULE_ID()).to.equal(MODULE_ID);
    });

    it("outsider cannot upgradeTo", async () => {
      const ValidatorModuleV2 = await ethers.getContractFactory("ValidatorModule");
      const v2Impl = await ValidatorModuleV2.deploy();
      await expect(
        mod.connect(outsider).upgradeTo(await v2Impl.getAddress()),
      ).to.be.reverted;
    });

    it("gov can upgrade ValidatorModule while preserving MODULE_ID", async () => {
      const ValidatorModuleV2 = await ethers.getContractFactory("ValidatorModule", gov);
      await upgrades.upgradeProxy(await mod.getAddress(), ValidatorModuleV2, {kind: "uups"});

      expect(await mod.MODULE_ID()).to.equal(MODULE_ID);
      expect(await mod.ROUTER()).to.equal(router.target);
    });
  });

  // ── LSTWrapModule ──────────────────────────────────────────────────────────

  describe("LSTWrapModule", () => {
    let stToken: any;
    let router: any;
    let lstToken: any;
    let lstModule: any;

    const LST_ID = ethers.keccak256(ethers.toUtf8Bytes("LST_UPGRADE_TEST"));

    beforeEach(async () => {
      const StToken = await ethers.getContractFactory("StToken");
      stToken = await StToken.deploy();

      const StakingRouter = await ethers.getContractFactory("StakingRouter");
      router = await upgrades.deployProxy(StakingRouter, [stToken.target, gov.address], {kind: "uups", initializer: "initialize"});
      await router.waitForDeployment();
      await stToken.addMinter(router.target);

      const MockERC20 = await ethers.getContractFactory("MockERC20");
      lstToken = await MockERC20.deploy("Mock LST", "mLST");

      const LSTWrapModule = await ethers.getContractFactory("LSTWrapModule");
      lstModule = await upgrades.deployProxy(LSTWrapModule, [router.target, LST_ID, lstToken.target, gov.address], {kind: "uups", initializer: "initialize"});
      await lstModule.waitForDeployment();
    });

    it("initialize sets ROUTER, MODULE_ID, LST_TOKEN, maxOracleAgeSecs=3600", async () => {
      expect(await lstModule.ROUTER()).to.equal(router.target);
      expect(await lstModule.MODULE_ID()).to.equal(LST_ID);
      expect(await lstModule.LST_TOKEN()).to.equal(lstToken.target);
      expect(await lstModule.maxOracleAgeSecs()).to.equal(3600n);
      expect(await lstModule.maxWrapPriceDriftBps()).to.equal(1000n);
    });

    it("outsider cannot upgradeTo", async () => {
      const LSTWrapModuleV2 = await ethers.getContractFactory("LSTWrapModule");
      const v2Impl = await LSTWrapModuleV2.deploy();
      await expect(
        lstModule.connect(outsider).upgradeTo(await v2Impl.getAddress()),
      ).to.be.reverted;
    });

    it("gov can upgrade LSTWrapModule while preserving state", async () => {
      const LSTWrapModuleV2 = await ethers.getContractFactory("LSTWrapModule", gov);
      await upgrades.upgradeProxy(await lstModule.getAddress(), LSTWrapModuleV2, {kind: "uups"});

      expect(await lstModule.MODULE_ID()).to.equal(LST_ID);
      expect(await lstModule.maxOracleAgeSecs()).to.equal(3600n);
    });
  });

  // ── OperatorRegistry ───────────────────────────────────────────────────────

  describe("OperatorRegistry", () => {
    let mockSgt: any;
    let registry: any;

    beforeEach(async () => {
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      mockSgt = await MockERC20.deploy("SharedStake Governance Token", "SGT");

      const OperatorRegistry = await ethers.getContractFactory("OperatorRegistry");
      registry = await upgrades.deployProxy(OperatorRegistry, [mockSgt.target, gov.address], {kind: "uups", initializer: "initialize"});
      await registry.waitForDeployment();
    });

    it("initialize sets SGT token and grants GOV role", async () => {
      expect(await registry.sgtToken()).to.equal(mockSgt.target);
      expect(await registry.hasRole(await registry.GOV(), gov.address)).to.be.true;
    });

    it("outsider cannot upgradeTo", async () => {
      const OperatorRegistryV2 = await ethers.getContractFactory("OperatorRegistry");
      const v2Impl = await OperatorRegistryV2.deploy();
      await expect(
        registry.connect(outsider).upgradeTo(await v2Impl.getAddress()),
      ).to.be.reverted;
    });

    it("gov can upgrade OperatorRegistry while preserving SGT address", async () => {
      const OperatorRegistryV2 = await ethers.getContractFactory("OperatorRegistry", gov);
      await upgrades.upgradeProxy(await registry.getAddress(), OperatorRegistryV2, {kind: "uups"});

      expect(await registry.sgtToken()).to.equal(mockSgt.target);
      expect(await registry.hasRole(await registry.GOV(), gov.address)).to.be.true;
    });
  });
});
