# Lido-Parity DeFi Core — Architecture & Threat Model

> Phase: PR 379 launch-readiness hardening
> Status: Internal audit and local verification in progress
> Last updated: 2026-06-01

---

## 1. Overview

This document captures the module boundaries, trust assumptions, storage design, and threat model for the SharedStake V2 Lido-parity staking core. It accompanies the implementation in `staking-contracts/contracts/v2/modular-staking/`.

### Goal

Users can:
1. Deposit ETH → receive rebasing **stETH** shares.
2. Wrap stETH → non-rebasing **wstETH** for DeFi composability.
3. Request withdrawals via a **queue** → claim ETH after guardian finalization.

Protocol earns a fee on beacon rewards; fees accrue as shares minted to treasury and operator addresses.

---

## 2. Module Map

```
┌─────────────────────────────────────────────────────────────────┐
│  User                                                           │
│    │ submit(ETH)         │ wrap/unwrap         │ requestWithdrawal │ claimWithdrawal
│    ▼                     ▼                     ▼                ▼
│  StakingCore ──────► StToken (rebasing) ◄── WstToken     WithdrawalQueueV2
│    │                     │                               │
│    │ reportBeacon         │ mint/burn shares              │ burn shares
│    ▼                     │                               │ on request,
│  OracleAdapter ──────────┘                               │ send ETH
│    │                                                     │ on claim
│    │ validate report                              FeeController
│    │                                            (fee config only;
│  FeeController ◄──── StakingCore (on rewards)   no ETH held)
└─────────────────────────────────────────────────────────────────┘
```

### Contract Responsibilities

| Contract | Responsibility |
|---|---|
| `ShareMath` | Pure library: `getSharesByPooledEth`, `getPooledEthByShares`, `sharePrice`. Deterministic rounding (floor). |
| `StToken` | Rebasing ERC20. Stores shares (`_sharesOf`); `balanceOf` is computed. `totalSupply` = `totalPooledEther`. |
| `WstToken` | Non-rebasing ERC4626-like wrapper. Holds stTokens; each wstToken = 1 share in stToken. |
| `StakingCore` | Entry point for ETH. Mints shares on deposit. Requires explicit beacon-baseline initialization (`notifyBeaconDeposit`) before positive oracle reports; triggers fee distribution on net rewards only. |
| `WithdrawalQueueV2` | Three-step queue: request (burn shares) → finalize (guardian sends ETH) → claim (user receives ETH). |
| `FeeController` | Stores fee bps and recipient addresses. Provides `computeFees(rewards)` view. |
| `OracleAdapter` | Validates oracle reports (staleness, drift, slash bounds). Calls `StakingCore.reportBeacon`. |

---

## 3. Share Accounting

### Canonical Formulas

```
shares(ethAmount) = ethAmount × totalShares / totalPooledEther   [floors; bootstrap 1:1]
eth(sharesAmount) = sharesAmount × totalPooledEther / totalShares [floors]
```

### Bootstrap Invariant

When `totalPooledEther == 0`: `shares = ethAmount`. The first depositor cannot inflate the share price by pre-sending ETH because `totalPooledEther` is the single source of truth (not the ETH balance of StakingCore).

### Rounding Policy

All divisions floor. This means:
- Minters receive ≤ their ETH entitlement in shares (pool never over-issued).
- Redeemers receive ≤ their share entitlement in ETH (pool never over-drained).
- Accumulated dust stays in the pool (benefits all share holders proportionally).

---

## 4. Role Matrix

| Role | Held By | Can Call |
|---|---|---|
| `DEFAULT_ADMIN_ROLE` | Deployer → transferred to multisig | `grantRole`, `revokeRole` |
| `GOV` (keccak "GOV") | DAO timelock / multisig | `setFeeController`, `unpause`, `setFee`, `setRecipients`, `setMaxStaleness/Drift/Slash`, `addSubmitter` |
| `ORACLE` | OracleAdapter contract | `StakingCore.reportBeacon` |
| `GUARDIAN` | Multisig (can act without timelock) | `pause`, `WithdrawalQueueV2.finalize` |
| `NODE_OPERATOR` | Validator operations key (or governance during bootstrap) | `StakingCore.notifyBeaconDeposit` |
| `MINTER` | StakingCore + WithdrawalQueueV2 | `StToken.mintShares`, `burnShares`, `setTotalPooledEther` |
| `SUBMITTER` | Oracle infrastructure keys | `OracleAdapter.submitReport` |

