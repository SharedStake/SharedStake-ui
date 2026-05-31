/**
 * Unit tests for ShareMath library (via a thin harness deployed in the test).
 *
 * Tested properties:
 *   1. Bootstrap: first deposit gets 1:1 shares (totalPooledEth == 0).
 *   2. Conversion round-trip: getSharesByPooledEth ∘ getPooledEthByShares ≤ original amount.
 *   3. Rounding direction: minting always floors (no phantom shares).
 *   4. Large numbers: no overflow at 1e24 ether.
 *   5. Slash scenario: exchange rate falls but conversion stays deterministic.
 */
import {ethers} from "hardhat";
import {expect} from "chai";
import {parseEther} from "ethers";

// We test ShareMath indirectly through StToken which exposes the pure functions.
describe("ShareMath (via StToken)", () => {
  let stToken: any;
  let deployer: any;

  before(async () => {
    [deployer] = await ethers.getSigners();
    const StToken = await ethers.getContractFactory("StToken");
    stToken = await StToken.deploy();
  });

  // Helper: simulate a pool state by setting shares/pooled via StakingCore-like calls.
  // Since StToken only exposes MINTER-gated mutators, we use deployer (who is admin)
  // to grant MINTER to deployer, then manipulate state.
  before(async () => {
    const MINTER = await stToken.MINTER();
    await stToken.addMinter(deployer.address);
  });

  describe("Bootstrap (empty pool)", () => {
    it("returns ethAmount shares when totalPooledEther == 0", async () => {
      const amount = parseEther("1");
      const shares = await stToken.getSharesByPooledEth(amount);
      expect(shares).to.equal(amount); // 1:1 bootstrap
    });

    it("getPooledEthByShares returns 0 when totalShares == 0", async () => {
      const eth = await stToken.getPooledEthByShares(parseEther("1"));
      expect(eth).to.equal(0n);
    });
  });

  describe("After seeding the pool", () => {
    const POOL_ETH = parseEther("100");
    const SHARES = parseEther("100");

    before(async () => {
      // Seed: 100 ETH, 100 shares => 1:1 rate.
      await stToken.setTotalPooledEther(POOL_ETH);
      await stToken.mintShares(deployer.address, SHARES);
    });

    it("1:1 at par — getSharesByPooledEth(1 ETH) == 1e18", async () => {
      expect(await stToken.getSharesByPooledEth(parseEther("1"))).to.equal(parseEther("1"));
    });

    it("1:1 at par — getPooledEthByShares(1e18) == 1 ETH", async () => {
      expect(await stToken.getPooledEthByShares(parseEther("1"))).to.equal(parseEther("1"));
    });

    it("round-trip floors correctly (no value created)", async () => {
      const amount = parseEther("1") + 1n; // not a clean division
      const shares = await stToken.getSharesByPooledEth(amount);
      const eth = await stToken.getPooledEthByShares(shares);
      expect(eth).to.be.lte(amount); // round-trip never exceeds original
    });
  });

  describe("After 10% reward rebase (rate = 1.1)", () => {
    before(async () => {
      // Increase pool by 10% to simulate rewards.
      await stToken.setTotalPooledEther(parseEther("110"));
    });

    it("1 share now worth 1.1 ETH", async () => {
      const eth = await stToken.getPooledEthByShares(parseEther("1"));
      expect(eth).to.equal(parseEther("1.1"));
    });

    it("new deposit of 1.1 ETH receives 1 share", async () => {
      const shares = await stToken.getSharesByPooledEth(parseEther("1.1"));
      expect(shares).to.equal(parseEther("1"));
    });
  });

  describe("Slash scenario (10% balance loss)", () => {
    before(async () => {
      // Drop pool from 110 ETH to 99 ETH (10% slash).
      await stToken.setTotalPooledEther(parseEther("99"));
    });

    it("1 share now worth 0.99 ETH", async () => {
      const eth = await stToken.getPooledEthByShares(parseEther("1"));
      expect(eth).to.equal(parseEther("0.99"));
    });

    it("conversion is deterministic under slash", async () => {
      const shares = await stToken.getSharesByPooledEth(parseEther("0.99"));
      expect(shares).to.equal(parseEther("1"));
    });
  });

  describe("Large numbers", () => {
    before(async () => {
      // Reset to 1:1, massive scale.
      await stToken.setTotalPooledEther(parseEther("1000000"));
      await stToken.mintShares(deployer.address, parseEther("900000")); // supplement existing 100
    });

    it("handles 1 million ETH pool without overflow", async () => {
      const shares = await stToken.getSharesByPooledEth(parseEther("500000"));
      expect(shares).to.be.gt(0n);
      const eth = await stToken.getPooledEthByShares(shares);
      expect(eth).to.be.lte(parseEther("500000"));
    });
  });
});
