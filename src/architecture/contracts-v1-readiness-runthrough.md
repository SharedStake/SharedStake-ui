# Contracts V1 Readiness Run-Through

Last updated: 2026-05-01

This document runs through all seven release gates for a production-quality
"v1 on new architecture" and maps current state to next actions.

## 1) Scope Freeze and Invariants

- Current signal:
  - Core surface is well-bounded in `SharedDeposit/contracts/v2/core`.
  - Existing tests cover many function-level cases.
  - Formal invariant spec was missing.
- Action taken:
  - Added `contracts-v1-invariants.md` in this folder.
- Remaining work:
  - Protocol + frontend sign-off on invariants.
  - Mark out-of-scope modules for v1 launch.

## 2) Access-Control Matrix and Key Ceremony

- Current signal:
  - Roles are distributed across `AccessControl` (`GOV`, `NOR`, `DEFAULT_ADMIN_ROLE`) and `Ownable`.
  - Privilege matrix has now been added (`contracts-v1-access-control-matrix.md`).
  - Dedicated negative access-control tests were added in `test/v2/core/accessControl.spec.ts`.
  - Deployment hardening now wires governance/owner roles via constructor args and deploy scripts, with `deploymentSecurity.spec.ts` asserting that deployer EOAs do not retain privileged control.
- Required next actions:
  - Define multisig threshold, signer rotation, and emergency override policy.
  - Expand negative tests to any remaining privileged paths not yet covered.

## 3) Economic Safety and Stress Testing

- Current signal:
  - Unit tests exist for queue and minter behavior.
  - Dedicated stress scenarios are not formalized as release gates.
- Required next actions:
  - Model low-liquidity redemption spikes and queue starvation.
  - Run slash + pause + resume + backlog processing scenarios.
  - Validate fee and reflection behavior across extreme market conditions.

## 4) Test Coverage Hardening

- Current signal:
  - `SharedDeposit/test/v2/core` contains broad tests (`minter`, `wsgETH`, `queue`, `e2e`).
  - Baseline local run currently passes (`41 passing` via `npm --prefix SharedDeposit test`).
  - No explicit invariant/fuzz pass threshold bound to release.
- Required next actions:
  - Define a minimum required matrix and failure policy in CI.
  - Add invariant/fuzz suites for accounting and queue consistency.
  - Add fork replay scenarios for realistic operator/reward patterns.

## 5) Security Review Pipeline

- Current signal:
  - Audit intent is documented in `contracts/v2/core/README.md`.
  - Formal triage/remediation workflow is not yet documented.
- Required next actions:
  - Run static analysis + lint with explicit severity policy.
  - Publish audit scope and assumptions for v1.
  - Track findings with owner, SLA, fix PR, and regression test reference.

## 6) Deployment Reproducibility

- Current signal:
  - Deployment scripts and artifacts exist.
  - Release manifest is not yet standardized.
- Required next actions:
  - Publish network manifests (addresses, constructor args, commit SHA, compiler).
  - Include explorer verification links and governance role assignments.
  - Require deterministic deployment checklist before promotion.

## 7) Operational Runbooks

- Current signal:
  - Contracts provide runtime controls (pause, flip state, queue controls, slash).
  - Human runbooks and drills are not yet written in one place.
- Required next actions:
  - Write incident playbooks: pause/unpause, slash events, queue distress.
  - Define SLOs for reward processing and withdrawal settlement.
  - Assign on-call rotation and escalation channels.

## Suggested Execution Sequence

1. Freeze invariants + privileged access matrix.
2. Lock test matrix + add invariant/fuzz gates.
3. Complete stress simulations and document outcomes.
4. Execute security review cycle and remediation.
5. Produce deterministic deployment manifests.
6. Run operational drills before mainnet promotion.