### Delay Requirements (Pre-Mainnet Requirement)

| Action | Required Delay |
|---|---|
| Set fee rate | 48h timelock |
| Change fee recipients | 48h timelock |
| Grant new MINTER | 72h timelock |
| Change oracle sanity bounds | 24h timelock |
| Pause (emergency) | Immediate (GUARDIAN) |
| Unpause | GOV (no timelock; requires deliberate decision) |

> Note: Timelock wiring is implemented in deploy scripts (`013_governance.ts` and `014_governanceHandover.ts`); non-local releases must verify governance/timelock execution before accepting TVL.

---

## 5. Upgrade / Immutability Decision

**Decision: Immutable (no proxy).**

Rationale:
- Eliminates proxy-specific attack surface (storage collision, upgrade authorization bypass).
- Consistent with SharedStake V2 design posture.
- Migration path: deploy new system, add new StakingCore as MINTER on shared StToken (if token is kept) or deploy fresh StToken.

---

## 6. Threat Model

### Assets at Risk

| Asset | Where Held | Risk |
|---|---|---|
| Buffered ETH | StakingCore | Drain via malicious MINTER or reentrancy |
| Beacon ETH | Validators | Oracle reporting manipulation |
| stToken shares | StToken._sharesOf | Unauthorized mint or accounting error |
| Finalized ETH (queue) | WithdrawalQueueV2 | Claim by wrong address; double-claim |

### Actor Trust Levels

| Actor | Trust Level | Notes |
|---|---|---|
| GOV multisig | High | Time-delayed actions reduce blast radius |
| GUARDIAN | Medium | Only pause + finalize; cannot drain |
| ORACLE submitter | Low-medium | Sanity bounds enforce limits even if compromised |
| Regular users | Untrusted | All user inputs validated |
| External DeFi protocols | Untrusted | WstToken holds stTokens; external contract can't force burns |

### Threat Scenarios

