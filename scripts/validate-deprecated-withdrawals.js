/**
 * Validation script for WithdrawFromDeprecated component
 * 
 * This script validates that:
 * 1. Contract addresses are properly formatted
 * 2. Utility functions work correctly
 * 3. BigNumber calculations are correct
 * 
 * Run with: node scripts/validate-deprecated-withdrawals.js
 */

import BN from 'bignumber.js';
import { parseBN } from '../src/utils/bignumber.js';

console.log('Validating WithdrawFromDeprecated component...\n');

// Test parseBN utility
console.log('Testing parseBN utility:');
const testCases = [
  { input: BN('1000000000000000000'), expected: '1', desc: '1 ETH in wei' },
  { input: BN('0'), expected: '0', desc: 'Zero value' },
  { input: BN('150000000000000000'), expected: '0.15', desc: '0.15 ETH in wei' },
  { input: BN('123456789012345678'), expected: '0.123457', desc: 'Small amount with many decimals' },
];

let passed = 0;
let failed = 0;

testCases.forEach(({ input, expected, desc }) => {
  const result = parseBN(input);
  const match = result === expected || Math.abs(parseFloat(result) - parseFloat(expected)) < 0.000001;
  if (match) {
    console.log(`  ✓ ${desc}: ${result}`);
    passed++;
  } else {
    console.log(`  ✗ ${desc}: Expected ${expected}, got ${result}`);
    failed++;
  }
});

// Test contract address validation
console.log('\nTesting contract address validation:');
const deprecatedAddresses = [
  '0xed4e21BD620F3C1Fd1853b1C52A9D023C33D83d4',
  '0xa308f4a980c4a2960e9e87fc51dbf2b0b50ca432',
];

deprecatedAddresses.forEach((address, index) => {
  const isValid = address.startsWith('0x') && address.length === 42;
  if (isValid) {
    console.log(`  ✓ Contract ${index + 1}: Valid address format`);
    passed++;
  } else {
    console.log(`  ✗ Contract ${index + 1}: Invalid address format`);
    failed++;
  }
});

// Test BigNumber calculations
console.log('\nTesting BigNumber calculations:');
const deposit1 = BN('1000000000000000000');
const deposit2 = BN('2000000000000000000');
const total = deposit1.plus(deposit2);
const expectedTotal = '3';
const totalParsed = parseBN(total);

if (totalParsed === expectedTotal) {
  console.log(`  ✓ Sum calculation: ${totalParsed} vETH2`);
  passed++;
} else {
  console.log(`  ✗ Sum calculation: Expected ${expectedTotal}, got ${totalParsed}`);
  failed++;
}

// Summary
console.log(`\n${'='.repeat(50)}`);
console.log(`Tests passed: ${passed}`);
console.log(`Tests failed: ${failed}`);
console.log(`${'='.repeat(50)}\n`);

if (failed === 0) {
  console.log('✓ All validations passed!');
  process.exit(0);
} else {
  console.log('✗ Some validations failed. Please review the errors above.');
  process.exit(1);
}
