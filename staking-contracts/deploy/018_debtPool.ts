import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../utils/ship";
import {DebtPool__factory, FeeController__factory, StToken__factory, WstToken__factory} from "../types";
import {resolveGovernanceAddress} from "../helpers/governance";

/**
 * Deploys the DebtPool contract for Merkle tree debt distribution.
 * Updates FeeController.setRecipients() to include DebtPool address.
 */
const func: DeployFunction = async hre => {
  const ship = await Ship.init(hre);
  const {deploy, connect, accounts} = ship;

  const gov = await resolveGovernanceAddress(hre, ship);
  const admin = gov; // Same as gov initially; GOV role gates createDistribution

  const feeControllerDeployment = await ship.get(FeeController__factory);
  const feeControllerAddress = feeControllerDeployment.address;

  const stTokenDeployment = await ship.get(StToken__factory);
  const stTokenAddress = stTokenDeployment.address;

  const wstTokenDeployment = await ship.get(WstToken__factory);
  const wstTokenAddress = wstTokenDeployment.address;

  const {contract: debtPool} = await deploy(DebtPool__factory, {
    from: accounts.deployer,
    args: [stTokenAddress, wstTokenAddress, gov, admin, feeControllerAddress],
    log: true,
  });

  // Update FeeController.setRecipients() to wire in DebtPool address
  const feeController = await connect(FeeController__factory);
  try {
    // Read current recipients
    const currentRecipients = await feeController.getRecipients();
    const treasury = currentRecipients[0];
    const operator = currentRecipients[1];
    const referralRegistry = await feeController.referralRegistry();

    console.log("  Updating FeeController recipients to include DebtPool...");
    const govSigner = accounts.multiSig ?? accounts.deployer;
    await feeController
      .connect(govSigner)
      .setRecipients(treasury, operator, referralRegistry, debtPool.target as string);
    console.log(`  FeeController debtPool recipient set to ${debtPool.target}`);
  } catch (e) {
    console.log("  FeeController.setRecipients() failed or not available; manual configuration required.");
    console.error(e);
  }

  console.log(`  DebtPool deployed at: ${debtPool.target}`);
};

export default func;
func.tags = ["modular-staking", "debtPool"];
func.dependencies = ["feeController", "stToken", "wstToken", "referralRegistry"];
