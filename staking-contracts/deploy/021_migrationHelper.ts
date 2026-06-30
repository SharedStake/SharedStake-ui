import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../utils/ship";
import {MigrationHelper__factory, StakingRouter__factory} from "../types";
import {resolveGovernanceAddress} from "../helpers/governance";

/**
 * Deploys the non-custodial migration signal helper for future router migrations.
 *
 * Constructor args:
 *   oldRouter - current StakingRouter deployment
 *   gov       - governance/multisig/DAO executor address
 */
const func: DeployFunction = async hre => {
  const ship = await Ship.init(hre);
  const {accounts, address, deploy} = ship;

  const oldRouter = await address(StakingRouter__factory);
  if (!oldRouter) {
    throw new Error("StakingRouter not deployed — run staking-router deployment first");
  }

  const gov = await resolveGovernanceAddress(hre, ship);

  await deploy(MigrationHelper__factory, {
    from: accounts.deployer,
    args: [oldRouter, gov],
    log: true,
  });
};

export default func;
func.tags = ["modular-staking", "migration"];
func.dependencies = ["staking-router", "governance"];
