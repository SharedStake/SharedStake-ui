import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../../utils/ship";
import {DVTModule__factory, OracleAdapter__factory, ValidatorModule__factory} from "../../types";
import {resolveGovernanceAddress, resolveOracleSubmitterAddresses} from "../helpers/governance";

/**
 * Deploys an OracleAdapter that points at the ValidatorModule (router-managed
 * staking). The adapter accepts sanity-checked beacon reports from authorized
 * SUBMITTERs and forwards them to `validatorModule.reportBeacon`.
 *
 * The adapter is granted the ORACLE role on the ValidatorModule so it can call
 * `reportBeacon`. If a direct ORACLE grant exists on `gov`, this script revokes
 * it to avoid bypassing adapter-level sanity checks.
 */
const func: DeployFunction = async hre => {
  const ship = await Ship.init(hre);
  const {deploy, connect, accounts, address} = ship;

  const validatorModuleAddress = await address(ValidatorModule__factory);
  if (!validatorModuleAddress) throw new Error("ValidatorModule not deployed");

  const gov = await resolveGovernanceAddress(hre, ship);
  const govSigner = accounts.multiSig ?? accounts.deployer;
  if (govSigner.address.toLowerCase() !== gov.toLowerCase()) {
    throw new Error(
      `Governance signer mismatch: signer=${govSigner.address} resolvedGov=${gov}. ` +
      "Set governance env/config so the current GOV signer executes oracle wiring.",
    );
  }

  const {contract: adapter} = await deploy(OracleAdapter__factory, {
    from: accounts.deployer,
    args: [validatorModuleAddress, gov],
    log: true,
    aliasName: "OracleAdapterValidator",
  });

  // Grant ORACLE role on each deployed validator-style module.
  const grantOracleRole = async (moduleContract: any, moduleName: string) => {
    const ORACLE = await moduleContract.ORACLE();
    const hasRole = await moduleContract.hasRole(ORACLE, adapter.target);
    if (!hasRole) {
      console.log(`  Granting ORACLE role to OracleAdapter on ${moduleName}...`);
      await moduleContract.connect(govSigner).grantRole(ORACLE, adapter.target as string);
    }
    if (gov.toLowerCase() !== (adapter.target as string).toLowerCase() && await moduleContract.hasRole(ORACLE, gov)) {
      console.log(`  Revoking direct ORACLE role from gov on ${moduleName}...`);
      await moduleContract.connect(govSigner).revokeRole(ORACLE, gov);
    }
  };

  const validatorModule = await connect(ValidatorModule__factory);
  await grantOracleRole(validatorModule, "ValidatorModule");

  const dvtAddress = await address(DVTModule__factory);
  if (dvtAddress) {
    const dvtModule = await connect(DVTModule__factory);
    await grantOracleRole(dvtModule, "DVTModule");
  }

  // Submitter bootstrap: local defaults to deployer; non-local requires explicit env configuration.
  const submitters = resolveOracleSubmitterAddresses(hre, ship);
  const SUBMITTER = await adapter.SUBMITTER();
  for (const submitter of submitters) {
    if (!(await adapter.hasRole(SUBMITTER, submitter))) {
      console.log(`  Adding SUBMITTER on OracleAdapterValidator: ${submitter}`);
      await adapter.connect(govSigner).addSubmitter(submitter);
    }
  }
};

export default func;
func.tags = ["modular-staking", "oracle-validator"];
func.dependencies = ["validator-module"];
