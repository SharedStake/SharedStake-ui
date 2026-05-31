# SharedStake V2 Modular Staking Operational Runbook

**Scope:** Emergency response and routine operational procedures for the
modular-staking contract suite (`StToken`, `StakingCore`, `WithdrawalQueueV2`,
`OracleAdapter` / `QuorumOracleAdapter`, `StakingRouter`, `ValidatorModule`,
`LSTWrapModule`, `FeeController`).

**Roles** (all are `bytes32` keccak labels except `DEFAULT_ADMIN_ROLE`):

| Role                  | Power                                                    | Held by   |
| --------------------- | -------------------------------------------------------- | --------- |
| `DEFAULT_ADMIN_ROLE`  | Grant/revoke any role                                    | GOV multisig |
| `GOV`                 | Param changes, unpause, fee/oracle wiring                | GOV multisig |
| `GUARDIAN`            | Pause + finalize the withdrawal queue                    | GOV multisig (or fast-response key) |
| `ORACLE` / `SUBMITTER`| Submit beacon reports                                    | Oracle bot key(s) |
| `NODE_OPERATOR` / NOR | Register validators, register/exit on `ValidatorModule`  | NOR multisig |
| `MINTER`              | Mint/burn `StToken` shares                               | `StakingCore`, `WithdrawalQueueV2` |

> Code references: `contracts/v2/modular-staking/*.sol`. Pull the live address
> set from `deployments/<network>/manifest.json` before running any
> command below.

---

## 1. Emergency Pause

Pauses are per-function (selector-id) on each pausable contract:
`StakingCore`, `WithdrawalQueueV2`, `StakingRouter`, `ValidatorModule`,
`LSTWrapModule`. `pause(uint16 fnId)` requires `GUARDIAN`; `unpause(uint16 fnId)`
requires `GOV`.

```bash
# Pause `submit` on StakingCore (fnId is the function selector id used by the contract).
cast send $STAKING_CORE "pause(uint16)" $FN_ID --from $GUARDIAN
# Verify:
cast call  $STAKING_CORE "isPaused(uint16)(bool)" $FN_ID
# Restore:
cast send $STAKING_CORE "unpause(uint16)" $FN_ID --from $GOV
```

At the StakingRouter level use `pauseModule(bytes32 moduleId)` /
`unpauseModule(bytes32 moduleId)` to halt an entire module.

**Expected state after pause:** all paused entrypoints revert with the
contract's `Paused()` error. Withdrawals already queued remain claimable.
Verify via on-chain `paused(...)` getter and an off-chain dry-run of the
disabled function.

---

## 2. Oracle Staleness Recovery

Detection: `OracleAdapter.maxStalenessSeconds()` exceeded since the last
accepted report — `submitReport` will revert `StaleReport(reportAge, max)`.
Downstream effect: `StakingCore` price feed becomes stale; deposits and
withdrawals continue using the last accepted total balance, but oracle-gated
operations on `WithdrawalQueueV2` (finalization quotes) should be paused.

```bash
# 1. Check staleness window and last report.
cast call $ORACLE "maxStalenessSeconds()(uint256)"
cast call $ORACLE "lastReportTimestamp()(uint256)"

# 2. Have the SUBMITTER bot push a fresh report.
cast send $ORACLE "submitReport(uint256,uint256,uint256)" \
    $BEACON_VALIDATORS $BEACON_BALANCE $REPORT_TS --from $SUBMITTER

# 3. (Optional, GOV-only) widen the window if recovery requires it.
cast send $ORACLE "setMaxStaleness(uint256)" $NEW_SECS --from $GOV
```

If the quorum adapter is in use (`QuorumOracleAdapter`), the report only
finalizes once the configured quorum signs the same `(validators,balance,ts)`
triple — coordinate with all submitters before broadcasting.

---

## 3. Slash Event Response

Trigger: an oracle report would reduce total beacon balance by more than
`maxSlashBps` (default 5%). The adapter reverts `SlashTooLarge(actual,max)`,
so the system is *frozen on stale data* until GOV explicitly authorizes the
loss.

```bash
# 1. Confirm the loss size off-chain, then raise the cap to permit the report.
cast call $ORACLE "maxSlashBps()(uint256)"
cast send $ORACLE "setMaxSlashBps(uint256)" $NEW_BPS --from $GOV

# 2. Resubmit the report.
cast send $ORACLE "submitReport(uint256,uint256,uint256)" \
    $BEACON_VALIDATORS $BEACON_BALANCE $REPORT_TS --from $SUBMITTER

# 3. Reset the cap back to the safe baseline.
cast send $ORACLE "setMaxSlashBps(uint256)" 500 --from $GOV
```

