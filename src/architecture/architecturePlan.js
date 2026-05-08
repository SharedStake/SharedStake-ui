export const architectureMeta = {
  title: "SharedStake Architecture Workspace",
  subtitle: "Working draft for v2 evolution and contract-readiness execution",
  updatedAt: "2026-05-06",
  sources: [
    "https://docs.sharedstake.finance/sharedstake-v2.md",
    "https://docs.sharedstake.finance/sharedstake-v2/key-changes-over-v1.md",
    "https://docs.sharedstake.finance/sharedstake-v2/phased-launch.md",
    "https://docs.sharedstake.finance/sharedstake-v2/shareddeposit-v2-architecture.md",
  ],
  localDocs: [
    "llm/V2_ARCHITECTURE_EVOLUTION_CONTEXT.md",
    "src/architecture/lido-competitor-parity-phase2-plan.md",
    "src/architecture/MODULAR_STAKING_ARCHITECTURE.md",
    "src/architecture/contracts-v1-invariants.md",
    "src/architecture/contracts-v1-access-control-matrix.md",
    "src/architecture/contracts-v1-readiness-runthrough.md",
    "SharedDeposit/contracts/v2/core/README.md",
    "SharedDeposit/test/v2/core",
  ],
};

export const coreArchitecture = [
  {
    title: "Token Layer",
    points: [
      "sgETH: 1:1 ETH-pegged token for mint/redeem and LP-style usage.",
      "wsgETH: yield-bearing wrapper that accrues staking performance.",
      "Price/share accounting relies on on-chain state and sync cycles.",
    ],
  },
  {
    title: "Minter + Buffer Layer",
    points: [
      "SharedDepositMinterV2 handles deposit, stake, unstake, and withdraw flows.",
      "ETH buffer handles normal exit demand and peg support before validator exits.",
      "Pause/slash/fee operations are controlled by governance roles.",
    ],
  },
  {
    title: "Rewards + Exit Layer",
    points: [
      "RewardsReceiver routes EL/CL rewards into deposit or withdrawal paths.",
      "WithdrawalQueue/Withdrawals provide delayed redemption when buffer is insufficient.",
      "FeeSplitter and periphery contracts route protocol/operator/reflection flows.",
    ],
  },
];

export const phaseRoadmap = [
  {
    phase: "Phase 0-1",
    name: "Core Launch",
    additions: [
      "Non-custodial, non-upgradeable core with guarded rollout.",
      "Deposit + redeem-via-buffer + withdrawal flows.",
      "Minimal contract surface focused on mainnet hardening.",
    ],
  },
  {
    phase: "Phase 2",
    name: "Attribution + Controls",
    additions: [
      "Additive attribution entrypoints landed in StakingCore and StakingRouter.",
      "DAO-routed fee telemetry events emitted on reward reports (core + router).",
      "Quorum-oracle path, bunker controls, per-module inflow limits, and core/router beacon-baseline guards are covered by tests.",
    ],
  },
  {
    phase: "Phase 3",
    name: "Operator Decentralization",
    additions: [
      "Expand beyond a single operator path.",
      "Permissionless onboarding model (ERC-6551 + STEAK/SGT gating in docs).",
      "Operational guardrails for operator performance and failures.",
    ],
  },
  {
    phase: "Phase 4",
    name: "Fee Switch + Redistribution",
    additions: [
      "Protocol fee-switch activation policy.",
      "Redistribution to locked SGT staking path.",
      "Replacement for deprecated veSGT-style flow.",
    ],
  },
  {
    phase: "Phase 5",
    name: "Multi-Chain Minter",
    additions: [
      "Minter extension to additional L1/L2 environments.",
      "Cross-domain accounting and controls for sgETH mint paths.",
      "Chain-by-chain rollout with independent risk limits.",
    ],
  },
];

