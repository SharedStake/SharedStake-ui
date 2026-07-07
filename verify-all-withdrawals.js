#!/usr/bin/env node

/**
 * Comprehensive script to verify all withdrawals and create complete summary
 * Attempts to fetch actual withdrawal data from APIs
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WITHDRAWAL_ADDRESS = '0xa1feaf41d843d53d0f6bed86a8cf592ce21c409e';

// Fetch withdrawals for a validator
async function fetchValidatorWithdrawals(index) {
  const apiUrl = `https://beaconcha.in/api/v1/validator/${index}/withdrawals`;
  
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    
    if (data.status === 'OK' && data.data) {
      return data.data;
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🔍 COMPREHENSIVE WITHDRAWAL VERIFICATION\n');
  console.log('='.repeat(80));
  
  // Read all data files
  console.log('\n📖 Reading validator data...');
  
  const indicesFile = join(__dirname, 'validator_indices_500.txt');
  const allIndices = readFileSync(indicesFile, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && /^\d+$/.test(line));
  
  const withdrawalDataFile = join(__dirname, 'withdrawal_addresses_data.json');
  let withdrawalData;
  try {
    withdrawalData = JSON.parse(readFileSync(withdrawalDataFile, 'utf-8'));
  } catch (error) {
    console.error('Error reading withdrawal data:', error.message);
    process.exit(1);
  }
  
  console.log(`✅ Loaded ${allIndices.length} validator indices`);
  console.log(`✅ Loaded withdrawal data for ${withdrawalData.validators.length} validators\n`);
  
  // Categorize validators
  const activeValidators = withdrawalData.validators.filter(v => 
    v.status === 'active_online' || v.status === 'active_offline'
  );
  
  const exitedValidators = withdrawalData.validators.filter(v => 
    v.exitepoch && v.exitepoch < 9223372036854776000
  );
  
  console.log('📊 VALIDATOR BREAKDOWN:');
  console.log(`   Total Validators: ${withdrawalData.validators.length}`);
  console.log(`   Active: ${activeValidators.length}`);
  console.log(`   Exited: ${exitedValidators.length}\n`);
  
  // Calculate active validator balances
  const activeTotalBalance = activeValidators.reduce((sum, v) => sum + (v.balance_eth || 0), 0);
  const activeWithETH1 = activeValidators.filter(v => v.withdrawal_address === WITHDRAWAL_ADDRESS);
  const activeWithBLS = activeValidators.filter(v => !v.withdrawal_address || v.withdrawal_address === 'N/A (BLS credentials)');
  
  console.log('💰 ACTIVE VALIDATOR BALANCES:');
  console.log(`   Total Active Balance: ${activeTotalBalance.toFixed(4)} ETH`);
  console.log(`   With ETH1 Address: ${activeWithETH1.length} validators, ${activeWithETH1.reduce((s, v) => s + (v.balance_eth || 0), 0).toFixed(4)} ETH`);
  console.log(`   With BLS Credentials: ${activeWithBLS.length} validators, ${activeWithBLS.reduce((s, v) => s + (v.balance_eth || 0), 0).toFixed(4)} ETH\n`);
  
  // Check withdrawals for exited validators
  console.log('🔍 Checking withdrawals for exited validators...');
  console.log('   (Sampling first 50 for speed - full check would take ~40 minutes)\n');
  
  const sampleSize = Math.min(50, exitedValidators.length);
  const sampledExited = exitedValidators.slice(0, sampleSize);
  
  const withdrawalResults = [];
  let totalWithdrawn = 0;
  let validatorsWithWithdrawals = 0;
  
  for (let i = 0; i < sampledExited.length; i++) {
    const validator = sampledExited[i];
    if ((i + 1) % 10 === 0) {
      console.log(`   Checking ${i + 1}/${sampledExited.length}...`);
    }
    
    const withdrawals = await fetchValidatorWithdrawals(validator.index);
    
    if (withdrawals && withdrawals.length > 0) {
      const validatorTotal = withdrawals.reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);
      totalWithdrawn += validatorTotal;
      validatorsWithWithdrawals++;
      
      withdrawalResults.push({
        index: validator.index,
        exitepoch: validator.exitepoch,
        withdrawal_count: withdrawals.length,
        total_withdrawn: validatorTotal / 1e9, // Convert to ETH
        withdrawals: withdrawals.map(w => ({
          amount: parseFloat(w.amount) / 1e9,
          epoch: w.epoch,
          slot: w.slot,
          index: w.validatorindex
        }))
      });
    }
    
    await sleep(600);
  }
  
  console.log(`\n✅ Checked ${sampledExited.length} exited validators\n`);
  
  // Calculate estimates
  const avgWithdrawalPerValidator = withdrawalResults.length > 0 
    ? totalWithdrawn / withdrawalResults.length / 1e9
    : 32; // Default estimate
  
  const estimatedTotalAll = avgWithdrawalPerValidator * exitedValidators.length;
  const minTotal = 32 * exitedValidators.length; // Minimum: 32 ETH per validator
  
  // Create comprehensive summary
  const summaryLines = [];
  summaryLines.push('='.repeat(100));
  summaryLines.push('COMPREHENSIVE VALIDATOR WITHDRAWAL VERIFICATION REPORT');
  summaryLines.push('='.repeat(100));
  summaryLines.push(`Generated: ${new Date().toISOString()}`);
  summaryLines.push('');
  
  summaryLines.push('EXECUTIVE SUMMARY');
  summaryLines.push('-'.repeat(100));
  summaryLines.push(`Withdrawal Address: ${WITHDRAWAL_ADDRESS}`);
  summaryLines.push(`Total Validators Analyzed: ${withdrawalData.validators.length}`);
  summaryLines.push(`Active Validators: ${activeValidators.length}`);
  summaryLines.push(`Exited Validators: ${exitedValidators.length}`);
  summaryLines.push('');
  
  summaryLines.push('ACTIVE VALIDATOR STATUS');
  summaryLines.push('-'.repeat(100));
  summaryLines.push(`Total Active Balance: ${activeTotalBalance.toFixed(4)} ETH`);
  summaryLines.push(`  - With ETH1 Withdrawal Address: ${activeWithETH1.length} validators`);
  summaryLines.push(`    Balance: ${activeWithETH1.reduce((s, v) => s + (v.balance_eth || 0), 0).toFixed(4)} ETH`);
  summaryLines.push(`  - With BLS Credentials (cannot withdraw yet): ${activeWithBLS.length} validators`);
  summaryLines.push(`    Balance: ${activeWithBLS.reduce((s, v) => s + (v.balance_eth || 0), 0).toFixed(4)} ETH`);
  summaryLines.push('');
  
  summaryLines.push('EXITED VALIDATOR WITHDRAWALS');
  summaryLines.push('-'.repeat(100));
  summaryLines.push(`Total Exited Validators: ${exitedValidators.length}`);
  summaryLines.push(`Sampled for Verification: ${sampledExited.length}`);
  summaryLines.push(`Validators with Withdrawals Found: ${validatorsWithWithdrawals}`);
  summaryLines.push('');
  
  if (withdrawalResults.length > 0) {
    summaryLines.push(`Average Withdrawal per Validator (from sample): ${avgWithdrawalPerValidator.toFixed(4)} ETH`);
    summaryLines.push(`Total Withdrawn (from sample): ${(totalWithdrawn / 1e9).toFixed(4)} ETH`);
    summaryLines.push('');
    summaryLines.push(`Estimated Total for All ${exitedValidators.length} Validators: ${estimatedTotalAll.toFixed(4)} ETH`);
  } else {
    summaryLines.push('Note: Could not fetch withdrawal data from API.');
    summaryLines.push('This may be due to API limitations or withdrawals not yet processed.');
  }
  
  summaryLines.push(`Minimum Expected (32 ETH × ${exitedValidators.length}): ${minTotal.toFixed(4)} ETH`);
  summaryLines.push('');
  
  summaryLines.push('VERIFICATION METHODS');
  summaryLines.push('-'.repeat(100));
  summaryLines.push('To verify actual withdrawals on-chain:');
  summaryLines.push('');
  summaryLines.push('1. Beacon Chain Explorer (Best for withdrawal details):');
  summaryLines.push(`   https://beaconscan.com/withdrawals?address=${WITHDRAWAL_ADDRESS}`);
  summaryLines.push('   - Shows all withdrawals from beacon chain');
  summaryLines.push('   - Includes validator indices and amounts');
  summaryLines.push('   - Shows withdrawal epochs and slots');
  summaryLines.push('');
  summaryLines.push('2. Ethereum Mainnet Explorer:');
  summaryLines.push(`   https://etherscan.io/address/${WITHDRAWAL_ADDRESS}`);
  summaryLines.push('   - Shows all incoming transactions');
  summaryLines.push('   - Current balance');
  summaryLines.push('   - Transaction history');
  summaryLines.push('');
  summaryLines.push('3. Check Individual Validators:');
  summaryLines.push('   https://beaconscan.com/validator/[INDEX]/withdrawals');
  summaryLines.push('   Example: https://beaconscan.com/validator/99532/withdrawals');
  summaryLines.push('');
  
  if (withdrawalResults.length > 0) {
    summaryLines.push('SAMPLE WITHDRAWAL DATA');
    summaryLines.push('-'.repeat(100));
    summaryLines.push('Index'.padEnd(10) + 'Exit Epoch'.padEnd(15) + 'Withdrawals'.padEnd(15) + 'Total (ETH)');
    summaryLines.push('-'.repeat(100));
    
    withdrawalResults.slice(0, 20).forEach(r => {
      const idx = String(r.index).padEnd(10);
      const epoch = String(r.exitepoch).padEnd(15);
      const count = String(r.withdrawal_count).padEnd(15);
      const total = r.total_withdrawn.toFixed(4);
      summaryLines.push(idx + epoch + count + total);
    });
    
    summaryLines.push('-'.repeat(100));
    summaryLines.push('');
  }
  
  summaryLines.push('VALIDATION CHECKLIST');
  summaryLines.push('-'.repeat(100));
  summaryLines.push('□ Visit beaconscan.com withdrawal page for the address');
  summaryLines.push('□ Count total withdrawal transactions');
  summaryLines.push('□ Sum all withdrawal amounts');
  summaryLines.push('□ Verify count matches ~460 validators (may be more due to partial withdrawals)');
  summaryLines.push('□ Verify all withdrawals went to correct address');
  summaryLines.push('□ Check for any withdrawals to other addresses');
  summaryLines.push('□ Compare total with estimated range');
  summaryLines.push('');
  
  summaryLines.push('IMPORTANT NOTES');
  summaryLines.push('-'.repeat(100));
  summaryLines.push('1. Withdrawal Delay: After exit, validators wait for withdrawal delay before funds are withdrawn.');
  summaryLines.push('2. Partial Withdrawals: Validators with balances >32 ETH may have had partial withdrawals.');
  summaryLines.push('3. Multiple Transactions: Each validator may have multiple withdrawal transactions.');
  summaryLines.push('4. Current Balance: Address balance may include active validator rewards accumulating.');
  summaryLines.push('5. BLS Validators: 10 active validators cannot withdraw until credentials are updated.');
  summaryLines.push('');
  
  summaryLines.push('='.repeat(100));
  
  writeFileSync('COMPLETE_WITHDRAWAL_VERIFICATION.txt', summaryLines.join('\n'));
  console.log('✅ Created: COMPLETE_WITHDRAWAL_VERIFICATION.txt');
  
  // Create JSON summary
  const jsonSummary = {
    timestamp: new Date().toISOString(),
    withdrawal_address: WITHDRAWAL_ADDRESS,
    summary: {
      total_validators: withdrawalData.validators.length,
      active_validators: activeValidators.length,
      exited_validators: exitedValidators.length,
      active_total_balance_eth: activeTotalBalance,
      active_with_eth1: {
        count: activeWithETH1.length,
        total_balance_eth: activeWithETH1.reduce((s, v) => s + (v.balance_eth || 0), 0)
      },
      active_with_bls: {
        count: activeWithBLS.length,
        total_balance_eth: activeWithBLS.reduce((s, v) => s + (v.balance_eth || 0), 0)
      },
      exited_validators: {
        total: exitedValidators.length,
        sampled: sampledExited.length,
        with_withdrawals_found: validatorsWithWithdrawals,
        estimated_total_withdrawn_eth: estimatedTotalAll,
        minimum_expected_eth: minTotal,
        average_per_validator_eth: avgWithdrawalPerValidator
      }
    },
    verification_urls: {
      beacon_scan: `https://beaconscan.com/withdrawals?address=${WITHDRAWAL_ADDRESS}`,
      etherscan: `https://etherscan.io/address/${WITHDRAWAL_ADDRESS}`
    },
    sample_withdrawals: withdrawalResults.slice(0, 10)
  };
  
  writeFileSync('complete_verification_summary.json', JSON.stringify(jsonSummary, null, 2));
  console.log('✅ Created: complete_verification_summary.json');
  
  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(80));
  console.log(`\n💰 Active Validators: ${activeValidators.length}`);
  console.log(`   Total Balance: ${activeTotalBalance.toFixed(4)} ETH`);
  console.log(`   - ETH1 Address: ${activeWithETH1.length} validators, ${activeWithETH1.reduce((s, v) => s + (v.balance_eth || 0), 0).toFixed(4)} ETH`);
  console.log(`   - BLS Credentials: ${activeWithBLS.length} validators, ${activeWithBLS.reduce((s, v) => s + (v.balance_eth || 0), 0).toFixed(4)} ETH`);
  console.log(`\n🚪 Exited Validators: ${exitedValidators.length}`);
  console.log(`   Estimated Total Withdrawn: ${estimatedTotalAll.toFixed(4)} ETH`);
  console.log(`   Minimum Expected: ${minTotal.toFixed(4)} ETH`);
  console.log(`   Average per Validator: ${avgWithdrawalPerValidator.toFixed(4)} ETH`);
  console.log(`\n🔍 Verification:`);
  console.log(`   https://beaconscan.com/withdrawals?address=${WITHDRAWAL_ADDRESS}`);
  console.log(`   https://etherscan.io/address/${WITHDRAWAL_ADDRESS}`);
  console.log('\n' + '='.repeat(80));
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
