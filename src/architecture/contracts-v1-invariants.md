# Contracts V1 Invariant Spec (New Architecture)

Last updated: 2026-05-01

## Scope

This spec covers the v1 contract surface under:

- `SharedDeposit/contracts/v2/core`
- `SharedDeposit/contracts/v2/lib` (custom libs)
- `SharedDeposit/contracts/v2/periphery` (where used by core flows)

## Invariants

### INV-01: User funds custody paths are constrained

- ETH held by `SharedDepositMinterV2` must only leave via:
  - user redemption (`withdraw`, `withdrawTo`, `unstakeAndWithdraw`)
  - validator deposits (`batchDepositToEth2`)
  - governance fee withdrawal (`withdrawAdminFee`, capped by `adminFeeTotal`)
- Implication: no arbitrary transfer path for buffered principal.

### INV-02: Mint/burn accounting stays balanced

- `curValidatorShares` increases only on successful deposit accounting.
- `curValidatorShares` decreases only on successful withdraw accounting or slash accounting.
- `_SGETH` mint/burn operations must stay consistent with `curValidatorShares` and withdrawal calculations.

### INV-03: Deposit cap cannot be exceeded

- `curValidatorShares` must never exceed `buffer + maxValidatorShares()`.
- `maxValidatorShares()` must remain `32 ETH * numValidators`.
- `numValidators` cannot be set to zero.

### INV-04: Queue redemption cannot bypass permissions or epoch checks

- `requestRedeem`, `redeem`, and `cancelRedeem` must require owner/operator permissions.
- `redeemRequests[requester]` cannot underflow and must decrease only via redeem/cancel paths.
- Redeem execution must honor epoch and balance checks through FIFO helper logic.

### INV-05: Pause controls are authoritative

- When `SharedDepositMinterV2` is paused, deposit/withdraw internals must be blocked.
- In `WithdrawalQueue`, per-function granular pause flags must block request/redeem/cancel independently.
- Only authorized governance roles can toggle pause state.

### INV-06: Privileged operations are role-bound

- `slash`, `setFeeCalc`, `setNumValidators`, `withdrawAdminFee`, `togglePause` in minter require `GOV`.
- `batchDepositToEth2` and `setWithdrawalCredential` require `NOR`.
- `SgETH` minter administration requires `DEFAULT_ADMIN_ROLE`.
- `RewardsReceiver` state flipping and splitter updates require owner.

### INV-07: Reward routing is deterministic per receiver state

- In `RewardsReceiver`:
  - `Deposits` state routes rewards through `_convertToSgETHAndTransfer`.
  - `Withdrawals` state routes ETH to `WITHDRAWALS`.
- Exactly one path executes per `work()` call.

### INV-08: Fee logic must be transparent and monotonic

- `FeeCalc` settings updates are owner-only.
- Deposit/withdraw fee outcomes must be derivable from active config.
- `adminFeeTotal` update direction must match `refundFeesOnWithdraw` behavior.

### INV-09: Non-reentrancy on critical paths

- Deposit/withdraw/redeem paths that move user funds must stay protected by `nonReentrant`.
- Any newly introduced external call path into fund-moving logic must preserve this property.

### INV-10: Deployment reproducibility

- For a promoted v1 release, contract bytecode, constructor args, and roles must be reproducible from a tagged commit and manifest.

## Mandatory Tests To Add Before Mainnet V1

1. Invariant/fuzz: `curValidatorShares` and minted/burned supply relationships under randomized deposit/withdraw/slash sequences.
2. Invariant/fuzz: queue accounting (`totalPendingRequest`, `redeemRequests`, claimable math) under interleaved request/redeem/cancel operations.
3. Scenario: pause + queued redemptions + resume with partial liquidity.
4. Scenario: slash event while users are simultaneously depositing and redeeming.
5. Scenario: fee mode transitions (`chargeOnDeposit`, `chargeOnExit`, `refundFeesOnWithdraw`) with balance conservation assertions.
