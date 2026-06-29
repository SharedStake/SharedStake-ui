# Modular Staking Entry Points

Scope: PR 379 V2 modular staking contracts under `contracts/v2/modular-staking/`.

## User-Facing Flows

| Contract | Entry point | Asset movement | Primary controls |
|---|---|---|---|
| `StakingRouter` | `submit`, `submitToModule`, source/referral variants | ETH in, stToken shares minted | pause, default module, module cap, inflow limits, optional policy registry |
| `StakingRouter` | `wrapFromModule`, `unwrapToModule` | LST module mints/burns stToken claim | module type checks, cap checks on wrap, module caller check |
| `WithdrawalQueueV2` | `requestWithdrawals`, `claimWithdrawal`, `claimWithdrawals` | stToken shares burned, ETH claimed after finalization | nonReentrant, owner-only claim, queue accounting |
| `WstToken` | `wrap`, `unwrap` | stToken to non-rebasing wstToken and back | nonReentrant, share math |
| `StTokenERC4626Wrapper` | ERC-4626 `deposit/mint/withdraw/redeem` | stToken vault shares | nonReentrant, zero-share guard |
| `ReferralRegistry` | `recordReferral`, `claimFees` | referral accounting and fee-share claim | fee-controller role, min stake, nonReentrant claim |
| `DebtPool` | `claim`, `receiveStETHAndUnwrap`, `withdrawUnclaimedFees` | fee shares wrap to wstETH, merkle claims, post-window sweep | fee-controller role, GOV sweep, nonReentrant guarded transfers |

## Privileged Flows

| Contract | Entry point | Role | Notes |
|---|---|---|---|
| `StakingRouter` | `registerModule`, `setDefaultModule`, `setModuleMintCap`, `setModulePaused` | GOV | module identity, router binding, and codehash checks on registration |
| `StakingRouter` | `setModuleCodeHashAllowed`, `enableCodeHashEnforcement` | GOV | one-way enforcement latch; deposits and callbacks enforce current implementation hash |
| `StakingRouter` | `reportModuleBeaconBalance`, `notifyBeaconDeposit` | registered module | callbacks also enforce module codehash when enabled |
| `ValidatorModule` | `approvePubkey`, `depositToBeaconChain` | GOV / NODE_OPERATOR | withdrawal credentials, pubkey approval, duplicate deposit protection |
| `ValidatorModule` | `reportBeacon` | ORACLE | monotonic timestamp and balance sanity checks via router |
| `QuorumOracleAdapter` | `submitReport`, `emergencySubmitReport` | SUBMITTER / EMERGENCY | quorum accounting syncs submitter role count |
| `WithdrawalQueueV2` | `finalize`, `updateModeFromOracle`, `withdrawRefund` | GUARDIAN / ORACLE / caller refund | finalized ETH accounting includes locked and pending refunds |
| `FeeController` | fee split and recipient setters | GOV | debt split requires a configured debt pool when non-zero |
