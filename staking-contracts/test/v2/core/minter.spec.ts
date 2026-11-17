import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";
import {
  RewardsReceiver,
  RewardsReceiver__factory,
  SgETH,
  SgETH__factory,
  SharedDepositMinterV2,
  SharedDepositMinterV2__factory,
  WSGETH,
  WSGETH__factory,
} from "../../../types";
import chai from "chai";
import {deployments} from "hardhat";
import Ship from "../../../utils/ship";
import {MaxUint256, ZeroAddress, parseEther} from "ethers";
import {time} from "@nomicfoundation/hardhat-network-helpers";

const {expect} = chai;

let ship: Ship;
let sgEth: SgETH,
  minter: SharedDepositMinterV2,
  wsgEth: WSGETH,
  rewardsReceiver: RewardsReceiver,
  deployer: SignerWithAddress,
  alice: SignerWithAddress,
  bob: SignerWithAddress,
  multiSig: SignerWithAddress;

const setup = deployments.createFixture(async hre => {
  ship = await Ship.init(hre);
  const {accounts, users} = ship;
  await deployments.fixture(["sgEth", "minter", "wsgEth", "rewardsReceiver"]);

  return {
    ship,
    accounts,
    users,
  };
});

describe("SharedDepositMinterV2", () => {
  beforeEach(async () => {
    const {ship, accounts} = await setup();

    sgEth = await ship.connect(SgETH__factory);
    minter = await ship.connect(SharedDepositMinterV2__factory);
    wsgEth = await ship.connect(WSGETH__factory);
    rewardsReceiver = await ship.connect(RewardsReceiver__factory);

    deployer = accounts.deployer;
    alice = accounts.alice;
    bob = accounts.bob;
    multiSig = accounts.multiSig;
  });

  describe("functionality", () => {
    it("deposit", async () => {
      const prevBalance = await sgEth.balanceOf(alice.address);
      await minter.connect(alice).deposit({
        value: parseEther("1"),
      });
      const afterBalance = await sgEth.balanceOf(alice.address);
      expect(afterBalance).to.eq(prevBalance + parseEther("1"));
    });

    it("depositFor", async () => {
      // alice deposit for bob
      const prevBalance = await sgEth.balanceOf(bob.address);
      await minter.connect(alice).depositFor(bob.address, {
        value: parseEther("1"),
      });
      const afterBalance = await sgEth.balanceOf(bob.address);
      expect(afterBalance).to.eq(prevBalance + parseEther("1"));
    });

    it("depositAndStake", async () => {
      const prevStake = await wsgEth.maxRedeem(deployer.address);
      const prevBalance = await sgEth.balanceOf(wsgEth.target);
      await minter.depositAndStake({
        value: parseEther("1"),
      });
      const afterBalance = await sgEth.balanceOf(wsgEth.target);
      expect(afterBalance).to.eq(prevBalance + parseEther("1"));

      const afterStake = await wsgEth.maxRedeem(deployer.address);
      expect(afterStake).to.eq(prevStake + parseEther("1"));
    });

    it("depositAndStakeFor", async () => {
      // alice deposit and stake for bob
      const prevStake = await wsgEth.maxRedeem(bob.address);
      const prevBalance = await sgEth.balanceOf(wsgEth.target);
      await minter.connect(alice).depositAndStakeFor(bob.address, {
        value: parseEther("1"),
      });
      const afterBalance = await sgEth.balanceOf(wsgEth.target);
      expect(afterBalance).to.eq(prevBalance + parseEther("1"));

      const afterStake = await wsgEth.maxRedeem(bob.address);
      expect(afterStake).to.eq(prevStake + parseEther("1"));
    });

    it("withdraw, withdrawTo", async () => {
      await minter.connect(alice).deposit({
        value: parseEther("1"),
      });
      await expect(minter.connect(alice).withdraw(parseEther("1.1"))).to.be.revertedWith(
        "ERC20: burn amount exceeds balance",
      );

      let prevBalance = await sgEth.balanceOf(alice.address);
      await minter.connect(alice).withdraw(parseEther("0.5"));
      let afterBalance = await sgEth.balanceOf(alice.address);

      expect(afterBalance).to.eq(prevBalance - parseEther("0.5"));

      prevBalance = await sgEth.balanceOf(alice.address);
      await minter.connect(alice).withdrawTo(parseEther("0.5"), bob.address);
      afterBalance = await sgEth.balanceOf(alice.address);

      expect(afterBalance).to.eq(prevBalance - parseEther("0.5"));
    });

    it("unstakeAndWithdraw", async () => {
      await minter.connect(alice).depositAndStake({
        value: parseEther("1"),
      });
      await expect(minter.connect(alice).unstakeAndWithdraw(parseEther("1.1"), alice.address)).to.be.revertedWithPanic(
        "0x11",
      );
      await expect(minter.connect(alice).unstakeAndWithdraw(parseEther("0.5"), alice.address)).to.be.revertedWithPanic(
        "0x11",
      );

      await wsgEth.connect(alice).approve(minter.target, MaxUint256);
      let prevBalance = await wsgEth.balanceOf(alice.address);
      await minter.connect(alice).unstakeAndWithdraw(parseEther("0.5"), alice.address);
      let afterBalance = await wsgEth.balanceOf(alice.address);

      expect(afterBalance).to.eq(prevBalance - parseEther("0.5"));
    });

    it("slash", async () => {
      await minter.connect(alice).depositAndStake({
        value: parseEther("10"),
      });
      expect(await wsgEth.maxWithdraw(alice.address)).to.eq(parseEther("10"));

      // deposit to rewardReceiver to simulate reward
      await deployer.sendTransaction({
        to: rewardsReceiver.target,
        value: parseEther("1"),
      });
      // sends 60% of sgEth to WSGEth contract
      await rewardsReceiver.work();

      // slash 0.1 eth from reward amount, so currently reward is 0.5
      await expect(minter.connect(multiSig).slash(parseEther("0.1")))
        .to.be.emit(sgEth, "Transfer")
        .withArgs(wsgEth.target, ZeroAddress, parseEther("0.1"));

      // max withdrawal amount is not changed yet because didn't called syncReward of WsgEth
      expect(await wsgEth.maxWithdraw(alice.address)).to.eq(parseEther("10"));

      await time.increase(24 * 60 * 60);

      // deposit more to call syncReward, rewards increases by linear from this moment
      await minter.connect(alice).depositAndStake({
        value: parseEther("1"),
      });

      await time.increase(24 * 60 * 60);

      // deposit more to call syncReward. can test with full reward
      await minter.connect(alice).depositAndStake({
        value: parseEther("1"),
      });

      // currently withdrawal amount is 10 + 1 + 1 + 0.6 - 0.1 = 12.5
      expect(await wsgEth.maxWithdraw(alice.address)).to.eq(parseEther("12.5"));
    });
  });

  describe("access control", async () => {
    it("setWithdrawalCredential", async () => {
      // only NOR Role can call this function
      const NOR_ROLE = await minter.NOR();
      await expect(minter.connect(alice).setWithdrawalCredential("0x")).to.be.revertedWith(
        `AccessControl: account ${alice.address.toLowerCase()} is missing role ${NOR_ROLE}`,
      );

      await minter.connect(multiSig).setWithdrawalCredential("0x");
    });

    it("slash", async () => {
      // only GOV Role can call this function
      const GOV_ROLE = await minter.GOV();
      await expect(minter.connect(alice).slash(parseEther("0.1"))).to.be.revertedWith(
        `AccessControl: account ${alice.address.toLowerCase()} is missing role ${GOV_ROLE}`,
      );

      await expect(minter.connect(multiSig).slash(parseEther("0.1")))
        .to.be.revertedWithCustomError(minter, "AmountTooHigh")
        .withArgs();

      await minter.connect(alice).depositAndStake({
        value: parseEther("10"),
      });
      await expect(minter.connect(multiSig).slash(parseEther("0.1")))
        .to.be.emit(sgEth, "Transfer")
        .withArgs(wsgEth.target, ZeroAddress, parseEther("0.1"));
    });

    it("togglePause", async () => {
      // only GOV Role can call this function
      const GOV_ROLE = await minter.GOV();
      await expect(minter.connect(alice).togglePause()).to.be.revertedWith(
        `AccessControl: account ${alice.address.toLowerCase()} is missing role ${GOV_ROLE}`,
      );

      await expect(minter.connect(multiSig).togglePause()).to.be.emit(minter, "Paused").withArgs(multiSig.address);
    });

    it("migrateShares", async () => {
      // only GOV Role can call this function
      const GOV_ROLE = await minter.GOV();
      await expect(minter.connect(alice).migrateShares(parseEther("0.1"))).to.be.revertedWith(
        `AccessControl: account ${alice.address.toLowerCase()} is missing role ${GOV_ROLE}`,
      );

      await minter.connect(multiSig).migrateShares(parseEther("0.1"));
    });

    it("toggleWithdrawRefund", async () => {
      // only GOV Role can call this function
      const GOV_ROLE = await minter.GOV();
      await expect(minter.connect(alice).toggleWithdrawRefund()).to.be.revertedWith(
        `AccessControl: account ${alice.address.toLowerCase()} is missing role ${GOV_ROLE}`,
      );

      await minter.connect(multiSig).toggleWithdrawRefund();
    });

    it("setNumValidators", async () => {
      // only GOV Role can call this function
      const GOV_ROLE = await minter.GOV();
      await expect(minter.connect(alice).setNumValidators(1)).to.be.revertedWith(
        `AccessControl: account ${alice.address.toLowerCase()} is missing role ${GOV_ROLE}`,
      );
      await expect(minter.connect(multiSig).setNumValidators(0))
        .to.be.revertedWithCustomError(minter, "NoValidators")
        .withArgs();

      await minter.connect(multiSig).setNumValidators(1);
    });
  });
});
