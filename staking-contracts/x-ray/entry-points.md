# Modular Staking Entry Points

Scope: PR 379 V2 modular staking contracts plus PR 380 `OldVeth2WithdrawalQueue`.

## User-Facing Flows

| Contract | Entry point | Asset movement | Primary controls |
|---|---|---|---|
| `StakingRouter` | `submit`, `submitToModule`, source/referral variants | ETH in, stToken shares minted | pause, default module, module cap, inflow limits, optional policy registry |
| `StakingRouter` | `wrapFromModule`, `unwrapToModule` | LST module mints/burns stToken claim | module type checks, cap checks on wrap, module caller check |
| `WithdrawalQueueV2` | `requestWithdrawals`, `claimWithdrawal`, `claimWithdrawals` | stToken shares burned, ETH claimed after finalization | nonReentrant, owner/controller checks, queue accounting |
| `OldVeth2WithdrawalQueue` | `requestWithdrawal`, `requestWithdrawals` | caller vETH2 escrowed, request-time ETH quote recorded | nonReentrant, exact custody delta, min/max request limits, owner bound to `msg.sender` |
| `OldVeth2WithdrawalQueue` | `cancelWithdrawal` | unfinalized vETH2 returned to request owner | owner-only, not finalized/claimed/canceled, CEI before token transfer |
| `OldVeth2WithdrawalQueue` | `claimWithdrawal`, `claimWithdrawals` | finalized ETH paid to request owner | owner-only, nonReentrant, claimed flag before ETH send, no arbitrary recipient |
| `OldVeth2WithdrawalQueue` | `withdrawRefund` | excess finalize ETH refund pulled by finalizer | pull refund accounting, nonReentrant |
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
| `OldVeth2WithdrawalQueue` | `finalize` | GUARDIAN | FIFO-only range finalization, bounded by `maxRequestsPerFinalize`, skips canceled requests, locks ETH before claims |
| `OldVeth2WithdrawalQueue` | `setRedemptionRate`, `setRequestLimits`, `setFinalizeLimits`, `pause`, `unpause` | GOV / GUARDIAN pause | redemption rate and limits are governance-controlled; pause is split by action ID |
| `OldVeth2WithdrawalQueue` | `recoverRedeemedVeth2`, `recoverEth` | GOV | cannot recover unfinalized pending vETH2, locked claim ETH, or pending refunds |
| `FeeController` | fee split and recipient setters | GOV | debt split requires a configured debt pool when non-zero |
| `deploy/015_governanceHandover.ts` | handover script | bootstrap GOV | migrates `DEFAULT_ADMIN_ROLE`, `GOV`, `GUARDIAN`, `DebtPool.ADMIN`, and proxy admin ownership to timelock/governor |
