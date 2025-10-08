// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/**
 * Custom command to connect wallet
 */
Cypress.Commands.add('connectWallet', () => {
  cy.window().then((win) => {
    // Simulate wallet connection
    cy.get('[data-testid="connect-wallet-button"], .btn-connect').first().click();
    
    // Wait for connection to complete
    cy.get('[data-testid="wallet-address"], .btn-connect').should('contain', '0x74');
  });
});

/**
 * Custom command to disconnect wallet
 */
Cypress.Commands.add('disconnectWallet', () => {
  cy.window().then((win) => {
    // Simulate wallet disconnection
    cy.get('[data-testid="disconnect-wallet"], .btn-connect').first().click();
    
    // Wait for disconnection to complete
    cy.get('[data-testid="connect-wallet-button"], .btn-connect').should('contain', 'Connect Wallet');
  });
});

/**
 * Custom command to wait for Web3 to be ready
 */
Cypress.Commands.add('waitForWeb3', () => {
  cy.window().should('have.property', 'ethereum');
  cy.window().should('have.property', 'web3Onboard');
});

/**
 * Custom command to mock contract interactions
 */
Cypress.Commands.add('mockContractCall', (method, result) => {
  cy.window().then((win) => {
    if (!win.mockContractCalls) {
      win.mockContractCalls = {};
    }
    win.mockContractCalls[method] = result;
  });
});

/**
 * Custom command to navigate to a specific page
 */
Cypress.Commands.add('navigateTo', (page) => {
  const routes = {
    'home': '/',
    'stake': '/stake',
    'withdraw': '/withdraw',
    'earn': '/earn',
    'blog': '/blog',
    'faq': '/faq'
  };
  
  if (routes[page]) {
    cy.visit(routes[page]);
  } else {
    cy.visit(page);
  }
});

/**
 * Custom command to check if element is visible in viewport
 */
Cypress.Commands.add('isInViewport', (selector) => {
  cy.get(selector).then(($el) => {
    const rect = $el[0].getBoundingClientRect();
    expect(rect.top).to.be.at.least(0);
    expect(rect.bottom).to.be.at.most(Cypress.config('viewportHeight'));
    expect(rect.left).to.be.at.least(0);
    expect(rect.right).to.be.at.most(Cypress.config('viewportWidth'));
  });
});