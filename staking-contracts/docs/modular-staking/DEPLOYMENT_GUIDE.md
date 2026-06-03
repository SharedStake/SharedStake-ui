# SharedStake V2 Modular Staking Deployment Guide

This guide documents the deployment sequence for the SharedStake V2 modular staking system.

## Deployment Sequence

| #   | Script                             | Contract                    | Env Vars                                                                  | Role Wiring                                                                                                       |
| --- | ---------------------------------- | --------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | 001_stToken.ts                     | StToken                     | V2_GOVERNANCE_ADDRESS                                                     | N/A                                                                                                               |
| 2   | 002_wstToken.ts                    | WstToken                    | V2_GOVERNANCE_ADDRESS                                                     | N/A                                                                                                               |
| 3   | 003_feeController.ts               | FeeController               | V2_GOVERNANCE_ADDRESS, V2_OPERATOR_ADDRESS                                | N/A                                                                                                               |
| 4   | 004_stakingCore.ts                 | StakingCore                 | V2_GOVERNANCE_ADDRESS                                                     | Grants MINTER on StToken, ORACLE to OracleAdapter/gov, sets FeeController and ReferralCodeRegistry                |
| 5   | 005_withdrawalQueue.ts             | WithdrawalQueueV2           | V2_GOVERNANCE_ADDRESS                                                     | N/A                                                                                                               |
| 6   | 006_referralCodeRegistry.ts        | ReferralCodeRegistry        | V2_GOVERNANCE_ADDRESS                                                     | N/A                                                                                                               |
| 7   | 007_stakingRouter.ts               | StakingRouter               | V2_GOVERNANCE_ADDRESS                                                     | Grants MINTER on StToken, sets FeeController and ReferralCodeRegistry                                             |
| 8   | 008_validatorModule.ts             | ValidatorModule             | V2_GOVERNANCE_ADDRESS                                                     | N/A                                                                                                               |
| 9   | 009_oracleAdapter.ts               | OracleAdapter               | V2_GOVERNANCE_ADDRESS                                                     | N/A                                                                                                               |
| 10  | 010_lstWrapModule.ts               | LSTWrapModule               | V2_GOVERNANCE_ADDRESS                                                     | N/A                                                                                                               |
| 11  | 011_stTokenERC4626Wrapper.ts       | StTokenERC4626Wrapper       | V2_GOVERNANCE_ADDRESS, optional V2_WRAPPER_SEED_AMOUNT                    | Seeds the wrapper on non-local networks when configured                                                           |
| 12  | *(012_dvtModule.ts - deferred)*    | DVTModule                   | *Not part of PR 379. Deploy separately via feat/dvt-module (PR 381) after audit.* | N/A                                                                                                               |
| 13  | 013_quorumOracleAdapter.ts         | QuorumOracleAdapter         | V2_GOVERNANCE_ADDRESS                                                     | N/A                                                                                                               |
| 14  | 014_governance.ts                  | GovernanceTimelock          | V2_GOVERNANCE_ADDRESS                                                     | N/A                                                                                                               |
| 15  | 015_governanceHandover.ts          | N/A                         | V2_GOVERNANCE_ADDRESS                                                     | Transfers DEFAULT_ADMIN_ROLE and GOV to Timelock for all governed contracts                                       |
| 16  | 016_referralCodeRegistryWiring.ts  | N/A                         | V2_GOVERNANCE_ADDRESS                                                     | Additional role wiring for referral system                                                                        |
| 17  | 017_referralRegistry.ts            | ReferralRegistry            | V2_GOVERNANCE_ADDRESS                                                     | Grants ROUTER to StakingCore/StakingRouter, FEE_CTRL to FeeController, sets registry on StakingCore/StakingRouter |
| 18  | 018_debtPool.ts                    | DebtPool                    | V2_GOVERNANCE_ADDRESS                                                     | Updates FeeController.setRecipients() to include DebtPool address                                                 |
| 19  | 019_institutionalPolicyRegistry.ts | InstitutionalPolicyRegistry | V2_GOVERNANCE_ADDRESS                                                     | Optional module policy gates                                                                                      |
| 20  | 020_operatorRegistry.ts            | OperatorRegistry            | V2_GOVERNANCE_ADDRESS, V2_SGT_ADDRESS                                     | Sets default bond config, optional NFT credit, grants CALLER to ValidatorModule                                   |
| 21  | 021_migrationHelper.ts             | MigrationHelper             | V2_GOVERNANCE_ADDRESS                                                     | Deploys non-custodial migration signal helper for router replacement notices                                      |
| 22  | 022_oldVeth2WithdrawalQueue.ts     | OldVeth2WithdrawalQueue     | V2_GOVERNANCE_ADDRESS, V2_OLD_VETH2_ADDRESS, V2_OLD_VETH2_REDEMPTION_RATE | Deploys standalone FIFO queue for legacy vEth2 redemptions                                                        |

