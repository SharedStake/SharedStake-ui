# Handoff: SharedStake V2 Hardening → Claude

**Date:** 2026-05-12
**Branch:** `feat/sharedstake-v2-modular-staking-master`
**Status:** PR #378 active, 236 Hardhat tests + 7 Foundry invariants passing, pre-commit green
**Previous Agent:** Codex GPT-5 → Claude continuation
**Next Agent:** TBD

---

## 0. First Things First

Read these files IMMEDIATELY before doing anything:
1. `/root/.openclaw/workspace/dev/SharedStake-ui/.worktrees/main/SharedDeposit/contracts/v2/governance/VoteEscrowV2.sol`
2. `/root/.openclaw/workspace/dev/SharedStake-ui/.worktrees/main/SharedDeposit/contracts/v2/governance/SharedStakeGovernor.sol`
3. `/root/.openclaw/workspace/dev/SharedStake-ui/.worktrees/main/SharedDeposit/contracts/v2/governance/GovernanceTimelock.sol`
4. `/root/.openclaw/workspace/dev/SharedStake-ui/.worktrees/main/SharedDeposit/contracts/v2/modular-staking/ReferralRegistry.sol`
5. `/root/.openclaw/workspace/dev/SharedStake-ui/.worktrees/main/SharedDeposit/contracts/v2/modular-staking/StakingRouter.sol`

---

## 1. What Was Done (Codex GPT-5 Session)

### Session 2: Claude Continuation (2026-05-12)

#### Security Hardening
| Finding | File | Fix |
|---|---|---|
| **CRITICAL** | `ValidatorModule.sol` | `receive()` no longer increments `_bufferedEther` — prevents unbacked ETH from inflating `totalEth()` and breaking Router accounting invariant |
| **MEDIUM** | `ReferralRegistry.sol` | Constructor now requires `feeToken` address — prevents `claimFees()` revert from `IERC20(address(0))` |
| **LOW** | `ReferralRegistry.sol` | Added `recoverEth()` for GOV to rescue accidentally sent ETH |
| **LOW** | `StakingRouter.sol` | `maxDeltaBps` default lowered from 1000 (10%) → 100 (1%); hard ceiling at 1000 enforced in setter |

#### Frontend Integration
| Feature | File | Description |
|---|---|---|
| Referral capture | `StakePanel.vue` | Captures `?ref=0x...` from URL, persists in localStorage, shows referral indicator with clear button |
| Referral routing | `modularStaking.js` | `store.stake()` passes referrer to `submit(ref)`; prefers StakingRouter over StakingCore |

#### Governance Infrastructure
| Feature | File | Description |
|---|---|---|
| Deploy script | `scripts/v2/deploy_governance_v2.js` | Full deployment: SGTv2 → VoteEscrowV2 → GovernanceTimelock → SharedStakeGovernor with role wiring |
| Frontend ABIs | `src/contracts/abis/*.json` | Added VoteEscrowV2, SharedStakeGovernor, GovernanceTimelock ABIs |
| Factory functions | `src/contracts/index.js` | Added `voteEscrowV2()`, `sharedStakeGovernor()`, `governanceTimelock()` helpers |
| Addresses | `src/contracts/addresses/local.json` | Placeholder governance addresses for local testing |

#### Test Updates
| Change | File | Description |
|---|---|---|
| maxDeltaBps | `stakingRouter.spec.ts` | Test `beforeEach` sets `maxDeltaBps(1000)` for realistic reward simulation |
| maxDeltaBps | `e2e-router.spec.ts` | Same relaxation for E2E beacon report tests |
| Constructor | `governanceReferral.spec.ts` | Updated `ReferralRegistry.deploy(gov, feeToken)` call |

### Session 3: Claude Continuation (2026-05-12) — Third Pass Audit + Foundry + Frontend

