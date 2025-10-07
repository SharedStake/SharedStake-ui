const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    env: {
      // Test wallet addresses for blockchain interactions
      TEST_WALLET_ADDRESS: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb9',
      TEST_PRIVATE_KEY: 'DO_NOT_USE_REAL_PRIVATE_KEY_IN_TESTS',
      NETWORK: 'mainnet',
      // Contract addresses
      SGETH_CONTRACT: '0x84E1670F61347CDaeD56dcc736FB990fBB47ddC1',
      WSGETH_CONTRACT: '0x5e74C9036fb86BD7eCdcb084a0673EFc32eA31cb',
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        log(message) {
          console.log(message)
          return null
        },
      })
    },
  },
  component: {
    devServer: {
      framework: 'vue',
      bundler: 'webpack',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js',
  },
})