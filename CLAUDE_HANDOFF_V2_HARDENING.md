# Handoff: SharedStake V2 Hardening → Claude

**Date:** 2026-05-11
**Branch:** `feat/sharedstake-v2-modular-staking-master`
**Status:** PR #378 active, 236 tests passing, pre-commit green
**Previous Agent:** Codex GPT-5
**Next Agent:** Claude (this session)

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

```
  236 passing (13s)
  0 failing
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

- [ ] Lower `maxDeltaBps` from 1000 (10%) → 100 (1%)
- [ ] Set `expectedWithdrawalCredentials` on all ValidatorModules
- [ ] Transfer GOV + DEFAULT_ADMIN_ROLE to GovernanceTimelock on all contracts
- [ ] Verify module code hashes at registration
- [ ] Add Foundry invariant tests for deposit/withdraw round-trips
- [ ] Add fork tests against mainnet beacon deposit contract
- [ ] Engage external human security audit
- [ ] Add BUNKER mode for large slashes (future)

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
