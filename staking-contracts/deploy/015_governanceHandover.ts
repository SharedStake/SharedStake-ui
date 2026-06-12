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
  // When accounts.multiSig is set, govSigner = multiSig, but the StToken DEFAULT_ADMIN_ROLE
  // was granted to the deployer at construction time. Check both addresses.
  const stTokenAddress = await address(StToken__factory);
  if (stTokenAddress) {
    const stToken = await ship.connect(StToken__factory, stTokenAddress);
    const defaultAdmin = await stToken.DEFAULT_ADMIN_ROLE();
    const deployerAddress = accounts.deployer.address;
    const signerIsAdmin = await stToken.hasRole(defaultAdmin, gov);
    const deployerIsAdmin = deployerAddress !== gov && (await stToken.hasRole(defaultAdmin, deployerAddress));
    const timelockIsAdmin = await stToken.hasRole(defaultAdmin, timelock);

    if ((signerIsAdmin || deployerIsAdmin) && !timelockIsAdmin) {
      // Use whichever account currently holds DEFAULT_ADMIN_ROLE to perform the transfer.
      const adminSigner = signerIsAdmin ? govSigner : accounts.deployer;
      console.log("  Transferring StToken admin to GovernanceTimelock...");
      await stToken.connect(adminSigner).transferAdmin(timelock);
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

  // DebtPool has a separate ADMIN role (for createDistribution) that the main loop doesn't cover.
  // Migrate it explicitly so the deployer doesn't retain distribution rights post-handover.
  const debtPoolDeployment = await hre.deployments.getOrNull("DebtPool");
  if (debtPoolDeployment) {
    const debtPool = await hre.ethers.getContractAt(
      [...ACCESS_CONTROL_ABI, "function ADMIN() view returns (bytes32)"],
      debtPoolDeployment.address,
      govSigner,
    );
    try {
      const adminRole = await debtPool.ADMIN();
      const defaultAdminRole = await debtPool.DEFAULT_ADMIN_ROLE();
      const timelockIsAdmin = await debtPool.hasRole(defaultAdminRole, timelock);
      if (timelockIsAdmin) {
        await grantRoleIfNeeded(debtPool, adminRole, timelock, "DebtPool.ADMIN");
        if (gov.toLowerCase() !== timelock.toLowerCase()) {
          await revokeRoleIfPresent(debtPool, adminRole, gov, "DebtPool.ADMIN");
        }
        console.log("  DebtPool ADMIN role migrated to timelock.");
      }
    } catch {
      console.log("  DebtPool ADMIN role not migrated (role unavailable or no access).");
    }
  }

  // M5: Revoke bootstrap ORACLE from deployer/gov on StakingCore once OracleAdapter is wired.
  // The bootstrap role was granted by 004_stakingCore.ts for pre-adapter testing and must be
  // revoked before mainnet launch so gov cannot bypass OracleAdapter sanity checks.
  const stakingCoreDeployment = await hre.deployments.getOrNull("StakingCore");
  const oracleAdapterDeployment = await hre.deployments.getOrNull("OracleAdapterValidator");
  if (stakingCoreDeployment && oracleAdapterDeployment) {
    const stakingCoreAbi = [...ACCESS_CONTROL_ABI, "function ORACLE() view returns (bytes32)"];
    const stakingCoreContract = await hre.ethers.getContractAt(
      stakingCoreAbi,
      stakingCoreDeployment.address,
      govSigner,
    );
    const ORACLE = await (stakingCoreContract as any).ORACLE();
    // Revoke from both govSigner and deployer in case either holds the bootstrap role.
    await revokeRoleIfPresent(stakingCoreContract, ORACLE, gov, "StakingCore.ORACLE (bootstrap)");
    if (accounts.deployer.address !== gov) {
      await revokeRoleIfPresent(
        stakingCoreContract,
        ORACLE,
        accounts.deployer.address,
        "StakingCore.ORACLE (bootstrap deployer)",
      );
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
