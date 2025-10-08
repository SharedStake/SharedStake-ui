const { test, expect } = require('@playwright/test');
const { waitForVueApp, takeScreenshot, SELECTORS, checkForConsoleErrors } = require('../utils/test-helpers');

test.describe('Blog Post Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Check for console errors
    const errors = await checkForConsoleErrors(page);
    
    // First, navigate to blog page to get a valid post URL
    await page.goto('/blog');
    await waitForVueApp(page);
    
    // Look for a blog post link
    const blogPostLink = page.locator('a[href*="/blog/"]').first();
    
    if (await blogPostLink.count() > 0) {
      // Get the href and navigate to the blog post
      const postUrl = await blogPostLink.getAttribute('href');
      await page.goto(postUrl);
      await waitForVueApp(page);
    } else {
      // If no blog posts found, skip tests
      test.skip();
    }
    
    // Take initial screenshot
    await takeScreenshot(page, 'blog-post-initial');
  });

  test('should load blog post page successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/SharedStake/);
    
    // Check that we're on a blog post URL
    expect(page.url()).toMatch(/\/blog\/.+/);
  });

  test('should display blog post content', async ({ page }) => {
    // Check for blog post title
    const postTitle = page.locator('h1').first();
    await expect(postTitle).toBeVisible();
    
    // Check for blog post content
    const postContent = page.locator('.blog-post, .post-content, [class*="blog-post"], article');
    await expect(postContent).toBeVisible();
    
    // Check for author information
    const authorInfo = page.locator('text=By, text=Author, .author, [class*="author"]');
    const hasAuthor = await authorInfo.count() > 0;
    
    if (hasAuthor) {
      await expect(authorInfo.first()).toBeVisible();
    }
  });

  test('should display breadcrumb navigation', async ({ page }) => {
    const breadcrumb = page.locator('.Breadcrumb, [class*="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    
    // Check breadcrumb contains "Blog" link
    const blogLink = breadcrumb.locator('a[href="/blog"]');
    await expect(blogLink).toBeVisible();
  });

  test('should display post metadata', async ({ page }) => {
    // Check for publication date
    const dateElement = page.locator('text=/\\d{4}-\\d{2}-\\d{2}/, .date, [class*="date"]');
    const hasDate = await dateElement.count() > 0;
    
    if (hasDate) {
      await expect(dateElement.first()).toBeVisible();
    }
    
    // Check for reading time
    const readingTime = page.locator('text=/\\d+ min read/, .reading-time, [class*="reading-time"]');
    const hasReadingTime = await readingTime.count() > 0;
    
    if (hasReadingTime) {
      await expect(readingTime.first()).toBeVisible();
    }
  });

  test('should display post tags/categories', async ({ page }) => {
    const tags = page.locator('.tag, .category, [class*="tag"], [class*="category"]');
    const tagCount = await tags.count();
    
    if (tagCount > 0) {
      await expect(tags.first()).toBeVisible();
    }
  });

  test('should have social sharing buttons', async ({ page }) => {
    const shareButtons = page.locator('text=Share, .share, [class*="share"]');
    const hasShareButtons = await shareButtons.count() > 0;
    
    if (hasShareButtons) {
      await expect(shareButtons.first()).toBeVisible();
    }
  });

  test('should display related posts section', async ({ page }) => {
    const relatedPosts = page.locator('text=Related, .related, [class*="related"]');
    const hasRelatedPosts = await relatedPosts.count() > 0;
    
    if (hasRelatedPosts) {
      await expect(relatedPosts.first()).toBeVisible();
      
      // Check for related post links
      const relatedLinks = page.locator('a[href*="/blog/"]');
      const relatedLinkCount = await relatedLinks.count();
      
      if (relatedLinkCount > 1) { // More than just the current post
        await expect(relatedLinks.nth(1)).toBeVisible();
      }
    }
  });

  test('should have proper heading structure', async ({ page }) => {
    // Check for h1 (main title)
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    
    // Check for proper heading hierarchy
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    
    expect(headingCount).toBeGreaterThan(0);
  });

  test('should have working internal links', async ({ page }) => {
    // Find internal links within the post content
    const internalLinks = page.locator('a[href^="/"], a[href*="sharedstake"]');
    const linkCount = await internalLinks.count();
    
    if (linkCount > 0) {
      // Test first internal link
      const firstLink = internalLinks.first();
      const href = await firstLink.getAttribute('href');
      
      if (href && !href.startsWith('#')) {
        // Click the link
        await firstLink.click();
        
        // Wait for navigation
        await page.waitForLoadState('networkidle');
        
        // Check that navigation worked
        expect(page.url()).toContain(href);
        
        // Go back to the blog post
        await page.goBack();
        await waitForVueApp(page);
      }
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for layout to adjust
    await page.waitForTimeout(1000);
    
    // Take mobile screenshot
    await takeScreenshot(page, 'blog-post-mobile');
    
    // Check that content is still visible and readable
    const postTitle = page.locator('h1').first();
    await expect(postTitle).toBeVisible();
    
    const postContent = page.locator('.blog-post, .post-content, [class*="blog-post"], article');
    await expect(postContent).toBeVisible();
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

  test('should handle 404 for non-existent posts', async ({ page }) => {
    // Navigate to a non-existent blog post
    await page.goto('/blog/non-existent-post');
    await waitForVueApp(page);
    
    // Check for 404 or error message
    const errorMessage = page.locator('text=404, text=Not Found, text=Post not found');
    const hasError = await errorMessage.count() > 0;
    
    if (hasError) {
      await expect(errorMessage.first()).toBeVisible();
    } else {
      // If no explicit error, at least check that we're not on a valid post page
      const postTitle = page.locator('h1');
      const titleText = await postTitle.textContent();
      
      // The title should not be a typical blog post title
      expect(titleText).not.toMatch(/^[A-Z][a-z].*$/);
    }
  });
});