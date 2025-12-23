#!/usr/bin/env bun

/**
 * Script to check if validator indices are still active validators
 * Uses beaconcha.in API to check validator status
 * 
 * Usage: bun check-validator-status.js [options]
 * 
 * Options:
 *   --file <path>    Path to validator indices file (default: validator_indices_500.txt)
 *   --delay <ms>     Delay between API calls in milliseconds (default: 7000 for rate limiting)
 *   --chunk-size <n> Number of indices per API call (default: 100, max supported by API)
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
let indicesFile = join(__dirname, 'validator_indices_500.txt');
let delayMs = 7000; // 7 seconds = ~8.5 calls/min (under 10/min limit)
let chunkSize = 100;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--file' && args[i + 1]) {
    indicesFile = args[i + 1];
    i++;
  } else if (args[i] === '--delay' && args[i + 1]) {
    delayMs = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--chunk-size' && args[i + 1]) {
    chunkSize = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
Usage: bun check-validator-status.js [options]

Options:
  --file <path>      Path to validator indices file (default: validator_indices_500.txt)
  --delay <ms>       Delay between API calls in milliseconds (default: 7000)
  --chunk-size <n>   Number of indices per API call (default: 100)
  --help, -h         Show this help message

Example:
  bun check-validator-status.js
  bun check-validator-status.js --delay 5000 --chunk-size 50
`);
    process.exit(0);
  }
}

// Read validator indices from file
function readValidatorIndices(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && /^\d+$/.test(line));
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    process.exit(1);
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
    console.error(`Error fetching validator info for indices ${indices.join(',')}:`, error.message);
    return [];
  }
}

// Categorize validator status
function categorizeValidator(validator) {
  const status = validator.status || 'unknown';
  const slashed = validator.slashed || false;
  const exitepoch = validator.exitepoch;
  const withdrawableepoch = validator.withdrawableepoch;
  
  if (slashed) {
    return 'slashed';
  }
  
  if (status === 'active_online') {
    return 'active_online';
  }
  
  if (status === 'active_offline') {
    return 'active_offline';
  }
  
  if (status === 'exited' || exitepoch !== null) {
    return 'exited';
  }
  
  if (status === 'pending') {
    return 'pending';
  }
  
  return 'unknown';
}

// Main function
async function main() {
  console.log('🔍 Checking validator status...\n');
  console.log(`📁 Reading indices from: ${indicesFile}`);
  
  const indices = readValidatorIndices(indicesFile);
  console.log(`📊 Found ${indices.length} validator indices\n`);
  
  if (indices.length === 0) {
    console.error('No validator indices found in file');
    process.exit(1);
  }
  
  // Chunk indices for API calls
  const chunks = chunkArray(indices, chunkSize);
  console.log(`📦 Split into ${chunks.length} chunks of up to ${chunkSize} indices each`);
  console.log(`⏱️  Using ${delayMs}ms delay between API calls\n`);
  
  const results = {
    active_online: [],
    active_offline: [],
    exited: [],
    slashed: [],
    pending: [],
    unknown: [],
    not_found: []
  };
  
  const allValidators = [];
  
  // Process each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`[${i + 1}/${chunks.length}] Fetching ${chunk.length} validators...`);
    
    const validators = await fetchValidatorInfo(chunk);
    
    if (validators.length === 0) {
      console.log(`  ⚠️  No data returned for this chunk`);
      chunk.forEach(idx => results.not_found.push(idx));
    } else {
      console.log(`  ✅ Retrieved ${validators.length} validator records`);
      
      // Create a map of returned validators by index
      const validatorMap = new Map();
      validators.forEach(v => {
        validatorMap.set(parseInt(v.validatorindex, 10), v);
      });
      
      // Categorize each validator
      chunk.forEach(idx => {
        const idxNum = parseInt(idx, 10);
        const validator = validatorMap.get(idxNum);
        
        if (!validator) {
          results.not_found.push(idx);
        } else {
          const category = categorizeValidator(validator);
          results[category].push({
            index: idx,
            validator: validator
          });
          allValidators.push(validator);
        }
      });
    }
    
    // Rate limiting delay (except for last chunk)
    if (i < chunks.length - 1) {
      console.log(`  ⏳ Waiting ${delayMs}ms before next request...\n`);
      await sleep(delayMs);
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VALIDATOR STATUS SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Active Online:     ${results.active_online.length}`);
  console.log(`⚠️  Active Offline:    ${results.active_offline.length}`);
  console.log(`🚪 Exited:            ${results.exited.length}`);
  console.log(`🔨 Slashed:           ${results.slashed.length}`);
  console.log(`⏳ Pending:           ${results.pending.length}`);
  console.log(`❓ Unknown Status:    ${results.unknown.length}`);
  console.log(`❌ Not Found:         ${results.not_found.length}`);
  console.log('='.repeat(60));
  console.log(`📈 Total Checked:     ${indices.length}`);
  console.log(`✅ Total Active:      ${results.active_online.length + results.active_offline.length}`);
  console.log('='.repeat(60));
  
  // Print detailed breakdowns
  if (results.slashed.length > 0) {
    console.log('\n🔨 SLASHED VALIDATORS:');
    results.slashed.forEach(({ index, validator }) => {
      console.log(`  - Index ${index}: ${validator.status || 'unknown'}`);
    });
  }
  
  if (results.exited.length > 0) {
    console.log('\n🚪 EXITED VALIDATORS (first 10):');
    results.exited.slice(0, 10).forEach(({ index, validator }) => {
      const exitEpoch = validator.exitepoch || 'N/A';
      console.log(`  - Index ${index}: exited at epoch ${exitEpoch}`);
    });
    if (results.exited.length > 10) {
      console.log(`  ... and ${results.exited.length - 10} more`);
    }
  }
  
  if (results.not_found.length > 0) {
    console.log('\n❌ NOT FOUND VALIDATORS (first 10):');
    results.not_found.slice(0, 10).forEach(idx => {
      console.log(`  - Index ${idx}`);
    });
    if (results.not_found.length > 10) {
      console.log(`  ... and ${results.not_found.length - 10} more`);
    }
  }
  
  // Calculate statistics
  if (allValidators.length > 0) {
    const totalBalance = allValidators.reduce((sum, v) => sum + (parseInt(v.balance) || 0), 0);
    const totalEffectiveBalance = allValidators.reduce((sum, v) => sum + (parseInt(v.effectivebalance) || 0), 0);
    const avgBalance = totalBalance / allValidators.length / 1e9; // Convert to ETH
    const avgEffectiveBalance = totalEffectiveBalance / allValidators.length / 1e9;
    
    console.log('\n💰 VALIDATOR BALANCE STATISTICS:');
    console.log(`  Total Balance:        ${(totalBalance / 1e9).toFixed(2)} ETH`);
    console.log(`  Total Effective:     ${(totalEffectiveBalance / 1e9).toFixed(2)} ETH`);
    console.log(`  Average Balance:      ${avgBalance.toFixed(4)} ETH`);
    console.log(`  Average Effective:   ${avgEffectiveBalance.toFixed(4)} ETH`);
  }
  
  // Export results to JSON file
  const outputFile = 'validator-status-results.json';
  const outputData = {
    timestamp: new Date().toISOString(),
    total_checked: indices.length,
    summary: {
      active_online: results.active_online.length,
      active_offline: results.active_offline.length,
      exited: results.exited.length,
      slashed: results.slashed.length,
      pending: results.pending.length,
      unknown: results.unknown.length,
      not_found: results.not_found.length
    },
    results: {
      active_online: results.active_online.map(({ index }) => index),
      active_offline: results.active_offline.map(({ index }) => index),
      exited: results.exited.map(({ index }) => index),
      slashed: results.slashed.map(({ index }) => index),
      pending: results.pending.map(({ index }) => index),
      unknown: results.unknown.map(({ index }) => index),
      not_found: results.not_found
    }
  };
  
  writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
  console.log(`\n💾 Results saved to: ${outputFile}`);
  
  console.log('\n✨ Check complete!');
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
