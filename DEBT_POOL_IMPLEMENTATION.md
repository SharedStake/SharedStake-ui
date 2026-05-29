# Debt Pool Implementation - SharedStake V2

## Overview

This document describes the Debt Pool implementation for SharedStake V2, which enables protocol fees to be directed to a claimable pool with merkle tree distribution for debt repayment.

## Architecture

### Fee Flow Changes

**Before:**
```
Beacon Rewards → FeeController → Split:
├── Treasury (stETH shares)
├── Operator (stETH shares)
└── Referral Registry (remainder)
```

**After:**
```
Beacon Rewards → FeeController → Split:
├── Treasury (stETH shares)
├── Operator (stETH shares)
├── Debt Pool (stETH shares) ← NEW
└── Referral Registry (remainder)
```

### Components

1. **FeeController.sol** (Modified)
   - Added `debtPoolSplitBps` - configurable percentage for debt pool
   - Added `debtPool` address - DebtPool contract address
   - Updated `computeFees()` to return debt pool amount
   - Updated `setFee()` and `setRecipients()` to include debt pool parameters
   - Backward compatible: debt pool is optional (can be address(0))

2. **DebtPool.sol** (New Contract)
   - Receives stETH shares from FeeController
   - Unwraps stETH to wstETH
   - Manages merkle tree distributions
   - Allows specific addresses to claim using merkle proofs
   - Tracks all distributions, claims, and unclaimed amounts

3. **StakingCore.sol** (Modified)
   - Updated `_distributeFees()` to handle debt pool shares
   - Mints stETH shares to debt pool address

4. **StakingRouter.sol** (Modified)
   - Updated `_distributeFees()` to handle debt pool shares
   - Mints stETH shares to debt pool address

## Contract Details

### FeeController Changes

**New State Variables:**
```solidity
uint16 public debtPoolSplitBps;  // fraction of feeBps going to debt pool
address public debtPool;         // DebtPool contract for debt repayment
```

**Updated Functions:**
- `constructor()` - Added debt pool parameters
- `setFee()` - Added debtPoolSplitBps parameter
- `setRecipients()` - Added debtPool address parameter
- `computeFees()` - Returns debt pool amount (0 if debt pool not set)
- `getFeeConfig()` - Returns debt pool configuration
- `getRecipients()` - Returns debt pool address

**Backward Compatibility:**
- Debt pool is optional: set `debtPool = address(0)` to disable
- When disabled, `debtPoolAmount` returns 0
- Existing deployments can upgrade without enabling debt pool

### DebtPool Contract

**Key Features:**
- Access control with GOV and ADMIN roles
- Merkle tree distribution system
- stETH → wstETH unwrapping
- Comprehensive tracking and events

**State Variables:**
```solidity
IERC20 public immutable stToken;
IERC20 public immutable wstETH;
bytes32 public merkleRoot;
uint256 public distributionId;
uint256 public totalAccumulated;
uint256 totalClaimed;
```

**Admin Functions:**
- `createDistribution(merkleRoot, totalAmount)` - Create new distribution
- `updateMerkleRoot(distributionId, newRoot)` - Emergency merkle root update
- `withdrawUnclaimedFees(distributionId, recipient)` - Recover unclaimed funds

**User Functions:**
- `claim(distributionId, recipient, amount, proof)` - Claim wstETH using merkle proof
- `canClaim(distributionId, recipient, amount, proof)` - Check if claim is valid
- `getClaimStatus(distributionId, recipient)` - Get claim status

**Query Functions:**
- `getDistribution(distributionId)` - Get distribution details
- `getStats()` - Get pool statistics

**Receive Function:**
- `receiveStETHAndUnwrap(amount)` - Receive stETH and unwrap to wstETH

## Security Considerations

### FeeController Security

**✅ Proper Access Control:**
- All configuration changes require GOV role
- GOV role can be managed via DEFAULT_ADMIN_ROLE
- 48h timelock requirement for fee changes (existing)

**✅ Input Validation:**
- Zero address checks for critical parameters
- Fee split sum validation (≤ 10000 bps)
- Max fee cap (2000 bps = 20%)

