export const architectureMeta = {
  title: "SharedStake V3 Modular Staking Architecture",
  subtitle:
    "Router-first staking architecture, governed module rollout, and contract-readiness execution",
  updatedAt: "2026-06-07",
  sources: [
    "https://docs.sharedstake.finance/sharedstake-v2.md",
    "https://docs.sharedstake.finance/sharedstake-v2/key-changes-over-v1.md",
    "https://docs.sharedstake.finance/sharedstake-v2/phased-launch.md",
    "https://docs.sharedstake.finance/sharedstake-v2/shareddeposit-v2-architecture.md",
  ],
  localDocs: [
    "docs/modular-staking/architecture.md",
    "docs/modular-staking/diagrams.md",
    "docs/modular-staking/DEPLOYMENT_GUIDE.md",
    "docs/modular-staking/UPGRADE_PATH.md",
    "docs/modular-staking/AUDIT_WORKFLOW.md",
    "staking-contracts/contracts/v2/modular-staking/StakingRouter.sol",
    "staking-contracts/contracts/v2/modular-staking/modules/ValidatorModule.sol",
    "staking-contracts/contracts/v2/modular-staking/modules/LSTWrapModule.sol",
    "staking-contracts/contracts/v2/governance/VoteEscrowV2.sol",
    "staking-contracts/contracts/v2/governance/SharedStakeGovernor.sol",
    "staking-contracts/contracts/v2/governance/GovernanceTimelock.sol",
    "staking-contracts/contracts/v2/modular-staking/DebtPool.sol",
    "staking-contracts/contracts/v2/modular-staking/OldVeth2WithdrawalQueue.sol",
  ],
};

export const coreArchitecture = [
  {
    title: "Router + Accounting Plane",
    points: [
      "StakingRouter is the canonical staking entrypoint and pooled-accounting coordinator.",
      "StToken tracks rebasing share ownership; WstToken provides non-rebasing wrapped exposure.",
      "WithdrawalQueueV2 burns shares at request time and settles finalized ETH claims.",
    ],
  },
  {
    title: "Execution Modules",
    points: [
      "ValidatorModule handles solo-validator ETH flow behind the router.",
      "Planned DVTModule support extends validator flow with cluster-attributed deposits and DVT controls; contract deployment and UI activation are deferred to the DVT follow-up PR.",
      "LSTWrapModule accepts oracle-priced LST exposure and mints/burns through router callbacks.",
    ],
  },
  {
    title: "Control Plane",
    points: [
      "VoteEscrowV2 turns locked SGT into non-transferable veSGT with four-year max locks and linear decay.",
      "SharedStakeGovernor and GovernanceTimelock own registration, caps, default routing, policy assignment, and unpause actions through GOV roles.",
      "GUARDIAN can pause globally or per-module for fast incident response while GOV-only unpause preserves reviewability.",
      "Code-hash allowlisting, inflow windows, mint caps, policy registries, and veSGT lock metrics bound module risk.",
    ],
  },
];

export const phaseRoadmap = [
  {
    phase: "Phase 0",
    name: "Local Contract Migration",
    additions: [
      "All Solidity sources live under staking-contracts with no tracked submodules.",
      "Duplicate contract copies and stale import paths are removed.",
      "Contract audit workflow runs dependency audit, lint, compile, Hardhat tests, Foundry invariants, and Slither.",
    ],
  },
  {
    phase: "Phase 1",
    name: "Dark Module Deployment",
    additions: [
      "Deploy router, token, queue, fee, oracle, and module contracts with verified addresses.",
      "Register modules with conservative caps and keep risky inflow paths paused until governance enables them.",
      "Wire withdrawal credentials, keepers, oracle submitters, and governance handover before user-facing launch.",
    ],
  },
  {
    phase: "Phase 2",
    name: "Governed Activation",
    additions: [
      "Use veSGT-backed Governor/Timelock proposals to raise caps, unpause modules, and set default routing.",
      "Roll out validator, DVT, and LST modules independently with telemetry-based risk budgets.",
      "Keep GUARDIAN-only pause and GOV-only unpause separation intact.",
    ],
  },
  {
    phase: "Phase 3",
    name: "Operational Expansion",
    additions: [
      "Expand operator registry capacity, NFT bond credit policy, and DVT cluster onboarding.",
      "Tune inflow windows, oracle cadence, and withdrawal finalization based on production telemetry.",
      "Publish release manifests and external audit results before mainnet promotion.",
    ],
  },
];

