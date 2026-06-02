# SharedStake Staking Contracts

This directory contains the complete SharedStake V3 modular staking smart contracts and all associated build, test, and deployment infrastructure. It is the local source of truth for contract development in this repository.

## Overview

These contracts implement the complete modular staking system including:

- **StakingRouter**: Main router for modular staking operations
- **StakingCore**: Core staking logic and state management
- **StToken**: Rebasing staking token
- **WstToken**: Wrapped non-rebasing token
- **WithdrawalQueueV2**: Improved withdrawal queue
- **FeeController**: Fee distribution controller
- **DebtPool**: Merkle tree-based debt distribution pool
- **OracleAdapter**: Oracle interface adapter
- **QuorumOracleAdapter**: Quorum-based oracle implementation
- **StEthPriceOracle**: stETH price oracle for Lido parity
- **ReferralRegistry**: Referral tracking system
- **ReferralCodeRegistry**: Referral code management

## Module System

- **ValidatorModule**: Validator management module
- **DVTModule**: Distributed Validator Technology module
- **LSTWrapModule**: Liquid Staking Token wrapper module

## Complete Infrastructure

This directory includes the local contract toolchain:

### Build & Configuration

- `hardhat.config.ts` - Hardhat build configuration
- `foundry.toml` - Foundry build configuration
- `foundry.lock` - Foundry dependency lock file
- `package.json` - Contract dependencies and npm scripts
- `tsconfig.json` - TypeScript configuration
- `.solhint.json` - Solidity linting rules
- `.prettierrc.yaml` - Code formatting configuration
- `.cursorrules` - Project development guidelines

### Testing

- `test/` - Complete test suite (Hardhat tests)
- `test/v2/modular-staking/` - Modular staking specific tests
- `scripts/` - Test and build scripts

### Deployment

- `deploy/` - Deployment scripts
- `deployments/` - Deployment artifacts and addresses
- `ops/` - Operations scripts
- `runbooks/` - Operational runbooks

### CI/CD

- `.github/` - GitHub Actions workflows
- `scripts/` - Build and deployment automation

### Documentation

- `docs/` - Complete documentation
- `deploy_log.md` - Deployment history

### Supporting Infrastructure

- `lib/` - Shared libraries and utilities
- `utils/` - Utility scripts
- `types/` - TypeScript type definitions
- `data/` - Data files
- `sharedstake-oracle/` - Oracle infrastructure
- `tasks/` - Hardhat tasks
- `artifacts/` - Ignored Hardhat build artifacts
- `cache/` - Ignored Hardhat build cache
- `out/` - Ignored Foundry build output
- `flats/` - Flattened contracts

### Services

- `docker-compose.keepers.yml` - Keeper services
- `.env.keeper.example` - Environment configuration template

## Directory Structure

```
staking-contracts/
├── modular-staking/        # Main contract implementations
├── interfaces/             # Contract interfaces
├── lib/                    # Shared libraries and base contracts
├── governance/             # Governance-related contracts
├── test/                   # Complete test suite
├── deploy/                 # Deployment scripts
├── scripts/                # Build and automation scripts
├── docs/                   # Documentation
├── ops/                    # Operations scripts
├── runbooks/              # Operational runbooks
├── .github/               # CI/CD workflows
├── utils/                 # Utility scripts
├── types/                 # TypeScript definitions
├── deployments/           # Deployment artifacts
├── artifacts/             # Build artifacts
├── cache/                 # Build cache
├── out/                   # Foundry output
├── flats/                 # Flattened contracts
├── sharedstake-oracle/    # Oracle infrastructure
└── Configuration files    # All build/test/lint configuration
```

## Security Audit

✅ **6-Pass Internal Security Audit Complete**

- 398 contract tests passing
- 7 Foundry invariants passing
- All critical security issues resolved
- Comprehensive threat model documented


## Build & Test

The complete build system is included:

```bash
# Install dependencies
npm install

# Run Hardhat build
npx hardhat compile

# Run tests
npx hardhat test

# Run Foundry tests
forge test

# Lint Solidity
npm run lint:sol

# Format code
npm run prettier
```

### Local Mainnet Fork Testing

This is REQUIRED before any contract deployment or PR merge:

```bash
# Run all tests including fork tests (requires public RPC)
cd SharedStake-ui/staking-contracts
MAINNET_RPC_URL=https://ethereum.publicnode.com npx hardhat test test/v2/modular-staking/fork.spec.ts

# Run full test suite
npx hardhat test

# Run fork + unit tests together
MAINNET_RPC_URL=https://ethereum.publicnode.com npx hardhat test
```

The fork tests shadow the real beacon deposit contract (0x00000000219ab540356cBB839Cbe05303d7705Fa) with MockBeaconDeposit at the canonical address so no valid BLS data is required. MAINNET_RPC_URL can be any public endpoint (ethereum.publicnode.com works).

## Deployment

See `deploy/` directory for deployment scripts and `docs/modular-staking/DEPLOYMENT_GUIDE.md` for comprehensive deployment instructions.

## License

See main repository LICENSE file.
