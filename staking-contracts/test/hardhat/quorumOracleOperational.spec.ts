import {ethers} from "hardhat";
import {expect} from "chai";
import {parseEther} from "ethers";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

describe("QuorumOracleAdapter operational flows", () => {
  const ORACLE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ORACLE"));

  let gov: SignerWithAddress;
  let submitter1: SignerWithAddress;
  let submitter2: SignerWithAddress;
  let submitter3: SignerWithAddress;

  let stakingCore: any;
  let quorumAdapter: any;

  const abi = ethers.AbiCoder.defaultAbiCoder();
  const BASELINE = parseEther("32");

  function hash(validators: bigint, balance: bigint, ts: bigint): string {
    return ethers.keccak256(abi.encode(["uint256", "uint256", "uint256"], [validators, balance, ts]));
  }

  async function latestTs(): Promise<bigint> {
    const blk = await ethers.provider.getBlock("latest");
    return BigInt(blk!.timestamp);
  }

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    [, gov, submitter1, submitter2, submitter3] = signers;

    const StToken = await ethers.getContractFactory("StToken");
    const stToken = await StToken.deploy();

    const StakingCore = await ethers.getContractFactory("StakingCore");
    stakingCore = await StakingCore.deploy(stToken.target, gov.address);
    await stToken.addMinter(stakingCore.target);

    const QuorumOracleAdapter = await ethers.getContractFactory("QuorumOracleAdapter");
    quorumAdapter = await QuorumOracleAdapter.deploy(stakingCore.target, gov.address, 2);

    await stakingCore.connect(gov).grantRole(ORACLE_ROLE, quorumAdapter.target);
    await quorumAdapter.connect(gov).addSubmitter(submitter1.address);
    await quorumAdapter.connect(gov).addSubmitter(submitter2.address);
    await quorumAdapter.connect(gov).addSubmitter(submitter3.address);
    await quorumAdapter.connect(gov).setMinReportInterval(0);
    await stakingCore.connect(gov).submit(gov.address, {value: BASELINE});
    await stakingCore.connect(gov).notifyBeaconDeposit(BASELINE);
  });

  it("does not combine votes across conflicting payloads", async () => {
    const ts = await latestTs();
    const a = parseEther("32");
    const b = parseEther("33");
    const aHash = hash(1n, a, ts);
    const bHash = hash(1n, b, ts);

    await quorumAdapter.connect(submitter1).submitReport(1, a, ts);
    await quorumAdapter.connect(submitter2).submitReport(1, b, ts);

    expect(await quorumAdapter.reportVotes(aHash)).to.equal(1n);
    expect(await quorumAdapter.reportVotes(bHash)).to.equal(1n);
    expect(await quorumAdapter.reportFinalized(aHash)).to.equal(false);
    expect(await quorumAdapter.reportFinalized(bHash)).to.equal(false);
    expect(await stakingCore.beaconBalance()).to.equal(BASELINE);

    await quorumAdapter.connect(submitter3).submitReport(1, a, ts);

    expect(await quorumAdapter.reportFinalized(aHash)).to.equal(true);
    expect(await quorumAdapter.reportFinalized(bHash)).to.equal(false);
    expect(await stakingCore.beaconBalance()).to.equal(a);
  });

  it("rejects delayed quorum finalization after frame staleness", async () => {
    const ts = await latestTs();
    const balance = parseEther("32");
    const reportHash = hash(1n, balance, ts);

    await quorumAdapter.connect(submitter1).submitReport(1, balance, ts);
    expect(await quorumAdapter.reportVotes(reportHash)).to.equal(1n);

    await ethers.provider.send("evm_increaseTime", [7 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    await expect(
      quorumAdapter.connect(submitter2).submitReport(1, balance, ts)
    ).to.be.revertedWithCustomError(quorumAdapter, "StaleReport");

    expect(await quorumAdapter.reportVotes(reportHash)).to.equal(1n);
    expect(await quorumAdapter.reportFinalized(reportHash)).to.equal(false);
    expect(await stakingCore.beaconBalance()).to.equal(BASELINE);
  });

  it("accepts finalization just within the staleness boundary", async () => {
    const ts = await latestTs();
    const balance = parseEther("32");

    await quorumAdapter.connect(gov).setMaxStaleness(3600);
    await quorumAdapter.connect(submitter1).submitReport(1, balance, ts);

    // Keep one-second margin because the tx itself is mined in the next block.
    await ethers.provider.send("evm_setNextBlockTimestamp", [Number(ts + 3599n)]);
    await ethers.provider.send("evm_mine", []);

    await quorumAdapter.connect(submitter2).submitReport(1, balance, ts);

    expect(await stakingCore.beaconBalance()).to.equal(balance);
    expect(await stakingCore.beaconValidators()).to.equal(1n);
  });
});
