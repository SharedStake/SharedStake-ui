import {ethers} from "hardhat";
import {expect} from "chai";
import {parseEther, ZeroAddress} from "ethers";
import {StandardMerkleTree} from "@openzeppelin/merkle-tree";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

describe("SgEthV1Claim", () => {
  let gov: SignerWithAddress;
  let guardian: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let attacker: SignerWithAddress;
  let claimToken: any;
  let tree: StandardMerkleTree<any>;
  let claims: Array<{index: number; account: string; amount: bigint}>;

  async function deployFresh() {
    [, gov, guardian, alice, bob, attacker] = await ethers.getSigners();
    claims = [
      {index: 0, account: alice.address, amount: parseEther("10")},
      {index: 1, account: bob.address, amount: parseEther("5")},
    ];
    tree = StandardMerkleTree.of(
      claims.map(claim => [claim.index, claim.account, claim.amount.toString()]),
      ["uint256", "address", "uint256"],
    );

    const SgEthV1Claim = await ethers.getContractFactory("SgEthV1Claim");
    claimToken = await SgEthV1Claim.deploy(tree.root, gov.address, guardian.address, false);
  }

  function proofFor(index: number) {
    return tree.getProof(index);
  }

  beforeEach(deployFresh);

  it("deploys with exact token name and symbol", async () => {
    expect(await claimToken.name()).to.equal("sgethV1Claim");
    expect(await claimToken.symbol()).to.equal("sgethV1Claim");
    expect(await claimToken.merkleRoot()).to.equal(tree.root);
    expect(await claimToken.transfersEnabled()).to.equal(false);
  });

  it("lets an eligible recipient claim their receipt tokens", async () => {
    await expect(claimToken.connect(alice).claim(0, alice.address, claims[0].amount, proofFor(0)))
      .to.emit(claimToken, "Claimed")
      .withArgs(0, alice.address, claims[0].amount);

    expect(await claimToken.isClaimed(0)).to.equal(true);
    expect(await claimToken.balanceOf(alice.address)).to.equal(claims[0].amount);
    expect(await claimToken.totalClaimed()).to.equal(claims[0].amount);
  });

  it("rejects claims submitted by anyone other than the recipient", async () => {
    await expect(claimToken.connect(attacker).claim(0, alice.address, claims[0].amount, proofFor(0)))
      .to.be.revertedWithCustomError(claimToken, "ClaimantMismatch")
      .withArgs(attacker.address, alice.address);
  });

  it("rejects double claims", async () => {
    await claimToken.connect(alice).claim(0, alice.address, claims[0].amount, proofFor(0));

    await expect(
      claimToken.connect(alice).claim(0, alice.address, claims[0].amount, proofFor(0)),
    ).to.be.revertedWithCustomError(claimToken, "AlreadyClaimed");
  });

  it("rejects wrong amount, wrong account, and wrong proof claims", async () => {
    await expect(
      claimToken.connect(alice).claim(0, alice.address, parseEther("11"), proofFor(0)),
    ).to.be.revertedWithCustomError(claimToken, "InvalidMerkleProof");

    await expect(
      claimToken.connect(alice).claim(0, alice.address, claims[0].amount, proofFor(1)),
    ).to.be.revertedWithCustomError(claimToken, "InvalidMerkleProof");

    await expect(
      claimToken.connect(alice).claim(1, alice.address, claims[1].amount, proofFor(1)),
    ).to.be.revertedWithCustomError(claimToken, "InvalidMerkleProof");
  });

  it("pauses claims through guardian and resumes through governance", async () => {
    await expect(claimToken.connect(guardian).pause()).to.emit(claimToken, "Paused");

    await expect(claimToken.connect(alice).claim(0, alice.address, claims[0].amount, proofFor(0))).to.be.revertedWith(
      "Pausable: paused",
    );

    await expect(claimToken.connect(gov).unpause()).to.emit(claimToken, "Unpaused");
    await claimToken.connect(alice).claim(0, alice.address, claims[0].amount, proofFor(0));
  });

  it("keeps receipt balances non-transferable until governance enables transfers", async () => {
    await claimToken.connect(alice).claim(0, alice.address, claims[0].amount, proofFor(0));

    await expect(claimToken.connect(alice).transfer(bob.address, parseEther("1"))).to.be.revertedWithCustomError(
      claimToken,
      "TransfersDisabled",
    );

    await expect(claimToken.connect(gov).setTransfersEnabled(true))
      .to.emit(claimToken, "TransfersEnabledSet")
      .withArgs(true);
    await claimToken.connect(alice).transfer(bob.address, parseEther("1"));
    expect(await claimToken.balanceOf(bob.address)).to.equal(parseEther("1"));
  });

  it("rejects invalid constructor inputs", async () => {
    const SgEthV1Claim = await ethers.getContractFactory("SgEthV1Claim");

    await expect(
      SgEthV1Claim.deploy(ethers.ZeroHash, gov.address, guardian.address, false),
    ).to.be.revertedWithCustomError(claimToken, "ZeroMerkleRoot");
    await expect(SgEthV1Claim.deploy(tree.root, ZeroAddress, guardian.address, false)).to.be.revertedWithCustomError(
      claimToken,
      "ZeroAddress",
    );
    await expect(SgEthV1Claim.deploy(tree.root, gov.address, ZeroAddress, false)).to.be.revertedWithCustomError(
      claimToken,
      "ZeroAddress",
    );
  });
});
