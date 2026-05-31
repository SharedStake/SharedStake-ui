import {expect} from "chai";
import {ethers} from "hardhat";
import {CuratedNorModuleLite} from "../../../types";

describe("CuratedNorModuleLite", () => {
  let module: CuratedNorModuleLite;

  const buildBytes = (byteHex: string, byteLen: number): string => `0x${byteHex.repeat(byteLen)}`;

  beforeEach(async () => {
    const [deployer, gov] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("CuratedNorModuleLite");
    module = (await Factory.deploy(gov.address, deployer.address)) as CuratedNorModuleLite;
    await module.waitForDeployment();
  });

  it("allows only operator to set keys/data", async () => {
    const [, , alice] = await ethers.getSigners();
    await expect(module.connect(alice).setAvailableValidatorKeys(1)).to.be.reverted;

    await module.setAvailableValidatorKeys(2);
    expect(await module.availableValidatorKeys()).to.eq(2);

    const pubkeys = [buildBytes("aa", 48), buildBytes("bb", 48)];
    const signatures = [buildBytes("cc", 96), buildBytes("dd", 96)];
    const roots = [`0x${"11".repeat(32)}`, `0x${"22".repeat(32)}`];
    await expect(module.setDepositData(pubkeys, signatures, roots)).to.be.emit(module, "ModuleDataConfigured");
  });

  it("validates read/deposit bookkeeping constraints", async () => {
    const [deployer, gov] = await ethers.getSigners();

    await module.setAvailableValidatorKeys(2);
    const pubkeys = [buildBytes("aa", 48), buildBytes("bb", 48)];
    const signatures = [buildBytes("cc", 96), buildBytes("dd", 96)];
    const roots = [`0x${"11".repeat(32)}`, `0x${"22".repeat(32)}`];
    await module.setDepositData(pubkeys, signatures, roots);

    await expect(module.getDepositData(0)).to.be.revertedWithCustomError(module, "InvalidCount");
    const [outPubkeys, outSigs, outRoots] = await module.getDepositData(2);
    expect(outPubkeys.length).to.eq(2);
    expect(outSigs.length).to.eq(2);
    expect(outRoots.length).to.eq(2);

    await expect(module.markDeposited(1)).to.be.reverted;

    await module.connect(gov).setRouter(deployer.address);
    await expect(module.markDeposited(1)).to.be.emit(module, "DepositedMarked");

    expect(await module.availableValidatorKeys()).to.eq(1);
    expect(await module.depositedValidatorCount()).to.eq(1);
  });
});

