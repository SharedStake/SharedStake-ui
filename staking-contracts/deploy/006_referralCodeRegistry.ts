import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../../utils/ship";
import {resolveGovernanceAddress} from "../helpers/governance";

const func: DeployFunction = async hre => {
  const ship = await Ship.init(hre);
  const {accounts} = ship;

  const gov = await resolveGovernanceAddress(hre, ship);

  await hre.deployments.deploy("ReferralCodeRegistry", {
    contract: "ReferralCodeRegistry",
    from: accounts.deployer.address,
    args: [gov],
    log: true,
  });
};

export default func;
func.tags = ["modular-staking", "referral-code-registry"];
