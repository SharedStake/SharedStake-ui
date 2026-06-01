import {isAddress, ZeroAddress} from "ethers";
import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../utils/ship";
import {DVTModule__factory, OperatorRegistry__factory, ValidatorModule__factory} from "../types";
import {assertGovernanceSigner, getGovernanceSigner} from "../helpers/moduleDeployment";
import {isLocalNetwork, resolveGovernanceAddress} from "../helpers/governance";

const SGT_ADDRESS_ENV_KEYS = ["V2_SGT_ADDRESS"];

function readConfiguredSgtAddress(): string | undefined {
  for (const key of SGT_ADDRESS_ENV_KEYS) {
    const val = process.env[key]?.trim();
    if (val) return val;
  }
  return undefined;
}

/**
 * Deploys OperatorRegistry and wires it to ValidatorModule + DVTModule.
 *
 * The registry is optional — modules fall back to role-based access when no
 * registry is set. This script is safe to run after 008_validatorModule and
 * 011_dvtModule have already been deployed.
 *
 * Default bond config (env-overridable):
 *   V2_OPERATOR_ETH_BOND_PER_SLOT  — ETH per slot (default: 1 ETH)
 *   V2_OPERATOR_SGT_BOND_PER_SLOT  — SGT per slot (default: 1000 SGT)
 *   V2_OPERATOR_MAX_SLOTS          — max slots per operator (default: 100)
 *
 * SGT token:
 *   local — reuses the SGTV2 MockERC20 deployed by 013_governance.ts
 *   other — V2_SGT_ADDRESS env var (mainnet: 0x84810bcF08744d5862B8181f12d17bfd57d3b078)
 */
const func: DeployFunction = async hre => {
  const ship = await Ship.init(hre);
  const {deploy, connect, accounts, address, hre: hardhat} = ship;
  const isLocal = isLocalNetwork(hre);

  const gov = await resolveGovernanceAddress(hre, ship);
  const govSigner = getGovernanceSigner(ship);
  assertGovernanceSigner(ship, gov);

  // ── SGT token ───────────────────────────────────────────────────────────────
  let sgtAddress: string;
  if (isLocal) {
    const localSgt = await address("SGTV2");
    if (!localSgt) throw new Error("SGTV2 not deployed — run 013_governance first");
    sgtAddress = localSgt;
    console.log("  Using local SGTV2:", sgtAddress);
  } else {
    const configured = readConfiguredSgtAddress();
    if (!configured || !isAddress(configured) || configured.toLowerCase() === ZeroAddress.toLowerCase()) {
      throw new Error(
        `Missing valid SGT address for non-local deployment. Set one of ${SGT_ADDRESS_ENV_KEYS.join(", ")}.`,
      );
    }
    sgtAddress = configured;
    console.log("  Using configured SGT:", sgtAddress);
  }

  // ── Bond config defaults ────────────────────────────────────────────────────
  const ethBondPerSlot = hre.ethers.parseEther(process.env.V2_OPERATOR_ETH_BOND_PER_SLOT ?? "1");
  const sgtBondPerSlot = hre.ethers.parseEther(process.env.V2_OPERATOR_SGT_BOND_PER_SLOT ?? "1000");
  const maxSlots = BigInt(process.env.V2_OPERATOR_MAX_SLOTS ?? "100");
  const DEFAULT_CONFIG = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("default"));

  // ── Deploy ──────────────────────────────────────────────────────────────────
  const {contract: registry} = await deploy(OperatorRegistry__factory, {
    from: accounts.deployer,
    args: [sgtAddress, gov],
    log: true,
  });

  // ── Configure default bond tier ─────────────────────────────────────────────
  const currentConfig = await registry.bondConfigs(DEFAULT_CONFIG);
  if (currentConfig.maxSlots === 0n) {
    console.log("  Configuring default bond tier...");
    await registry.connect(govSigner).setBondConfig(DEFAULT_CONFIG, ethBondPerSlot, sgtBondPerSlot, maxSlots);
    await registry.connect(govSigner).setDefaultConfig(DEFAULT_CONFIG);
    console.log(
      `  Default config: ${hre.ethers.formatEther(ethBondPerSlot)} ETH + ${hre.ethers.formatEther(sgtBondPerSlot)} SGT per slot, max ${maxSlots} slots`,
    );
  } else {
    console.log("  Default bond config already set");
  }

  // ── Wire to ValidatorModule ─────────────────────────────────────────────────
  const validatorModuleAddress = await address(ValidatorModule__factory);
  if (validatorModuleAddress) {
    const validatorModule = await connect(ValidatorModule__factory);
    const currentRegistry = await validatorModule.operatorRegistry();
    if (currentRegistry.toLowerCase() === ZeroAddress.toLowerCase()) {
      console.log("  Wiring OperatorRegistry → ValidatorModule...");
      await validatorModule.connect(govSigner).setOperatorRegistry(registry.target as string);
      // Grant CALLER role so ValidatorModule can call incrementActive/decrementActive
      await registry.connect(govSigner).grantCaller(validatorModuleAddress);
      console.log("  ValidatorModule wired ✓");
    } else {
      console.log("  ValidatorModule already wired to a registry:", currentRegistry);
    }
  } else {
    console.log("  ValidatorModule not deployed — skipping wire");
  }

  // ── Wire to DVTModule ───────────────────────────────────────────────────────
  const dvtModuleAddress = await address(DVTModule__factory);
  if (dvtModuleAddress) {
    const dvtModule = await connect(DVTModule__factory);
    const currentRegistry = await dvtModule.operatorRegistry();
    if (currentRegistry.toLowerCase() === ZeroAddress.toLowerCase()) {
      console.log("  Wiring OperatorRegistry → DVTModule...");
      await dvtModule.connect(govSigner).setOperatorRegistry(registry.target as string);
      await registry.connect(govSigner).grantCaller(dvtModuleAddress);
      console.log("  DVTModule wired ✓");
    } else {
      console.log("  DVTModule already wired to a registry:", currentRegistry);
    }
  } else {
    console.log("  DVTModule not deployed — skipping wire");
  }
};

export default func;
func.tags = ["modular-staking", "operator-registry"];
func.dependencies = ["governance", "validator-module", "dvt-module"];
