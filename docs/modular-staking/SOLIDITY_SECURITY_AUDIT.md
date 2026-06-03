# Solidity Security Audit — SharedStake V2 Modular Staking

**Date:** 2026-05-08
**Auditor:** Codex GPT-5
**Scope:** `contracts/v2/modular-staking/*.sol` + `contracts/v2/modular-staking/modules/*.sol`
**Commit:** `721a055` (pre-migration internal audit baseline; sources now live in `staking-contracts/`)

---

## Latest PR 379 Validation Note

As of 2026-06-02, modular staking sources are expected to live locally under `staking-contracts/`, with no SharedDeposit or infra submodule gitlinks. Current repeatable gates are documented in `AUDIT_WORKFLOW.md` and mirrored by `.github/workflows/audit.yml`. The historical findings below remain useful context, but landing checks should use the current workflow gates and the latest branch commit under review.

## Executive Summary

The V2 modular staking contracts are **well-architected with strong security fundamentals**. The design follows defense-in-depth: granular pause controls, role-based access control, reentrancy guards, and explicit sanity bounds on oracle reports. No critical or high-severity vulnerabilities were found. Several low-severity issues and code-quality items are documented below.

**Overall Risk Rating:** LOW

---

## 1. Access Control Audit

### 1.1 Role Matrix

| Role | StakingCore | StakingRouter | WithdrawalQueueV2 | FeeController | OracleAdapter | QuorumOracleAdapter | ValidatorModule | LSTWrapModule |
|---|---|---|---|---|---|---|---|---|
| DEFAULT_ADMIN_ROLE | ✅ deployer→gov | ✅ deployer→gov | ✅ deployer→gov | ✅ deployer→gov | ✅ deployer→gov | ✅ deployer→gov | ✅ deployer→gov | ✅ deployer→gov |
| GOV | ✅ setFeeController, unpause | ✅ registerModule, setFeeController, setMintCap, setMaxDeltaBps, setMaxTotalPooledEther, setModuleInflowLimit, setPolicyRegistry, setModulePolicy, setDefaultModule, unpauseModule, unpause | ✅ setBunkerMaxRequestsPerFinalize, setBunkerMinRequestAge | ✅ setFee, setRecipients | ✅ setMaxStaleness, setMaxDriftBps, setMaxSlashBps, addSubmitter, removeSubmitter | ✅ setQuorum, setMaxStaleness, setMaxDriftBps, setMaxSlashBps, addSubmitter, removeSubmitter | ✅ unpause | ✅ setPriceOracle, setMaxOracleAge, unpause |
| ORACLE | ✅ reportBeacon | ✅ N/A (reports come from module callbacks) | ✅ updateModeFromOracle | ❌ | ✅ SUBMITTER submits reports | ✅ SUBMITTER votes on reports | ✅ reportBeacon | ❌ |
| GUARDIAN | ✅ pause | ✅ pause, pauseModule, emergencyPauseAll | ✅ finalize (payable) | ❌ | ❌ | ❌ | ✅ pause | ✅ pause |
| NODE_OPERATOR | ✅ notifyBeaconDeposit | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ depositToBeaconChain | ❌ |
| SUBMITTER | ❌ | ❌ | ❌ | ❌ | ✅ submitReport | ✅ submitReport (vote) | ❌ | ❌ |
| MINTER | ❌ | ✅ mintShares, burnShares, setTotalPooledEther (via ST_TOKEN) | ✅ burnShares, setTotalPooledEther (via ST_TOKEN) | ❌ | ❌ | ❌ | ❌ | ❌ |

**Observation:** Role separation is clean. GOV can unpause but cannot pause (GUARDIAN only). This is intentional — emergency response is fast, deliberate unpausing is slower.

### 1.2 Issues Found

#### LOW-01: `StToken.transferAdmin()` does not revoke MINTER from old admin
**File:** `StToken.sol`
**Finding:** `transferAdmin()` grants DEFAULT_ADMIN_ROLE to newAdmin and renounces it from msg.sender, but does not check/revoke MINTER role if the old admin had it.
**Impact:** Low — admin turnover could leave stale MINTER privileges.
**Fix:** Add `revokeRole(MINTER, msg.sender)` in `transferAdmin()` if caller has MINTER.

#### LOW-02 (fixed): `FeeController.recordDistribution()` had no meaningful access control value
**File:** `FeeController.sol`
**Finding:** `recordDistribution()` was `onlyRole(GOV)` but only emitted an event. It did not affect state.
**Impact:** Low — unnecessary function.
**Status:** Fixed — the function has been removed from `FeeController.sol`; fee distribution happens in `StakingCore._distributeFees()` and `StakingRouter._distributeFees()`.

