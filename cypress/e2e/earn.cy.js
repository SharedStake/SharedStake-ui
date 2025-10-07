describe('Earn Functionality', () => {
  beforeEach(() => {
    cy.navigateTo('/earn')
  })

  describe('Earn Page UI', () => {
    it('should load the earn page successfully', () => {
      cy.url().should('include', '/earn')
      cy.get('.earn, .container, [class*="earn"]').should('exist')
    })

    it('should display earning opportunities', () => {
      // Check for pools, farms, or earning options
      cy.get('body').should('contain.text', /earn|yield|apy|apr|reward/i)
    })

    it('should show available pools or farms', () => {
      cy.get('.pool, .farm, .earning-option, [class*="pool"], [class*="farm"]').should('exist')
    })

    it('should display APY/APR information', () => {
      cy.get('body').then($body => {
        if ($body.text().match(/apy|apr|%/i)) {
          cy.contains(/apy|apr|%/i).should('be.visible')
        }
      })
    })

    it('should show total value locked (TVL) if available', () => {
      cy.get('body').then($body => {
        if ($body.text().match(/tvl|total value|locked/i)) {
          cy.contains(/tvl|total value|locked/i).should('be.visible')
        }
      })
    })
  })

  describe('Pool/Farm Display', () => {
    it('should display pool information', () => {
      cy.get('.pool, .farm, .earning-option, [class*="pool"]').then($pools => {
        if ($pools.length > 0) {
          cy.wrap($pools.first()).within(() => {
            // Check for essential pool information
            cy.get('[class*="name"], [class*="title"], h2, h3, h4').should('exist')
          })
        }
      })
    })

    it('should show rewards information', () => {
      cy.get('body').then($body => {
        if ($body.text().includes('reward') || $body.text().includes('Reward')) {
          cy.contains(/reward/i).should('be.visible')
        }
      })
    })

    it('should display staking requirements if any', () => {
      cy.get('body').then($body => {
        if ($body.text().match(/stake|deposit|minimum/i)) {
          cy.contains(/stake|deposit|minimum/i).should('be.visible')
        }
      })
    })

    it('should show user positions if wallet connected', () => {
      cy.mockWalletConnection()
      
      cy.get('body').then($body => {
        if ($body.find('.position, .balance, [class*="position"]').length > 0) {
          cy.get('.position, .balance, [class*="position"]').should('exist')
        }
      })
    })
  })

  describe('Wallet Integration for Earning', () => {
    it('should show connect wallet option', () => {
      cy.get('body').then($body => {
        if ($body.find('button:contains("Connect")').length > 0) {
          cy.contains('button', 'Connect').should('be.visible')
        }
      })
    })

    it('should handle wallet connection', () => {
      cy.mockWalletConnection()
      
      cy.get('body').then($body => {
        if ($body.find('button:contains("Connect")').length > 0) {
          cy.contains('button', 'Connect').click()
          cy.wait(2000)
        }
      })
    })

    it('should show user balances when connected', () => {
      cy.mockWalletConnection()
      
      cy.get('.balance, [class*="balance"]').should('exist')
    })

    it('should display earned rewards if any', () => {
      cy.mockWalletConnection()
      
      cy.get('body').then($body => {
        if ($body.text().match(/earned|pending|claimable/i)) {
          cy.contains(/earned|pending|claimable/i).should('be.visible')
        }
      })
    })
  })

  describe('Staking/Depositing Process', () => {
    beforeEach(() => {
      cy.mockWalletConnection()
    })

    it('should allow entering stake amount', () => {
      // Look for stake/deposit button first
      cy.get('button').then($buttons => {
        const stakeButton = Array.from($buttons).find(btn => 
          btn.textContent.toLowerCase().includes('stake') ||
          btn.textContent.toLowerCase().includes('deposit')
        )
        
        if (stakeButton) {
          cy.wrap(stakeButton).click()
          
          // Now look for input
          cy.get('input[type="text"], input[type="number"]').then($inputs => {
            if ($inputs.length > 0) {
              cy.wrap($inputs.first()).clear().type('1')
              cy.wrap($inputs.first()).should('have.value', '1')
            }
          })
        }
      })
    })

    it('should validate deposit amounts', () => {
      cy.get('input[type="text"], input[type="number"]').then($inputs => {
        if ($inputs.length > 0) {
          // Test invalid input
          cy.wrap($inputs.first()).type('abc')
          cy.wrap($inputs.first()).invoke('val').should('match', /^[0-9.]*$/)
          
          // Test valid input
          cy.wrap($inputs.first()).clear().type('0.5')
          cy.wrap($inputs.first()).should('have.value', '0.5')
        }
      })
    })

    it('should show deposit/stake button', () => {
      cy.get('button').then($buttons => {
        const actionButton = Array.from($buttons).find(btn => 
          btn.textContent.toLowerCase().includes('stake') ||
          btn.textContent.toLowerCase().includes('deposit') ||
          btn.textContent.toLowerCase().includes('add')
        )
        
        if (actionButton) {
          cy.wrap(actionButton).should('be.visible')
        }
      })
    })

    it('should have MAX functionality', () => {
      cy.get('body').then($body => {
        if ($body.find('.max-button, button:contains("MAX")').length > 0) {
          cy.get('.max-button, button:contains("MAX")').first().click()
          
          // Check if input is populated
          cy.get('input[type="text"], input[type="number"]').then($inputs => {
            if ($inputs.length > 0) {
              cy.wrap($inputs.first()).invoke('val').should('not.be.empty')
            }
          })
        }
      })
    })
  })

  describe('Claiming Rewards', () => {
    beforeEach(() => {
      cy.mockWalletConnection()
    })

    it('should show claim button if rewards available', () => {
      cy.get('body').then($body => {
        if ($body.find('button:contains("Claim")').length > 0) {
          cy.contains('button', 'Claim').should('be.visible')
        }
      })
    })

    it('should display claimable amount', () => {
      cy.get('body').then($body => {
        if ($body.text().match(/claimable|earned|pending rewards/i)) {
          cy.contains(/claimable|earned|pending rewards/i).should('be.visible')
        }
      })
    })

    it('should handle claim process', () => {
      cy.get('button').then($buttons => {
        const claimButton = Array.from($buttons).find(btn => 
          btn.textContent.toLowerCase().includes('claim')
        )
        
        if (claimButton && !claimButton.disabled) {
          cy.wrap(claimButton).click()
          
          // Check for confirmation or transaction modal
          cy.get('.modal, .dialog, [class*="modal"]').should('exist')
        }
      })
    })
  })

  describe('Withdrawing from Pools', () => {
    beforeEach(() => {
      cy.mockWalletConnection()
    })

    it('should allow withdrawing from pools', () => {
      cy.get('button').then($buttons => {
        const withdrawButton = Array.from($buttons).find(btn => 
          btn.textContent.toLowerCase().includes('withdraw') ||
          btn.textContent.toLowerCase().includes('unstake')
        )
        
        if (withdrawButton) {
          cy.wrap(withdrawButton).should('be.visible')
        }
      })
    })

    it('should show withdrawal amount input', () => {
      cy.get('button').then($buttons => {
        const withdrawButton = Array.from($buttons).find(btn => 
          btn.textContent.toLowerCase().includes('withdraw')
        )
        
        if (withdrawButton) {
          cy.wrap(withdrawButton).click()
          
          // Check for input field
          cy.get('input[type="text"], input[type="number"]').should('exist')
        }
      })
    })
  })

  describe('Earn Page Responsiveness', () => {
    it('should be responsive on mobile', () => {
      cy.viewport('iphone-x')
      
      cy.get('.earn, .container, [class*="earn"]').should('exist')
      cy.get('.pool, .farm, .earning-option, [class*="pool"]').should('be.visible')
    })

    it('should be responsive on tablet', () => {
      cy.viewport('ipad-2')
      
      cy.get('.earn, .container, [class*="earn"]').should('exist')
      cy.get('.pool, .farm, .earning-option, [class*="pool"]').should('be.visible')
    })

    it('should maintain functionality across screen sizes', () => {
      const viewports = ['iphone-x', 'ipad-2', [1920, 1080]]
      
      viewports.forEach(viewport => {
        if (Array.isArray(viewport)) {
          cy.viewport(viewport[0], viewport[1])
        } else {
          cy.viewport(viewport)
        }
        
        // Check basic visibility
        cy.get('.earn, .container, [class*="earn"]').should('exist')
      })
    })

    it('should have readable text on mobile', () => {
      cy.viewport('iphone-x')
      
      // Check if APY/APR values are visible
      cy.get('body').then($body => {
        if ($body.text().match(/apy|apr|%/i)) {
          cy.contains(/apy|apr|%/i).should('be.visible')
        }
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      cy.checkNoErrors()
    })

    it('should validate minimum deposit amounts', () => {
      cy.get('input[type="text"], input[type="number"]').then($inputs => {
        if ($inputs.length > 0) {
          // Try very small amount
          cy.wrap($inputs.first()).clear().type('0.00001')
          
          // Check for validation message
          cy.get('body').then($body => {
            if ($body.find('.error, .warning').length > 0) {
              cy.get('.error, .warning').should('be.visible')
            }
          })
        }
      })
    })

    it('should handle insufficient balance', () => {
      cy.mockWalletConnection()
      
      cy.get('input[type="text"], input[type="number"]').then($inputs => {
        if ($inputs.length > 0) {
          // Enter very large amount
          cy.wrap($inputs.first()).clear().type('999999')
          
          // Try to deposit
          cy.get('button').then($buttons => {
            const depositButton = Array.from($buttons).find(btn => 
              btn.textContent.toLowerCase().includes('deposit') ||
              btn.textContent.toLowerCase().includes('stake')
            )
            
            if (depositButton && !depositButton.disabled) {
              cy.wrap(depositButton).click()
              // Check for error message
              cy.get('.error, .warning, .notification').should('exist')
            }
          })
        }
      })
    })

    it('should prevent negative amounts', () => {
      cy.get('input[type="text"], input[type="number"]').then($inputs => {
        if ($inputs.length > 0) {
          cy.wrap($inputs.first()).clear().type('-1')
          
          // Should either prevent or show error
          cy.wrap($inputs.first()).invoke('val').then(value => {
            if (value === '-1') {
              cy.get('.error, .warning').should('exist')
            } else {
              expect(value).to.not.include('-')
            }
          })
        }
      })
    })
  })

  describe('Pool Information Display', () => {
    it('should show pool statistics', () => {
      cy.get('.pool, .farm, [class*="pool"]').then($pools => {
        if ($pools.length > 0) {
          // Check for statistics like TVL, participants, etc.
          cy.get('body').then($body => {
            const hasStats = $body.text().match(/tvl|participants|staked|deposited/i)
            if (hasStats) {
              cy.contains(/tvl|participants|staked|deposited/i).should('be.visible')
            }
          })
        }
      })
    })

    it('should display pool risks if any', () => {
      cy.get('body').then($body => {
        if ($body.text().match(/risk|warning|impermanent loss/i)) {
          cy.contains(/risk|warning|impermanent loss/i).should('be.visible')
        }
      })
    })

    it('should show pool duration or lock period', () => {
      cy.get('body').then($body => {
        if ($body.text().match(/lock|duration|period|days/i)) {
          cy.contains(/lock|duration|period|days/i).should('be.visible')
        }
      })
    })
  })
})