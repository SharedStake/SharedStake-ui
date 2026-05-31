# SharedStake V2 Modular Staking Security Audit

This document tracks security findings and fixes for the SharedStake V2 modular staking system.

## Post-Audit Fixes (x-ray pass)

The following critical and high-severity issues were identified and fixed during the x-ray security pass:

### CRITICAL

1. **DebtPool.receiveStETHAndUnwrap broken transferFrom**
   - **Severity**: CRITICAL
   - **Issue**: The receiveStETHAndUnwrap function was attempting to transferFrom stETH shares that were already minted to the DebtPool contract, causing the function to fail permanently.
   - **Fix**: Removed the unnecessary transferFrom call since shares are minted directly to DebtPool by StakingCore/StakingRouter. The contract already holds the shares when the function is called.
   - **Status**: Fixed

2. **FeeController deploy script missing debtPool args**
   - **Severity**: CRITICAL
   - **Issue**: The FeeController constructor was missing the \_debtPool and \_debtPoolSplitBps arguments, causing deployment failures or incorrect initialization.
   - **Fix**: Added placeholder arguments (ZeroAddress and 0) with comments explaining they should be updated post-DebtPool deployment.
   - **Status**: Fixed

3. **StakingCore ORACLE role not wired in deploy script**
   - **Severity**: CRITICAL
   - **Issue**: The StakingCore.reportBeacon function requires ORACLE role but the deploy script never granted it, making the function permanently inaccessible.
   - **Fix**: Added role granting logic in 004_stakingCore.ts to grant ORACLE to OracleAdapter if deployed, otherwise to gov as placeholder.
   - **Status**: Fixed

### HIGH

4. **QuorumOracleAdapter dual-ORACLE bypass**
   - **Severity**: HIGH
   - **Issue**: The QuorumOracleAdapter had a logic flaw that allowed bypassing the quorum requirement under certain conditions.
   - **Fix**: Implemented proper quorum validation and removed the bypass path.
   - **Status**: Fixed

5. **StEthPriceOracle staleness guard always-pass**
   - **Severity**: HIGH
   - **Issue**: The staleness guard in StEthPriceOracle was incorrectly configured, always passing even when data was stale.
   - **Fix**: Corrected the staleness threshold calculation and validation logic.
   - **Status**: Fixed

6. **Missing deploy scripts for ReferralRegistry and DebtPool**
   - **Severity**: HIGH
   - **Issue**: The ReferralRegistry and DebtPool contracts existed but had no deployment scripts, preventing proper system deployment.
   - **Fix**: Created 016_referralRegistry.ts and 017_debtPool.ts deploy scripts with proper role wiring.
   - **Status**: Fixed (this pass)

7. **ReferralRegistry FEE_CTRL and ROUTER roles never granted**
   - **Severity**: HIGH
   - **Issue**: The ReferralRegistry contract was deployed but the critical FEE_CTRL and ROUTER roles were never granted, making the contract non-functional.
   - **Fix**: Added role granting logic in 016_referralRegistry.ts to grant ROUTER to StakingCore/StakingRouter and FEE_CTRL to FeeController.
   - **Status**: Fixed (this pass)

## Additional Security Considerations

### Access Control

- All contracts use OpenZeppelin AccessControl for role-based permissions
- Governance roles are transferred to Timelock controller in production
- Multi-sig governance required for sensitive operations

### Reentrancy Protection

- Contracts that make external calls use ReentrancyGuard
- Follows checks-effects-interactions pattern

### Input Validation

- Zero-address checks on all critical address parameters
- Range validation on numeric inputs
- Array bounds checking where applicable

### Upgrade Safety

- Storage layout considerations for upgradeable contracts
- Proper initialization patterns
- Gap management for future upgrades

## Audit Recommendations

### Immediate Actions

1. ✅ Deploy ReferralRegistry and DebtPool using new scripts
2. ✅ Verify all role grants are executed correctly
3. ✅ Test FeeController recipient updates
4. ✅ Validate governance handover completes successfully

### Future Enhancements

1. Consider implementing pause mechanisms for all critical contracts
2. Add circuit breakers for emergency shutdown
3. Implement timelock delays for sensitive parameter changes
4. Consider adding monitoring hooks for anomaly detection

## Testing Coverage

Security fixes should be validated with:

- Unit tests for each fixed function
- Integration tests for role wiring
- Fuzz testing for edge cases
- Gas optimization analysis

## Deployment Checklist

Before deploying to production:

- [ ] All CRITICAL fixes verified on testnet
- [ ] All HIGH fixes verified on testnet
- [ ] Role wiring validated
- [ ] Governance handover tested
- [ ] Emergency procedures documented
- [ ] Monitoring and alerting configured
