import {ethers} from "hardhat";
import {expect} from "chai";
import {parseEther} from "ethers";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

describe("QuorumOracleAdapter", () => {
  const ORACLE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ORACLE"));

  let deployer: SignerWithAddress;
  let gov: SignerWithAddress;
  let submitter1: SignerWithAddress;
  let submitter2: SignerWithAddress;
  let submitter3: SignerWithAddress;
  let outsider: SignerWithAddress;

  let stToken: any;
  let stakingCore: any;
  let quorumAdapter: any;

  const abi = ethers.AbiCoder.defaultAbiCoder();
  const BASELINE = parseEther("32");

  function reportHash(validators: bigint, balance: bigint, reportTimestamp: bigint): string {
    return ethers.keccak256(
      abi.encode(["uint256", "uint256", "uint256"], [validators, balance, reportTimestamp])
    );
  }

  async function latestTimestamp(): Promise<bigint> {
    const block = await ethers.provider.getBlock("latest");
    return BigInt(block!.timestamp);
  }

  beforeEach(async () => {
    [deployer, gov, submitter1, submitter2, submitter3, outsider] = await ethers.getSigners();

    const StToken = await ethers.getContractFactory("StToken");
    stToken = await StToken.deploy();

    const StakingCore = await ethers.getContractFactory("StakingCore");
    stakingCore = await StakingCore.deploy(stToken.target, gov.address);

    const QuorumOracleAdapter = await ethers.getContractFactory("QuorumOracleAdapter");
    quorumAdapter = await QuorumOracleAdapter.deploy(stakingCore.target, gov.address, 2);

    await stToken.addMinter(stakingCore.target);
    await stakingCore.connect(gov).grantRole(ORACLE_ROLE, quorumAdapter.target);
    await stakingCore.connect(gov).submit(gov.address, {value: BASELINE});
    await stakingCore.connect(gov).notifyBeaconDeposit(BASELINE);

    await quorumAdapter.connect(gov).addSubmitter(submitter1.address);
    await quorumAdapter.connect(gov).addSubmitter(submitter2.address);
    await quorumAdapter.connect(gov).addSubmitter(submitter3.address);
    await quorumAdapter.connect(gov).setMinReportInterval(0);
  });

  it("finalizes on quorum and forwards exactly once", async () => {
    const ts = await latestTimestamp();
    const validators = 1n;
    const balance = parseEther("32");
    const hash = reportHash(validators, balance, ts);

    await expect(quorumAdapter.connect(submitter1).submitReport(validators, balance, ts))
      .to.emit(quorumAdapter, "VoteSubmitted")
      .withArgs(hash, submitter1.address, validators, balance, ts, 1n, 2n);

    expect(await stakingCore.beaconBalance()).to.equal(BASELINE);
    expect(await quorumAdapter.reportFinalized(hash)).to.equal(false);

    await expect(quorumAdapter.connect(submitter2).submitReport(validators, balance, ts))
      .to.emit(quorumAdapter, "ReportFinalized")
      .withArgs(hash, validators, balance, ts, 2n);

    expect(await stakingCore.beaconValidators()).to.equal(validators);
    expect(await stakingCore.beaconBalance()).to.equal(balance);
    expect(await quorumAdapter.reportFinalized(hash)).to.equal(true);

    const beaconReports = await stakingCore.queryFilter(stakingCore.filters.BeaconReported());
    expect(beaconReports.length).to.equal(1);

    await expect(quorumAdapter.connect(submitter3).submitReport(validators, balance, ts))
      .to.be.revertedWithCustomError(quorumAdapter, "ReportAlreadyFinalized");
  });

  it("rejects duplicate vote from the same submitter for the same payload", async () => {
    const ts = await latestTimestamp();
    const validators = 1n;
    const balance = parseEther("32");

    await quorumAdapter.connect(submitter1).submitReport(validators, balance, ts);

    await expect(quorumAdapter.connect(submitter1).submitReport(validators, balance, ts))
      .to.be.revertedWithCustomError(quorumAdapter, "DuplicateVote");
  });

  it("does not finalize before quorum", async () => {
    await quorumAdapter.connect(gov).setQuorum(3);

    const ts = await latestTimestamp();
    const validators = 1n;
    const balance = parseEther("32");
    const hash = reportHash(validators, balance, ts);

    await quorumAdapter.connect(submitter1).submitReport(validators, balance, ts);
    await quorumAdapter.connect(submitter2).submitReport(validators, balance, ts);

    expect(await quorumAdapter.reportVotes(hash)).to.equal(2n);
    expect(await quorumAdapter.reportFinalized(hash)).to.equal(false);
    expect(await stakingCore.beaconBalance()).to.equal(BASELINE);
    expect(await stakingCore.beaconValidators()).to.equal(0n);
  });

  it("rejects stale reports on quorum finalization", async () => {
    await quorumAdapter.connect(gov).setQuorum(1);

    const nowTs = await latestTimestamp();
    const staleTimestamp = nowTs - BigInt(7 * 60 * 60);

    await expect(quorumAdapter.connect(submitter1).submitReport(1, parseEther("32"), staleTimestamp))
      .to.be.revertedWithCustomError(quorumAdapter, "StaleReport");
  });

  it("does not record votes for stale payloads", async () => {
    const nowTs = await latestTimestamp();
    const staleTimestamp = nowTs - BigInt(7 * 60 * 60);
    const balance = parseEther("32");
    const hash = reportHash(1n, balance, staleTimestamp);

    await expect(quorumAdapter.connect(submitter1).submitReport(1, balance, staleTimestamp))
      .to.be.revertedWithCustomError(quorumAdapter, "StaleReport");
    expect(await quorumAdapter.reportVotes(hash)).to.equal(0n);
  });

  it("rejects future-dated reports on quorum finalization", async () => {
    await quorumAdapter.connect(gov).setQuorum(1);

    const nowTs = await latestTimestamp();
    const futureTimestamp = nowTs + BigInt(60 * 60);

    await expect(quorumAdapter.connect(submitter1).submitReport(1, parseEther("32"), futureTimestamp))
      .to.be.revertedWithCustomError(quorumAdapter, "FutureReportTimestamp");

    expect(await stakingCore.beaconBalance()).to.equal(BASELINE);
    expect(await stakingCore.beaconValidators()).to.equal(0n);
  });

  it("rejects impossible report tuple (0 validators with non-zero balance)", async () => {
    await quorumAdapter.connect(gov).setQuorum(1);
    await expect(
      quorumAdapter.connect(submitter1).submitReport(0, parseEther("1"), await latestTimestamp())
    ).to.be.revertedWithCustomError(quorumAdapter, "InvalidBeaconReportTuple");
  });

  it("enforces upward drift guard", async () => {
    await quorumAdapter.connect(gov).setQuorum(1);

    await quorumAdapter.connect(submitter1).submitReport(1, parseEther("32"), await latestTimestamp());

    await expect(
      quorumAdapter.connect(submitter2).submitReport(1, parseEther("36"), await latestTimestamp())
    ).to.be.revertedWithCustomError(quorumAdapter, "BalanceDriftTooHigh");

    expect(await stakingCore.beaconBalance()).to.equal(parseEther("32"));
  });

  it("enforces slash guard", async () => {
    await quorumAdapter.connect(gov).setQuorum(1);

    await quorumAdapter.connect(submitter1).submitReport(1, parseEther("32"), await latestTimestamp());

    await expect(
      quorumAdapter.connect(submitter2).submitReport(1, parseEther("30"), await latestTimestamp())
    ).to.be.revertedWithCustomError(quorumAdapter, "SlashTooLarge");

    expect(await stakingCore.beaconBalance()).to.equal(parseEther("32"));
  });

  it("enforces submitter and gov permissions", async () => {
    await expect(quorumAdapter.connect(outsider).addSubmitter(outsider.address)).to.be.reverted;
    await expect(quorumAdapter.connect(outsider).removeSubmitter(submitter1.address)).to.be.reverted;
    await expect(quorumAdapter.connect(outsider).setQuorum(1)).to.be.reverted;
    await expect(
      quorumAdapter.connect(outsider).submitReport(1, parseEther("32"), await latestTimestamp())
    ).to.be.reverted;
  });

  it("rejects non-monotonic report timestamps once a report is finalized", async () => {
    await quorumAdapter.connect(gov).setQuorum(1);
    const ts = await latestTimestamp();

    await quorumAdapter.connect(submitter1).submitReport(1, parseEther("32"), ts);
    await expect(
      quorumAdapter.connect(submitter2).submitReport(1, parseEther("32.1"), ts)
    ).to.be.revertedWithCustomError(quorumAdapter, "NonMonotonicReportTimestamp");
  });

  it("rejects reports that arrive too frequently when cadence gating is enabled", async () => {
    await quorumAdapter.connect(gov).setQuorum(1);
    await quorumAdapter.connect(gov).setMinReportInterval(3600);

    const firstTs = await latestTimestamp();
    await quorumAdapter.connect(submitter1).submitReport(1, parseEther("32"), firstTs);

    const secondTs = firstTs + 1n;
    await expect(
      quorumAdapter.connect(submitter2).submitReport(1, parseEther("32"), secondTs)
    ).to.be.revertedWithCustomError(quorumAdapter, "ReportTooFrequent");
  });
});
