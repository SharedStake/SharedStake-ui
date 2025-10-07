describe('Blog Functionality', () => {
  beforeEach(() => {
    cy.navigateTo('/blog')
  })

  describe('Blog Main Page', () => {
    it('should load the blog page successfully', () => {
      cy.contains('h1', 'SharedStake Blog').should('be.visible')
      cy.contains('Stay updated with the latest developments').should('be.visible')
    })

    it('should display blog posts', () => {
      // Check if at least one blog post is visible
      cy.get('article').should('have.length.greaterThan', 0)
    })

    it('should have working filter tabs', () => {
      // Check if filter buttons exist
      cy.contains('button', 'All Posts').should('be.visible')
      
      // Test filtering by clicking a tag (if exists)
      cy.get('button').then($buttons => {
        const tagButtons = Array.from($buttons).filter(btn => 
          btn.textContent !== 'All Posts' && 
          btn.classList.contains('rounded-full')
        )
        
        if (tagButtons.length > 0) {
          const firstTag = tagButtons[0]
          cy.wrap(firstTag).click()
          
          // Check if the button is now active (has brand-primary class)
          cy.wrap(firstTag).should('have.class', 'bg-brand-primary')
        }
      })
    })

    it('should navigate to individual blog posts', () => {
      // Click on the first blog post's "Read More" link
      cy.get('a[href^="/blog/"]').first().then($link => {
        const href = $link.attr('href')
        cy.wrap($link).click()
        
        // Verify navigation
        cy.url().should('include', href)
        
        // Check if blog post content is loaded
        cy.get('article', { timeout: 10000 }).should('be.visible')
      })
    })

    it('should display featured posts if available', () => {
      cy.get('body').then($body => {
        if ($body.find('h2:contains("Featured Posts")').length > 0) {
          cy.contains('h2', 'Featured Posts').should('be.visible')
          cy.get('.bg-brand-primary').contains('Featured').should('exist')
        }
      })
    })

    it('should show post metadata', () => {
      cy.get('article').first().within(() => {
        // Check for date
        cy.get('.text-gray-400').should('exist')
        
        // Check for title
        cy.get('h3, h2').should('exist')
        
        // Check for excerpt
        cy.get('p').should('exist')
      })
    })
  })

  describe('Individual Blog Post', () => {
    it('should load a blog post with proper content', () => {
      // Navigate to the first blog post
      cy.get('a[href^="/blog/"]').first().click()
      
      // Wait for the post to load
      cy.get('article', { timeout: 10000 }).should('be.visible')
      
      // Check for essential elements
      cy.get('h1').should('be.visible') // Post title
      cy.get('.prose').should('exist') // Content area with prose styling
    })

    it('should have a back to blog button', () => {
      cy.get('a[href^="/blog/"]').first().click()
      
      // Look for back navigation
      cy.get('a[href="/blog"]').should('exist')
    })

    it('should display post metadata on individual posts', () => {
      cy.get('a[href^="/blog/"]').first().click()
      
      cy.get('article').within(() => {
        // Check for author or date information
        cy.get('.text-gray-400, .text-sm').should('exist')
      })
    })
  })

  describe('Blog Responsiveness', () => {
    it('should be responsive on mobile devices', () => {
      // Test mobile viewport
      cy.viewport('iphone-x')
      cy.contains('h1', 'SharedStake Blog').should('be.visible')
      cy.get('article').should('be.visible')
      
      // Test tablet viewport
      cy.viewport('ipad-2')
      cy.contains('h1', 'SharedStake Blog').should('be.visible')
      cy.get('article').should('be.visible')
    })

    it('should have proper mobile navigation for blog posts', () => {
      cy.viewport('iphone-x')
      
      // Navigate to a blog post on mobile
      cy.get('a[href^="/blog/"]').first().click()
      cy.get('article').should('be.visible')
      
      // Navigate back
      cy.get('a[href="/blog"]').first().click()
      cy.url().should('include', '/blog')
    })
  })

  describe('Blog Error Handling', () => {
    it('should handle non-existent blog posts gracefully', () => {
      cy.visit('/blog/non-existent-post-12345', { failOnStatusCode: false })
      
      // Should either show 404 or redirect to blog main page
      cy.url().then(url => {
        if (url.includes('non-existent-post')) {
          // Check for error message
          cy.contains(/not found|404|error/i).should('be.visible')
        } else {
          // Redirected to blog main page
          cy.url().should('include', '/blog')
        }
      })
    })
  })

  describe('Blog Performance', () => {
    it('should load blog posts within acceptable time', () => {
      const startTime = Date.now()
      
      cy.get('article').should('be.visible').then(() => {
        const loadTime = Date.now() - startTime
        expect(loadTime).to.be.lessThan(5000) // Should load within 5 seconds
      })
    })

    it('should lazy load images if present', () => {
      cy.get('img').then($images => {
        if ($images.length > 0) {
          // Check if images have lazy loading attributes
          cy.wrap($images).first().should('have.attr', 'loading')
        }
      })
    })
  })
})