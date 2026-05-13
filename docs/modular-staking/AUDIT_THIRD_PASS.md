# SharedStake V2 Modular Staking — Third Pass Security Audit

**Date:** 2026-05-12
**Auditor:** Claude (Codex GPT-5)
**Scope:** `SharedDeposit/contracts/v2/modular-staking/` + `SharedDeposit/contracts/v2/governance/`
**Previous audits:** First pass (15 findings), Second pass (8-agent analysis)
**Status:** All previously-documented HIGH/CRITICAL findings resolved

---

## Summary

This audit focused on contracts changed since the second pass:
- `StakingRouter.sol` — maxDeltaBps lowered to 100 (1%)
- `ValidatorModule.sol` — `receive()` no longer increments `_bufferedEther`
- `ReferralRegistry.sol` — constructor now requires `feeToken`
- `VoteEscrowV2.sol` — new governance contract
- `SharedStakeGovernor.sol` — new governance contract
- `GovernanceTimelock.sol` — new timelock contract

**Verdict:** No new CRITICAL or HIGH findings. 3 MEDIUM findings (all accepted by design or with documented mitigations). 4 LOW/INFO findings (cosmetic or documentation).

---

## New Findings

### MEDIUM-01: StakingRouter._distributeFees() — rounding divergence in fee share allocation

**Location:** `StakingRouter.sol:386-430`

**Description:**
Fee shares are computed individually for treasury, operator, and referral pool:
```solidity
uint256 treasuryShares = ShareMath.getSharesByPooledEth(treasuryAmount, newTotalShares, newTotalPooled);
uint256 operatorShares  = ShareMath.getSharesByPooledEth(operatorAmount,  newTotalShares, newTotalPooled);
uint256 referralShares  = ShareMath.getSharesByPooledEth(referralAmount,  newTotalShares, newTotalPooled);
```

Each division rounds DOWN. The sum of the three may be 1-2 wei less than the proportional shares for `totalFee`. This means fee recipients collectively receive slightly less than the exact fee percentage, with the residual staying in the pool (benefiting all stakers).

**Impact:** At most 2 wei per fee distribution. Over billions of distributions, negligible.

**Mitigation:** Accepted by design. The residual benefits the pool. To eliminate entirely, compute referral shares as `totalFeeShares - treasuryShares - operatorShares`.

**Status:** Documented. No fix required.

---

### MEDIUM-02: QuorumOracleAdapter — slash check conflates validator exits with slashes

**Location:** `QuorumOracleAdapter.sol:144-148`

**Description:**
```solidity
if (lastBeaconBalance > 0 && beaconBalance < lastBeaconBalance) {
    uint256 lossBps = ((lastBeaconBalance - beaconBalance) * 10000) / lastBeaconBalance;
    if (lossBps > maxSlashBps) revert SlashTooLarge(lossBps, maxSlashBps);
}
```

If validators exit (not slash), the beacon balance decreases by 32 ETH per validator. With `maxSlashBps = 500` (5%), exiting more than ~5 validators out of 100 would trigger the slash check.

**Impact:** Could block legitimate oracle reports during validator rotation.

**Mitigation:**
1. Validator exits should be coordinated with GOV temporarily raising `maxSlashBps`.
2. Future upgrade: track validator count changes and adjust slash calculation to `lossBps = ((lastAvg - newAvg) * 10000) / lastAvg` where avg = balance/validators.

**Status:** Accepted by design for launch. Documented in DEPLOYMENT_GUIDE.md.

---

### MEDIUM-03: VoteEscrowV2 — emergencyWithdraw allows voting power manipulation across proposals

**Location:** `VoteEscrowV2.sol:131-153`

**Description:**
A user can:
1. Lock SGT → receive veSGT voting power
2. Vote on Proposal A (checkpoint frozen at proposal start block)
3. `emergencyWithdraw()` (pay 30% penalty)
4. Re-lock SGT → receive fresh veSGT
5. Vote on Proposal B

This allows the same economic capital to vote on multiple proposals sequentially.

**Impact:** 
- NOT exploitable within a single proposal (OZ Governor checkpoints at proposal start block)
- Cross-proposal: capital can be recycled, but penalty (30%) makes it expensive
- For 1000 veSGT threshold: cost = 300 SGT per proposal vote

**Mitigation:**
- Penalty rate (30%) provides economic disincentive
- Future upgrade: add minimum lock duration before voting eligibility

**Status:** Accepted by design. Curve and similar ve systems have the same property.

---

## LOW / INFO Findings

### LOW-01: StToken.transferFrom() uses wrong error for allowance check

