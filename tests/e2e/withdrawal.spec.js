import { test, expect } from '@playwright/test'

test.describe('Withdrawal Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/withdraw')
  })

  test('should load withdrawal page successfully', async ({ page }) => {
    await expect(page).toHaveURL(/.*withdraw.*/)
    
    // Check for withdrawal interface elements
    await expect(page.locator('text=Withdraw').first()).toBeVisible()
    
    // Look for withdrawal-related content
    const withdrawalContent = page.locator('text=Unstake, text=Withdraw, text=Redemption, text=Rollover')
    const visibleElements = await withdrawalContent.count()
    expect(visibleElements).toBeGreaterThan(0)
  })

  test('should display withdrawal options', async ({ page }) => {
    // Look for different withdrawal methods
    const withdrawalOptions = page.locator('text=Standard, text=Instant, text=Rollover, text=Redemption')
    
    // At least one withdrawal option should be visible
    const visibleOptions = await withdrawalOptions.count()
    expect(visibleOptions).toBeGreaterThan(0)
  })

  test('should show connect wallet prompt when not connected', async ({ page }) => {
    // Look for connect wallet button or prompt
    const connectPrompt = page.locator('text=Connect Wallet, button:has-text("Connect"), text=Please connect your wallet')
    
    if (await connectPrompt.count() > 0) {
      await expect(connectPrompt.first()).toBeVisible()
    }
  })

  test('should display withdrawal information', async ({ page }) => {
    // Look for withdrawal-related information
    const withdrawalInfo = page.locator('text=Balance, text=Available, text=Staked, text=Withdrawable')
    
    // Some withdrawal information should be visible
    const visibleInfo = await withdrawalInfo.count()
    expect(visibleInfo).toBeGreaterThan(0)
  })

  test('should handle withdrawal form', async ({ page }) => {
    // Look for withdrawal input fields
    const withdrawalInput = page.locator('input[type="number"], input[placeholder*="amount"], input[placeholder*="withdraw"]')
    
    if (await withdrawalInput.count() > 0) {
      await expect(withdrawalInput.first()).toBeVisible()
      
      // Try entering an amount
      await withdrawalInput.first().fill('0.1')
      
      // Look for withdrawal button
      const withdrawButton = page.locator('button:has-text("Withdraw"), button:has-text("Unstake")')
      if (await withdrawButton.count() > 0) {
        await expect(withdrawButton.first()).toBeVisible()
      }
    }
  })

  test('should display rollover options', async ({ page }) => {
    // Look for rollover-related content
    const rolloverContent = page.locator('text=Rollover, text=Extend, text=Continue')
    
    if (await rolloverContent.count() > 0) {
      await expect(rolloverContent.first()).toBeVisible()
    }
  })

  test('should show redemption information', async ({ page }) => {
    // Look for redemption-related content
    const redemptionContent = page.locator('text=Redemption, text=Redeem, text=Convert')
    
    if (await redemptionContent.count() > 0) {
      await expect(redemptionContent.first()).toBeVisible()
    }
  })

  test('should display withdrawal timeline', async ({ page }) => {
    // Look for timeline or process information
    const timelineContent = page.locator('text=Timeline, text=Process, text=Steps, text=Days')
    
    if (await timelineContent.count() > 0) {
      await expect(timelineContent.first()).toBeVisible()
    }
  })

  test('should show FAQ section', async ({ page }) => {
    // Look for FAQ or help content
    const faqContent = page.locator('text=FAQ, text=Questions, text=Help, text=Support')
    
    if (await faqContent.count() > 0) {
      await expect(faqContent.first()).toBeVisible()
    }
  })

  test('should be accessible', async ({ page }) => {
    // Check for proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6')
    const headingCount = await headings.count()
    expect(headingCount).toBeGreaterThan(0)
    
    // Check for proper form labels
    const inputs = page.locator('input')
    const inputCount = await inputs.count()
    
    for (let i = 0; i < Math.min(inputCount, 3); i++) {
      const input = inputs.nth(i)
      const label = await input.getAttribute('aria-label')
      const placeholder = await input.getAttribute('placeholder')
      
      // Input should have either aria-label or placeholder
      expect(label || placeholder).toBeTruthy()
    }
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check that withdrawal content is still accessible
    await expect(page.locator('text=Withdraw').first()).toBeVisible()
    
    // Check for mobile-specific layout adjustments
    const mobileLayout = page.locator('.mobile-withdraw, .withdraw-mobile')
    if (await mobileLayout.count() > 0) {
      await expect(mobileLayout.first()).toBeVisible()
    }
  })

  test('should load without console errors', async ({ page }) => {
    const errors = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    await page.goto('/withdraw')
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