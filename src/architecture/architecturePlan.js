export const architectureMeta = {
  title: "SharedStake V2 Modular Staking — Architecture",
  subtitle:
    "Non-upgradeable, module-composable staking protocol. StakingRouter coordinates validator modules, fee distribution, and on-chain governance.",
  updatedAt: "2026-05-15",
  sources: [
    "https://docs.sharedstake.finance/sharedstake-v2.md",
    "https://docs.sharedstake.finance/sharedstake-v2/key-changes-over-v1.md",
    "https://docs.sharedstake.finance/sharedstake-v2/shareddeposit-v2-architecture.md",
  ],
  localDocs: [
    "docs/modular-staking/UPGRADE_PATH.md",
    "src/architecture/MODULAR_STAKING_ARCHITECTURE.md",
    "SharedDeposit/contracts/v2/modular-staking/",
    "SharedDeposit/test/v2/modular-staking/",
  ],
};

export const coreArchitecture = [
  {
    title: "StakingRouter",
    points: [
      "Central coordinator: receives ETH from users, routes to modules.",
      "Owns the MINTER role on StToken — only contract that mints/burns shares.",
      "Tracks per-module beacon balances; triggers StToken rebases on oracle reports.",
      "Enforces per-module inflow limits, pause state, and sanity caps on oracle deltas.",
    ],
  },
  {
    title: "ValidatorModule / DVTModule",
    points: [
      "ValidatorModule: single-operator 32-ETH validator path with withdrawal credential enforcement.",
      "DVTModule extends ValidatorModule with an on-chain cluster registry for Distributed Validator Technology.",
      "Both share _doBeaconDeposit() with pubkey deduplication and withdrawal-cred validation.",
      "Paused independently; oracle reports blocked while paused.",
    ],
  },
  {
    title: "FeeController",
    points: [
      "Configures treasury/operator fee split and the referral registry address.",
      "Called by StakingRouter on each reward distribution; mints fee shares to treasury/operator.",
      "Referral tracking via MasterChef-style ReferralRegistry.",
    ],
  },
  {
    title: "Governance Stack",
    points: [
      "VoteEscrowV2: lock SGT → veSGT for voting weight; 30% penalty on emergency withdraw.",
      "GovernanceTimelock: 48h delay on all parameter changes.",
      "SharedStakeGovernor: OZ Governor wired to veSGT + Timelock.",
      "VoteEscrowV2.gov must be the Timelock — penalty rate changes require a full governance vote.",
    ],
  },
  {
    title: "WithdrawalQueueV2",
    points: [
      "Users request withdrawals; GOV finalizes batches with ETH from operator exits.",
      "Bunker mode adds minimum age and batch-size guards during validator churn events.",
      "Used as the exit path during Router-to-Router migrations.",
    ],
  },
  {
    title: "MigrationHelper",
    points: [
      "Signal-only contract — holds no funds, moves no funds.",
      "GOV announces a new router; 14-day notice clock starts.",
      "activateMigration() sets migrationActive = true (front-ends redirect to newRouter).",
      "Activated state is terminal; cancelMigration() only works before activation.",
    ],
  },
  {
    title: "StTokenERC4626Wrapper",
    points: [
      "ERC-4626 compliant vault wrapping the rebasing stToken into a non-rebasing vault token.",
      "Enables DeFi composability: Aave, Compound, Pendle, and other yield protocols.",
      "asset = stToken shares; vault share appreciates as protocol accrues staking rewards.",
      "Withdrawal returns stToken shares synchronously; convert to ETH via WithdrawalQueueV2.",
    ],
  },
];

