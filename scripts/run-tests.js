#!/usr/bin/env node

/**
 * Test runner script for SharedStake UI tests
 * Provides convenient commands for running different test suites
 */

const { execSync } = require('child_process');
const path = require('path');

const commands = {
  'all': 'playwright test',
  'blog': 'playwright test tests/blog/',
  'main-app': 'playwright test tests/main-app/',
  'visual': 'playwright test tests/visual-regression.spec.js',
  'ui': 'playwright test --ui',
  'headed': 'playwright test --headed',
  'debug': 'playwright test --debug',
  'report': 'playwright show-report',
  'install': 'playwright install'
};

function showHelp() {
  console.log(`
🧪 SharedStake UI Test Runner

Usage: node scripts/run-tests.js <command>

Available commands:
  all        Run all tests
  blog       Run blog tests only
  main-app   Run main app tests only
  visual     Run visual regression tests only
  ui         Run tests with interactive UI
  headed     Run tests in headed mode (see browser)
  debug      Run tests in debug mode
  report     Show test report
  install    Install Playwright browsers

Examples:
  node scripts/run-tests.js all
  node scripts/run-tests.js blog
  node scripts/run-tests.js ui
  node scripts/run-tests.js visual

Environment variables:
  CI=true    Run in CI mode (headless, no UI)
  DEBUG=true Enable debug output
`);
}

function runCommand(command) {
  try {
    console.log(`🚀 Running: ${command}`);
    execSync(command, { 
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });
    console.log('✅ Tests completed successfully');
  } catch (error) {
    console.error('❌ Tests failed:', error.message);
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    return;
  }
  
  const command = args[0];
  
  if (!commands[command]) {
    console.error(`❌ Unknown command: ${command}`);
    console.log('Run "node scripts/run-tests.js help" for available commands');
    process.exit(1);
  }
  
  // Set environment variables
  if (process.env.CI) {
    process.env.CI = 'true';
  }
  
  if (process.env.DEBUG) {
    process.env.DEBUG = 'true';
  }
  
  runCommand(commands[command]);
}

if (require.main === module) {
  main();
}

module.exports = { commands, runCommand };