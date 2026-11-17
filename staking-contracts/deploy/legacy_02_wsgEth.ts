import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../utils/ship";
import {SgETH, SgETH__factory, WSGETH__factory} from "../types";

const func: DeployFunction = async hre => {
  const {deploy, connect} = await Ship.init(hre);

  const sgEth = (await connect(SgETH__factory)) as SgETH;
  await deploy(WSGETH__factory, {
    args: [sgEth.target, 24 * 60 * 60],
  });
};

export default func;
func.tags = ["wsgEth"];
func.dependencies = ["sgEth"];
