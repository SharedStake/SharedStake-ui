import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../../utils/ship";
import {WstToken__factory, StToken__factory} from "../../types";

const func: DeployFunction = async hre => {
  const {deploy, accounts, address} = await Ship.init(hre);

  const stTokenAddress = await address(StToken__factory);
  if (!stTokenAddress) throw new Error("StToken not deployed");

  await deploy(WstToken__factory, {
    from: accounts.deployer,
    args: [stTokenAddress],
    log: true,
  });
};

export default func;
func.tags = ["modular-staking", "wstToken"];
func.dependencies = ["stToken"];
