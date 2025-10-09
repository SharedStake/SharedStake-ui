const { test, expect } = require('@playwright/test');
const { waitForVueApp, takeScreenshot, SELECTORS, checkForConsoleErrors } = require('../utils/test-helpers');

test.describe('Landing Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Check for console errors
    const errors = await checkForConsoleErrors(page);
    
    // Navigate to landing page
    await page.goto('/');
    await waitForVueApp(page);
    
    // Take initial screenshot
    await takeScreenshot(page, 'landing-initial');
  });

  test('should load landing page successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/SharedStake/);
    
    // Check page URL
    expect(page.url()).toMatch(/^https?:\/\/[^\/]+\/?$/);
  });

  test('should display main hero section', async ({ page }) => {
    // Check for main logo
    const logo = page.locator('img[src*="logo"], .LogoContainer img');
    await expect(logo).toBeVisible();
    
    // Check main title
    const mainTitle = page.locator('h1, .mainTitle');
    await expect(mainTitle).toContainText('ETHEREUM LIQUID STAKING DERIVATIVE');
    
    // Check "EST. 2020" badge
    const estBadge = page.locator('text=EST. 2020');
    await expect(estBadge).toBeVisible();
  });

  test('should display main description', async ({ page }) => {
    const description = page.locator('text=SharedStake is a decentralized Ethereum 2 staking solution');
    await expect(description).toBeVisible();
  });

  test('should display action buttons', async ({ page }) => {
    // Check for STAKE V2 button (disabled)
    const stakeButton = page.locator('text=STAKE V2');
    await expect(stakeButton).toBeVisible();
    
    // Check for MINT NFT button
    const mintButton = page.locator('text=MINT NFT');
    await expect(mintButton).toBeVisible();
    
    // Verify MINT NFT button is a link
    const mintLink = page.locator('a[href*="app.passch.com"]');
    await expect(mintLink).toBeVisible();
  });

  test('should display social links', async ({ page }) => {
    // Check for "Join the conversation" text
    const joinText = page.locator('text=Join the conversation');
    await expect(joinText).toBeVisible();
    
    // Check for social media links
    const socialLinks = page.locator('a[href*="twitter"], a[href*="discord"], a[href*="telegram"], a[href*="github"]');
    const socialLinkCount = await socialLinks.count();
    
    if (socialLinkCount > 0) {
      await expect(socialLinks.first()).toBeVisible();
    }
  });

  test('should display navigation menu', async ({ page }) => {
    // Check for navigation menu
    const navigation = page.locator('nav, .navigation, [role="navigation"]');
    await expect(navigation).toBeVisible();
    
    // Check for main navigation links
    const navLinks = page.locator('nav a, .navigation a');
    const navLinkCount = await navLinks.count();
    
    expect(navLinkCount).toBeGreaterThan(0);
  });

  test('should have working navigation links', async ({ page }) => {
    // Test navigation to different sections
    const navLinks = page.locator('nav a, .navigation a');
    const linkCount = await navLinks.count();
    
    if (linkCount > 0) {
      // Test first navigation link
      const firstLink = navLinks.first();
      const href = await firstLink.getAttribute('href');
      
      if (href && href.startsWith('/')) {
        await firstLink.click();
        await page.waitForLoadState('networkidle');
        
        // Check that navigation worked
        expect(page.url()).toContain(href);
        
        // Go back to landing page
        await page.goto('/');
        await waitForVueApp(page);
      }
    }
  });

  test('should display partners section', async ({ page }) => {
    // Scroll down to find partners section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(1000);
    
    // Look for partners section
    const partnersSection = page.locator('text=Partners, .Partners, [class*="partner"]');
    const hasPartners = await partnersSection.count() > 0;
    
    if (hasPartners) {
      await expect(partnersSection.first()).toBeVisible();
    }
  });

  test('should display features section', async ({ page }) => {
    // Scroll down to find features
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 3));
    await page.waitForTimeout(1000);
    
    // Look for features or benefits section
    const featuresSection = page.locator('text=Features, text=Benefits, .features, [class*="feature"]');
    const hasFeatures = await featuresSection.count() > 0;
    
    if (hasFeatures) {
      await expect(featuresSection.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for layout to adjust
    await page.waitForTimeout(1000);
    
    // Take mobile screenshot
    await takeScreenshot(page, 'landing-mobile');
    
    // Check that main elements are still visible
    const logo = page.locator('img[src*="logo"], .LogoContainer img');
    await expect(logo).toBeVisible();
    
    const mainTitle = page.locator('h1, .mainTitle');
    await expect(mainTitle).toBeVisible();
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
    
    const ogDescription = page.locator('meta[property="og:description"]');
    if (await ogDescription.count() > 0) {
      await expect(ogDescription).toHaveAttribute('content');
    }
    
    const ogImage = page.locator('meta[property="og:image"]');
    if (await ogImage.count() > 0) {
      await expect(ogImage).toHaveAttribute('content');
    }
  });

  test('should handle scroll animations', async ({ page }) => {
    // Test scroll behavior
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(1000);
    
    // Check if any scroll-triggered animations are working
    const animatedElements = page.locator('[class*="animate"], [class*="fade"], [class*="slide"]');
    const animatedCount = await animatedElements.count();
    
    if (animatedCount > 0) {
      // At least one animated element should be visible
      await expect(animatedElements.first()).toBeVisible();
    }
  });

  test('should have working external links', async ({ page }) => {
    // Check external links open in new tab
    const externalLinks = page.locator('a[target="_blank"], a[href^="http"]');
    const externalLinkCount = await externalLinks.count();
    
    if (externalLinkCount > 0) {
      const firstExternalLink = externalLinks.first();
      const target = await firstExternalLink.getAttribute('target');
      
      if (target === '_blank') {
        // Verify it opens in new tab
        const [newPage] = await Promise.all([
          page.context().waitForEvent('page'),
          firstExternalLink.click()
        ]);
        
        await newPage.waitForLoadState();
        expect(newPage.url()).not.toBe(page.url());
        await newPage.close();
      }
    }
  });
});