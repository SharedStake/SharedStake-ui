import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../utils/ship";
import {
  StakingRouter__factory,
  StToken__factory,
  FeeController__factory,
  StakingCore__factory,
  WithdrawalQueueV2__factory,
} from "../types";
import type {StakingRouter} from "../types";
import {waitForMined} from "../helpers/moduleDeployment";

/**
 * Deploys the StakingRouter, the modular front-door for ETH staking.
 * Grants the router MINTER role on StToken so it can mint shares on submit()
 * and on rebase. The router is also wired to the FeeController if available.
 */
const func: DeployFunction = async hre => {
  const {connect, accounts, address} = await Ship.init(hre);

  const stTokenAddress = await address(StToken__factory);
  if (!stTokenAddress) throw new Error("StToken not deployed");

  const govSigner = accounts.multiSig ?? accounts.deployer;
  const gov = govSigner.address;

  // Deploy StakingRouter as UUPS proxy (idempotent)
  const existingRouter = await hre.deployments.getOrNull("StakingRouter");

  let proxyAddress: string;
  if (existingRouter) {
    console.log("  StakingRouter already deployed at:", existingRouter.address);
    proxyAddress = existingRouter.address;
  } else {
    const Factory = await hre.ethers.getContractFactory("StakingRouter", accounts.deployer);
    const proxy = await hre.upgrades.deployProxy(Factory, [stTokenAddress, gov], {
      kind: "uups",
      initializer: "initialize",
    });
    await proxy.waitForDeployment();
    proxyAddress = await proxy.getAddress();

    const artifact = await hre.artifacts.readArtifact("StakingRouter");
    await hre.deployments.save("StakingRouter", {
      address: proxyAddress,
      abi: artifact.abi,
      transactionHash: proxy.deploymentTransaction()?.hash,
    });
    console.log("  StakingRouter deployed (UUPS proxy) at:", proxyAddress);
  }

  const router: StakingRouter = StakingRouter__factory.connect(proxyAddress, accounts.deployer);

  // Grant StakingRouter MINTER on StToken so it can mint/burn shares.
  const stToken = await connect(StToken__factory);
  const MINTER = await stToken.MINTER();

  const hasRole = await stToken.hasRole(MINTER, router.target);
  if (!hasRole) {
    console.log("  Granting MINTER role to StakingRouter...");
    await waitForMined(stToken.connect(accounts.deployer).addMinter(router.target as string));
  }

  // Wire FeeController if it has been deployed.
  const feeControllerAddress = await address(FeeController__factory);
  if (feeControllerAddress) {
    console.log("  Setting FeeController on StakingRouter...");
    await waitForMined(router.connect(govSigner).setFeeController(feeControllerAddress));
  }

  const referralCodeRegistryDeployment = await hre.deployments.getOrNull("ReferralCodeRegistry");
  if (referralCodeRegistryDeployment) {
    const currentRegistry = await router.referralCodeRegistry();
    if (currentRegistry.toLowerCase() !== referralCodeRegistryDeployment.address.toLowerCase()) {
      console.log("  Setting ReferralCodeRegistry on StakingRouter...");
      await waitForMined(router.connect(govSigner).setReferralCodeRegistry(referralCodeRegistryDeployment.address));
    }
  }

  const withdrawalQueueDeployment = await hre.deployments.getOrNull("WithdrawalQueueV2");
  if (withdrawalQueueDeployment) {
    const withdrawalQueue = WithdrawalQueueV2__factory.connect(withdrawalQueueDeployment.address, accounts.deployer);
    const currentSyncer = await withdrawalQueue.accountingSyncer();
    if (currentSyncer.toLowerCase() !== router.target.toString().toLowerCase()) {
      console.log("  Setting WithdrawalQueueV2 accounting syncer to StakingRouter...");
      await waitForMined(withdrawalQueue.connect(govSigner).setAccountingSyncer(router.target as string));
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
      await waitForMined(stakingCore.connect(govSigner).enableRouterMode(router.target as string));
    }

    // Revoke StakingCore's MINTER role — router is now the sole minter.
    const MINTER = await stToken.MINTER();
    const coreHasMinter = await stToken.hasRole(MINTER, stakingCoreDeployment.address);
    if (coreHasMinter) {
      console.log("  Revoking MINTER from StakingCore (StakingRouter is now the sole minter)...");
      await waitForMined(stToken.connect(accounts.deployer).removeMinter(stakingCoreDeployment.address));
    }
  }
};

export default func;
func.tags = ["modular-staking", "staking-router"];
func.dependencies = ["stToken", "feeController", "stakingCore"];
