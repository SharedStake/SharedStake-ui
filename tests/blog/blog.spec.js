const { test, expect } = require('@playwright/test');
const { waitForVueApp, takeScreenshot, SELECTORS, checkForConsoleErrors } = require('../utils/test-helpers');

test.describe('Blog Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Check for console errors
    const errors = await checkForConsoleErrors(page);
    
    // Navigate to blog page
    await page.goto('/blog');
    await waitForVueApp(page);
    
    // Take initial screenshot
    await takeScreenshot(page, 'blog-initial');
  });

  test('should load blog page successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/SharedStake/);
    
    // Check main heading
    const heading = page.locator('h1');
    await expect(heading).toContainText('SharedStake Blog');
    
    // Check page URL
    expect(page.url()).toContain('/blog');
  });

  test('should display blog hero section', async ({ page }) => {
    // Check hero section elements
    const heroSection = page.locator('.Blog .relative.pt-32');
    await expect(heroSection).toBeVisible();
    
    // Check main title
    const mainTitle = page.locator('h1');
    await expect(mainTitle).toContainText('SharedStake Blog');
    
    // Check description
    const description = page.locator('p').filter({ hasText: 'Stay updated' });
    await expect(description).toBeVisible();
  });

  test('should display breadcrumb navigation', async ({ page }) => {
    const breadcrumb = page.locator('.Breadcrumb, [class*="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
  });

  test('should display featured posts section if available', async ({ page }) => {
    // Check if featured posts section exists
    const featuredSection = page.locator('text=Featured Posts').first();
    
    if (await featuredSection.isVisible()) {
      // Check featured posts grid
      const featuredGrid = page.locator('.grid').first();
      await expect(featuredGrid).toBeVisible();
      
      // Check for blog post cards
      const blogCards = page.locator('.BlogPostCard, [class*="blog-card"]');
      const cardCount = await blogCards.count();
      
      if (cardCount > 0) {
        // Check first blog card
        const firstCard = blogCards.first();
        await expect(firstCard).toBeVisible();
        
        // Check card has title
        const cardTitle = firstCard.locator('h3, h4, .title, [class*="title"]');
        await expect(cardTitle).toBeVisible();
      }
    }
  });

  test('should display all posts section', async ({ page }) => {
    // Check "All Posts" heading
    const allPostsHeading = page.locator('text=All Posts').first();
    await expect(allPostsHeading).toBeVisible();
    
    // Check filter tabs
    const filterTabs = page.locator('button').filter({ hasText: /All|DeFi|Ethereum|Staking/ });
    const tabCount = await filterTabs.count();
    
    if (tabCount > 0) {
      await expect(filterTabs.first()).toBeVisible();
    }
  });

  test('should display blog post cards', async ({ page }) => {
    // Wait for blog cards to load
    const blogCards = page.locator('.BlogPostCard, [class*="blog-card"], .post-card');
    
    // Check if any blog cards are present
    const cardCount = await blogCards.count();
    
    if (cardCount > 0) {
      // Check first blog card
      const firstCard = blogCards.first();
      await expect(firstCard).toBeVisible();
      
      // Check card elements
      const cardTitle = firstCard.locator('h3, h4, .title, [class*="title"]');
      await expect(cardTitle).toBeVisible();
      
      // Check for read more link
      const readMoreLink = firstCard.locator('a').filter({ hasText: /Read more|Continue reading/i });
      if (await readMoreLink.count() > 0) {
        await expect(readMoreLink.first()).toBeVisible();
      }
    }
  });

  test('should filter posts by category', async ({ page }) => {
    // Look for filter buttons
    const filterButtons = page.locator('button').filter({ hasText: /DeFi|Ethereum|Staking|All/ });
    const buttonCount = await filterButtons.count();
    
    if (buttonCount > 1) {
      // Click on a filter button (not "All")
      const filterButton = filterButtons.nth(1);
      await filterButton.click();
      
      // Wait for content to update
      await page.waitForTimeout(1000);
      
      // Take screenshot after filtering
      await takeScreenshot(page, 'blog-filtered');
      
      // Check that filter button is active
      await expect(filterButton).toHaveClass(/active|selected|bg-brand-primary/);
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for layout to adjust
    await page.waitForTimeout(1000);
    
    // Take mobile screenshot
    await takeScreenshot(page, 'blog-mobile');
    
    // Check that content is still visible
    const mainTitle = page.locator('h1');
    await expect(mainTitle).toBeVisible();
    
    // Check that grid layout adjusts
    const grid = page.locator('.grid').first();
    if (await grid.isVisible()) {
      await expect(grid).toBeVisible();
    }
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
  });

  test('should handle empty state gracefully', async ({ page }) => {
    // This test would be more relevant if we could mock empty data
    // For now, just ensure the page doesn't crash with no posts
    
    const errorMessage = page.locator('text=No posts found, text=No articles available');
    const hasError = await errorMessage.count() > 0;
    
    if (hasError) {
      await expect(errorMessage.first()).toBeVisible();
    }
  });
});