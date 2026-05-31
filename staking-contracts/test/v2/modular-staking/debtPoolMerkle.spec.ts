/**
 * Integration tests for DebtPool merkle tree functionality with OpenZeppelin standard
 *
 * Tests the complete flow:
 * - Build merkle tree off-chain using @openzeppelin/merkle-tree
 * - Deploy DebtPool with mock ST_TOKEN and WSTETH
 * - Set merkle root on-chain via createDistribution
 * - Verify claims work with off-chain generated proofs
 * - Test edge cases: double-claim, wrong proof, wrong amount
 * - Test all recipients can claim successfully
 */
import {ethers} from "hardhat";
import {expect} from "chai";
import {parseEther, ZeroAddress} from "ethers";
import {StandardMerkleTree} from "@openzeppelin/merkle-tree";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

describe("DebtPool Merkle Tree Integration", () => {
  let deployer: SignerWithAddress,
    gov: SignerWithAddress,
    admin: SignerWithAddress,
    feeController: SignerWithAddress,
    recipient1: SignerWithAddress,
    recipient2: SignerWithAddress,
    recipient3: SignerWithAddress,
    recipient4: SignerWithAddress,
    recipient5: SignerWithAddress;

  let stToken: any, wstETH: any, debtPool: any;
  let merkleTree: StandardMerkleTree<any>;
  let merkleRoot: string;
  let proofs: Map<string, any>;

  const DISTRIBUTION_ID = 1;
  const TOTAL_AMOUNT = parseEther("10"); // 10 wstETH total

  // Claims for 5 recipients with different amounts
  const claims = [
    {distributionId: DISTRIBUTION_ID, leafIndex: 0, amount: parseEther("1").toString()},
    {distributionId: DISTRIBUTION_ID, leafIndex: 1, amount: parseEther("2").toString()},
    {distributionId: DISTRIBUTION_ID, leafIndex: 2, amount: parseEther("1.5").toString()},
    {distributionId: DISTRIBUTION_ID, leafIndex: 3, amount: parseEther("3").toString()},
    {distributionId: DISTRIBUTION_ID, leafIndex: 4, amount: parseEther("2.5").toString()},
  ];

  async function deployFresh() {
    [deployer, gov, admin, feeController, recipient1, recipient2, recipient3, recipient4, recipient5] =
      await ethers.getSigners();

    // Deploy mock tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    stToken = await MockERC20.deploy("Mock ST_TOKEN", "mST");
    wstETH = await MockERC20.deploy("Mock wstETH", "mwstETH");

    // Deploy DebtPool
    const DebtPool = await ethers.getContractFactory("DebtPool");
    debtPool = await DebtPool.deploy(stToken.target, wstETH.target, gov.address, admin.address, feeController.address);

    // Build merkle tree off-chain using OZ StandardMerkleTree
    const values = claims.map(claim => [
      claim.distributionId,
      claim.leafIndex,
      recipient1.address, // Temporary, will be replaced below
      claim.amount,
    ]);

    // Create proper values with actual recipient addresses
    const properValues = [
      [DISTRIBUTION_ID, 0, recipient1.address, claims[0].amount],
      [DISTRIBUTION_ID, 1, recipient2.address, claims[1].amount],
      [DISTRIBUTION_ID, 2, recipient3.address, claims[2].amount],
      [DISTRIBUTION_ID, 3, recipient4.address, claims[3].amount],
      [DISTRIBUTION_ID, 4, recipient5.address, claims[4].amount],
    ];

    merkleTree = StandardMerkleTree.of(properValues, ["uint256", "uint256", "address", "uint256"]);
    merkleRoot = merkleTree.root;

    // Generate proofs for each recipient
    proofs = new Map();
    const recipients = [recipient1, recipient2, recipient3, recipient4, recipient5];
    for (const [i, value] of merkleTree.entries()) {
      const proof = merkleTree.getProof(i);
      proofs.set(recipients[i].address.toLowerCase(), {
        leafIndex: i,
        proof: proof,
        amount: claims[i].amount,
        distributionId: DISTRIBUTION_ID,
      });
    }

    // Fund DebtPool with wstETH
    await wstETH.mint(debtPool.target, TOTAL_AMOUNT);
  }

  beforeEach(deployFresh);

  describe("Off-chain tree building and on-chain verification", () => {
    it("should build merkle tree off-chain and set root on-chain", async () => {
      // Create distribution with merkle root
      await debtPool.connect(admin).createDistribution(merkleRoot, TOTAL_AMOUNT);

      // Verify distribution was created correctly
      const distribution = await debtPool.distributions(DISTRIBUTION_ID);
      expect(distribution.merkleRoot).to.equal(merkleRoot);
      expect(distribution.totalAmount).to.equal(TOTAL_AMOUNT);
      expect(distribution.finalized).to.be.true;
    });

    it("valid claim should succeed with proof from off-chain tool", async () => {
      // Setup distribution
      await debtPool.connect(admin).createDistribution(merkleRoot, TOTAL_AMOUNT);

      // Claim with valid proof
      const proofData = proofs.get(recipient1.address.toLowerCase());
      await debtPool
        .connect(recipient1)
        .claim(proofData.distributionId, proofData.leafIndex, recipient1.address, proofData.amount, proofData.proof);

      // Verify claim was successful
      const claimed = await debtPool.claimed(DISTRIBUTION_ID, 0);
      expect(claimed).to.be.true;

      // Verify recipient received wstETH
      const balance = await wstETH.balanceOf(recipient1.address);
      expect(balance).to.equal(claims[0].amount);
    });

    it("double-claim should revert with AlreadyClaimed", async () => {
      // Setup distribution
      await debtPool.connect(admin).createDistribution(merkleRoot, TOTAL_AMOUNT);

      // First claim
      const proofData = proofs.get(recipient1.address.toLowerCase());
      await debtPool
        .connect(recipient1)
        .claim(proofData.distributionId, proofData.leafIndex, recipient1.address, proofData.amount, proofData.proof);

      // Second claim should revert
      await expect(
        debtPool
          .connect(recipient1)
          .claim(proofData.distributionId, proofData.leafIndex, recipient1.address, proofData.amount, proofData.proof),
      ).to.be.revertedWithCustomError(debtPool, "AlreadyClaimed");
    });

    it("wrong proof should revert with InvalidMerkleProof", async () => {
      // Setup distribution
      await debtPool.connect(admin).createDistribution(merkleRoot, TOTAL_AMOUNT);

      // Try to claim with wrong proof (use recipient2's proof for recipient1)
      const proofData1 = proofs.get(recipient1.address.toLowerCase());
      const proofData2 = proofs.get(recipient2.address.toLowerCase());

      await expect(
        debtPool.connect(recipient1).claim(
          proofData1.distributionId,
          proofData1.leafIndex,
          recipient1.address,
          proofData1.amount,
          proofData2.proof, // Wrong proof
        ),
      ).to.be.revertedWithCustomError(debtPool, "InvalidMerkleProof");
    });

    it("wrong amount in proof should revert", async () => {
      // Setup distribution
      await debtPool.connect(admin).createDistribution(merkleRoot, TOTAL_AMOUNT);

      // Try to claim with wrong amount
      const proofData = proofs.get(recipient1.address.toLowerCase());
      const wrongAmount = parseEther("999").toString(); // Wrong amount

      await expect(
        debtPool
          .connect(recipient1)
          .claim(proofData.distributionId, proofData.leafIndex, recipient1.address, wrongAmount, proofData.proof),
      ).to.be.revertedWithCustomError(debtPool, "InvalidMerkleProof");
    });

    it("all 5 recipients can claim successfully", async () => {
      // Setup distribution
      await debtPool.connect(admin).createDistribution(merkleRoot, TOTAL_AMOUNT);

      const recipients = [recipient1, recipient2, recipient3, recipient4, recipient5];

      // All recipients claim successfully
      for (let i = 0; i < recipients.length; i++) {
        const proofData = proofs.get(recipients[i].address.toLowerCase());
        await debtPool
          .connect(recipients[i])
          .claim(
            proofData.distributionId,
            proofData.leafIndex,
            recipients[i].address,
            proofData.amount,
            proofData.proof,
          );

        // Verify claim was marked
        const claimed = await debtPool.claimed(DISTRIBUTION_ID, i);
        expect(claimed).to.be.true;
      }
    });

    it("claimed amounts should match expected totals", async () => {
      // Setup distribution
      await debtPool.connect(admin).createDistribution(merkleRoot, TOTAL_AMOUNT);

      const recipients = [recipient1, recipient2, recipient3, recipient4, recipient5];
      let totalClaimed = 0n;

      // All recipients claim
      for (let i = 0; i < recipients.length; i++) {
        const proofData = proofs.get(recipients[i].address.toLowerCase());
        await debtPool
          .connect(recipients[i])
          .claim(
            proofData.distributionId,
            proofData.leafIndex,
            recipients[i].address,
            proofData.amount,
            proofData.proof,
          );

        totalClaimed += BigInt(claims[i].amount);

        // Verify individual recipient balance
        const balance = await wstETH.balanceOf(recipients[i].address);
        expect(balance).to.equal(claims[i].amount);
      }

      // Verify total claimed matches distribution total
      const distribution = await debtPool.distributions(DISTRIBUTION_ID);
      expect(distribution.claimedAmount).to.equal(totalClaimed);
      expect(distribution.claimedAmount).to.equal(TOTAL_AMOUNT);

      // Verify contract total claimed
      expect(await debtPool.totalWSTETHClaimed()).to.equal(totalClaimed);
    });

    it("claim before distribution finalization should revert", async () => {
      // Don't create distribution, try to claim directly
      const proofData = proofs.get(recipient1.address.toLowerCase());

      await expect(
        debtPool
          .connect(recipient1)
          .claim(proofData.distributionId, proofData.leafIndex, recipient1.address, proofData.amount, proofData.proof),
      ).to.be.revertedWithCustomError(debtPool, "DistributionNotFinalized");
    });

    it("claim with zero amount should revert", async () => {
      // Setup distribution
      await debtPool.connect(admin).createDistribution(merkleRoot, TOTAL_AMOUNT);

      const proofData = proofs.get(recipient1.address.toLowerCase());

      await expect(
        debtPool.connect(recipient1).claim(
          proofData.distributionId,
          proofData.leafIndex,
          recipient1.address,
          0, // Zero amount
          proofData.proof,
        ),
      ).to.be.revertedWithCustomError(debtPool, "InvalidAmount");
    });
  });

  describe("Merkle tree consistency", () => {
    it("off-chain tree root should match on-chain verification", async () => {
      // Setup distribution
      await debtPool.connect(admin).createDistribution(merkleRoot, TOTAL_AMOUNT);

      // Verify that the off-chain generated proof works on-chain
      const proofData = proofs.get(recipient1.address.toLowerCase());

      // This should succeed if the encoding is consistent
      await expect(
        debtPool
          .connect(recipient1)
          .claim(proofData.distributionId, proofData.leafIndex, recipient1.address, proofData.amount, proofData.proof),
      ).to.not.be.reverted;
    });
  });

  describe("Regression tests for audit fixes", () => {
    it("canClaim returns true for a valid proof (fix 1: leaf encoding sync)", async () => {
      // Setup distribution
      await debtPool.connect(admin).createDistribution(merkleRoot, TOTAL_AMOUNT);

      // Verify canClaim returns true for a valid proof
      const proofData = proofs.get(recipient1.address.toLowerCase());
      const canClaimResult = await debtPool.canClaim(
        proofData.distributionId,
        proofData.leafIndex,
        recipient1.address,
        proofData.amount,
        proofData.proof,
      );

      expect(canClaimResult).to.be.true;
    });

    it("claim reverts when cumulative claims would exceed distribution total (cap invariant)", async () => {
      // Build a tree with one leaf claiming more than the declared total
      const overAmount = TOTAL_AMOUNT + parseEther("1"); // 11 wstETH > 10 wstETH total
      const overTree = StandardMerkleTree.of(
        [[DISTRIBUTION_ID, 0, recipient1.address, overAmount.toString()]],
        ["uint256", "uint256", "address", "uint256"],
      );
      const overRoot = overTree.root;
      await wstETH.mint(debtPool.target, overAmount);
      await debtPool.connect(admin).createDistribution(overRoot, TOTAL_AMOUNT);
      const distId = await debtPool.distributionId();
      const [, proof] = overTree.entries().next().value as [number, [number, number, string, string]];
      await expect(
        debtPool
          .connect(recipient1)
          .claim(distId, 0, recipient1.address, overAmount, overTree.getProof([DISTRIBUTION_ID, 0, recipient1.address, overAmount.toString()])),
      ).to.be.revertedWithCustomError(debtPool, "ExceedsDistributionTotal");
    });

    it("withdrawUnclaimedFees reverts before MIN_CLAIM_PERIOD elapsed (fix 2: lock period)", async () => {
      // Setup distribution
      await debtPool.connect(admin).createDistribution(merkleRoot, TOTAL_AMOUNT);

      // Try to withdraw unclaimed fees immediately - should revert
      await expect(
        debtPool.connect(gov).withdrawUnclaimedFees(DISTRIBUTION_ID, gov.address),
      ).to.be.revertedWithCustomError(debtPool, "DistributionNotFinalized");
    });

    it("withdrawUnclaimedFees succeeds after time-warp past MIN_CLAIM_PERIOD (fix 2: happy path)", async () => {
      // Setup distribution
      await debtPool.connect(admin).createDistribution(merkleRoot, TOTAL_AMOUNT);

      // Have some recipients claim to create unclaimed amount
      const proofData = proofs.get(recipient1.address.toLowerCase());
      await debtPool
        .connect(recipient1)
        .claim(proofData.distributionId, proofData.leafIndex, recipient1.address, proofData.amount, proofData.proof);

      // Time-warp past MIN_CLAIM_PERIOD (30 days)
      await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]); // 30 days in seconds
      await ethers.provider.send("evm_mine", []);

      // Now withdrawal should succeed
      await expect(debtPool.connect(gov).withdrawUnclaimedFees(DISTRIBUTION_ID, gov.address)).to.not.be.reverted;
    });
  });
});
