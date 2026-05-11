# Execution Plan — SharedStake V2 Hardening, Governance, Referrals, Security

**Date:** 2026-05-08
**Branch:** `feat/sharedstake-v2-modular-staking-master`

## Objectives

1. **Fix all remaining audit findings** (LOW-04 through LOW-11, open recommendations)
2. **Build proper on-chain governance** — OZ Governor + TimelockController + veSGT integration
3. **Build referral system** — contract attribution, fee sharing, frontend capture
4. **Document module architecture** vs Rocket Pool, Lido, etc.
5. **Multiple security review passes** — fix issues as we build

---

## Phase 1: Remaining Audit Fixes (Parallel)

### 1.1 LOW-04: Add `nonReentrant` to `StToken.transfer()` and `transferFrom()`
- `StToken.sol` needs `ReentrancyGuard` import and `nonReentrant` on transfer functions

### 1.2 LOW-06: Tighten `maxPlausible` from 2× to 1.5× in `StakingCore.reportBeacon()`
- Change `32 ether * 2` to `32 ether * 3 / 2` or add configurable parameter

### 1.3 LOW-08: Atomic state update in `WithdrawalQueueV2._enqueueRequest()`
- Reorder: `setTotalPooledEther` BEFORE `burnShares` so rate is consistent during the tx
- Or document the ordering is intentional (protected by `nonReentrant`)

### 1.4 INFO-04: Simplify `_emitFeeRoutingTelemetry()` in `StakingRouter`
- The struct allocation is wasteful. Use inline emit or pack differently.

---

## Phase 2: Governance Infrastructure

### 2.1 Architecture Decision: OZ Governor vs Aragon

**Aragon:**
- Heavyweight, full DAO framework
- Requires Aragon OSx deployment
- More suitable for large organizations with complex governance

**OpenZeppelin Governor:**
- Lightweight, battle-tested (Compound, Uniswap, etc.)
- Easier to integrate with existing contracts
- Standard `Governor`, `GovernorTimelockControl`, `GovernorVotes`
- Works with any ERC20Votes or ERC721Votes token

**Decision:** Use **OpenZeppelin Governor** with **TimelockController**.
- Lighter weight, easier to audit, industry standard
- Aragon can be added later as a "wrapper" if needed
- Faster to ship

### 2.2 Governance Components

| Component | Purpose | Notes |
|---|---|---|
| `veSGT` (VoteEscrow) | Already exists — locks SGT for voting power | Need `ERC20Votes` compatibility |
| `TimelockController` | Delay all GOV actions by 48h | Will hold GOV role on all contracts |
| `SharedStakeGovernor` | OZ Governor using veSGT as votes | Propose/vote/queue/execute pattern |

### 2.3 Governance Wiring

- Deploy `TimelockController` with 48h delay
- Deploy `SharedStakeGovernor` with:
  - `veSGT` as voting token (need to check if VoteEscrow is ERC20Votes compatible)
  - `TimelockController` as executor
  - Voting delay: 1 block
  - Voting period: ~1 week (40,320 blocks @ 15s)
  - Proposal threshold: e.g. 1000 veSGT
  - Quorum: 4% of total supply
- Transfer GOV role on ALL contracts from deployer to `TimelockController`
- Transfer DEFAULT_ADMIN_ROLE on `StToken` to `TimelockController`

### 2.4 VoteEscrow → ERC20Votes

Current `VoteEscrow` is NOT ERC20Votes compatible. It needs:
- Inherit `ERC20Votes` instead of `ERC20`
- Override `_getVotingPower(address)` to return the lock-derived voting power
- Or create a `VeSGTVotes` wrapper that delegates to VoteEscrow

Actually, looking at VoteEscrow: it already inherits `ERC20Votes`! Check the constructor:
```solidity
contract VoteEscrow is ERC20Votes, ReentrancyGuard, Ownable, IVotingEscrow
```
So it IS ERC20Votes compatible. The `_mint()` calls in `_deposit_for` will automatically checkpoint voting power.

But the voting power should be the lock-derived value, not the balance. In Curve's design, the veToken balance IS the voting power (it decays over time). Looking at the code, `voting_power_unlock_time` returns the decaying power, but `_deposit_for` mints `_vp` which is the initial voting power.

Wait — `ERC20Votes` automatically checkpoints `balanceOf` as voting power. If we mint `_vp` tokens, then the voting power is `_vp`. But as the lock decays, the voting power should decrease without burning tokens. This is a problem.

In Curve's design, the veToken contract overrides `balanceOf` to return the decaying voting power. But `ERC20Votes` uses `_balances` internally for checkpoints. So we need to:
- Override `_getVotingPower(address)` (or the OZ equivalent) to return `voting_power_unlock_time(locked[_addr].amount, locked[_addr].end)`

Or simpler: create a `VeTokenVoting` contract that wraps VoteEscrow and exposes the decaying power as ERC20Votes.

Actually, OZ's `ERC20Votes` calls `_getVotingUnits(address)` which defaults to `balanceOf`. We can override `_getVotingUnits` to return the decaying lock power.

