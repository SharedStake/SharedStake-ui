# Test Directory Structure

This directory contains all test suites for the SharedStake smart contracts.

## Directory Structure

- `foundry/` - Foundry invariant and fuzz tests (Solidity)
- `v2/` - Canonical Hardhat TypeScript tests for V2 and modular staking contracts

## Running Tests

### Foundry Tests

```bash
cd staking-contracts
forge test
forge test --match-path test/foundry/ModularStakingInvariants.t.sol
```

### Hardhat Tests

```bash
cd staking-contracts
npx hardhat test
npx hardhat test test/v2/
```

## Test Coverage

- **Foundry**: Invariant tests for modular staking accounting and safety properties
- **Hardhat**: Multiple test suites for core, modular staking, and governance contracts
- **Coverage**: Run `npx hardhat coverage` for detailed coverage reports

## Historical Note

Previously there were duplicate Hardhat test mirrors. The maintained TypeScript suites now live under `test/v2/`; keep new Hardhat coverage there to avoid stale duplicate fixtures.
