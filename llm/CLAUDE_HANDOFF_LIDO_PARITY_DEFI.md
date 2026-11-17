# CLAUDE HANDOFF: Lido-Parity DeFi Core (Security-First)

## Completion Status

### Completed
- Phase 0: Architecture doc and threat model delivered and evidenced.
- Phase 1: Core contracts exist (`StakingCore`, share token, wrapper, withdrawal queue, fee controller).
- Phase 2: Oracle/report adapter + pause/resume safety controls exist.
- Phase 3: Role/access negative tests pass; fuzz/invariant suite passes; full Hardhat suite green.
- Frontend: Lint, type-check, and build passing.
- CI/PR checks: AWS Amplify preview passing.

### Phase 3 — Complete
- Hardening suite passes; 765 tests passing, 0 open internal findings.
- 7+ iterative security audit passes completed internally.
- Cyclomatic complexity refactored across all core modules.
- DebtPool security fixes applied: `emergencyOverrideMerkleRoot`, `swept` flag per request, reentrancy guards.
- DVT module proposal queue implemented and tested.
- OperatorRegistry ETH+SGT bond system implemented and tested.
- Timelock + multisig governance wiring implemented (`GovernanceTimelock`, `SharedStakeGovernor`, `VoteEscrowV2`).

### Phase 4 — In Progress
- ✅ Cyclomatic complexity refactored.
- ✅ DebtPool security fixes applied (emergencyOverrideMerkleRoot, swept flag).
- ✅ Security audit passes: 7+ iterative passes, 765 tests passing, 0 open findings.
- ✅ DVT module proposal queue implemented.
- ✅ OperatorRegistry bond system implemented.
- 🚧 External audit: in progress / pending scheduling.
- 🚧 Mainnet deployment: blocked on external audit completion.
- 🚧 Keeper infrastructure: scripts ready at `scripts/keepers/`, deploy pending.

### Remaining Work
- Complete external security audit(s), triage findings, and add regression tests.
- Produce staging deployment runbook and complete fork simulation operational checklist.
- Obtain mainnet deploy approval (engineering + security owner sign-off).
- Deploy keeper scripts (`scripts/keepers/`) to production infrastructure.
- 72h heightened monitoring window and rollback/containment rehearsal post-deploy.

---

## Objective
Deliver a Lido-parity DeFi core focused on secure staking derivative mechanics before feature breadth.

Primary outcome:
- Users can deposit staking asset, receive rebasing/wrapped staking receipt token, request withdrawals, and claim finalized withdrawals with protocol-level accounting integrity.

Security-first constraints (non-negotiable):
- Minimize trusted assumptions (role separation, timelocks, multisig-only privileged actions).
- No unaudited upgrade path to production.
- All critical state transitions protected by invariant/fuzz coverage.
- Pausable containment for incident response without freezing claims forever.

## Scope Boundary
In scope:
- Core staking vault + share accounting.
- Reward accounting/rebase mechanics.
- Withdrawal queue + finalization + claim flow.
- Oracle/report ingestion and sanity checks.
- Fee accrual/distribution.
- Access control and emergency controls.

Out of scope for initial parity:
- Cross-chain staking receipts.
- Advanced governance tokenomics.
- Non-core incentives/points systems.

## Phased Roadmap (with Acceptance Criteria)

## Phase 0 - Architecture Lock + Threat Model
Deliverables:
- Architecture doc with module boundaries and trust assumptions.
- Threat model (assets, actors, attack paths, mitigations).
- Storage layout and upgrade strategy decision (immutable vs proxy).

Acceptance criteria:
- All privileged functions mapped to explicit roles and delay requirements.
- Every external integration has failure-mode handling documented.
- At least 15 concrete threat scenarios with mitigation status tracked.

## Phase 1 - Core Contracts (MVP Mechanics)
Deliverables:
- `StakingCore` (deposits, share minting, total pooled accounting).
- `StToken` (rebasing share token or equivalent accounting abstraction).
- `WstToken` (non-rebasing wrapper with deterministic exchange rate).
- `WithdrawalQueue` (request, finalize, claim).
- `FeeController` (protocol/operator fee accounting).

Acceptance criteria:
- Deposit -> mint -> queue withdrawal -> finalize -> claim succeeds end-to-end.
- Share-to-asset conversion remains monotonic except slash events.
- No user can claim more assets than entitled under any tested path.
- All arithmetic uses safe precision handling with bounded rounding error.

## Phase 2 - Oracle/Reporting + Safety Controls
Deliverables:
- Oracle/report adapter (consensus report ingestion).
- Report sanity rules (max delta, stale report limits, slash handling).
- Emergency controls (`pause`, `resume`, role-guarded config changes).

Acceptance criteria:
- Invalid or stale oracle reports are rejected deterministically.
- Slash event path updates balances without breaking withdrawal solvency checks.
- Pause blocks new risk-bearing entrypoints while preserving safe exits where intended.

## Phase 3 - Hardening + Security Validation
Deliverables:
- Full invariant suite.
- Differential checks against reference economics/spec.
- Gas profiling and DoS/loop-bound analysis.
- Pre-audit remediation pass.

Acceptance criteria:
- Zero high/critical findings in internal review.
- Invariant suite runs clean for target fuzz campaign budget.
- Queue operations remain bounded and executable under worst-case expected load.

## Phase 4 - Audit, Staging, and Mainnet Readiness [IN PROGRESS]

