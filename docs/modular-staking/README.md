# SharedStake V2 Modular Staking Docs

This folder is the docs-first baseline for the clean V2 staking workstream (Option B).

## Current Intent

- Build one optimal architecture first.
- Preserve the full old-PR system intent (contracts + frontend + ops + test harness), not a narrow subset.
- Use phased packaging for reviewability, but keep all major capability areas in scope.
- Keep documentation ahead of implementation to support handoff across subagents and quota boundaries.

## Reading Order

1. `architecture.md`
2. `diagrams.md`
3. `threat-model.md`
4. `composite-profile-prd.md`
5. `master-pr-plan.md`
6. `pr376-keep-drop-matrix.md`
7. `code-port-checklist.md`
8. `track-a-integration-runbook.md`
9. `execution-plan.md`
10. `handoff.md`

## Scope Boundary

Included in program scope:
- Router-first architecture and module stack in `SharedDeposit/contracts/v2/modular-staking/**`
- Frontend integration surfaces (`ModularStaking*`, store, route/nav, ABIs)
- Security/readiness and operational components (keepers/runbook/manifests)
- E2E harness improvements needed to validate end-to-end behavior
- Historical architecture context from old PR for decision continuity

## Decisions Locked

- Canonical technical direction: modular staking architecture.
- Delivery model: one master PR with all related work.
- Docs must preserve implementation-relevant context for resumable execution.
- Program scope includes the full composite signal from old PR #376, packaged cleanly.

## Remaining Architecture Decisions

- Oracle launch topology: `OracleAdapter` vs `QuorumOracleAdapter`.
- Launch risk parameters: `maxDeltaBps`, per-module limits, queue bunker settings, global cap.
- Minimum operational controls required before public deployment.
