#!/usr/bin/env node
/**
 * Script to verify withdrawals on Ethereum blockchain
 * Run this to check actual withdrawal amounts
 */

const WITHDRAWAL_ADDRESS = '0xa1feaf41d843d53d0f6bed86a8cf592ce21c409e';
const EXPECTED_VALIDATORS = 460;
const ESTIMATED_TOTAL = 25854.3474;

console.log('🔍 Withdrawal Verification');
console.log('='.repeat(70));
console.log(`Withdrawal Address: ${WITHDRAWAL_ADDRESS}`);
console.log(`Expected Validators: ${EXPECTED_VALIDATORS}`);
console.log(`Estimated Total: ${ESTIMATED_TOTAL} ETH`);
console.log('');
console.log('Check these URLs:');
console.log(`1. Beacon Scan: https://beaconscan.com/withdrawals?address=${WITHDRAWAL_ADDRESS}`);
console.log(`2. Etherscan: https://etherscan.io/address/${WITHDRAWAL_ADDRESS}`);
console.log('');
console.log('Note: You may need to manually sum withdrawal transactions.');
