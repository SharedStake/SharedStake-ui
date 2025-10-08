describe('Staking Flow', () => {
  beforeEach(() => {
    cy.visit('/stake');
    cy.waitForWeb3();
    cy.connectWallet();
  });

  it('should load the staking page successfully', () => {
    cy.url().should('include', '/stake');
    cy.get('body').should('be.visible');
  });

  it('should display staking interface when wallet is connected', () => {
    cy.get('.stake-interface, [data-testid="stake-interface"]')
      .should('be.visible');
  });

  it('should show current staking balance', () => {
    cy.get('.staked-amount, [data-testid="staked-amount"]')
      .should('be.visible');
  });

  it('should display APY information', () => {
    cy.get('.apy, .apy-display, [data-testid="apy"]')
      .should('be.visible')
      .should('contain', '%');
  });

  it('should allow entering stake amount', () => {
    cy.get('input[type="number"], .stake-input, [data-testid="stake-amount"]')
      .should('be.visible')
      .type('1.0');
  });

  it('should show approve button for token approval', () => {
    cy.get('.approve-btn, [data-testid="approve-button"]')
      .should('be.visible')
      .should('contain', 'Approve');
  });

  it('should show stake button after approval', () => {
    // Mock approval transaction
    cy.mockContractCall('approve', { hash: '0xapprovehash' });
    
    cy.get('.approve-btn, [data-testid="approve-button"]').click();
    cy.wait(1000);
    
    cy.get('.stake-btn, [data-testid="stake-button"]')
      .should('be.visible')
      .should('contain', 'Stake');
  });

  it('should handle stake transaction', () => {
    // Mock stake transaction
    cy.mockContractCall('stake', { hash: '0xstakehash' });
    
    cy.get('input[type="number"], .stake-input, [data-testid="stake-amount"]')
      .type('1.0');
    
    cy.get('.stake-btn, [data-testid="stake-button"]').click();
    
    // Should show transaction pending state
    cy.get('.transaction-pending, [data-testid="transaction-pending"]')
      .should('be.visible');
  });

  it('should display rewards information', () => {
    cy.get('.rewards, .rewards-display, [data-testid="rewards"]')
      .should('be.visible');
  });

  it('should show claim rewards button when rewards are available', () => {
    cy.get('.claim-rewards, [data-testid="claim-rewards"]')
      .should('be.visible');
  });

  it('should handle unstaking functionality', () => {
    cy.get('.unstake-btn, [data-testid="unstake-button"]')
      .should('be.visible')
      .click();
    
    cy.get('.unstake-interface, [data-testid="unstake-interface"]')
      .should('be.visible');
  });

  it('should validate stake amount input', () => {
    cy.get('input[type="number"], .stake-input, [data-testid="stake-amount"]')
      .type('-1');
    
    cy.get('.error-message, [data-testid="error-message"]')
      .should('be.visible')
      .should('contain', 'Invalid amount');
  });

  it('should show maximum balance option', () => {
    cy.get('.max-btn, [data-testid="max-button"]')
      .should('be.visible')
      .click();
    
    cy.get('input[type="number"], .stake-input, [data-testid="stake-amount"]')
      .should('have.value', '100'); // Mock balance
  });

  it('should display transaction history or status', () => {
    cy.get('.transaction-history, [data-testid="transaction-history"]')
      .should('be.visible');
  });

  it('should be responsive on mobile devices', () => {
    cy.viewport(375, 667);
    cy.get('.stake-interface, [data-testid="stake-interface"]')
      .should('be.visible');
  });
});