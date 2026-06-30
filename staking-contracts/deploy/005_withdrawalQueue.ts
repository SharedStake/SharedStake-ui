import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../utils/ship";
import {WithdrawalQueueV2__factory, StToken__factory, StakingCore__factory} from "../types";
import {waitForMined} from "../helpers/moduleDeployment";

const func: DeployFunction = async hre => {
  const {deploy, connect, accounts, address} = await Ship.init(hre);

  const stTokenAddress = await address(StToken__factory);
  if (!stTokenAddress) throw new Error("StToken not deployed");

  const govSigner = accounts.multiSig ?? accounts.deployer;
  const gov = govSigner.address;

  const {contract: queue} = await deploy(WithdrawalQueueV2__factory, {
    from: accounts.deployer,
    args: [stTokenAddress, gov],
    log: true,
  });

  // Grant WithdrawalQueueV2 MINTER role so it can burn shares during requestWithdrawals.
  const stToken = await connect(StToken__factory);
  const MINTER = await stToken.MINTER();

  const hasRole = await stToken.hasRole(MINTER, queue.target);
  if (!hasRole) {
    console.log("  Granting MINTER role to WithdrawalQueueV2...");
    await waitForMined(stToken.connect(accounts.deployer).addMinter(queue.target as string));
  }

  // Wire WithdrawalQueueV2 to StakingCore for standalone deployments. Router-mode
  // deployments leave reportBeacon queue obligations at request-time accounting.
  const stakingCoreDeployment = await address(StakingCore__factory);
  if (stakingCoreDeployment) {
    const stakingCore = await connect(StakingCore__factory);
    const currentQueue = await stakingCore.withdrawalQueue();
    if (currentQueue.toLowerCase() !== queue.target.toString().toLowerCase()) {
      console.log("  Setting WithdrawalQueueV2 address on StakingCore...");
      await waitForMined(stakingCore.connect(govSigner).setWithdrawalQueue(queue.target as string));
    }
  }
};

export default func;
func.tags = ["modular-staking", "withdrawalQueueV2"];
func.dependencies = ["stToken", "stakingCore"];
