import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load the landing page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/SharedStake/)
    
    // Check for main navigation elements
    await expect(page.locator('nav')).toBeVisible()
    
    // Check for main content sections
    await expect(page.locator('main, .main-content, #app')).toBeVisible()
  })

  test('should display navigation menu', async ({ page }) => {
    // Check for navigation items
    const navItems = ['Stake', 'Earn', 'Withdraw', 'Learn']
    
    for (const item of navItems) {
      await expect(page.locator(`text=${item}`).first()).toBeVisible()
    }
  })

  test('should have working navigation links', async ({ page }) => {
    // Test navigation to different sections
    const stakeLink = page.locator('a[href*="stake"], text=Stake').first()
    if (await stakeLink.isVisible()) {
      await stakeLink.click()
      await expect(page).toHaveURL(/.*stake.*/)
    }
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check that navigation is still accessible
    await expect(page.locator('nav')).toBeVisible()
    
    // Check for mobile-specific elements or behaviors
    const mobileMenu = page.locator('.mobile-menu, .hamburger, [aria-label*="menu"]')
    if (await mobileMenu.count() > 0) {
      await expect(mobileMenu.first()).toBeVisible()
    }
  })

  test('should load without console errors', async ({ page }) => {
    const errors = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('net::ERR_')
    )
    
    expect(criticalErrors).toHaveLength(0)
  })
})