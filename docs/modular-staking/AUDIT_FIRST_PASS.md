# First-Pass Audit — SharedStake V2 Modular Staking

**Date:** 2026-05-08
**Auditor:** Codex GPT-5
**Scope:** `src/stores/modularStaking.js`, `src/components/ModularStaking/*`, `src/contracts/index.js`, `src/router/index.js`, `src/components/Navigation/Menu.vue`

## Issues Found

### 1. Missing StakingRouter ABI in Frontend — MEDIUM
**File:** `src/contracts/abis/`
**Finding:** No `stakingRouter.json` ABI exists in the frontend, but the store references `defaultModuleId`, `moduleInflowUsed`, `moduleInflowLimit`, etc. These fields are never populated because there's no contract to read from.
**Fix:** Extract ABI from `SharedDeposit/deployments/localhost/StakingRouter.json` and add to frontend.

### 2. Modular ABIs Not in Legacy `_ABIs` Export — LOW
**File:** `src/contracts/index.js`
**Finding:** `stToken.json`, `wstToken.json`, `stakingCore.json`, `withdrawalQueueV2.json` are imported by the store but NOT added to the `_ABIs` object. This means other code can't use them through the legacy contract factory.
**Fix:** Add them to `_ABIs` and add factory functions.

### 3. StakingRouter Never Fetched in Store `init()` — MEDIUM
**File:** `src/stores/modularStaking.js`
**Finding:** The store has state for module registry (`defaultModuleId`, `defaultModuleInfo`, `moduleInflowUsed`, etc.) but `init()` never reads from `StakingRouter`.
**Fix:** Add router contract reads in `init()` to populate module metadata.

### 4. StakePanel Output Uses Local Math Instead of Contract — LOW
**File:** `src/components/ModularStaking/StakePanel.vue`
**Finding:** `computeOutput()` replicates share math locally. While the math is correct, it could diverge from the contract if rounding changes. The contract has `getSharesByPooledEth` for this.
**Fix:** Optional — use contract call for preview, or keep local math with a comment noting it's a preview estimate.

### 5. WrapPanel setMax for Unwrap Doesn't Subtract Buffer — LOW
**File:** `src/components/ModularStaking/WrapPanel.vue`
**Finding:** When unwrapping, `setMax()` sets the full wstToken balance. The unwrap transaction requires gas (ETH), not wstToken, so this is actually fine — the user pays gas in ETH separately. But if the user has 0 ETH, the tx will fail. This is a general wallet issue, not specific to this component.
**Status:** Acceptable — no fix needed.

### 6. WithdrawPanel Claim Lacks Success Feedback — LOW
**File:** `src/components/ModularStaking/WithdrawPanel.vue`
**Finding:** After claiming, there's no explicit success message. The request just disappears from the list when `init()` refreshes. Could confuse users.
**Fix:** Add a `claimTxHash` data field and show success message.

### 7. E2E Test Doesn't Cover Claim/Finalize — LOW
**File:** `tests/e2e/modular-staking-v2.spec.js`
**Finding:** The E2E test goes stake → wrap → request withdrawal but stops before claim. Finalize requires guardian privileges.
**Fix:** Add a manual finalize step in the test (impersonate guardian) or document as known gap.

### 8. Missing finalize() Action in Store — LOW
**File:** `src/stores/modularStaking.js`
**Finding:** No action exists for `finalize()` on the withdrawal queue. This is a guardian-only function, but having it in the store (even if only used in E2E or admin UI) would be useful.
**Fix:** Add `finalize()` action (guardian-only, documented as such).

### 9. No Error Boundary in ModularStakingApp — LOW
**File:** `src/components/ModularStaking/ModularStakingApp.vue`
**Finding:** If `init()` throws, the error is only logged to console. No user-facing error state.
**Fix:** Display store error in the UI (already partially done via panels showing `store.error`).

---

## Parity Gaps vs PR #376

After comparing the 14 commits in #376 against current branch:

| Feature | In #376 | In Current | Gap |
|---|---|---|---|
| Core contracts (7) | ✅ | ✅ (in submodule) | None |
| Router + modules (5 more) | ✅ | ✅ (in submodule) | None |
| Frontend panels | ✅ | ✅ | None |
| ABIs | 4 | 4 | None |
| Store | ✅ | ✅ | None |
| ArchitectureHub | ✅ | ✅ | None |
| Security hardening | ✅ | ✅ | None |
| StakingRouter ABI in frontend | ❌ | ❌ | **Both missing** |
| Module info fetching | ❌ | ❌ | **Both missing** |
| finalize() action | ❌ | ❌ | **Both missing** |

The "gaps" are actually features that were planned but never implemented in either branch. The code-port checklist marked them as done prematurely.

---

## Recommendations

1. **Add StakingRouter ABI and wire it** — this is the highest-value missing piece.
2. **Add `_ABIs` registration** — for consistency with legacy contract pattern.
3. **Add finalize action** — useful for E2E and admin flows.
4. **Run fork E2E with Anvil** — catch real integration bugs.
5. **Add claim success feedback** — polish item.

**Agent:** Codex GPT-5
**Co-authored-by:** Chimera <chimera_defi@protonmail.com>