export const contractV1Readiness = [
  {
    status: "in_progress",
    title: "Freeze v1 scope and invariants",
    goal: "Turn roadmap language into auditable contract invariants and out-of-scope boundaries.",
    currentState:
      "Core contract scope is already concentrated under SharedDeposit/contracts/v2/core, but invariants are not yet written as formal release gates.",
    nextStep:
      "Publish invariant spec and require explicit sign-off before any new feature merges.",
    tasks: [
      "Write spec for mint/redeem, pause, slash, fee split, withdrawal-queue behavior.",
      "Define hard caps/limits (buffer limits, queue rules, validator count transitions).",
      "Publish canonical contract interaction sequence diagrams.",
    ],
  },
  {
    status: "in_progress",
    title: "Access-control matrix and key ceremony",
    goal: "Eliminate ambiguous privileges before external audit and deployment.",
    currentState:
      "Roles exist (GOV/NOR/DEFAULT_ADMIN_ROLE/Ownable), access matrices are drafted, deployment defaults were hardened to avoid deployer-retained control, and dedicated access-control + role-admin mapping tests now cover core/router/queue/quorum/policy modules. Signer ceremony policy is still pending.",
    nextStep:
      "Create contract-by-contract privilege table and multisig runbook with threshold and rotation policy.",
    tasks: [
      "Enumerate all privileged methods per contract and expected caller role.",
      "Define multisig threshold, signer rotation plan, and emergency procedures.",
      "Add tests that prove non-privileged callers cannot exercise sensitive paths.",
    ],
  },
  {
    status: "todo",
    title: "Economic safety and stress testing",
    goal: "Validate behavior under churn, slashing, and thin-liquidity conditions.",
    currentState:
      "Unit tests exist for many happy/unhappy paths, but scenario-level stress simulations are not yet formalized as release criteria.",
    nextStep:
      "Add scripted stress scenarios for buffer depletion, queued exits, slash events, and fee-mode switches.",
    tasks: [
      "Model high-withdrawal periods and queue starvation edge cases.",
      "Test fee/reflection distribution under low and high yield regimes.",
      "Simulate negative events (slash + pause + resume + backlog processing).",
    ],
  },
  {
    status: "in_progress",
    title: "Test coverage hardening",
    goal: "Upgrade current unit/e2e tests into release gates for contract v1.",
    currentState:
      "There is broad coverage in SharedDeposit/test/v2/core plus parity/modular suites, including adversarial, role-negative, quorum operational, bunker-mode, attribution telemetry, and baseline-guard paths. Local suites are passing (179 parity/modular tests), but invariant/fuzz gates are still pending.",
    nextStep:
      "Define minimum test matrix and pass thresholds, then enforce in CI for release branches.",
    tasks: [
      "Promote core test suites into CI pass/fail release criteria.",
      "Add invariant/fuzz tests around queue accounting and share conversions.",
      "Add fork tests that replay real operator/reward patterns.",
    ],
  },
  {
    status: "todo",
    title: "Security review pipeline",
    goal: "Treat audits as a stage in a broader secure release pipeline.",
    currentState:
      "Audit intent is documented in core README, but issue triage workflow and regression policy are not yet codified in this workspace.",
    nextStep:
      "Create findings tracker template and mandatory test-per-fix policy.",
    tasks: [
      "Run static analysis and linting with zero-high-severity policy.",
      "Prepare external audit scope focused on v2/core and custom libs.",
      "Track all findings in a remediation log with regression tests per fix.",
    ],
  },
  {
    status: "todo",
    title: "Deployment reproducibility",
    goal: "Make deployment deterministic and easy to verify for third parties.",
    currentState:
      "Deployment scripts and artifacts exist, but deterministic release manifests and bytecode attestations are not packaged as a single public checklist.",
    nextStep:
      "Create per-network release manifest with addresses, constructor args, commit hash, and verification links.",
    tasks: [
      "Pin compiler/config, deployment scripts, and expected bytecode hashes.",
      "Document per-network params and governance addresses.",
      "Publish verification checklist for explorers and downstream integrators.",
    ],
  },
  {
    status: "todo",
    title: "Operational runbooks",
    goal: "Define runtime actions for normal operations and incidents.",
    currentState:
      "Operational controls are present in contracts (pause/flip state/withdraw queue), but operator-facing playbooks are not yet written in one place.",
    nextStep:
      "Write incident runbooks and rehearse drills before mainnet promotion.",
    tasks: [
      "Create runbooks for pause/unpause, slash handling, and queue incident response.",
      "Define SLOs for reward sync cadence and withdrawal processing.",
      "Set on-call and escalation paths for governance/operators.",
    ],
  },
];

export const releaseTracks = [
  {
    milestone: "Internal Alpha",
    criteria: [
      "All core flows pass local + fork tests.",
      "Invariant suite green for at least 1k randomized runs per scenario.",
      "Spec and role matrix reviewed by protocol + frontend teams.",
    ],
  },
  {
    milestone: "Public Testnet Beta",
    criteria: [
      "External testers can complete deposit/stake/withdrawal loops reliably.",
      "Monitoring dashboards and alerting in place for key metrics.",
      "Known-issue list published with mitigation guidance.",
    ],
  },
  {
    milestone: "Mainnet V1",
    criteria: [
      "Audit findings resolved or explicitly accepted with governance sign-off.",
      "Deployment reproducibility and verification checklist completed.",
      "Emergency response drills completed before launch.",
    ],
  },
];