#### LOW-03: `StakingCore` and `StakingRouter` both have `receive()` with no role check
**File:** `StakingCore.sol`, `StakingRouter.sol`
**Finding:** Direct ETH transfers to the contract are treated as deposits. This is by design but means anyone can accidentally send ETH to the contract and it will be counted as a deposit.
**Impact:** Low — funds aren't lost (they mint shares), but unexpected for direct transfers.
**Status:** Acceptable by design.

---

## 2. Reentrancy Audit

### 2.1 Non-Reentrant Coverage

| Contract | Entry Points with `nonReentrant` |
|---|---|
| StakingCore | `submit()`, `submitWithAttribution()`, `receive()` |
| StakingRouter | `submit()`, `submitToModule()`, `submitWithSource()`, `submitToModuleWithSource()`, `receive()`, `reportModuleBeaconBalance()`, `notifyBeaconDeposit()`, `wrapFromModule()`, `unwrapToModule()` |
| WithdrawalQueueV2 | `requestWithdrawals()`, `finalize()`, `claimWithdrawal()`, `claimWithdrawals()` |
| WstToken | `wrap()`, `unwrap()` |
| ValidatorModule | `depositToBeaconChain()` |
| LSTWrapModule | `wrapLST()`, `unwrapLST()` |

### 2.2 Issues Found

#### LOW-04: `StToken` transfer functions lack `nonReentrant`
**File:** `StToken.sol`
**Finding:** `transfer()`, `transferFrom()`, `transferShares()` are not protected by `nonReentrant`. While the contract has no external calls in these functions, it is the central token contract and could be called by reentrancy-sensitive contracts.
**Impact:** Low — no external calls in transfer path, so no exploitable reentrancy vector currently exists.
**Fix:** Add `nonReentrant` to `transfer()` and `transferFrom()` for defense-in-depth if StToken is ever extended with hooks.

#### LOW-05: `ValidatorModule.receive()` is unguarded
**File:** `ValidatorModule.sol`
**Finding:** The `receive()` function accepts ETH and increments `_bufferedEther` but has no `nonReentrant` guard. However, it makes no external calls.
**Impact:** Informational.
**Status:** Acceptable.

---

## 3. Economic / Accounting Audit

### 3.1 Share Math Correctness

**File:** `ShareMath.sol`
**Finding:** Bootstrap case (`totalPooledEth == 0`) returns `ethAmount` as shares. This prevents the classic inflation attack because the attacker cannot manipulate the ratio before shares exist — the first depositor gets exactly what they put in.

**Finding:** Both `getSharesByPooledEth` and `getPooledEthByShares` round DOWN. This protects the pool: minters get slightly fewer shares, redeemers get slightly less ETH. Dust accumulates in the pool benefiting all holders.

**Status:** ✅ Correct.

### 3.2 Issues Found

#### LOW-06: `StakingCore.reportBeacon()` has weak maxPlausible check
**File:** `StakingCore.sol`
**Finding:** `maxPlausible = newBeaconValidators * 32 ether * 2` allows balances up to 2× expected. For a large validator set (e.g., 1000 validators), this permits `64,000 ETH` of distortion.
**Impact:** Low — this is a sanity check, not a security bound. The real protection comes from `maxDeltaBps` and `maxSlashBps` in the OracleAdapter.
**Fix:** Consider making the multiplier configurable or tighter (e.g., 1.5×).

#### LOW-07: `WithdrawalQueueV2.finalize()` sends excess ETH back with `.sendValue()`
**File:** `WithdrawalQueueV2.sol`
**Finding:** If `msg.value > totalEthRequired`, the excess is returned via `Address.sendValue()`. This uses `.call{value:...}("")` internally. The recipient is `msg.sender` (GUARDIAN), which should be a multisig/contract.
**Impact:** Low — no reentrancy risk because `nonReentrant` is on `finalize()`.
**Status:** Acceptable.

#### LOW-08: `WithdrawalQueueV2._enqueueRequest()` reduces `totalPooledEther` before burning shares
**File:** `WithdrawalQueueV2.sol`
**Finding:** The code does:
```solidity
ST_TOKEN.burnShares(msg.sender, shares);
if (currentPooled >= ethValue) {
    ST_TOKEN.setTotalPooledEther(currentPooled - ethValue);
}
```
Between `burnShares` and `setTotalPooledEther`, a reentrant call could observe inconsistent state. However, `requestWithdrawals` has `nonReentrant`.
**Impact:** Low — protected by `nonReentrant`.
**Status:** Acceptable.

