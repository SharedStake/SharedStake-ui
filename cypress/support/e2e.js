// ***********************************************************
// This file is processed and loaded automatically before test files.
// You can change the location of this file or turn off processing it by setting
// the supportFile to false.
// ***********************************************************

// Import commands.js
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // We'll log the error but continue testing
  console.error('Uncaught exception:', err)
  
  // Don't fail tests on common blockchain/web3 errors
  if (err.message.includes('MetaMask') || 
      err.message.includes('Web3') || 
      err.message.includes('provider') ||
      err.message.includes('ethereum')) {
    return false
  }
  
  // Let other errors fail the test
  return true
})