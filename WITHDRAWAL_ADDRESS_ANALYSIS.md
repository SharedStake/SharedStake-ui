# Validator Withdrawal Address Analysis

## Summary

Analysis of 500 validator indices reveals where validator rewards and withdrawals are directed.

## Key Findings

### Withdrawal Address Distribution

**Primary Withdrawal Address:**
- **Address:** `0xa1feaf41d843d53d0f6bed86a8cf592ce21c409e`
- **Total Validators:** 490 out of 500 (98%)
  - **Active:** 30 validators
  - **Exited:** 460 validators
- **Current Balance:** ~960.20 ETH (from active validators only; exited validators have withdrawn)

**BLS Withdrawal Credentials (Legacy):**
- **Count:** 10 validators (2%)
- **Status:** All 10 are still active
- **Note:** These validators use the older BLS withdrawal credential format (0x00 prefix), which means they cannot directly withdraw to an Ethereum address. They would need to update their withdrawal credentials to enable withdrawals.

## Detailed Breakdown

### Active Validators (40 total)

**With ETH1 Withdrawal Address (30 validators):**
- All use: `0xa1feaf41d843d53d0f6bed86a8cf592ce21c409e`
- Average balance: ~32.01 ETH
- Total balance: ~960.20 ETH

**With BLS Credentials (10 validators):**
- Indices: 91047, 91049, 91050, 91052, 91053, 91063, 91081, 91082, 91083, 91084
- Average balance: ~37.85 ETH (higher due to longer staking period)
- Total balance: ~381.46 ETH
- These are older validators that haven't updated their withdrawal credentials

### Exited Validators (460 total)

- **All 460 exited validators** used the withdrawal address: `0xa1feaf41d843d53d0f6bed86a8cf592ce21c409e`
- All have withdrawn their funds (balance: 0.0000 ETH)
- Exit epochs range from 218,524 to 291,516

## Where Rewards and Withdrawals Go

### For Active Validators with ETH1 Address:
- **Staking rewards** accumulate in the validator balance
- **Withdrawals** (when validators exit) go to: `0xa1feaf41d843d53d0f6bed86a8cf592ce21c409e`
- **Partial withdrawals** (excess above 32 ETH) also go to this address

### For Active Validators with BLS Credentials:
- **Staking rewards** accumulate in the validator balance
- **Cannot withdraw** until withdrawal credentials are updated to an ETH1 address
- These validators need to perform a BLS-to-Execution change to enable withdrawals

### For Exited Validators:
- All funds have been withdrawn to: `0xa1feaf41d843d53d0f6bed86a8cf592ce21c409e`
- The withdrawal process completed after their exit epochs

## Important Notes

1. **Centralized Withdrawal Address:** 98% of validators use the same withdrawal address, indicating centralized control or a shared staking service.

2. **Legacy Validators:** 10 validators still use BLS withdrawal credentials and cannot withdraw until they update their credentials. These appear to be older validators with higher balances.

3. **Total Value:** 
   - Active validators with ETH1 address: ~960.20 ETH
   - Active validators with BLS credentials: ~381.46 ETH
   - **Total Active Value: ~1,341.66 ETH**

4. **Exited Validators:** All 460 exited validators have successfully withdrawn their funds to the shared withdrawal address.

## Files Generated

- `active_validators_withdrawal_addresses.txt` - Active validators with their withdrawal addresses
- `exited_validators_withdrawal_addresses.txt` - Exited validators with withdrawal addresses and exit epochs
- `withdrawal_address_summary.txt` - Summary grouped by withdrawal address
- `withdrawal_addresses_data.json` - Complete data in JSON format

## Verification

All data was verified by:
1. Fetching validator details from beaconcha.in API
2. Decoding withdrawal credentials to extract ETH1 addresses
3. Cross-referencing with validator status and balances
4. Grouping by withdrawal address to show fund destinations
