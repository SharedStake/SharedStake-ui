# Architecture Workspace

This folder is the frontend-facing architecture workspace for iterative planning.

## Files

- `architecturePlan.js`
  - Structured source-of-truth used by the `/architecture` page.
  - Contains roadmap phases, contract-readiness checklist, and release gates.
- `MODULAR_STAKING_ARCHITECTURE.md`
  - V2 modular staking architecture reference (router, modules, governance).

## Update Process

1. Edit `architecturePlan.js`.
2. Keep each checklist item concrete and testable.
3. Reflect contract changes in:
   - `SharedDeposit/contracts/v2/core/README.md`
   - `SharedDeposit/contracts/v2/modular-staking/`
   - `src/architecture/MODULAR_STAKING_ARCHITECTURE.md`
   - `llm/V2_ARCHITECTURE_EVOLUTION_CONTEXT.md`
4. Keep source links current when GitBook pages change.

## Goal

Use this workspace to converge on a production-quality "v1 on new architecture"
without losing alignment between protocol, UI, and operations.
