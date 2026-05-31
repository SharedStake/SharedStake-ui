# Test Directory Structure

This directory contains all test suites for the SharedStake smart contracts.

## Directory Structure

- `foundry/` - Foundry invariant and fuzz tests (Solidity)
- `hardhat/` - Hardhat TypeScript/JavaScript tests
- `v2/` - Additional Hardhat tests for V2 contracts

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
npx hardhat test test/hardhat/
npx hardhat test test/v2/
```

## Test Coverage

- **Foundry**: 7 invariant tests passing
- **Hardhat**: Multiple test suites for core, modular staking, and governance contracts
- **Coverage**: Run `npx hardhat coverage` for detailed coverage reports

## Historical Note

Previously there was a `tests/` directory at the root level which has been consolidated into `test/hardhat/` for better organization.
