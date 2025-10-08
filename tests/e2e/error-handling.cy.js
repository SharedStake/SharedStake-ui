describe('Error Handling', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForWeb3();
  });

  it('should handle wallet connection rejection', () => {
    cy.testErrorScenario('userRejected');
    
    cy.get('.btn-connect, [data-testid="connect-wallet-button"]').click();
    
    // Should show error message or remain on connect state
    cy.get('body').should('be.visible');
    cy.get('.btn-connect, [data-testid="connect-wallet-button"]')
      .should('contain', 'Connect Wallet');
  });

  it('should handle insufficient funds error', () => {
    cy.connectWalletWithConfig();
    cy.testErrorScenario('insufficientFunds');
    
    cy.navigateTo('stake');
    cy.get('input[type="number"], .stake-input, [data-testid="stake-amount"]')
      .type('1000'); // More than available balance
    
    cy.get('.stake-btn, [data-testid="stake-button"]').click();
    
    // Should show insufficient funds error
    cy.get('.error-message, [data-testid="error-message"]')
      .should('be.visible')
      .should('contain', 'Insufficient funds');
  });

  it('should handle network errors gracefully', () => {
    cy.testErrorScenario('networkError');
    
    cy.get('.btn-connect, [data-testid="connect-wallet-button"]').click();
    
    // Should handle network error gracefully
    cy.get('body').should('be.visible');
  });

  it('should handle contract execution errors', () => {
    cy.connectWalletWithConfig();
    cy.testErrorScenario('contractError');
    
    cy.navigateTo('stake');
    cy.get('input[type="number"], .stake-input, [data-testid="stake-amount"]')
      .type('1.0');
    
    cy.get('.stake-btn, [data-testid="stake-button"]').click();
    
    // Should show contract error
    cy.get('.error-message, [data-testid="error-message"]')
      .should('be.visible')
      .should('contain', 'Contract execution reverted');
  });

  it('should handle transaction failures', () => {
    cy.connectWalletWithConfig();
    cy.simulateTransactionState('failed');
    
    cy.navigateTo('stake');
    cy.get('input[type="number"], .stake-input, [data-testid="stake-amount"]')
      .type('1.0');
    
    cy.get('.stake-btn, [data-testid="stake-button"]').click();
    
    // Should show transaction failed state
    cy.get('.transaction-failed, [data-testid="transaction-failed"]')
      .should('be.visible');
  });

  it('should handle invalid input gracefully', () => {
    cy.connectWalletWithConfig();
    cy.navigateTo('stake');
    
    // Test negative amounts
    cy.get('input[type="number"], .stake-input, [data-testid="stake-amount"]')
      .type('-1');
    
    cy.get('.error-message, [data-testid="error-message"]')
      .should('be.visible')
      .should('contain', 'Invalid amount');
    
    // Test non-numeric input
    cy.get('input[type="number"], .stake-input, [data-testid="stake-amount"]')
      .clear()
      .type('abc');
    
    cy.get('.error-message, [data-testid="error-message"]')
      .should('be.visible')
      .should('contain', 'Invalid amount');
  });

  it('should handle network switching errors', () => {
    cy.connectWalletWithConfig();
    
    // Mock network switch failure
    cy.window().then((win) => {
      win.ethereum.request = cy.stub().callsFake(({ method }) => {
        if (method === 'wallet_switchEthereumChain') {
          return Promise.reject({
            code: 4902,
            message: 'Unrecognized chain ID'
          });
        }
        return Promise.resolve('0x1');
      });
    });
    
    // Should handle network switch error gracefully
    cy.get('body').should('be.visible');
  });

  it('should handle timeout errors', () => {
    cy.connectWalletWithConfig();
    
    // Mock slow response
    cy.window().then((win) => {
      win.ethereum.request = cy.stub().callsFake(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100);
        });
      });
    });
    
    cy.navigateTo('stake');
    cy.get('input[type="number"], .stake-input, [data-testid="stake-amount"]')
      .type('1.0');
    
    cy.get('.stake-btn, [data-testid="stake-button"]').click();
    
    // Should show timeout error
    cy.get('.error-message, [data-testid="error-message"]')
      .should('be.visible')
      .should('contain', 'Request timeout');
  });

  it('should recover from errors and allow retry', () => {
    cy.connectWalletWithConfig();
    cy.testErrorScenario('contractError');
    
    cy.navigateTo('stake');
    cy.get('input[type="number"], .stake-input, [data-testid="stake-amount"]')
      .type('1.0');
    
    cy.get('.stake-btn, [data-testid="stake-button"]').click();
    
    // Should show error
    cy.get('.error-message, [data-testid="error-message"]')
      .should('be.visible');
    
    // Clear error scenario and retry
    cy.mockContractInteraction('stake', { hash: '0xstakehash' });
    
    cy.get('.retry-btn, [data-testid="retry-button"]').click();
    
    // Should show success state
    cy.get('.transaction-pending, [data-testid="transaction-pending"]')
      .should('be.visible');
  });
});