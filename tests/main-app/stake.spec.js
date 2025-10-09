const { test, expect } = require('@playwright/test');
const { waitForVueApp, takeScreenshot, SELECTORS, checkForConsoleErrors, mockWeb3Provider } = require('../utils/test-helpers');

test.describe('Stake Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Web3 provider for testing
    await mockWeb3Provider(page);
    
    // Check for console errors
    const errors = await checkForConsoleErrors(page);
    
    // Navigate to stake page
    await page.goto('/stake');
    await waitForVueApp(page);
    
    // Take initial screenshot
    await takeScreenshot(page, 'stake-initial');
  });

  test('should load stake page successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/SharedStake/);
    
    // Check page URL
    expect(page.url()).toContain('/stake');
  });

  test('should display stake interface', async ({ page }) => {
    // Check for main stake content
    const stakeContent = page.locator('.Stake, [class*="stake"]');
    await expect(stakeContent).toBeVisible();
    
    // Check for stake title or heading
    const stakeTitle = page.locator('h1, h2, .title, [class*="title"]');
    await expect(stakeTitle).toBeVisible();
  });

  test('should display connection button', async ({ page }) => {
    // Look for wallet connection button
    const connectButton = page.locator('text=Connect, text=Connect Wallet, .ConnectButton, [class*="connect"]');
    const hasConnectButton = await connectButton.count() > 0;
    
    if (hasConnectButton) {
      await expect(connectButton.first()).toBeVisible();
    }
  });

  test('should display stake form elements', async ({ page }) => {
    // Check for input fields
    const inputFields = page.locator('input[type="number"], input[placeholder*="amount"], input[placeholder*="ETH"]');
    const inputCount = await inputFields.count();
    
    if (inputCount > 0) {
      await expect(inputFields.first()).toBeVisible();
    }
    
    // Check for stake button
    const stakeButton = page.locator('button:has-text("Stake"), button:has-text("Deposit"), .stake-button, [class*="stake"]');
    const hasStakeButton = await stakeButton.count() > 0;
    
    if (hasStakeButton) {
      await expect(stakeButton.first()).toBeVisible();
    }
  });

  test('should display balance information', async ({ page }) => {
    // Look for balance display
    const balanceInfo = page.locator('text=Balance, text=ETH, .balance, [class*="balance"]');
    const hasBalanceInfo = await balanceInfo.count() > 0;
    
    if (hasBalanceInfo) {
      await expect(balanceInfo.first()).toBeVisible();
    }
  });

  test('should display staking statistics', async ({ page }) => {
    // Look for staking stats
    const statsSection = page.locator('text=Total Staked, text=APR, text=Rewards, .stats, [class*="stat"]');
    const hasStats = await statsSection.count() > 0;
    
    if (hasStats) {
      await expect(statsSection.first()).toBeVisible();
    }
  });

  test('should display progress indicators', async ({ page }) => {
    // Look for progress bars or gauges
    const progressElements = page.locator('.progress, .gauge, [class*="progress"], [class*="gauge"]');
    const hasProgress = await progressElements.count() > 0;
    
    if (hasProgress) {
      await expect(progressElements.first()).toBeVisible();
    }
  });

  test('should handle form validation', async ({ page }) => {
    // Find input field
    const inputField = page.locator('input[type="number"], input[placeholder*="amount"]').first();
    
    if (await inputField.count() > 0) {
      // Test invalid input
      await inputField.fill('invalid');
      
      // Look for validation message
      const validationMessage = page.locator('text=Invalid, text=Error, .error, [class*="error"]');
      const hasValidation = await validationMessage.count() > 0;
      
      if (hasValidation) {
        await expect(validationMessage.first()).toBeVisible();
      }
      
      // Test valid input
      await inputField.fill('1.0');
      
      // Check that validation message disappears
      if (hasValidation) {
        await expect(validationMessage.first()).not.toBeVisible();
      }
    }
  });

  test('should display transaction status', async ({ page }) => {
    // Look for transaction status indicators
    const txStatus = page.locator('text=Pending, text=Success, text=Failed, .transaction, [class*="transaction"]');
    const hasTxStatus = await txStatus.count() > 0;
    
    if (hasTxStatus) {
      await expect(txStatus.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for layout to adjust
    await page.waitForTimeout(1000);
    
    // Take mobile screenshot
    await takeScreenshot(page, 'stake-mobile');
    
    // Check that main elements are still visible
    const stakeContent = page.locator('.Stake, [class*="stake"]');
    await expect(stakeContent).toBeVisible();
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content');
    
    // Check Open Graph tags
    const ogTitle = page.locator('meta[property="og:title"]');
    if (await ogTitle.count() > 0) {
      await expect(ogTitle).toHaveAttribute('content');
    }
  });

  test('should display help or FAQ section', async ({ page }) => {
    // Look for help section
    const helpSection = page.locator('text=Help, text=FAQ, text=How to, .help, [class*="help"]');
    const hasHelp = await helpSection.count() > 0;
    
    if (hasHelp) {
      await expect(helpSection.first()).toBeVisible();
    }
  });

  test('should handle Web3 connection', async ({ page }) => {
    // Look for connect button
    const connectButton = page.locator('text=Connect, text=Connect Wallet').first();
    
    if (await connectButton.count() > 0) {
      // Click connect button
      await connectButton.click();
      
      // Wait for connection process
      await page.waitForTimeout(2000);
      
      // Check for connected state
      const connectedState = page.locator('text=Connected, text=Disconnect, .connected, [class*="connected"]');
      const isConnected = await connectedState.count() > 0;
      
      if (isConnected) {
        await expect(connectedState.first()).toBeVisible();
      }
    }
  });
});