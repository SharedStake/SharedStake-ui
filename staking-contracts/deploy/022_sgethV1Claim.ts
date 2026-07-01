import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../utils/ship";
import {SgEthV1Claim__factory} from "../types";
import {isLocalNetwork, resolveGovernanceAddress} from "../helpers/governance";
import {isAddress} from "ethers";

const ROOT_ENV_KEYS = ["SGETH_V1_CLAIM_ROOT", "V2_SGETH_V1_CLAIM_ROOT"];
const GUARDIAN_ENV_KEYS = ["SGETH_V1_CLAIM_GUARDIAN", "V2_SGETH_V1_CLAIM_GUARDIAN"];
const TRANSFERS_ENABLED_ENV_KEYS = ["SGETH_V1_CLAIM_TRANSFERS_ENABLED", "V2_SGETH_V1_CLAIM_TRANSFERS_ENABLED"];

export const LOCAL_SGETH_V1_CLAIM_RECIPIENT = "0x3333333333333333333333333333333333333333";
export const LOCAL_SGETH_V1_CLAIM_AMOUNT = "1000000000000000000000"; // 1,000 sgethV1Claim
export const LOCAL_SGETH_V1_CLAIM_ROOT = "0xbf0ff24d098a628e78f819531c91867cbbbb1bccec7b5e4335c62bdbcb2eb0d4";

function readFirstEnv(keys: string[]): string | undefined {
  for (const key of keys) {
    const raw = process.env[key]?.trim();
    if (raw) return raw;
  }
  return undefined;
}

function readBoolEnv(keys: string[]): boolean | undefined {
  const raw = readFirstEnv(keys)?.toLowerCase();
  if (!raw) return undefined;
  if (["1", "true", "yes", "y", "on"].includes(raw)) return true;
  if (["0", "false", "no", "n", "off"].includes(raw)) return false;
  throw new Error(`Invalid boolean env value for ${keys.join(" or ")}: ${raw}`);
}

function requireBytes32(value: string, label: string): string {
  if (!/^0x[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error(`${label} must be a 32-byte hex string`);
  }
  return value;
}

const func: DeployFunction = async hre => {
  const ship = await Ship.init(hre);
  const {deploy, accounts} = ship;
  const local = isLocalNetwork(hre);
  const gov = await resolveGovernanceAddress(hre, ship);

  const root = readFirstEnv(ROOT_ENV_KEYS) ?? (local ? LOCAL_SGETH_V1_CLAIM_ROOT : undefined);
  if (!root) {
    throw new Error(`Missing sgETH V1 claim root. Set one of ${ROOT_ENV_KEYS.join(", ")} for non-local deploys.`);
  }

  const configuredGuardian = readFirstEnv(GUARDIAN_ENV_KEYS);
  const guardian = configuredGuardian ?? gov;
  if (!isAddress(guardian)) {
    throw new Error(`Invalid sgETH V1 claim guardian: ${guardian}`);
  }

  const transfersEnabled = readBoolEnv(TRANSFERS_ENABLED_ENV_KEYS) ?? false;

  const {contract} = await deploy(SgEthV1Claim__factory, {
    from: accounts.deployer,
    args: [requireBytes32(root, "sgETH V1 claim root"), gov, guardian, transfersEnabled],
    log: true,
  });

  console.log(`  SgEthV1Claim deployed at: ${contract.target}`);
  console.log(`  root=${root} gov=${gov} guardian=${guardian} transfersEnabled=${transfersEnabled}`);
  if (local) {
    console.log(`  local fixture recipient=${LOCAL_SGETH_V1_CLAIM_RECIPIENT} amount=${LOCAL_SGETH_V1_CLAIM_AMOUNT}`);
  }
};

export default func;
func.tags = ["modular-staking", "sgeth-v1-claim"];
func.dependencies = ["governance"];
