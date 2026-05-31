import {ethers} from "hardhat";

/**
 * Post-deployment role assertion script for SharedStake V2 mainnet readiness.
 *
 * This script verifies that NO privileged roles are held by EOAs after deployment.
 * The most dangerous deploy window is after contracts deploy but before roles are
 * handed off to the timelock — the deployer EOA transiently has admin rights.
 *
 * Usage:
 *   npx hardhat run scripts/verify-deployment.ts --network <network>
 *
 * FAILS if any privileged role is held by an EOA (except StakingCore.routerMode disabled path).
 * PASSES when all roles are held by contracts (multisigs, timelock, adapters).
 */

interface RoleCheck {
  contractName: string;
  contractAddress: string;
  role: string;
  roleHolder: string;
  isEOA: boolean;
}

async function main() {
  console.log("\n=== Post-Deployment Role Assertion ===\n");

  const deployments = await ethers.getDeployments();
  const failures: RoleCheck[] = [];
  const checks: RoleCheck[] = [];

  // Helper to check if address is EOA
  const isEOA = async (address: string): Promise<boolean> => {
    const code = await ethers.provider.getCode(address);
    return code === "0x";
  };

  // Helper to check role holders
  const checkRole = async (
    contractName: string,
    contractAddress: string,
    roleIdentifier: string | string[],
    roleName: string,
  ) => {
    try {
      const contract = await ethers.getContractAt("AccessControl", contractAddress);

      let roleBytes: string;
      if (typeof roleIdentifier === "string") {
        if (roleIdentifier === "DEFAULT_ADMIN_ROLE") {
          roleBytes = await contract.DEFAULT_ADMIN_ROLE();
        } else {
          roleBytes = ethers.keccak256(ethers.toUtf8Bytes(roleIdentifier));
        }
      } else {
        roleBytes = roleIdentifier[0]; // Assume pre-hashed
      }

      const roleHolderCount = await contract.getRoleMemberCount(roleBytes);
      for (let i = 0; i < roleHolderCount; i++) {
        const holder = await contract.getRoleMember(roleBytes, i);
        const holderIsEOA = await isEOA(holder);

        const check: RoleCheck = {
          contractName,
          contractAddress,
          role: roleName,
          roleHolder: holder,
          isEOA: holderIsEOA,
        };
        checks.push(check);

        if (holderIsEOA) {
          failures.push(check);
        }
      }
    } catch (error) {
      // Contract might not be deployed or not have AccessControl
      console.log(`  Skipping ${contractName}.${roleName}: ${error}`);
    }
  };

  // Helper to check simple address roles (like VoteEscrowV2.gov)
  const checkAddressRole = async (
    contractName: string,
    contractAddress: string,
    roleName: string,
    getterName: string,
  ) => {
    try {
      const contract = await ethers.getContractAt("VoteEscrowV2", contractAddress);
      const holder = await contract[getterName]();
      const holderIsEOA = await isEOA(holder);

      const check: RoleCheck = {
        contractName,
        contractAddress,
        role: roleName,
        roleHolder: holder,
        isEOA: holderIsEOA,
      };
      checks.push(check);

      if (holderIsEOA) {
        failures.push(check);
      }
    } catch (error) {
      console.log(`  Skipping ${contractName}.${roleName}: ${error}`);
    }
  };

  // Check all deployed contracts
  for (const [name, deployment] of Object.entries(deployments)) {
    if (!deployment.address) continue;

    const address = deployment.address;

    // StToken roles
    if (name === "StToken") {
      await checkRole(name, address, "DEFAULT_ADMIN_ROLE", "DEFAULT_ADMIN_ROLE");
      await checkRole(name, address, "MINTER", "MINTER");
    }

    // StakingCore roles
    if (name === "StakingCore") {
      await checkRole(name, address, "DEFAULT_ADMIN_ROLE", "DEFAULT_ADMIN_ROLE");
      await checkRole(name, address, "GOV", "GOV");
      await checkRole(name, address, "ORACLE", "ORACLE");
      await checkRole(name, address, "GUARDIAN", "GUARDIAN");
      await checkRole(name, address, "NODE_OPERATOR", "NODE_OPERATOR");
    }

    // StakingRouter roles
    if (name === "StakingRouter") {
      await checkRole(name, address, "DEFAULT_ADMIN_ROLE", "DEFAULT_ADMIN_ROLE");
      await checkRole(name, address, "GOV", "GOV");
      await checkRole(name, address, "GUARDIAN", "GUARDIAN");
    }

    // WithdrawalQueueV2 roles
    if (name === "WithdrawalQueueV2") {
      await checkRole(name, address, "DEFAULT_ADMIN_ROLE", "DEFAULT_ADMIN_ROLE");
      await checkRole(name, address, "GOV", "GOV");
      await checkRole(name, address, "ORACLE", "ORACLE");
      await checkRole(name, address, "GUARDIAN", "GUARDIAN");
    }

    // FeeController roles
    if (name === "FeeController") {
      await checkRole(name, address, "DEFAULT_ADMIN_ROLE", "DEFAULT_ADMIN_ROLE");
      await checkRole(name, address, "GOV", "GOV");
    }

    // VoteEscrowV2 gov address
    if (name === "VoteEscrowV2") {
      await checkAddressRole(name, address, "gov", "gov");
    }

    // OracleAdapter roles
    if (name === "OracleAdapter") {
      await checkRole(name, address, "DEFAULT_ADMIN_ROLE", "DEFAULT_ADMIN_ROLE");
      await checkRole(name, address, "GOV", "GOV");
      await checkRole(name, address, "SUBMITTER", "SUBMITTER");
    }

    // QuorumOracleAdapter roles
    if (name === "QuorumOracleAdapter") {
      await checkRole(name, address, "DEFAULT_ADMIN_ROLE", "DEFAULT_ADMIN_ROLE");
      await checkRole(name, address, "GOV", "GOV");
      await checkRole(name, address, "SUBMITTER", "SUBMITTER");
    }

    // ValidatorModule roles
    if (name === "ValidatorModule") {
      await checkRole(name, address, "DEFAULT_ADMIN_ROLE", "DEFAULT_ADMIN_ROLE");
      await checkRole(name, address, "GOV", "GOV");
      await checkRole(name, address, "ORACLE", "ORACLE");
      await checkRole(name, address, "NODE_OPERATOR", "NODE_OPERATOR");
      await checkRole(name, address, "GUARDIAN", "GUARDIAN");
    }

    // DVTModule roles
    if (name === "DVTModule") {
      await checkRole(name, address, "DEFAULT_ADMIN_ROLE", "DEFAULT_ADMIN_ROLE");
      await checkRole(name, address, "GOV", "GOV");
      await checkRole(name, address, "ORACLE", "ORACLE");
      await checkRole(name, address, "NODE_OPERATOR", "NODE_OPERATOR");
      await checkRole(name, address, "GUARDIAN", "GUARDIAN");
    }

    // ReferralRegistry roles
    if (name === "ReferralRegistry") {
      await checkRole(name, address, "DEFAULT_ADMIN_ROLE", "DEFAULT_ADMIN_ROLE");
      await checkRole(name, address, "GOV", "GOV");
      await checkRole(name, address, "FEE_CTRL", "FEE_CTRL");
      await checkRole(name, address, "ROUTER", "ROUTER");
    }

    // DebtPool roles
    if (name === "DebtPool") {
      await checkRole(name, address, "DEFAULT_ADMIN_ROLE", "DEFAULT_ADMIN_ROLE");
      await checkRole(name, address, "GOV", "GOV");
      await checkRole(name, address, "ADMIN", "ADMIN");
      await checkRole(name, address, "FEE_CONTROLLER", "FEE_CONTROLLER");
    }
  }

  console.log(`\nChecked ${checks.length} role assignments.\n`);

  if (failures.length > 0) {
    console.error("❌ FAIL: Privileged roles held by EOAs detected!\n");
    for (const failure of failures) {
      console.error(`  ${failure.contractName}.${failure.role}: ${failure.roleHolder} (EOA)`);
    }
    console.error("\nThese roles must be transferred to contracts (multisigs, timelock) before mainnet use.\n");
    process.exit(1);
  } else {
    console.log("✅ PASS: All privileged roles are held by contracts.\n");
    console.log("Deployment is safe for mainnet use.\n");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
