import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../utils/ship";
import {
  SgETH,
  SgETH__factory,
  SharedDepositMinterV2__factory,
  WSGETH,
  WSGETH__factory,
  FeeCalc,
  FeeCalc__factory,
} from "../types";

const func: DeployFunction = async hre => {
  const {deploy, connect, accounts, address} = await Ship.init(hre);

  const sgEth = (await connect(SgETH__factory)) as SgETH;
  const wsgEth = (await connect(WSGETH__factory)) as WSGETH;
  const feeCalc = (await connect(FeeCalc__factory)) as FeeCalc;

  const chainId = await hre.getChainId();
  let depositContractAddr: string;
  if (chainId !== "1") {
    const dep = await hre.deployments.getOrNull("DepositContract");
    depositContractAddr = dep ? dep.address : hre.ethers.ZeroAddress;
  } else {
    depositContractAddr = "0x00000000219ab540356cBB839Cbe05303d7705Fa";
  }

  // Use multiSig on all networks (matches governance.ts resolveGovernanceAddress pattern).
  const multiSig = (accounts.multiSig ?? accounts.deployer).address;
  const numValidators = 1000;
  const adminFee = 0;

  const addresses = [
    feeCalc.target,
    sgEth.target,
    wsgEth.target,
    multiSig,
    depositContractAddr,
  ];

  const minter = await deploy(SharedDepositMinterV2__factory, {
    args: [numValidators, adminFee, addresses],
  });

  if (minter.newlyDeployed) {
    const tx = await sgEth.addMinter(minter.address);
    console.log("Adding minter role at", tx.hash);
    await tx.wait();

    // Transfer SgETH admin from deployer to multiSig so governance controls the token.
    // Done after addMinter so deployer can still grant minter role above.
    await sgEth.connect(accounts.deployer).transferOwnership(accounts.multiSig.address);
  }
};

export default func;
func.tags = ["minter"];
func.dependencies = ["sgEth", "wsgEth", "feeCalc"];
