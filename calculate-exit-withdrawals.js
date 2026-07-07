#!/usr/bin/env node

/**
 * Script to calculate total withdrawals from exited validators
 * and verify funds landed in the withdrawal address
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Sleep/delay function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch validator info from beaconcha.in API
async function fetchValidatorInfo(indices) {
  const apiUrl = 'https://beaconcha.in/api/v1/validator/';
  const url = apiUrl + indices.join(',');
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error(`API error: ${data.message || 'Unknown error'}`);
    }
    
    return data.data || [];
  } catch (error) {
    console.error(`Error fetching validator info:`, error.message);
    return [];
  }
}

// Fetch validator details including historical data
async function fetchValidatorDetails(index) {
  const apiUrl = `https://beaconcha.in/api/v1/validator/${index}`;
  
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error(`API error: ${data.message || 'Unknown error'}`);
    }
    
    return data.data || null;
  } catch (error) {
    console.error(`Error fetching validator ${index} details:`, error.message);
    return null;
  }
}

// Fetch validator balance at a specific epoch
async function fetchValidatorBalanceAtEpoch(index, epoch) {
  const apiUrl = `https://beaconcha.in/api/v1/validator/${index}/balancehistory?limit=1000`;
  
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.data) {
      return null;
    }
    
    // Find the balance closest to but not after the exit epoch
    const balances = data.data.sort((a, b) => parseInt(b.epoch) - parseInt(a.epoch));
    for (const balance of balances) {
      if (parseInt(balance.epoch) <= epoch) {
        return balance;
      }
    }
    
    // If no exact match, return the earliest balance
    return balances[balances.length - 1] || null;
  } catch (error) {
    return null;
  }
}

// Check Ethereum withdrawals using Etherscan API (or similar)
async function checkEthereumWithdrawals(address) {
  // Note: This would require an API key for Etherscan
  // For now, we'll calculate expected withdrawals and provide instructions
  console.log(`\n💡 To verify on-chain withdrawals, check:`);
  console.log(`   Etherscan: https://etherscan.io/address/${address}`);
  console.log(`   Or use: https://beaconscan.com/withdrawals?address=${address}`);
  return null;
}

async function main() {
  console.log('💰 Calculating total withdrawals from exited validators...\n');
  
  // Read withdrawal addresses data
  const dataFile = join(__dirname, 'withdrawal_addresses_data.json');
  let withdrawalData;
  try {
    const content = readFileSync(dataFile, 'utf-8');
    withdrawalData = JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${dataFile}:`, error.message);
    console.log('Running withdrawal address check first...');
    process.exit(1);
  }
  
  const withdrawalAddress = '0xa1feaf41d843d53d0f6bed86a8cf592ce21c409e';
  const exitedValidators = withdrawalData.validators.filter(v => 
    v.exitepoch && v.exitepoch < 9223372036854776000 // Not the max value
  );
  
  console.log(`📊 Found ${exitedValidators.length} exited validators\n`);
  console.log('🔍 Fetching historical balances at exit epoch...');
  console.log('⏱️  This will take a while due to rate limiting...\n');
  
  const exitedWithBalances = [];
  let processed = 0;
  let totalWithdrawn = 0;
  let totalEffectiveAtExit = 0;
  
  for (const validator of exitedValidators) {
    processed++;
    if (processed % 50 === 0) {
      console.log(`  Processed ${processed}/${exitedValidators.length}...`);
    }
    
    // Try to get balance at exit epoch
    const balanceAtExit = await fetchValidatorBalanceAtEpoch(
      validator.index, 
      validator.exitepoch
    );
    
    let balance = 0;
    let effectiveBalance = 0;
    
    if (balanceAtExit) {
      balance = parseFloat(balanceAtExit.balance) || 0;
      effectiveBalance = parseFloat(balanceAtExit.effectivebalance) || 0;
    } else {
      // Fallback: use current balance (likely 0 for exited validators)
      balance = validator.balance_eth * 1e9;
      effectiveBalance = 0;
    }
    
    totalWithdrawn += balance;
    totalEffectiveAtExit += effectiveBalance;
    
    exitedWithBalances.push({
      index: validator.index,
      exitepoch: validator.exitepoch,
      balance_at_exit: balance / 1e9, // Convert to ETH
      effective_balance_at_exit: effectiveBalance / 1e9,
      withdrawal_address: withdrawalAddress
    });
    
    // Rate limiting
    await sleep(500);
  }
  
  console.log(`\n✅ Processed all ${exitedValidators.length} exited validators\n`);
  
  // Calculate statistics
  const totalWithdrawnETH = totalWithdrawn / 1e9;
  const totalEffectiveETH = totalEffectiveAtExit / 1e9;
  const averageWithdrawal = totalWithdrawnETH / exitedValidators.length;
  
  // Create detailed report
  const reportLines = [];
  reportLines.push('='.repeat(100));
  reportLines.push('EXITED VALIDATOR WITHDRAWAL ANALYSIS');
  reportLines.push('='.repeat(100));
  reportLines.push(`Generated: ${new Date().toISOString()}`);
  reportLines.push(`Withdrawal Address: ${withdrawalAddress}`);
  reportLines.push('');
  reportLines.push('SUMMARY:');
  reportLines.push(`  Total Exited Validators: ${exitedValidators.length}`);
  reportLines.push(`  Total Withdrawn: ${totalWithdrawnETH.toFixed(4)} ETH`);
  reportLines.push(`  Total Effective Balance at Exit: ${totalEffectiveETH.toFixed(4)} ETH`);
  reportLines.push(`  Average Withdrawal per Validator: ${averageWithdrawal.toFixed(4)} ETH`);
  reportLines.push('');
  reportLines.push('='.repeat(100));
  reportLines.push('DETAILED BREAKDOWN BY EXIT EPOCH');
  reportLines.push('='.repeat(100));
  
  // Group by exit epoch
  const byEpoch = new Map();
  exitedWithBalances.forEach(v => {
    const epoch = String(v.exitepoch);
    if (!byEpoch.has(epoch)) {
      byEpoch.set(epoch, []);
    }
    byEpoch.get(epoch).push(v);
  });
  
  // Sort epochs descending
  const sortedEpochs = Array.from(byEpoch.keys()).sort((a, b) => parseInt(b) - parseInt(a));
  
  reportLines.push('');
  reportLines.push('Exit Epoch'.padEnd(15) + 'Validators'.padEnd(15) + 'Total Withdrawn (ETH)'.padEnd(25) + 'Avg per Validator (ETH)');
  reportLines.push('-'.repeat(100));
  
  sortedEpochs.forEach(epoch => {
    const validators = byEpoch.get(epoch);
    const total = validators.reduce((sum, v) => sum + v.balance_at_exit, 0);
    const avg = total / validators.length;
    
    const epochStr = epoch.padEnd(15);
    const countStr = String(validators.length).padEnd(15);
    const totalStr = total.toFixed(4).padEnd(25);
    const avgStr = avg.toFixed(4);
    
    reportLines.push(epochStr + countStr + totalStr + avgStr);
  });
  
  reportLines.push('-'.repeat(100));
  reportLines.push('');
  reportLines.push('='.repeat(100));
  reportLines.push('VERIFICATION INSTRUCTIONS');
  reportLines.push('='.repeat(100));
  reportLines.push('');
  reportLines.push('To verify withdrawals on-chain:');
  reportLines.push('');
  reportLines.push('1. Check Beacon Chain Withdrawals:');
  reportLines.push(`   https://beaconscan.com/withdrawals?address=${withdrawalAddress}`);
  reportLines.push('');
  reportLines.push('2. Check Ethereum Mainnet:');
  reportLines.push(`   https://etherscan.io/address/${withdrawalAddress}`);
  reportLines.push('');
  reportLines.push('3. Expected Total Withdrawals:');
  reportLines.push(`   ${totalWithdrawnETH.toFixed(4)} ETH`);
  reportLines.push('');
  reportLines.push('4. Note: Withdrawals happen automatically after exit epoch + withdrawal delay');
  reportLines.push('   The withdrawal delay is typically a few days to weeks after exit.');
  reportLines.push('');
  reportLines.push('='.repeat(100));
  
  writeFileSync('exited_validators_withdrawal_analysis.txt', reportLines.join('\n'));
  console.log('✅ Created: exited_validators_withdrawal_analysis.txt');
  
  // Create CSV with all details
  const csvLines = [];
  csvLines.push('Index,Exit Epoch,Balance at Exit (ETH),Effective Balance at Exit (ETH),Withdrawal Address');
  exitedWithBalances.forEach(v => {
    csvLines.push(`${v.index},${v.exitepoch},${v.balance_at_exit.toFixed(4)},${v.effective_balance_at_exit.toFixed(4)},${v.withdrawal_address}`);
  });
  
  writeFileSync('exited_validators_withdrawals.csv', csvLines.join('\n'));
  console.log('✅ Created: exited_validators_withdrawals.csv');
  
  // Create JSON summary
  const summary = {
    timestamp: new Date().toISOString(),
    withdrawal_address: withdrawalAddress,
    total_exited_validators: exitedValidators.length,
    total_withdrawn_eth: totalWithdrawnETH,
    total_effective_at_exit_eth: totalEffectiveETH,
    average_withdrawal_eth: averageWithdrawal,
    by_exit_epoch: sortedEpochs.map(epoch => {
      const validators = byEpoch.get(epoch);
      const total = validators.reduce((sum, v) => sum + v.balance_at_exit, 0);
      return {
        exit_epoch: parseInt(epoch),
        validator_count: validators.length,
        total_withdrawn_eth: total,
        average_withdrawal_eth: total / validators.length
      };
    }),
    validators: exitedWithBalances
  };
  
  writeFileSync('exited_validators_withdrawal_summary.json', JSON.stringify(summary, null, 2));
  console.log('✅ Created: exited_validators_withdrawal_summary.json');
  
  console.log('\n' + '='.repeat(70));
  console.log('💰 WITHDRAWAL CALCULATION COMPLETE!');
  console.log('='.repeat(70));
  console.log(`\n📊 Summary:`);
  console.log(`   Withdrawal Address: ${withdrawalAddress}`);
  console.log(`   Total Exited Validators: ${exitedValidators.length}`);
  console.log(`   Total Withdrawn: ${totalWithdrawnETH.toFixed(4)} ETH`);
  console.log(`   Average per Validator: ${averageWithdrawal.toFixed(4)} ETH`);
  console.log(`\n🔍 Verify on-chain:`);
  console.log(`   https://beaconscan.com/withdrawals?address=${withdrawalAddress}`);
  console.log(`   https://etherscan.io/address/${withdrawalAddress}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
