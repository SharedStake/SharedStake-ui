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
import {ZeroHash} from "ethers";

const {expect} = chai;

let ship: Ship;
let minter: SharedDepositMinterV2,
  rewardsReceiver: RewardsReceiver,
  withdrawalQueue: WithdrawalQueue,
  feeCalc: FeeCalc,
  sgEth: SgETH,
  deployer: SignerWithAddress,
  alice: SignerWithAddress,
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

describe("Deployment security defaults", () => {
  beforeEach(async () => {
    const {ship, accounts} = await setup();

    minter = await ship.connect(SharedDepositMinterV2__factory);
    rewardsReceiver = await ship.connect(RewardsReceiver__factory);
    withdrawalQueue = await ship.connect(WithdrawalQueue__factory);
    feeCalc = await ship.connect(FeeCalc__factory);
    sgEth = await ship.connect(SgETH__factory);

    deployer = accounts.deployer;
    alice = accounts.alice;
    multiSig = accounts.multiSig;
  });

  it("wires governance and ownership away from deployer", async () => {
    const MINTER_GOV_ROLE = await minter.GOV();
    const MINTER_NOR_ROLE = await minter.NOR();
    const QUEUE_GOV_ROLE = await withdrawalQueue.GOV();
    const DEFAULT_ADMIN_ROLE = ZeroHash;

    expect(await minter.hasRole(MINTER_GOV_ROLE, multiSig.address)).to.eq(true);
    expect(await minter.hasRole(MINTER_GOV_ROLE, deployer.address)).to.eq(false);
    expect(await minter.hasRole(MINTER_NOR_ROLE, multiSig.address)).to.eq(true);
    expect(await minter.hasRole(MINTER_NOR_ROLE, deployer.address)).to.eq(false);

    expect(await minter.hasRole(DEFAULT_ADMIN_ROLE, multiSig.address)).to.eq(false);
    expect(await minter.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to.eq(false);
    await expect(minter.connect(multiSig).grantRole(MINTER_GOV_ROLE, alice.address)).to.be.revertedWith(
      `AccessControl: account ${multiSig.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`,
    );

    expect(await withdrawalQueue.hasRole(QUEUE_GOV_ROLE, multiSig.address)).to.eq(true);
    expect(await withdrawalQueue.hasRole(QUEUE_GOV_ROLE, deployer.address)).to.eq(false);
    expect(await withdrawalQueue.hasRole(DEFAULT_ADMIN_ROLE, multiSig.address)).to.eq(false);
    await expect(withdrawalQueue.connect(multiSig).grantRole(QUEUE_GOV_ROLE, alice.address)).to.be.revertedWith(
      `AccessControl: account ${multiSig.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`,
    );

    expect(await feeCalc.owner()).to.eq(multiSig.address);
    expect(await rewardsReceiver.owner()).to.eq(multiSig.address);

    expect(await sgEth.hasRole(DEFAULT_ADMIN_ROLE, multiSig.address)).to.eq(true);
    expect(await sgEth.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to.eq(false);
  });
});
