## Summary
- Ship modular staking V3: UUPS-upgradeable StakingRouter, ValidatorModule, LSTWrapModule, OperatorRegistry
- DVTModule extracted to `feat/dvt-module` (PR 381) for independent security review; registers post-launch via `StakingRouter.registerModule()` with zero core contract changes
- 4-round Solidity security audit: 22+ bugs fixed (inflation-attack DoS, OracleAdapter last-submitter guard, BigInt-unsafe test assertions, and more)
- CI hardening: Foundry invariant pipeline + retry wrapper for flaky foundryup installs

## Changes
- `staking-contracts/contracts/`: four core contracts converted to UUPS proxies (ERC-1967); `GranularPauseUpgradeable` added to resolve C3 linearization conflict
- `staking-contracts/deploy/`: all four proxy deploy scripts updated to use `hre.upgrades.deployProxy()` + hardhat-deploy compatibility shim
- `staking-contracts/test/v2/modular-staking/upgrades.spec.ts`: 13 new tests covering proxy initialization and `_authorizeUpgrade` access control
- `staking-contracts/.gitignore`: scoped `.openzeppelin` ignore to `unknown-*.json` only — real-network manifest files are now tracked for upgrade safety
- `src/components/FAQ/FAQ.vue` + withdrawals history table for old vEth2 queue
- `docs/`: architecture docs updated for UUPS proxies and DVT split; deployment guide includes `.openzeppelin/` operational runbook
- `.github/workflows/audit.yml`: Foundry invariant step + Slither static analysis

## DVT Split
DVTModule had 4 security findings across 5 audit rounds and is not included in this PR. It will ship as PR 381 (`feat/dvt-module`) after a dedicated audit pass. The router's `MODULE_TYPE_DVT_VALIDATOR` constant and `IStakingModule` interface are the only hooks left in — enough to register DVT post-launch with no core changes.

## Risk
- Medium: UUPS proxy conversion — storage layout gaps (`uint256[50] __gap`) and `_disableInitializers()` on all implementations; validated with `hardhat-upgrades` storage checker
- Medium: new ERC4626 wrapper is guarded by seeding on deploy to prevent inflation attack
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
