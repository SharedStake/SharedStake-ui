import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../utils/ship";
import {
  QuorumOracleAdapter__factory,
  ValidatorModule__factory,
  OracleAdapter__factory,
} from "../types";
import {resolveGovernanceAddress, resolveOracleSubmitterAddresses} from "../helpers/governance";

/**
 * Deploys QuorumOracleAdapter as an ALTERNATIVE oracle path (not replacing
 * the single-submitter OracleAdapter). Ops can choose which adapter to wire
 * as the active ORACLE on ValidatorModule/DVTModule.
 *
 * Default: quorum = 3 for mainnet, 1 for local/testnet.
 * Production: configure 5 submitters on mainnet, quorum = 3 minimum (Opus recommendation).
 */
const func: DeployFunction = async hre => {
  const ship = await Ship.init(hre);
  const {deploy, connect, accounts, address} = ship;
  const isLocal = hre.network.tags.hardhat || hre.network.name === "localhost";

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

  const submitters = resolveOracleSubmitterAddresses(hre, ship);
  const configuredQuorumRaw = process.env.V2_QUORUM_ORACLE_QUORUM;
  // Set to 3 for mainnet (minimum viable per Opus), 1 for local/testnet
  const defaultQuorum = isLocal ? 1 : 3;
  const configuredQuorum = configuredQuorumRaw ? Number(configuredQuorumRaw) : defaultQuorum;
  if (!Number.isInteger(configuredQuorum) || configuredQuorum <= 0) {
    throw new Error(`Invalid quorum value: ${configuredQuorumRaw}`);
  }
  if (submitters.length < configuredQuorum) {
    if (!isLocal) {
      throw new Error(
        `Quorum ${configuredQuorum} exceeds configured submitters (${submitters.length}). ` +
          "Provide enough V2_ORACLE_SUBMITTERS before non-local deployment.",
      );
    }
    console.warn(
      `  Quorum ${configuredQuorum} exceeds local submitter set (${submitters.length}); lowering to ${submitters.length}.`,
    );
  }
  const initialQuorum = Math.max(1, Math.min(configuredQuorum, submitters.length));

  const {contract: adapter} = await deploy(QuorumOracleAdapter__factory, {
    from: accounts.deployer,
    args: [validatorModuleAddress, gov, initialQuorum],
    log: true,
    aliasName: "QuorumOracleAdapter",
  });

  // Grant ORACLE role on each deployed validator-style module.
  const grantOracleRole = async (moduleContract: any, moduleName: string) => {
    const ORACLE = await moduleContract.ORACLE();
    const hasRole = await moduleContract.hasRole(ORACLE, adapter.target);
    if (!hasRole) {
      console.log(`  Granting ORACLE role to QuorumOracleAdapter on ${moduleName}...`);
      await moduleContract.connect(govSigner).grantRole(ORACLE, adapter.target as string);
    }
    if (gov.toLowerCase() !== (adapter.target as string).toLowerCase() && (await moduleContract.hasRole(ORACLE, gov))) {
      console.log(`  Revoking direct ORACLE role from gov on ${moduleName}...`);
      await moduleContract.connect(govSigner).revokeRole(ORACLE, gov);
    }
  };

  const validatorModule = await connect(ValidatorModule__factory);
  await grantOracleRole(validatorModule, "ValidatorModule");

  // DVTModule oracle wiring deferred to feat/dvt-module (PR 381)

  // Revoke single-submitter OracleAdapter ORACLE role to enforce quorum
  // This ensures only QuorumOracleAdapter can submit oracle reports
  const oracleAdapterDeployment = await ship.getOrNull(OracleAdapter__factory, "OracleAdapterValidator");
  if (oracleAdapterDeployment) {
    console.log("  Revoking single-submitter OracleAdapter ORACLE role to enforce quorum...");
    const ORACLE = await validatorModule.ORACLE();
    const oracleAdapterAddress = oracleAdapterDeployment.address;

    // Revoke from ValidatorModule
    if (await validatorModule.hasRole(ORACLE, oracleAdapterAddress)) {
      console.log("  Revoking ORACLE from OracleAdapter on ValidatorModule...");
      await validatorModule.connect(govSigner).revokeRole(ORACLE, oracleAdapterAddress);
    }

    console.log("  QuorumOracleAdapter is now the sole oracle (quorum enforced)");
  }

  const SUBMITTER = await adapter.SUBMITTER();
  for (const submitter of submitters) {
    if (!(await adapter.hasRole(SUBMITTER, submitter))) {
      console.log(`  Adding SUBMITTER on QuorumOracleAdapter: ${submitter}`);
      await adapter.connect(govSigner).addSubmitter(submitter);
    }
  }

  const quorum = Number(await adapter.quorum());
  const submitterCount = Number(await adapter.submitterCount());
  if (submitterCount < quorum) {
    throw new Error(
      `QuorumOracleAdapter is not live-safe: submitters=${submitterCount}, quorum=${quorum}. ` +
        "Configure enough submitters before use.",
    );
  }
};

export default func;
func.tags = ["modular-staking", "quorum-oracle"];
func.dependencies = ["validator-module"];
