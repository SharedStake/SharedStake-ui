#!/usr/bin/env node

/**
 * Script to check withdrawal addresses and where validator rewards went
 * Fetches withdrawal credentials and withdrawal addresses for validators
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

// Fetch detailed validator info including withdrawal credentials
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

// Decode withdrawal credentials to get withdrawal address
// Withdrawal credentials format: 0x01 + 11 bytes padding + 20 bytes address
function decodeWithdrawalAddress(withdrawalcredentials) {
  if (!withdrawalcredentials) return null;
  
  // Remove 0x prefix if present
  const creds = withdrawalcredentials.startsWith('0x') 
    ? withdrawalcredentials.slice(2) 
    : withdrawalcredentials;
  
  // Check if it's ETH1 address type (0x01 prefix)
  if (creds.startsWith('01')) {
    // Extract the last 40 characters (20 bytes = 40 hex chars) which is the address
    const addressHex = creds.slice(-40);
    return '0x' + addressHex.toLowerCase();
  }
  
  // If it's 0x00 (BLS), return null as there's no withdrawal address yet
  return null;
}

// Chunk array into smaller arrays
function chunkArray(array, size) {
  if (array.length <= size) {
    return [array];
  }
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function main() {
  console.log('🔍 Checking withdrawal addresses and reward destinations...\n');
  
  // Read the original indices file
  const indicesFile = join(__dirname, 'validator_indices_500.txt');
  const originalIndices = readFileSync(indicesFile, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && /^\d+$/.test(line));
  
  console.log(`📊 Total validators to check: ${originalIndices.length}\n`);
  
  // First, get basic validator info in batches
  console.log('📥 Fetching basic validator data...\n');
  const chunks = chunkArray(originalIndices, 100);
  const allValidators = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`[${i + 1}/${chunks.length}] Fetching ${chunk.length} validators...`);
    
    const validators = await fetchValidatorInfo(chunk);
    
    if (validators.length > 0) {
      console.log(`  ✅ Retrieved ${validators.length} validator records`);
      
      // Create a map of returned validators by index
      const validatorMap = new Map();
      validators.forEach(v => {
        validatorMap.set(parseInt(v.validatorindex, 10), v);
      });
      
      // Add validators to our list
      chunk.forEach(idx => {
        const idxNum = parseInt(idx, 10);
        const validator = validatorMap.get(idxNum);
        if (validator) {
          allValidators.push({
            index: idx,
            ...validator
          });
        }
      });
    }
    
    // Rate limiting delay (except for last chunk)
    if (i < chunks.length - 1) {
      await sleep(7000);
    }
  }
  
  console.log(`\n📊 Retrieved ${allValidators.length} validators\n`);
  
  // Now fetch detailed info for each validator to get withdrawal credentials
  console.log('🔍 Fetching detailed validator info (withdrawal credentials)...');
  console.log('⏱️  This will take a while due to rate limiting...\n');
  
  const validatorsWithWithdrawal = [];
  let processed = 0;
  
  for (const validator of allValidators) {
    processed++;
    if (processed % 10 === 0) {
      console.log(`  Processed ${processed}/${allValidators.length}...`);
    }
    
    const details = await fetchValidatorDetails(validator.index);
    
    if (details) {
      const withdrawalAddress = decodeWithdrawalAddress(details.withdrawalcredentials);
      
      validatorsWithWithdrawal.push({
        index: validator.index,
        status: validator.status || details.status,
        balance: validator.balance || details.balance,
        effectivebalance: validator.effectivebalance || details.effectivebalance,
        exitepoch: validator.exitepoch || details.exitepoch,
        withdrawalcredentials: details.withdrawalcredentials,
        withdrawaladdress: withdrawalAddress,
        pubkey: details.pubkey || validator.pubkey,
        slashed: validator.slashed || details.slashed
      });
    } else {
      // Fallback to basic info if detailed fetch fails
      validatorsWithWithdrawal.push({
        index: validator.index,
        status: validator.status,
        balance: validator.balance,
        effectivebalance: validator.effectivebalance,
        exitepoch: validator.exitepoch,
        withdrawalcredentials: null,
        withdrawaladdress: null,
        pubkey: validator.pubkey,
        slashed: validator.slashed
      });
    }
    
    // Rate limiting - beaconcha.in has strict limits
    await sleep(600); // ~100 requests per minute
  }
  
  console.log(`\n✅ Processed all ${validatorsWithWithdrawal.length} validators\n`);
  
  // Analyze withdrawal addresses
  const withdrawalAddressMap = new Map();
  const activeValidators = [];
  const exitedValidators = [];
  
  validatorsWithWithdrawal.forEach(v => {
    if (v.withdrawaladdress) {
      const addr = v.withdrawaladdress.toLowerCase();
      if (!withdrawalAddressMap.has(addr)) {
        withdrawalAddressMap.set(addr, []);
      }
      withdrawalAddressMap.get(addr).push(v);
    }
    
    if (v.status === 'active_online' || v.status === 'active_offline') {
      activeValidators.push(v);
    } else if (v.exitepoch !== null || v.status === 'exited') {
      exitedValidators.push(v);
    }
  });
  
  // Create report files
  console.log('📝 Generating reports...\n');
  
  // 1. Active validators with withdrawal addresses
  const activeLines = [];
  activeLines.push('='.repeat(90));
  activeLines.push('ACTIVE VALIDATORS WITH WITHDRAWAL ADDRESSES');
  activeLines.push('='.repeat(90));
  activeLines.push(`Generated: ${new Date().toISOString()}`);
  activeLines.push(`Total Active Validators: ${activeValidators.length}`);
  activeLines.push('');
  activeLines.push('Index'.padEnd(10) + 'Balance (ETH)'.padEnd(20) + 'Withdrawal Address'.padEnd(45) + 'Status');
  activeLines.push('-'.repeat(90));
  
  let totalActiveBalance = 0;
  activeValidators.forEach(v => {
    const index = String(v.index);
    const balance = parseInt(v.balance || 0) / 1e9;
    const withdrawalAddr = v.withdrawaladdress || 'N/A (BLS credentials)';
    const status = v.status || 'unknown';
    
    totalActiveBalance += balance;
    
    const indexStr = String(index).padEnd(10);
    const balanceStr = balance.toFixed(4).padEnd(20);
    const addrStr = String(withdrawalAddr).padEnd(45);
    activeLines.push(indexStr + balanceStr + addrStr + status);
  });
  
  activeLines.push('-'.repeat(90));
  activeLines.push(`Total Balance: ${totalActiveBalance.toFixed(4)} ETH`);
  activeLines.push('='.repeat(90));
  
  writeFileSync('active_validators_withdrawal_addresses.txt', activeLines.join('\n'));
  console.log('✅ Created: active_validators_withdrawal_addresses.txt');
  
  // 2. Exited validators with withdrawal addresses
  const exitedLines = [];
  exitedLines.push('='.repeat(100));
  exitedLines.push('EXITED VALIDATORS WITH WITHDRAWAL ADDRESSES');
  exitedLines.push('='.repeat(100));
  exitedLines.push(`Generated: ${new Date().toISOString()}`);
  exitedLines.push(`Total Exited Validators: ${exitedValidators.length}`);
  exitedLines.push('');
  exitedLines.push('Index'.padEnd(10) + 'Exit Epoch'.padEnd(15) + 'Balance (ETH)'.padEnd(20) + 'Withdrawal Address'.padEnd(45) + 'Status');
  exitedLines.push('-'.repeat(100));
  
  exitedValidators.forEach(v => {
    const index = String(v.index);
    const exitEpoch = v.exitepoch !== null ? String(v.exitepoch) : 'N/A';
    const balance = parseInt(v.balance || 0) / 1e9;
    const withdrawalAddr = v.withdrawaladdress || 'N/A (BLS credentials)';
    const status = v.status || 'exited';
    
    const indexStr = String(index).padEnd(10);
    const exitEpochStr = exitEpoch.padEnd(15);
    const balanceStr = balance.toFixed(4).padEnd(20);
    const addrStr = String(withdrawalAddr).padEnd(45);
    exitedLines.push(indexStr + exitEpochStr + balanceStr + addrStr + status);
  });
  
  exitedLines.push('-'.repeat(100));
  exitedLines.push('='.repeat(100));
  
  writeFileSync('exited_validators_withdrawal_addresses.txt', exitedLines.join('\n'));
  console.log('✅ Created: exited_validators_withdrawal_addresses.txt');
  
  // 3. Withdrawal address summary - group by address
  const summaryLines = [];
  summaryLines.push('='.repeat(100));
  summaryLines.push('WITHDRAWAL ADDRESS SUMMARY');
  summaryLines.push('='.repeat(100));
  summaryLines.push(`Generated: ${new Date().toISOString()}`);
  summaryLines.push('');
  summaryLines.push('This shows where validator rewards and withdrawals go, grouped by withdrawal address.');
  summaryLines.push('');
  
  // Sort addresses by number of validators
  const sortedAddresses = Array.from(withdrawalAddressMap.entries())
    .sort((a, b) => b[1].length - a[1].length);
  
  summaryLines.push('Withdrawal Address'.padEnd(45) + 'Validators'.padEnd(15) + 'Total Balance (ETH)'.padEnd(25) + 'Status');
  summaryLines.push('-'.repeat(100));
  
  sortedAddresses.forEach(([address, validators]) => {
    const active = validators.filter(v => v.status === 'active_online' || v.status === 'active_offline');
    const exited = validators.filter(v => v.exitepoch !== null || v.status === 'exited');
    
    let totalBalance = 0;
    validators.forEach(v => {
      totalBalance += parseInt(v.balance || 0) / 1e9;
    });
    
    const addrStr = address.padEnd(45);
    const countStr = `${validators.length} (${active.length} active, ${exited.length} exited)`.padEnd(15);
    const balanceStr = totalBalance.toFixed(4).padEnd(25);
    const statusStr = active.length > 0 ? 'Has Active Validators' : 'All Exited';
    
    summaryLines.push(addrStr + countStr + balanceStr + statusStr);
  });
  
  summaryLines.push('-'.repeat(100));
  summaryLines.push(`Total Unique Withdrawal Addresses: ${sortedAddresses.length}`);
  summaryLines.push('='.repeat(100));
  
  writeFileSync('withdrawal_address_summary.txt', summaryLines.join('\n'));
  console.log('✅ Created: withdrawal_address_summary.txt');
  
  // 4. Create JSON export
  const jsonData = {
    timestamp: new Date().toISOString(),
    total_validators: validatorsWithWithdrawal.length,
    unique_withdrawal_addresses: sortedAddresses.length,
    withdrawal_addresses: sortedAddresses.map(([address, validators]) => ({
      address: address,
      validator_count: validators.length,
      active_count: validators.filter(v => v.status === 'active_online' || v.status === 'active_offline').length,
      exited_count: validators.filter(v => v.exitepoch !== null || v.status === 'exited').length,
      total_balance_eth: validators.reduce((sum, v) => sum + (parseInt(v.balance || 0) / 1e9), 0),
      validators: validators.map(v => ({
        index: v.index,
        status: v.status,
        balance_eth: parseInt(v.balance || 0) / 1e9,
        exitepoch: v.exitepoch
      }))
    })),
    validators: validatorsWithWithdrawal.map(v => ({
      index: v.index,
      status: v.status,
      balance_eth: parseInt(v.balance || 0) / 1e9,
      exitepoch: v.exitepoch,
      withdrawal_address: v.withdrawaladdress,
      withdrawal_credentials: v.withdrawalcredentials
    }))
  };
  
  writeFileSync('withdrawal_addresses_data.json', JSON.stringify(jsonData, null, 2));
  console.log('✅ Created: withdrawal_addresses_data.json');
  
  console.log('\n' + '='.repeat(70));
  console.log('✨ ANALYSIS COMPLETE!');
  console.log('='.repeat(70));
  console.log(`\n📊 Summary:`);
  console.log(`   Total Validators: ${validatorsWithWithdrawal.length}`);
  console.log(`   Active Validators: ${activeValidators.length}`);
  console.log(`   Exited Validators: ${exitedValidators.length}`);
  console.log(`   Unique Withdrawal Addresses: ${sortedAddresses.length}`);
  console.log(`   Total Active Balance: ${totalActiveBalance.toFixed(4)} ETH`);
  console.log('\n💡 Check the generated files for detailed information!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
