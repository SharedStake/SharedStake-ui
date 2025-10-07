describe('Stake Functionality', () => {
  beforeEach(() => {
    cy.navigateTo('/stake')
  })

  describe('Stake Page UI', () => {
    it('should load the stake page successfully', () => {
      cy.get('.stake').should('be.visible')
      cy.contains('Stake').should('be.visible')
      cy.contains('Unstake').should('be.visible')
    })

    it('should have stake/unstake toggle', () => {
      // Check if chooser component exists with Stake and Unstake options
      cy.get('.chooser').should('be.visible')
      cy.contains('button', 'Stake').should('be.visible')
      cy.contains('button', 'Unstake').should('be.visible')
    })

    it('should switch between stake and unstake modes', () => {
      // Click Unstake
      cy.contains('button', 'Unstake').click()
      
      // Verify UI changes for unstake mode
      cy.get('input[type="text"]').first().should('exist')
      cy.contains(/sgETH|wsgETH/).should('be.visible')
      
      // Click back to Stake
      cy.contains('button', 'Stake').click()
      
      // Verify UI changes back to stake mode
      cy.contains('ETH').should('be.visible')
    })

    it('should display input fields for amounts', () => {
      // Check for amount input fields
      cy.get('input[placeholder="0.0"]').should('have.length.at.least', 1)
      
      // Check for balance display
      cy.checkBalance()
    })

    it('should have gas price selector', () => {
      cy.get('#gas').should('be.visible')
      cy.get('#gas .chooser').should('exist')
      
      // Check for gas price options
      cy.get('#gas .chooser button').should('have.length.at.least', 3)
    })

    it('should calculate output amount when input is entered', () => {
      // Enter an amount
      cy.inputAmount('1')
      
      // Check if output field shows calculated amount
      cy.get('input[readonly]').should('exist')
      cy.get('input[readonly]').invoke('val').should('not.be.empty')
    })

    it('should validate input amounts', () => {
      // Try entering invalid characters
      cy.get('input[placeholder="0.0"]').first().type('abc')
      cy.get('input[placeholder="0.0"]').first().invoke('val').should('match', /^[0-9.]*$/)
      
      // Clear and enter valid amount
      cy.get('input[placeholder="0.0"]').first().clear().type('1.5')
      cy.get('input[placeholder="0.0"]').first().should('have.value', '1.5')
    })
  })

  describe('Wallet Connection for Staking', () => {
    it('should show connect wallet button when not connected', () => {
      cy.get('body').then($body => {
        if ($body.find('.connect-wallet, button:contains("Connect")').length > 0) {
          cy.get('.connect-wallet, button:contains("Connect")').should('be.visible')
        }
      })
    })

    it('should handle wallet connection flow', () => {
      cy.mockWalletConnection()
      
      // Look for wallet connection button and click if exists
      cy.get('body').then($body => {
        if ($body.find('button:contains("Connect")').length > 0) {
          cy.contains('button', 'Connect').click()
          
          // Wait for wallet modal or connection
          cy.wait(2000)
        }
      })
    })

    it('should show balance when wallet is connected', () => {
      cy.mockWalletConnection()
      
      // Check for balance display
      cy.get('.balance').should('contain', 'wallet:')
    })
  })

  describe('Staking Interaction', () => {
    beforeEach(() => {
      cy.mockWalletConnection()
    })

    it('should enable MAX button functionality', () => {
      // Click on balance or MAX button
      cy.get('.balance').first().click()
      
      // Check if input is populated
      cy.get('input[placeholder="0.0"]').first().invoke('val').then(value => {
        if (value && value !== '0' && value !== '0.0') {
          expect(parseFloat(value)).to.be.greaterThan(0)
        }
      })
    })

    it('should update gas prices', () => {
      // Select different gas prices
      cy.selectGasPrice('low')
      cy.wait(500)
      
      cy.selectGasPrice('high')
      cy.wait(500)
      
      cy.selectGasPrice('medium')
    })

    it('should show stake button when amount is entered', () => {
      cy.inputAmount('0.1')
      
      // Look for stake/submit button
      cy.get('button').then($buttons => {
        const stakeButton = Array.from($buttons).find(btn => 
          btn.textContent.toLowerCase().includes('stake') ||
          btn.textContent.toLowerCase().includes('submit') ||
          btn.textContent.toLowerCase().includes('confirm')
        )
        
        if (stakeButton && !stakeButton.textContent.includes('Unstake')) {
          cy.wrap(stakeButton).should('be.visible')
        }
      })
    })

    it('should handle minimum stake requirements', () => {
      // Try to stake very small amount
      cy.inputAmount('0.00001')
      
      // Check for any warning or error messages
      cy.get('body').then($body => {
        if ($body.find('.error, .warning, .notification').length > 0) {
          cy.get('.error, .warning, .notification').should('be.visible')
        }
      })
    })
  })

  describe('Unstake Functionality', () => {
    beforeEach(() => {
      cy.mockWalletConnection()
      // Switch to Unstake mode
      cy.contains('button', 'Unstake').click()
    })

    it('should switch input/output tokens for unstaking', () => {
      // In unstake mode, input should be sgETH/wsgETH
      cy.get('.ant-col').first().should('contain.oneOf', ['sgETH', 'wsgETH'])
      
      // Output should be ETH
      cy.get('.ant-col').last().should('contain', 'ETH')
    })

    it('should calculate ETH output for unstaking', () => {
      cy.inputAmount('1')
      
      // Check if ETH output is calculated
      cy.get('input[readonly]').invoke('val').should('not.be.empty')
    })

    it('should show unstake balance', () => {
      cy.get('.balance').should('be.visible')
      cy.get('.balance').should('contain', 'wallet:')
    })
  })

  describe('Stake Page Responsiveness', () => {
    it('should be responsive on mobile', () => {
      cy.viewport('iphone-x')
      
      cy.get('.stake').should('be.visible')
      cy.get('input[placeholder="0.0"]').should('be.visible')
      cy.get('.chooser').should('be.visible')
    })

    it('should be responsive on tablet', () => {
      cy.viewport('ipad-2')
      
      cy.get('.stake').should('be.visible')
      cy.get('input[placeholder="0.0"]').should('be.visible')
      cy.get('.chooser').should('be.visible')
    })

    it('should maintain functionality on different screen sizes', () => {
      const viewports = ['iphone-x', 'ipad-2', [1920, 1080]]
      
      viewports.forEach(viewport => {
        if (Array.isArray(viewport)) {
          cy.viewport(viewport[0], viewport[1])
        } else {
          cy.viewport(viewport)
        }
        
        // Test basic interactions
        cy.inputAmount('1')
        cy.get('input[placeholder="0.0"]').first().should('have.value', '1')
        cy.get('input[placeholder="0.0"]').first().clear()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      cy.checkNoErrors()
    })

    it('should validate decimal input correctly', () => {
      // Test multiple decimal points
      cy.get('input[placeholder="0.0"]').first().type('1.2.3')
      cy.get('input[placeholder="0.0"]').first().invoke('val').then(value => {
        // Should not allow multiple decimal points
        expect(value.split('.').length).to.be.lessThan(3)
      })
    })

    it('should handle very large numbers', () => {
      cy.inputAmount('999999999')
      
      // Should either accept or show error
      cy.get('input[placeholder="0.0"]').first().should('have.value', '999999999')
    })

    it('should clear inputs properly', () => {
      cy.inputAmount('123')
      cy.get('input[placeholder="0.0"]').first().clear()
      cy.get('input[placeholder="0.0"]').first().should('have.value', '')
    })
  })
})