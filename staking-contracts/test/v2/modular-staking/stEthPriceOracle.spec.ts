import {ethers} from "hardhat";
import {expect} from "chai";
import {parseEther, ZeroAddress} from "ethers";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

describe("StEthPriceOracle", () => {
  let deployer: SignerWithAddress, gov: SignerWithAddress, alice: SignerWithAddress;
  let oracle: any, mockStEth: any, mockAggregator: any;

  async function deployFresh() {
    [deployer, gov, alice] = await ethers.getSigners();

    // Deploy a minimal mock that mimics IStEth (identity mapping)
    const MockIStEth = await ethers.getContractFactory("MockIStEth");
    mockStEth = await MockIStEth.deploy();

    // Deploy mock Chainlink aggregator
    const MockAggregatorV3 = await ethers.getContractFactory("MockAggregatorV3");
    const block = await ethers.provider.getBlock("latest");
    mockAggregator = await MockAggregatorV3.deploy(parseEther("1"), block!.timestamp);

    const StEthPriceOracle = await ethers.getContractFactory("StEthPriceOracle");
    oracle = await StEthPriceOracle.deploy(mockStEth.target, mockAggregator.target);
  }

  beforeEach(async () => {
    await deployFresh();
  });

  it("deployment stores stETH address", async () => {
    expect(await oracle.ST_ETH()).to.equal(mockStEth.target);
  });

  it("deployment stores Chainlink feed address", async () => {
    expect(await oracle.CHAINLINK_FEED()).to.equal(mockAggregator.target);
  });

  it("reverts on zero address constructor for stEth", async () => {
    const StEthPriceOracle = await ethers.getContractFactory("StEthPriceOracle");
    await expect(StEthPriceOracle.deploy(ZeroAddress, mockAggregator.target)).to.be.reverted;
  });

  it("reverts on zero address constructor for chainlinkFeed", async () => {
    const StEthPriceOracle = await ethers.getContractFactory("StEthPriceOracle");
    await expect(StEthPriceOracle.deploy(mockStEth.target, ZeroAddress)).to.be.reverted;
  });

  it("getEthValue returns ETH value for LST amount", async () => {
    const ethValue = await oracle.getEthValue(parseEther("1"));
    // MockLSTPriceOracle returns identity by default (1:1)
    expect(ethValue).to.equal(parseEther("1"));
  });

  it("getLstValue returns LST value for ETH amount", async () => {
    const lstValue = await oracle.getLstValue(parseEther("1"));
    expect(lstValue).to.equal(parseEther("1"));
  });

  it("lastUpdated returns Chainlink feed timestamp", async () => {
    const block = await ethers.provider.getBlock("latest");
    const ts = await oracle.lastUpdated();
    // Allow small timing difference due to block mining
    expect(ts).to.be.closeTo(block!.timestamp, 2);
  });

  it("lastUpdated reflects updated feed timestamp", async () => {
    const newTimestamp = 1234567890;
    await mockAggregator.setUpdatedAt(newTimestamp);
    const ts = await oracle.lastUpdated();
    expect(ts).to.equal(newTimestamp);
  });

  it("round-trip consistency: getEthValue(getLstValue(x)) ≈ x", async () => {
    const amount = parseEther("100");
    const lst = await oracle.getLstValue(amount);
    const eth = await oracle.getEthValue(lst);
    // With identity oracle, should be exact
    expect(eth).to.equal(amount);
  });
});
