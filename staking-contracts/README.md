# SharedStake Staking Contracts

This directory contains the SharedStake V3 modular staking smart contracts, copied from the SharedDeposit submodule for direct management in this repository.

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

## Directory Structure

```
staking-contracts/
├── modular-staking/     # Main contract implementations
├── interfaces/          # Contract interfaces
├── lib/                 # Shared libraries and base contracts
├── governance/          # Governance-related contracts
├── tests/               # Test suites
├── deploy/              # Deployment scripts
└── README.md           # This file
```

## Security Audit

✅ **6-Pass Internal Security Audit Complete**
- 398 contract tests passing
- 7 Foundry invariants passing
- All critical security issues resolved
- Comprehensive threat model documented

## Historical Note

These contracts were originally developed in the SharedDeposit submodule (https://github.com/chimera-defi/SharedDeposit). They have been copied here for direct management in the SharedStake-ui repository while preserving the submodule for historical reference.

## Deployment

See `deploy/` directory for deployment scripts and `docs/modular-staking/DEPLOYMENT_GUIDE.md` for comprehensive deployment instructions.

## Testing

Run tests with:
```bash
cd staking-contracts/tests
# Test commands depend on the framework being used (Hardhat/Foundry)
```

## License

See main repository LICENSE file.