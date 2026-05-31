import {ethers} from "hardhat";
import {expect} from "chai";
import {parseEther, ZeroAddress} from "ethers";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

const SOLO = ethers.keccak256(ethers.toUtf8Bytes("ROLE_SWEEP_SOLO"));
const POLICY_ID = ethers.keccak256(ethers.toUtf8Bytes("ROLE_SWEEP_POLICY"));

describe("modular-staking role/access sweep", () => {
  let deployer: SignerWithAddress;
  let gov: SignerWithAddress;
  let guardian: SignerWithAddress;
  let oracle: SignerWithAddress;
  let submitter: SignerWithAddress;
  let outsider: SignerWithAddress;
  let alice: SignerWithAddress;

  beforeEach(async () => {
    [deployer, gov, guardian, oracle, submitter, outsider, alice] = await ethers.getSigners();
  });

  describe("StakingCore", () => {
    let stToken: any;
    let stakingCore: any;
    let feeController: any;

    beforeEach(async () => {
      const StToken = await ethers.getContractFactory("StToken");
      stToken = await StToken.deploy();

      const StakingCore = await ethers.getContractFactory("StakingCore");
      stakingCore = await StakingCore.deploy(stToken.target, gov.address);
      await stToken.addMinter(stakingCore.target);

      const FeeController = await ethers.getContractFactory("FeeController");
      feeController = await FeeController.deploy(
        gov.address,
        gov.address,
        deployer.address,
        ZeroAddress,        // referral registry
        ZeroAddress,        // debt pool (disabled)
        1000,               // feeBps
        5000,               // treasurySplitBps
        5000,               // operatorSplitBps
        0,                  // debtPoolSplitBps (disabled)
      );

      const ORACLE_ROLE = await stakingCore.ORACLE();
      const GUARDIAN_ROLE = await stakingCore.GUARDIAN();
      await stakingCore.connect(gov).grantRole(ORACLE_ROLE, oracle.address);
      await stakingCore.connect(gov).grantRole(GUARDIAN_ROLE, guardian.address);
    });

    it("role-admin mapping is wired to DEFAULT_ADMIN_ROLE", async () => {
      const defaultAdmin = await stakingCore.DEFAULT_ADMIN_ROLE();
      expect(await stakingCore.getRoleAdmin(await stakingCore.GOV())).to.equal(defaultAdmin);
      expect(await stakingCore.getRoleAdmin(await stakingCore.ORACLE())).to.equal(defaultAdmin);
      expect(await stakingCore.getRoleAdmin(await stakingCore.GUARDIAN())).to.equal(defaultAdmin);
      expect(await stakingCore.getRoleAdmin(await stakingCore.NODE_OPERATOR())).to.equal(defaultAdmin);
    });

    it("enforces role checks for setFeeController/pause/unpause/reportBeacon/notifyBeaconDeposit", async () => {
      await expect(stakingCore.connect(outsider).setFeeController(feeController.target)).to.be.reverted;
      await expect(stakingCore.connect(outsider).pause(0)).to.be.reverted;
      await expect(stakingCore.connect(outsider).unpause(0)).to.be.reverted;
      await expect(stakingCore.connect(outsider).reportBeacon(1, parseEther("32"))).to.be.reverted;
      await expect(stakingCore.connect(outsider).notifyBeaconDeposit(parseEther("1"))).to.be.reverted;

      await expect(stakingCore.connect(gov).setFeeController(feeController.target)).to.not.be.reverted;
      await expect(stakingCore.connect(guardian).pause(0)).to.not.be.reverted;
      await expect(stakingCore.connect(gov).unpause(0)).to.not.be.reverted;

      await stakingCore.connect(alice).submit(ZeroAddress, {value: parseEther("1")});
      await expect(stakingCore.connect(gov).notifyBeaconDeposit(parseEther("1"))).to.not.be.reverted;
      await expect(stakingCore.connect(oracle).reportBeacon(1, parseEther("1"))).to.not.be.reverted;
    });
  });

  describe("StakingRouter", () => {
    let stToken: any;
    let router: any;
    let module1: any;
    let feeController: any;

    beforeEach(async () => {
      const StToken = await ethers.getContractFactory("StToken");
      stToken = await StToken.deploy();

      const StakingRouter = await ethers.getContractFactory("StakingRouter");
      router = await StakingRouter.deploy(stToken.target, gov.address);
      await stToken.addMinter(router.target);

      const MockBeaconDeposit = await ethers.getContractFactory("MockBeaconDeposit");
      const mockBeacon = await MockBeaconDeposit.deploy();

      const ValidatorModule = await ethers.getContractFactory("ValidatorModule");
      module1 = await ValidatorModule.deploy(router.target, SOLO, gov.address, mockBeacon.target);

      const FeeController = await ethers.getContractFactory("FeeController");
      feeController = await FeeController.deploy(
        gov.address,
        gov.address,
        deployer.address,
        ZeroAddress,        // referral registry
        ZeroAddress,        // debt pool (disabled)
        1000,               // feeBps
        5000,               // treasurySplitBps
        5000,               // operatorSplitBps
        0,                  // debtPoolSplitBps (disabled)
      );

      const GUARDIAN_ROLE = await router.GUARDIAN();
      await router.connect(gov).grantRole(GUARDIAN_ROLE, guardian.address);
      await router.connect(gov).registerModule(SOLO, module1.target, parseEther("100"));
    });

    it("role-admin mapping is wired to DEFAULT_ADMIN_ROLE", async () => {
      const defaultAdmin = await router.DEFAULT_ADMIN_ROLE();
      expect(await router.getRoleAdmin(await router.GOV())).to.equal(defaultAdmin);
      expect(await router.getRoleAdmin(await router.GUARDIAN())).to.equal(defaultAdmin);
    });

    it("enforces role checks for privileged selectors", async () => {
      const moduleType = await module1.moduleType();
      const moduleCodeHash = ethers.keccak256(await ethers.provider.getCode(module1.target));

      await expect(router.connect(outsider).registerModule(
        ethers.keccak256(ethers.toUtf8Bytes("ROLE_SWEEP_EXTRA")),
        module1.target,
        0,
      )).to.be.reverted;
      await expect(router.connect(outsider).setMintCap(SOLO, parseEther("50"))).to.be.reverted;
      await expect(router.connect(outsider).setModuleInflowLimit(SOLO, 3600, parseEther("10"))).to.be.reverted;
      await expect(router.connect(outsider).setDefaultModule(SOLO)).to.be.reverted;
      await expect(router.connect(outsider).pauseModule(SOLO)).to.be.reverted;
      await expect(router.connect(outsider).unpauseModule(SOLO)).to.be.reverted;
      await expect(router.connect(outsider).emergencyPauseAll([SOLO])).to.be.reverted;
      await expect(router.connect(outsider).setFeeController(feeController.target)).to.be.reverted;
      await expect(router.connect(outsider).setMaxDeltaBps(500)).to.be.reverted;
      await expect(router.connect(outsider).setModuleCodeHashAllowed(moduleType, moduleCodeHash, true)).to.be.reverted;
      await expect(router.connect(outsider).enableCodeHashEnforcement()).to.be.reverted;
      await expect(router.connect(outsider).pause(0)).to.be.reverted;
      await expect(router.connect(outsider).unpause(0)).to.be.reverted;

      await expect(router.connect(gov).setMintCap(SOLO, parseEther("80"))).to.not.be.reverted;
      await expect(router.connect(gov).setModuleInflowLimit(SOLO, 3600, parseEther("10"))).to.not.be.reverted;
      await expect(router.connect(gov).setDefaultModule(SOLO)).to.not.be.reverted;
      await expect(router.connect(guardian).pauseModule(SOLO)).to.not.be.reverted;
      await expect(router.connect(gov).unpauseModule(SOLO)).to.not.be.reverted;
      await expect(router.connect(guardian).emergencyPauseAll([SOLO])).to.not.be.reverted;
      await expect(router.connect(gov).setFeeController(feeController.target)).to.not.be.reverted;
      await expect(router.connect(gov).setMaxDeltaBps(500)).to.not.be.reverted;
      await expect(router.connect(gov).setModuleCodeHashAllowed(moduleType, moduleCodeHash, true)).to.not.be.reverted;
      await expect(router.connect(gov).enableCodeHashEnforcement()).to.not.be.reverted;
      await expect(router.connect(guardian).pause(0)).to.not.be.reverted;
      await expect(router.connect(gov).unpause(0)).to.not.be.reverted;
    });
  });

  describe("WithdrawalQueueV2", () => {
    let stToken: any;
    let stakingCore: any;
    let queue: any;

    beforeEach(async () => {
      const StToken = await ethers.getContractFactory("StToken");
      stToken = await StToken.deploy();

      const StakingCore = await ethers.getContractFactory("StakingCore");
      stakingCore = await StakingCore.deploy(stToken.target, gov.address);
      await stToken.addMinter(stakingCore.target);

      const WithdrawalQueueV2 = await ethers.getContractFactory("WithdrawalQueueV2");
      queue = await WithdrawalQueueV2.deploy(stToken.target, gov.address);
      await stToken.addMinter(queue.target);

      const GUARDIAN_ROLE = await queue.GUARDIAN();
      const ORACLE_ROLE = await queue.ORACLE();
      await queue.connect(gov).grantRole(GUARDIAN_ROLE, guardian.address);
      await queue.connect(gov).grantRole(ORACLE_ROLE, oracle.address);

      await stakingCore.connect(alice).submit(ZeroAddress, {value: parseEther("5")});
      await queue.connect(alice).requestWithdrawals([parseEther("1")], alice.address);
    });

    it("role-admin mapping is wired to DEFAULT_ADMIN_ROLE", async () => {
      const defaultAdmin = await queue.DEFAULT_ADMIN_ROLE();
      expect(await queue.getRoleAdmin(await queue.GOV())).to.equal(defaultAdmin);
      expect(await queue.getRoleAdmin(await queue.ORACLE())).to.equal(defaultAdmin);
      expect(await queue.getRoleAdmin(await queue.GUARDIAN())).to.equal(defaultAdmin);
    });

    it("enforces role checks for finalize/updateModeFromOracle/bunker setters", async () => {
      const block = await ethers.provider.getBlock("latest");
      const ts = BigInt(block!.timestamp);

      await expect(queue.connect(outsider).finalize(1, {value: parseEther("1")})).to.be.reverted;
      await expect(queue.connect(outsider).updateModeFromOracle(true, ts)).to.be.reverted;
      await expect(queue.connect(outsider).setBunkerMaxRequestsPerFinalize(2)).to.be.reverted;
      await expect(queue.connect(outsider).setBunkerMinRequestAge(60)).to.be.reverted;

      await expect(queue.connect(guardian).finalize(1, {value: parseEther("1")})).to.not.be.reverted;
      await expect(queue.connect(oracle).updateModeFromOracle(true, ts)).to.not.be.reverted;
      await expect(queue.connect(gov).setBunkerMaxRequestsPerFinalize(2)).to.not.be.reverted;
      await expect(queue.connect(gov).setBunkerMinRequestAge(60)).to.not.be.reverted;
    });
  });

  describe("QuorumOracleAdapter", () => {
    let stToken: any;
    let stakingCore: any;
    let adapter: any;

    beforeEach(async () => {
      const StToken = await ethers.getContractFactory("StToken");
      stToken = await StToken.deploy();

      const StakingCore = await ethers.getContractFactory("StakingCore");
      stakingCore = await StakingCore.deploy(stToken.target, gov.address);
      await stToken.addMinter(stakingCore.target);

      const ORACLE_ROLE = await stakingCore.ORACLE();

      const QuorumOracleAdapter = await ethers.getContractFactory("QuorumOracleAdapter");
      adapter = await QuorumOracleAdapter.deploy(stakingCore.target, gov.address, 1);
      await stakingCore.connect(gov).grantRole(ORACLE_ROLE, adapter.target);
      await stakingCore.connect(gov).submit(ZeroAddress, {value: parseEther("32")});
      await stakingCore.connect(gov).notifyBeaconDeposit(parseEther("32"));
    });

    it("role-admin mapping is wired to DEFAULT_ADMIN_ROLE", async () => {
      const defaultAdmin = await adapter.DEFAULT_ADMIN_ROLE();
      expect(await adapter.getRoleAdmin(await adapter.GOV())).to.equal(defaultAdmin);
      expect(await adapter.getRoleAdmin(await adapter.SUBMITTER())).to.equal(defaultAdmin);
    });

    it("enforces GOV-only config/membership and SUBMITTER-only report submission", async () => {
      const block = await ethers.provider.getBlock("latest");
      const ts = BigInt(block!.timestamp);

      await expect(adapter.connect(outsider).addSubmitter(submitter.address)).to.be.reverted;
      await expect(adapter.connect(outsider).removeSubmitter(submitter.address)).to.be.reverted;
      await expect(adapter.connect(outsider).setQuorum(1)).to.be.reverted;
      await expect(adapter.connect(outsider).setMaxStaleness(100)).to.be.reverted;
      await expect(adapter.connect(outsider).setMaxDriftBps(400)).to.be.reverted;
      await expect(adapter.connect(outsider).setMaxSlashBps(200)).to.be.reverted;
      await expect(adapter.connect(outsider).submitReport(1, parseEther("32"), ts)).to.be.reverted;

      await expect(adapter.connect(gov).addSubmitter(submitter.address)).to.not.be.reverted;
      await expect(adapter.connect(gov).addSubmitter(alice.address)).to.not.be.reverted;
      await expect(adapter.connect(gov).setQuorum(1)).to.not.be.reverted;
      await expect(adapter.connect(gov).setMaxStaleness(100)).to.not.be.reverted;
      await expect(adapter.connect(gov).setMaxDriftBps(400)).to.not.be.reverted;
      await expect(adapter.connect(gov).setMaxSlashBps(200)).to.not.be.reverted;
      await expect(adapter.connect(submitter).submitReport(1, parseEther("32"), ts)).to.not.be.reverted;
      await expect(adapter.connect(gov).removeSubmitter(submitter.address)).to.not.be.reverted;
    });
  });

  describe("InstitutionalPolicyRegistry", () => {
    let registry: any;

    beforeEach(async () => {
      const InstitutionalPolicyRegistry = await ethers.getContractFactory("InstitutionalPolicyRegistry");
      registry = await InstitutionalPolicyRegistry.deploy(gov.address);
      const POLICY_ADMIN = await registry.POLICY_ADMIN();
      await registry.connect(gov).grantRole(POLICY_ADMIN, oracle.address);

      await registry.connect(oracle).createPolicy(POLICY_ID, 0, gov.address);
    });

    it("role-admin mapping is wired to DEFAULT_ADMIN_ROLE", async () => {
      const defaultAdmin = await registry.DEFAULT_ADMIN_ROLE();
      expect(await registry.getRoleAdmin(await registry.GOV())).to.equal(defaultAdmin);
      expect(await registry.getRoleAdmin(await registry.POLICY_ADMIN())).to.equal(defaultAdmin);
    });

    it("enforces POLICY_ADMIN-only mutations", async () => {
      const POLICY_2 = ethers.keccak256(ethers.toUtf8Bytes("ROLE_SWEEP_POLICY_2"));

      await expect(registry.connect(outsider).createPolicy(POLICY_2, 0, gov.address)).to.be.reverted;
      await expect(registry.connect(outsider).setPolicyMode(POLICY_ID, 1)).to.be.reverted;
      await expect(registry.connect(outsider).setPolicyManager(POLICY_ID, alice.address)).to.be.reverted;
      await expect(registry.connect(outsider).setAllowlisted(POLICY_ID, alice.address, true)).to.be.reverted;
      await expect(registry.connect(outsider).setBlocklisted(POLICY_ID, alice.address, true)).to.be.reverted;

      await expect(registry.connect(oracle).createPolicy(POLICY_2, 0, gov.address)).to.not.be.reverted;
      await expect(registry.connect(oracle).setPolicyMode(POLICY_ID, 1)).to.not.be.reverted;
      await expect(registry.connect(oracle).setPolicyManager(POLICY_ID, alice.address)).to.not.be.reverted;
      await expect(registry.connect(oracle).setAllowlisted(POLICY_ID, alice.address, true)).to.not.be.reverted;
      await expect(registry.connect(oracle).setBlocklisted(POLICY_ID, alice.address, true)).to.not.be.reverted;
    });
  });
});
