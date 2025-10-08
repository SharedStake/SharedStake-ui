// DeFi-specific Cypress commands for testing blockchain interactions

/**
 * Connect wallet with specific configuration
 */
Cypress.Commands.add('connectWalletWithConfig', (config = {}) => {
  const defaultConfig = {
    address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    balance: '100.0',
    chainId: '0x1'
  };
  
  const walletConfig = { ...defaultConfig, ...config };
  
  cy.window().then((win) => {
    // Mock wallet connection
    win.ethereum.request = cy.stub().callsFake(({ method }) => {
      switch (method) {
        case 'eth_requestAccounts':
          return Promise.resolve([walletConfig.address]);
        case 'eth_accounts':
          return Promise.resolve([walletConfig.address]);
        case 'eth_chainId':
          return Promise.resolve(walletConfig.chainId);
        case 'eth_getBalance':
          return Promise.resolve('0x16345785d8a0000'); // 100 ETH
        default:
          return Promise.resolve();
      }
    });
  });
  
  cy.get('[data-testid="connect-wallet-button"], .btn-connect').first().click();
  cy.get('[data-testid="wallet-address"], .btn-connect').should('contain', walletConfig.address.slice(0, 4));
});

/**
 * Mock contract interaction
 */
Cypress.Commands.add('mockContractInteraction', (method, result, error = null) => {
  cy.window().then((win) => {
    if (!win.mockContractInteractions) {
      win.mockContractInteractions = {};
    }
    
    if (error) {
      win.mockContractInteractions[method] = { error };
    } else {
      win.mockContractInteractions[method] = { result };
    }
  });
});

/**
 * Simulate transaction states
 */
Cypress.Commands.add('simulateTransactionState', (state) => {
  cy.window().then((win) => {
    win.transactionState = state;
    
    // Mock transaction based on state
    switch (state) {
      case 'pending':
        win.mockTransaction = {
          hash: '0xpendinghash',
          status: 'pending',
          confirmations: 0
        };
        break;
      case 'confirmed':
        win.mockTransaction = {
          hash: '0xconfirmedhash',
          status: 'confirmed',
          confirmations: 1,
          blockNumber: 18000001
        };
        break;
      case 'failed':
        win.mockTransaction = {
          hash: '0xfailedhash',
          status: 'failed',
          error: 'Transaction failed'
        };
        break;
    }
  });
});

/**
 * Test staking flow with specific amount
 */
Cypress.Commands.add('testStakingFlow', (amount = '1.0') => {
  cy.connectWalletWithConfig();
  
  // Navigate to staking page
  cy.get('nav a[href*="stake"]').click();
  cy.url().should('include', '/stake');
  
  // Enter stake amount
  cy.get('input[type="number"], .stake-input, [data-testid="stake-amount"]')
    .clear()
    .type(amount);
  
  // Mock approval if needed
  cy.mockContractInteraction('allowance', '0');
  cy.mockContractInteraction('approve', { hash: '0xapprovehash' });
  
  // Click approve if button is visible
  cy.get('body').then(($body) => {
    if ($body.find('.approve-btn, [data-testid="approve-button"]').length > 0) {
      cy.get('.approve-btn, [data-testid="approve-button"]').click();
      cy.wait(1000);
    }
  });
  
  // Mock stake transaction
  cy.mockContractInteraction('stake', { hash: '0xstakehash' });
  
  // Click stake button
  cy.get('.stake-btn, [data-testid="stake-button"]').click();
  
  // Verify transaction pending state
  cy.get('.transaction-pending, [data-testid="transaction-pending"]')
    .should('be.visible');
});

/**
 * Test withdrawal flow
 */
Cypress.Commands.add('testWithdrawalFlow', (amount = '0.5') => {
  cy.connectWalletWithConfig();
  
  // Navigate to withdrawal page
  cy.get('nav a[href*="withdraw"]').click();
  cy.url().should('include', '/withdraw');
  
  // Enter withdrawal amount
  cy.get('input[type="number"], .withdraw-input, [data-testid="withdraw-amount"]')
    .clear()
    .type(amount);
  
  // Mock withdrawal transaction
  cy.mockContractInteraction('unstake', { hash: '0xunstakehash' });
  
  // Click withdraw button
  cy.get('.withdraw-btn, [data-testid="withdraw-button"]').click();
  
  // Verify transaction pending state
  cy.get('.transaction-pending, [data-testid="transaction-pending"]')
    .should('be.visible');
});

