import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../utils/ship";
import {StToken__factory} from "../types";

const ACCESS_CONTROL_ABI = [
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function grantRole(bytes32 role, address account)",
  "function revokeRole(bytes32 role, address account)",
  "function GOV() view returns (bytes32)",
];

const GOVERNED_DEPLOYMENTS = [
  "FeeController",
  "StakingCore",
  "WithdrawalQueueV2",
  "OracleAdapterValidator",
  "StakingRouter",
  "ValidatorModule",
  "DVTModule",
  "LSTWrapModule",
  "QuorumOracleAdapter",
  "InstitutionalPolicyRegistry",
  "ReferralRegistry",
  "ReferralCodeRegistry",
  "DebtPool",
  "OperatorRegistry",
];

async function grantRoleIfNeeded(contract: any, role: string, holder: string, label: string) {
  if (!(await contract.hasRole(role, holder))) {
    await contract.grantRole(role, holder);
    console.log(`  granted ${label} -> ${holder}`);
  }
}

async function revokeRoleIfPresent(contract: any, role: string, holder: string, label: string) {
  if (await contract.hasRole(role, holder)) {
    await contract.revokeRole(role, holder);
    console.log(`  revoked ${label} <- ${holder}`);
  }
}

const func: DeployFunction = async hre => {
  const ship = await Ship.init(hre);
  const {accounts, address} = ship;
  const isLocal = hre.network.tags.hardhat || hre.network.name === "localhost";

  const timelockDeployment = await hre.deployments.getOrNull("GovernanceTimelock");
  if (!timelockDeployment) {
    if (isLocal) {
      console.log("  GovernanceTimelock not deployed; skipping governance handover on local network.");
      return;
    }
    throw new Error("GovernanceTimelock not deployed; refusing to skip handover on non-local network.");
  }

  const timelock = timelockDeployment.address;
  const govSigner = accounts.multiSig ?? accounts.deployer;
  const gov = govSigner.address;

  console.log(`  Governance handover target timelock: ${timelock}`);
  console.log(`  Current privileged signer: ${gov}`);

  // StToken uses transferAdmin() instead of constructor-assigned GOV role.
  const stTokenAddress = await address(StToken__factory);
  if (stTokenAddress) {
    const stToken = await ship.connect(StToken__factory, stTokenAddress);
    const defaultAdmin = await stToken.DEFAULT_ADMIN_ROLE();
    const signerIsAdmin = await stToken.hasRole(defaultAdmin, gov);
    const timelockIsAdmin = await stToken.hasRole(defaultAdmin, timelock);

    if (signerIsAdmin && !timelockIsAdmin) {
      console.log("  Transferring StToken admin to GovernanceTimelock...");
      await stToken.connect(govSigner).transferAdmin(timelock);
      if (!(await stToken.hasRole(defaultAdmin, timelock))) {
        throw new Error("StToken admin handover failed");
      }
      console.log("  StToken admin handover verified.");
    }
  }

  for (const deploymentName of GOVERNED_DEPLOYMENTS) {
    const deployment = await hre.deployments.getOrNull(deploymentName);
    if (!deployment) continue;

    const contract = await hre.ethers.getContractAt(ACCESS_CONTROL_ABI, deployment.address, govSigner);
    const defaultAdminRole = await contract.DEFAULT_ADMIN_ROLE();
    const signerIsDefaultAdmin = await contract.hasRole(defaultAdminRole, gov);

    if (!signerIsDefaultAdmin) {
      if (isLocal) {
        console.log(
          `  ${deploymentName}: signer lacks DEFAULT_ADMIN_ROLE; skipping immediate migration on local network.`,
        );
        continue;
      }
      throw new Error(
        `${deploymentName}: signer lacks DEFAULT_ADMIN_ROLE; refusing partial handover on non-local network.`,
      );
    }

    console.log(`  ${deploymentName}: migrating roles to timelock...`);
    await grantRoleIfNeeded(contract, defaultAdminRole, timelock, "DEFAULT_ADMIN_ROLE");

    let govRole: string | undefined;
    try {
      govRole = await contract.GOV();
    } catch {
      govRole = undefined;
    }

    if (govRole) {
      await grantRoleIfNeeded(contract, govRole, timelock, "GOV");
      if (gov.toLowerCase() !== timelock.toLowerCase()) {
        await revokeRoleIfPresent(contract, govRole, gov, "GOV");
      }
    }

    if (gov.toLowerCase() !== timelock.toLowerCase()) {
      await revokeRoleIfPresent(contract, defaultAdminRole, gov, "DEFAULT_ADMIN_ROLE");
    }
  }

  console.log("  Governance handover pass complete.");
};

export default func;
func.tags = ["modular-staking", "governance-handover"];
func.dependencies = [
  "stToken",
  "feeController",
  "stakingCore",
  "withdrawalQueueV2",
  "oracle-validator",
  "staking-router",
  "validator-module",
  "dvt-module",
  "lst-wrap",
  "quorum-oracle",
  "referral-code-registry",
  "referral-code-wiring",
  "referralRegistry",
  "debtPool",
  "institutionalPolicyRegistry",
  "operator-registry",
  "migration",
  "governance",
];
