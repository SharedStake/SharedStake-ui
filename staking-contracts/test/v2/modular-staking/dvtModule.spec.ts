import {ethers, upgrades} from "hardhat";
import {expect} from "chai";
import {parseEther, ZeroAddress} from "ethers";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

describe("DVTModule", () => {
  let deployer: SignerWithAddress,
    gov: SignerWithAddress,
    oracle: SignerWithAddress,
    nodeOp: SignerWithAddress,
    outsider: SignerWithAddress;
  let router: any, dvtModule: any, mockDeposit: any, stToken: any;

  const DVT_ID = ethers.keccak256(ethers.toUtf8Bytes("DVT_CLUSTER_1"));
  const EXPECTED_CREDS = "0x01" + "00".repeat(31);

  async function deployFresh() {
    [deployer, gov, oracle, nodeOp, outsider] = await ethers.getSigners();

    const StToken = await ethers.getContractFactory("StToken");
    stToken = await StToken.deploy();

    const StakingRouter = await ethers.getContractFactory("StakingRouter");
    router = await upgrades.deployProxy(StakingRouter, [stToken.target, gov.address], {
      kind: "uups",
      initializer: "initialize",
    });

    const MockBeaconDeposit = await ethers.getContractFactory("MockBeaconDeposit");
    mockDeposit = await MockBeaconDeposit.deploy();

    const DVTModule = await ethers.getContractFactory("DVTModule");
    dvtModule = await upgrades.deployProxy(DVTModule, [router.target, DVT_ID, gov.address, mockDeposit.target], {
      kind: "uups",
      initializer: "initialize",
    });

    // Wire roles
    const GOV_ROLE = await dvtModule.GOV();
    const ORACLE_ROLE = await dvtModule.ORACLE();
    const NODE_OPERATOR_ROLE = await dvtModule.NODE_OPERATOR();
    const GUARDIAN_ROLE = await dvtModule.GUARDIAN();
    await dvtModule.connect(gov).grantRole(ORACLE_ROLE, oracle.address);
    await dvtModule.connect(gov).grantRole(NODE_OPERATOR_ROLE, nodeOp.address);
    await dvtModule.connect(gov).grantRole(GUARDIAN_ROLE, gov.address);
    await dvtModule.connect(gov).setExpectedWithdrawalCredentials(EXPECTED_CREDS);

    // Register module with router so reportBeacon / notifyBeaconDeposit work
    await router.connect(gov).registerModule(DVT_ID, dvtModule.target, 0);

    // Grant router MINTER on stToken
    await stToken.addMinter(router.target);
  }

  beforeEach(async () => {
    await deployFresh();
  });

  it("moduleType returns DVT_VALIDATOR", async () => {
    const t = await dvtModule.moduleType();
    expect(t).to.equal(ethers.keccak256(ethers.toUtf8Bytes("DVT_VALIDATOR")));
  });

  it("differs from ValidatorModule type", async () => {
    const ValidatorModule = await ethers.getContractFactory("ValidatorModule");
    const solo = await upgrades.deployProxy(
      ValidatorModule,
      [router.target, ethers.keccak256(ethers.toUtf8Bytes("SOLO_1")), gov.address, mockDeposit.target],
      {kind: "uups", initializer: "initialize"},
    );
    expect(await dvtModule.moduleType()).to.not.equal(await solo.moduleType());
  });

  it("inherits ValidatorModule behavior: receiveDeposit via router", async () => {
    await router.submitToModule(DVT_ID, ZeroAddress, {value: parseEther("1")});
    expect(await dvtModule.bufferedEther()).to.equal(parseEther("1"));
  });

  it("inherits ValidatorModule behavior: reportBeacon", async () => {
    // Register cluster with nodeOp so proposeDeposit is available
    const CLUSTER_ID = ethers.keccak256(ethers.toUtf8Bytes("CLUSTER_BEACON"));
    await dvtModule.connect(gov).registerCluster(CLUSTER_ID, [nodeOp.address], 1);

    await router.submitToModule(DVT_ID, ZeroAddress, {value: parseEther("32")});
    await dvtModule.connect(gov).approvePubkey("0x" + "00".repeat(48));
    await dvtModule
      .connect(nodeOp)
      .proposeDeposit(
        CLUSTER_ID,
        "0x" + "00".repeat(48),
        EXPECTED_CREDS,
        "0x" + "00".repeat(96),
        "0x" + "00".repeat(32),
      );
    await dvtModule.connect(oracle).reportBeacon(1, parseEther("32"));
    expect(await dvtModule.beaconBalance()).to.equal(parseEther("32"));
    expect(await dvtModule.beaconValidators()).to.equal(1);
  });

  it("rejects impossible report tuple (0 validators with non-zero balance)", async () => {
    await expect(dvtModule.connect(oracle).reportBeacon(0, parseEther("1"))).to.be.revertedWithCustomError(
      dvtModule,
      "InvalidBeaconReportTuple",
    );
  });

  it("depositToBeaconChain reverts with UseClusteredDeposit (DVTM-01)", async () => {
    await router.submitToModule(DVT_ID, ZeroAddress, {value: parseEther("32")});
    await expect(
      dvtModule
        .connect(nodeOp)
        .depositToBeaconChain("0x" + "00".repeat(48), EXPECTED_CREDS, "0x" + "00".repeat(96), "0x" + "00".repeat(32)),
    ).to.be.revertedWithCustomError(dvtModule, "UseClusteredDeposit");
  });

  it("depositToBeaconChainInCluster reverts with UseProposalQueue", async () => {
    const CLUSTER_ID = ethers.keccak256(ethers.toUtf8Bytes("CLUSTER_DEPRECATED"));
    await dvtModule.connect(gov).registerCluster(CLUSTER_ID, [nodeOp.address], 1);
    await router.submitToModule(DVT_ID, ZeroAddress, {value: parseEther("32")});
    await expect(
      dvtModule
        .connect(nodeOp)
        .depositToBeaconChainInCluster(
          CLUSTER_ID,
          "0x" + "00".repeat(48),
          EXPECTED_CREDS,
          "0x" + "00".repeat(96),
          "0x" + "00".repeat(32),
        ),
    ).to.be.revertedWithCustomError(dvtModule, "UseProposalQueue");
  });

  it("rejects clustered deposit when NODE_OPERATOR is not part of that cluster", async () => {
    const CLUSTER_ID = ethers.keccak256(ethers.toUtf8Bytes("CLUSTER_MEMBERSHIP"));
    await dvtModule.connect(gov).registerCluster(CLUSTER_ID, [nodeOp.address], 1);
    const NODE_OPERATOR_ROLE = await dvtModule.NODE_OPERATOR();
    await dvtModule.connect(gov).grantRole(NODE_OPERATOR_ROLE, outsider.address);

    await router.submitToModule(DVT_ID, ZeroAddress, {value: parseEther("32")});

    await expect(
      dvtModule
        .connect(outsider)
        .proposeDeposit(
          CLUSTER_ID,
          "0x" + "00".repeat(48),
          EXPECTED_CREDS,
          "0x" + "00".repeat(96),
          "0x" + "00".repeat(32),
        ),
    ).to.be.revertedWithCustomError(dvtModule, "OperatorNotInCluster");
  });

  it("allows threshold > 1 for multi-operator clusters", async () => {
    const CLUSTER_ID = ethers.keccak256(ethers.toUtf8Bytes("CLUSTER_THRESHOLD"));
    await expect(
      dvtModule.connect(gov).registerCluster(CLUSTER_ID, [nodeOp.address, outsider.address], 2),
    ).to.not.be.reverted;
  });

  it("has granular pause on router submit", async () => {
    const PAUSE_RECEIVE = await dvtModule.PAUSE_RECEIVE();
    await dvtModule.connect(gov).pause(PAUSE_RECEIVE);
    // DVTModule.pause sets its internal GranularPause state; router still calls
    // receiveDeposit which reverts with IsPaused from the module's own guard.
    await expect(router.submitToModule(DVT_ID, ZeroAddress, {value: parseEther("1")})).to.be.reverted;
  });

  it("reverts on non-router receiveDeposit", async () => {
    await expect(dvtModule.receiveDeposit({value: parseEther("1")})).to.be.revertedWithCustomError(
      dvtModule,
      "NotRouter",
    );
  });

  it("rejects zero expected withdrawal credentials", async () => {
    await expect(
      dvtModule.connect(gov).setExpectedWithdrawalCredentials(ethers.ZeroHash),
    ).to.be.revertedWithCustomError(dvtModule, "InvalidWithdrawalCredentials");
  });

  it("reverts clustered deposit when expected withdrawal credentials are not configured", async () => {
    const UNCONFIGURED_ID = ethers.keccak256(ethers.toUtf8Bytes("DVT_UNCONFIGURED"));
    const DVTModule = await ethers.getContractFactory("DVTModule");
    const unconfigured = await upgrades.deployProxy(
      DVTModule,
      [router.target, UNCONFIGURED_ID, gov.address, mockDeposit.target],
      {kind: "uups", initializer: "initialize"},
    );
    await unconfigured.connect(gov).grantRole(await unconfigured.NODE_OPERATOR(), nodeOp.address);
    await unconfigured.connect(gov).registerCluster(UNCONFIGURED_ID, [nodeOp.address], 1);
    await router.connect(gov).registerModule(UNCONFIGURED_ID, unconfigured.target, 0);
    await router.submitToModule(UNCONFIGURED_ID, ZeroAddress, {value: parseEther("32")});

    await expect(
      unconfigured
        .connect(nodeOp)
        .proposeDeposit(
          UNCONFIGURED_ID,
          "0x" + "00".repeat(48),
          EXPECTED_CREDS,
          "0x" + "00".repeat(96),
          "0x" + "00".repeat(32),
        ),
    ).to.be.revertedWithCustomError(unconfigured, "WithdrawalCredentialsNotConfigured");
  });

  it("reverts deposit when beacon deposit contract has no runtime code", async () => {
    const MODULE_ID = ethers.keccak256(ethers.toUtf8Bytes("SOLO_NO_CODE"));
    const ValidatorModule = await ethers.getContractFactory("ValidatorModule");
    const solo = await upgrades.deployProxy(ValidatorModule, [router.target, MODULE_ID, gov.address, ZeroAddress], {
      kind: "uups",
      initializer: "initialize",
    });
    await solo.connect(gov).grantRole(await solo.NODE_OPERATOR(), gov.address);
    await solo.connect(gov).setExpectedWithdrawalCredentials(EXPECTED_CREDS);
    await router.connect(gov).registerModule(MODULE_ID, solo.target, 0);
    await router.submitToModule(MODULE_ID, ZeroAddress, {value: parseEther("32")});

    await solo.connect(gov).approvePubkey("0x" + "00".repeat(48));
    await expect(
      solo
        .connect(gov)
        .depositToBeaconChain("0x" + "00".repeat(48), EXPECTED_CREDS, "0x" + "00".repeat(96), "0x" + "00".repeat(32)),
    ).to.be.revertedWithCustomError(solo, "BeaconDepositContractUnavailable");
  });

  it("allows re-approval after cancel + re-propose (hasApproved epoch fix)", async () => {
    const CLUSTER_ID = ethers.keccak256(ethers.toUtf8Bytes("CLUSTER_EPOCH"));
    const NODE_OPERATOR_ROLE = await dvtModule.NODE_OPERATOR();
    await dvtModule.connect(gov).grantRole(NODE_OPERATOR_ROLE, outsider.address);
    await dvtModule.connect(gov).grantRole(NODE_OPERATOR_ROLE, deployer.address);
    // threshold = 3 so the 2nd approval (outsider) does NOT trigger execution
    await dvtModule
      .connect(gov)
      .registerCluster(CLUSTER_ID, [nodeOp.address, outsider.address, deployer.address], 3);

    const pubkey = "0x" + "ab".repeat(48);
    const sig = "0x" + "cd".repeat(96);
    const dataRoot = "0x" + "ef".repeat(32);

    const proposalId = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "bytes", "bytes", "bytes", "bytes32"],
        [CLUSTER_ID, pubkey, EXPECTED_CREDS, sig, dataRoot],
      ),
    );

    // nodeOp proposes (counts as 1st approval)
    await dvtModule.connect(nodeOp).proposeDeposit(CLUSTER_ID, pubkey, EXPECTED_CREDS, sig, dataRoot);

    // outsider approves — approval recorded (2 of 3, no execution)
    await dvtModule.connect(outsider).approveDeposit(proposalId);
    expect(await dvtModule.hasApproved(proposalId, outsider.address)).to.be.true;

    // nodeOp cancels as proposer
    await dvtModule.connect(nodeOp).cancelProposal(proposalId);

    // epoch bumped: outsider's prior approval should be erased
    expect(await dvtModule.hasApproved(proposalId, outsider.address)).to.be.false;

    // nodeOp re-proposes the same deposit data
    await dvtModule.connect(nodeOp).proposeDeposit(CLUSTER_ID, pubkey, EXPECTED_CREDS, sig, dataRoot);

    // outsider should be able to approve again (would revert AlreadyApproved without epoch fix)
    await expect(dvtModule.connect(outsider).approveDeposit(proposalId)).to.not.be.reverted;
  });

  it("clusterProposalAt reverts with IndexOutOfBounds for OOB index", async () => {
    const CLUSTER_ID = ethers.keccak256(ethers.toUtf8Bytes("CLUSTER_OOB"));
    await dvtModule.connect(gov).registerCluster(CLUSTER_ID, [nodeOp.address], 1);
    await expect(dvtModule.clusterProposalAt(CLUSTER_ID, 999)).to.be.revertedWithCustomError(
      dvtModule,
      "IndexOutOfBounds",
    );
  });
});
