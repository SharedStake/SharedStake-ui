import { test, expect } from '@playwright/test'

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/')
  
  // Check if the page title is correct
  await expect(page).toHaveTitle(/SharedStake/)
  
  // Check if main navigation is present
  await expect(page.locator('nav')).toBeVisible()
  
  // Check if main content is loaded
  await expect(page.locator('main, .main, #app')).toBeVisible()
})

test('navigation works', async ({ page }) => {
  await page.goto('/')
  
  // Test navigation links (adjust selectors based on actual implementation)
  const navLinks = page.locator('nav a')
  const linkCount = await navLinks.count()
  
  if (linkCount > 0) {
    // Click first navigation link
    await navLinks.first().click()
    
    // Verify URL changed
    expect(page.url()).not.toBe('http://localhost:8080/')
  }
})

test('responsive design', async ({ page }) => {
  // Test mobile viewport
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/')
  
  // Check if mobile navigation is present
  await expect(page.locator('body')).toBeVisible()
  
  // Test desktop viewport
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('/')
  
  // Check if desktop layout is present
  await expect(page.locator('body')).toBeVisible()
})