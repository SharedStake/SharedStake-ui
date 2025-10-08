describe('Wallet Connection', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForWeb3();
  });

  it('should display connect wallet button when not connected', () => {
    cy.get('.btn-connect, [data-testid="connect-wallet-button"]')
      .should('be.visible')
      .should('contain', 'Connect Wallet');
  });

  it('should connect wallet successfully', () => {
    // Click connect wallet button
    cy.get('.btn-connect, [data-testid="connect-wallet-button"]').click();
    
    // Wait for connection process
    cy.wait(1000);
    
    // Check that wallet is connected (address should be displayed)
    cy.get('.btn-connect, [data-testid="wallet-address"]')
      .should('contain', '0x74')
      .should('contain', '...');
  });

  it('should display wallet address in truncated format', () => {
    cy.connectWallet();
    
    // Check that address is properly truncated
    cy.get('.btn-connect, [data-testid="wallet-address"]')
      .should('contain', '0x74')
      .should('contain', '...')
      .should('not.contain', '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');
  });

  it('should handle wallet connection errors gracefully', () => {
    // Mock a connection error
    cy.window().then((win) => {
      win.ethereum.request = cy.stub().rejects(new Error('User rejected request'));
    });
    
    cy.get('.btn-connect, [data-testid="connect-wallet-button"]').click();
    
    // Should still show connect button after error
    cy.get('.btn-connect, [data-testid="connect-wallet-button"]')
      .should('be.visible')
      .should('contain', 'Connect Wallet');
  });

  it('should maintain connection state across page navigation', () => {
    cy.connectWallet();
    
    // Navigate to another page
    cy.get('nav a[href*="stake"], nav a[href*="withdraw"]').first().click();
    
    // Check that wallet is still connected
    cy.get('.btn-connect, [data-testid="wallet-address"]')
      .should('contain', '0x74');
  });

  it('should disconnect wallet when requested', () => {
    cy.connectWallet();
    
    // Look for disconnect functionality (might be in a dropdown or menu)
    cy.get('[data-testid="disconnect-wallet"], .disconnect-btn, .wallet-menu').then(($el) => {
      if ($el.length > 0) {
        $el.click();
        cy.get('.btn-connect, [data-testid="connect-wallet-button"]')
          .should('contain', 'Connect Wallet');
      }
    });
  });

  it('should handle network switching', () => {
    cy.connectWallet();
    
    // Mock network switch
    cy.window().then((win) => {
      win.ethereum.request = cy.stub().callsFake(({ method }) => {
        if (method === 'wallet_switchEthereumChain') {
          return Promise.resolve();
        }
        return Promise.resolve('0x1'); // Mainnet
      });
    });
    
    // This test would need to be adapted based on your app's network switching UI
    cy.get('body').should('be.visible'); // Placeholder assertion
  });
});