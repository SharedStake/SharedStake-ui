# Contracts V1 Access-Control Matrix

Last updated: 2026-05-01

## Purpose

Define who can call privileged functions for v1 launch on the new architecture.
This is the baseline for multisig policy, signer runbooks, and negative tests.

## Matrix

| Contract | Function(s) | Required Privilege | Notes |
|---|---|---|---|
| `SharedDepositMinterV2` | `batchDepositToEth2`, `setWithdrawalCredential` | `NOR` role | Node operator path only. |
| `SharedDepositMinterV2` | `slash`, `setFeeCalc`, `togglePause`, `migrateShares`, `toggleWithdrawRefund`, `setNumValidators`, `withdrawAdminFee` | `GOV` role | Governance-controlled risk controls and parameters. |
| `SharedDepositMinterV2` | `deposit*`, `withdraw*`, `unstakeAndWithdraw` | Public user flows | Protected by `whenNotPaused` and accounting checks. |
| `WithdrawalQueue` | `togglePause`, `setEpochLength` | `GOV` role | Queue governance controls. |
| `WithdrawalQueue` | `requestRedeem`, `redeem`, `cancelRedeem` | Owner or approved operator (`onlyOwnerOrOperator`) | User can delegate operators via `setOperator`. |
| `SgETH` | `addMinter`, `removeMinter`, `transferOwnership` | `DEFAULT_ADMIN_ROLE` | Must map to governance admin multisig policy. |
| `RewardsReceiver` | `flipState`, `setDAOFeeSplitter` | `owner` (`Ownable`) | Owner should be governance entity with clear runbook. |
| `FeeCalc` | `set`, `setRefundFeesOnWithdraw`, `setExitFee`, `setAdminFee` | `owner` (`Ownable2Step`) | Fee policy authority; tie to governance controls. |
| `UserDepositHelper` / `Zap` | entrypoint functions | Public | No admin methods in current implementation. |

## Deployment Defaults (2026-05-01 hardening)

- `SharedDepositMinterV2.GOV` is set from deployment governance input.
- `SharedDepositMinterV2.NOR` is set from deployment node-operator input; defaults to governance when not provided.
- `WithdrawalQueue.GOV` is set from deployment governance input (not deployer EOA).
- `FeeCalc.owner` is set at constructor time to governance.
- `RewardsReceiver.owner` is set at constructor time to governance.
- `SgETH.DEFAULT_ADMIN_ROLE` is transferred from deployer to governance in the minter deployment flow.
- `deploymentSecurity.spec.ts` enforces these ownership/role invariants in tests.

## Required Pre-Mainnet Controls

1. Document exact governance addresses for `GOV`, `NOR`, `DEFAULT_ADMIN_ROLE`, and `owner` slots.
2. Enforce a signer policy (threshold, quorum, rotation cadence).
3. Add negative tests proving each privileged function reverts for unauthorized callers.
4. Add emergency handoff procedure for compromised signer scenarios.
