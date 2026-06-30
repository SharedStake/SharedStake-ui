# Modular Staking Invariants

## Core Accounting

- `StToken.totalPooledEther()` matches `getPooledEthByShares(getTotalShares())` within 1 wei.
- Share bootstrap is valid only when both pooled ETH and total shares are zero.
- If pooled ETH reaches zero while shares remain, the state must be a recorded insolvency and new deposits must remain blocked.
- Router module accounting for the SOLO validator module matches `ValidatorModule.totalEth()`.
- Router beacon baseline may exceed module-reported beacon balance only by pending principal deposited to the beacon contract.
- Withdrawal queue `totalUnclaimedEther()` equals pending plus finalized unclaimed request ETH.
- Withdrawal queue ETH balance covers locked claims plus pending refunds.
- Actor aggregate stToken and wrapped-stToken claims never exceed pooled backing plus rounding tolerance.

## Old vETH2 Queue Accounting

- Request creation must transfer exactly `amount` vETH2 into queue custody before request accounting is written.
- `pendingVeth2` must be backed by the queue's vETH2 balance.
- `lockedEther + totalPendingRefunds` must be backed by the queue's ETH balance.
- `totalClaimedEth + lockedEther <= totalFinalizedEth`.
- Finalization can only advance from `lastFinalizedRequestId + 1` to `lastRequestId`; IDs cannot be finalized out of order.
- Canceled requests keep FIFO position but do not consume finalize ETH.
- `recoverRedeemedVeth2` cannot remove vETH2 that backs unfinalized requests.
- `recoverEth` cannot remove locked claim ETH or pending finalize refunds.

## Authorization

- Only the configured owner can claim or cancel an old-vETH2 withdrawal request; claims and cancels always return proceeds to that owner.
- `WithdrawalQueueV2` delegated request ownership is isolated from `OldVeth2WithdrawalQueue`; old-vETH2 intentionally has no arbitrary owner/controller recipient flow.
- Quorum oracle submitter count changes only with effective `SUBMITTER` role grants/revokes.
- DebtPool wrapping is callable only by the fee-controller role.
- Module callbacks are accepted only from the registered module address and, once enabled, from an allowlisted implementation code hash.

## Governance And Deployment

- Staking modules can be deployed and registered with caps/pauses set to zero or paused, then activated by governance.
- Codehash enforcement starts disabled for migration compatibility and becomes a one-way governance latch.
- Fee splits route disabled debt/referral destinations back to treasury unless a non-zero debt split requires a debt pool.
- Governance handover must migrate `DEFAULT_ADMIN_ROLE`, `GOV`, `GUARDIAN`, `DebtPool.ADMIN`, and proxy admin ownership before bootstrap admin rights are revoked.

## Fuzz Properties

Implemented in `test/fizz/Properties.sol`:

- `property_totalSupplyEqualsTotalPooled`
- `property_queueUnclaimedMatchesPendingPlusLocked`
- `property_queueBalanceCoversFinalizedClaims`
- `property_oldVeth2QueueBalanceCoversFinalizedClaims`
- `property_oldVeth2PendingBackedByCustody`
- `property_oldVeth2ClaimedAndLockedCoveredByFinalized`
- `property_moduleAccountingMatchesBufferedPlusBeacon`
- `property_zeroBackingRequiresRecordedInsolvency`
- `property_postInsolvencyDepositsBlocked`
- `property_actorClaimsDoNotExceedPool`
