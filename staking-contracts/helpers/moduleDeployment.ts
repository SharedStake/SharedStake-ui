import type {HardhatRuntimeEnvironment} from "hardhat/types";
import type {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";
import type Ship from "../utils/ship";
import {MockBeaconDeposit__factory} from "../types";
import {isLocalNetwork} from "./governance";

// ── Governance signer helpers ──────────────────────────────────────────────────

/** Return the governance signer: multiSig if available, otherwise deployer. */
export function getGovernanceSigner(ship: Ship): SignerWithAddress {
  return ship.accounts.multiSig ?? ship.accounts.deployer;
}

/**
 * Assert that the resolved governance address matches the active governance signer.
 * Throws on mismatch to prevent partial-gov transactions on-chain.
 */
export function assertGovernanceSigner(ship: Ship, gov: string): void {
  const signer = getGovernanceSigner(ship);
  if (signer.address.toLowerCase() !== gov.toLowerCase()) {
    throw new Error(
      `Governance signer mismatch: signer=${signer.address} resolvedGov=${gov}. ` +
        "Set the governance env / config so the active signer matches the on-chain gov address.",
    );
  }
}

// ── Role helpers ───────────────────────────────────────────────────────────────

/** Grant NODE_OPERATOR role to nodeOperator on a ValidatorModule / DVTModule. Idempotent. */
export async function grantNodeOperatorRole(
  module: any,
  govSigner: SignerWithAddress,
  nodeOperator: string,
  name: string,
): Promise<void> {
  const NODE_OPERATOR: string = await module.NODE_OPERATOR();
  const hasRole: boolean = await module.hasRole(NODE_OPERATOR, nodeOperator);
  if (hasRole) {
    console.log(`  [${name}] NODE_OPERATOR already granted to ${nodeOperator}`);
    return;
  }
  console.log(`  [${name}] Granting NODE_OPERATOR to ${nodeOperator}...`);
  await module.connect(govSigner).grantRole(NODE_OPERATOR, nodeOperator);
}

// ── Mint cap ───────────────────────────────────────────────────────────────────

/**
 * Read mint cap from environment variables and convert to wei.
 * Returns 0n (unlimited) for local networks or when no env var is set.
 * Env values are in ETH (e.g. "1000" → 1 000 ETH).
 */
export function readMintCapWei(
  hre: HardhatRuntimeEnvironment,
  envKeys: string[],
  isLocal: boolean,
  label: string,
): bigint {
  if (isLocal) return 0n;
  for (const key of envKeys) {
    const val = process.env[key]?.trim();
    if (val) {
      const eth = parseFloat(val);
      if (isNaN(eth) || eth < 0) {
        throw new Error(`Invalid ${key}="${val}". Expected a non-negative number in ETH.`);
      }
      return hre.ethers.parseEther(val);
    }
  }
  console.log(`  [${label}] No mint cap configured (${envKeys.join(", ")}); using unlimited (0)`);
  return 0n;
}

// ── StakingRouter helpers ──────────────────────────────────────────────────────

/**
 * Allowlist a module's runtime code hash in StakingRouter. Idempotent.
 * Must be called before registerModule when enforceModuleCodeHashAllowlist == true.
 */
export async function allowlistModuleCodeHash(
  router: any,
  moduleType: string,
  codeHash: string,
  govSigner: SignerWithAddress,
  name: string,
): Promise<void> {
  const allowed: boolean = await router.moduleCodeHashAllowed(moduleType, codeHash);
  if (allowed) {
    console.log(`  [${name}] Code hash already allowlisted`);
    return;
  }
  console.log(`  [${name}] Allowlisting code hash ${codeHash.slice(0, 10)}...`);
  await router.connect(govSigner).setModuleCodeHashAllowed(moduleType, codeHash, true);
}

/**
 * Enable strict code-hash enforcement on StakingRouter. Idempotent.
 * Once enabled it cannot be disabled on-chain.
 */
export async function enableCodeHashAllowlistEnforcement(
  router: any,
  govSigner: SignerWithAddress,
): Promise<void> {
  const enforced: boolean = await router.enforceModuleCodeHashAllowlist();
  if (enforced) {
    console.log("  Code hash allowlist enforcement already enabled");
    return;
  }
  console.log("  Enabling code hash allowlist enforcement...");
  await router.connect(govSigner).enableCodeHashEnforcement();
}

/**
 * Register a module with StakingRouter (or skip if already registered).
 * Optionally sets it as the default module and verifies the registration.
 */
export async function registerOrUpdateModule(
  router: any,
  govSigner: SignerWithAddress,
  moduleId: string,
  moduleAddr: string,
  mintCapWei: bigint,
  name: string,
  opts: {setDefault?: boolean; verify?: boolean} = {},
): Promise<void> {
  // Check if already registered.
  const [existingAddr] = await router.modules(moduleId);
  if (existingAddr && existingAddr.toLowerCase() !== "0x0000000000000000000000000000000000000000") {
    if (existingAddr.toLowerCase() === moduleAddr.toLowerCase()) {
      console.log(`  [${name}] Already registered at ${existingAddr}`);
    } else {
      throw new Error(
        `[${name}] moduleId collision: already registered at ${existingAddr}, tried to register ${moduleAddr}`,
      );
    }
  } else {
    console.log(`  [${name}] Registering with StakingRouter...`);
    await router.connect(govSigner).registerModule(moduleId, moduleAddr, mintCapWei);
  }

  if (opts.setDefault) {
    const currentDefault: string = await router.defaultModuleId();
    if (currentDefault !== moduleId) {
      console.log(`  [${name}] Setting as default module...`);
      await router.connect(govSigner).setDefaultModule(moduleId);
    } else {
      console.log(`  [${name}] Already set as default module`);
    }
  }

  if (opts.verify) {
    const [verifyAddr] = await router.modules(moduleId);
    if (!verifyAddr || verifyAddr.toLowerCase() !== moduleAddr.toLowerCase()) {
      throw new Error(`[${name}] Post-registration verification failed: expected ${moduleAddr} got ${verifyAddr}`);
    }
    console.log(`  [${name}] Registration verified ✓`);
  }
}

// ── Beacon deposit ─────────────────────────────────────────────────────────────

const MAINNET_BEACON_DEPOSIT = "0x00000000219ab540356cBB839Cbe05303d7705Fa";
const HOLESKY_BEACON_DEPOSIT = "0x4242424242424242424242424242424242424242";

/**
 * Resolve the beacon-chain deposit contract address.
 * - mainnet / hoodi → canonical 0x00000000219ab540356cBB839Cbe05303d7705Fa
 * - holesky         → 0x4242424242424242424242424242424242424242
 * - hardhat / local → deploys MockBeaconDeposit on demand
 */
export async function resolveBeaconDeposit(hre: HardhatRuntimeEnvironment, ship: Ship): Promise<string> {
  const networkName = hre.network.name;

  if (!isLocalNetwork(hre)) {
    if (networkName === "holesky") return HOLESKY_BEACON_DEPOSIT;
    // mainnet, hoodi, and any other non-local network
    return MAINNET_BEACON_DEPOSIT;
  }

  // Local: deploy or reuse MockBeaconDeposit.
  const {deploy, accounts} = ship;
  const {contract: mock} = await deploy(MockBeaconDeposit__factory, {
    from: accounts.deployer,
    log: true,
  });
  return mock.target as string;
}

// ── Withdrawal credentials ─────────────────────────────────────────────────────

/**
 * Set expectedWithdrawalCredentials on a ValidatorModule / DVTModule.
 * Encodes the withdrawal queue address as ETH2 withdrawal credentials:
 *   0x01 00...00 <20-byte address>  (type 1 / BLS-to-execution-change format)
 *
 * Idempotent — skips if already set correctly.
 * Skipped on local networks (credentials are validated per-deposit; mocks accept any value).
 */
export async function wireWithdrawalCredentials(
  module: any,
  govSigner: SignerWithAddress,
  withdrawalQueueAddress: string,
): Promise<void> {
  // Encode: 0x01 + 11 zero bytes + 20-byte address → 32 bytes total
  const addrHex = withdrawalQueueAddress.replace(/^0x/i, "").toLowerCase().padStart(40, "0");
  const credentials = `0x010000000000000000000000${addrHex}` as `0x${string}`;

  const current: string = await module.expectedWithdrawalCredentials();
  if (current.toLowerCase() === credentials.toLowerCase()) {
    console.log(`  Withdrawal credentials already wired on ${module.target}`);
    return;
  }

  console.log(`  Setting withdrawal credentials → ${credentials} on ${module.target}...`);
  await module.connect(govSigner).setExpectedWithdrawalCredentials(credentials);
}
