# Comprehensive Audit & Review — Design Spec

**Date:** 2026-06-12
**Scope:** All 29 Solidity contracts in `staking-contracts/contracts/v2/modular-staking/` (PR 379 + PR 380)

## Goal

Reach a state where: all 29 contracts have been audited against the full 21-pattern DeFi checklist, all FINDING-level issues are fixed, lint is clean, the full test suite passes, and Opus advisor gives explicit sign-off. Iterate until that state is achieved.

## Approach

Combined Option A (full depth on every contract) + Option C (risk-tiered execution order, iteration gate). Every contract gets the full checklist; execution order prioritizes highest-TVL-risk first so critical bugs are surfaced and fixed before lower-risk work begins.

## Tiers

### Tier 1 — Core financial logic
`StakingRouter.sol` (1010 lines) · `StakingCore.sol` (501 lines) · `WithdrawalQueueV2.sol` (334 lines) · `FeeController.sol` · `StToken.sol`

Patterns to emphasize: reentrancy, ETH accounting, fee sandwich, admin-transfer safety, inflation attack, unbounded loops, gas DoS.

### Tier 2 — Oracle & modules
`OracleAdapter.sol` · `QuorumOracleAdapter.sol` · `lib/OracleValidation.sol` · `modules/ValidatorModule.sol` · `modules/DVTModule.sol` · `modules/LSTWrapModule.sol`

Patterns to emphasize: oracle staleness/manipulation, quorum bypass, module replay, last-submitter guard, slippage.

### Tier 3 — Access control & governance
`OperatorRegistry.sol` · `InstitutionalPolicyRegistry.sol` · `ReferralRegistry.sol` · `ReferralCodeRegistry.sol` · `DebtPool.sol` · `MigrationHelper.sol`

Patterns to emphasize: role escalation, registry griefing, one-time migration replay, Merkle proof reuse, governance attack.

### Tier 4 — Token wrappers & math
`WstToken.sol` · `StTokenERC4626Wrapper.sol` · `ShareMath.sol` · `StEthPriceOracle.sol`

Patterns to emphasize: ERC4626 inflation attack, rounding direction, price oracle staleness, wrap/unwrap invariants.

### Tier 5 — Deploy & wiring scripts
All `deploy/*.ts` scripts including `015_governanceHandover.ts`.

Patterns to emphasize: initialization order, permission handover gaps, missing entries, idempotency.

## Execution Loop

1. Baseline gates (hardhat test + lint:sol) — record starting failures
2. Tiers 1–5 kimi-delegate audit batches (5 Qs per call, CLEAN/FINDING format, parallel where possible)
3. code-review skill — 3-angle diff scan on full `main...HEAD`
4. Fix pass — all FINDING items resolved; refactor opportunities applied
5. Re-run all gates — must be green before advisor call
6. Advisor Opus sign-off — if new concerns raised, return to step 2
7. Done when advisor approves + gates green + no new findings

## Done Criteria

- `cd staking-contracts && npx hardhat test` exits 0
- `cd staking-contracts && npm run lint:sol` exits 0
- All kimi batches return CLEAN or all FINDINGs are addressed
- code-review returns no CONFIRMED/PLAUSIBLE items
- Advisor gives explicit "sign-off" or "approved"