**Downstream:** share price (`pricePerShare`) drops on next rebase; queued
withdrawal claims settle at the post-slash exchange rate. Communicate the
event publicly *before* finalizing the report — users with claimable
positions should know the new payout rate.

---

## 4. Withdrawal Queue Finalization

`WithdrawalQueueV2.finalize(uint256 lastRequestId)` is `payable` and gated
by `GUARDIAN`. The caller must send exactly the ETH owed to the requests in
`[lastFinalizedRequestId+1 .. lastRequestId]` at the current share price.

```bash
# 1. Read the queue state.
cast call $QUEUE "lastFinalizedRequestId()(uint256)"
cast call $QUEUE "nextRequestId()(uint256)"

# 2. Quote the ETH needed (off-chain helper or simulate `finalize` with the
#    expected range; the contract reverts on under/overpayment).
ETH_OWED=$(node scripts/keepers/quote-finalize.js $LAST_ID)

# 3. Fund + finalize in one tx.
cast send $QUEUE "finalize(uint256)" $LAST_ID \
    --value $ETH_OWED --from $GUARDIAN
```

Verify success: `lastFinalizedRequestId` advances to `$LAST_ID` and the
`Finalized(...)` event is emitted. Users may now `claimWithdrawal(id)`.

---

## 5. Governance Key Rotation

SharedStake V2 modular staking contracts use OpenZeppelin `AccessControl` (no built-in 2-step
admin rotation). To rotate `DEFAULT_ADMIN_ROLE` (and `GOV`/`GUARDIAN`)
without losing control, follow this 2-step pattern manually on **every**
contract in the deployment:

```bash
# Step 1 (from current admin): grant the new admin all required roles.
cast send $C "grantRole(bytes32,address)" $DEFAULT_ADMIN_ROLE $NEW_GOV --from $OLD_GOV
cast send $C "grantRole(bytes32,address)" $GOV_ROLE          $NEW_GOV --from $OLD_GOV
cast send $C "grantRole(bytes32,address)" $GUARDIAN_ROLE     $NEW_GOV --from $OLD_GOV

# Step 2 (from NEW admin, only after a sanity tx confirms it works):
#   accept-equivalent — verify the new key by performing a benign GOV-only
#   action (e.g., setMaxStaleness to its current value). Then renounce
#   from the old key:
cast send $C "renounceRole(bytes32,address)" $GUARDIAN_ROLE     $OLD_GOV --from $OLD_GOV
cast send $C "renounceRole(bytes32,address)" $GOV_ROLE          $OLD_GOV --from $OLD_GOV
cast send $C "renounceRole(bytes32,address)" $DEFAULT_ADMIN_ROLE $OLD_GOV --from $OLD_GOV
```

> Never `renounceRole` the old admin until the new admin has executed at
> least one role-gated tx — that is the "accept" half of the 2-step. If
> the old key is renounced first and the new key is misconfigured, the
> contract is bricked.

Iterate the loop above over every address in `manifest.json.contracts`.

---

## 6. Post-Deploy Verification Checklist

Run after every mainnet (or staging) deploy. All checks are idempotent
read calls unless flagged `[write]`.

1. **Manifest generated** — `npx hardhat run scripts/manifest/generate-manifest.ts --network mainnet` produces a `manifest.json` whose `gitCommit` matches the tagged release.
2. **Role wiring on `StToken`** — `MINTER` granted to `StakingCore` and `WithdrawalQueueV2`; no other `MINTER` holders.
3. **Role wiring on every contract** — `DEFAULT_ADMIN_ROLE`, `GOV`, `GUARDIAN` resolve to the GOV multisig (or the agreed multisig set). EOA deployer has been renounced.
4. **Oracle wiring** — `StakingCore.ORACLE()` returns the deployed `OracleAdapter` / `QuorumOracleAdapter`; `submitReport` from the SUBMITTER key dry-runs successfully on a fork.
5. **Oracle staleness window** — `maxStalenessSeconds` is the production value (not the test default) and `maxSlashBps` is 500.
6. **FeeController wired** — `StakingCore.feeController()` returns the deployed `FeeController`, fee bps + recipient match the governance proposal.
7. **Pause smoke test [write]** — GUARDIAN pauses one selector on `StakingCore`, confirms revert on a `submit` dry-run, then GOV unpauses. (Run on a fork or a test selector before mainnet.)
8. **Withdrawal round-trip [write, fork only]** — `requestWithdrawals` → `finalize` → `claimWithdrawal` succeeds with expected ETH delta on a mainnet fork.
9. **Etherscan verification** — every address in `manifest.json` is verified on Etherscan with sources matching `metadata.compiler.version` from the manifest.
10. **Manifest archived** — `manifest.json` committed to the deploy-log repo (or `deploy_log.md`) and posted to the governance channel before announcing the release.
