#!/usr/bin/env node

/**
 * Script to verify validator status and add exit epoch information
 * Creates comprehensive reports for both active and exited validators
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
  console.log('🔍 Verifying validator data and fetching exit information...\n');
  
  // Read the original indices file
  const indicesFile = join(__dirname, 'validator_indices_500.txt');
  const originalIndices = readFileSync(indicesFile, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && /^\d+$/.test(line));
  
  console.log(`📊 Total validators to check: ${originalIndices.length}\n`);
  
  // Fetch all validator data in chunks
  const chunks = chunkArray(originalIndices, 100);
  const allValidators = [];
  
  console.log('📥 Fetching validator data...\n');
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
        } else {
          // Validator not found
          allValidators.push({
            index: idx,
            validatorindex: idxNum,
            status: 'not_found',
            balance: 0,
            effectivebalance: 0
          });
        }
      });
    } else {
      console.log(`  ⚠️  No data returned for this chunk`);
      chunk.forEach(idx => {
        allValidators.push({
          index: idx,
          validatorindex: parseInt(idx, 10),
          status: 'not_found',
          balance: 0,
          effectivebalance: 0
        });
      });
    }
    
    // Rate limiting delay (except for last chunk)
    if (i < chunks.length - 1) {
      await sleep(7000);
    }
  }
  
  // Categorize validators
  const activeValidators = [];
  const exitedValidators = [];
  const slashedValidators = [];
  const notFoundValidators = [];
  
  allValidators.forEach(v => {
    const status = v.status || 'unknown';
    const slashed = v.slashed || false;
    const exitepoch = v.exitepoch;
    
    if (v.status === 'not_found') {
      notFoundValidators.push(v);
    } else if (slashed) {
      slashedValidators.push(v);
    } else if (status === 'active_online' || status === 'active_offline') {
      activeValidators.push(v);
    } else if (status === 'exited' || exitepoch !== null) {
      exitedValidators.push(v);
    } else {
      notFoundValidators.push(v);
    }
  });
  
  // Sort by index
  activeValidators.sort((a, b) => parseInt(a.index) - parseInt(b.index));
  exitedValidators.sort((a, b) => {
    const exitA = a.exitepoch || 0;
    const exitB = b.exitepoch || 0;
    if (exitA !== exitB) return exitB - exitA; // Most recent first
    return parseInt(a.index) - parseInt(b.index);
  });
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Active Validators:     ${activeValidators.length}`);
  console.log(`🚪 Exited Validators:    ${exitedValidators.length}`);
  console.log(`🔨 Slashed Validators:   ${slashedValidators.length}`);
  console.log(`❌ Not Found:            ${notFoundValidators.length}`);
  console.log(`📈 Total Checked:        ${allValidators.length}`);
  console.log('='.repeat(70));
  
  // Create active validators file with balances
  const activeLines = [];
  activeLines.push('='.repeat(70));
  activeLines.push('ACTIVE VALIDATORS AND BALANCES');
  activeLines.push('='.repeat(70));
  activeLines.push(`Generated: ${new Date().toISOString()}`);
  activeLines.push(`Total Active Validators: ${activeValidators.length}`);
  activeLines.push('');
  activeLines.push('Index'.padEnd(10) + 'Balance (ETH)'.padEnd(20) + 'Effective Balance (ETH)');
  activeLines.push('-'.repeat(70));
  
  let totalActiveBalance = 0;
  let totalActiveEffective = 0;
  
  activeValidators.forEach(v => {
    const index = String(v.index);
    const balance = parseInt(v.balance || 0) / 1e9;
    const effectiveBalance = parseInt(v.effectivebalance || 0) / 1e9;
    
    totalActiveBalance += balance;
    totalActiveEffective += effectiveBalance;
    
    const indexStr = String(index).padEnd(10);
    const balanceStr = balance.toFixed(4).padEnd(20);
    const effectiveStr = effectiveBalance.toFixed(4);
    activeLines.push(indexStr + balanceStr + effectiveStr);
  });
  
  activeLines.push('-'.repeat(70));
  activeLines.push('');
  activeLines.push('SUMMARY:');
  activeLines.push(`  Total Balance:        ${totalActiveBalance.toFixed(4)} ETH`);
  activeLines.push(`  Total Effective:      ${totalActiveEffective.toFixed(4)} ETH`);
  activeLines.push(`  Average Balance:      ${(totalActiveBalance / activeValidators.length).toFixed(4)} ETH`);
  activeLines.push(`  Average Effective:    ${(totalActiveEffective / activeValidators.length).toFixed(4)} ETH`);
  activeLines.push('='.repeat(70));
  
  writeFileSync('active_validators_with_balances.txt', activeLines.join('\n'));
  console.log(`\n✅ Created: active_validators_with_balances.txt`);
  
  // Create exited validators file with exit epochs
  const exitedLines = [];
  exitedLines.push('='.repeat(80));
  exitedLines.push('EXITED VALIDATORS WITH EXIT EPOCHS');
  exitedLines.push('='.repeat(80));
  exitedLines.push(`Generated: ${new Date().toISOString()}`);
  exitedLines.push(`Total Exited Validators: ${exitedValidators.length}`);
  exitedLines.push('');
  exitedLines.push('Index'.padEnd(10) + 'Exit Epoch'.padEnd(15) + 'Balance (ETH)'.padEnd(20) + 'Effective Balance (ETH)'.padEnd(25) + 'Status');
  exitedLines.push('-'.repeat(80));
  
  let totalExitedBalance = 0;
  let totalExitedEffective = 0;
  
  exitedValidators.forEach(v => {
    const index = String(v.index);
    const exitEpoch = v.exitepoch !== null && v.exitepoch !== undefined ? String(v.exitepoch) : 'N/A';
    const balance = parseInt(v.balance || 0) / 1e9;
    const effectiveBalance = parseInt(v.effectivebalance || 0) / 1e9;
    const status = v.status || 'unknown';
    
    totalExitedBalance += balance;
    totalExitedEffective += effectiveBalance;
    
    const indexStr = String(index).padEnd(10);
    const exitEpochStr = exitEpoch.padEnd(15);
    const balanceStr = balance.toFixed(4).padEnd(20);
    const effectiveStr = effectiveBalance.toFixed(4).padEnd(25);
    exitedLines.push(indexStr + exitEpochStr + balanceStr + effectiveStr + status);
  });
  
  exitedLines.push('-'.repeat(80));
  exitedLines.push('');
  exitedLines.push('SUMMARY:');
  exitedLines.push(`  Total Balance:        ${totalExitedBalance.toFixed(4)} ETH`);
  exitedLines.push(`  Total Effective:      ${totalExitedEffective.toFixed(4)} ETH`);
  exitedLines.push(`  Average Balance:      ${(totalExitedBalance / exitedValidators.length).toFixed(4)} ETH`);
  exitedLines.push(`  Average Effective:    ${(totalExitedEffective / exitedValidators.length).toFixed(4)} ETH`);
  exitedLines.push('='.repeat(80));
  
  writeFileSync('exited_validators_with_exit_epochs.txt', exitedLines.join('\n'));
  console.log(`✅ Created: exited_validators_with_exit_epochs.txt`);
  
  // Create comprehensive summary file
  const summaryLines = [];
  summaryLines.push('='.repeat(80));
  summaryLines.push('COMPREHENSIVE VALIDATOR STATUS REPORT');
  summaryLines.push('='.repeat(80));
  summaryLines.push(`Generated: ${new Date().toISOString()}`);
  summaryLines.push(`Total Validators Checked: ${allValidators.length}`);
  summaryLines.push('');
  summaryLines.push('CATEGORY BREAKDOWN:');
  summaryLines.push(`  ✅ Active Validators:     ${activeValidators.length}`);
  summaryLines.push(`  🚪 Exited Validators:    ${exitedValidators.length}`);
  summaryLines.push(`  🔨 Slashed Validators:   ${slashedValidators.length}`);
  summaryLines.push(`  ❌ Not Found:            ${notFoundValidators.length}`);
  summaryLines.push('');
  summaryLines.push('BALANCE SUMMARY:');
  summaryLines.push(`  Active Validators:`);
  summaryLines.push(`    Total Balance:        ${totalActiveBalance.toFixed(4)} ETH`);
  summaryLines.push(`    Total Effective:      ${totalActiveEffective.toFixed(4)} ETH`);
  summaryLines.push(`  Exited Validators:`);
  summaryLines.push(`    Total Balance:        ${totalExitedBalance.toFixed(4)} ETH`);
  summaryLines.push(`    Total Effective:      ${totalExitedEffective.toFixed(4)} ETH`);
  summaryLines.push(`  GRAND TOTAL:`);
  summaryLines.push(`    Total Balance:        ${(totalActiveBalance + totalExitedBalance).toFixed(4)} ETH`);
  summaryLines.push(`    Total Effective:      ${(totalActiveEffective + totalExitedEffective).toFixed(4)} ETH`);
  summaryLines.push('='.repeat(80));
  
  writeFileSync('validator_status_summary.txt', summaryLines.join('\n'));
  console.log(`✅ Created: validator_status_summary.txt`);
  
  // Create CSV files
  const activeCsv = [];
  activeCsv.push('Index,Balance (ETH),Effective Balance (ETH)');
  activeValidators.forEach(v => {
    const balance = parseInt(v.balance || 0) / 1e9;
    const effectiveBalance = parseInt(v.effectivebalance || 0) / 1e9;
    activeCsv.push(`${v.index},${balance.toFixed(4)},${effectiveBalance.toFixed(4)}`);
  });
  writeFileSync('active_validators_with_balances.csv', activeCsv.join('\n'));
  console.log(`✅ Created: active_validators_with_balances.csv`);
  
  const exitedCsv = [];
  exitedCsv.push('Index,Exit Epoch,Balance (ETH),Effective Balance (ETH),Status');
  exitedValidators.forEach(v => {
    const exitEpoch = v.exitepoch !== null && v.exitepoch !== undefined ? String(v.exitepoch) : 'N/A';
    const balance = parseInt(v.balance || 0) / 1e9;
    const effectiveBalance = parseInt(v.effectivebalance || 0) / 1e9;
    const status = v.status || 'unknown';
    exitedCsv.push(`${v.index},${exitEpoch},${balance.toFixed(4)},${effectiveBalance.toFixed(4)},${status}`);
  });
  writeFileSync('exited_validators_with_exit_epochs.csv', exitedCsv.join('\n'));
  console.log(`✅ Created: exited_validators_with_exit_epochs.csv`);
  
  console.log('\n' + '='.repeat(70));
  console.log('✨ VERIFICATION COMPLETE!');
  console.log('='.repeat(70));
  console.log(`\n📊 Final Totals:`);
  console.log(`   Active: ${activeValidators.length} validators, ${totalActiveBalance.toFixed(4)} ETH`);
  console.log(`   Exited: ${exitedValidators.length} validators, ${totalExitedBalance.toFixed(4)} ETH`);
  console.log(`   Total:  ${allValidators.length} validators, ${(totalActiveBalance + totalExitedBalance).toFixed(4)} ETH`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
