import {ethers} from "hardhat";
import {expect} from "chai";
import {parseEther} from "ethers";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

/**
 * StTokenERC4626Wrapper tests.
 *
 * stToken is rebasing: balanceOf returns ETH-equivalent that increases as
 * rewards accrue. We simulate rebasing by minting extra tokens directly to
 * the vault contract — equivalent to the pool growing from oracle reports.
 */
describe("StTokenERC4626Wrapper", () => {
  let deployer: SignerWithAddress, alice: SignerWithAddress, bob: SignerWithAddress;
  let mockStToken: any, wrapper: any;

  async function deploy() {
    [deployer, alice, bob] = await ethers.getSigners();

    // Simple mintable ERC-20 as a stand-in for the rebasing stToken.
    // We use a publicly available mock; the wrapper only needs ERC-20 surface.
    const ERC20Mock = await ethers.getContractFactory("MockERC20");
    mockStToken = await ERC20Mock.deploy("Mock stToken", "mstETH");

    const Wrapper = await ethers.getContractFactory("StTokenERC4626Wrapper");
    wrapper = await Wrapper.deploy(mockStToken.target);
  }

  async function mintAndApprove(user: SignerWithAddress, amount: bigint) {
    await mockStToken.mint(user.address, amount);
    await mockStToken.connect(user).approve(wrapper.target, amount);
  }

  beforeEach(async () => {
    await deploy();
  });

  // ── Construction ─────────────────────────────────────────────────────────

  it("stores stToken as the underlying asset", async () => {
    expect(await wrapper.asset()).to.equal(mockStToken.target);
  });

  it("reverts on zero address stToken", async () => {
    const Wrapper = await ethers.getContractFactory("StTokenERC4626Wrapper");
    await expect(
      Wrapper.deploy(ethers.ZeroAddress)
    ).to.be.revertedWith("StTokenERC4626Wrapper: zero address");
  });

  it("has correct name and symbol", async () => {
    expect(await wrapper.name()).to.equal("SharedStake Wrapped StToken");
    expect(await wrapper.symbol()).to.equal("wstToken-4626");
  });

  // ── Initial state ────────────────────────────────────────────────────────

  it("totalAssets is zero before any deposits", async () => {
    expect(await wrapper.totalAssets()).to.equal(0n);
  });

  it("convertToAssets(n) returns n when supply is zero (1:1 initial mint)", async () => {
    expect(await wrapper.convertToAssets(parseEther("1"))).to.equal(parseEther("1"));
  });

  // ── Deposit ──────────────────────────────────────────────────────────────

  it("deposit mints vault shares 1:1 on first deposit", async () => {
    const amount = parseEther("100");
    await mintAndApprove(alice, amount);

    await wrapper.connect(alice).deposit(amount, alice.address);

    expect(await wrapper.balanceOf(alice.address)).to.equal(amount);
    expect(await wrapper.totalAssets()).to.equal(amount);
    expect(await wrapper.totalSupply()).to.equal(amount);
  });

  it("deposit transfers stToken from depositor to vault", async () => {
    const amount = parseEther("50");
    await mintAndApprove(alice, amount);

    const aliceBefore = await mockStToken.balanceOf(alice.address);
    await wrapper.connect(alice).deposit(amount, alice.address);
    const aliceAfter = await mockStToken.balanceOf(alice.address);

    expect(aliceBefore - aliceAfter).to.equal(amount);
    expect(await mockStToken.balanceOf(wrapper.target)).to.equal(amount);
  });

  it("reverts zero-share deposit after donation inflation", async () => {
    const seed = parseEther("1");
    await mintAndApprove(alice, seed);
    await wrapper.connect(alice).deposit(seed, alice.address);

    // Inflate assets/share ratio by donating directly to the vault.
    const donation = parseEther("1");
    await mockStToken.mint(wrapper.target, donation);

    const victimAmount = 1n;
    await mintAndApprove(bob, victimAmount);

    await expect(
      wrapper.connect(bob).deposit(victimAmount, bob.address),
    ).to.be.revertedWithCustomError(wrapper, "ZeroSharesDeposit");
  });

  it("second depositor receives proportional shares", async () => {
    const first = parseEther("100");
    const second = parseEther("50");

    await mintAndApprove(alice, first);
    await wrapper.connect(alice).deposit(first, alice.address);

    await mintAndApprove(bob, second);
    await wrapper.connect(bob).deposit(second, bob.address);

    // Bob deposited half of Alice's amount, should get half the shares
    const aliceShares = await wrapper.balanceOf(alice.address);
    const bobShares = await wrapper.balanceOf(bob.address);
    expect(bobShares).to.equal(aliceShares / 2n);
  });

  // ── Reward accrual (simulated rebasing) ──────────────────────────────────

  it("vault shares appreciate when stToken rebases (rewards arrive)", async () => {
    const deposit = parseEther("100");
    await mintAndApprove(alice, deposit);
    await wrapper.connect(alice).deposit(deposit, alice.address);

    // Simulate reward: mint 10 extra stToken directly to the vault.
    // This mirrors what happens when totalPooledEther increases in the real stToken.
    const reward = parseEther("10");
    await mockStToken.mint(wrapper.target, reward);

    // Alice's vault shares should now be worth 110 stToken
    const aliceShares = await wrapper.balanceOf(alice.address);
    const redeemable = await wrapper.convertToAssets(aliceShares);
    expect(redeemable).to.equal(deposit + reward);
  });

  it("two depositors split rewards proportionally", async () => {
    const amount = parseEther("100");
    await mintAndApprove(alice, amount);
    await mintAndApprove(bob, amount);
    await wrapper.connect(alice).deposit(amount, alice.address);
    await wrapper.connect(bob).deposit(amount, bob.address);

    // 20 ETH of rewards arrive
    const reward = parseEther("20");
    await mockStToken.mint(wrapper.target, reward);

    const aliceRedeemable = await wrapper.convertToAssets(await wrapper.balanceOf(alice.address));
    const bobRedeemable = await wrapper.convertToAssets(await wrapper.balanceOf(bob.address));

    // Each should get ~110 stToken (100 deposit + 10 reward each)
    expect(aliceRedeemable).to.be.closeTo(parseEther("110"), parseEther("0.001"));
    expect(bobRedeemable).to.be.closeTo(parseEther("110"), parseEther("0.001"));
  });

  // ── Redeem ───────────────────────────────────────────────────────────────

  it("redeem burns vault shares and returns stToken", async () => {
    const amount = parseEther("100");
    await mintAndApprove(alice, amount);
    await wrapper.connect(alice).deposit(amount, alice.address);

    const shares = await wrapper.balanceOf(alice.address);
    const aliceStBefore = await mockStToken.balanceOf(alice.address);

    await wrapper.connect(alice).redeem(shares, alice.address, alice.address);

    expect(await wrapper.balanceOf(alice.address)).to.equal(0n);
    expect(await mockStToken.balanceOf(alice.address)).to.equal(aliceStBefore + amount);
  });

  it("redeem after reward returns deposit plus reward", async () => {
    const deposit = parseEther("100");
    await mintAndApprove(alice, deposit);
    await wrapper.connect(alice).deposit(deposit, alice.address);

    const reward = parseEther("10");
    await mockStToken.mint(wrapper.target, reward);

    const shares = await wrapper.balanceOf(alice.address);
    const aliceStBefore = await mockStToken.balanceOf(alice.address);

    await wrapper.connect(alice).redeem(shares, alice.address, alice.address);

    expect(await mockStToken.balanceOf(alice.address)).to.equal(aliceStBefore + deposit + reward);
  });

  // ── Preview round-trip consistency ───────────────────────────────────────

  it("previewDeposit and previewRedeem are inverses", async () => {
    const amount = parseEther("100");
    await mintAndApprove(alice, amount);
    await wrapper.connect(alice).deposit(amount, alice.address);

    // After initial deposit: previewDeposit(X) → shares; previewRedeem(shares) → X
    const shares = await wrapper.previewDeposit(parseEther("50"));
    const assets = await wrapper.previewRedeem(shares);
    expect(assets).to.be.closeTo(parseEther("50"), 1n);
  });
});
