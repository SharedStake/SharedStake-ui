# SharedStake V2 Modular Staking — Master PR Plan

Status: active
Branch: `feat/sharedstake-v2-modular-staking-master`
Delivery model: **one master PR** with all related work

## 1. End-State Goal

Ship one integrated release candidate that includes:

1. Full parity path (stake/wrap/withdraw) with robust accounting.
2. Modular staking architecture (`StakingRouter` + module system).
3. DVT and solo-validator module support.
4. Hardening/security controls and operational readiness assets.
5. Comprehensive test coverage (unit/integration/e2e/adversarial/fuzz/ops).
6. Clean architecture documentation both:
- internally (engineering docs/runbooks)
- externally (website-facing architecture narrative)

## 2. Scope Contract

Everything from old PR `#376` is in scope for this master PR, plus naming normalization and cleanup for coherent review.

No functional slices are excluded by default. Work is phased for execution clarity, not scope reduction.

## 3. Naming Contract

Use canonical name: `SharedStake V2 Modular Staking`.

Actions required:
- Replace product-level legacy `lido-parity` naming in docs/UI labels.
- Use neutral oracle naming `StEthPriceOracle` across contracts, tests, scripts, and docs.
- Preserve historical references only where needed for migration context.

## 4. Master Workstreams

## W1: Protocol Core and Accounting

Deliverables:
- `StToken`, `WstToken`, `ShareMath`
- `StakingCore`, `WithdrawalQueueV2`, `FeeController`
- Accounting invariants explicitly documented and validated

Exit criteria:
- Core contract test suites pass with deterministic outputs.

## W2: Modular Staking Architecture

Deliverables:
- `StakingRouter`
- `ValidatorModule`, `DVTModule`, `LSTWrapModule`
- Module caps, inflow controls, policy hooks

Exit criteria:
- Router/module tests pass, including module-level edge cases.

## W3: Oracle and Control Plane

Deliverables:
- `OracleAdapter`, `QuorumOracleAdapter`
- Oracle sanity bounds and failure-path behavior
- Role and authority map hardened and documented

Exit criteria:
- Oracle/adversarial/quorum tests pass and are documented.

## W4: Frontend Integration

Deliverables:
- Modular staking app and panels
- ABI/address wiring, route/nav integration
- Transaction UX integration

Exit criteria:
- Stake/wrap/withdraw flows execute against local fork/dev deployment.

## W5: Security Hardening and Operational Readiness

Deliverables:
- Security review artifacts
- Deployment manifests/helpers
- Keeper scripts/runbooks (deposit/oracle/finalizer)

Exit criteria:
- Hardening checklist completed with explicit unresolved-risk log.

## W6: Test and Verification Program

Deliverables:
- Unit/integration/e2e/adversarial/fuzz/scenario coverage
- Wallet/impersonator E2E harness where applicable
- Reproducible test commands and outputs

Exit criteria:
- Test matrix green or failures explicitly triaged with owner + mitigation.

## W7: Internal Documentation

Deliverables:
- Architecture docs, threat model, role matrix, readiness gates
- Handoff log and execution trace

Exit criteria:
- Internal docs are sufficient for autonomous subagent resume.

## W8: Website-Facing Architecture Documentation

Deliverables:
- Public-facing architecture narrative and component explanations
- Clean terminology aligned to canonical naming

Exit criteria:
- Website docs reviewed for consistency with actual implementation.

## 5. Security and Quality Gates (Must Pass)

1. Access-control matrix verification.
2. Oracle and queue stress scenarios.
3. Adversarial + fuzz baseline run.
4. End-to-end user flow run (stake/wrap/withdraw/claim).
5. Deployment/runbook walkthrough.
6. Documentation consistency check (code <-> internal docs <-> website docs).

## 6. Execution Strategy (Parallel + Controlled Integration)

Parallel side tasks via Kimi subagents:
- File-level implementation diffs and draft patches.
- Test output summarization and failure clustering.
- Documentation drafting from validated code state.

Critical-path local orchestration:
- Final code edits and conflict resolution.
- Integration decisions across protocol/frontend/ops.
- Final gate verification and PR narrative.

## 6.5. Execution Discipline (Mandatory)

Every substantive slice must follow this flow:

1. Goal-first kickoff:
- Write one explicit goal for the slice before edits.

2. Subagent-first side-task delegation:
- Use Kimi/Devin delegates for bounded side tasks (analysis, patch drafting, targeted review).
- Keep critical-path blockers local.

3. Multipass verification:
- Pass 1: targeted tests for touched files/paths.
- Pass 2: broader subsystem sweep.
- Pass 3: security/adversarial pass (tooling + manual triage notes).

4. De-bloat cleanup pass:
- Remove dead/redundant code and low-signal churn.
- Keep diff/file count lean where possible.

5. Production-quality gate:
- No stubs/placeholders/half-wired functionality in completion claims.
- Any deferred item must be documented as explicit risk acceptance with owner + next action.

6. Continuous resumability:
- Append progress evidence in `handoff.md` during work, not only at the end.

## 7. Master PR Structure

One PR, organized by commit groups:

1. Naming normalization + docs foundation
2. Protocol core + router/module code
3. Frontend and ABI wiring
4. Ops/runbook/keeper assets
5. Test harness and validation updates
6. Final docs sync (internal + website)

## 8. Definition of Done

Master PR is done when:

1. Full feature set above is implemented and integrated.
2. Security and test gates are satisfied or explicitly risk-accepted.
3. Naming is consistent with `SharedStake V2 Modular Staking`.
4. Internal and website docs are coherent and current.
5. Handoff artifacts allow cold-start continuation without re-triage.
