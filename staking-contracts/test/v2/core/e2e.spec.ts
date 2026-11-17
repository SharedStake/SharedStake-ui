import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";
import {SgETH, SgETH__factory} from "../../../types";
import {deployments} from "hardhat";
import Ship from "../../../utils/ship";
import {ZeroAddress, ZeroHash, parseEther} from "ethers";
import chai from "chai";

const {expect} = chai;

let ship: Ship;
let sgEth: SgETH, deployer: SignerWithAddress, alice: SignerWithAddress, multiSig: SignerWithAddress;
let MINTER_ROLE: string;

const setup = deployments.createFixture(async hre => {
  ship = await Ship.init(hre);
  const {accounts, users} = ship;
  await deployments.fixture(["minter"]);

  return {
    ship,
    accounts,
    users,
  };
});

describe("e2e test", () => {
  beforeEach(async () => {
    const {ship, accounts} = await setup();

    sgEth = await ship.connect(SgETH__factory);

    deployer = accounts.deployer;
    alice = accounts.alice;
    multiSig = accounts.multiSig;

    MINTER_ROLE = await sgEth.MINTER();
  });

  it("e2e test", async () => {
    // deployer can't mint
    await expect(sgEth.connect(deployer).mint(deployer.address, parseEther("1"))).to.be.revertedWith(
      `AccessControl: account ${deployer.address.toLowerCase()} is missing role ${MINTER_ROLE}`,
    );
    // no one can't mint
    await expect(sgEth.connect(alice).mint(alice.address, parseEther("1"))).to.be.revertedWith(
      `AccessControl: account ${alice.address.toLowerCase()} is missing role ${MINTER_ROLE}`,
    );
    // add minter
    await expect(sgEth.connect(multiSig).addMinter(deployer.address))
      .to.be.emit(sgEth, "RoleGranted")
      .withArgs(MINTER_ROLE, deployer.address, multiSig.address);
    // minter can mint
    await expect(sgEth.connect(deployer).mint(deployer.address, parseEther("1")))
      .to.be.emit(sgEth, "Transfer")
      .withArgs(ZeroAddress, deployer.address, parseEther("1"));

    await sgEth.connect(multiSig).removeMinter(deployer.address);
    // add secondary owner
    // revoke deployer admin rights
    await expect(sgEth.connect(multiSig).transferOwnership(alice.address))
      .to.be.emit(sgEth, "RoleGranted")
      .withArgs(ZeroHash, alice.address, multiSig.address)
      .and.to.be.emit(sgEth, "RoleRevoked")
      .withArgs(ZeroHash, multiSig.address, multiSig.address);

    // check auth invariants are preserved. i.e ex owner and outsiders cannot interact with the contract
    await expect(sgEth.connect(multiSig).transferOwnership(deployer.address)).to.be.revertedWith(
      `AccessControl: account ${multiSig.address.toLowerCase()} is missing role ${ZeroHash}`,
    );
  });
});
