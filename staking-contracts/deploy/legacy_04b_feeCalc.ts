import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../utils/ship";
import {FeeCalc__factory} from "../types";

const func: DeployFunction = async hre => {
  const {deploy, accounts} = await Ship.init(hre);
  // initialOwner = multiSig so governance controls fee parameters (not deployer).
  const owner = (accounts.multiSig ?? accounts.deployer).address;
  await deploy(FeeCalc__factory, {
    args: [
      {
        adminFee: 0,
        exitFee: 0,
        refundFeesOnWithdraw: false,
        chargeOnDeposit: true,
        chargeOnExit: false,
      },
      owner,
    ],
  });
};

export default func;
func.tags = ["feeCalc"];
