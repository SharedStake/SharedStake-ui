import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../utils/ship";
import {InstitutionalPolicyRegistry__factory} from "../types";
import {resolveGovernanceAddress} from "../helpers/governance";

/**
 * Deploys the InstitutionalPolicyRegistry for allowlist/blocklist policy management.
 * Optional component — skipped if already deployed. Referenced by 014_governanceHandover.ts.
 */
const func: DeployFunction = async hre => {
  const ship = await Ship.init(hre);
  const {deploy, accounts} = ship;

  const gov = await resolveGovernanceAddress(hre, ship);

  await deploy(InstitutionalPolicyRegistry__factory, {
    from: accounts.deployer,
    args: [gov],
    log: true,
  });
};

export default func;
func.tags = ["modular-staking", "institutionalPolicyRegistry"];
func.dependencies = [];
