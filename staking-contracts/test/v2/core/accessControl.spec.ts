import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";
import {
  FeeCalc,
  FeeCalc__factory,
  RewardsReceiver,
  RewardsReceiver__factory,
  SharedDepositMinterV2,
  SharedDepositMinterV2__factory,
  WithdrawalQueue,
  WithdrawalQueue__factory,
} from "../../../types";
import chai from "chai";
import {deployments} from "hardhat";
import Ship from "../../../utils/ship";
import {ZeroAddress} from "ethers";

const {expect} = chai;

let ship: Ship;
let minter: SharedDepositMinterV2,
  rewardsReceiver: RewardsReceiver,
  withdrawalQueue: WithdrawalQueue,
  feeCalc: FeeCalc,
  deployer: SignerWithAddress,
  alice: SignerWithAddress,
  bob: SignerWithAddress,
  multiSig: SignerWithAddress;

const setup = deployments.createFixture(async hre => {
  ship = await Ship.init(hre);
  const {accounts, users} = ship;
  await deployments.fixture(["feeCalc", "sgEth", "wsgEth", "minter", "withdrawalQueue", "rewardsReceiver"]);

  return {
    ship,
    accounts,
    users,
  };
});

describe("AccessControl hardening", () => {
  beforeEach(async () => {
    const {ship, accounts} = await setup();

    minter = await ship.connect(SharedDepositMinterV2__factory);
    rewardsReceiver = await ship.connect(RewardsReceiver__factory);
    withdrawalQueue = await ship.connect(WithdrawalQueue__factory);
    feeCalc = await ship.connect(FeeCalc__factory);

    deployer = accounts.deployer;
    alice = accounts.alice;
    bob = accounts.bob;
    multiSig = accounts.multiSig;
  });

  it("minter GOV-only controls stay protected", async () => {
    const GOV_ROLE = await minter.GOV();

    await expect(minter.connect(alice).setFeeCalc(ZeroAddress)).to.be.revertedWith(
      `AccessControl: account ${alice.address.toLowerCase()} is missing role ${GOV_ROLE}`,
    );
    await expect(minter.connect(alice).withdrawAdminFee(0)).to.be.revertedWith(
      `AccessControl: account ${alice.address.toLowerCase()} is missing role ${GOV_ROLE}`,
    );

    await expect(minter.connect(multiSig).setFeeCalc(ZeroAddress)).to.not.be.reverted;
    await expect(minter.connect(multiSig).withdrawAdminFee(0)).to.not.be.reverted;
  });

  it("withdrawal queue GOV-only controls stay protected", async () => {
    const GOV_ROLE = await withdrawalQueue.GOV();

    await expect(withdrawalQueue.connect(alice).togglePause(1)).to.be.revertedWith(
      `AccessControl: account ${alice.address.toLowerCase()} is missing role ${GOV_ROLE}`,
    );
    await expect(withdrawalQueue.connect(alice).setEpochLength(2)).to.be.revertedWith(
      `AccessControl: account ${alice.address.toLowerCase()} is missing role ${GOV_ROLE}`,
    );

    await expect(withdrawalQueue.connect(multiSig).togglePause(1)).to.not.be.reverted;
    expect(await withdrawalQueue.paused(1)).to.eq(true);

    await expect(withdrawalQueue.connect(multiSig).togglePause(1)).to.not.be.reverted;
    expect(await withdrawalQueue.paused(1)).to.eq(false);

    await expect(withdrawalQueue.connect(multiSig).setEpochLength(2)).to.not.be.reverted;
    expect(await withdrawalQueue.epochLength()).to.eq(2);
  });

  it("rewards receiver owner-only controls stay protected", async () => {
    await expect(rewardsReceiver.connect(alice).flipState()).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(rewardsReceiver.connect(alice).setDAOFeeSplitter(bob.address)).to.be.revertedWith(
      "Ownable: caller is not the owner",
    );

    await expect(rewardsReceiver.connect(deployer).setDAOFeeSplitter(bob.address)).to.be.revertedWith(
      "Ownable: caller is not the owner",
    );
    await expect(rewardsReceiver.connect(multiSig).setDAOFeeSplitter(bob.address)).to.not.be.reverted;
    expect(await rewardsReceiver.feeSplitter()).to.eq(bob.address);
  });

  it("fee calc owner-only controls stay protected", async () => {
    await expect(feeCalc.connect(alice).setAdminFee(1)).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(feeCalc.connect(alice).setExitFee(1)).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(feeCalc.connect(alice).setRefundFeesOnWithdraw(true)).to.be.revertedWith(
      "Ownable: caller is not the owner",
    );

    await expect(feeCalc.connect(deployer).setAdminFee(1)).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(feeCalc.connect(deployer).setExitFee(2)).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(feeCalc.connect(deployer).setRefundFeesOnWithdraw(true)).to.be.revertedWith(
      "Ownable: caller is not the owner",
    );

    await expect(feeCalc.connect(multiSig).setAdminFee(1)).to.not.be.reverted;
    await expect(feeCalc.connect(multiSig).setExitFee(2)).to.not.be.reverted;
    await expect(feeCalc.connect(multiSig).setRefundFeesOnWithdraw(true)).to.not.be.reverted;

    expect(await feeCalc.adminFee()).to.eq(1);
  });
});
