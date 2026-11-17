import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";
import {
  SgETH,
  SgETH__factory,
  SharedDepositMinterV2,
  SharedDepositMinterV2__factory,
  WSGETH,
  WSGETH__factory,
  WithdrawalQueue,
  WithdrawalQueue__factory,
} from "../../../types";
import chai from "chai";
import {deployments} from "hardhat";
import Ship from "../../../utils/ship";
import {parseEther} from "ethers";
import {advanceTimeAndBlock} from "../../../utils/time";

const {expect} = chai;

let ship: Ship;
let sgEth: SgETH,
  minter: SharedDepositMinterV2,
  wsgEth: WSGETH,
  withdrawalQueue: WithdrawalQueue,
  deployer: SignerWithAddress,
  alice: SignerWithAddress,
  bob: SignerWithAddress,
  multiSig: SignerWithAddress;

let epoch: number;

const setup = deployments.createFixture(async hre => {
  ship = await Ship.init(hre);
  const {accounts, users} = ship;
  await deployments.fixture(["sgEth", "minter", "wsgEth", "withdrawalQueue"]);

  return {
    ship,
    accounts,
    users,
  };
});

describe("WithdrawalQueue", () => {
  beforeEach(async () => {
    const {ship, accounts} = await setup();

    sgEth = await ship.connect(SgETH__factory);
    minter = await ship.connect(SharedDepositMinterV2__factory);
    wsgEth = await ship.connect(WSGETH__factory);
    withdrawalQueue = await ship.connect(WithdrawalQueue__factory);

    deployer = accounts.deployer;
    alice = accounts.alice;
    bob = accounts.bob;
    multiSig = accounts.multiSig;

    epoch = Number(await withdrawalQueue.epochLength());

    // prepare for test
    await minter.connect(alice).depositAndStake({
      value: parseEther("50"),
    });
    await minter.connect(bob).depositAndStake({
      value: parseEther("50"),
    });
    await wsgEth.connect(alice).approve(withdrawalQueue.target, parseEther("50"));
    await wsgEth.connect(bob).approve(withdrawalQueue.target, parseEther("50"));
    // sends some eth to withdrawal queue contract for test
    await deployer.sendTransaction({
      to: withdrawalQueue.target,
      value: parseEther("10"),
    });
  });

  it("test cancelRedeem flow", async () => {
    // make redeem request
    await expect(withdrawalQueue.connect(alice).requestRedeem(parseEther("10"), alice.address, alice.address))
      .to.be.emit(withdrawalQueue, "RedeemRequest")
      .withArgs(alice.address, alice.address, 0, alice.address, parseEther("10"));
    await expect(withdrawalQueue.connect(bob).requestRedeem(parseEther("30"), bob.address, bob.address))
      .to.be.emit(withdrawalQueue, "RedeemRequest")
      .withArgs(bob.address, bob.address, 1, bob.address, parseEther("30"));

    // confirm redeem request is processeable
    expect(await withdrawalQueue.pendingRedeemRequest(alice.address)).to.eq(parseEther("10"));
    expect(await withdrawalQueue.pendingRedeemRequest(bob.address)).to.eq(parseEther("30"));
    await advanceTimeAndBlock(1);
    expect(await withdrawalQueue.claimableRedeemRequest(alice.address)).to.eq(parseEther("10"));
    expect(await withdrawalQueue.claimableRedeemRequest(bob.address)).to.eq(parseEther("30"));

    // cancel 1
    await expect(withdrawalQueue.connect(alice).cancelRedeem(alice.address, alice.address))
      .to.be.emit(withdrawalQueue, "CancelRedeem")
      .withArgs(alice.address, alice.address, parseEther("10"), parseEther("10"));

    await expect(withdrawalQueue.connect(alice).redeem(parseEther("10"), alice.address, alice.address))
      .to.be.revertedWithCustomError(withdrawalQueue, "InvalidAmount")
      .withArgs();

    await withdrawalQueue.connect(bob).redeem(parseEther("30"), bob.address, bob.address);
  });

  it("request redeem flow", async () => {
    await expect(withdrawalQueue.connect(alice).requestRedeem(parseEther("10"), alice.address, alice.address))
      .to.be.emit(withdrawalQueue, "RedeemRequest")
      .withArgs(alice.address, alice.address, 0, alice.address, parseEther("10"));
    await expect(withdrawalQueue.connect(bob).requestRedeem(parseEther("30"), bob.address, bob.address))
      .to.be.emit(withdrawalQueue, "RedeemRequest")
      .withArgs(bob.address, bob.address, 1, bob.address, parseEther("30"));

    expect(await withdrawalQueue.pendingRedeemRequest(alice.address)).to.eq(parseEther("10"));
    expect(await withdrawalQueue.pendingRedeemRequest(bob.address)).to.eq(parseEther("30"));
    await advanceTimeAndBlock(1);
    expect(await withdrawalQueue.claimableRedeemRequest(alice.address)).to.eq(parseEther("10"));
    expect(await withdrawalQueue.claimableRedeemRequest(bob.address)).to.eq(parseEther("30"));

    await withdrawalQueue.connect(alice).redeem(parseEther("5"), alice.address, alice.address);
    expect(await withdrawalQueue.claimableRedeemRequest(alice.address)).to.eq(parseEther("0"));
    expect(await withdrawalQueue.pendingRedeemRequest(alice.address)).to.eq(parseEther("5"));
  });

  it("request redeem(flow with secondary operator)", async () => {
    await expect(withdrawalQueue.connect(alice).requestRedeem(parseEther("10"), alice.address, alice.address))
      .to.be.emit(withdrawalQueue, "RedeemRequest")
      .withArgs(alice.address, alice.address, 0, alice.address, parseEther("10"));

    await expect(withdrawalQueue.connect(bob).redeem(parseEther("5"), alice.address, alice.address))
      .to.be.revertedWithCustomError(withdrawalQueue, "PermissionDenied")
      .withArgs();

    await expect(withdrawalQueue.connect(alice).setOperator(bob.address, true))
      .to.be.emit(withdrawalQueue, "OperatorSet")
      .withArgs(alice.address, bob.address, true);

    expect(await withdrawalQueue.pendingRedeemRequest(alice.address)).to.eq(parseEther("10"));
    expect(await withdrawalQueue.pendingRedeemRequest(bob.address)).to.eq(parseEther("0"));
    await advanceTimeAndBlock(epoch);
    expect(await withdrawalQueue.claimableRedeemRequest(alice.address)).to.eq(parseEther("10"));
    expect(await withdrawalQueue.claimableRedeemRequest(bob.address)).to.eq(parseEther("0"));

    await withdrawalQueue.connect(alice).redeem(parseEther("5"), alice.address, alice.address);

    await advanceTimeAndBlock(epoch);

    expect(await withdrawalQueue.claimableRedeemRequest(alice.address)).to.eq(parseEther("5"));

    await withdrawalQueue.connect(bob).redeem(parseEther("5"), alice.address, alice.address);
    await advanceTimeAndBlock(epoch);

    expect(await withdrawalQueue.claimableRedeemRequest(alice.address)).to.eq(parseEther("0"));
    expect(await withdrawalQueue.pendingRedeemRequest(alice.address)).to.eq(parseEther("0"));
  });

  it("request redeem(flow with secondary operator recv shares)", async () => {
    await expect(withdrawalQueue.connect(alice).requestRedeem(parseEther("10"), alice.address, alice.address))
      .to.be.emit(withdrawalQueue, "RedeemRequest")
      .withArgs(alice.address, alice.address, 0, alice.address, parseEther("10"));

    await expect(withdrawalQueue.connect(bob).redeem(parseEther("5"), alice.address, bob.address))
      .to.be.revertedWithCustomError(withdrawalQueue, "InvalidAmount")
      .withArgs();
    await expect(withdrawalQueue.connect(bob).redeem(parseEther("5"), bob.address, alice.address))
      .to.be.revertedWithCustomError(withdrawalQueue, "PermissionDenied")
      .withArgs();

    await expect(withdrawalQueue.connect(alice).setOperator(bob.address, true))
      .to.be.emit(withdrawalQueue, "OperatorSet")
      .withArgs(alice.address, bob.address, true);

    expect(await withdrawalQueue.pendingRedeemRequest(alice.address)).to.eq(parseEther("10"));
    expect(await withdrawalQueue.pendingRedeemRequest(bob.address)).to.eq(parseEther("0"));
    await advanceTimeAndBlock(epoch);
    expect(await withdrawalQueue.claimableRedeemRequest(alice.address)).to.eq(parseEther("10"));
    expect(await withdrawalQueue.claimableRedeemRequest(bob.address)).to.eq(parseEther("0"));

    await expect(withdrawalQueue.connect(bob).redeem(parseEther("5"), alice.address, bob.address))
      .to.be.revertedWithCustomError(withdrawalQueue, "InvalidAmount")
      .withArgs();
    await expect(withdrawalQueue.connect(alice).redeem(parseEther("5"), bob.address, bob.address))
      .to.be.revertedWithCustomError(withdrawalQueue, "PermissionDenied")
      .withArgs();
    await withdrawalQueue.connect(bob).redeem(parseEther("5"), bob.address, alice.address);
    await withdrawalQueue.connect(bob).redeem(parseEther("5"), alice.address, alice.address);

    await advanceTimeAndBlock(epoch);

    expect(await withdrawalQueue.claimableRedeemRequest(alice.address)).to.eq(parseEther("0"));
    expect(await withdrawalQueue.pendingRedeemRequest(alice.address)).to.eq(parseEther("0"));
  });

  it("request redeem(flow with secondary operator with own holdings)", async () => {
    await expect(withdrawalQueue.connect(alice).requestRedeem(parseEther("10"), alice.address, alice.address))
      .to.be.emit(withdrawalQueue, "RedeemRequest")
      .withArgs(alice.address, alice.address, 0, alice.address, parseEther("10"));
    await expect(withdrawalQueue.connect(bob).requestRedeem(parseEther("30"), bob.address, bob.address))
      .to.be.emit(withdrawalQueue, "RedeemRequest")
      .withArgs(bob.address, bob.address, 1, bob.address, parseEther("30"));

    await expect(withdrawalQueue.connect(alice).setOperator(bob.address, true))
      .to.be.emit(withdrawalQueue, "OperatorSet")
      .withArgs(alice.address, bob.address, true);

    expect(await withdrawalQueue.pendingRedeemRequest(alice.address)).to.eq(parseEther("10"));
    expect(await withdrawalQueue.pendingRedeemRequest(bob.address)).to.eq(parseEther("30"));
    await advanceTimeAndBlock(epoch);
    expect(await withdrawalQueue.claimableRedeemRequest(alice.address)).to.eq(parseEther("10"));
    expect(await withdrawalQueue.claimableRedeemRequest(bob.address)).to.eq(parseEther("30"));

    await withdrawalQueue.connect(alice).redeem(parseEther("5"), alice.address, alice.address);

    await advanceTimeAndBlock(epoch);

    expect(await withdrawalQueue.claimableRedeemRequest(alice.address)).to.eq(parseEther("5"));

    await withdrawalQueue.connect(bob).redeem(parseEther("5"), alice.address, alice.address);
    await advanceTimeAndBlock(epoch);

    expect(await withdrawalQueue.claimableRedeemRequest(alice.address)).to.eq(parseEther("0"));
    expect(await withdrawalQueue.pendingRedeemRequest(alice.address)).to.eq(parseEther("0"));

    expect(await withdrawalQueue.claimableRedeemRequest(bob.address)).to.eq(parseEther("30"));
    expect(await withdrawalQueue.pendingRedeemRequest(bob.address)).to.eq(parseEther("30"));
  });

  it("request redeem(total request amount is less than 32 ether)", async () => {
    await expect(withdrawalQueue.connect(alice).requestRedeem(0, alice.address, alice.address))
      .to.be.revertedWithCustomError(withdrawalQueue, "InvalidAmount")
      .withArgs();

    await expect(withdrawalQueue.connect(alice).requestRedeem(parseEther("1"), alice.address, alice.address))
      .to.be.emit(withdrawalQueue, "RedeemRequest")
      .withArgs(alice.address, alice.address, 0, alice.address, parseEther("1"));

    expect(await withdrawalQueue.pendingRedeemRequest(alice.address)).to.eq(parseEther("1"));
  });

  it("request redeem(total request amount is less than 32 ether) from another operator(operator functionality check)", async () => {
    await expect(withdrawalQueue.connect(alice).requestRedeem(parseEther("1"), alice.address, bob.address))
      .to.be.revertedWithCustomError(withdrawalQueue, "PermissionDenied")
      .withArgs();

    await expect(withdrawalQueue.connect(bob).setOperator(alice.address, true))
      .to.be.emit(withdrawalQueue, "OperatorSet")
      .withArgs(bob.address, alice.address, true);

    await expect(withdrawalQueue.connect(alice).requestRedeem(parseEther("1"), alice.address, bob.address))
      .to.be.emit(withdrawalQueue, "RedeemRequest")
      .withArgs(alice.address, bob.address, 0, alice.address, parseEther("1"));
    expect(await withdrawalQueue.pendingRedeemRequest(alice.address)).to.eq(parseEther("1"));
  });

  it("request redeem(total request amount is bigger than 32 ether)", async () => {
    await expect(withdrawalQueue.connect(alice).requestRedeem(parseEther("10"), alice.address, alice.address))
      .to.be.emit(withdrawalQueue, "RedeemRequest")
      .withArgs(alice.address, alice.address, 0, alice.address, parseEther("10"));
    await expect(withdrawalQueue.connect(bob).requestRedeem(parseEther("30"), bob.address, bob.address))
      .to.be.emit(withdrawalQueue, "RedeemRequest")
      .withArgs(bob.address, bob.address, 1, bob.address, parseEther("30"));

    expect(await withdrawalQueue.pendingRedeemRequest(alice.address)).to.eq(parseEther("10"));
    expect(await withdrawalQueue.pendingRedeemRequest(bob.address)).to.eq(parseEther("30"));
    await advanceTimeAndBlock(1);
    expect(await withdrawalQueue.claimableRedeemRequest(alice.address)).to.eq(parseEther("10"));
    expect(await withdrawalQueue.claimableRedeemRequest(bob.address)).to.eq(parseEther("30"));
  });

  it("redeem(amount is less than queue balance) and minter is empty", async () => {
    await expect(withdrawalQueue.connect(alice).requestRedeem(parseEther("10"), alice.address, alice.address))
      .to.be.emit(withdrawalQueue, "RedeemRequest")
      .withArgs(alice.address, alice.address, 0, alice.address, parseEther("10"));
    await expect(withdrawalQueue.connect(bob).requestRedeem(parseEther("30"), bob.address, bob.address))
      .to.be.emit(withdrawalQueue, "RedeemRequest")
      .withArgs(bob.address, bob.address, 1, bob.address, parseEther("30"));

    await advanceTimeAndBlock(1);

    // Empty minter for test.
    await sgEth.connect(multiSig).addMinter(alice.address);
    await sgEth.connect(alice).mint(alice.address, parseEther("100"));
    // Boost minter shares for accounting
    let cvs = await minter.curValidatorShares();
    await minter.connect(multiSig).migrateShares(cvs + parseEther("100"));
    await minter.connect(alice).withdrawTo(parseEther("100"), alice.address);

    const prevBalance = await deployer.provider.getBalance(withdrawalQueue.target);
    await expect(withdrawalQueue.connect(alice).redeem(parseEther("50"), alice.address, alice.address))
      .to.be.revertedWithCustomError(withdrawalQueue, "InvalidAmount")
      .withArgs();

    await expect(withdrawalQueue.connect(alice).redeem(parseEther("5"), alice.address, alice.address))
      .to.emit(withdrawalQueue, "Redeem")
      .withArgs(alice.address, alice.address, parseEther("5"), parseEther("5"));
    const afterBalance = await deployer.provider.getBalance(withdrawalQueue.target);

    expect(prevBalance - afterBalance).to.eq(parseEther("5"));
  });

  it("redeem(amount > queue + minter, cannot be fulfilled)", async () => {
    await expect(withdrawalQueue.connect(alice).requestRedeem(parseEther("10"), alice.address, alice.address))
      .to.be.emit(withdrawalQueue, "RedeemRequest")
      .withArgs(alice.address, alice.address, 0, alice.address, parseEther("10"));
    await expect(withdrawalQueue.connect(bob).requestRedeem(parseEther("30"), bob.address, bob.address))
      .to.be.emit(withdrawalQueue, "RedeemRequest")
      .withArgs(bob.address, bob.address, 1, bob.address, parseEther("30"));

    await advanceTimeAndBlock(1);

    // Empty minter for test.
    await sgEth.connect(multiSig).addMinter(alice.address);
    await sgEth.connect(alice).mint(alice.address, parseEther("100"));
    // Boost minter shares for accounting
    let cvs = await minter.curValidatorShares();
    await minter.connect(multiSig).migrateShares(cvs + parseEther("100"));
    await minter.connect(alice).withdrawTo(parseEther("100"), alice.address);

    // Empty the queue
    const prevBalance = await deployer.provider.getBalance(withdrawalQueue.target);
    await expect(withdrawalQueue.connect(alice).redeem(parseEther("10"), alice.address, alice.address))
      .to.emit(withdrawalQueue, "Redeem")
      .withArgs(alice.address, alice.address, parseEther("10"), parseEther("10"));
    const afterBalance = await deployer.provider.getBalance(withdrawalQueue.target);
    expect(prevBalance - afterBalance).to.eq(parseEther("10"));

    await advanceTimeAndBlock(1);

    expect(await withdrawalQueue.pendingRedeemRequest(alice.address)).to.eq(parseEther("0"));
    expect(await withdrawalQueue.pendingRedeemRequest(bob.address)).to.eq(parseEther("30"));
    expect(await withdrawalQueue.claimableRedeemRequest(alice.address)).to.eq(parseEther("0"));
    expect(await withdrawalQueue.claimableRedeemRequest(bob.address)).to.eq(parseEther("0"));
  });

  it("redeem(amount is bigger than queue balance)", async () => {
    await expect(withdrawalQueue.connect(alice).requestRedeem(parseEther("10"), alice.address, alice.address))
      .to.be.emit(withdrawalQueue, "RedeemRequest")
      .withArgs(alice.address, alice.address, 0, alice.address, parseEther("10"));
    await expect(withdrawalQueue.connect(bob).requestRedeem(parseEther("30"), bob.address, bob.address))
      .to.be.emit(withdrawalQueue, "RedeemRequest")
      .withArgs(bob.address, bob.address, 1, bob.address, parseEther("30"));

    const prevBalance = await deployer.provider.getBalance(minter.target);
    const queuePrevBalance = await deployer.provider.getBalance(withdrawalQueue.target);

    await expect(withdrawalQueue.connect(bob).redeem(parseEther("20"), bob.address, bob.address))
      .to.emit(withdrawalQueue, "Redeem")
      .withArgs(bob.address, bob.address, parseEther("20"), parseEther("20"));
    const afterBalance = await deployer.provider.getBalance(minter.target);
    const queueAfterBalance = await deployer.provider.getBalance(withdrawalQueue.target);

    // 100 - 80 = 20
    expect(prevBalance - afterBalance).to.eq(parseEther("20"));
    // 10 - 10 = 0
    expect(queuePrevBalance - queueAfterBalance).to.eq(0);
  });
});
