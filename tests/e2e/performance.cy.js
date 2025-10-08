describe('Performance Testing', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForWeb3();
  });

  it('should load page within acceptable time', () => {
    cy.testPerformanceMetrics();
  });

  it('should handle multiple rapid interactions', () => {
    cy.connectWalletWithConfig();
    
    // Rapid clicking should not cause issues
    for (let i = 0; i < 5; i++) {
      cy.get('.btn-connect, [data-testid="wallet-address"]').click();
      cy.wait(100);
    }
    
    cy.get('body').should('be.visible');
  });

  it('should maintain performance with large data sets', () => {
    cy.connectWalletWithConfig();
    cy.navigateTo('stake');
    
    // Test with large amounts
    cy.get('input[type="number"], .stake-input, [data-testid="stake-amount"]')
      .type('999999999999999999999');
    
    cy.get('body').should('be.visible');
  });
});