**Location:** `StToken.sol:102`

```solidity
if (currentAllowance < amount) revert Errors.InsufficientBalance();
```

Should be `InsufficientAllowance()` for clarity. Functional behavior is correct.

**Fix:** Add `InsufficientAllowance` to `Errors.sol` and use it here.

---

### LOW-02: VoteEscrowV2._deposit_for() uses `require()` in unreachable path

**Location:** `VoteEscrowV2.sol:246`

```solidity
require(_locked.end - _now <= MAXTIME, "Cannot extend lock beyond max");
```

The else branch is unreachable from external entry points. If reached, should use custom error.

**Fix:** Replace with custom error for consistency.

---

### LOW-03: StToken.transfer() — 0-share transfers possible with dust amounts

**Location:** `StToken.sol:173-178`

For very small amounts relative to totalPooledEther/totalShares, `getSharesByPooledEth()` rounds down to 0. The Transfer event emits the original amount but 0 shares move.

**Impact:** UI inconsistency only. No economic impact.

**Fix:** Add `if (shares == 0) revert Errors.InvalidAmount()` in `_transfer()`.

---

### INFO-01: WithdrawalQueueV2.receive() lacks ETH recovery path

**Location:** `WithdrawalQueueV2.sol:302`

Direct ETH transfers increase contract balance without increasing `lockedEther`. The excess shows in `availableEther()` but can't be assigned to any specific claimer.

**Impact:** ETH could be stranded if sent directly.

**Fix:** Add `recoverEth()` GOV function (similar to ReferralRegistry).

---

## Verified Fixes (from previous sessions)

| Finding | File | Verification |
|---|---|---|
| ValidatorModule unbacked ETH | `ValidatorModule.sol:205` | `receive()` no longer increments `_bufferedEther` ✓ |
| maxDeltaBps default | `StakingRouter.sol:108` | Default 100 (1%), hard ceiling 1000 ✓ |
| ReferralRegistry feeToken | `ReferralRegistry.sol:79` | Constructor requires `_feeToken` ✓ |
| LOW-01 (first pass) | `StToken.sol:159` | `transferAdmin()` revokes MINTER ✓ |
| LOW-04 (first pass) | `StToken.sol:96,107` | `nonReentrant` on transfer/transferFrom ✓ |

---

## Recommendations for Pre-Mainnet

1. **Fix LOW-01, LOW-02, LOW-03** — cosmetic but improve error clarity
2. **Add `recoverEth()` to WithdrawalQueueV2** — prevents stranded ETH
3. **Document validator exit procedure** — coordinate with `maxSlashBps` adjustment
4. **Consider fee share rounding fix** — compute referral shares as residual
5. ~~**Run Foundry invariant tests**~~ — ✅ **DONE 2026-05-12**: `forge test` → 7 passed, 0 failed (Node 24 / Foundry 1.7.1)
6. **Fork test against mainnet beacon deposit contract** — validate deposit flow
7. **External human audit** — engage professional firm for final review

---

## Invariant Checklist (Verified)

| Invariant | Status | Evidence |
|---|---|---|
| totalSupply == totalPooledEther | ✓ | StToken.totalSupply() returns _totalPooledEther |
| Shares mint 1:1 at bootstrap | ✓ | ShareMath.getSharesByPooledEth() |
| Shares round down on mint | ✓ | Protects pool from inflation |
| ETH rounds down on redeem | ✓ | Protects pool from drain |
| Only MINTER can mint/burn/setPool | ✓ | StToken.onlyRole(MINTER) |
| Router is sole MINTER | ✓ | Router constructor + addMinter |
| Module callbacks only from registered addr | ✓ | `_requireModuleCaller()` |
| Reentrancy guarded on all external entry points | ✓ | `nonReentrant` on submit, wrap, unwrap, claim |
| GOV can unpause, GUARDIAN can only pause | ✓ | AccessControl roles |
| Timelock on governance actions | ✓ | GovernanceTimelock 48h delay |

---

---

## Test Suite Results (2026-05-12 Rerun)

| Suite | Command | Result |
|---|---|---|
| Hardhat (all specs) | `npx hardhat test test/v2/modular-staking/*.spec.ts` | **236 passing, 3 pending, 0 failing** |
| Foundry invariants | `forge test --match-path test/foundry/ModularStakingInvariants.t.sol` | **7 passing, 0 failing** |

**Environment:** Node v24.13.1, Hardhat 11.14.0, Forge 1.7.1

---

**Auditor:** Codex GPT-5 / Claude Sonnet 4.6
**Co-authored-by:** Chimera <chimera_defi@protonmail.com>