| # | Scenario | Path | Mitigation | Status |
|---|---|---|---|---|
| T1 | Malicious oracle inflates beacon balance | Oracle.submitReport → overstated beaconBalance → mass fee minting | `maxDriftBps` + `maxSlashBps` limits; sanity check in StakingCore | ✅ Mitigated |
| T2 | Stale oracle halts protocol | Last oracle report is old; totalPooledEther stale | `maxStalenessSeconds` gate in OracleAdapter; GUARDIAN can pause | ✅ Mitigated |
| T3 | Unauthorized share minting | Direct call to StToken.mintShares | MINTER role required; only StakingCore + WithdrawalQueueV2 hold it | ✅ Mitigated |
| T4 | Withdrawal double-claim | User calls claimWithdrawal twice | `claimed` bool checked first; reentrancy guard | ✅ Mitigated |
| T5 | Withdrawal before finalization | User claims before guardian finalizes | `finalized` bool checked | ✅ Mitigated |
| T6 | Claim by non-owner | Bob claims Alice's withdrawal | `owner != msg.sender` check | ✅ Mitigated |
| T7 | Flash-loan amplified deposit | Deposit large ETH, withdraw before rebase | No same-block withdrawal (queue requires finalization) | ✅ Mitigated |
| T8 | Fee inflation via fake rewards | Compromised oracle reports enormous rewards | `maxDriftBps` per-validator cap limits fee inflation | ✅ Mitigated |
| T9 | Governance key compromise | GOV grants malicious MINTER | Timelock delay; multisig threshold; guardian pause/cancel flow | Release gate: verify timelock role handoff |
| T10 | Admin key loss | DEFAULT_ADMIN locked in contract | Multi-sig admin; key rotation procedure | ⚠️ Operational |
| T11 | ETH stuck in StakingCore | receive() fallback used unexpectedly | receive() counts as deposit; no silent ETH loss | ✅ Mitigated |
| T12 | WstToken depeg (can't unwrap) | Insufficient stTokens in WstToken | WstTokens rebase in place; total stToken ≥ total wstToken × rate | ✅ Structural |
| T13 | Share price manipulation (first depositor) | First depositor donates ETH to StakingCore to inflate rate | Pool tracks `totalPooledEther` explicitly, not contract balance | ✅ Mitigated |
| T14 | Pause bricking withdrawals | GUARDIAN pauses submit but not claim | `PAUSE_SUBMIT` only disables deposits; claims remain open | ✅ Design |
| T15 | Integer overflow in ShareMath | Large values cause overflow | Solidity 0.8 checked arithmetic; fuzz tests | ✅ Mitigated |
| T16 | First positive report counts principal as rewards | Oracle reports positive beacon balance before baseline transfer is tracked | `notifyBeaconDeposit` required before positive reports in core/router | ✅ Mitigated |

---

## 7. External Integration Failure Modes

| Integration | Failure Mode | Handling |
|---|---|---|
| ETH2 Beacon chain | Validator slashing | Oracle drift bounds; slash scenario tests |
| ETH2 Beacon chain | Network offline | Stale oracle guard; GUARDIAN can pause; claims remain open |
| Fee recipients | Treasury/operator address misconfigured | Fee shares minted to address; no ETH lost |
| WstToken ↔ StToken | Rounding on wrap/unwrap | Structural: floor rounding; max 1 wei dust per operation |

---

## 8. Invariants (Enforced in Tests)

1. `stToken.totalSupply() == stToken.totalPooledEther()` at all times.
2. No user can claim more ETH from WithdrawalQueueV2 than was provided in finalize.
3. `stToken.balanceOf(account) == stToken.getPooledEthByShares(stToken.sharesOf(account))`.
4. `WithdrawalQueueV2.lockedEther <= address(withdrawalQueueV2).balance` always.
5. Fee shares minted ≤ `rewards × feeBps / 10000` (at current exchange rate).
6. Exchange rate is monotonically non-decreasing except on slash events.
7. Positive beacon reports require baseline initialization (`notifyBeaconDeposit`) before reward deltas are accepted.

---

## 9. Test Coverage Requirements

| Suite | Target Coverage | Notes |
|---|---|---|
| ShareMath | 100% lines | Pure library; all branches exercisable |
| StToken | ≥95% lines, ≥90% branches | Rebasing math + access control |
| StakingCore | ≥95% lines | Deposit + oracle + fee paths |
| WithdrawalQueueV2 | ≥95% lines | All lifecycle states |
| FeeController | ≥95% lines | |
| OracleAdapter | ≥95% lines | All rejection paths |
| E2E | Full happy path | Deposit → rebase → wrap → withdraw → finalize → claim |

---

## 10. Deployment Checklist (Pre-Mainnet)

- [ ] External audit complete; all High/Critical findings fixed
- [ ] Invariant fuzz campaign (≥1M runs) clean
- [ ] Static analysis (Slither) clean for agreed rule set
- [ ] Timelock contract deployed and GOV transferred
- [ ] Multisig threshold ≥ 3-of-5
- [ ] Guardian key held by separate security team member
- [ ] OracleAdapter submitter key on separate HSM
- [ ] Monitoring active: queue backlog, share price delta, oracle freshness
- [ ] 72h heightened monitoring window post-deploy
- [ ] Rollback playbook rehearsed

---

## 11. Phase 2 Extensions (Implemented)

- Quorum oracle path:
  - `QuorumOracleAdapter` adds N-of-M submitter voting, duplicate-vote prevention, staleness bounds, drift/slash guards, and single-finalization semantics.
- Queue risk-mode controls:
  - `WithdrawalQueueV2` supports `TURBO` and `BUNKER` modes with bunker batch-size and minimum-age finalization constraints.
- Router risk-budget controls:
  - `StakingRouter` enforces per-module inflow windows, module pause flags, and global emergency submit pause.
  - Positive beacon reports now require prior `notifyBeaconDeposit` baseline initialization to avoid principal being miscounted as rewards.
- Core baseline guard:
  - `StakingCore` now requires `notifyBeaconDeposit` before positive oracle reports and rejects oversize baseline moves above buffered ETH.
- Institutional policy hooks:
  - `InstitutionalPolicyRegistry` can be attached per module for permissionless/allowlist/blocklist/private modes.
- Attribution + fee telemetry:
  - Additive attribution entrypoints and events landed in `StakingCore`/`StakingRouter`.
  - Fee-routing telemetry events now emitted on reward fee-minting paths.
