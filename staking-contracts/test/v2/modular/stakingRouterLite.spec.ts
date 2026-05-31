import {expect} from "chai";
import {ethers} from "hardhat";
import {CuratedNorModuleLite, MockDepositContractLite, StakingRouterLite} from "../../../types";
import {parseEther} from "ethers";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

describe("StakingRouterLite", () => {
  let router: StakingRouterLite;
  let module1: CuratedNorModuleLite;
  let module2: CuratedNorModuleLite;
  let depositContract: MockDepositContractLite;
  let gov: SignerWithAddress;

  const WITHDRAWAL_CREDS = `0x${"11".repeat(32)}`;

  const buildBytes = (byteHex: string, byteLen: number): string => `0x${byteHex.repeat(byteLen)}`;

  const configureModuleData = async (module: CuratedNorModuleLite, keyCount: number) => {
    const pubkeys = Array.from({length: keyCount}, (_, i) => buildBytes(i % 2 === 0 ? "aa" : "bb", 48));
    const signatures = Array.from({length: keyCount}, (_, i) => buildBytes(i % 2 === 0 ? "cc" : "dd", 96));
    const roots = Array.from(
      {length: keyCount},
      (_, i) => `0x${(i + 1).toString(16).padStart(2, "0").repeat(32)}`,
    );

    await module.setDepositData(pubkeys, signatures, roots);
  };

  beforeEach(async () => {
    const [deployer, govSigner] = await ethers.getSigners();
    gov = govSigner;

    const DepositFactory = await ethers.getContractFactory("MockDepositContractLite");
    depositContract = (await DepositFactory.deploy()) as MockDepositContractLite;
    await depositContract.waitForDeployment();

    const RouterFactory = await ethers.getContractFactory("StakingRouterLite");
    router = (await RouterFactory.deploy(gov.address, depositContract.target, WITHDRAWAL_CREDS)) as StakingRouterLite;
    await router.waitForDeployment();

    const ModuleFactory = await ethers.getContractFactory("CuratedNorModuleLite");
    module1 = (await ModuleFactory.deploy(gov.address, deployer.address)) as CuratedNorModuleLite;
    module2 = (await ModuleFactory.deploy(gov.address, deployer.address)) as CuratedNorModuleLite;
    await module1.waitForDeployment();
    await module2.waitForDeployment();

    await module1.connect(gov).setRouter(router.target);
    await module2.connect(gov).setRouter(router.target);

    await module1.setAvailableValidatorKeys(2);
    await module2.setAvailableValidatorKeys(4);
    await configureModuleData(module1, 2);
    await configureModuleData(module2, 4);
  });

  it("enforces GOV role for module registration", async () => {
    const [, , alice] = await ethers.getSigners();
    await expect(router.connect(alice).addModule(module1.target, 7000, 9000, 500, 100)).to.be.reverted;
  });

  it("adds modules and stores config/state", async () => {
    await expect(router.connect(gov).addModule(module1.target, 7000, 9000, 500, 100)).to.be.emit(router, "ModuleAdded");
    await expect(router.connect(gov).addModule(module2.target, 3000, 5000, 300, 50)).to.be.emit(router, "ModuleAdded");

    const first = await router.getModule(1);
    expect(first.module).to.eq(module1.target);
    expect(first.targetShareBps).to.eq(7000);
    expect(first.availableValidatorKeys).to.eq(2);

    await expect(router.connect(gov).addModule(module1.target, 1000, 2000, 100, 100)).to.be.revertedWithCustomError(
      router,
      "ModuleAlreadyExists",
    );
  });

  it("previews target-aware allocation with capacity caps", async () => {
    await router.connect(gov).addModule(module1.target, 7000, 9000, 500, 100);
    await router.connect(gov).addModule(module2.target, 3000, 5000, 300, 50);

    const [moduleIds, allocations] = await router.previewAllocation(10);
    expect(moduleIds.map(v => Number(v))).to.deep.eq([1, 2]);
    expect(allocations.map(v => Number(v))).to.deep.eq([2, 3]);
  });

  it("blocks deposits for paused module", async () => {
    await router.connect(gov).addModule(module1.target, 7000, 9000, 500, 100);
    await router.connect(gov).setModuleStatus(1, 1);

    await expect(router.connect(gov).executeDeposits(1, 1, {value: parseEther("32")})).to.be.revertedWithCustomError(
      router,
      "InvalidStatus",
    );
  });

  it("checks deposit value and executes guarded deposits", async () => {
    await router.connect(gov).addModule(module1.target, 7000, 9000, 500, 100);

    await expect(router.connect(gov).executeDeposits(1, 1, {value: parseEther("1")})).to.be.revertedWithCustomError(
      router,
      "ValueMismatch",
    );

    await expect(router.connect(gov).executeDeposits(1, 2, {value: parseEther("64")})).to.be.emit(
      router,
      "ModuleDepositsExecuted",
    );

    const after = await router.getModule(1);
    expect(after.availableValidatorKeys).to.eq(0);
    expect(after.depositedValidatorCount).to.eq(2);
    expect(await depositContract.depositCount()).to.eq(2);
  });
});
