const { test, expect } = require('@playwright/test');
const { waitForVueApp, takeScreenshot, checkForConsoleErrors } = require('./utils/test-helpers');

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Check for console errors
    const errors = await checkForConsoleErrors(page);
  });

  test('landing page visual regression', async ({ page }) => {
    await page.goto('/');
    await waitForVueApp(page);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('landing-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('landing page mobile visual regression', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await waitForVueApp(page);
    
    // Take mobile screenshot
    await expect(page).toHaveScreenshot('landing-page-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('blog page visual regression', async ({ page }) => {
    await page.goto('/blog');
    await waitForVueApp(page);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('blog-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('blog page mobile visual regression', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/blog');
    await waitForVueApp(page);
    
    // Take mobile screenshot
    await expect(page).toHaveScreenshot('blog-page-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('stake page visual regression', async ({ page }) => {
    await page.goto('/stake');
    await waitForVueApp(page);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('stake-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('stake page mobile visual regression', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/stake');
    await waitForVueApp(page);
    
    // Take mobile screenshot
    await expect(page).toHaveScreenshot('stake-page-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('earn page visual regression', async ({ page }) => {
    await page.goto('/earn');
    await waitForVueApp(page);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('earn-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('earn page mobile visual regression', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/earn');
    await waitForVueApp(page);
    
    // Take mobile screenshot
    await expect(page).toHaveScreenshot('earn-page-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('FAQ page visual regression', async ({ page }) => {
    await page.goto('/faq');
    await waitForVueApp(page);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('faq-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('privacy policy page visual regression', async ({ page }) => {
    await page.goto('/privacy');
    await waitForVueApp(page);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('privacy-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('terms of service page visual regression', async ({ page }) => {
    await page.goto('/terms');
    await waitForVueApp(page);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('terms-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('withdraw page visual regression', async ({ page }) => {
    await page.goto('/withdraw');
    await waitForVueApp(page);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('withdraw-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('wrap page visual regression', async ({ page }) => {
    await page.goto('/wrap');
    await waitForVueApp(page);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('wrap-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('unwrap page visual regression', async ({ page }) => {
    await page.goto('/unwrap');
    await waitForVueApp(page);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('unwrap-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('rollover page visual regression', async ({ page }) => {
    await page.goto('/rollover');
    await waitForVueApp(page);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('rollover-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  // Test specific components
  test('navigation component visual regression', async ({ page }) => {
    await page.goto('/');
    await waitForVueApp(page);
    
    // Take screenshot of navigation only
    const navigation = page.locator('nav, .navigation, [role="navigation"]');
    await expect(navigation).toHaveScreenshot('navigation-component.png');
  });

  test('footer component visual regression', async ({ page }) => {
    await page.goto('/');
    await waitForVueApp(page);
    
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    // Take screenshot of footer
    const footer = page.locator('footer, .footer, [role="contentinfo"]');
    if (await footer.count() > 0) {
      await expect(footer).toHaveScreenshot('footer-component.png');
    }
  });

  // Test different screen sizes
  test('tablet viewport visual regression', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await waitForVueApp(page);
    
    await expect(page).toHaveScreenshot('landing-page-tablet.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('large desktop viewport visual regression', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await waitForVueApp(page);
    
    await expect(page).toHaveScreenshot('landing-page-desktop.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});