## Environment Variables

- `V2_GOVERNANCE_ADDRESS`: Governance multisig address (required for non-local networks)
- `V2_OPERATOR_ADDRESS`: Operator address (optional, defaults to governance on local)
- `V2_NODE_OPERATOR_ADDRESS`: Node operator address (optional, defaults to governance)
- `V2_ORACLE_SUBMITTERS`: Comma-separated list of oracle submitter addresses (required for non-local networks)
- `V2_SGT_ADDRESS`: SGT token address for OperatorRegistry on non-local networks
- `V2_OPERATOR_ETH_BOND_PER_SLOT`, `V2_OPERATOR_SGT_BOND_PER_SLOT`, `V2_OPERATOR_MAX_SLOTS`: optional OperatorRegistry bond tier overrides
- `V2_OPERATOR_NFT_ADDRESS` or `NFT_CONTRACT_ADDRESS`: optional ERC-721 contract for operator NFT bond credit
- `V2_OPERATOR_NFT_SGT_CREDIT`: optional SGT-denominated credit per locked NFT
- `V2_WRAPPER_SEED_AMOUNT`: optional stToken seed for `StTokenERC4626Wrapper`, default `0.001` on non-local networks. Set to `0` only for an intentionally unseeded wrapper deployment.
- `V2_OLD_VETH2_ADDRESS`: legacy vEth2 token address for non-local old-vEth2 queue deployments
- `V2_OLD_VETH2_REDEMPTION_RATE`: old vEth2 ETH redemption rate scaled by 1e18

## Deployment Commands

### Local Deployment

```bash
npx hardhat deploy --network hardhat --tags modular-staking
```

### Sepolia Deployment

```bash
npx hardhat deploy --network sepolia --tags modular-staking
```

### Mainnet Deployment

```bash
npx hardhat deploy --network mainnet --tags modular-staking
```

## Role Wiring Summary

### StToken Roles

- **MINTER**: Granted to StakingCore, StakingRouter
- **DEFAULT_ADMIN_ROLE**: Transferred to GovernanceTimelock

### FeeController Roles

- **DEFAULT_ADMIN_ROLE**: Transferred to GovernanceTimelock
- **GOV**: Transferred to GovernanceTimelock
- **Recipients**: Treasury, Operator, ReferralRegistry, DebtPool

### StakingCore Roles

- **ORACLE**: Granted to OracleAdapter, or temporarily to governance during bootstrap until OracleAdapter is configured
- **GOV**: Transferred to GovernanceTimelock
- **DEFAULT_ADMIN_ROLE**: Transferred to GovernanceTimelock

### ReferralRegistry Roles

- **ROUTER**: Granted to StakingCore, StakingRouter
- **FEE_CTRL**: Granted to FeeController
- **GOV**: Transferred to GovernanceTimelock
- **DEFAULT_ADMIN_ROLE**: Transferred to GovernanceTimelock

### DebtPool Roles

- **GOV**: Transferred to GovernanceTimelock
- **ADMIN**: Set to gov initially
- **FEE_CONTROLLER**: Granted to FeeController
- **DEFAULT_ADMIN_ROLE**: Transferred to GovernanceTimelock

### OperatorRegistry Roles

- **GOV**: GovernanceTimelock or configured governance signer
- **CALLER**: ValidatorModule (DVTModule will be granted CALLER when PR 381 ships)
- **DEFAULT_ADMIN_ROLE**: Governance
- **Optional NFT credit**: enabled only when NFT env vars are set; credit cannot be changed while NFTs are escrowed

