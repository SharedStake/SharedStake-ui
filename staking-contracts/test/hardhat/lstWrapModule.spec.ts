/**
 * Standalone unit tests for LSTWrapModule.
 *
 * Deploys the full modular-staking stack from scratch (StToken + StakingRouter +
 * LSTWrapModule + MockERC20 + MockLSTPriceOracle) so the tests are independent
 * of the validator-module fixtures used in `stakingRouter.spec.ts`.
 *
 * Coverage:
 *   1. wrapLST: pulls LST, mints stToken 1:1 against the oracle, tracks custody.
 *   2. unwrapLST: burns stToken, returns LST, drops custody back to zero.
 *   3. Mint cap: a tightly-capped module rejects an over-cap wrap.
 *   4. Stale oracle: a price-oracle that hasn't ticked in > maxOracleAgeSecs
 *      makes wrapLST revert with `StaleOracle` (security regression guard).
 */
import {ethers} from "hardhat";
import {expect} from "chai";
import {parseEther} from "ethers";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

const LST_MOD = ethers.keccak256(ethers.toUtf8Bytes("LST_WRAP_STANDALONE"));

describe("LSTWrapModule (standalone)", () => {
  let deployer: SignerWithAddress, gov: SignerWithAddress, alice: SignerWithAddress;
  let stToken: any, router: any, lstToken: any, oracle: any, lstModule: any;

  async function deployFresh(mintCapEth: bigint = parseEther("10")) {
    [deployer, gov, alice] = await ethers.getSigners();

    const StToken = await ethers.getContractFactory("StToken");
    stToken = await StToken.deploy();

    const StakingRouter = await ethers.getContractFactory("StakingRouter");
    router = await StakingRouter.deploy(stToken.target, gov.address);

    // Router is the sole MINTER on stToken.
    await stToken.addMinter(router.target);

    // Vanilla ERC20 + 1:1 oracle.
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    lstToken = await MockERC20.deploy("Mock LST", "mLST");

    const MockLSTPriceOracle = await ethers.getContractFactory("MockLSTPriceOracle");
    oracle = await MockLSTPriceOracle.deploy(parseEther("1"));

    const LSTWrapModule = await ethers.getContractFactory("LSTWrapModule");
    lstModule = await LSTWrapModule.deploy(router.target, LST_MOD, lstToken.target, gov.address);

    await router.connect(gov).registerModule(LST_MOD, lstModule.target, mintCapEth);
    await lstModule.connect(gov).setPriceOracle(oracle.target);

    // Fund Alice with LST and pre-approve the module.
    await lstToken.mint(alice.address, parseEther("100"));
    await lstToken.connect(alice).approve(lstModule.target, parseEther("100"));
  }

  beforeEach(async () => {
    await deployFresh();
  });

  it("wrapLST: pulls LST, mints stToken, tracks _lstHeld == lstAmount", async () => {
    const sharesBefore = await stToken.sharesOf(alice.address);
    const totalPooledBefore = await stToken.totalPooledEther();

    await lstModule.connect(alice).wrapLST(parseEther("1"), alice.address);

    const sharesAfter = await stToken.sharesOf(alice.address);
    expect(sharesAfter - sharesBefore).to.be.gt(0n);
    // 1:1 oracle, fresh module → exactly 1e18 shares minted.
    expect(sharesAfter - sharesBefore).to.equal(parseEther("1"));

    expect(await lstModule.lstHeld()).to.equal(parseEther("1"));
    expect(await lstToken.balanceOf(lstModule.target)).to.equal(parseEther("1"));
    expect(await stToken.totalPooledEther()).to.equal(totalPooledBefore + parseEther("1"));
  });

  it("unwrapLST: stToken balance decreases, user gets LST back, _lstHeld == 0", async () => {
    await lstModule.connect(alice).wrapLST(parseEther("1"), alice.address);
    expect(await lstModule.lstHeld()).to.equal(parseEther("1"));

    const stBalanceBefore = await stToken.balanceOf(alice.address);
    const lstBalanceBefore = await lstToken.balanceOf(alice.address);
    const sharesBefore = await stToken.sharesOf(alice.address);

    await lstModule.connect(alice).unwrapLST(stBalanceBefore, alice.address);

    // Shares burned.
    expect(await stToken.sharesOf(alice.address)).to.be.lt(sharesBefore);
    // Module fully drained of LST.
    expect(await lstModule.lstHeld()).to.equal(0n);
    expect(await lstToken.balanceOf(lstModule.target)).to.equal(0n);
    // Alice received her LST back.
    expect(await lstToken.balanceOf(alice.address)).to.equal(lstBalanceBefore + parseEther("1"));
  });

  it("mint cap exceeded: 0.5 ETH cap rejects 1 LST wrap with MintCapExceeded", async () => {
    // Fresh deployment with a tight 0.5 ETH cap.
    await deployFresh(parseEther("0.5"));

    await expect(
      lstModule.connect(alice).wrapLST(parseEther("1"), alice.address)
    ).to.be.revertedWithCustomError(router, "MintCapExceeded");
  });

  it("stale oracle: lastUpdated() = block.timestamp - 7200 makes wrapLST revert with StaleOracle", async () => {
    // Default maxOracleAgeSecs is 3600 (1 hour). Pin lastUpdated 2 hours in the
    // past so the staleness check trips. We use the live block timestamp from
    // hardhat to avoid underflow on a freshly-mined chain.
    const block = await ethers.provider.getBlock("latest");
    if (!block) throw new Error("no block");
    const stalePoint = BigInt(block.timestamp) - 7200n;
    await oracle.setLastUpdated(stalePoint);

    await expect(
      lstModule.connect(alice).wrapLST(parseEther("1"), alice.address)
    ).to.be.revertedWithCustomError(lstModule, "StaleOracle");
  });
});
