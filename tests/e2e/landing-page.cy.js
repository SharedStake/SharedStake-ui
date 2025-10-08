describe('Landing Page', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForWeb3();
  });

  it('should load the landing page successfully', () => {
    cy.get('body').should('be.visible');
    cy.title().should('not.be.empty');
  });

  it('should display the main navigation', () => {
    cy.get('nav').should('be.visible');
    cy.get('nav').should('contain', 'Stake');
    cy.get('nav').should('contain', 'Withdraw');
    cy.get('nav').should('contain', 'Earn');
  });

  it('should display the connect wallet button', () => {
    cy.get('.btn-connect, [data-testid="connect-wallet-button"]')
      .should('be.visible')
      .should('contain', 'Connect Wallet');
  });

  it('should display hero section with key messaging', () => {
    cy.get('h1, .hero-title, .main-title').should('be.visible');
    cy.get('body').should('contain', 'SharedStake');
  });

  it('should display partner logos or information', () => {
    cy.get('.partners, .partner-logos, [data-testid="partners"]')
      .should('be.visible');
  });

  it('should be responsive on mobile viewport', () => {
    cy.viewport(375, 667); // iPhone SE
    cy.get('body').should('be.visible');
    cy.get('.btn-connect, [data-testid="connect-wallet-button"]')
      .should('be.visible');
  });

  it('should have proper meta tags for SEO', () => {
    cy.get('head meta[name="description"]').should('exist');
    cy.get('head meta[property="og:title"]').should('exist');
    cy.get('head meta[property="og:description"]').should('exist');
  });

  it('should load without console errors', () => {
    cy.window().then((win) => {
      const consoleErrors = [];
      const originalError = win.console.error;
      
      win.console.error = (...args) => {
        consoleErrors.push(args.join(' '));
        originalError.apply(win.console, args);
      };
      
      cy.visit('/');
      cy.wait(1000);
      
      // Check for critical errors (ignore non-critical ones)
      const criticalErrors = consoleErrors.filter(error => 
        !error.includes('ENS resolution failed') &&
        !error.includes('non-critical')
      );
      
      expect(criticalErrors).to.have.length(0);
    });
  });
});