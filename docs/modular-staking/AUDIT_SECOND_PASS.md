# SharedStake V2 Modular Staking — Comprehensive Security Audit Report

**Date:** 2026-05-09
**Scope:** contracts/v2/modular-staking/*, contracts/v2/governance/*, contracts/v2/modular-staking/modules/*
**Agents:** All 8 Pashov Solidity Auditor agents applied
**Commit:** 45b4078

---

## Executive Summary

This audit covers the V2 modular staking system (StakingRouter, StakingCore, StToken, WithdrawalQueueV2, modules) and the new governance infrastructure (VoteEscrowV2, SharedStakeGovernor, GovernanceTimelock, ReferralRegistry). **236 tests pass.**

**Verdict: ADEQUATE** — unit tests exist, access control is well-structured with timelock + guardian separation, but missing formal verification, stateful fuzz, and fork tests. Several medium-priority findings require fixes before mainnet.

---

## Agent 1: Vector Scan

### FINDING | contract: StakingRouter | function: _deposit | bug_class: reentrancy-via-callback | group_key: StakingRouter | _deposit | reentrancy
**path:** `submit()` → `_deposit()` → `module.receiveDeposit{value: amount}()` → `StToken.mintShares()`
**proof:** `receiveDeposit()` on LSTWrapModule or a malicious module could trigger a callback. Router has `nonReentrant` on submit functions, but `receiveDeposit()` sends ETH which could trigger `receive()` fallback on a malicious module.
**description:** If a module's `receiveDeposit()` makes an external call back to the Router before returning, the Router's state (totalPooledEther, module accounting) could be manipulated.
**fix:** Ensure all module `receiveDeposit()` implementations are callback-safe. Add `nonReentrant` to `reportModuleBeaconBalance` and `notifyBeaconDeposit`.

### FINDING | contract: StToken | function: transfer / transferFrom | bug_class: reentrancy-guard-missing | group_key: StToken | transfer | reentrancy
**path:** `transfer()` → external call to recipient
**proof:** `transfer()` and `transferFrom()` were missing `nonReentrant`. **FIXED in current branch** — `nonReentrant` added.
**description:** ERC20 callbacks (ERC777, ERC1155) could re-enter StToken during transfer.
**fix:** ✅ Already fixed.

### LEAD | contract: ReferralRegistry | function: claimFees | bug_class: callback-reentrancy | group_key: ReferralRegistry | claimFees | reentrancy
**code_smells:** `claimFees()` uses `IERC20(feeToken).safeTransfer()` which is safe, but if feeToken is a callback token (ERC777), the transfer could re-enter. `nonReentrant` is present. Low risk.
**description:** NonReentrant present, but worth confirming no state changes after external call.

---

## Agent 2: Math Precision

### FINDING | contract: StakingCore | function: reportBeacon | bug_class: divide-before-multiply | group_key: StakingCore | reportBeacon | precision
**path:** `rewards * feeBps / 10000` in FeeController, then `(totalFee * treasurySplitBps) / 10000`
**proof:** Two successive divisions: `totalFee = rewards * feeBps / 10000`, then `treasury = totalFee * split / 10000`. Max precision loss: ~2 wei per division. At 20% fee, 10% treasury split: `treasury = rewards * 2000/10000 * 5000/10000 = rewards * 0.1`. The intermediate `rewards * 2000` could overflow if rewards > 2^256/2000 (~5.7e74 ETH), impossible in practice.
**description:** Minor precision loss in fee split. At most 1 wei per division. **Accepted by design** — documented.

### FINDING | contract: ShareMath | function: getSharesByPooledEth | bug_class: rounding-direction | group_key: ShareMath | getSharesByPooledEth | rounding
**path:** `(assets * totalShares) / totalPooledEther`
**proof:** Deposits: user sends 1 ETH, totalShares=100, totalPooledEther=101. Shares = 100/101 = 0 (rounds down). User loses 1 ETH worth of deposit.
**description:** Share calculation rounds down. With small deposits relative to large pool, depositors can receive 0 shares. **Mitigation:** Frontend should enforce minimum deposit size. No on-chain minimum enforced.
**fix:** Add a `MIN_DEPOSIT` check in StakingRouter._deposit or document frontend requirement.

### LEAD | contract: StakingRouter | function: _applyBeaconDelta | bug_class: socialized-loss-rounding | group_key: StakingRouter | _applyBeaconDelta | rounding
**code_smells:** `if (newTotalPooledEther < totalFee) newTotalPooledEther = 0` — clamps to 0 on insolvency instead of reverting.
**description:** Socialized loss to 0 is a design choice but could surprise users. Exchange rate drops to 0, all share holders wiped out.

---

## Agent 3: Access Control

### FINDING | contract: StakingRouter | function: setFeeController | bug_class: instant-admin-power | group_key: StakingRouter | setFeeController | access-control
**path:** `setFeeController()` → `onlyRole(GOV)` — no timelock enforced at contract level
**proof:** GOV can instantly change feeController, which changes where fees go.
**description:** After initial deployment, GOV should be transferred to GovernanceTimelock. Until then, deployer EOA can instantly redirect all fees.
**fix:** ✅ Documented in deployment plan — GOV must be transferred to timelock immediately after deploy.

### FINDING | contract: StToken | function: addMinter / removeMinter | bug_class: minter-admin-power | group_key: StToken | addMinter | access-control
**path:** `addMinter()` → `onlyRole(DEFAULT_ADMIN_ROLE)`
**proof:** DEFAULT_ADMIN_ROLE can add arbitrary minters. After deploy, this role should be held by timelock.
**description:** Same as above — immediate transfer of DEFAULT_ADMIN_ROLE to timelock required.
**fix:** Document in deployment checklist.

### FINDING | contract: ValidatorModule | function: depositToBeaconChain | bug_class: node-operator-trust | group_key: ValidatorModule | depositToBeaconChain | access-control
**path:** `depositToBeaconChain()` → `onlyRole(NODE_OPERATOR)` — pushes 32 ETH to beacon deposit contract
**proof:** NODE_OPERATOR provides validator pubkeys/credentials. If malicious, they could use their own withdrawal credentials.
**description:** NODE_OPERATOR must be a trusted party. There is no on-chain verification that the provided `withdrawal_credentials` belong to the protocol.
**fix:** The protocol's withdrawal credentials should be hardcoded or validated against a known good value. Add a check: `require(withdrawal_credentials == EXPECTED_WITHDRAWAL_CREDENTIALS)`.

### FINDING | contract: VoteEscrowV2 | function: transferGov | bug_class: instant-gov-transfer | group_key: VoteEscrowV2 | transferGov | access-control
**path:** `transferGov()` → `onlyGov` — instant transfer, no timelock
**proof:** Current gov can instantly transfer to any address.
**description:** GOV should be timelock. But if GOV is compromised, they can instantly transfer gov to attacker.
**fix:** Add a 2-step gov transfer with delay, or ensure GOV is always timelock.

---

## Agent 4: Economic Security

### FINDING | contract: StakingRouter | function: submit | bug_class: inflow-limit-bypass | group_key: StakingRouter | submit | economic
**path:** `submit()` → `_deposit()` → inflow limit check
**proof:** Inflow limits are per-module and per-window. A user can deposit to module A (hitting limit), then immediately deposit to module B (different limit). No global inflow limit across all modules.
**description:** Without a global inflow limit, an attacker can bypass per-module limits by cycling through modules.
**fix:** Add optional global inflow limit, or ensure modules are configured with tight enough individual limits.

### FINDING | contract: ReferralRegistry | function: recordDeposit | bug_class: first-referrer-wins-gaming | group_key: ReferralRegistry | recordDeposit | economic
**path:** `recordDeposit()` → `if (hasReferred[referee]) return;`
**proof:** First referrer gets all future fee attribution for a referee. A referrer can front-run legitimate referrals by watching mempool for deposits with referral addresses and submitting their own first.
**description:** Since `hasReferred` is permanent and set on first referral, front-running is possible if referrer can observe and race.
**fix:** This is acceptable for launch but consider time-bound referral windows or referral NFTs for fair attribution.

### FINDING | contract: WithdrawalQueueV2 | function: finalize | bug_class: sandwich-finalization | group_key: WithdrawalQueueV2 | finalize | economic
**path:** `finalize()` → `ST_TOKEN.setTotalPooledEther()` → affects exchange rate
**proof:** Finalize changes totalPooledEther, which affects share-to-ETH exchange rate. A user could request withdrawal, then monitor for finalize, and if exchange rate drops (bad news for stakers), they benefit from having locked in their rate at request time.
**description:** This is by design — users lock in rate at request time. But if finalize is called immediately after a large slash (beacon balance drop), the queue processes at the pre-slash rate, and remaining stakers absorb the loss.
**fix:** Document this behavior. Consider BUNKER mode for large slashes (like Lido v2).

---

## Agent 5: Execution Trace

### FINDING | contract: WithdrawalQueueV2 | function: _enqueueRequest | bug_class: stale-rate-exploit | group_key: WithdrawalQueueV2 | _enqueueRequest | execution
**path:** `_enqueueRequest()` → computes `ethValue = ST_TOKEN.getPooledEthByShares(shares)` → burns shares → stores `ethValue` for later claim
**proof:** `ethValue` is computed and stored at enqueue time. If a slash happens between enqueue and finalize, the stored `ethValue` may exceed actual available ETH.
**description:** The queue promises `ethValue` ETH but the protocol may not have enough after a slash. This creates a liability.
**fix:** ✅ Socialized loss mechanism exists — if `currentPooled < ethValue` at finalize, it clamps. But consider explicit BUNKER mode for large deviations.

### FINDING | contract: StakingRouter | function: _deposit | bug_class: msg-value-vs-amount | group_key: StakingRouter | _deposit | execution
**path:** `_deposit()` receives `amount` parameter AND `msg.value`
**proof:** In `submit()`, `amount = msg.value`. But in future extensions, if `_deposit` is called with amount != msg.value, accounting breaks.
**description:** Internal function `_deposit` takes both `amount` and uses `msg.value` indirectly. If called from a function that doesn't match them, ETH accounting desyncs.
**fix:** Add `require(amount == msg.value, "amount mismatch")` in `_deposit` or make it an internal function that only receives `msg.value`.

### LEAD | contract: OracleAdapter | function: submitReport | bug_class: timestamp-assumption | group_key: OracleAdapter | submitReport | execution
**code_smells:** `if (block.timestamp < _lastReportTime + interval) revert TooSoon()` — assumes monotonic block timestamps.
**description:** On chains with timestamp manipulation (within ~15s drift), this could be slightly gamed.

---

## Agent 6: Invariant

### FINDING | contract: StakingRouter | function: reportModuleBeaconBalance | bug_class: invariant-break-beacon-delta | group_key: StakingRouter | reportModuleBeaconBalance | invariant
**invariant:** `moduleBeaconBalance[moduleId]` should only increase by exactly 32 ETH increments via `notifyBeaconDeposit`, or by oracle reports.
**violation_path:** Compromised ORACLE calls `reportModuleBeaconBalance()` with arbitrary values.
**proof:** ORACLE role can set `moduleBeaconBalance` to any value (within maxDeltaBps). If maxDeltaBps is too high (e.g., 1000 = 10%), a malicious oracle can inflate it by 10% per report, rapidly diluting stakers.
**description:** The `maxDeltaBps` cap is the only defense. At 10% per report, with daily reports, this compounds dangerously.
**fix:** Lower default maxDeltaBps to 100 (1%). Add a maximum absolute delta cap in addition to percentage cap.

### FINDING | contract: StakingCore | function: reportBeacon | bug_class: oracle-inflation | group_key: StakingCore | reportBeacon | invariant
**invariant:** `newBeaconBalance` should reflect actual validator balances.
**violation_path:** ORACLE reports fabricated high balance.
**proof:** Sanity check: `maxPlausible = validators * 32 ether * 3 / 2`. But max plausible is 48 ETH per validator (150% of 32 ETH). Honest validators with high rewards can approach this. A malicious oracle can report near-max every time, inflating exchange rate.
**fix:** Add a secondary sanity check: `newBeaconBalance >= _beaconBalance * (1 - maxSlashBps/10000)` to prevent reporting lower-than-expected values, and tighten maxPlausible to 1.3x (10% rewards max per period).

---

## Agent 7: Periphery

### FINDING | contract: ShareMath | function: getPooledEthByShares | bug_class: division-by-zero | group_key: ShareMath | getPooledEthByShares | division-by-zero
**path:** `(shares * totalPooledEther) / totalShares`
**proof:** If `totalShares == 0`, division by zero. Caller (`StToken.getPooledEthByShares`) guards this: `if (_totalShares == 0) return 0`. Safe.
**description:** ✅ Properly guarded at caller level.

### LEAD | contract: Errors | function: N/A | bug_class: error-message-reuse | group_key: Errors | N/A | periphery
**code_smells:** `Errors.sol` has generic errors used across multiple contracts. Hard to debug.
**description:** Using `InvalidAmount()` for multiple unrelated checks makes debugging harder.
**fix:** Consider more specific errors per contract.

---

## Agent 8: First Principles

### FINDING | contract: StakingRouter | function: _applyBeaconDelta | bug_class: exchange-rate-manipulation | group_key: StakingRouter | _applyBeaconDelta | first-principles
**assumption:** Exchange rate changes reflect honest beacon balance changes.
**violation:** A module can be added with fake `totalEth()` that returns inflated values.
**proof:** `registerModule()` checks `moduleType` but doesn't verify the module's accounting. A malicious module can report `totalEth() = type(uint256).max`, making the Router think it holds infinite ETH, minting infinite shares to the module owner.
**description:** `registerModule` is GOV-gated, but the Router trusts modules' `totalEth()` completely.
**fix:** Add a module registration timelock + audit requirement. Cap initial module deposits until the module is proven.

### FINDING | contract: StakingRouter | function: registerModule | bug_class: module-trust-assumption | group_key: StakingRouter | registerModule | first-principles
**assumption:** GOV only adds honest modules.
**violation:** GOV compromised → malicious module added → infinite mint possible.
**proof:** Malicious module: `receiveDeposit()` does nothing, `totalEth()` returns `type(uint256).max`. Router calls `totalEth()` for accounting. `submitToModule(moduleId)` → `_deposit()` → `totalPooledEther += module.totalEth()` → mints shares proportional to `type(uint256).max`.
**description:** The Router is fundamentally trustful of module `totalEth()`.
**fix:** Add a `module.totalEth()` sanity cap at registration time, or require modules to be audited/whitelisted with code hash verification.

---

## Fix Priority Matrix

| Priority | Finding | Contract | Fix |
|---|---|---|---|
| HIGH | Module totalEth() trust | StakingRouter | Add module audit/whitelist + totalEth cap |
| HIGH | Validator withdrawal credentials | ValidatorModule | Hardcode expected withdrawal_credentials |
| MEDIUM | Oracle maxDeltaBps too high | StakingRouter | Lower to 100 (1%) + add absolute cap |
| MEDIUM | No global inflow limit | StakingRouter | Add optional global limit |
| MEDIUM | MIN_DEPOSIT missing | StakingRouter | Add minimum deposit check |
| LOW | Gov transfer instant | VoteEscrowV2 | Ensure GOV is always timelock |
| LOW | First-referrer front-runnable | ReferralRegistry | Document; consider v2 improvement |
| LOW | Fee precision loss | FeeController | Accepted by design |

---

## X-Ray Verdict

**ADEQUATE** — The codebase has solid unit test coverage (236 passing), well-structured role separation (GOV/GUARDIAN/ORACLE/NODE_OPERATOR), and timelock governance integration. The primary risk is **module trust** — the Router assumes all registered modules are honest. Before mainnet:

1. Lower `maxDeltaBps` to 1%
2. Add module registration safeguards (whitelist/code hash)
3. Validate validator withdrawal credentials on-chain
4. Add global inflow limit
5. Engage external audit for formal verification