#### Third Pass Security Audit (Claude)
| Finding | Severity | File | Fix |
|---|---|---|---|
| Dust transfer rounds to 0 shares | LOW | `StToken.sol` | `_transfer()` rejects amounts that round to 0 shares |
| Wrong error for allowance check | LOW | `StToken.sol` | `transferFrom()` uses `InsufficientAllowance()` |
| `require()` in unreachable path | LOW | `VoteEscrowV2.sol` | Replaced with `CannotExtendBeyondMax()` custom error |
| Stranded ETH in queue | INFO | `WithdrawalQueueV2.sol` | Added `recoverEth()` for GOV |

Full report: `docs/modular-staking/AUDIT_THIRD_PASS.md`

#### Foundry Invariant Tests
| Invariant | Status |
|---|---|
| `totalSupply == totalPooledEther` | ✅ 256 runs |
| `sum(user balances) <= totalPooledEther` | ✅ 256 runs |
| Exchange rate monotonically non-decreasing | ✅ 256 runs |
| Router + Queue are MINTERs | ✅ 256 runs |
| `lockedEther <= queue.balance` | ✅ 256 runs |
| `module.totalEth == buffered + beacon` | ✅ 256 runs |
| No shares without ETH backing | ✅ 256 runs |

File: `test/foundry/ModularStakingInvariants.t.sol`

#### Fork Tests
File: `test/v2/modular-staking/fork.spec.ts`
- Validates `ValidatorModule` deposits to real mainnet beacon deposit contract
- Tests withdrawal credentials validation
- Skips gracefully when `MAINNET_RPC_URL` unavailable

#### Keeper Scripts
File: `scripts/v2/keeper.js`
- `depositToBeacon()` — pushes buffered ETH to beacon when >= 32 ETH
- `submitOracleReport()` — fetches beacon data, submits via OracleAdapter
- `finalizeWithdrawals()` — finalizes pending withdrawal requests

#### Governance Frontend
| Component | File | Description |
|---|---|---|
| LockPanel | `src/components/ModularStaking/LockPanel.vue` | create_lock, withdraw, emergencyWithdraw |
| GovernancePanel | `src/components/ModularStaking/GovernancePanel.vue` | Protocol params, proposal placeholders |
| Governance Store | `src/stores/governance.js` | Pinia store for veSGT + Governor reads |
| Tabs | `ModularStakingApp.vue` | Added Lock + Gov tabs |

---

## 1a. Previous Session (Codex GPT-5 — 2026-05-11)

### Audit Fixes (First Pass)
| Finding | File | Fix |
|---|---|---|
| LOW-01 | `StToken.sol` | `transferAdmin()` now revokes MINTER from old admin |
| LOW-02 | `FeeController.sol` | Removed dead `recordDistribution()` |
| LOW-04 | `StToken.sol` | Added `nonReentrant` to `transfer()` / `transferFrom()` |
| LOW-06 | `StakingCore.sol`, `ValidatorModule.sol` | `maxPlausible` tightened from 2× → 1.5× |
| LOW-08 | `WithdrawalQueueV2.sol` | Atomic state update (setTotalPooledEther before burnShares) |
| LOW-11 | `OracleAdapter.sol` | Rejects future timestamps |
| INFO-02 | `StToken.sol` | Removed unused `IERC20Metadata` import |

### New Contracts
| Contract | Lines | Description |
|---|---|---|
| `VoteEscrowV2.sol` | 280 | Curve-style lock, ERC20Votes compatible, 7-day to 3-year locks |
| `SharedStakeGovernor.sol` | 126 | OZ Governor — 7200-block delay, 40320-block voting, 4% quorum, 1000 veSGT threshold |
| `GovernanceTimelock.sol` | 30 | 48-hour delay, PROPOSER/EXECUTOR/CANCELLER roles |
| `ReferralRegistry.sol` | 225 | MasterChef-style `accRewardPerEth` fee distribution |
| `IReferralRegistry.sol` | 7 | Router integration interface |

### New Tests
| File | Cases | Description |
|---|---|---|
| `governanceReferral.spec.ts` | 13 | veSGT locking, Governor propose→vote→queue→execute, referral fee claiming |

