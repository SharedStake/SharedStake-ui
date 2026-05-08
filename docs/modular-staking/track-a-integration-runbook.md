# Track A Integration Runbook

Status: active fallback runbook (Kimi timeout fallback)

## 1. Batch Order

## Batch A1: Submodule baseline and delta capture

Scope:
- `SharedDeposit` pointer at `acc8801`
- applied local delta files:
  - `contracts/v2/modular-staking/StakingRouter.sol`
  - `deploy/v2-modular-staking/011_dvtModule.ts`
  - `deploy/v2-modular-staking/012_quorumOracleAdapter.ts`
  - `test/v2/modular-staking/inflowLimiter.spec.ts`

Verify:
- `cd SharedDeposit && git status --short`
- `cd SharedDeposit && rg -n "contract StakingRouter|inflow" contracts/v2/modular-staking test/v2/modular-staking`

Checkpoint:
- Confirm files are exactly expected before frontend integration starts.

## Batch A2: ABI and contract index surface

Scope:
- `src/contracts/abis/stToken.json`
- `src/contracts/abis/wstToken.json`
- `src/contracts/abis/withdrawalQueueV2.json`
- `src/contracts/abis/stakingCore.json` (or replacement if naming/routing changes)
- `src/contracts/index.js`

Verify:
- `rg -n "stToken|wstToken|withdrawalQueueV2|stakingCore" src/contracts`
- `npm run lint` (or target lint command if full lint too expensive)

Checkpoint:
- Ensure ABI exports match store/component imports before UI port.

## Batch A3: Store and transaction wiring

Scope:
- `src/stores/modularStaking.js`
- `src/components/Common/DappTxBtn.vue`
- compatibility touchpoints in `src/utils/common.js` if required

Verify:
- `rg -n "modularStaking|DappTxBtn|stake|wrap|withdraw" src/stores src/components/Common src/utils`
- `npm run build`

Checkpoint:
- No unresolved imports; tx helper flows compile.

## Batch A4: Modular staking UI surfaces

Scope:
- `src/components/ModularStaking/ModularStakingApp.vue`
- `src/components/ModularStaking/StakePanel.vue`
- `src/components/ModularStaking/WrapPanel.vue`
- `src/components/ModularStaking/WithdrawPanel.vue`

Verify:
- `npm run build`
- local smoke path check (`/v2` route renders without runtime errors)

Checkpoint:
- UI compiles and route entry works with placeholders where contract deployment is missing.

## Batch A5: Route and navigation integration

Scope:
- `src/router/index.js`
- `src/components/Navigation/Menu.vue`
- optional interplay with `src/components/Stake/Stake.vue`

Verify:
- `npm run build`
- route/nav click-through test in local run

Checkpoint:
- Route and menu are stable on desktop and mobile.

## 2. Likely Conflict Hotspots

1. `src/router/index.js`
- Common conflict area from unrelated route work.

2. `src/components/Navigation/Menu.vue`
- Shared by multiple feature branches and content updates.

3. `src/contracts/index.js`
- Sensitive to address-map and ABI export conventions.

4. `src/utils/common.js`
- High reuse; prone to subtle regressions.

5. `SharedDeposit` pointer
- Changes from parallel contract work can overwrite desired baseline.

## 3. Safety / Rollback Discipline

After each batch:

1. Record `git status --short` snapshot in `docs/modular-staking/handoff.md`.
2. Run the batch verification commands and capture pass/fail.
3. If verification fails, revert only that batch’s touched files (not the whole tree).
4. Do not proceed to next batch until current batch compiles and is documented.

## 4. Minimum Evidence Required Before Leaving Track A

- Submodule baseline and delta are explicit and intentional.
- ABI/store/UI/route layers compile together.
- Build succeeds at least once after full Track A merge.
- Handoff log updated with exact file list and validation results.
