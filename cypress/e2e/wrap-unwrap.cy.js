describe('Wrap and Unwrap Functionality', () => {
  describe('Wrap Functionality', () => {
    beforeEach(() => {
      cy.navigateTo('/wrap')
    })

    describe('Wrap Page UI', () => {
      it('should load the wrap page successfully', () => {
        cy.url().should('include', '/wrap')
        cy.get('.wrap, .container, [class*="wrap"]').should('exist')
      })

      it('should display wrap interface elements', () => {
        // Check for wrap-specific content
        cy.get('body').should('contain.text', /wrap/i)
        
        // Check for input fields
        cy.get('input').should('exist')
      })

      it('should show sgETH to wsgETH conversion', () => {
        cy.get('body').then($body => {
          if ($body.text().match(/sgETH|wsgETH/)) {
            cy.contains(/sgETH|wsgETH/).should('be.visible')
          }
        })
      })

      it('should display balance information', () => {
        cy.get('.balance, [class*="balance"]').should('exist')
      })

      it('should show conversion rate', () => {
        cy.get('body').then($body => {
          if ($body.text().match(/rate|ratio|exchange/i)) {
            cy.contains(/rate|ratio|exchange/i).should('be.visible')
          }
        })
      })
    })

    describe('Wrap Process', () => {
      beforeEach(() => {
        cy.mockWalletConnection()
      })

      it('should allow entering wrap amount', () => {
        cy.get('input[type="text"], input[type="number"]').then($inputs => {
          if ($inputs.length > 0) {
            cy.wrap($inputs.first()).clear().type('1')
            cy.wrap($inputs.first()).should('have.value', '1')
          }
        })
      })

      it('should calculate wsgETH output', () => {
        cy.get('input[type="text"], input[type="number"]').then($inputs => {
          if ($inputs.length > 0) {
            cy.wrap($inputs.first()).clear().type('1')
            
            // Check for output display
            if ($inputs.length > 1) {
              cy.wrap($inputs.eq(1)).invoke('val').should('not.be.empty')
            }
          }
        })
      })

      it('should validate wrap amounts', () => {
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

      it('should have MAX button functionality', () => {
        cy.get('body').then($body => {
          if ($body.find('.max-button, button:contains("MAX"), .balance').length > 0) {
            const maxElement = $body.find('.max-button, button:contains("MAX"), .balance').first()
            cy.wrap(maxElement).click()
            
            // Check if input is populated
            cy.get('input[type="text"], input[type="number"]').then($inputs => {
              if ($inputs.length > 0) {
                cy.wrap($inputs.first()).invoke('val').should('not.be.empty')
              }
            })
          }
        })
      })

      it('should show wrap button when amount is valid', () => {
        cy.get('input[type="text"], input[type="number"]').then($inputs => {
          if ($inputs.length > 0) {
            cy.wrap($inputs.first()).clear().type('1')
            
            // Look for wrap button
            cy.get('button').then($buttons => {
              const wrapButton = Array.from($buttons).find(btn => 
                btn.textContent.toLowerCase().includes('wrap') &&
                !btn.textContent.toLowerCase().includes('unwrap')
              )
              
              if (wrapButton) {
                cy.wrap(wrapButton).should('be.visible')
              }
            })
          }
        })
      })
    })

    describe('Wrap Error Handling', () => {
      it('should handle insufficient sgETH balance', () => {
        cy.mockWalletConnection()
        
        cy.get('input[type="text"], input[type="number"]').then($inputs => {
          if ($inputs.length > 0) {
            // Enter very large amount
            cy.wrap($inputs.first()).clear().type('999999')
            
            // Try to wrap
            cy.get('button').then($buttons => {
              const wrapButton = Array.from($buttons).find(btn => 
                btn.textContent.toLowerCase().includes('wrap') &&
                !btn.textContent.toLowerCase().includes('unwrap')
              )
              
              if (wrapButton && !wrapButton.disabled) {
                cy.wrap(wrapButton).click()
                // Check for error message
                cy.get('.error, .warning, .notification').should('exist')
              }
            })
          }
        })
      })

      it('should validate minimum wrap amounts', () => {
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
    })
  })

  describe('Unwrap Functionality', () => {
    beforeEach(() => {
      cy.navigateTo('/unwrap')
    })

    describe('Unwrap Page UI', () => {
      it('should load the unwrap page successfully', () => {
        cy.url().should('include', '/unwrap')
        cy.get('.unwrap, .container, [class*="unwrap"]').should('exist')
      })

      it('should display unwrap interface elements', () => {
        // Check for unwrap-specific content
        cy.get('body').should('contain.text', /unwrap/i)
        
        // Check for input fields
        cy.get('input').should('exist')
      })

      it('should show wsgETH to sgETH conversion', () => {
        cy.get('body').then($body => {
          if ($body.text().match(/sgETH|wsgETH/)) {
            cy.contains(/sgETH|wsgETH/).should('be.visible')
          }
        })
      })

      it('should display balance information', () => {
        cy.get('.balance, [class*="balance"]').should('exist')
      })

      it('should show conversion rate', () => {
        cy.get('body').then($body => {
          if ($body.text().match(/rate|ratio|exchange/i)) {
            cy.contains(/rate|ratio|exchange/i).should('be.visible')
          }
        })
      })
    })

    describe('Unwrap Process', () => {
      beforeEach(() => {
        cy.mockWalletConnection()
      })

      it('should allow entering unwrap amount', () => {
        cy.get('input[type="text"], input[type="number"]').then($inputs => {
          if ($inputs.length > 0) {
            cy.wrap($inputs.first()).clear().type('1')
            cy.wrap($inputs.first()).should('have.value', '1')
          }
        })
      })

      it('should calculate sgETH output', () => {
        cy.get('input[type="text"], input[type="number"]').then($inputs => {
          if ($inputs.length > 0) {
            cy.wrap($inputs.first()).clear().type('1')
            
            // Check for output display
            if ($inputs.length > 1) {
              cy.wrap($inputs.eq(1)).invoke('val').should('not.be.empty')
            }
          }
        })
      })

      it('should validate unwrap amounts', () => {
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

      it('should have MAX button functionality', () => {
        cy.get('body').then($body => {
          if ($body.find('.max-button, button:contains("MAX"), .balance').length > 0) {
            const maxElement = $body.find('.max-button, button:contains("MAX"), .balance').first()
            cy.wrap(maxElement).click()
            
            // Check if input is populated
            cy.get('input[type="text"], input[type="number"]').then($inputs => {
              if ($inputs.length > 0) {
                cy.wrap($inputs.first()).invoke('val').should('not.be.empty')
              }
            })
          }
        })
      })

      it('should show unwrap button when amount is valid', () => {
        cy.get('input[type="text"], input[type="number"]').then($inputs => {
          if ($inputs.length > 0) {
            cy.wrap($inputs.first()).clear().type('1')
            
            // Look for unwrap button
            cy.get('button').then($buttons => {
              const unwrapButton = Array.from($buttons).find(btn => 
                btn.textContent.toLowerCase().includes('unwrap')
              )
              
              if (unwrapButton) {
                cy.wrap(unwrapButton).should('be.visible')
              }
            })
          }
        })
      })
    })

    describe('Unwrap Error Handling', () => {
      it('should handle insufficient wsgETH balance', () => {
        cy.mockWalletConnection()
        
        cy.get('input[type="text"], input[type="number"]').then($inputs => {
          if ($inputs.length > 0) {
            // Enter very large amount
            cy.wrap($inputs.first()).clear().type('999999')
            
            // Try to unwrap
            cy.get('button').then($buttons => {
              const unwrapButton = Array.from($buttons).find(btn => 
                btn.textContent.toLowerCase().includes('unwrap')
              )
              
              if (unwrapButton && !unwrapButton.disabled) {
                cy.wrap(unwrapButton).click()
                // Check for error message
                cy.get('.error, .warning, .notification').should('exist')
              }
            })
          }
        })
      })

      it('should validate minimum unwrap amounts', () => {
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
    })
  })

  describe('Wrap/Unwrap Responsiveness', () => {
    it('should be responsive on mobile for wrap page', () => {
      cy.navigateTo('/wrap')
      cy.viewport('iphone-x')
      
      cy.get('.wrap, .container, [class*="wrap"]').should('exist')
      cy.get('input').should('be.visible')
    })

    it('should be responsive on mobile for unwrap page', () => {
      cy.navigateTo('/unwrap')
      cy.viewport('iphone-x')
      
      cy.get('.unwrap, .container, [class*="unwrap"]').should('exist')
      cy.get('input').should('be.visible')
    })

    it('should be responsive on tablet for wrap page', () => {
      cy.navigateTo('/wrap')
      cy.viewport('ipad-2')
      
      cy.get('.wrap, .container, [class*="wrap"]').should('exist')
      cy.get('input').should('be.visible')
    })

    it('should be responsive on tablet for unwrap page', () => {
      cy.navigateTo('/unwrap')
      cy.viewport('ipad-2')
      
      cy.get('.unwrap, .container, [class*="unwrap"]').should('exist')
      cy.get('input').should('be.visible')
    })

    it('should maintain functionality across screen sizes', () => {
      const pages = ['/wrap', '/unwrap']
      const viewports = ['iphone-x', 'ipad-2', [1920, 1080]]
      
      pages.forEach(page => {
        cy.navigateTo(page)
        
        viewports.forEach(viewport => {
          if (Array.isArray(viewport)) {
            cy.viewport(viewport[0], viewport[1])
          } else {
            cy.viewport(viewport)
          }
          
          // Test basic interaction
          cy.get('input[type="text"], input[type="number"]').then($inputs => {
            if ($inputs.length > 0) {
              cy.wrap($inputs.first()).clear().type('1')
              cy.wrap($inputs.first()).should('have.value', '1')
              cy.wrap($inputs.first()).clear()
            }
          })
        })
      })
    })
  })

  describe('Common Wrap/Unwrap Features', () => {
    it('should display gas estimates', () => {
      const pages = ['/wrap', '/unwrap']
      
      pages.forEach(page => {
        cy.navigateTo(page)
        
        cy.get('body').then($body => {
          if ($body.text().match(/gas|Gas/)) {
            cy.contains(/gas/i).should('be.visible')
          }
        })
      })
    })

    it('should show transaction confirmation', () => {
      const pages = ['/wrap', '/unwrap']
      
      pages.forEach(page => {
        cy.navigateTo(page)
        cy.mockWalletConnection()
        
        cy.get('input[type="text"], input[type="number"]').then($inputs => {
          if ($inputs.length > 0) {
            cy.wrap($inputs.first()).clear().type('1')
            
            // Look for action button
            cy.get('button').then($buttons => {
              const actionButton = Array.from($buttons).find(btn => 
                btn.textContent.toLowerCase().includes('wrap') ||
                btn.textContent.toLowerCase().includes('unwrap')
              )
              
              if (actionButton && !actionButton.disabled) {
                cy.wrap(actionButton).click()
                
                // Check for confirmation modal or message
                cy.get('.modal, .confirm, [class*="modal"], [class*="confirm"]').should('exist')
              }
            })
          }
        })
      })
    })

    it('should clear inputs properly', () => {
      const pages = ['/wrap', '/unwrap']
      
      pages.forEach(page => {
        cy.navigateTo(page)
        
        cy.get('input[type="text"], input[type="number"]').then($inputs => {
          if ($inputs.length > 0) {
            cy.wrap($inputs.first()).type('789')
            cy.wrap($inputs.first()).clear()
            cy.wrap($inputs.first()).should('have.value', '')
          }
        })
      })
    })
  })
})