#### LOW-09: `StakingRouter._applyBeaconDelta()` clamps pool to 0 on insolvency instead of reverting
**File:** `StakingRouter.sol`
**Finding:** If `currentPooled <= loss`, the pool is set to 0 and `PoolInsolvent` is emitted. This means the exchange rate becomes undefined (0 shares / 0 pooled), and the next depositor resets the pool.
**Impact:** Low — this is a known "socialized loss" design choice.
**Status:** Documented and accepted by design.

#### LOW-10: `StakingRouter.wrapFromModule()` and `unwrapToModule()` have asymmetric cap checks
**File:** `StakingRouter.sol`
**Finding:** `wrapFromModule()` checks `mintCapEth` and `maxTotalPooledEther`. `unwrapToModule()` does not check any cap. This is correct (unwrap reduces pool), but there's no minimum pool size check.
**Impact:** Informational.
**Status:** Acceptable.

---

## 4. Oracle / Report Validation Audit

### 4.1 OracleAdapter Sanity Checks

| Check | Implementation | Status |
|---|---|---|
| Staleness | `reportAge > maxStalenessSeconds` | ✅ |
| Drift (gain) | `gainBps = ((newAvg - prevAvg) * 10000) / prevAvg` | ✅ |
| Slash (loss) | `lossBps = ((lastBeaconBalance - beaconBalance) * 10000) / lastBeaconBalance` | ✅ |
| Future timestamp | `reportTimestamp > block.timestamp` revert | ✅ FIXED |

#### LOW-11: `OracleAdapter.submitReport()` does not reject future timestamps
**File:** `OracleAdapter.sol`
**Finding:** A report with `reportTimestamp > block.timestamp` would pass the staleness check (`reportAge` would be 0 or negative due to unsigned arithmetic underflow... wait, let me re-check).

Actually, looking at the code:
```solidity
uint256 reportAge = block.timestamp > reportTimestamp ? block.timestamp - reportTimestamp : 0;
```
This caps `reportAge` at 0 for future timestamps. So a future timestamp passes with age=0.
**Impact:** Low — submitter is trusted (SUBMITTER role), but this is a missing sanity check.
**Fix:** Add `if (reportTimestamp > block.timestamp) revert FutureReport()`.

**Note:** `QuorumOracleAdapter` already has this check (`if (reportTimestamp > block.timestamp) revert FutureReportTimestamp(...)`). OracleAdapter should match.

### 4.2 QuorumOracleAdapter

**Finding:** The vote-counting mechanism is clean. `reportHash = keccak256(abi.encode(beaconValidators, beaconBalance, reportTimestamp))` uniquely identifies reports. Votes are tracked per-hash per-submitter.

**Finding:** `removeSubmitter()` correctly prevents quorum from exceeding submitter count after removal.

**Status:** ✅ Correct.

---

## 5. Dead / Unnecessary Code Audit

### 5.1 Frontend-only artifacts in contracts

#### INFO-01 (fixed): `FeeController.recordDistribution()` was dead code
**File:** `FeeController.sol`
**Finding:** This function only emitted an event and was `onlyRole(GOV)`. The actual fee distribution happens in `StakingCore._distributeFees()` and `StakingRouter._distributeFees()`, which mint shares directly.
**Status:** Fixed — the function has been removed.

### 5.2 Unused imports

#### INFO-02 (fixed): `StToken.sol` imported `IERC20Metadata` but never used it
**File:** `StToken.sol`
**Finding:** `import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";` was unused.
**Status:** Fixed — the unused import has been removed.

#### INFO-03: `ValidatorModule.sol` imports `IDepositContract` but it's only used in a cast
**File:** `ValidatorModule.sol`
**Finding:** The import is used in `IDepositContract(BEACON_DEPOSIT_CONTRACT).deposit(...)` which is valid usage.
**Status:** Not an issue.

### 5.3 Unused state / functions

#### INFO-04: `StakingRouter._emitFeeRoutingTelemetry()` exists only to avoid stack-too-deep
**File:** `StakingRouter.sol`
**Finding:** The `FeeRoutingData` struct and `_emitFeeRoutingTelemetry()` function exist because the original `_distributeFees()` hit stack depth. The struct fields are all populated then emitted. This is acceptable compiler workaround.
**Status:** Acceptable.

---

## 6. Best Practices / Code Quality

### 6.1 Events

