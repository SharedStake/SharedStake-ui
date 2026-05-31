import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";
import {SgETH, SgETH__factory, WSGETH, WSGETH__factory} from "../../../types";
import chai from "chai";
import {deployments, ethers} from "hardhat";
import Ship from "../../../utils/ship";
import {Signature, ZeroAddress, parseEther} from "ethers";
import {advanceTimeAndBlock} from "../../../utils/time";

const {expect} = chai;

let ship: Ship;
let sgEth: SgETH, wsgEth: WSGETH, deployer: SignerWithAddress, alice: SignerWithAddress, multiSig: SignerWithAddress;

const setup = deployments.createFixture(async hre => {
  ship = await Ship.init(hre);
  const {accounts, users} = ship;
  await deployments.fixture(["sgEth", "wsgEth"]);

  return {
    ship,
    accounts,
    users,
  };
});

describe("WsgETH.sol", () => {
  beforeEach(async () => {
    const {ship, accounts} = await setup();

    sgEth = await ship.connect(SgETH__factory);
    wsgEth = await ship.connect(WSGETH__factory);

    deployer = accounts.deployer;
    alice = accounts.alice;
    multiSig = accounts.multiSig;

    // mint tokens for test
    await sgEth.addMinter(deployer.address);
    await sgEth.mint(deployer.address, parseEther("1000"));
  });

  it("deposit", async () => {
    await expect(wsgEth.connect(alice).deposit(parseEther("1"), alice.address)).to.be.revertedWith(
      "TRANSFER_FROM_FAILED",
    );
    await expect(wsgEth.deposit(parseEther("1"), alice.address)).to.be.revertedWith("TRANSFER_FROM_FAILED");

    await sgEth.approve(wsgEth.target, parseEther("1"));
    await expect(wsgEth.deposit(parseEther("1"), alice.address))
      .to.be.emit(wsgEth, "Transfer")
      .withArgs(ZeroAddress, alice.address, parseEther("1"));
  });

  it("mint", async () => {
    await expect(wsgEth.connect(alice).mint(parseEther("1"), alice.address)).to.be.revertedWith("TRANSFER_FROM_FAILED");
    await expect(wsgEth.mint(parseEther("1"), alice.address)).to.be.revertedWith("TRANSFER_FROM_FAILED");

    await sgEth.approve(wsgEth.target, parseEther("1"));
    await expect(wsgEth.mint(parseEther("1"), alice.address))
      .to.be.emit(wsgEth, "Transfer")
      .withArgs(ZeroAddress, alice.address, parseEther("1"));
  });

  it("withdraw", async () => {
    await expect(wsgEth.withdraw(parseEther("1"), alice.address, alice.address)).to.be.revertedWithPanic("0x11"); // panic revert by insufficient allowance
    await wsgEth.connect(alice).approve(deployer.address, parseEther("1000"));

    await expect(wsgEth.withdraw(parseEther("1"), alice.address, alice.address)).to.be.revertedWithPanic("0x11"); // panic revert by insufficient balance

    // approve sgEth to alice
    await sgEth.approve(wsgEth.target, parseEther("1"));
    await wsgEth.deposit(parseEther("1"), alice.address);

    await expect(wsgEth.withdraw(parseEther("1"), alice.address, alice.address))
      .to.be.emit(wsgEth, "Withdraw")
      .withArgs(deployer.address, alice.address, alice.address, parseEther("1"), parseEther("1"));
  });

  it("redeem", async () => {
    await expect(wsgEth.redeem(parseEther("1"), alice.address, alice.address)).to.be.revertedWithPanic("0x11"); // panic revert by insufficient allowance
    await wsgEth.connect(alice).approve(deployer.address, parseEther("1000"));

    await expect(wsgEth.redeem(parseEther("1"), alice.address, alice.address)).to.be.revertedWithPanic("0x11"); // panic revert by insufficient balance

    // approve sgEth to alice
    await sgEth.approve(wsgEth.target, parseEther("1"));
    await wsgEth.deposit(parseEther("1"), alice.address);

    await expect(wsgEth.redeem(parseEther("1"), alice.address, alice.address))
      .to.be.emit(wsgEth, "Withdraw")
      .withArgs(deployer.address, alice.address, alice.address, parseEther("1"), parseEther("1"));
  });

  it("depositWithSignature", async () => {
    await sgEth.transfer(alice.address, parseEther("1"));
    const nonce = await sgEth.nonces(alice.address);
    const deadline = Math.floor(Date.now() / 1000) + 1000000;
    const approveData = {
      owner: alice.address,
      spender: wsgEth.target,
      value: parseEther("1"),
      nonce,
      deadline: deadline,
    };

    const domain = await sgEth.eip712Domain();

    const signature = await alice.signTypedData(
      {
        name: domain.name,
        version: domain.version,
        chainId: domain.chainId,
        verifyingContract: domain.verifyingContract,
      },
      {
        Permit: [
          {name: "owner", type: "address"},
          {name: "spender", type: "address"},
          {name: "value", type: "uint256"},
          {name: "nonce", type: "uint256"},
          {name: "deadline", type: "uint256"},
        ],
      },
      approveData,
    );

    const {r, s, v} = Signature.from(signature);

    await expect(wsgEth.connect(alice).depositWithSignature(parseEther("1"), alice.address, deadline, false, v, r, s))
      .to.be.emit(wsgEth, "Transfer")
      .withArgs(ZeroAddress, alice.address, parseEther("1"));
  });

  it("price per share", async () => {
    const splitterAddresses = [deployer.address, multiSig.address, wsgEth.target];
    const splitterValues = [6, 3, 31];

    const PaymentSplitter = await ethers.getContractFactory("PaymentSplitter");
    const paymentSplitter = await PaymentSplitter.deploy(splitterAddresses, splitterValues);
    await paymentSplitter.waitForDeployment();

    const rolloverVirtual = "1080000000000000000";
    const vETH2Addr = "0x898bad2774eb97cf6b94605677f43b41871410b1";

    const Withdrawals = await ethers.getContractFactory("Withdrawals");
    const withdrawals = await Withdrawals.deploy(vETH2Addr, rolloverVirtual);
    await withdrawals.waitForDeployment();

    const numValidators = 1000;
    const adminFee = 0;

    const addresses = [
      ZeroAddress, // fee splitter
      sgEth.target, // sgETH address
      wsgEth.target, // wsgETH address
      multiSig.address, // government address
      ZeroAddress, // deposit contract address - can't find deposit contract - using dummy address
    ];

    // add secondary minter contract / eoa
    const Minter = await ethers.getContractFactory("SharedDepositMinterV2");
    const minter = await Minter.deploy(numValidators, adminFee, addresses);
    await minter.waitForDeployment();

    const RewardsReceiver = await ethers.getContractFactory("RewardsReceiver");
    const rewardsReceiver = await RewardsReceiver.deploy(withdrawals.target, [
      sgEth.target,
      wsgEth.target,
      paymentSplitter.target,
      minter.target,
    ], multiSig.address);
    await rewardsReceiver.waitForDeployment();

    await sgEth.addMinter(minter.target);

    // approve sgEth to alice
    await sgEth.approve(wsgEth.target, parseEther("2"));
    await wsgEth.deposit(parseEther("2"), alice.address);

    await expect(wsgEth.connect(alice).redeem(parseEther("0.5"), alice.address, alice.address))
      .to.be.emit(wsgEth, "Withdraw")
      .withArgs(alice.address, alice.address, alice.address, parseEther("0.5"), parseEther("0.5"));

    // deposit to rewardReceiver to simulate reward
    await deployer.sendTransaction({
      to: rewardsReceiver.target,
      value: parseEther("1"),
    });
    // sends 60% of sgEth to WSGEth contract - so current rate is 1.5/2.1
    await rewardsReceiver.work();

    await expect(wsgEth.syncRewards()).to.be.revertedWithCustomError(wsgEth, "SyncError").withArgs();
    // increase time by reward cycle
    await advanceTimeAndBlock(24 * 60 * 60);
    // await wsgEth.syncRewards();
    // reward rate is not updated yet
    // after call this functions, reward rate is increasing linearly from 1 to 1.0/(2.1-0.5) = 1.0/1.6
    await expect(wsgEth.connect(alice).redeem(parseEther("0.5"), alice.address, alice.address))
      .to.be.emit(wsgEth, "Withdraw")
      .withArgs(alice.address, alice.address, alice.address, parseEther("0.5"), parseEther("0.5"));

    await advanceTimeAndBlock(24 * 60 * 60);

    // after reward cycle, reward rate is updated with new rate
    // redeem will get 0.8 = 1.6/1.0*0.5 sgEth
    await expect(wsgEth.connect(alice).redeem(parseEther("0.5"), alice.address, alice.address))
      .to.be.emit(wsgEth, "Withdraw")
      .withArgs(alice.address, alice.address, alice.address, parseEther("0.8"), parseEther("0.5"));
  });
});
