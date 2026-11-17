import type {HardhatRuntimeEnvironment} from "hardhat/types";
import type Ship from "../utils/ship";

const GOV_ADDRESS_ENV_KEYS = ["V2_GOV_ADDRESS", "GOV_ADDRESS", "GOVERNANCE_ADDRESS"];
const OPERATOR_ADDRESS_ENV_KEYS = ["V2_OPERATOR_ADDRESS", "OPERATOR_ADDRESS"];
const NODE_OPERATOR_ENV_KEYS = ["V2_NODE_OPERATOR_ADDRESS", "NODE_OPERATOR_ADDRESS"];
const ORACLE_SUBMITTER_ENV_KEYS = ["V2_ORACLE_SUBMITTER_ADDRESSES", "ORACLE_SUBMITTER_ADDRESSES"];

export function isLocalNetwork(hre: HardhatRuntimeEnvironment): boolean {
  return hre.network.tags.hardhat === true || hre.network.name === "hardhat" || hre.network.name === "localhost";
}

function readFirstEnvKey(keys: string[]): string | undefined {
  for (const key of keys) {
    const val = process.env[key];
    if (val && val.trim()) return val.trim();
  }
  return undefined;
}

/**
 * Resolve governance (multisig/timelock) address.
 * Local: accounts.multiSig ?? accounts.deployer
 * Non-local: V2_GOV_ADDRESS | GOV_ADDRESS | GOVERNANCE_ADDRESS env var (required)
 */
export async function resolveGovernanceAddress(hre: HardhatRuntimeEnvironment, ship: Ship): Promise<string> {
  if (isLocalNetwork(hre)) {
    return (ship.accounts.multiSig ?? ship.accounts.deployer).address;
  }
  const fromEnv = readFirstEnvKey(GOV_ADDRESS_ENV_KEYS);
  if (!fromEnv) {
    throw new Error(`No governance address configured. Set one of: ${GOV_ADDRESS_ENV_KEYS.join(", ")}`);
  }
  return fromEnv;
}

/**
 * Resolve fee-recipient operator address.
 * Local: gov (gov acts as operator in tests)
 * Non-local: V2_OPERATOR_ADDRESS | OPERATOR_ADDRESS env var; fallback to gov
 */
export function resolveOperatorAddress(hre: HardhatRuntimeEnvironment, gov: string): string {
  if (isLocalNetwork(hre)) return gov;
  return readFirstEnvKey(OPERATOR_ADDRESS_ENV_KEYS) ?? gov;
}

/**
 * Resolve node operator (validator key manager) address.
 * Defaults to gov in local/tests; production should be a separate hot-wallet.
 * Override with V2_NODE_OPERATOR_ADDRESS | NODE_OPERATOR_ADDRESS env var.
 */
export function resolveNodeOperatorAddress(gov: string): string {
  return readFirstEnvKey(NODE_OPERATOR_ENV_KEYS) ?? gov;
}

/**
 * Resolve oracle submitter addresses (array).
 * Local: [deployer.address]
 * Non-local: comma-separated list from V2_ORACLE_SUBMITTER_ADDRESSES | ORACLE_SUBMITTER_ADDRESSES (required)
 */
export function resolveOracleSubmitterAddresses(hre: HardhatRuntimeEnvironment, ship: Ship): string[] {
  if (isLocalNetwork(hre)) {
    return [ship.accounts.deployer.address];
  }
  const raw = readFirstEnvKey(ORACLE_SUBMITTER_ENV_KEYS);
  if (!raw) {
    throw new Error(
      `No oracle submitter addresses configured. Set one of: ${ORACLE_SUBMITTER_ENV_KEYS.join(", ")} ` +
        "(comma-separated list of Ethereum addresses)",
    );
  }
  return raw
    .split(",")
    .map(a => a.trim())
    .filter(Boolean);
}
