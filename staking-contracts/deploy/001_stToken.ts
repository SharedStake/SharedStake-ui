import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../../utils/ship";
import {StToken__factory} from "../../types";

const func: DeployFunction = async hre => {
  const {deploy, accounts} = await Ship.init(hre);

  await deploy(StToken__factory, {
    from: accounts.deployer,
    log: true,
  });
};

export default func;
func.tags = ["modular-staking", "stToken"];
