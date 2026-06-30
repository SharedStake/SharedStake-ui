import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../utils/ship";
import {DepositContract__factory} from "../types";

const func: DeployFunction = async hre => {
  const {deploy} = await Ship.init(hre);
  await deploy(DepositContract__factory, {args: []});
};

export default func;
func.tags = ["depositContract"];
