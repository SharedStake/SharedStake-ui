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
import {parseEther} from "ethers";

const {expect} = chai;

let ship: Ship;
let sgEth: SgETH,
  minter: SharedDepositMinterV2,
  wsgEth: WSGETH,
  rewardsReceiver: RewardsReceiver,
  deployer: SignerWithAddress,
  alice: SignerWithAddress,
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

describe("RewardsReceiver", () => {
  beforeEach(async () => {
    const {ship, accounts} = await setup();

    sgEth = await ship.connect(SgETH__factory);
    minter = await ship.connect(SharedDepositMinterV2__factory);
    wsgEth = await ship.connect(WSGETH__factory);
    rewardsReceiver = await ship.connect(RewardsReceiver__factory);

    deployer = accounts.deployer;
    alice = accounts.alice;
    multiSig = accounts.multiSig;
  });

  it("work", async () => {
    // deposit eth for test
    await deployer.sendTransaction({
      to: rewardsReceiver.target,
      value: parseEther("1"),
    });

    let prevBalance = await deployer.provider.getBalance(rewardsReceiver.target);
    await rewardsReceiver.work();
    let afterBalance = await deployer.provider.getBalance(rewardsReceiver.target);
    expect(afterBalance).to.eq(prevBalance - parseEther("1"));

    await deployer.sendTransaction({
      to: rewardsReceiver.target,
      value: parseEther("1"),
    });
    await rewardsReceiver.connect(multiSig).flipState();

    prevBalance = await deployer.provider.getBalance(rewardsReceiver.target);
    await rewardsReceiver.work();
    afterBalance = await deployer.provider.getBalance(rewardsReceiver.target);
    expect(afterBalance).to.eq(prevBalance - parseEther("1"));
  });

  it("flipState", async () => {
    await expect(rewardsReceiver.connect(alice).flipState()).to.be.revertedWith("Ownable: caller is not the owner");

    expect(await rewardsReceiver.state()).to.eq(0);
    await rewardsReceiver.connect(multiSig).flipState();
    expect(await rewardsReceiver.state()).to.eq(1);
  });
});