export const phaseRoadmap = [
  {
    phase: "Phase 1 — DONE",
    name: "Modular Core",
    additions: [
      "StakingRouter + StToken + ValidatorModule deployed and tested.",
      "FeeController with treasury/operator/referral routing.",
      "WithdrawalQueueV2 with bunker mode.",
      "6-pass internal security audit complete; all CRITICAL/HIGH fixed.",
    ],
  },
  {
    phase: "Phase 2 — DONE",
    name: "DVT + Governance",
    additions: [
      "DVTModule: on-chain cluster registry, depositToBeaconChainInCluster.",
      "VoteEscrowV2 + GovernanceTimelock + SharedStakeGovernor deployed.",
      "MigrationHelper: 14-day-notice migration coordination contract.",
      "307 Hardhat + 22 keeper unit + 13 ERC-4626 + 7 Foundry invariant tests; 20 Playwright E2E tests.",
    ],
  },
  {
    phase: "Phase 3 — PENDING",
    name: "Mainnet Deployment",
    additions: [
      "Set expectedWithdrawalCredentials on all ValidatorModule instances.",
      "Transfer GOV + DEFAULT_ADMIN_ROLE to GovernanceTimelock.",
      "External human security audit of full V2 surface.",
    ],
  },
  {
    phase: "Phase 4",
    name: "Operator Decentralization",
    additions: [
      "Permissionless operator onboarding (ERC-6551 + SGT gating).",
      "Operator performance guards and exit-event handling.",
      "Additional DVT cluster operators beyond core team.",
    ],
  },
  {
    phase: "Phase 5",
    name: "Multi-Chain",
    additions: [
      "Minter extension to additional L1/L2 environments.",
      "Cross-domain accounting for sgETH mint paths.",
      "Chain-by-chain rollout with independent risk limits.",
    ],
  },
];

export const contractV1Readiness = [
  {
    status: "done",
    title: "Core contracts + test suite",
    goal: "Production-ready non-upgradeable contracts with full test coverage.",
    currentState:
      "342 Hardhat/keeper/ERC-4626 + 7 Foundry invariant tests green. Fork tests cover fee distribution, withdrawal queue, governance params, and DVT credential enforcement.",
    nextStep: "External human audit before mainnet.",
    tasks: [
      "StakingRouter, ValidatorModule, DVTModule, FeeController, WithdrawalQueueV2.",
      "MigrationHelper coordination contract.",
      "VoteEscrowV2 + GovernanceTimelock + SharedStakeGovernor.",
    ],
  },
  {
    status: "done",
    title: "Security audit (6 passes)",
    goal: "No unaddressed CRITICAL/HIGH findings before mainnet.",
    currentState:
      "6 internal audit passes complete. All CRITICAL/HIGH fixed. 4 MEDIUM findings accepted by design (documented with rationale). DVTM-04 accepted.",
    nextStep: "External paid human audit.",
    tasks: [
      "Pass 1-2: 15 findings fixed.",
      "Pass 3: No CRITICAL/HIGH; 3 MEDIUM accepted, 4 LOW/INFO fixed.",
      "Pass 4 (DVT): DVTM-01/02/03 fixed; DVTM-04 accepted by design.",
      "Pass 5: All candidates below threshold.",
      "Pass 6: LSTWrapModule oracle order + missing unwrapLST guard fixed.",
    ],
  },
  {
    status: "done",
    title: "Governance wiring",
    goal: "All privileged parameter paths gated behind 48h governance delay.",
    currentState:
      "VoteEscrowV2.gov = GovernanceTimelock. Deployer admin role renounced. Governor has PROPOSER + CANCELLER roles. Deploy script asserts gov transfer.",
    nextStep: "Transfer StakingRouter GOV + DEFAULT_ADMIN_ROLE to Timelock on mainnet.",
    tasks: [
      "013_governance.ts: deploys and wires all governance contracts.",
      "Hard assertion: veGov == timelock.target post-deploy.",
      "Docs: docs/modular-staking/UPGRADE_PATH.md.",
    ],
  },
  {
    status: "in_progress",
    title: "Mainnet pre-deployment checklist",
    goal: "Ops and governance tasks before mainnet launch.",
    currentState:
      "Code complete. Three ops/governance tasks remain (not code changes).",
    nextStep: "Complete all three pre-mainnet blockers.",
    tasks: [
      "Set expectedWithdrawalCredentials on all ValidatorModule instances.",
      "Transfer GOV + DEFAULT_ADMIN_ROLE to GovernanceTimelock.",
      "Complete external human security audit.",
    ],
  },
  {
    status: "todo",
    title: "Deployment reproducibility",
    goal: "Deterministic release manifest with addresses, constructor args, and verification links.",
    currentState:
      "Deploy scripts exist (001-013 in deploy/v2-modular-staking/). Manifests not yet published per-network.",
    nextStep: "Create per-network release manifest and publish bytecode verification.",
    tasks: [
      "Pin compiler version, optimizer settings, and expected bytecode hashes.",
      "Document per-network params and governance addresses.",
      "Publish verification checklist for Etherscan and downstream integrators.",
    ],
  },
  {
    status: "todo",
    title: "Operational runbooks",
    goal: "Playbooks for pause/unpause, validator exits, and queue incidents.",
    currentState:
      "Pause controls and queue finalization are in contracts. Operator runbooks not yet written.",
    nextStep: "Write and rehearse incident runbooks before mainnet.",
    tasks: [
      "Pause/unpause, slash handling, withdrawal queue backlog.",
      "SLOs for reward sync cadence and withdrawal processing.",
      "On-call and escalation paths for governance/operators.",
    ],
  },
];