### Security Reports
- `docs/modular-staking/AUDIT_SECOND_PASS.md` — 8-agent comprehensive audit (vector-scan, math-precision, access-control, economic-security, execution-trace, invariant, periphery, first-principles)
- `SharedDeposit/x-ray/x-ray.md` — X-Ray pre-audit report (verdict: ADEQUATE)
- `SharedDeposit/x-ray/entry-points.md` — 28 entry points (12 permissionless, 6 role-gated, 10 admin-only)
- `SharedDeposit/x-ray/invariants.md` — 42 guards, 18 single-contract, 7 cross-contract, 4 economic
- `SharedDeposit/x-ray/architecture.svg` — Visual architecture diagram

### Documentation
- `docs/modular-staking/DEPLOYMENT_GUIDE.md` — Step-by-step governance deployment order, emergency procedures, role matrix

### PR
- **PR #378** description updated via GitHub REST API with governance + referral details
- Branch pushed: `cc1e2c1` (latest)

---

## 2. Test Status

### Hardhat
```
  236 passing (13s)
  0 failing
```

### Foundry
```
  7 invariant tests passed
  256 runs × 32 depth each
```

### Frontend
```
  lint: 0 errors
  type-check: pass
  build: pass
```

### Fork Tests
```
  Available: test/v2/modular-staking/fork.spec.ts
  Requires: MAINNET_RPC_URL env var
```

All pre-commit checks pass: lint → type-check → build (no errors).

---

## 3. What You Should Do Next

### Task 3.1: Re-Run Audit Skills (kimi-delegate)

Use the installed Pashov audit skills to re-scan the codebase. The previous run was by Codex; a fresh run by Claude or a delegated agent may surface different findings.

**kimi-delegate task:**
```bash
./skills/kimi-delegate/scripts/plan_prompt.py --task \
"Run the Pashov solidity-auditor skill on SharedDeposit/contracts/v2/modular-staking/ and SharedDeposit/contracts/v2/governance/. Compare findings to docs/modular-staking/AUDIT_SECOND_PASS.md. Highlight any NEW findings not previously documented, and confirm which previously-found issues have been fixed in the current code."
```

Then run the delegation.

### Task 3.2: Re-Run X-Ray (devin-delegate)

Use the devin-delegate skill to re-run x-ray on the full contract set. Compare against the existing x-ray report.

**devin-delegate task:**
```bash
devin-delegate --task \
"Run the Pashov x-ray skill on /root/.openclaw/workspace/dev/SharedStake-ui/.worktrees/main/SharedDeposit/contracts/. Compare the generated x-ray.md, invariants.md, and entry-points.md against the existing versions in SharedDeposit/x-ray/. Report: 1) Any NEW findings not in the existing report, 2) Any FIXED issues from the old report that are now resolved, 3) Any discrepancies between the two reports." \
--workspace /root/.openclaw/workspace/dev/SharedStake-ui/.worktrees/main
```

### Task 3.3: Fix Any New Findings

If either audit surfaces new issues, fix them. Priority:
1. HIGH → Fix immediately, add test, re-run full suite
2. MEDIUM → Fix in this session, add test
3. LOW → Document in a new AUDIT_THIRD_PASS.md if you don't have bandwidth

### Task 3.4: Frontend Referral Integration

The `ReferralRegistry` contract is deployed and tested, but the frontend doesn't capture referral codes yet.

**Scope:**
- Capture `?ref=0x...` from URL in `ModularStakingApp.vue` or `StakePanel.vue`
- Store in localStorage for persistence
- Pass to `submit(ref)` call in `stores/modularStaking.js`
- Add a "Your Referrals" dashboard component (can be basic)

This can be delegated to kimi-delegate if scoped properly.

### Task 3.5: Governance Frontend Integration

Basic governance UI is not wired. Create:
- `GovernancePanel.vue` — shows active proposals, allows voting
- `LockPanel.vue` — allows users to lock SGT → veSGT
- Wire into `router/index.js` at `/v2/governance`

This is lower priority than referral integration.

---

## 4. Critical Files to Read