**✅ Backward Compatibility:**
- Debt pool is optional
- Zero address check prevents accidental allocation
- Existing fee distribution logic preserved

**⚠️ Potential Issues:**
- Debt pool address can be set to any address (should validate it's a contract)
- No check that debt pool actually implements expected interface
- Consider adding contract code validation for debt pool address

### DebtPool Security

**✅ Access Control:**
- GOV role for critical operations (merkle root updates, fund recovery)
- ADMIN role for distribution creation
- Role separation for operational safety

**✅ Merkle Tree Security:**
- Proper merkle proof verification using OpenZeppelin's MerkleProof
- Leaf encoding: `keccak256(abi.encodePacked(recipient, amount))`
- Claim replay protection via `claimed` flag

**✅ Fund Management:**
- Balance checks before distribution creation
- Unclaimed fund recovery mechanism
- Comprehensive tracking of all claims

**✅ Reentrancy Protection:**
- State updates before external transfers
- Claims marked as claimed before transfer
- No external calls in critical paths

**⚠️ Potential Issues:**
- `receiveStETHAndUnwrap()` has no access control - anyone can call
  - Should only be callable by FeeController
  - Add `onlyFeeController` modifier
- Low-level call to wstETH `wrap()` function
  - Should validate the function signature
  - Consider using interface instead of low-level call
- `_getClaimedAmount()` returns 0 (placeholder)
  - Should implement proper claimed amount tracking
  - Consider using a counter per distribution
- No emergency pause mechanism
  - Consider adding pause functionality

### Integration Security

**✅ State Consistency:**
- Fee distribution logic updated in both StakingCore and StakingRouter
- Debt pool shares minted only if address is set
- Proper share calculation using ShareMath

**⚠️ Potential Issues:**
- No validation that debt pool can receive stETH
- No check if debt pool successfully unwraps to wstETH
- Consider adding success callbacks or event-based verification

## Deployment Steps

### 1. Deploy DebtPool Contract
```solidity
DebtPool debtPool = new DebtPool(
    stTokenAddress,      // stETH address
    wstETHAddress,       // wstETH address
    govAddress,          // Governance address
    adminAddress         // Admin address
);
```

### 2. Deploy/Update FeeController
```solidity
FeeController feeController = new FeeController(
    govAddress,
    treasuryAddress,
    operatorAddress,
    referralRegistryAddress,
    debtPoolAddress,     // New: debt pool address
    feeBps,
    treasurySplitBps,
    operatorSplitBps,
    debtPoolSplitBps     // New: debt pool split (e.g., 1000 = 10%)
);
```

### 3. Grant MINTER Role to DebtPool
```solidity
stToken.grantRole(MINTER_ROLE, address(debtPool));
```

### 4. Configure Debt Pool (Optional)
```solidity
// If using existing FeeController:
feeController.setRecipients(
    treasuryAddress,
    operatorAddress,
    referralRegistryAddress,
    debtPoolAddress
);

feeController.setFee(
    feeBps,
    treasurySplitBps,
    operatorSplitBps,
    debtPoolSplitBps
);
```

## Usage Examples

### Creating a Distribution

1. **Accumulate Fees**: Fees automatically flow to debt pool as stETH shares
2. **Unwrap to wstETH**: Call `receiveStETHAndUnwrap()` from FeeController
3. **Generate Merkle Tree**: Off-chain script to generate merkle tree for recipients
4. **Create Distribution**: Admin calls `createDistribution(merkleRoot, totalAmount)`

### Claiming

```solidity
// User claim
debtPool.claim(
    distributionId,
    userAddress,
    amount,
    merkleProof
);
```

## Testing Requirements

### Unit Tests Needed

1. **FeeController Tests**
   - Test debt pool split calculation
   - Test zero address behavior (debt pool disabled)
   - Test backward compatibility with existing deployments
   - Test access control for configuration functions

2. **DebtPool Tests**
   - Test stETH reception and unwrapping
   - Test merkle proof verification
   - Test distribution creation
   - Test claim functionality
   - Test claim replay protection
   - Test unclaimed fund recovery
   - Test access control

3. **Integration Tests**
   - Test fee distribution with debt pool enabled
   - Test fee distribution with debt pool disabled
   - Test end-to-end flow from oracle report to claim
   - Test share minting to debt pool

### Test Scenarios

- Happy path: Fees → Debt Pool → Distribution → Claim
- Edge case: Debt pool address set to zero
- Edge case: Invalid merkle proof
- Edge case: Double claim attempt
- Edge case: Insufficient balance for distribution
- Security: Unauthorized distribution creation
- Security: Unauthorized merkle root update

## Gas Optimization Opportunities

1. **DebtPool Contract**
   - Use immutable variables for constant values
   - Consider packing struct variables
   - Optimize merkle proof verification
   - Use custom errors instead of require strings

2. **FeeController Contract**
   - Gas is minimal for additional variables (already optimized)

## Known Limitations

1. **Claim Tracking**
   - `_getClaimedAmount()` is a placeholder
   - Should implement proper per-distribution claimed tracking
   - Consider using a counter or mapping

2. **Access Control**
   - `receiveStETHAndUnwrap()` lacks access control
   - Should only be callable by FeeController
   - Consider adding `onlyFeeController` modifier

3. **Unwrapping**
   - Uses low-level call to wstETH `wrap()` function
   - Should validate function signature
   - Consider using interface for type safety

4. **Pause Mechanism**
   - No emergency pause in DebtPool
   - Consider adding pause functionality via GOV role

## Recommendations

### Immediate (Before Deployment)
1. Add access control to `receiveStETHAndUnwrap()`
2. Implement proper claimed amount tracking
3. Add interface for wstETH instead of low-level call
4. Add emergency pause mechanism
5. Add contract code validation for debt pool address

### Short Term (Post-Deployment)
1. Implement comprehensive test suite
2. Add monitoring for debt pool operations
3. Create off-chain merkle tree generation script
4. Document operational procedures
5. Set up alerting for failed distributions

### Long Term
1. Consider adding batch claim functionality
2. Consider adding claim deadline mechanism
3. Consider adding multi-recipient claim optimization
4. Consider adding integration with referral system

## Configuration Example

### Initial Deployment Configuration
```solidity
// Fee split (basis points)
feeBps = 1000;              // 10% total fee
treasurySplitBps = 4000;    // 40% of fee = 4% of rewards
operatorSplitBps = 2000;    // 20% of fee = 2% of rewards
debtPoolSplitBps = 2000;    // 20% of fee = 2% of rewards
referralPool = 2000;        // 20% of fee = 2% of rewards (remainder)
```

### Distribution Example
```solidity
// After 100 ETH rewards:
totalFee = 10 ETH
treasury = 4 ETH
operator = 2 ETH
debtPool = 2 ETH (sent as stETH shares, unwrapped to wstETH)
referral = 2 ETH
```

## Audit Checklist

- [ ] Access control properly implemented
- [ ] Input validation on all public functions
- [ ] Reentrancy protection on external calls
- [ ] Proper error handling and custom errors
- [ ] Comprehensive event logging
- [ ] Backward compatibility maintained
- [ ] Gas optimization reviewed
- [ ] Test coverage > 80%
- [ ] Security best practices followed
- [ ] Documentation complete

## Conclusion

The Debt Pool implementation provides a secure, flexible mechanism for directing protocol fees to a claimable pool with merkle tree distribution. The design maintains backward compatibility and follows SharedStake V2's existing patterns while adding the requested debt repayment functionality.

**Critical Issues to Address Before Deployment:**
1. Add access control to `receiveStETHAndUnwrap()`
2. Implement proper claimed amount tracking
3. Add contract validation for debt pool address
4. Add comprehensive test suite
5. Add emergency pause mechanism

**Estimated Deployment Timeline:**
- Contract fixes: 1-2 days
- Testing: 3-5 days
- Audit: 1-2 weeks
- Deployment: 1-2 days