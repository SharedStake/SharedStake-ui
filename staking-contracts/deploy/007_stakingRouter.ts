import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../utils/ship";
import {StakingRouter__factory, StToken__factory, FeeController__factory, StakingCore__factory} from "../types";

/**
 * Deploys the StakingRouter, the modular front-door for ETH staking.
 * Grants the router MINTER role on StToken so it can mint shares on submit()
 * and on rebase. The router is also wired to the FeeController if available.
 */
const func: DeployFunction = async hre => {
  const {deploy, connect, accounts, address} = await Ship.init(hre);

  const stTokenAddress = await address(StToken__factory);
  if (!stTokenAddress) throw new Error("StToken not deployed");

  const govSigner = accounts.multiSig ?? accounts.deployer;
  const gov = govSigner.address;

  const {contract: router} = await deploy(StakingRouter__factory, {
    from: accounts.deployer,
    args: [stTokenAddress, gov],
    log: true,
  });

  // Grant StakingRouter MINTER on StToken so it can mint/burn shares.
  const stToken = await connect(StToken__factory);
  const MINTER = await stToken.MINTER();

  const hasRole = await stToken.hasRole(MINTER, router.target);
  if (!hasRole) {
    console.log("  Granting MINTER role to StakingRouter...");
    await stToken.connect(accounts.deployer).addMinter(router.target as string);
  }

  // Wire FeeController if it has been deployed.
  const feeControllerAddress = await address(FeeController__factory);
  if (feeControllerAddress) {
    console.log("  Setting FeeController on StakingRouter...");
    await router.connect(govSigner).setFeeController(feeControllerAddress);
  }

  const referralCodeRegistryDeployment = await hre.deployments.getOrNull("ReferralCodeRegistry");
  if (referralCodeRegistryDeployment) {
    const currentRegistry = await router.referralCodeRegistry();
    if (currentRegistry.toLowerCase() !== referralCodeRegistryDeployment.address.toLowerCase()) {
      console.log("  Setting ReferralCodeRegistry on StakingRouter...");
      await router.connect(govSigner).setReferralCodeRegistry(referralCodeRegistryDeployment.address);
    }
  }

  // If StakingCore exists, enable router mode and revoke its MINTER role for defense-in-depth.
  // routerMode is a one-way latch, but revoking MINTER ensures StakingCore cannot mint
  // even if a future code path bypasses the latch.
  const stakingCoreDeployment = await hre.deployments.getOrNull("StakingCore");
  if (stakingCoreDeployment) {
    console.log("  Enabling router mode on StakingCore to prevent dual-mode operation...");
    const stakingCore = await connect(StakingCore__factory);
    const currentRouterMode = await stakingCore.routerMode();
    if (!currentRouterMode) {
      await stakingCore.connect(govSigner).enableRouterMode(router.target as string);
    }

    // Revoke StakingCore's MINTER role — router is now the sole minter.
    const MINTER = await stToken.MINTER();
    const coreHasMinter = await stToken.hasRole(MINTER, stakingCoreDeployment.address);
    if (coreHasMinter) {
      console.log("  Revoking MINTER from StakingCore (StakingRouter is now the sole minter)...");
      await stToken.connect(accounts.deployer).removeMinter(stakingCoreDeployment.address);
    }
  }
};

export default func;
func.tags = ["modular-staking", "staking-router"];
func.dependencies = ["stToken", "feeController", "stakingCore"];