### Core Contracts
- `SharedDeposit/contracts/v2/modular-staking/StakingRouter.sol` (678 lines) — module registry, fee distribution, rebase logic
- `SharedDeposit/contracts/v2/modular-staking/StakingCore.sol` (276 lines) — legacy core, still active
- `SharedDeposit/contracts/v2/modular-staking/StToken.sol` (191 lines) — rebasing share token
- `SharedDeposit/contracts/v2/modular-staking/WithdrawalQueueV2.sol` (303 lines) — TURBO/BUNKER queue

### New Contracts (this session)
- `SharedDeposit/contracts/v2/governance/VoteEscrowV2.sol` (280 lines) — veSGT locking
- `SharedDeposit/contracts/v2/governance/SharedStakeGovernor.sol` (126 lines) — OZ Governor
- `SharedDeposit/contracts/v2/governance/GovernanceTimelock.sol` (30 lines) — timelock
- `SharedDeposit/contracts/v2/modular-staking/ReferralRegistry.sol` (225 lines) — referral attribution

### Tests
- `SharedDeposit/test/v2/modular-staking/governanceReferral.spec.ts` (313 lines) — new governance + referral tests

### Docs
- `docs/modular-staking/SOLIDITY_SECURITY_AUDIT.md` — First pass audit (15 findings)
- `docs/modular-staking/AUDIT_SECOND_PASS.md` — Second pass (8 agents)
- `docs/modular-staking/DEPLOYMENT_GUIDE.md` — Deployment procedures

---

## 5. Delegation Instructions

### When to use kimi-delegate
- Research/summarize tasks: "Compare audit findings", "Summarize x-ray changes"
- Draft documentation: "Write deployment checklist", "Update threat model"
- Review tasks: "Review ReferralRegistry for reentrancy"

### When to use devin-delegate
- Tasks needing sandbox/browser: "Run x-ray on codebase", "Verify SVG renders"
- Tasks that benefit from file editing: "Fix line numbers in invariants.md"
- Parallel tasks that don't block each other

### When to do it locally (you)
- Critical-path contract edits
- Architecture decisions
- Integration between frontend and contracts
- Final commit + push

---

## 6. Deployment Checklist (Pre-Mainnet)

These are documented but NOT yet implemented. Prioritize which ones to tackle:

- [x] Lower `maxDeltaBps` from 1000 (10%) → 100 (1%)
- [ ] Set `expectedWithdrawalCredentials` on all ValidatorModules
- [ ] Transfer GOV + DEFAULT_ADMIN_ROLE to GovernanceTimelock on all contracts
- [ ] Verify module code hashes at registration
- [x] Add Foundry invariant tests for deposit/withdraw round-trips
- [x] Add fork tests against mainnet beacon deposit contract
- [ ] Engage external human security audit
- [ ] Add BUNKER mode for large slashes (future)
- [ ] Wire governance proposal creation + voting UI
- [ ] Deploy V2 governance contracts and update address books

---

## 7. Commit Rules

All commits must pass pre-commit:
```
lint → type-check → build
```

Commit author: `Claude` (or your model identity)
Commit trailer: `Co-authored-by: Chimera <chimera_defi@protonmail.com>`

---

## 8. Submodule Note

`SharedDeposit` is a git submodule. Changes inside it must be committed INSIDE the submodule first, then the parent repo gets a submodule pointer update. The latest submodule commit is included in `cc1e2c1`.

---

## 9. Key Decisions to Carry Forward

1. **Aragon vs OZ Governor** → OZ Governor chosen (lighter weight, industry standard). Aragon can be added later as wrapper.
2. **Referral fee model** → MasterChef-style `accRewardPerEth` accumulator (gas efficient, fair distribution).
3. **Socialized loss** → Clamping to 0 on insolvency is accepted by design (identical to Lido v2).
4. **Module trust** → Router assumes honest modules. Code-hash verification at registration recommended but not enforced.
5. **maxDeltaBps** → Default 1000 (10%) for testnet flexibility. Must be lowered to 100 (1%) before mainnet.

---

**Handoff written by:** Codex GPT-5
**Date:** 2026-05-11
**Co-authored-by:** Chimera <chimera_defi@protonmail.com>
