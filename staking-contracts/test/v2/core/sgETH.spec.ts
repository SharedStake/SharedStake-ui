import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";
import {SgETH, SgETH__factory} from "../../../types";
import {deployments} from "hardhat";
import Ship from "../../../utils/ship";
import {ZeroAddress, ZeroHash} from "ethers";
import chai from "chai";

const {expect} = chai;

let ship: Ship;
let sgEth: SgETH, deployer: SignerWithAddress, alice: SignerWithAddress, multiSig: SignerWithAddress;
let MINTER_ROLE: string;

const setup = deployments.createFixture(async hre => {
  ship = await Ship.init(hre);
  const {accounts, users} = ship;
  await deployments.fixture(["sgEth"]);

  return {
    ship,
    accounts,
    users,
  };
});

describe("SgETH.sol", () => {
  beforeEach(async () => {
    const {ship, accounts} = await setup();

    sgEth = await ship.connect(SgETH__factory);

    deployer = accounts.deployer;
    alice = accounts.alice;
    multiSig = accounts.multiSig;

    MINTER_ROLE = await sgEth.MINTER();
  });

  it("addMinter", async () => {
    await expect(sgEth.connect(alice).addMinter(alice.address)).to.be.revertedWith(
      `AccessControl: account ${alice.address.toLowerCase()} is missing role ${ZeroHash}`,
    );
    await expect(sgEth.connect(deployer).addMinter(ZeroAddress))
      .to.be.revertedWithCustomError(sgEth, "ZeroAddress")
      .withArgs();

    await expect(sgEth.connect(deployer).addMinter(alice.address))
      .to.be.emit(sgEth, "RoleGranted")
      .withArgs(MINTER_ROLE, alice.address, deployer.address);
  });

  it("removeMinter", async () => {
    await sgEth.connect(deployer).addMinter(alice.address);
    await expect(sgEth.connect(alice).removeMinter(alice.address)).to.be.revertedWith(
      `AccessControl: account ${alice.address.toLowerCase()} is missing role ${ZeroHash}`,
    );

    await expect(sgEth.connect(deployer).removeMinter(alice.address))
      .to.be.emit(sgEth, "RoleRevoked")
      .withArgs(MINTER_ROLE, alice.address, deployer.address);
  });

  it("transferOwnership", async () => {
    await expect(sgEth.connect(alice).transferOwnership(alice.address)).to.be.revertedWith(
      `AccessControl: account ${alice.address.toLowerCase()} is missing role ${ZeroHash}`,
    );

    await expect(sgEth.connect(deployer).transferOwnership(alice.address))
      .to.be.emit(sgEth, "RoleGranted")
      .withArgs(ZeroHash, alice.address, deployer.address)
      .and.to.be.emit(sgEth, "RoleRevoked")
      .withArgs(ZeroHash, deployer.address, deployer.address);
  });
});
