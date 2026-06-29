import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../utils/ship";
import {
  ReferralRegistry__factory,
  StakingCore__factory,
  StakingRouter__factory,
  FeeController__factory,
  StToken__factory,
} from "../types";
import {resolveGovernanceAddress} from "../helpers/governance";
import {waitForMined} from "../helpers/moduleDeployment";

/**
 * Deploys the ReferralRegistry contract for on-chain referral attribution.
 * Grants ROUTER role to StakingCore and StakingRouter, grants FEE_CTRL to
 * FeeController, and wires FeeController's referral recipient to the registry.
 */
const func: DeployFunction = async hre => {
  const ship = await Ship.init(hre);
  const {deploy, connect, accounts} = ship;

  const gov = await resolveGovernanceAddress(hre, ship);
  const govSigner = accounts.multiSig ?? accounts.deployer;
  const stTokenDeployment = await ship.get(StToken__factory);
  const stTokenAddress = stTokenDeployment.address;

  const {contract: referralRegistry} = await deploy(ReferralRegistry__factory, {
    from: accounts.deployer,
    args: [gov, stTokenAddress],
    log: true,
  });

  // Grant ROUTER role to StakingCore
  const stakingCoreDeployment = await ship.get(StakingCore__factory);
  const ROUTER = await referralRegistry.ROUTER();
  const hasRouterRoleCore = await referralRegistry.hasRole(ROUTER, stakingCoreDeployment.address);
  if (!hasRouterRoleCore) {
    console.log("  Granting ROUTER role to StakingCore on ReferralRegistry...");
    await waitForMined(referralRegistry.connect(govSigner).grantRole(ROUTER, stakingCoreDeployment.address));
  }

  // Grant ROUTER role to StakingRouter
  const stakingRouterDeployment = await ship.get(StakingRouter__factory);
  const hasRouterRoleRouter = await referralRegistry.hasRole(ROUTER, stakingRouterDeployment.address);
  if (!hasRouterRoleRouter) {
    console.log("  Granting ROUTER role to StakingRouter on ReferralRegistry...");
    await waitForMined(referralRegistry.connect(govSigner).grantRole(ROUTER, stakingRouterDeployment.address));
  }

  // Grant FEE_CTRL role to FeeController
  const feeControllerDeployment = await ship.get(FeeController__factory);
  const FEE_CTRL = await referralRegistry.FEE_CTRL();
  const hasFeeCtrlRole = await referralRegistry.hasRole(FEE_CTRL, feeControllerDeployment.address);
  if (!hasFeeCtrlRole) {
    console.log("  Granting FEE_CTRL role to FeeController on ReferralRegistry...");
    await waitForMined(referralRegistry.connect(govSigner).grantRole(FEE_CTRL, feeControllerDeployment.address));
  }

  const feeController = await connect(FeeController__factory, feeControllerDeployment.address);
  const currentFeeReferralRegistry = await feeController.referralRegistry();
  if (currentFeeReferralRegistry.toLowerCase() !== referralRegistry.target.toString().toLowerCase()) {
    console.log("  Setting ReferralRegistry on FeeController...");
    await waitForMined(feeController.connect(govSigner).setReferralRegistry(referralRegistry.target as string));
  }

  console.log(`  ReferralRegistry deployed at: ${referralRegistry.target}`);
};

export default func;
func.tags = ["modular-staking", "referralRegistry"];
func.dependencies = ["stakingCore", "stakingRouter", "feeController", "stToken"];
