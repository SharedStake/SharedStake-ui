import { test, expect } from '@playwright/test'

test.describe('SharedStake UI E2E Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check if the page title is correct
    await expect(page).toHaveTitle(/SharedStake/)
    
    // Check if the main content is visible
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('should have responsive design', async ({ page }) => {
    await page.goto('/')
    
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.locator('body')).toBeVisible()
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('body')).toBeVisible()
  })

  test('should handle navigation', async ({ page }) => {
    await page.goto('/')
    
    // Look for navigation elements (adjust selectors based on actual implementation)
    const navigation = page.locator('nav, .navigation, .navbar')
    if (await navigation.count() > 0) {
      await expect(navigation.first()).toBeVisible()
    }
  })
})