import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../utils/ship";
import {StakingCore__factory, StToken__factory, FeeController__factory, OracleAdapter__factory} from "../types";
import {waitForMined} from "../helpers/moduleDeployment";

const func: DeployFunction = async hre => {
  const {deploy, connect, accounts, address} = await Ship.init(hre);

  // NOTE: StakingCore and StakingRouter are mutually exclusive on the same StToken.
  // Only one should hold MINTER and ORACLE roles at a time. If StakingRouter is deployed
  // in the same run, set routerMode=true on StakingCore to prevent dual-mode operation.

  const stTokenAddress = await address(StToken__factory);
  if (!stTokenAddress) throw new Error("StToken not deployed");

  const govSigner = accounts.multiSig ?? accounts.deployer;
  const gov = govSigner.address;

  const {contract: stakingCore} = await deploy(StakingCore__factory, {
    from: accounts.deployer,
    args: [stTokenAddress, gov],
    log: true,
  });

  // Grant StakingCore MINTER role on StToken so it can mint/burn shares.
  const stToken = await connect(StToken__factory);
  const MINTER = await stToken.MINTER();

  const hasRole = await stToken.hasRole(MINTER, stakingCore.target);
  if (!hasRole) {
    console.log("  Granting MINTER role to StakingCore...");
    await waitForMined(stToken.connect(accounts.deployer).addMinter(stakingCore.target as string));
  }

  // Wire FeeController if deployed.
  const feeControllerAddress = await address(FeeController__factory);
  if (feeControllerAddress) {
    console.log("  Setting FeeController on StakingCore...");
    await waitForMined(stakingCore.connect(govSigner).setFeeController(feeControllerAddress));
  }

  // Grant ORACLE role to OracleAdapter if it exists, otherwise bootstrap gov until oracle deployment grants/revokes roles.
  // Use govSigner (holds DEFAULT_ADMIN_ROLE) for all role grants.
  const ORACLE = await stakingCore.ORACLE();
  const oracleAdapterAddress = await address(OracleAdapter__factory);
  if (oracleAdapterAddress) {
    console.log("  Granting ORACLE role to OracleAdapter on StakingCore...");
    await waitForMined(stakingCore.connect(govSigner).grantRole(ORACLE, oracleAdapterAddress));
  } else {
    console.log("  Granting bootstrap ORACLE role to gov on StakingCore...");
    await waitForMined(stakingCore.connect(govSigner).grantRole(ORACLE, gov));
  }

  const referralCodeRegistryDeployment = await hre.deployments.getOrNull("ReferralCodeRegistry");
  if (referralCodeRegistryDeployment) {
    const currentRegistry = await stakingCore.referralCodeRegistry();
    if (currentRegistry.toLowerCase() !== referralCodeRegistryDeployment.address.toLowerCase()) {
      console.log("  Setting ReferralCodeRegistry on StakingCore...");
      await waitForMined(stakingCore.connect(govSigner).setReferralCodeRegistry(referralCodeRegistryDeployment.address));
    }
  }
};

export default func;
func.tags = ["modular-staking", "stakingCore"];
// "oracleAdapter" removed — it creates a cycle (stakingCore→oracleAdapter→validatorModule→stakingRouter→stakingCore).
// The ORACLE role on StakingCore is wired here opportunistically if oracleAdapter is already deployed,
// and separately enforced by 009_oracleAdapter.ts for the canonical modular deploy path.
func.dependencies = ["stToken", "feeController"];
