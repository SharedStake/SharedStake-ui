# Master PR Code-Port Checklist

Status: active
Master PR target: `SharedStake V2 Modular Staking`

Use this checklist to execute the one-master-PR plan in controlled batches.

## Track A — Core Product Signal

### A1. Submodule and protocol baseline
- [x] Align `SharedDeposit` submodule pointer to required commit set (`acc8801` baseline + applied saved module/test/deploy deltas).
- [x] Validate modular-staking contracts compile in submodule.
- [x] Validate deploy scripts required by frontend integration are present and coherent.

### A2. Frontend modular staking surfaces
- [x] Port/verify `src/components/ModularStaking/ModularStakingApp.vue`.
- [x] Port/verify `src/components/ModularStaking/StakePanel.vue`.
- [x] Port/verify `src/components/ModularStaking/WrapPanel.vue`.
- [x] Port/verify `src/components/ModularStaking/WithdrawPanel.vue`.
- [x] Port/verify `src/stores/modularStaking.js`.

### A3. Contract integration layer
- [x] Port/verify staking ABIs in `src/contracts/abis/*` (`stToken`, `wstToken`, `stakingCore`, `withdrawalQueueV2`).
- [x] Port/verify `src/contracts/index.js` exports and address wiring (including local-only contract override hardening).
- [x] Port/verify route and nav integration (`src/router/index.js`, `src/components/Navigation/Menu.vue`).
- [x] Port/verify shared tx surface (`src/components/Common/DappTxBtn.vue`).

## Track B — E2E Harness and Validation

- [x] Port `.env.e2e.wallet.example` updates.
- [x] Port `.env.example` updates relevant to test/harness flows.
- [x] Port `scripts/contracts/run-fork-e2e.sh`.
- [x] Port `scripts/contracts/seed-wallet.sh`.
- [x] Port `tests/e2e/helpers/impersonator.js`.
- [x] Port `tests/e2e/stake-approve-flow.spec.js`.
- [x] Port `tests/e2e/modular-staking-v2.spec.js`.
- [x] Port `tests/e2e-wallet/README.md` guidance.
- [x] Sync root `README.md` test instructions to final behavior.

## Track C — Architecture/Internal Docs

- [x] Port/merge `src/architecture/*` content into final internal architecture story.
- [x] Port/merge `src/components/Architecture/ArchitectureHub.vue` if retained for website architecture surface.
- [x] Reconcile `llm` architecture context docs into internal docs without duplicative churn.

## Track D — Website/Content Surface

- [x] Port/merge `src/Root.vue` changes.
- [x] Port/merge `src/components/Landing/Landing.vue` changes.
- [x] Reconcile any website-facing content/docs changes that are part of final release narrative.

## Track E — Glue and Compatibility

- [x] Port/verify `src/components/Stake/Stake.vue` interplay with modular surfaces.
- [x] Port/verify `src/utils/common.js` deltas.
- [x] Port/verify root `README.md` final messaging and commands.

## Cross-Cutting — Naming Normalization

- [x] Rename product-level legacy `lido-parity` labels to `SharedStake V2 Modular Staking`.
- [x] Rename oracle identifier to `StEthPriceOracle` (contracts/tests/scripts/docs).
- [x] Ensure user-facing route/menu/docs use consistent naming.

## Cross-Cutting — Security and Hardening

- [x] Validate role-access controls against expected governance model.
- [x] Validate oracle sanity bounds and failure behavior.
- [x] Validate withdrawal queue stress paths (TURBO/BUNKER).
- [x] Validate modular cap/inflow controls.
- [x] Validate operational runbooks and keeper scripts are aligned.

## Cross-Cutting — Test and Gate Evidence

- [x] Collect protocol test outputs (core + modular + adversarial + fuzz + scenario).
- [x] Collect frontend functional validation notes.
- [x] Collect e2e/fork harness outputs.
- [x] Record unresolved failures with owner + mitigation.

## Completion Gate (Master PR Ready)

- [x] All tracks merged and internally consistent.
- [x] Naming normalized.
- [x] Security/hardening gates reviewed.
- [x] Tests and validation evidence attached.
- [x] Internal + website architecture docs synchronized.
