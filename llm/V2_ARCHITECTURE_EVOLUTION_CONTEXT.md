# SharedStake V2 Architecture Evolution Context

Last refreshed: 2026-05-01
Primary source domain: `https://docs.sharedstake.finance`

## Scope

This note captures the GitBook guidance for how SharedStake v2 is designed and how it is intended to evolve over phases.
It is intended as durable session context for implementation and product decisions.

## Canonical Source Pages

- `https://docs.sharedstake.finance/sharedstake-v2.md`
- `https://docs.sharedstake.finance/sharedstake-v2/key-changes-over-v1.md`
- `https://docs.sharedstake.finance/sharedstake-v2/phased-launch.md`
- `https://docs.sharedstake.finance/sharedstake-v2/shareddeposit-v2-architecture.md`

## Current V2 Core Architecture (as documented)

- Two-token model:
  - `wsgETH`: yield-bearing token users hold to earn staking rewards.
  - `sgETH`: 1:1 ETH-pegged token, mintable/redeemable via minter.
- Core minter flows:
  - `deposit`
  - `deposit and stake`
  - `unstake and withdraw`
  - `withdraw`
- ETH buffering model:
  - Minter buffers ETH.
  - Buffered ETH is used by node operators for validator deployment.
  - Buffer/liquidity supports exits and peg behavior.
- Governance controls include:
  - pause
  - slash
  - set fees
  - collect fees
- Design traits:
  - non-custodial
  - non-upgradeable / immutable contract posture
  - continuous on-chain yield calculation
  - shorter reward cycle (docs mention 1 day on Goerli; longer on mainnet)

## Evolution Roadmap (Phased Launch)

### Phase 0-1 (core launch)

- Immutable, guarded, non-custodial core.
- Deposit + redemption via buffer + withdrawal paths.
- Limited core surface (docs call out 7 contracts).
- Starts with existing operator and community-directed liquidity.

### Phase 2

- Deposit source attribution.
- Referral/frontend-partner mechanics (docs describe 1% yield routing for referees and 1% for frontend operators).
- Depositor client-preference signaling via deposit-helper events.
- DAO-routed fee events used for merkle airdrop flows.

### Phase 3

- Expands node-operator set.
- Permissionless operator onboarding via ERC-6551 account creation.
- Ties onboarding to `$STEAK` NFT and locked `SGT`.

### Phase 4

- Fee switch introduction.
- Fee redistribution to locked `SGT` stakers.
- Notes deprecation of current `veSGT` locked-liquidity module and need for replacement staking scheme.

### Phase 5

- Multi-chain minter subsystem.
- Enables minting `sgETH` and earning yield from other chains (L1/L2).

## Key V1 -> V2 Changes (from docs)

- Moves to fully non-custodial withdrawal path via smart-contract withdrawal address.
- Removes upfront stake/unstake fees initially.
- Revises yield-fee model (docs describe starting at 9% split across operator/founder/DAO paths).
- DAO/multisig-governed contract roles.
- Continuous reward distribution + autocompounding direction.
- No oracle requirement for reward accounting in the described model.
- Explicit extensibility plan via phased rollout.

## Source Quality Notes

- `shareddeposit-v2-architecture.md` itself is sparse and points to an embedded Google Doc.
- Useful details were obtained from:
  - `sharedstake-v2.md`
  - `key-changes-over-v1.md`
  - `phased-launch.md`
  - GitBook `?ask=` endpoint answers scoped to those pages.
- `docs.sharedstake.org` did not resolve from this environment at retrieval time; `docs.sharedstake.finance` was reachable and appears to host the active GitBook content.
