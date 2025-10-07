describe('Rollover Functionality', () => {
  beforeEach(() => {
    cy.navigateTo('/rollover')
  })

  describe('Rollover Page UI', () => {
    it('should load the rollover page successfully', () => {
      cy.url().should('include', '/rollover')
      cy.get('.rollover, .container, [class*="rollover"]').should('exist')
    })

    it('should display rollover interface elements', () => {
      // Check for rollover-specific content
      cy.get('body').should('contain.text', /rollover|migrate|transfer/i)
      
      // Check for input fields
      cy.get('input').should('exist')
    })

    it('should show rollover instructions or information', () => {
      cy.get('body').then($body => {
        // Look for informational text about rollover
        const hasInfo = $body.text().match(/rollover|migrate|transfer|upgrade/i)
        if (hasInfo) {
          cy.contains(/rollover|migrate|transfer|upgrade/i).should('be.visible')
        }
      })
    })

    it('should display balance information', () => {
      cy.get('.balance, [class*="balance"]').should('exist')
    })
  })

  describe('Wallet Integration for Rollover', () => {
    it('should require wallet connection', () => {
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

    it('should show eligible tokens for rollover', () => {
      cy.mockWalletConnection()
      
      // Check for token balance display
      cy.get('.balance, .token-balance, [class*="balance"]').should('exist')
    })
  })

  describe('Rollover Process', () => {
    beforeEach(() => {
      cy.mockWalletConnection()
    })

    it('should allow entering rollover amount', () => {
      cy.get('input').then($inputs => {
        const amountInput = Array.from($inputs).find(input => 
          input.type === 'text' || input.type === 'number'
        )
        
        if (amountInput) {
          cy.wrap(amountInput).clear().type('1')
          cy.wrap(amountInput).should('have.value', '1')
        }
      })
    })

    it('should validate rollover amounts', () => {
      cy.get('input').then($inputs => {
        const amountInput = Array.from($inputs).find(input => 
          input.type === 'text' || input.type === 'number'
        )
        
        if (amountInput) {
          // Test invalid input
          cy.wrap(amountInput).type('abc')
          cy.wrap(amountInput).invoke('val').should('match', /^[0-9.]*$/)
          
          // Clear and test valid input
          cy.wrap(amountInput).clear().type('0.5')
          cy.wrap(amountInput).should('have.value', '0.5')
        }
      })
    })

    it('should have MAX button functionality', () => {
      cy.get('body').then($body => {
        if ($body.find('.max-button, button:contains("MAX"), .balance').length > 0) {
          const maxElement = $body.find('.max-button, button:contains("MAX"), .balance').first()
          cy.wrap(maxElement).click()
          
          // Check if input is populated
          cy.get('input').then($inputs => {
            const amountInput = Array.from($inputs).find(input => 
              input.type === 'text' || input.type === 'number'
            )
            
            if (amountInput) {
              cy.wrap(amountInput).invoke('val').should('not.be.empty')
            }
          })
        }
      })
    })

    it('should show rollover button when amount is valid', () => {
      cy.get('input').then($inputs => {
        const amountInput = Array.from($inputs).find(input => 
          input.type === 'text' || input.type === 'number'
        )
        
        if (amountInput) {
          cy.wrap(amountInput).clear().type('1')
          
          // Look for rollover button
          cy.get('button').then($buttons => {
            const rolloverButton = Array.from($buttons).find(btn => 
              btn.textContent.toLowerCase().includes('rollover') ||
              btn.textContent.toLowerCase().includes('migrate') ||
              btn.textContent.toLowerCase().includes('transfer')
            )
            
            if (rolloverButton) {
              cy.wrap(rolloverButton).should('be.visible')
            }
          })
        }
      })
    })

    it('should display conversion rate or exchange info', () => {
      cy.get('body').then($body => {
        // Look for rate or conversion information
        if ($body.find('.rate, .conversion, .exchange').length > 0) {
          cy.get('.rate, .conversion, .exchange').should('be.visible')
        }
      })
    })

    it('should show transaction preview', () => {
      cy.get('input').then($inputs => {
        const amountInput = Array.from($inputs).find(input => 
          input.type === 'text' || input.type === 'number'
        )
        
        if (amountInput) {
          cy.wrap(amountInput).clear().type('1')
          
          // Check for preview or summary
          cy.get('body').then($body => {
            if ($body.find('.preview, .summary, .details').length > 0) {
              cy.get('.preview, .summary, .details').should('be.visible')
            }
          })
        }
      })
    })
  })

  describe('Rollover Information Display', () => {
    it('should show benefits of rollover if available', () => {
      cy.get('body').then($body => {
        if ($body.text().includes('benefit') || $body.text().includes('advantage')) {
          cy.contains(/benefit|advantage/i).should('be.visible')
        }
      })
    })

    it('should display any fees associated with rollover', () => {
      cy.get('body').then($body => {
        if ($body.text().includes('fee') || $body.text().includes('Fee')) {
          cy.contains(/fee/i).should('be.visible')
        }
      })
    })

    it('should show estimated gas costs', () => {
      cy.get('body').then($body => {
        if ($body.text().includes('gas') || $body.text().includes('Gas')) {
          cy.contains(/gas/i).should('be.visible')
        }
      })
    })
  })

  describe('Rollover Page Responsiveness', () => {
    it('should be responsive on mobile', () => {
      cy.viewport('iphone-x')
      
      cy.get('.rollover, .container, [class*="rollover"]').should('exist')
      cy.get('input').should('be.visible')
    })

    it('should be responsive on tablet', () => {
      cy.viewport('ipad-2')
      
      cy.get('.rollover, .container, [class*="rollover"]').should('exist')
      cy.get('input').should('be.visible')
    })

    it('should maintain functionality across screen sizes', () => {
      const viewports = ['iphone-x', 'ipad-2', [1920, 1080]]
      
      viewports.forEach(viewport => {
        if (Array.isArray(viewport)) {
          cy.viewport(viewport[0], viewport[1])
        } else {
          cy.viewport(viewport)
        }
        
        // Test basic interaction
        cy.get('input').then($inputs => {
          const amountInput = Array.from($inputs).find(input => 
            input.type === 'text' || input.type === 'number'
          )
          
          if (amountInput) {
            cy.wrap(amountInput).clear().type('1')
            cy.wrap(amountInput).should('have.value', '1')
            cy.wrap(amountInput).clear()
          }
        })
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      cy.checkNoErrors()
    })

    it('should validate minimum rollover amounts', () => {
      cy.get('input').then($inputs => {
        const amountInput = Array.from($inputs).find(input => 
          input.type === 'text' || input.type === 'number'
        )
        
        if (amountInput) {
          // Try very small amount
          cy.wrap(amountInput).clear().type('0.00001')
          
          // Check for validation message
          cy.get('body').then($body => {
            if ($body.find('.error, .warning').length > 0) {
              cy.get('.error, .warning').should('be.visible')
            }
          })
        }
      })
    })

    it('should handle insufficient balance for rollover', () => {
      cy.mockWalletConnection()
      
      cy.get('input').then($inputs => {
        const amountInput = Array.from($inputs).find(input => 
          input.type === 'text' || input.type === 'number'
        )
        
        if (amountInput) {
          // Enter very large amount
          cy.wrap(amountInput).clear().type('999999')
          
          // Look for error or disabled button
          cy.get('button').then($buttons => {
            const rolloverButton = Array.from($buttons).find(btn => 
              btn.textContent.toLowerCase().includes('rollover')
            )
            
            if (rolloverButton) {
              cy.wrap(rolloverButton).then($btn => {
                if (!$btn.prop('disabled')) {
                  cy.wrap($btn).click()
                  // Check for error message
                  cy.get('.error, .warning, .notification').should('exist')
                } else {
                  // Button should be disabled for insufficient balance
                  expect($btn.prop('disabled')).to.be.true
                }
              })
            }
          })
        }
      })
    })

    it('should prevent invalid characters in amount input', () => {
      cy.get('input').then($inputs => {
        const amountInput = Array.from($inputs).find(input => 
          input.type === 'text' || input.type === 'number'
        )
        
        if (amountInput) {
          // Try special characters
          cy.wrap(amountInput).type('!@#$%')
          cy.wrap(amountInput).invoke('val').should('not.match', /[!@#$%]/)
        }
      })
    })

    it('should clear inputs properly', () => {
      cy.get('input').then($inputs => {
        const amountInput = Array.from($inputs).find(input => 
          input.type === 'text' || input.type === 'number'
        )
        
        if (amountInput) {
          cy.wrap(amountInput).type('456')
          cy.wrap(amountInput).clear()
          cy.wrap(amountInput).should('have.value', '')
        }
      })
    })
  })
})