/**
 * Test error scenarios
 */
Cypress.Commands.add('testErrorScenario', (errorType) => {
  cy.window().then((win) => {
    switch (errorType) {
      case 'userRejected':
        win.ethereum.request = cy.stub().rejects({
          code: 4001,
          message: 'User rejected request'
        });
        break;
      case 'insufficientFunds':
        win.ethereum.request = cy.stub().rejects({
          code: -32603,
          message: 'Insufficient funds'
        });
        break;
      case 'networkError':
        win.ethereum.request = cy.stub().rejects({
          code: -32603,
          message: 'Network error'
        });
        break;
      case 'contractError':
        cy.mockContractInteraction('stake', null, 'Contract execution reverted');
        break;
    }
  });
});

/**
 * Verify transaction history
 */
Cypress.Commands.add('verifyTransactionHistory', (expectedTransactions) => {
  cy.get('.transaction-history, [data-testid="transaction-history"]')
    .should('be.visible');
  
  expectedTransactions.forEach((tx, index) => {
    cy.get('.transaction-item, [data-testid="transaction-item"]')
      .eq(index)
      .should('contain', tx.hash.slice(0, 8))
      .should('contain', tx.status);
  });
});

/**
 * Test responsive design
 */
Cypress.Commands.add('testResponsiveDesign', () => {
  const viewports = [
    { width: 375, height: 667, name: 'Mobile' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1280, height: 720, name: 'Desktop' }
  ];
  
  viewports.forEach(viewport => {
    cy.viewport(viewport.width, viewport.height);
    cy.get('body').should('be.visible');
    cy.get('.btn-connect, [data-testid="connect-wallet-button"]')
      .should('be.visible');
  });
});

/**
 * Test accessibility
 */
Cypress.Commands.add('testAccessibility', () => {
  // Check for proper ARIA labels
  cy.get('button').should('have.attr', 'type');
  cy.get('input').should('have.attr', 'type');
  
  // Check for proper heading structure
  cy.get('h1').should('exist');
  
  // Check for alt text on images
  cy.get('img').each(($img) => {
    cy.wrap($img).should('have.attr', 'alt');
  });
  
  // Check for proper form labels
  cy.get('input[type="number"]').each(($input) => {
    const id = $input.attr('id');
    if (id) {
      cy.get(`label[for="${id}"]`).should('exist');
    }
  });
});

/**
 * Test performance metrics
 */
Cypress.Commands.add('testPerformanceMetrics', () => {
  cy.window().then((win) => {
    // Measure page load time
    const loadTime = win.performance.timing.loadEventEnd - win.performance.timing.navigationStart;
    expect(loadTime).to.be.lessThan(3000); // Should load within 3 seconds
    
    // Check for console errors
    const consoleErrors = [];
    const originalError = win.console.error;
    
    win.console.error = (...args) => {
      consoleErrors.push(args.join(' '));
      originalError.apply(win.console, args);
    };
    
    cy.wait(1000);
    
    // Filter out non-critical errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('ENS resolution failed') &&
      !error.includes('non-critical')
    );
    
    expect(criticalErrors).to.have.length(0);
  });
});

/**
 * Test cross-browser compatibility
 */
Cypress.Commands.add('testCrossBrowserCompatibility', () => {
  // Test basic functionality across different user agents
  cy.window().then((win) => {
    const userAgent = win.navigator.userAgent;
    
    // Test Web3 availability
    expect(win.ethereum).to.exist;
    
    // Test basic DOM operations
    const testElement = win.document.createElement('div');
    testElement.textContent = 'Test';
    expect(testElement.textContent).to.equal('Test');
  });
});

/**
 * Test security features
 */
Cypress.Commands.add('testSecurityFeatures', () => {
  // Check for HTTPS in production
  cy.url().then((url) => {
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      // Skip HTTPS check for local development
      return;
    }
    expect(url).to.match(/^https:/);
  });
  
  // Check for Content Security Policy
  cy.document().then((doc) => {
    const meta = doc.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (meta) {
      expect(meta.content).to.exist;
    }
  });
  
  // Check for secure cookies
  cy.getCookies().then((cookies) => {
    cookies.forEach((cookie) => {
      if (cookie.name.includes('session') || cookie.name.includes('auth')) {
        expect(cookie.secure).to.be.true;
      }
    });
  });
});