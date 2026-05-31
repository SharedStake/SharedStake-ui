import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../../utils/ship";
import {ReferralRegistry__factory, StakingCore__factory, StakingRouter__factory, FeeController__factory, StToken__factory} from "../../types";
import {resolveGovernanceAddress} from "../helpers/governance";

/**
 * Deploys the ReferralRegistry contract for on-chain referral attribution.
 * Grants ROUTER role to StakingCore and StakingRouter, and FEE_CTRL role to FeeController.
 * Wires the registry into StakingCore and StakingRouter if setReferralCodeRegistry exists.
 */
const func: DeployFunction = async hre => {
  const ship = await Ship.init(hre);
  const {deploy, connect, accounts, address} = ship;

  const gov = await resolveGovernanceAddress(hre, ship);
  const stTokenDeployment = await ship.get(StToken__factory);
  const stTokenAddress = stTokenDeployment.address;

  const {contract: referralRegistry} = await deploy(ReferralRegistry__factory, {
    from: accounts.deployer,
    args: [gov, stTokenAddress],
    log: true,
  });

  // Grant ROUTER role to StakingCore
  const stakingCoreDeployment = await ship.get(StakingCore__factory);
  const stakingCore = await connect(StakingCore__factory, stakingCoreDeployment.address);
  const ROUTER = await referralRegistry.ROUTER();
  const hasRouterRoleCore = await referralRegistry.hasRole(ROUTER, stakingCoreDeployment.address);
  if (!hasRouterRoleCore) {
    console.log("  Granting ROUTER role to StakingCore on ReferralRegistry...");
    await referralRegistry.connect(accounts.deployer).grantRole(ROUTER, stakingCoreDeployment.address);
  }

  // Grant ROUTER role to StakingRouter
  const stakingRouterDeployment = await ship.get(StakingRouter__factory);
  const stakingRouter = await connect(StakingRouter__factory, stakingRouterDeployment.address);
  const hasRouterRoleRouter = await referralRegistry.hasRole(ROUTER, stakingRouterDeployment.address);
  if (!hasRouterRoleRouter) {
    console.log("  Granting ROUTER role to StakingRouter on ReferralRegistry...");
    await referralRegistry.connect(accounts.deployer).grantRole(ROUTER, stakingRouterDeployment.address);
  }

  // Grant FEE_CTRL role to FeeController
  const feeControllerDeployment = await ship.get(FeeController__factory);
  const FEE_CTRL = await referralRegistry.FEE_CTRL();
  const hasFeeCtrlRole = await referralRegistry.hasRole(FEE_CTRL, feeControllerDeployment.address);
  if (!hasFeeCtrlRole) {
    console.log("  Granting FEE_CTRL role to FeeController on ReferralRegistry...");
    await referralRegistry.connect(accounts.deployer).grantRole(FEE_CTRL, feeControllerDeployment.address);
  }

  // Wire ReferralRegistry into StakingCore if setReferralCodeRegistry exists
  try {
    const currentRegistry = await stakingCore.referralCodeRegistry();
    if (currentRegistry.toLowerCase() !== referralRegistry.target.toString().toLowerCase()) {
      console.log("  Setting ReferralRegistry on StakingCore...");
      const govSigner = accounts.multiSig ?? accounts.deployer;
      await stakingCore.connect(govSigner).setReferralCodeRegistry(referralRegistry.target as string);
    }
  } catch (e) {
    console.log("  StakingCore.setReferralCodeRegistry not available or failed; skipping.");
  }

  // Wire ReferralRegistry into StakingRouter
  try {
    const currentRegistry = await stakingRouter.referralCodeRegistry();
    if (currentRegistry.toLowerCase() !== referralRegistry.target.toString().toLowerCase()) {
      console.log("  Setting ReferralRegistry on StakingRouter...");
      const govSigner = accounts.multiSig ?? accounts.deployer;
      await stakingRouter.connect(govSigner).setReferralCodeRegistry(referralRegistry.target as string);
    }
  } catch (e) {
    console.log("  StakingRouter.setReferralCodeRegistry not available or failed; skipping.");
  }

  console.log(`  ReferralRegistry deployed at: ${referralRegistry.target}`);
};

export default func;
func.tags = ["modular-staking", "referralRegistry"];
func.dependencies = ["stakingCore", "stakingRouter", "feeController", "stToken"];