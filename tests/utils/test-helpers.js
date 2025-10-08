/**
 * Test helper utilities for SharedStake UI tests
 */

/**
 * Wait for Vue.js application to be ready
 * @param {import('@playwright/test').Page} page 
 */
async function waitForVueApp(page) {
  // Wait for Vue app to be mounted
  await page.waitForFunction(() => {
    return window.Vue && document.querySelector('#app');
  }, { timeout: 10000 });
  
  // Wait for any loading states to complete
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for Web3 connection to be ready (if applicable)
 * @param {import('@playwright/test').Page} page 
 */
async function waitForWeb3Ready(page) {
  try {
    await page.waitForFunction(() => {
      return window.ethereum || window.web3;
    }, { timeout: 5000 });
  } catch (error) {
    // Web3 not available, continue with tests
    console.log('Web3 not available, continuing without it');
  }
}

/**
 * Take a screenshot with consistent naming
 * @param {import('@playwright/test').Page} page 
 * @param {string} name 
 */
async function takeScreenshot(page, name) {
  await page.screenshot({ 
    path: `test-results/screenshots/${name}.png`,
    fullPage: true 
  });
}

/**
 * Check if element is visible and in viewport
 * @param {import('@playwright/test').Page} page 
 * @param {string} selector 
 */
async function isElementVisible(page, selector) {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout: 5000 });
  return await element.isVisible();
}

/**
 * Wait for navigation to complete
 * @param {import('@playwright/test').Page} page 
 * @param {string} url 
 */
async function waitForNavigation(page, url) {
  await page.waitForURL(url, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

/**
 * Check for console errors
 * @param {import('@playwright/test').Page} page 
 */
async function checkForConsoleErrors(page) {
  const errors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  return errors;
}

/**
 * Mock Web3 provider for testing
 * @param {import('@playwright/test').Page} page 
 */
async function mockWeb3Provider(page) {
  await page.addInitScript(() => {
    // Mock Web3 provider
    window.ethereum = {
      isMetaMask: true,
      request: async ({ method, params }) => {
        switch (method) {
          case 'eth_requestAccounts':
            return ['0x1234567890123456789012345678901234567890'];
          case 'eth_accounts':
            return ['0x1234567890123456789012345678901234567890'];
          case 'eth_chainId':
            return '0x1';
          case 'net_version':
            return '1';
          default:
            throw new Error(`Unsupported method: ${method}`);
        }
      },
      on: () => {},
      removeListener: () => {},
    };
  });
}

/**
 * Common selectors for the application
 */
const SELECTORS = {
  // Navigation
  navigation: 'nav, .navigation, [role="navigation"]',
  menuToggle: '[aria-label="Toggle menu"], .menu-toggle, .hamburger',
  
  // Main content areas
  mainContent: 'main, .main-content, #app',
  hero: '.hero, .hero-section, [class*="hero"]',
  
  // Blog specific
  blogPost: '.blog-post, .post, [class*="blog-post"]',
  blogCard: '.blog-card, .post-card, [class*="blog-card"]',
  blogTitle: 'h1, h2, .post-title, [class*="title"]',
  
  // Buttons and interactive elements
  button: 'button, .btn, [role="button"]',
  link: 'a, .link, [role="link"]',
  
  // Forms
  input: 'input, textarea, select',
  form: 'form',
  
  // Loading states
  loading: '.loading, .spinner, [class*="loading"]',
  
  // Notifications
  notification: '.notification, .alert, .toast, [class*="notification"]',
};

/**
 * Common test data
 */
const TEST_DATA = {
  validEmail: 'test@example.com',
  testAddress: '0x1234567890123456789012345678901234567890',
  testAmount: '1.0',
};

module.exports = {
  waitForVueApp,
  waitForWeb3Ready,
  takeScreenshot,
  isElementVisible,
  waitForNavigation,
  checkForConsoleErrors,
  mockWeb3Provider,
  SELECTORS,
  TEST_DATA,
};