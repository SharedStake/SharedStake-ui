import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../utils/ship";
import {SgETH__factory} from "../types";

const func: DeployFunction = async hre => {
  const {deploy, connect, accounts} = await Ship.init(hre);
  const result = await deploy(SgETH__factory);
  // Admin transfer to multiSig happens in legacy_05_minter.ts (after addMinter).
};

export default func;
func.tags = ["sgEth"];