| Contract | Event Coverage | Status |
|---|---|---|
| StakingCore | ✅ All state changes emit events | Good |
| StakingRouter | ✅ All state changes emit events | Good |
| WithdrawalQueueV2 | ✅ All state changes emit events | Good |
| StToken | ✅ All mints/burns/transfers emit events | Good |
| WstToken | ✅ Wrap/unwrap emit events | Good |

### 6.2 Error Messages

All contracts use custom errors (Solidity 0.8.4+) instead of revert strings. This is gas-efficient and aligns with Uniswap V3 style.

### 6.3 NatSpec

Most functions have NatDoc comments. Some internal functions lack documentation.

---

## 7. Permission Escalation / Privilege Analysis

### 7.1 MINTER role is the most powerful

**Who holds MINTER:**
- `StakingCore` (constructor grants MINTER on `StToken`)
- `StakingRouter` (constructor grants MINTER on `StToken`)
- `WithdrawalQueueV2` (does NOT have MINTER — it calls `burnShares` via ST_TOKEN, but the queue itself must be granted MINTER)

Wait — let me re-check. In `WithdrawalQueueV2._enqueueRequest()`:
```solidity
ST_TOKEN.burnShares(msg.sender, shares);
ST_TOKEN.setTotalPooledEther(currentPooled - ethValue);
```

`burnShares` is `onlyRole(MINTER)`. `setTotalPooledEther` is `onlyRole(MINTER)`. So `WithdrawalQueueV2` must have been granted MINTER role. This is correct — the deploy script should grant MINTER to both StakingCore and WithdrawalQueueV2.

### 7.2 GOV role takeover path

If GOV key is compromised:
1. Attacker can `setFeeController()` to their own contract → mint arbitrary fee shares
2. Attacker can `registerModule()` → mint unlimited shares through a malicious module
3. Attacker can `unpause()` anything
4. Attacker can `setMaxDeltaBps(10000)` → allow 100% gains per report

**Mitigation:** GOV should be a timelocked multisig. This is documented but not enforced in code.

### 7.3 GUARDIAN role misuse

If GUARDIAN key is compromised:
1. Attacker can `pause()` everything
2. Attacker can `finalize()` withdrawals (but must send ETH)
3. Attacker cannot unpause (GOV only)
4. Attacker cannot mint shares

**Mitigation:** GUARDIAN should be a fast-response multisig (2-of-3 or similar).

---

## 8. Slither / Static Analysis Residuals

From the prior security review, 2 medium findings remain:

### 8.1 `divide-before-multiply` in `FeeController.computeFees()`
**File:** `FeeController.sol`
**Finding:** `(rewards * feeBps) / 10000` then `(totalFee * treasurySplitBps) / 10000`. The intermediate division loses precision.
**Impact:** Low — fees are small, precision loss is at most 1 wei per division.
**Status:** Accepted by design.

### 8.2 `locked-ether` in `StakingCore`
**File:** `StakingCore.sol`
**Finding:** Contract holds ETH but has no function to withdraw arbitrary ETH.
**Impact:** Low — ETH is accounted for in `_bufferedEther` and exits through `WithdrawalQueueV2`.
**Status:** Accepted by design.

---

## 9. Recommendations

### Immediate (fix before audit)

1. **LOW-01:** ~~Add `revokeRole(MINTER, msg.sender)` in `StToken.transferAdmin()`~~ **FIXED** — MINTER role is now revoked in `transferAdmin()`.
2. **LOW-11:** ~~Add future-timestamp rejection in `OracleAdapter.submitReport()`~~ **FIXED** — future timestamps now rejected at line 86.
3. **INFO-01:** ~~Remove or repurpose `FeeController.recordDistribution()`~~ **FIXED** — function removed.
4. **INFO-02:** ~~Remove unused `IERC20Metadata` import from `StToken.sol`~~ **FIXED** — import removed.

### Short-term (pre-mainnet)

5. Add `nonReentrant` to `StToken.transfer()` and `transferFrom()` for defense-in-depth
6. Tighten `maxPlausible` multiplier from 2× to 1.5× in `StakingCore.reportBeacon()`
7. Document the "socialized loss to 0" behavior in `StakingRouter._applyBeaconDelta()` more explicitly
8. Consider adding a `maxTotalPooledEther` cap to `StakingCore` (currently only in Router)

### Documentation

9. Add a "Risk Acceptance" section to the operational runbook for the 2 Slither medium findings
10. Document the exact GOV → timelock migration path in deployment scripts

---

**Agent:** Codex GPT-5
**Co-authored-by:** Chimera <chimera_defi@protonmail.com>