### MigrationHelper Controls

- **GOV**: Announces, cancels, and activates router migration notices
- **Delay**: 14-day activation delay enforced by the contract

### OldVeth2WithdrawalQueue Roles

- **GOV**: Updates redemption rate, request/finalize limits, pause state, and recovery of unlocked assets
- **GUARDIAN**: Finalizes FIFO request ranges by funding ETH owed to legacy vEth2 redeemers; it cannot claim or redirect user proceeds
- **DEFAULT_ADMIN_ROLE**: Governance

### Withdrawal Queue Ownership Invariant

- `WithdrawalQueueV2.requestWithdrawals(amounts, owner)` requires `owner == msg.sender`
- `OldVeth2WithdrawalQueue` also binds request ownership to `msg.sender`
- Queue claims are owner-gated; callers may not burn/escrow assets while assigning the future ETH claim to another account

## Post-Deployment Verification

After deployment, verify the following:

1. All contracts have correct governance addresses
2. Role assignments match the wiring summary above
3. FeeController recipients include all four addresses
4. ReferralRegistry is properly wired to StakingCore and StakingRouter
5. StakingCore ORACLE role is granted to OracleAdapter
6. OperatorRegistry is wired to ValidatorModule (DVTModule wiring happens in PR 381)
7. Optional NFT credit is configured only on approved chains
8. MigrationHelper references the active StakingRouter and governance
9. All DEFAULT_ADMIN_ROLE and GOV roles are transferred to Timelock
10. WithdrawalQueueV2 rejects request owner reassignment and allows only request owners to claim finalized ETH
11. OldVeth2WithdrawalQueue points at the legacy vEth2 token, uses the approved redemption rate, allows only request owners to cancel/claim back to themselves, and cannot recover locked ETH, pending finalize refunds, or unfinalized vEth2
12. StTokenERC4626Wrapper is seeded on non-local deployments unless governance explicitly set `V2_WRAPPER_SEED_AMOUNT=0`; the deployer must hold enough stToken to complete that seed deposit

## UUPS Proxy Upgrade Operational Requirements

### `.openzeppelin/` network metadata files

When `deployProxy()` runs against a real network (mainnet, sepolia), the `@openzeppelin/hardhat-upgrades` plugin writes proxy + implementation metadata to:

```
staking-contracts/.openzeppelin/mainnet.json
staking-contracts/.openzeppelin/sepolia.json
```

**These files are tracked in git** (only `unknown-*.json` ephemeral dev files are gitignored). This is intentional and required:

- `upgrades.upgradeProxy(proxy, NewFactory)` uses this file to validate that the new implementation's storage layout is compatible with the proxy's current storage layout.
- If this file is lost (machine failure, gitignore accident), `upgradeProxy()` will refuse to run without `--unsafeSkipStorageCheck`, which bypasses the safety validation.

**Deployment runbook:**
1. After every production `deployProxy()` run, commit the updated `.openzeppelin/<network>.json`.
2. Before every production `upgradeProxy()` run, verify the `.openzeppelin/<network>.json` in the repo matches the live proxy addresses on-chain.
3. If the file is missing, re-generate it by running `npx hardhat run scripts/sync-oz-manifest.ts --network mainnet` (or manually reconstruct using on-chain ERC-1967 slot reads).

## Troubleshooting

### Governance Address Missing

If you see "Missing governance address" error, set the `V2_GOVERNANCE_ADDRESS` environment variable.

### Oracle Submitter Missing

If you see "Missing oracle submitter configuration" error, set the `V2_ORACLE_SUBMITTERS` environment variable with comma-separated addresses.

### Role Granting Failures

If role granting fails, ensure the deployer account has sufficient permissions or use the multi-sig signer for governance operations.

### Wrapper Seed Funding Missing

If `011_stTokenERC4626Wrapper.ts` fails with an insufficient stToken seed balance, fund the deployer with at least `V2_WRAPPER_SEED_AMOUNT` stToken and rerun the deploy. OpenZeppelin ERC-4626 virtual shares make donation attacks non-profitable; the deploy seed is defense-in-depth against griefing small deposits into zero-share reverts. Set `V2_WRAPPER_SEED_AMOUNT=0` only when governance intentionally accepts an unseeded wrapper.