### 2.5 Changes to VoteEscrow

- Add `delegate()` / `delegates()` support (already in ERC20Votes)
- Override `_getVotingUnits(address)` to return `voting_power_unlock_time(locked[account].amount, locked[account].end)`
- This way, voting power decays automatically as the lock approaches expiry

---

## Phase 3: Referral System

### 3.1 Contract Layer

The contracts already have basic attribution:
- `submit(address referral)` — referral address
- `submitWithAttribution(address referral, bytes32 sourceId)` — source tracking

What's missing:
1. **Persistent referral tracking** — who referred whom, how much they staked
2. **Referrer fee accrual** — % of protocol fees go to referrers
3. **Claim mechanism** — referrers claim their accrued fees

### 3.2 Design

**ReferralRegistry contract:**
- Maps `referrer => referee => {totalReferredEth, totalReferredShares}`
- Maps `referrer => {accruedFeeShares, claimedFeeShares}`
- Fee rate: e.g. 10% of protocol fees go to referrer
- Admin: GOV can set fee rate

**FeeController changes:**
- Add `referralFeeBps` — % of total fee that goes to referral program
- Split: `treasury + operator + referralPool`
- When fees are distributed, referral portion is sent to `ReferralRegistry`

**StakingCore/StakingRouter changes:**
- Call `ReferralRegistry.recordDeposit(referral, msg.value)` on each deposit
- Minimal gas overhead

### 3.3 Frontend Layer

- Capture referral from URL: `?ref=0x...`
- Store in localStorage for persistence
- Pass to `submit(referral)` on stake
- Show "Your Referrals" dashboard with earnings

---

## Phase 4: Module Architecture vs Competitors

### 4.1 Solo Validator Module vs Rocket Pool

| Dimension | Rocket Pool | SharedStake ValidatorModule |
|---|---|---|
| **Entry** | rETH (rebasing) | stETH (rebasing) |
| **Validator deposit** | 16 ETH from pool + 16 ETH from node operator | 32 ETH from module buffer |
| **Node operator bond** | 16 ETH + RPL collateral | No bond required (trusted NODE_OPERATOR role) |
| **Slash insurance** | RPL collateral slashed | Socialized loss via exchange rate |
| **Oracle** | ODAO (consensus) | Single/quorum oracle adapter |
| **Minipool** | Minipool contract per validator | No per-validator contract |
| **Exit queue** | rETH can be swapped instantly | WithdrawalQueueV2 (request→finalize→claim) |

### 4.2 Comparison to Lido

| Dimension | Lido | SharedStake Modular |
|---|---|---|
| **Token** | stETH (rebasing) + wstETH | stETH + wstETH |
| **Withdrawals** | Post-Merge withdrawal queue | WithdrawalQueueV2 (TURBO/BUNKER) |
| **Modules** | Single curated set | StakingRouter with multiple module types |
| **Oracle** | Committee of 5 | Configurable (single/quorum) |
| **Fees** | 10% split | Configurable via FeeController |
| **Node operators** | Permissioned + DAO-gated | Permissioned (GOV sets NODE_OPERATOR) |

---

## Phase 5: Security Review Passes

### Pass 2: Post-governance review
- Review all new governance contracts (Governor, TimelockController)
- Verify role transfers are atomic and irreversible
- Check proposal threshold doesn't block emergency actions

### Pass 3: Post-referral review
- Review ReferralRegistry for reentrancy
- Verify fee split arithmetic is safe (no overflow, correct %)
- Check referrer cannot refer themselves

### Pass 4: Integration review
- Review Governor → Timelock → StakingRouter call path
- Verify veSGT voting power decays correctly in Governor
- Check timelock delay doesn't block emergency GUARDIAN actions

---

## Execution Order

1. **Fix audit findings** (LOW-04, LOW-06, LOW-08) + run tests
2. **Governance contracts** — Governor + TimelockController
3. **VoteEscrow modifications** — `_getVotingUnits` override
4. **ReferralRegistry contract** + FeeController updates
5. **Frontend** — referral capture dashboard
6. **Security Pass 2** — governance
7. **Security Pass 3** — referral
8. **Security Pass 4** — integration
9. **Docs** — architecture comparison, deployment guide

---

## Delegation Map

| Task | Scope | Agent |
|---|---|---|
| Audit fixes (contract edits) | `SharedDeposit/contracts/v2/` | Local |
| Governor + TimelockController | New contracts | Local |
| VoteEscrow modifications | `contracts/governance/` | Local |
| ReferralRegistry | New contract + FeeController edits | Local |
| Frontend referral capture | `src/components/ModularStaking/` | Local |
| Security review passes | Analysis + fixes | Local |
| Architecture docs | `docs/modular-staking/` | Kimi subagent (draft) |
| Deployment scripts | `deploy/v2-modular-staking/` | Local |

---

**Agent:** Codex GPT-5
**Co-authored-by:** Chimera <chimera_defi@protonmail.com>
