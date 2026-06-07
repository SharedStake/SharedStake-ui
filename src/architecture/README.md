# Architecture Workspace

> **V3 contracts live in `staking-contracts/contracts/v2/modular-staking/`.** See `LIDO_PARITY_ARCHITECTURE.md` for the full system design.
> All protocol contract source is managed directly in `staking-contracts/`.

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
   - `staking-contracts/contracts/v2/core/README.md`
   - `staking-contracts/contracts/v2/modular-staking/`
   - `src/architecture/LIDO_PARITY_ARCHITECTURE.md`
   - `docs/modular-staking/architecture.md`
   - `docs/modular-staking/diagrams.md`
4. Keep source links current when GitBook pages change.

## Goal

Use this workspace to converge on a production-quality "v1 on new architecture"
without losing alignment between protocol, UI, and operations.
