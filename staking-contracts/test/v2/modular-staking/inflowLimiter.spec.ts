import {ethers} from "hardhat";
import {expect} from "chai";
import {parseEther, ZeroAddress} from "ethers";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

describe("StakingRouter Inflow Limiter", () => {
  let deployer: SignerWithAddress, gov: SignerWithAddress, alice: SignerWithAddress, bob: SignerWithAddress;
  let router: any, stToken: any, module: any;

  const MODULE_ID = ethers.keccak256(ethers.toUtf8Bytes("TEST_MODULE"));

  async function deployFresh() {
    [deployer, gov, alice, bob] = await ethers.getSigners();

    const StToken = await ethers.getContractFactory("StToken");
    stToken = await StToken.deploy();

    const StakingRouter = await ethers.getContractFactory("StakingRouter");
    router = await StakingRouter.deploy(stToken.target, gov.address);

    const ValidatorModule = await ethers.getContractFactory("ValidatorModule");
    module = await ValidatorModule.deploy(router.target, MODULE_ID, gov.address, ZeroAddress);

    await stToken.addMinter(router.target);
    await router.connect(gov).registerModule(MODULE_ID, module.target, 0);
  }

  beforeEach(async () => {
    await deployFresh();
  });

  it("allows deposits within inflow window limit", async () => {
    await router.connect(gov).setModuleInflowLimit(MODULE_ID, 3600, parseEther("10"));

    await router.connect(alice).submitToModule(MODULE_ID, ZeroAddress, {value: parseEther("5")});
    await router.connect(bob).submitToModule(MODULE_ID, ZeroAddress, {value: parseEther("5")});

    expect(await stToken.totalPooledEther()).to.equal(parseEther("10"));
  });

  it("reverts when inflow window limit exceeded", async () => {
    await router.connect(gov).setModuleInflowLimit(MODULE_ID, 3600, parseEther("10"));

    await router.connect(alice).submitToModule(MODULE_ID, ZeroAddress, {value: parseEther("6")});
    await expect(
      router.connect(bob).submitToModule(MODULE_ID, ZeroAddress, {value: parseEther("6")})
    ).to.be.revertedWithCustomError(router, "InflowLimitExceeded");
  });

  it("resets window after duration passes", async () => {
    await router.connect(gov).setModuleInflowLimit(MODULE_ID, 2, parseEther("1"));

    await router.connect(alice).submitToModule(MODULE_ID, ZeroAddress, {value: parseEther("1")});
    await expect(
      router.connect(alice).submitToModule(MODULE_ID, ZeroAddress, {value: parseEther("1")})
    ).to.be.revertedWithCustomError(router, "InflowLimitExceeded");

    // Advance time past window
    await ethers.provider.send("evm_increaseTime", [3]);
    await ethers.provider.send("evm_mine", []);

    // Should succeed in new window
    await router.connect(alice).submitToModule(MODULE_ID, ZeroAddress, {value: parseEther("1")});
  });

  it("disabled when windowSeconds or maxInflow is zero", async () => {
    // Zero config = disabled
    await router.connect(gov).setModuleInflowLimit(MODULE_ID, 0, 0);

    // Large deposit should succeed with no limit
    await router.connect(alice).submitToModule(MODULE_ID, ZeroAddress, {value: parseEther("100")});
    expect(await stToken.totalPooledEther()).to.equal(parseEther("100"));
  });

  it("reverts for unregistered module", async () => {
    const fakeId = ethers.keccak256(ethers.toUtf8Bytes("FAKE"));
    await expect(
      router.connect(gov).setModuleInflowLimit(fakeId, 3600, parseEther("10"))
    ).to.be.revertedWithCustomError(router, "ModuleNotRegistered");
  });

  it("wrap respects inflow limit (integration check)", async () => {
    // Setup a real LST token and LSTWrapModule
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const lstToken = await MockERC20.deploy("LST", "LST");

    const MockLSTPriceOracle = await ethers.getContractFactory("MockLSTPriceOracle");
    const priceOracle = await MockLSTPriceOracle.deploy(parseEther("1"));

    const LSTWrapModule = await ethers.getContractFactory("LSTWrapModule");
    const lstId = ethers.keccak256(ethers.toUtf8Bytes("LST_MODULE"));
    const lstModule = await LSTWrapModule.deploy(router.target, lstId, lstToken.target, gov.address);
    await lstModule.connect(gov).setPriceOracle(priceOracle.target);

    await router.connect(gov).registerModule(lstId, lstModule.target, 0);
    await router.connect(gov).setModuleInflowLimit(lstId, 3600, parseEther("5"));

    // Mint LST to alice and approve
    await lstToken.mint(alice.address, parseEther("10"));
    await lstToken.connect(alice).approve(lstModule.target, parseEther("10"));

    // Small wrap (within limit) succeeds
    await lstModule.connect(alice).wrapLST(parseEther("1"), alice.address);

    // Second wrap pushes cumulative inflow above 5 ETH and should revert at router level
    await expect(
      lstModule.connect(alice).wrapLST(parseEther("6"), alice.address)
    ).to.be.revertedWithCustomError(router, "InflowLimitExceeded");
  });
});
