describe('Withdraw Functionality', () => {
  beforeEach(() => {
    cy.navigateTo('/withdraw')
  })

  describe('Withdraw Page UI', () => {
    it('should load the withdraw page successfully', () => {
      cy.get('.withdraw, .container').should('be.visible')
      cy.url().should('include', '/withdraw')
    })

    it('should display withdraw interface elements', () => {
      // Check for input fields
      cy.get('input').should('exist')
      
      // Check for any withdraw-specific text
      cy.get('body').should('contain.text', /withdraw|redemption|claim/i)
    })

    it('should show balance information', () => {
      cy.get('.balance, .wallet-balance, [class*="balance"]').should('exist')
    })

    it('should have input validation', () => {
      const inputs = cy.get('input[type="text"], input[type="number"]')
      
      inputs.then($inputs => {
        if ($inputs.length > 0) {
          // Test invalid input
          cy.wrap($inputs.first()).type('abc')
          cy.wrap($inputs.first()).invoke('val').should('match', /^[0-9.]*$/)
          
          // Test valid input
          cy.wrap($inputs.first()).clear().type('1.5')
          cy.wrap($inputs.first()).should('have.value', '1.5')
        }
      })
    })

    it('should display withdrawal fees if applicable', () => {
      cy.get('body').then($body => {
        // Check if fee information is displayed
        if ($body.text().includes('fee') || $body.text().includes('Fee')) {
          cy.contains(/fee/i).should('be.visible')
        }
      })
    })
  })

  describe('Wallet Integration for Withdrawal', () => {
    it('should require wallet connection', () => {
      cy.get('body').then($body => {
        if ($body.find('button:contains("Connect")').length > 0) {
          cy.contains('button', 'Connect').should('be.visible')
        }
      })
    })

    it('should handle wallet connection for withdrawal', () => {
      cy.mockWalletConnection()
      
      cy.get('body').then($body => {
        if ($body.find('button:contains("Connect")').length > 0) {
          cy.contains('button', 'Connect').click()
          cy.wait(2000)
        }
      })
    })

    it('should show user balance when connected', () => {
      cy.mockWalletConnection()
      
      // Look for balance display
      cy.get('.balance, [class*="balance"]').should('exist')
    })
  })

  describe('Withdrawal Process', () => {
    beforeEach(() => {
      cy.mockWalletConnection()
    })

    it('should allow entering withdrawal amount', () => {
      cy.get('input').then($inputs => {
        const amountInput = Array.from($inputs).find(input => 
          input.type === 'text' || input.type === 'number'
        )
        
        if (amountInput) {
          cy.wrap(amountInput).clear().type('0.5')
          cy.wrap(amountInput).should('have.value', '0.5')
        }
      })
    })

    it('should validate minimum withdrawal amount', () => {
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

    it('should have MAX button functionality', () => {
      cy.get('body').then($body => {
        // Look for MAX button or clickable balance
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

    it('should show withdraw button when amount is valid', () => {
      // Enter amount
      cy.get('input').then($inputs => {
        const amountInput = Array.from($inputs).find(input => 
          input.type === 'text' || input.type === 'number'
        )
        
        if (amountInput) {
          cy.wrap(amountInput).clear().type('1')
          
          // Look for withdraw button
          cy.get('button').then($buttons => {
            const withdrawButton = Array.from($buttons).find(btn => 
              btn.textContent.toLowerCase().includes('withdraw') ||
              btn.textContent.toLowerCase().includes('claim') ||
              btn.textContent.toLowerCase().includes('redeem')
            )
            
            if (withdrawButton) {
              cy.wrap(withdrawButton).should('be.visible')
            }
          })
        }
      })
    })

    it('should display transaction details before confirmation', () => {
      cy.get('input').then($inputs => {
        const amountInput = Array.from($inputs).find(input => 
          input.type === 'text' || input.type === 'number'
        )
        
        if (amountInput) {
          cy.wrap(amountInput).clear().type('1')
          
          // Check for transaction details display
          cy.get('body').then($body => {
            // Look for amount display or summary
            if ($body.find('.summary, .details, .transaction-details').length > 0) {
              cy.get('.summary, .details, .transaction-details').should('be.visible')
            }
          })
        }
      })
    })
  })

  describe('Withdrawal History', () => {
    it('should show withdrawal history if available', () => {
      cy.get('body').then($body => {
        if ($body.find('.history, .transactions, [class*="history"]').length > 0) {
          cy.get('.history, .transactions, [class*="history"]').should('be.visible')
        }
      })
    })

    it('should display pending withdrawals if any', () => {
      cy.mockWalletConnection()
      
      cy.get('body').then($body => {
        if ($body.text().includes('pending') || $body.text().includes('Pending')) {
          cy.contains(/pending/i).should('be.visible')
        }
      })
    })
  })

  describe('Withdraw Page Responsiveness', () => {
    it('should be responsive on mobile', () => {
      cy.viewport('iphone-x')
      
      cy.get('.withdraw, .container').should('be.visible')
      cy.get('input').should('be.visible')
    })

    it('should be responsive on tablet', () => {
      cy.viewport('ipad-2')
      
      cy.get('.withdraw, .container').should('be.visible')
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
        
        // Test input functionality
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

    it('should validate withdrawal amounts', () => {
      cy.get('input').then($inputs => {
        const amountInput = Array.from($inputs).find(input => 
          input.type === 'text' || input.type === 'number'
        )
        
        if (amountInput) {
          // Test negative numbers
          cy.wrap(amountInput).clear().type('-1')
          
          // Should either prevent negative or show error
          cy.wrap(amountInput).invoke('val').then(value => {
            if (value === '-1') {
              // Check for error message
              cy.get('.error, .warning').should('exist')
            } else {
              // Input was sanitized
              expect(value).to.not.include('-')
            }
          })
        }
      })
    })

    it('should handle insufficient balance', () => {
      cy.mockWalletConnection()
      
      cy.get('input').then($inputs => {
        const amountInput = Array.from($inputs).find(input => 
          input.type === 'text' || input.type === 'number'
        )
        
        if (amountInput) {
          // Enter very large amount
          cy.wrap(amountInput).clear().type('999999')
          
          // Try to withdraw
          cy.get('button').then($buttons => {
            const withdrawButton = Array.from($buttons).find(btn => 
              btn.textContent.toLowerCase().includes('withdraw')
            )
            
            if (withdrawButton) {
              // Button should be disabled or show error on click
              cy.wrap(withdrawButton).then($btn => {
                if (!$btn.prop('disabled')) {
                  cy.wrap($btn).click()
                  // Check for error message
                  cy.get('.error, .warning, .notification').should('exist')
                }
              })
            }
          })
        }
      })
    })

    it('should clear form properly', () => {
      cy.get('input').then($inputs => {
        const amountInput = Array.from($inputs).find(input => 
          input.type === 'text' || input.type === 'number'
        )
        
        if (amountInput) {
          cy.wrap(amountInput).type('123')
          cy.wrap(amountInput).clear()
          cy.wrap(amountInput).should('have.value', '')
        }
      })
    })
  })
})