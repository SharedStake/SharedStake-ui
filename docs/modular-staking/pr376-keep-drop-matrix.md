# PR #376 Inclusion Map (Master PR)

This file replaces keep/drop semantics for the one-master-PR strategy.

Policy: treat all meaningful `#376` work as in-scope; package by track for clean integration.

## Track A: Core Product Signal (must include)

- `SharedDeposit` submodule pointer (contains the protocol/system bulk)
- `src/components/ModularStaking/*`
- `src/stores/modularStaking.js`
- `src/contracts/abis/*` (staking-related)
- `src/contracts/index.js`
- `src/router/index.js`
- `src/components/Navigation/Menu.vue`
- `src/components/Common/DappTxBtn.vue`

## Track B: E2E Harness and Validation (include)

- `.env.e2e.wallet.example`
- `.env.example`
- `scripts/contracts/run-fork-e2e.sh`
- `scripts/contracts/seed-wallet.sh`
- `tests/e2e/helpers/impersonator.js`
- `tests/e2e/stake-approve-flow.spec.js`
- `tests/e2e-wallet/README.md`
- related `README.md` test instructions

## Track C: Architecture/Internal Docs (include)

- `src/architecture/*`
- `src/components/Architecture/ArchitectureHub.vue`
- architecture evolution context under `llm/` where useful

## Track D: Website/Content and General Docs (include, but isolate commits)

- `src/Root.vue`
- `src/components/Landing/Landing.vue`
- related documentation updates across `llm/*`

Note: these files are still in-scope per product direction, but should be grouped in dedicated commit blocks to keep review clarity.

## Track E: Ambiguous but In-Scope Glue

- `src/components/Stake/Stake.vue`
- `src/utils/common.js`
- `README.md`

These often carry compatibility glue and should be validated against final flow behavior.

## Integration Order (single PR)

1. Track A (core signal)
2. Track B (validation harness)
3. Track C (architecture/internal docs)
4. Track D (website/content/docs)
5. Track E (glue and consistency pass)

All tracks land in one master PR; order is for engineering control and easier review.