export const governanceModel = [
  {
    title: "VoteEscrowV2",
    points: [
      "Lock SGT for 7–730 days to receive veSGT voting weight.",
      "Voting weight decays linearly to zero at lock expiry.",
      "emergencyWithdraw() available before expiry with 30% SGT penalty.",
      "gov address = GovernanceTimelock; penalty rate changes require governance vote.",
    ],
  },
  {
    title: "GovernanceTimelock",
    points: [
      "48h delay (1s on hardhat for test speed).",
      "Governor has PROPOSER + CANCELLER roles.",
      "address(0) executor — anyone can execute once delay has passed.",
      "Deployer DEFAULT_ADMIN_ROLE renounced post-deploy (self-governing).",
    ],
  },
  {
    title: "SharedStakeGovernor",
    points: [
      "OZ Governor with veSGT as voting token.",
      "Proposals require a voting period + quorum threshold.",
      "Passed proposals execute via GovernanceTimelock.",
      "All StakingRouter / FeeController / VoteEscrowV2 param changes go through here.",
    ],
  },
];

export const upgradePath = [
  {
    title: "Minor: Parameter Change",
    points: [
      "No migration needed.",
      "Governance proposal → Timelock 48h delay → execute.",
      "Examples: fee bps, inflow limits, oracle delta caps.",
    ],
  },
  {
    title: "Module Upgrade",
    points: [
      "Deploy new module (e.g. DVTModuleV2).",
      "Governance registerModule on StakingRouter with new module address.",
      "Governance deregisterModule for old module once funds are moved.",
      "No user action required.",
    ],
  },
  {
    title: "Router Migration (Full)",
    points: [
      "Deploy new StakingRouter.",
      "GOV calls MigrationHelper.announceMigration(newRouter) — 14-day notice starts.",
      "Users withdraw via WithdrawalQueueV2 during voluntary exit window.",
      "After 14 days: GOV calls activateMigration(); front-ends redirect to newRouter.",
      "migrationActive = true is terminal; cannot be rolled back.",
    ],
  },
  {
    title: "Emergency Path",
    points: [
      "GUARDIAN pauses deposits on old router immediately.",
      "Governance votes to fast-track: cancelMigration() + fresh announceMigration with shorter notice.",
      "MigrationHelper does not enforce an early activation path by design.",
    ],
  },
];

export const releaseTracks = [
  {
    milestone: "Code Complete (NOW)",
    criteria: [
      "342 Hardhat/keeper/ERC-4626 + 7 Foundry tests green.",
      "6-pass internal audit complete; no unaddressed CRITICAL/HIGH.",
      "Fork tests: fee distribution, withdrawal queue, governance params, DVT credentials.",
      "20 Playwright E2E tests passing.",
    ],
  },
  {
    milestone: "Mainnet Ready",
    criteria: [
      "External human audit complete and findings resolved.",
      "expectedWithdrawalCredentials set on all ValidatorModule instances.",
      "GOV + DEFAULT_ADMIN_ROLE transferred to GovernanceTimelock.",
    ],
  },
  {
    milestone: "Mainnet V1",
    criteria: [
      "Deployment reproducibility checklist completed.",
      "Operational runbooks written and rehearsed.",
      "Emergency response drills completed.",
    ],
  },
];
