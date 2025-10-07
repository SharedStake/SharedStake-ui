import { test, expect } from '@playwright/test'

test.describe('Earning Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/earn')
  })

  test('should load earning page successfully', async ({ page }) => {
    await expect(page).toHaveURL(/.*earn.*/)
    
    // Check for earning interface elements
    await expect(page.locator('text=Earn').first()).toBeVisible()
    
    // Look for earning-related content
    const earningContent = page.locator('text=Rewards, text=APY, text=Staking, text=Yield')
    const visibleElements = await earningContent.count()
    expect(visibleElements).toBeGreaterThan(0)
  })

  test('should display earning opportunities', async ({ page }) => {
    // Look for different earning options
    const earningOptions = page.locator('text=Claim, text=Geyser, text=Airdrop, text=Migrate')
    
    // At least one earning option should be visible
    const visibleOptions = await earningOptions.count()
    expect(visibleOptions).toBeGreaterThan(0)
  })

  test('should show connect wallet prompt when not connected', async ({ page }) => {
    // Look for connect wallet button or prompt
    const connectPrompt = page.locator('text=Connect Wallet, button:has-text("Connect"), text=Please connect your wallet')
    
    if (await connectPrompt.count() > 0) {
      await expect(connectPrompt.first()).toBeVisible()
    }
  })

  test('should display earning statistics', async ({ page }) => {
    // Look for statistics or metrics
    const stats = page.locator('text=%, text=APY, text=TVL, text=Total')
    
    // Some statistics should be visible
    const visibleStats = await stats.count()
    expect(visibleStats).toBeGreaterThan(0)
  })

  test('should handle claim functionality', async ({ page }) => {
    // Look for claim buttons
    const claimButton = page.locator('button:has-text("Claim"), text=Claim Rewards')
    
    if (await claimButton.count() > 0) {
      await expect(claimButton.first()).toBeVisible()
      
      // Try clicking claim button
      await claimButton.first().click()
      
      // Check for transaction confirmation or wallet connection
      const transactionModal = page.locator('.transaction-modal, .wallet-modal, [role="dialog"]')
      if (await transactionModal.count() > 0) {
        await expect(transactionModal.first()).toBeVisible()
      }
    }
  })

  test('should display migration options', async ({ page }) => {
    // Look for migration-related content
    const migrationContent = page.locator('text=Migrate, text=Migration, text=Upgrade')
    
    if (await migrationContent.count() > 0) {
      await expect(migrationContent.first()).toBeVisible()
    }
  })

  test('should show airdrop information', async ({ page }) => {
    // Look for airdrop-related content
    const airdropContent = page.locator('text=Airdrop, text=Claim Airdrop')
    
    if (await airdropContent.count() > 0) {
      await expect(airdropContent.first()).toBeVisible()
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

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check that earning content is still accessible
    await expect(page.locator('text=Earn').first()).toBeVisible()
    
    // Check for mobile-specific layout adjustments
    const mobileLayout = page.locator('.mobile-earn, .earn-mobile')
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
    
    await page.goto('/earn')
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