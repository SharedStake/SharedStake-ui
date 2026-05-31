import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";
import {
  FeeCalc,
  FeeCalc__factory,
  RewardsReceiver,
  RewardsReceiver__factory,
  SgETH,
  SgETH__factory,
  SharedDepositMinterV2,
  SharedDepositMinterV2__factory,
  WithdrawalQueue,
  WithdrawalQueue__factory,
} from "../../../types";
import chai from "chai";
import {deployments} from "hardhat";
import Ship from "../../../utils/ship";
import {ZeroAddress, ZeroHash} from "ethers";

const {expect} = chai;

let ship: Ship;
let minter: SharedDepositMinterV2,
  withdrawalQueue: WithdrawalQueue,
  sgEth: SgETH,
  rewardsReceiver: RewardsReceiver,
  feeCalc: FeeCalc,
  alice: SignerWithAddress,
  bob: SignerWithAddress,
  stranger: SignerWithAddress;

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

const missingRoleError = (address: string, role: string) =>
  `AccessControl: account ${address.toLowerCase()} is missing role ${role}`;

describe("AccessControl negative matrix", () => {
  beforeEach(async () => {
    const {ship, accounts, users} = await setup();

    minter = await ship.connect(SharedDepositMinterV2__factory);
    withdrawalQueue = await ship.connect(WithdrawalQueue__factory);
    sgEth = await ship.connect(SgETH__factory);
    rewardsReceiver = await ship.connect(RewardsReceiver__factory);
    feeCalc = await ship.connect(FeeCalc__factory);

    alice = accounts.alice;
    bob = accounts.bob;
    stranger = users[0];
  });

  describe("SharedDepositMinterV2", () => {
    it("rejects batchDepositToEth2 from non-NOR caller", async () => {
      const NOR_ROLE = await minter.NOR();
      await expect(minter.connect(stranger).batchDepositToEth2([], [], [])).to.be.revertedWith(
        missingRoleError(stranger.address, NOR_ROLE),
      );
    });

    it("rejects setWithdrawalCredential from non-NOR caller", async () => {
      const NOR_ROLE = await minter.NOR();
      await expect(minter.connect(stranger).setWithdrawalCredential("0x")).to.be.revertedWith(
        missingRoleError(stranger.address, NOR_ROLE),
      );
    });

    it("rejects slash from non-GOV caller", async () => {
      const GOV_ROLE = await minter.GOV();
      await expect(minter.connect(stranger).slash(0)).to.be.revertedWith(
        missingRoleError(stranger.address, GOV_ROLE),
      );
    });

    it("rejects setFeeCalc from non-GOV caller", async () => {
      const GOV_ROLE = await minter.GOV();
      await expect(minter.connect(stranger).setFeeCalc(ZeroAddress)).to.be.revertedWith(
        missingRoleError(stranger.address, GOV_ROLE),
      );
    });

    it("rejects togglePause from non-GOV caller", async () => {
      const GOV_ROLE = await minter.GOV();
      await expect(minter.connect(stranger).togglePause()).to.be.revertedWith(
        missingRoleError(stranger.address, GOV_ROLE),
      );
    });

    it("rejects migrateShares from non-GOV caller", async () => {
      const GOV_ROLE = await minter.GOV();
      await expect(minter.connect(stranger).migrateShares(0)).to.be.revertedWith(
        missingRoleError(stranger.address, GOV_ROLE),
      );
    });

    it("rejects toggleWithdrawRefund from non-GOV caller", async () => {
      const GOV_ROLE = await minter.GOV();
      await expect(minter.connect(stranger).toggleWithdrawRefund()).to.be.revertedWith(
        missingRoleError(stranger.address, GOV_ROLE),
      );
    });

    it("rejects setNumValidators from non-GOV caller", async () => {
      const GOV_ROLE = await minter.GOV();
      await expect(minter.connect(stranger).setNumValidators(1)).to.be.revertedWith(
        missingRoleError(stranger.address, GOV_ROLE),
      );
    });

    it("rejects withdrawAdminFee from non-GOV caller", async () => {
      const GOV_ROLE = await minter.GOV();
      await expect(minter.connect(stranger).withdrawAdminFee(0)).to.be.revertedWith(
        missingRoleError(stranger.address, GOV_ROLE),
      );
    });
  });

  describe("WithdrawalQueue", () => {
    it("rejects togglePause from non-GOV caller", async () => {
      const GOV_ROLE = await withdrawalQueue.GOV();
      await expect(withdrawalQueue.connect(stranger).togglePause(1)).to.be.revertedWith(
        missingRoleError(stranger.address, GOV_ROLE),
      );
    });

    it("rejects setEpochLength from non-GOV caller", async () => {
      const GOV_ROLE = await withdrawalQueue.GOV();
      await expect(withdrawalQueue.connect(stranger).setEpochLength(2)).to.be.revertedWith(
        missingRoleError(stranger.address, GOV_ROLE),
      );
    });

    it("rejects requestRedeem when caller is neither owner nor operator", async () => {
      await expect(
        withdrawalQueue.connect(stranger).requestRedeem(1, alice.address, bob.address),
      ).to.be.revertedWithCustomError(withdrawalQueue, "PermissionDenied");
    });

    it("rejects redeem when caller is neither owner nor operator", async () => {
      await expect(
        withdrawalQueue.connect(stranger).redeem(1, alice.address, bob.address),
      ).to.be.revertedWithCustomError(withdrawalQueue, "PermissionDenied");
    });

    it("rejects cancelRedeem when caller is neither owner nor operator", async () => {
      await expect(
        withdrawalQueue.connect(stranger).cancelRedeem(alice.address, bob.address),
      ).to.be.revertedWithCustomError(withdrawalQueue, "PermissionDenied");
    });
  });

  describe("SgETH", () => {
    it("rejects addMinter from non-admin caller", async () => {
      await expect(sgEth.connect(stranger).addMinter(stranger.address)).to.be.revertedWith(
        missingRoleError(stranger.address, ZeroHash),
      );
    });

    it("rejects removeMinter from non-admin caller", async () => {
      await expect(sgEth.connect(stranger).removeMinter(stranger.address)).to.be.revertedWith(
        missingRoleError(stranger.address, ZeroHash),
      );
    });

    it("rejects transferOwnership from non-admin caller", async () => {
      await expect(sgEth.connect(stranger).transferOwnership(stranger.address)).to.be.revertedWith(
        missingRoleError(stranger.address, ZeroHash),
      );
    });
  });

  describe("RewardsReceiver", () => {
    it("rejects flipState from non-owner caller", async () => {
      await expect(rewardsReceiver.connect(stranger).flipState()).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });

    it("rejects setDAOFeeSplitter from non-owner caller", async () => {
      await expect(rewardsReceiver.connect(stranger).setDAOFeeSplitter(stranger.address)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
  });

  describe("FeeCalc", () => {
    it("rejects set from non-owner caller", async () => {
      await expect(
        feeCalc.connect(stranger).set({
          adminFee: 0,
          exitFee: 0,
          refundFeesOnWithdraw: false,
          chargeOnDeposit: false,
          chargeOnExit: false,
        }),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("rejects setRefundFeesOnWithdraw from non-owner caller", async () => {
      await expect(feeCalc.connect(stranger).setRefundFeesOnWithdraw(true)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });

    it("rejects setExitFee from non-owner caller", async () => {
      await expect(feeCalc.connect(stranger).setExitFee(1)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });

    it("rejects setAdminFee from non-owner caller", async () => {
      await expect(feeCalc.connect(stranger).setAdminFee(1)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
  });
});
