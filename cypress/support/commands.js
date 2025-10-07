// ***********************************************
// Custom commands for SharedStake E2E tests
// ***********************************************

// Command to check if an element is visible with retry logic
Cypress.Commands.add('isVisible', (selector, options = {}) => {
  const { timeout = 10000 } = options
  return cy.get(selector, { timeout }).should('be.visible')
})

// Command to wait for the app to be ready
Cypress.Commands.add('waitForApp', () => {
  cy.get('#app', { timeout: 15000 }).should('exist')
  cy.wait(1000) // Give Vue time to mount components
})

// Command to navigate to a specific route
Cypress.Commands.add('navigateTo', (route) => {
  cy.visit(route)
  cy.waitForApp()
})

// Command to mock wallet connection
Cypress.Commands.add('mockWalletConnection', () => {
  cy.window().then((win) => {
    // Mock ethereum provider
    win.ethereum = {
      isMetaMask: true,
      selectedAddress: Cypress.env('TEST_WALLET_ADDRESS'),
      chainId: '0x1', // Mainnet
      request: (args) => {
        switch (args.method) {
          case 'eth_requestAccounts':
            return Promise.resolve([Cypress.env('TEST_WALLET_ADDRESS')])
          case 'eth_accounts':
            return Promise.resolve([Cypress.env('TEST_WALLET_ADDRESS')])
          case 'eth_chainId':
            return Promise.resolve('0x1')
          case 'net_version':
            return Promise.resolve('1')
          default:
            return Promise.resolve(null)
        }
      },
      on: (event, callback) => {
        // Mock event listeners
      },
      removeListener: (event, callback) => {
        // Mock remove listeners
      }
    }
  })
})

// Command to check if wallet is connected
Cypress.Commands.add('checkWalletConnected', () => {
  cy.get('.wallet-address', { timeout: 10000 })
    .should('be.visible')
    .and('contain', '0x')
})

// Command to disconnect wallet
Cypress.Commands.add('disconnectWallet', () => {
  cy.get('.wallet-disconnect').click()
  cy.get('.wallet-address').should('not.exist')
})

// Command to input amount in stake/withdraw forms
Cypress.Commands.add('inputAmount', (amount) => {
  cy.get('input[type="text"][pattern*="[0-9]"]').first()
    .clear()
    .type(amount)
    .should('have.value', amount)
})

// Command to check balance display
Cypress.Commands.add('checkBalance', (expectedText) => {
  cy.get('.balance').first()
    .should('be.visible')
    .and('contain', expectedText || 'wallet:')
})

// Command to select gas price
Cypress.Commands.add('selectGasPrice', (level = 'medium') => {
  const index = level === 'low' ? 0 : level === 'medium' ? 1 : 2
  cy.get('#gas').within(() => {
    cy.get('.chooser button').eq(index).click()
  })
})

// Command to check for error messages
Cypress.Commands.add('checkNoErrors', () => {
  cy.get('.error-message').should('not.exist')
  cy.get('.notification-error').should('not.exist')
})

// Command to wait for blockchain transaction
Cypress.Commands.add('waitForTransaction', (timeout = 30000) => {
  cy.get('.transaction-pending', { timeout }).should('not.exist')
  cy.get('.transaction-success', { timeout }).should('be.visible')
})

// Command to check blog post
Cypress.Commands.add('checkBlogPost', (title) => {
  cy.contains('h1, h2, h3', title, { timeout: 10000 }).should('be.visible')
})

// Command to test responsive design
Cypress.Commands.add('testResponsive', (sizes = ['iphone-x', 'ipad-2', [1920, 1080]]) => {
  sizes.forEach(size => {
    if (Cypress._.isArray(size)) {
      cy.viewport(size[0], size[1])
    } else {
      cy.viewport(size)
    }
    cy.wait(500)
  })
})