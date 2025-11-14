#!/usr/bin/env node

/**
 * Script to create a text file with active validators and their balances
 * Reads from validator-status-results.json and fetches current balances
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
  console.log('📖 Reading validator status results...\n');
  
  // Read the results JSON
  const resultsFile = join(__dirname, 'validator-status-results.json');
  let results;
  try {
    const content = readFileSync(resultsFile, 'utf-8');
    results = JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${resultsFile}:`, error.message);
    process.exit(1);
  }
  
  // Get active validators (online + offline)
  const activeIndices = [
    ...results.results.active_online,
    ...results.results.active_offline
  ];
  
  console.log(`📊 Found ${activeIndices.length} active validators`);
  console.log(`   - Active Online: ${results.results.active_online.length}`);
  console.log(`   - Active Offline: ${results.results.active_offline.length}\n`);
  
  if (activeIndices.length === 0) {
    console.log('No active validators found.');
    process.exit(0);
  }
  
  // Fetch validator balances
  console.log('🔍 Fetching current balances...\n');
  const chunks = chunkArray(activeIndices, 100);
  const allValidators = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`[${i + 1}/${chunks.length}] Fetching ${chunk.length} validators...`);
    
    const validators = await fetchValidatorInfo(chunk);
    
    if (validators.length > 0) {
      console.log(`  ✅ Retrieved ${validators.length} validator records`);
      allValidators.push(...validators);
    } else {
      console.log(`  ⚠️  No data returned for this chunk`);
    }
    
    // Rate limiting delay (except for last chunk)
    if (i < chunks.length - 1) {
      await sleep(7000);
    }
  }
  
  // Sort validators by index
  allValidators.sort((a, b) => {
    return parseInt(a.validatorindex) - parseInt(b.validatorindex);
  });
  
  // Create output text file
  const outputLines = [];
  outputLines.push('='.repeat(70));
  outputLines.push('ACTIVE VALIDATORS AND BALANCES');
  outputLines.push('='.repeat(70));
  outputLines.push(`Generated: ${new Date().toISOString()}`);
  outputLines.push(`Total Active Validators: ${allValidators.length}`);
  outputLines.push('');
  outputLines.push('Index'.padEnd(10) + 'Balance (ETH)'.padEnd(20) + 'Effective Balance (ETH)');
  outputLines.push('-'.repeat(70));
  
  let totalBalance = 0;
  let totalEffectiveBalance = 0;
  
  allValidators.forEach(validator => {
    const index = String(validator.validatorindex);
    const balance = parseInt(validator.balance || 0) / 1e9;
    const effectiveBalance = parseInt(validator.effectivebalance || 0) / 1e9;
    
    totalBalance += balance;
    totalEffectiveBalance += effectiveBalance;
    
    const indexStr = String(index).padEnd(10);
    const balanceStr = balance.toFixed(4).padEnd(20);
    const effectiveStr = effectiveBalance.toFixed(4);
    outputLines.push(indexStr + balanceStr + effectiveStr);
  });
  
  outputLines.push('-'.repeat(70));
  outputLines.push('');
  outputLines.push('SUMMARY:');
  outputLines.push(`  Total Balance:        ${totalBalance.toFixed(4)} ETH`);
  outputLines.push(`  Total Effective:      ${totalEffectiveBalance.toFixed(4)} ETH`);
  outputLines.push(`  Average Balance:      ${(totalBalance / allValidators.length).toFixed(4)} ETH`);
  outputLines.push(`  Average Effective:    ${(totalEffectiveBalance / allValidators.length).toFixed(4)} ETH`);
  outputLines.push('='.repeat(70));
  
  // Write to file
  const outputFile = 'active_validators_with_balances.txt';
  writeFileSync(outputFile, outputLines.join('\n'));
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ RESULTS');
  console.log('='.repeat(70));
  console.log(`📄 Output file: ${outputFile}`);
  console.log(`📊 Total Active Validators: ${allValidators.length}`);
  console.log(`💰 Total Balance: ${totalBalance.toFixed(4)} ETH`);
  console.log(`💰 Total Effective Balance: ${totalEffectiveBalance.toFixed(4)} ETH`);
  console.log('='.repeat(70));
  
  // Also create a simple CSV version
  const csvLines = [];
  csvLines.push('Index,Balance (ETH),Effective Balance (ETH)');
  allValidators.forEach(validator => {
    const index = validator.validatorindex;
    const balance = parseInt(validator.balance || 0) / 1e9;
    const effectiveBalance = parseInt(validator.effectivebalance || 0) / 1e9;
    csvLines.push(`${index},${balance.toFixed(4)},${effectiveBalance.toFixed(4)}`);
  });
  
  const csvFile = 'active_validators_with_balances.csv';
  writeFileSync(csvFile, csvLines.join('\n'));
  console.log(`📄 CSV file: ${csvFile}`);
  console.log('='.repeat(70));
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
