# SharedStake UI Testing

This directory contains automated UI tests for the SharedStake application using Playwright.

## Overview

The test suite includes:
- **Blog Tests**: Testing blog listing and individual blog post pages
- **Main App Tests**: Testing core application pages (Landing, Stake, Earn, etc.)
- **Visual Regression Tests**: Screenshot comparisons to catch UI/UX changes
- **Cross-browser Testing**: Tests run on Chromium, Firefox, and WebKit
- **Mobile Testing**: Responsive design testing on mobile viewports

## Test Structure

```
tests/
├── blog/
│   ├── blog.spec.js           # Blog listing page tests
│   └── blog-post.spec.js      # Individual blog post tests
├── main-app/
│   ├── landing.spec.js        # Landing page tests
│   ├── stake.spec.js          # Stake page tests
│   └── earn.spec.js           # Earn page tests
├── utils/
│   └── test-helpers.js        # Common test utilities
├── visual-regression.spec.js  # Visual regression tests
└── README.md                  # This file
```

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   bun install
   ```

2. Install Playwright browsers:
   ```bash
   bun run test:install
   ```

### Test Commands

```bash
# Run all tests
bun test

# Run tests with UI (interactive mode)
bun run test:ui

# Run tests in headed mode (see browser)
bun run test:headed

# Run tests in debug mode
bun run test:debug

# Run specific test suites
bun run test:blog        # Blog tests only
bun run test:main-app    # Main app tests only
bun run test:visual      # Visual regression tests only

# View test report
bun run test:report
```

### Development Server

Tests automatically start the development server on `http://localhost:8080`. Make sure port 8080 is available.

## Test Categories

### 1. Blog Tests (`tests/blog/`)

**blog.spec.js**:
- Blog page loading and navigation
- Featured posts display
- Post filtering by category
- Responsive design
- SEO meta tags

**blog-post.spec.js**:
- Individual blog post loading
- Post content display
- Breadcrumb navigation
- Related posts
- Social sharing
- 404 handling

### 2. Main App Tests (`tests/main-app/`)

**landing.spec.js**:
- Hero section display
- Action buttons functionality
- Social links
- Navigation menu
- Responsive design
- SEO optimization

**stake.spec.js**:
- Stake interface display
- Web3 connection handling
- Form validation
- Balance information
- Transaction status

**earn.spec.js**:
- Earning opportunities display
- Claim functionality
- Airdrop information
- Geyser integration
- Migration options

### 3. Visual Regression Tests

**visual-regression.spec.js**:
- Full-page screenshots for all major pages
- Mobile and desktop viewport testing
- Component-level visual testing
- Cross-browser visual consistency

## Test Utilities

### test-helpers.js

Common utilities for all tests:

- `waitForVueApp()`: Wait for Vue.js application to be ready
- `waitForWeb3Ready()`: Wait for Web3 connection
- `takeScreenshot()`: Take consistent screenshots
- `isElementVisible()`: Check element visibility
- `mockWeb3Provider()`: Mock Web3 for testing
- `SELECTORS`: Common CSS selectors
- `TEST_DATA`: Test data constants

## Configuration

### Playwright Configuration (`playwright.config.js`)

- **Browsers**: Chromium, Firefox, WebKit
- **Mobile Testing**: Pixel 5, iPhone 12
- **Base URL**: `http://localhost:8080`
- **Timeouts**: 30s global, 5s assertions
- **Screenshots**: On failure
- **Videos**: On failure
- **Traces**: On retry

### CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**GitHub Actions Workflow** (`.github/workflows/ui-tests.yml`):
- Runs on Ubuntu latest
- Installs dependencies and Playwright browsers
- Builds application
- Runs all test suites
- Uploads test results and screenshots
- Comments on PRs with test results

## Best Practices

### Writing Tests

1. **Use descriptive test names**: Clearly describe what is being tested
2. **Test user workflows**: Focus on actual user interactions
3. **Handle async operations**: Use proper waits for Vue.js and Web3
4. **Mock external dependencies**: Use `mockWeb3Provider()` for Web3 tests
5. **Take screenshots**: Use `takeScreenshot()` for debugging

### Test Data

- Use `TEST_DATA` constants for consistent test data
- Mock external APIs when possible
- Use realistic but safe test values

### Selectors

- Use semantic selectors from `SELECTORS` object
- Prefer data attributes over CSS classes
- Use text content when appropriate
- Avoid brittle selectors

## Debugging Tests

### Local Debugging

1. **Run in headed mode**:
   ```bash
   bun run test:headed
   ```

2. **Use debug mode**:
   ```bash
   bun run test:debug
   ```

3. **Run specific test**:
   ```bash
   bunx playwright test tests/blog/blog.spec.js --headed
   ```

### CI Debugging

1. **Check test artifacts**: Download screenshots and videos from CI
2. **View test report**: Access HTML report from CI artifacts
3. **Check console logs**: Look for JavaScript errors in test output

## Maintenance

### Updating Tests

1. **When adding new pages**: Add corresponding test files
2. **When changing UI**: Update visual regression baselines
3. **When changing functionality**: Update relevant test cases

### Visual Regression Updates

When UI changes are intentional:

1. Run visual tests locally
2. Review differences
3. Update baseline images:
   ```bash
   bunx playwright test tests/visual-regression.spec.js --update-snapshots
   ```

### Performance

- Tests run in parallel by default
- Use `workers: 1` in CI for stability
- Consider test execution time when adding new tests

## Troubleshooting

### Common Issues

1. **Port 8080 in use**: Kill existing processes or change port
2. **Browser installation fails**: Run `npm run test:install`
3. **Tests timeout**: Increase timeout in config or add proper waits
4. **Visual tests fail**: Check for intentional UI changes

### Getting Help

1. Check Playwright documentation: https://playwright.dev/
2. Review test logs and screenshots
3. Run tests locally to reproduce issues
4. Check CI artifacts for detailed error information

## Contributing

When adding new tests:

1. Follow existing test structure
2. Use test utilities from `test-helpers.js`
3. Add appropriate test categories
4. Update this README if needed
5. Ensure tests pass in CI

## Test Coverage

Current test coverage includes:

- ✅ Landing page functionality and visual
- ✅ Blog listing and post pages
- ✅ Stake page interface
- ✅ Earn page functionality
- ✅ Navigation and routing
- ✅ Responsive design
- ✅ SEO meta tags
- ✅ Web3 integration (mocked)
- ✅ Visual regression testing
- ✅ Cross-browser compatibility
- ✅ Mobile responsiveness

Areas for future expansion:
- 🔄 Withdraw page tests
- 🔄 Wrap/Unwrap functionality
- 🔄 FAQ page tests
- 🔄 Privacy/Terms pages
- 🔄 Error handling scenarios
- 🔄 Performance testing