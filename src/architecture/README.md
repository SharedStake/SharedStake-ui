# Architecture Workspace

This folder is the frontend-facing architecture workspace for iterative planning.

## Files

- `architecturePlan.js`
  - Structured source-of-truth used by the `/architecture` page.
  - Contains roadmap phases, contract-readiness checklist, and release gates.
- `contracts-v1-invariants.md`
  - Formal invariant definitions for contract-v1 promotion.
- `contracts-v1-access-control-matrix.md`
  - Privileged-function matrix and required governance policy controls.
- `contracts-v1-readiness-runthrough.md`
  - Gate-by-gate readiness status and execution sequence.
- `lido-competitor-parity-phase2-plan.md`
  - Competitor parity matrix and Phase 2+ modular rollout plan.

## Update Process

1. Edit `architecturePlan.js`.
2. Keep each checklist item concrete and testable.
3. Reflect contract changes in:
   - `SharedDeposit/contracts/v2/core/README.md`
   - `SharedDeposit/contracts/v2/modular-staking/`
   - `src/architecture/LIDO_PARITY_ARCHITECTURE.md`
   - `llm/V2_ARCHITECTURE_EVOLUTION_CONTEXT.md`
4. Keep source links current when GitBook pages change.

## Goal

Use this workspace to converge on a production-quality "v1 on new architecture"
without losing alignment between protocol, UI, and operations.