Status as of 2026-06-01:
- ✅ Internal security hardening complete: 7+ audit passes, 765 tests, 0 open findings.
- ✅ Governance wiring complete: GovernanceTimelock (7-day), SharedStakeGovernor, VoteEscrowV2.
- ✅ DVT module proposal queue complete.
- ✅ OperatorRegistry ETH+SGT bond system complete.
- 🚧 External audit: in progress / pending scheduling.
- 🚧 Mainnet deployment: blocked on external audit completion.
- 🚧 Keeper infrastructure: scripts ready at `scripts/keepers/`, deploy pending.

Deliverables:
- External audit(s) and fixes.
- Staging deployment runbook and incident playbook.
- Production config with multisig + timelock governance wiring (✅ implemented).

Acceptance criteria:
- All external high/critical audit findings fixed and verified.
- Staging fork simulation passes full operational checklist.
- Mainnet deploy approval signed by engineering + security owners.

## Explicit Contract Workstreams

## WS1: Share Accounting Engine
- Define canonical formulas:
  - `shares = assets * totalShares / totalPooledAssets` (with bootstrap logic).
  - `assets = shares * totalPooledAssets / totalShares`.
- Implement deterministic rounding policy and test for boundary fairness.

Done when:
- Conversion tests cover bootstrap, low-liquidity, large-number, and slash scenarios.

## WS2: Rebase + Wrapped Token Compatibility
- Implement rebasing token behavior for core representation.
- Implement wrapped token with non-rebasing fixed-share semantics.
- Prove conversion consistency across rebase events.

Done when:
- Round-trip `st -> wst -> st` remains within documented rounding bounds.

## WS3: Withdrawal Queue Lifecycle
- Queue structure, request IDs, owner/beneficiary mapping.
- Finalization batch mechanics and liquidity accounting.
- Claim flow with replay protection and partial-claim policy (if supported).

Done when:
- Queue integrity invariants hold under randomized interleaving of requests/finalizations/claims.

## WS4: Oracle & Report Validation
- Signed report ingestion path.
- Limits on report drift, staleness, and slash magnitude.
- Consensus source abstraction for future upgrades.

Done when:
- Malformed, replayed, stale, and out-of-bound reports are rejected in tests.

## WS5: Fees, Roles, and Governance Controls
- Fee minting/accrual policy and recipients.
- AccessControl matrix (DAO, guardian, oracle submitter, operator).
- Timelocked parameter updates; emergency role split.

Done when:
- Unauthorized calls revert across all privileged selectors.

## WS6: Upgrade/Immutability Discipline
- If upgradeable: lock storage gaps, initializer guards, upgrade authorization tests.
- If immutable: migration strategy and deprecation runbook.

Done when:
- Chosen strategy documented with executable rollout steps and rollback conditions.

## Test Requirements

Mandatory test suites:
- Unit tests: happy path + revert path for every external/public function.
- Property/fuzz tests: conversions, queue accounting, report ingestion, fee accrual.
- Invariant tests:
  - Total assets conservation (minus explicit slash/fee effects).
  - No over-claim possible.
  - Share conversion monotonicity rules hold.
- Fork/integration tests:
  - Deployment scripts against fork.
  - Oracle/report lifecycle simulation.
  - Pause/unpause operational drills.

Coverage and quality bars:
- Line coverage >= 95% for core contracts.
- Branch coverage >= 90% for core contracts.
- 0 flaky tests in CI.
- Static analysis clean for agreed rule set (Slither + lints).

## Deployment and Security Gates

Pre-merge gates:
- CI green for unit/fuzz/invariant/static-analysis.
- Gas snapshot diff reviewed for any critical path regression.
- Two maintainer approvals for contract changes touching core accounting.

Pre-staging gates:
- Threat model updated for all new attack surfaces.
- Role configuration manifest generated and reviewed.
- Emergency response runbook validated in tabletop walkthrough.

Pre-mainnet gates:
- External audit complete, findings triaged and resolved.
- Timelock + multisig ownership transferred and verified on-chain.
- Monitoring/alerting active for:
  - Queue backlog anomalies.
  - Unexpected share price delta.
  - Oracle freshness violations.

Post-deploy gates:
- 72h heightened monitoring window with freeze criteria.
- Explicit rollback/containment checklist ready and rehearsed.

## Prioritized Coding Task List for Claude (Execution Order)

P0 (start immediately):
1. Create contract skeletons for `StakingCore`, `StToken`, `WstToken`, `WithdrawalQueue`, `FeeController`, and role modules.
2. Implement share accounting library + precision/rounding helpers with unit tests first.
3. Wire deposit/mint and request-withdraw flows end-to-end behind strict role and pause guards.

P1:
1. Implement finalization + claim mechanics with replay protection and solvency checks.
2. Add oracle report adapter + validation gates (stale, drift, slash bounds).
3. Add fee accrual/distribution logic and role-restricted parameter setters with timelock hooks.

P2:
1. Build full invariant suite and fuzz harnesses for queue/accounting/report state transitions.
2. Add fork-based deployment and operational simulation tests.
3. Integrate static analysis and coverage thresholds into CI.

P3:
1. Produce audit packet (architecture, invariants, privileged roles, known assumptions).
2. Address audit findings and add regression tests per finding.
3. Finalize staging/mainnet runbooks and verify gated release checklist.

Definition of done for Claude task execution:
- Each completed task must include:
  - code,
  - tests proving behavior and failure modes,
  - brief rationale in PR description,
  - mapping to this handoff phase/workstream.
