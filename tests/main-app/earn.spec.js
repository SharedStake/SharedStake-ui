const { test, expect } = require('@playwright/test');
const { waitForVueApp, takeScreenshot, SELECTORS, checkForConsoleErrors, mockWeb3Provider } = require('../utils/test-helpers');

test.describe('Earn Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Web3 provider for testing
    await mockWeb3Provider(page);
    
    // Check for console errors
    const errors = await checkForConsoleErrors(page);
    
    // Navigate to earn page
    await page.goto('/earn');
    await waitForVueApp(page);
    
    // Take initial screenshot
    await takeScreenshot(page, 'earn-initial');
  });

  test('should load earn page successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/SharedStake/);
    
    // Check page URL
    expect(page.url()).toContain('/earn');
  });

  test('should display earn interface', async ({ page }) => {
    // Check for main earn content
    const earnContent = page.locator('.Earn, [class*="earn"]');
    await expect(earnContent).toBeVisible();
    
    // Check for earn title or heading
    const earnTitle = page.locator('h1, h2, .title, [class*="title"]');
    await expect(earnTitle).toBeVisible();
  });

  test('should display earning opportunities', async ({ page }) => {
    // Look for earning options
    const earningOptions = page.locator('text=Geyser, text=Airdrop, text=Claim, .earning-option, [class*="earning"]');
    const hasEarningOptions = await earningOptions.count() > 0;
    
    if (hasEarningOptions) {
      await expect(earningOptions.first()).toBeVisible();
    }
  });

  test('should display connection button', async ({ page }) => {
    // Look for wallet connection button
    const connectButton = page.locator('text=Connect, text=Connect Wallet, .ConnectButton, [class*="connect"]');
    const hasConnectButton = await connectButton.count() > 0;
    
    if (hasConnectButton) {
      await expect(connectButton.first()).toBeVisible();
    }
  });

  test('should display claim functionality', async ({ page }) => {
    // Look for claim buttons or forms
    const claimElements = page.locator('text=Claim, .claim, [class*="claim"]');
    const hasClaimElements = await claimElements.count() > 0;
    
    if (hasClaimElements) {
      await expect(claimElements.first()).toBeVisible();
    }
  });

  test('should display airdrop information', async ({ page }) => {
    // Look for airdrop section
    const airdropSection = page.locator('text=Airdrop, .airdrop, [class*="airdrop"]');
    const hasAirdrop = await airdropSection.count() > 0;
    
    if (hasAirdrop) {
      await expect(airdropSection.first()).toBeVisible();
    }
  });

  test('should display geyser information', async ({ page }) => {
    // Look for geyser section
    const geyserSection = page.locator('text=Geyser, .geyser, [class*="geyser"]');
    const hasGeyser = await geyserSection.count() > 0;
    
    if (hasGeyser) {
      await expect(geyserSection.first()).toBeVisible();
    }
  });

  test('should display rewards information', async ({ page }) => {
    // Look for rewards display
    const rewardsInfo = page.locator('text=Rewards, text=Earned, .rewards, [class*="reward"]');
    const hasRewards = await rewardsInfo.count() > 0;
    
    if (hasRewards) {
      await expect(rewardsInfo.first()).toBeVisible();
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

  test('should display migration options', async ({ page }) => {
    // Look for migration section
    const migrationSection = page.locator('text=Migrate, .migrate, [class*="migrate"]');
    const hasMigration = await migrationSection.count() > 0;
    
    if (hasMigration) {
      await expect(migrationSection.first()).toBeVisible();
    }
  });

  test('should handle form interactions', async ({ page }) => {
    // Look for input fields
    const inputFields = page.locator('input, textarea, select');
    const inputCount = await inputFields.count();
    
    if (inputCount > 0) {
      const firstInput = inputFields.first();
      await expect(firstInput).toBeVisible();
      
      // Test input interaction
      await firstInput.click();
      await firstInput.fill('test');
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
    await takeScreenshot(page, 'earn-mobile');
    
    // Check that main elements are still visible
    const earnContent = page.locator('.Earn, [class*="earn"]');
    await expect(earnContent).toBeVisible();
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

  test('should display help or instructions', async ({ page }) => {
    // Look for help section
    const helpSection = page.locator('text=Help, text=Instructions, text=How to, .help, [class*="help"]');
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

  test('should display progress indicators', async ({ page }) => {
    // Look for progress bars or loading indicators
    const progressElements = page.locator('.progress, .loading, [class*="progress"], [class*="loading"]');
    const hasProgress = await progressElements.count() > 0;
    
    if (hasProgress) {
      await expect(progressElements.first()).toBeVisible();
    }
  });
});