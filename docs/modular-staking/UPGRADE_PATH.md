# SharedStake V2 Modular Staking — Upgrade Path

## Upgrade Philosophy

The protocol is **intentionally non-upgradeable**. There is no proxy pattern.
Correctness guarantees come from immutable bytecode, not administrative keys.

The primary upgrade mechanism is **governance-controlled parameter changes** that
require no migration. Full contract replacement is a last resort, announced with
a mandatory notice period so users can exit before the new system goes live.

---

## What Can Change Without Migration

All of the following require only a `GOV` role call on `StakingRouter`:

| Action | Function |
|---|---|
| Replace fee controller | `setFeeController(address)` |
| Tighten/loosen stETH oracle tolerance | `setMaxDeltaBps(uint256)` |
| Register a new module | `registerModule(bytes32, address, uint256, bool)` |
| Pause / unpause a module | `pauseModule` / `unpauseModule` |
| Pause / unpause global deposit path | `pause(PAUSE_SUBMIT)` / `unpause(PAUSE_SUBMIT)` |
| Set per-module mint cap | `setMintCap(bytes32, uint256)` |
| Set default routing module | `setDefaultModule(bytes32)` |
| Set institutional policy registry | `setPolicyRegistry(address)` |
| Assign a policy to a module | `setModulePolicy(bytes32, bytes32)` |

GUARDIAN can also pause immediately (no timelock). GOV must unpause.

---

## Module Replacement (Minimal Upgrade)

Use when a `ValidatorModule` or `DVTModule` needs to be replaced but the
`StakingRouter` itself is sound.

1. Deploy and verify the new module contract.
2. GOV calls `registerModule(NEW_MODULE_ID, newAddr, mintCap, active=false)`.
3. GOV calls `pauseModule(OLD_MODULE_ID)` — halts new inflows to old module.
4. Announce switchover date publicly (recommend ≥ 48 h for operators).
5. Operators migrate validator keys / DVT cluster to new module infra.
6. GOV calls `unpauseModule(NEW_MODULE_ID)` + `setDefaultModule(NEW_MODULE_ID)`.
7. Old module drains naturally as existing validators exit; keep registered
   (paused) until its ETH balance reaches zero, then it can be abandoned.

No user action required. Existing stETH/wstETH positions are unaffected.

---

## Full Router Migration (Major Upgrade)

Required when `StakingRouter`, `StakingCore`, `StToken`, or `WithdrawalQueueV2`
must be replaced.  Uses `MigrationHelper` as the coordination / timelock signal.

### Actors

| Role | Address |
|---|---|
| GOV | Multisig / DAO executor |
| GUARDIAN | Fast-response multisig |
| Users | stETH / wstETH holders |

### Steps

**Week −2: Announce**

1. Deploy `MigrationHelper(OLD_ROUTER, GOV)`.
2. Deploy and audit the new router and its dependencies.
3. GOV calls `MigrationHelper.announceMigration(newRouter)`.
   - Sets `migrationActiveAt = now + 14 days`.
   - Emits `MigrationAnnounced(newRouter, activeAt)`.
4. Publish the announcement on all official channels with the `activeAt` timestamp.

**Days 1–14: Exit Window**

5. Users who wish to exit call `WithdrawalQueueV2.requestWithdrawal(...)` on the
   old router (normal queue path).
6. GOV may optionally pause deposits on the old router
   (`StakingRouter.pause(PAUSE_SUBMIT)`) to prevent new inflows while the
   existing queue drains.
7. Operators process the withdrawal queue in full.

**Day 14+: Activate**

8. GOV calls `MigrationHelper.activateMigration()`.
   - Requires `block.timestamp >= migrationActiveAt`.
   - Sets `migrationActive = true`.
9. Front-ends and integrators read `migrationActive` and redirect to `newRouter`.
10. GOV calls `MigrationHelper.cancelMigration()` is NOT called here — it remains
    active as an on-chain record.

**Post-Migration**

11. The old router is effectively frozen (deposits paused, queue drained).
    It can be abandoned; it holds no ETH if the queue was fully processed.
12. stETH holders who did not exit hold stETH backed by validators still running;
    they continue to accrue rewards under whatever admin controls remain, or can
    exit via any remaining queue capacity.

---

## Emergency Migration

For critical vulnerabilities (re-entrancy, oracle manipulation, etc.) where the
14-day window is unacceptable:

1. GUARDIAN calls `StakingRouter.pause(PAUSE_SUBMIT)` immediately — halts all
   new deposits with no timelock.
2. GUARDIAN or GOV calls `StakingRouter.pauseAllModules()` if individual module
   risks are present.
3. Governance convenes an emergency vote (off-chain Snapshot + multisig execution)
   to:
   a. Call `MigrationHelper.cancelMigration()` (if a pending migration exists)
      then `announceMigration(newRouter)` with a shortened notice (governed by
      DAO quorum, not enforced on-chain).
   b. Or bypass the helper entirely and hard-migrate directly — deploy new
      contracts, update front-ends, and provide admin-claim tooling for users.
4. Publish a post-mortem and remediation plan within 72 hours.

The notice period in `MigrationHelper` is a **social commitment**, not a hard
lock on emergency action.  The helper can be cancelled and redeployed with
different parameters at any time by GOV.

---

## User Guide During Migration

| Situation | What to do |
|---|---|
| Normal migration window is open | Optionally call `WithdrawalQueueV2.requestWithdrawal` on the old router to receive ETH back, or hold stETH and wait — it will be honoured by the queue |
| Migration is active, you still hold stETH | New router accepts wraps/unwraps of the same stETH token; rewards continue accruing; no action required unless you want to exit |
| Queue is bypassed (emergency) | Watch official channels; admin-claim tooling will be published; do not interact with unofficial contracts |
| Unsure which router is current | Query `MigrationHelper.migrationActive` and `MigrationHelper.newRouter` on-chain |

---

## Pre-Migration Ops Checklist

- [ ] New contracts deployed and verified on Etherscan
- [ ] New contracts audited (or at minimum diff-audited against old contracts)
- [ ] `MigrationHelper` deployed and `announceMigration()` called
- [ ] Announcement published: blog, Discord, Twitter, governance forum
- [ ] `migrationActiveAt` timestamp embedded in all user-facing UIs
- [ ] Old router deposit path paused (`PAUSE_SUBMIT`)
- [ ] Withdrawal queue monitored to completion (target: queue length = 0)
- [ ] Operator key migration confirmed for all active validator sets
- [ ] New router smoke-tested on mainnet fork with production state
- [ ] Front-end feature flag prepared (reads `migrationActive` flag)
- [ ] Admin-claim fallback tooling ready in case queue is not fully drained
- [ ] `activateMigration()` called after `migrationActiveAt` elapses
- [ ] Front-end switched to `newRouter`; old router address deprecated in UI
