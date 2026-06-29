import {expect} from "chai";
import {ethers, upgrades} from "hardhat";
import {parseEther} from "ethers";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

const DEFAULT_CONFIG = ethers.keccak256(ethers.toUtf8Bytes("default"));
const CHEAP_CONFIG = ethers.keccak256(ethers.toUtf8Bytes("cheap"));

describe("OperatorRegistry NFT bond credit", () => {
  let deployer: SignerWithAddress;
  let gov: SignerWithAddress;
  let operator: SignerWithAddress;
  let artist: SignerWithAddress;
  let mockSgt: any;
  let registry: any;
  let nft: any;

  beforeEach(async () => {
    [deployer, gov, operator, artist] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockSgt = await MockERC20.deploy("SharedStake Governance Token", "SGT");

    const OperatorRegistry = await ethers.getContractFactory("OperatorRegistry");
    registry = await upgrades.deployProxy(OperatorRegistry, [mockSgt.target, gov.address], {kind: "uups", initializer: "initialize"});
    await registry.waitForDeployment();
    await registry.connect(gov).setBondConfig(DEFAULT_CONFIG, parseEther("1"), parseEther("1000"), 10);
    await registry.connect(gov).setDefaultConfig(DEFAULT_CONFIG);

    const MintableNFTSale = await ethers.getContractFactory("MintableNFTSale");
    nft = await MintableNFTSale.deploy("SharedStake NFT", "SSNFT", parseEther("0.1"), 100, 10, artist.address);
    await nft.transferFrom(deployer.address, operator.address, 5);

    await registry.connect(gov).setNftContract(nft.target, parseEther("250"));
  });

  it("applies escrowed NFT credit to the initial SGT bond and returns the NFT on exit", async () => {
    await nft.connect(operator).approve(registry.target, 5);
    await expect(registry.connect(operator).lockNftForCredit(5))
      .to.emit(registry, "NftLocked")
      .withArgs(operator.address, 5, parseEther("250"));

    expect(await registry.escrowedNftCount(operator.address)).to.equal(1n);
    expect(await nft.ownerOf(5)).to.equal(registry.target);

    await mockSgt.mint(operator.address, parseEther("750"));
    await mockSgt.connect(operator).approve(registry.target, parseEther("750"));
    await registry
      .connect(operator)
      .registerBondWithSgt(DEFAULT_CONFIG, 1, parseEther("750"), {value: parseEther("1")});

    const opData = await registry.getOperator(operator.address);
    expect(opData.sgtBonded).to.equal(parseEther("750"));
    expect(opData.totalSlots).to.equal(1n);

    await registry.connect(operator).exitBond();
    // NFTs use pull pattern — operator must claim them separately after exitBond
    await expect(registry.connect(operator).withdrawEscrowedNfts())
      .to.emit(registry, "NftUnlocked")
      .withArgs(operator.address, 5);
    expect(await nft.ownerOf(5)).to.equal(operator.address);
    expect(await registry.escrowedNftCount(operator.address)).to.equal(0n);
  });

  it("does not let the same NFT credit reduce multiple slot expansions", async () => {
    await nft.connect(operator).approve(registry.target, 5);
    await registry.connect(operator).lockNftForCredit(5);

    await mockSgt.mint(operator.address, parseEther("1750"));
    await mockSgt.connect(operator).approve(registry.target, parseEther("1750"));
    await registry
      .connect(operator)
      .registerBondWithSgt(DEFAULT_CONFIG, 1, parseEther("750"), {value: parseEther("1")});

    await expect(registry.connect(operator).expandSlotsWithSgt(1, parseEther("750"), {value: parseEther("1")}))
      .to.be.revertedWithCustomError(registry, "InsufficientBond")
      .withArgs(parseEther("1000"), parseEther("750"));

    await registry.connect(operator).expandSlotsWithSgt(1, parseEther("1000"), {value: parseEther("1")});
    const opData = await registry.getOperator(operator.address);
    expect(opData.sgtBonded).to.equal(parseEther("1750"));
    expect(opData.totalSlots).to.equal(2n);
  });

  it("does not allow re-registering under a different config to bypass slot collateral", async () => {
    await registry.connect(gov).setBondConfig(CHEAP_CONFIG, parseEther("0.01"), parseEther("1"), 100);

    await mockSgt.mint(operator.address, parseEther("1000"));
    await mockSgt.connect(operator).approve(registry.target, parseEther("1000"));
    await registry
      .connect(operator)
      .registerBondWithSgt(DEFAULT_CONFIG, 1, parseEther("1000"), {value: parseEther("1")});

    await expect(
      registry.connect(operator).registerBondWithSgt(CHEAP_CONFIG, 99, 0, {value: parseEther("0.99")}),
    ).to.be.revertedWithCustomError(registry, "InvalidAmount");
  });

  it("freezes NFT credit configuration while NFTs are escrowed", async () => {
    await nft.connect(operator).approve(registry.target, 5);
    await registry.connect(operator).lockNftForCredit(5);

    await expect(registry.connect(gov).setNftContract(nft.target, parseEther("300"))).to.be.revertedWithCustomError(
      registry,
      "InvalidConfig",
    );
    await expect(registry.connect(gov).setNftContract(ethers.ZeroAddress, 0)).to.be.revertedWithCustomError(
      registry,
      "InvalidConfig",
    );

    await registry.connect(operator).exitBond();
    await registry.connect(operator).withdrawEscrowedNfts();
    await expect(registry.connect(gov).setNftContract(ethers.ZeroAddress, 0))
      .to.emit(registry, "NftContractSet")
      .withArgs(ethers.ZeroAddress, 0);
  });

  it("uses NFT credit when recalculating slots after a slash", async () => {
    await nft.connect(operator).approve(registry.target, 5);
    await registry.connect(operator).lockNftForCredit(5);

    await mockSgt.mint(operator.address, parseEther("1750"));
    await mockSgt.connect(operator).approve(registry.target, parseEther("1750"));
    await registry
      .connect(operator)
      .registerBondWithSgt(DEFAULT_CONFIG, 2, parseEther("1750"), {value: parseEther("2")});

    await expect(registry.connect(gov).slash(operator.address, parseEther("1000")))
      .to.emit(registry, "OperatorSlashed")
      .withArgs(operator.address, parseEther("1000"));

    const opData = await registry.getOperator(operator.address);
    expect(opData.sgtBonded).to.equal(parseEther("750"));
    expect(opData.totalSlots).to.equal(1n);
  });
});
