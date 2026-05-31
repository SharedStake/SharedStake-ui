import {DeployFunction} from "hardhat-deploy/types";
import Ship from "../utils/ship";
import {
  GovernanceTimelock__factory,
  SharedStakeGovernor__factory,
  VoteEscrowV2__factory,
  MockERC20__factory,
} from "../types";
import {resolveGovernanceAddress} from "../helpers/governance";
import {isAddress, ZeroAddress} from "ethers";

const SGT_ADDRESS_ENV_KEYS = ["V2_SGT_ADDRESS"];

function readConfiguredSgtAddress(): string | undefined {
  for (const key of SGT_ADDRESS_ENV_KEYS) {
    const value = process.env[key];
    if (!value || value.trim().length === 0) continue;
    return value.trim();
  }
  return undefined;
}

/**
 * Deploys the SharedStake V2 governance stack:
 *   1. MockERC20  — stand-in SGT token (local/hardhat only; production uses real SGT)
 *   2. VoteEscrowV2  — vote-escrow wrapper that converts SGT → veSGT
 *   3. GovernanceTimelock  — 48h timelock (1s on hardhat for test speed)
 *   4. SharedStakeGovernor — OZ Governor wired to veSGT + Timelock
 *
 * Wiring:
 *   - Governor is granted PROPOSER + EXECUTOR roles on Timelock
 *   - Governance multisig is granted EXECUTOR + CANCELLER roles on Timelock
 *   - Deployer's admin role on Timelock is renounced (Timelock becomes self-governing)
 *   - VoteEscrowV2.gov is transferred to GovernanceTimelock so penalty parameter
 *     changes require a full governance vote + 48h delay
 */
const func: DeployFunction = async hre => {
  const ship = await Ship.init(hre);
  const {deploy, accounts} = ship;
  const gov = await resolveGovernanceAddress(hre, ship);
  const govSigner = accounts.multiSig ?? accounts.deployer;
  if (govSigner.address.toLowerCase() !== gov.toLowerCase()) {
    throw new Error(
      `Governance signer mismatch: signer=${govSigner.address} resolvedGov=${gov}. ` +
      "Set governance env/config so the signer that executes transferGov is the current gov."
    );
  }

  const isLocal = hre.network.tags.hardhat || hre.network.name === "localhost";

  // ── 1. SGT token ────────────────────────────────────────────────────────────
  // On local/hardhat: deploy a mintable MockERC20.
  // On real networks: expect SGTV2 to already be deployed (skip here).
  let sgtAddress: string;
  if (isLocal) {
    const {contract: mockSGT} = await deploy(MockERC20__factory, {
      aliasName: "SGTV2",
      from: accounts.deployer,
      args: ["SharedStake Governance Token", "SGT"],
      log: true,
    });
    sgtAddress = mockSGT.target as string;
    console.log("  Deployed MockERC20 as SGTV2:", sgtAddress);
  } else {
    const configured = readConfiguredSgtAddress();
    if (!configured || !isAddress(configured) || configured.toLowerCase() === ZeroAddress.toLowerCase()) {
      throw new Error(
        `Missing valid SGT address for non-local deployment. Set one of ${SGT_ADDRESS_ENV_KEYS.join(", ")}.`,
      );
    }
    sgtAddress = configured;
    console.log("  Using existing SGTV2:", sgtAddress);
  }

  // ── 2. VoteEscrowV2 ─────────────────────────────────────────────────────────
  const minLocked = hre.ethers.parseEther("1"); // 1 SGT minimum lock
  const {contract: voteEscrow} = await deploy(VoteEscrowV2__factory, {
    from: accounts.deployer,
    args: ["Vote Escrowed SGT", "veSGT", sgtAddress, minLocked, gov],
    log: true,
  });
  console.log("  VoteEscrowV2 deployed:", voteEscrow.target);

  // ── 3. GovernanceTimelock ───────────────────────────────────────────────────
  // minDelay: 1 second on local (fast tests), 7 days on mainnet for conservative safety
  // Set to 7 days for mainnet — covers both ops and high-blast-radius actions conservatively
  const timelockDelay = isLocal ? 1n : 7n * 24n * 3600n;
  const proposers: string[] = [];  // set after Governor deployment
  const executors: string[] = [];  // set after Governor deployment
  const admin = accounts.deployer.address;   // renounced after wiring

  const {contract: timelock} = await deploy(GovernanceTimelock__factory, {
    from: accounts.deployer,
    args: [timelockDelay, proposers, executors, admin],
    log: true,
  });
  console.log("  GovernanceTimelock deployed:", timelock.target);

  // ── 4. SharedStakeGovernor ──────────────────────────────────────────────────
  const {contract: governor} = await deploy(SharedStakeGovernor__factory, {
    from: accounts.deployer,
    args: [voteEscrow.target, timelock.target],
    log: true,
  });
  console.log("  SharedStakeGovernor deployed:", governor.target);

  // ── Wire governance roles ───────────────────────────────────────────────────
  const PROPOSER_ROLE = await timelock.connect(accounts.deployer).PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.connect(accounts.deployer).EXECUTOR_ROLE();
  const CANCELLER_ROLE = await timelock.connect(accounts.deployer).CANCELLER_ROLE();
  const DEFAULT_ADMIN_ROLE = await timelock.connect(accounts.deployer).DEFAULT_ADMIN_ROLE();

  console.log("  Granting PROPOSER to Governor...");
  await timelock.connect(accounts.deployer).grantRole(PROPOSER_ROLE, governor.target);

  console.log("  Granting EXECUTOR to Governor...");
  await timelock.connect(accounts.deployer).grantRole(EXECUTOR_ROLE, governor.target);

  console.log(`  Granting EXECUTOR to governance signer (${gov})...`);
  await timelock.connect(accounts.deployer).grantRole(EXECUTOR_ROLE, gov);

  console.log(`  Granting CANCELLER to governance signer (${gov})...`);
  await timelock.connect(accounts.deployer).grantRole(CANCELLER_ROLE, gov);

  console.log("  Revoking deployer DEFAULT_ADMIN_ROLE on Timelock...");
  await timelock.connect(accounts.deployer).renounceRole(DEFAULT_ADMIN_ROLE, accounts.deployer.address);

  // ── Transfer VoteEscrowV2.gov to Timelock ──────────────────────────────────
  // Security requirement: penalty rate and collector changes must go through
  // the 48h governance delay, not a single EOA key.
  console.log("  Transferring VoteEscrowV2.gov to GovernanceTimelock...");
  await voteEscrow.connect(govSigner).transferGov(timelock.target as string);
  const veGov = await voteEscrow.gov();
  if (veGov.toLowerCase() !== (timelock.target as string).toLowerCase()) {
    throw new Error(`VoteEscrowV2.gov assertion failed: got ${veGov}, expected ${timelock.target}`);
  }
  console.log("  VoteEscrowV2.gov verified as GovernanceTimelock.");

  console.log("  Governance stack fully wired.");
};

export default func;
func.tags = ["modular-staking", "governance"];
func.dependencies = [];
