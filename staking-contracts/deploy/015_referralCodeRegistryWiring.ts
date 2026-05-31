import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../../utils/ship";
import {StakingCore__factory, StakingRouter__factory} from "../../types";

const func: DeployFunction = async hre => {
  const {connect, accounts} = await Ship.init(hre);
  const govSigner = accounts.multiSig ?? accounts.deployer;
  const isLocal = hre.network.tags.hardhat || hre.network.name === "localhost";

  const referralCodeRegistry = await hre.deployments.getOrNull("ReferralCodeRegistry");
  if (!referralCodeRegistry) {
    if (isLocal) {
      console.log("  ReferralCodeRegistry not deployed; skipping referral code wiring on local network.");
      return;
    }
    throw new Error("ReferralCodeRegistry not deployed; refusing to skip referral code wiring on non-local network.");
  }

  const stakingCoreDeployment = await hre.deployments.getOrNull("StakingCore");
  if (stakingCoreDeployment) {
    const stakingCore = await connect(StakingCore__factory);
    const current = await stakingCore.referralCodeRegistry();
    if (current.toLowerCase() !== referralCodeRegistry.address.toLowerCase()) {
      console.log("  Wiring ReferralCodeRegistry -> StakingCore...");
      await stakingCore.connect(govSigner).setReferralCodeRegistry(referralCodeRegistry.address);
    }
  }

  const stakingRouterDeployment = await hre.deployments.getOrNull("StakingRouter");
  if (stakingRouterDeployment) {
    const stakingRouter = await connect(StakingRouter__factory);
    const current = await stakingRouter.referralCodeRegistry();
    if (current.toLowerCase() !== referralCodeRegistry.address.toLowerCase()) {
      console.log("  Wiring ReferralCodeRegistry -> StakingRouter...");
      await stakingRouter.connect(govSigner).setReferralCodeRegistry(referralCodeRegistry.address);
    }
  }
};

export default func;
func.tags = ["modular-staking", "referral-code-wiring"];
func.dependencies = ["referral-code-registry", "stakingCore", "staking-router"];
