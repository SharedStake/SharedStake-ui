import {isAddress, ZeroAddress} from "ethers";
import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../utils/ship";
import {OperatorRegistry__factory, ValidatorModule__factory} from "../types";
import type {OperatorRegistry} from "../types";
import {assertGovernanceSigner, getGovernanceSigner} from "../helpers/moduleDeployment";
import {isLocalNetwork, resolveGovernanceAddress} from "../helpers/governance";

const SGT_ADDRESS_ENV_KEYS = ["V2_SGT_ADDRESS"];
const NFT_ADDRESS_ENV_KEYS = ["NFT_CONTRACT_ADDRESS", "V2_OPERATOR_NFT_ADDRESS"];

function readConfiguredSgtAddress(): string | undefined {
  for (const key of SGT_ADDRESS_ENV_KEYS) {
    const val = process.env[key]?.trim();
    if (val) return val;
  }
  return undefined;
}

function readConfiguredNftAddress(): string | undefined {
  for (const key of NFT_ADDRESS_ENV_KEYS) {
    const val = process.env[key]?.trim();
    if (val) return val;
  }
  return undefined;
}

/**
 * Deploys OperatorRegistry and wires it to ValidatorModule.
 *
 * The registry is optional — modules fall back to role-based access when no
 * registry is set. This script is safe to run after 008_validatorModule and
 * 008_validatorModule has already been deployed.
 *
 * Default bond config (env-overridable):
 *   V2_OPERATOR_ETH_BOND_PER_SLOT  — ETH per slot (default: 1 ETH)
 *   V2_OPERATOR_SGT_BOND_PER_SLOT  — SGT per slot (default: 1000 SGT)
 *   V2_OPERATOR_MAX_SLOTS          — max slots per operator (default: 100)
 *
 * SGT token:
 *   local — reuses the SGTV2 MockERC20 deployed by 014_governance.ts
 *   other — V2_SGT_ADDRESS env var (mainnet: 0x84810bcF08744d5862B8181f12d17bfd57d3b078)
 */
const func: DeployFunction = async hre => {
  const ship = await Ship.init(hre);
  const {connect, accounts, address, hre: hardhat} = ship;
  const isLocal = isLocalNetwork(hre);

  const gov = await resolveGovernanceAddress(hre, ship);
  const govSigner = getGovernanceSigner(ship);
  assertGovernanceSigner(ship, gov);

  // ── SGT token ───────────────────────────────────────────────────────────────
  let sgtAddress: string;
  if (isLocal) {
    const localSgt = await address("SGTV2");
    if (!localSgt) throw new Error("SGTV2 not deployed — run 014_governance first");
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
  const nftSgtCredit = hre.ethers.parseEther(process.env.V2_OPERATOR_NFT_SGT_CREDIT ?? "100");
  const maxSlots = BigInt(process.env.V2_OPERATOR_MAX_SLOTS ?? "100");
  const DEFAULT_CONFIG = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("default"));

  // ── Deploy (UUPS proxy, idempotent) ─────────────────────────────────────────
  const existingReg = await hre.deployments.getOrNull("OperatorRegistry");

  let proxyAddress: string;
  if (existingReg) {
    console.log("  OperatorRegistry already deployed at:", existingReg.address);
    proxyAddress = existingReg.address;
  } else {
    const Factory = await hre.ethers.getContractFactory("OperatorRegistry", accounts.deployer);
    const proxy = await hre.upgrades.deployProxy(Factory, [sgtAddress, gov], {
      kind: "uups",
      initializer: "initialize",
    });
    await proxy.waitForDeployment();
    proxyAddress = await proxy.getAddress();

    const artifact = await hre.artifacts.readArtifact("OperatorRegistry");
    await hre.deployments.save("OperatorRegistry", {
      address: proxyAddress,
      abi: artifact.abi,
      transactionHash: proxy.deploymentTransaction()?.hash,
    });
    console.log("  OperatorRegistry deployed (UUPS proxy) at:", proxyAddress);
  }

  const registry: OperatorRegistry = OperatorRegistry__factory.connect(proxyAddress, accounts.deployer);

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

  // ── Optional SharedStake NFT credit ─────────────────────────────────────────
  const configuredNft = readConfiguredNftAddress();
  if (configuredNft) {
    if (!isAddress(configuredNft) || configuredNft.toLowerCase() === ZeroAddress.toLowerCase()) {
      throw new Error(
        `Invalid NFT contract address. Set one of ${NFT_ADDRESS_ENV_KEYS.join(", ")} to a deployed ERC-721.`,
      );
    }

    const registryAny = registry as any;
    const currentNft = await registryAny.nftContract();
    const currentCredit = await registryAny.nftSgtCredit();
    if (currentNft.toLowerCase() !== configuredNft.toLowerCase() || currentCredit !== nftSgtCredit) {
      console.log(`  Configuring NFT credit: ${configuredNft} -> ${hre.ethers.formatEther(nftSgtCredit)} SGT`);
      await registryAny.connect(govSigner).setNftContract(configuredNft, nftSgtCredit);
    } else {
      console.log("  NFT credit already configured");
    }
  }

  // ── Wire to ValidatorModule ─────────────────────────────────────────────────
  const validatorModuleAddress = await address(ValidatorModule__factory);
  if (validatorModuleAddress) {
    const validatorModule = await connect(ValidatorModule__factory);
    const currentRegistry = await validatorModule.operatorRegistry();
    if (currentRegistry.toLowerCase() === ZeroAddress.toLowerCase()) {
      console.log("  Wiring OperatorRegistry → ValidatorModule...");
      await validatorModule.connect(govSigner).setOperatorRegistry(proxyAddress);
      // Grant CALLER role so ValidatorModule can call incrementActive/decrementActive
      await registry.connect(govSigner).grantCaller(validatorModuleAddress);
      console.log("  ValidatorModule wired ✓");
    } else {
      console.log("  ValidatorModule already wired to a registry:", currentRegistry);
    }
  } else {
    console.log("  ValidatorModule not deployed — skipping wire");
  }

  // DVTModule wiring deferred to feat/dvt-module (PR 381)
};

export default func;
func.tags = ["modular-staking", "operator-registry"];
func.dependencies = ["governance", "validator-module", "dvt-module"];
