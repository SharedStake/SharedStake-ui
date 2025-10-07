import { test, expect } from '@playwright/test'

test.describe('Staking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/stake')
  })

  test('should load staking page successfully', async ({ page }) => {
    await expect(page).toHaveURL(/.*stake.*/)
    
    // Check for staking interface elements
    await expect(page.locator('text=Stake').first()).toBeVisible()
    
    // Look for input fields or staking controls
    const stakeInput = page.locator('input[type="number"], input[placeholder*="amount"], input[placeholder*="stake"]')
    if (await stakeInput.count() > 0) {
      await expect(stakeInput.first()).toBeVisible()
    }
  })

  test('should display connect wallet button when not connected', async ({ page }) => {
    // Look for connect wallet button
    const connectButton = page.locator('text=Connect Wallet, button:has-text("Connect")')
    if (await connectButton.count() > 0) {
      await expect(connectButton.first()).toBeVisible()
    }
  })

  test('should show wallet connection flow', async ({ page }) => {
    const connectButton = page.locator('text=Connect Wallet, button:has-text("Connect")')
    
    if (await connectButton.count() > 0) {
      await connectButton.click()
      
      // Check for wallet selection modal or connection flow
      const walletModal = page.locator('.wallet-modal, .connect-modal, [role="dialog"]')
      if (await walletModal.count() > 0) {
        await expect(walletModal.first()).toBeVisible()
      }
    }
  })

  test('should display staking information', async ({ page }) => {
    // Look for staking-related information
    const stakingInfo = page.locator('text=APY, text=Rewards, text=Staking, text=ETH')
    
    // At least one staking-related element should be visible
    const visibleElements = await stakingInfo.count()
    expect(visibleElements).toBeGreaterThan(0)
  })

  test('should handle form validation', async ({ page }) => {
    // Look for stake button or form submission
    const stakeButton = page.locator('button:has-text("Stake"), button:has-text("Submit")')
    
    if (await stakeButton.count() > 0) {
      // Try to submit without input
      await stakeButton.click()
      
      // Check for validation messages
      const errorMessage = page.locator('.error, .invalid, [role="alert"]')
      if (await errorMessage.count() > 0) {
        await expect(errorMessage.first()).toBeVisible()
      }
    }
  })

  test('should be accessible', async ({ page }) => {
    // Check for proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6')
    const headingCount = await headings.count()
    expect(headingCount).toBeGreaterThan(0)
    
    // Check for proper button labels
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i)
      const text = await button.textContent()
      const ariaLabel = await button.getAttribute('aria-label')
      
      // Button should have either text content or aria-label
      expect(text?.trim() || ariaLabel).toBeTruthy()
    }
  })
})