export const contractV1Readiness = [
  {
    status: "done",
    title: "Local contract migration",
    goal: "Keep every production Solidity source local to staking-contracts and out of submodules.",
    currentState:
      "PR 379 has no tracked gitlinks, no Solidity files outside staking-contracts, and no duplicate production Solidity basenames or exact duplicate Solidity blobs.",
    nextStep:
      "Keep the layout checks in docs/modular-staking/AUDIT_WORKFLOW.md and .github/workflows/audit.yml green for every follow-up.",
    tasks: [
      "Run gitlink, outside-contract, duplicate-source, and conflict-marker checks before merge.",
      "Keep Foundry dependencies materialized through the ignored lib/forge-std path only.",
      "Do not reintroduce contract copies under frontend or legacy submodule paths.",
    ],
  },
  {
    status: "done",
    title: "Automated audit gates",
    goal: "Make contract safety checks repeatable locally and in GitHub Actions.",
    currentState:
      "Local gates pass for dependency audit, Solidity lint, Hardhat compile, modular Hardhat tests, Foundry invariants, frontend type-check, frontend build, and local modular deployment. Slither is required in the Contract Audit workflow and is recorded as local residual risk when unavailable.",
    nextStep:
      "Keep moderate-or-higher dependency advisories blocked, rerun Slither where installed or in CI, and treat Slither regressions as review findings.",
    tasks: [
      "Run npm audit --audit-level=moderate inside staking-contracts.",
      "Run npx hardhat test test/v2/modular-staking/*.spec.ts before contract changes land.",
      "Run npm run setup:foundry and npm run test:invariants on clean machines.",
    ],
  },
  {
    status: "in_progress",
    title: "Deployment readiness",
    goal: "Prepare the dark-launch deployment path without accidentally opening module inflows.",
    currentState:
      "Deployment scripts deploy and register modules; local networks default enabled for integration testing, while non-local deployments default to paused dark-launch state unless explicitly overridden.",
    nextStep:
      "Add explicit deployment controls for dark-launching modules with paused state and conservative caps, then activate with Governor/Timelock proposals.",
    tasks: [
      "Populate src/contracts/addresses after verified testnet/mainnet deployment.",
      "Set expectedWithdrawalCredentials before validator deposits.",
      "Document each module default, cap, inflow window, and pause state in the deployment manifest.",
    ],
  },
  {
    status: "in_progress",
    title: "Governance activation",
    goal: "Enable modules only through auditable governance actions after observation gates clear.",
    currentState:
      "StakingRouter exposes GOV-only setMintCap, setModuleInflowLimit, setDefaultModule, and unpauseModule; GUARDIAN can pause modules immediately.",
    nextStep:
      "Prepare proposal payload templates for staged module activation and cap increases, and require checkpointed veSGT before snapshots.",
    tasks: [
      "Queue setMintCap and setModuleInflowLimit before unpauseModule.",
      "Keep setDefaultModule separate from module deployment unless default traffic should start immediately.",
      "Use guardian pause drills before enabling mainnet user flow.",
    ],
  },
];

