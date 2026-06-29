# Modular Staking Invariants

## Accounting

- `StToken.totalPooledEther()` matches `getPooledEthByShares(getTotalShares())` within 1 wei.
- Share bootstrap is valid only when both pooled ETH and total shares are zero.
- If pooled ETH reaches zero while shares remain, the state must be a recorded insolvency and new deposits must remain blocked.
- Router module accounting for the SOLO validator module matches `ValidatorModule.totalEth()`.
- Router beacon baseline may exceed module-reported beacon balance only by pending principal deposited to the beacon contract.
- Withdrawal queue `totalUnclaimedEther()` equals pending plus finalized unclaimed request ETH.
- Withdrawal queue ETH balance covers locked claims plus pending refunds.
- Actor aggregate stToken and wrapped-stToken claims never exceed pooled backing plus rounding tolerance.

## Authorization

- Only the configured owner can claim a withdrawal request; recipients can differ, but callers cannot claim on behalf of other owners.
- Quorum oracle submitter count changes only with effective `SUBMITTER` role grants/revokes.
- DebtPool wrapping is callable only by the fee-controller role.
- Module callbacks are accepted only from the registered module address and, once enabled, from an allowlisted implementation code hash.

## Governance And Deployment

- Staking modules can be deployed and registered with caps/pauses set to zero or paused, then activated by governance.
- Codehash enforcement starts disabled for migration compatibility and becomes a one-way governance latch.
- Fee splits route disabled debt/referral destinations back to treasury unless a non-zero debt split requires a debt pool.

## Fuzz Properties

Implemented in `test/fizz/Properties.sol`:

- `property_totalSupplyEqualsTotalPooled`
- `property_queueUnclaimedMatchesPendingPlusLocked`
- `property_queueBalanceCoversFinalizedClaims`
- `property_moduleAccountingMatchesBufferedPlusBeacon`
- `property_zeroBackingRequiresRecordedInsolvency`
- `property_postInsolvencyDepositsBlocked`
- `property_actorClaimsDoNotExceedPool`
