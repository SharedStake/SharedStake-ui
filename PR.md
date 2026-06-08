## Summary
- Ship modular staking V2: ERC4626 wrapper, veSGT governance locks, DVT staking panel, old vEth2 withdrawal queue with history UI
- 4-round Solidity security audit: 22+ bugs fixed (inflation-attack DoS, OracleAdapter last-submitter guard, BigInt-unsafe test assertions, and more)
- CI hardening: Foundry invariant pipeline + retry wrapper for flaky foundryup installs

## Changes
- `staking-contracts/`: ERC4626 wrapper contracts, veSGT locks, modular staking modules, deploy scripts, 22+ security fixes across 4 audit rounds
- `src/components/ModularStaking/DVTStakePanel.vue`: new DVT staking panel with reactive state
- `src/components/FAQ/FAQ.vue` + withdrawals history table for old vEth2 queue
- `docs/modular-staking/`: updated deployment guide, audit workflow, architecture docs; removed 3k lines of stale handoff/AI docs
- `.github/workflows/audit.yml`: Foundry invariant step + Slither static analysis

## Risk
- Medium: new ERC4626 wrapper is guarded by seeding on deploy to prevent inflation attack
- Low: DVT panel and withdrawal history are UI-only with no new contract surface
- Low: CI changes affect only the contract audit workflow

## Testing
- bun audit --level moderate
- bun run type-check
- bun run build
- cd staking-contracts && npm audit --audit-level=moderate
- cd staking-contracts && npm run lint:sol
- cd staking-contracts && npx hardhat compile
- cd staking-contracts && npx hardhat test test/v2/modular-staking/*.spec.ts
- cd staking-contracts && npm run test:invariants