export const architectureDiagrams = [
  {
    title: "Router-First Component Map",
    summary:
      "Users enter through StakingRouter; modules execute asset-specific flows; StToken/WstToken and WithdrawalQueueV2 hold user accounting.",
    groups: [
      {
        label: "User Surface",
        nodes: ["Stake UI", "Wrap UI", "Withdraw UI", "Governance UI"],
      },
      {
        label: "Router Plane",
        nodes: [
          "StakingRouter",
          "FeeController",
          "InstitutionalPolicyRegistry",
        ],
      },
      {
        label: "Modules",
        nodes: ["ValidatorModule", "Planned DVTModule", "LSTWrapModule"],
      },
      {
        label: "Accounting",
        nodes: ["StToken", "WstToken", "WithdrawalQueueV2"],
      },
      {
        label: "Operations",
        nodes: [
          "OracleAdapter",
          "QuorumOracleAdapter",
          "OperatorRegistry",
          "Keepers",
        ],
      },
    ],
    flows: [
      "Submit ETH -> StakingRouter -> selected validator module -> StToken shares",
      "Wrap LST -> LSTWrapModule -> StakingRouter callback -> StToken shares",
      "Request exit -> WithdrawalQueueV2 burns shares -> guardian finalizes ETH -> user claims",
      "Oracle report -> module validates -> router updates pooled ETH and fee shares",
    ],
  },
  {
    title: "Deposit, Report, Rebase Flow",
    summary:
      "Deposits mint shares immediately; beacon/LST reports later update pooled value and route protocol/operator/referral fees.",
    groups: [
      { label: "Deposit", nodes: ["User", "submitToModule", "receiveDeposit"] },
      {
        label: "Mint",
        nodes: ["StakingRouter", "StToken.mintShares", "User shares"],
      },
      {
        label: "Report",
        nodes: [
          "OracleAdapter",
          "ValidatorModule.reportBeacon",
          "Router pooled update",
        ],
      },
      {
        label: "Fees",
        nodes: ["FeeController", "Treasury shares", "Operator shares"],
      },
    ],
    flows: [
      "User ETH is routed to the selected module and priced into shares.",
      "Module reports cannot exceed configured drift/slash sanity bounds.",
      "Fee accounting changes share ownership, not direct user ETH balances.",
    ],
  },
  {
    title: "Vote-Escrow Governance Stack",
    summary:
      "SGT lockers receive non-transferable veSGT that decays over a four-year max lock; Governor snapshots checkpointed veSGT and executes through Timelock.",
    groups: [
      {
        label: "Lock",
        nodes: ["SGT", "VoteEscrowV2", "veSGT"],
      },
      {
        label: "Measure",
        nodes: ["getLockStats", "globalLockStats", "checkpointMany"],
      },
      {
        label: "Govern",
        nodes: [
          "SharedStakeGovernor",
          "GovernanceTimelock",
          "Protocol GOV roles",
        ],
      },
      {
        label: "Modules",
        nodes: [
          "setMintCap",
          "setModuleInflowLimit",
          "unpauseModule",
          "setDefaultModule",
        ],
      },
    ],
    flows: [
      "Longer SGT locks create more initial veSGT; voting power decays linearly until lock expiry.",
      "Users or keepers checkpoint locks before proposal snapshots to align ERC20Votes checkpoints with projected ve power.",
      "Executed proposals move through Timelock before touching router caps, inflow windows, pause state, or default routing.",
    ],
  },
  {
    title: "Dark Launch Governance Path",
    summary:
      "Modules can be deployed and registered before user traffic, then activated later through timelocked governance actions.",
    groups: [
      {
        label: "Deploy",
        nodes: ["Deploy module", "Allowlist code hash", "Register module"],
      },
      {
        label: "Keep Off",
        nodes: ["pauseModule", "bounded cap", "not default route"],
      },
      {
        label: "Vote",
        nodes: ["Governor propose", "Timelock delay", "Execute"],
      },
      {
        label: "Enable",
        nodes: [
          "setMintCap",
          "setModuleInflowLimit",
          "unpauseModule",
          "setDefaultModule",
        ],
      },
    ],
    flows: [
      "GUARDIAN can pause immediately; GOV must unpause through the governed path.",
      "GOV can raise caps and make a module default only after proposal execution.",
      "Each module can be activated independently after monitoring and audit gates clear.",
    ],
  },
];

export const governedRollout = [
  {
    stage: "Deploy Off",
    owner: "Deployer + governance signer",
    controls: [
      "Deploy modules and verify bytecode.",
      "Allowlist runtime code hashes before registration.",
      "Register modules with conservative mint caps; do not use cap 0 as an off switch because cap 0 means unlimited.",
      "Pause modules immediately when they should remain dark after deployment.",
    ],
  },
  {
    stage: "Observe",
    owner: "Ops + guardian",
    controls: [
      "Confirm withdrawal credentials and keeper env are set.",
      "Confirm oracle submitters, quorum, and monitoring are live.",
      "Keep default routing pointed only at the approved launch module.",
    ],
  },
  {
    stage: "Govern On",
    owner: "Governor/Timelock",
    controls: [
      "Execute setMintCap and setModuleInflowLimit with bounded risk budgets.",
      "Execute unpauseModule for the target module.",
      "Execute setDefaultModule only after the module is intended to receive default submit() flow.",
    ],
  },
];

export const releaseTracks = [
  {
    milestone: "PR 379 Code Complete",
    criteria: [
      "No tracked submodule contract sources or duplicate production Solidity copies.",
      "Root CI and Contract Audit workflow are green on the PR head.",
      "Architecture docs and frontend ArchitectureHub point at the same router-first model.",
    ],
  },
  {
    milestone: "Testnet Dark Launch",
    criteria: [
      "Contracts deployed, verified, and addresses populated in src/contracts/addresses/.",
      "Modules deployed with risk caps, pause/default state intentionally documented, and keepers configured.",
      "Governance handover to timelock is verified by deployment script and manifest checks.",
    ],
  },
  {
    milestone: "Governed Activation",
    criteria: [
      "Governor proposal enables each module only after monitoring and audit gates clear.",
      "Initial caps and inflow windows are low enough for rollback through GUARDIAN pause.",
      "External audit findings are closed or explicitly accepted before mainnet activation.",
    ],
  },
];
