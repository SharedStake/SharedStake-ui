# SharedStake QA Testing Documentation

## Overview

This document describes the automated QA testing setup for the SharedStake application, ensuring that blockchain interactions, blog functionality, and other critical features work correctly.

## Test Structure

### 1. Unit Tests (Jest)
- **Location**: `/tests/unit/`
- **Coverage**: 
  - Utility functions (`/utils/`)
  - Vuex store modules
  - Contract interactions
  - Helper functions

### 2. E2E Tests (Cypress)
- **Location**: `/cypress/e2e/`
- **Coverage**:
  - Blog functionality
  - Stake/Unstake operations
  - Withdraw functionality
  - Rollover operations
  - Earn page interactions
  - Wrap/Unwrap functionality

## Running Tests

### Prerequisites
```bash
# Install dependencies
npm install
```

### Unit Tests
```bash
# Run all unit tests
npm run test:unit

# Run with watch mode for development
npm run test:unit:watch

# Run with coverage report
npm run test:unit:coverage
```

### E2E Tests
```bash
# Run all E2E tests (headless)
npm run test:e2e

# Open Cypress Test Runner (interactive)
npm run test:e2e:open

# Run in specific browser
npm run test:e2e:chrome
npm run test:e2e:firefox

# Run specific test file
npx cypress run --spec "cypress/e2e/blog.cy.js"
```

### Full Test Suite
```bash
# Run all tests (lint, unit, and E2E)
npm run test:ci
```

## Test Coverage Areas

### Blog Functionality
- ✅ Blog page loading
- ✅ Post listing and filtering
- ✅ Individual post navigation
- ✅ Featured posts display
- ✅ Responsive design
- ✅ Error handling for missing posts

### Blockchain Interactions

#### Stake/Unstake
- ✅ UI element visibility
- ✅ Input validation
- ✅ Amount calculations
- ✅ Gas price selection
- ✅ Wallet connection flow
- ✅ Balance display
- ✅ MAX button functionality

#### Withdraw
- ✅ Withdrawal interface
- ✅ Amount validation
- ✅ Balance checks
- ✅ Transaction preview
- ✅ Error handling

#### Rollover
- ✅ Rollover process
- ✅ Conversion rate display
- ✅ Amount validation
- ✅ Fee information

#### Earn
- ✅ Pool/Farm display
- ✅ APY/APR information
- ✅ Deposit/Withdraw flows
- ✅ Rewards claiming
- ✅ TVL display

#### Wrap/Unwrap
- ✅ sgETH to wsgETH conversion
- ✅ wsgETH to sgETH conversion
- ✅ Rate calculations
- ✅ Balance validation

## CI/CD Integration

### GitHub Actions Workflow
The project includes a comprehensive GitHub Actions workflow (`.github/workflows/qa-tests.yml`) that runs:

1. **Linting** - Code quality checks
2. **Unit Tests** - With coverage reporting
3. **E2E Tests** - Multi-browser testing (Chrome, Firefox, Edge)
4. **Blockchain Integration Tests** - Specific tests for DeFi functionality
5. **Blog Tests** - Dedicated blog feature testing
6. **Performance Tests** - Lighthouse CI integration
7. **Security Scans** - Vulnerability scanning with Trivy

### Triggers
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Daily scheduled runs at 2 AM UTC

## Writing New Tests

### Unit Test Example
```javascript
// tests/unit/utils/myUtil.spec.js
import { myFunction } from '@/utils/myUtil'

describe('myFunction', () => {
  it('should return expected value', () => {
    const result = myFunction('input')
    expect(result).toBe('expected')
  })
})
```

### E2E Test Example
```javascript
// cypress/e2e/myFeature.cy.js
describe('My Feature', () => {
  beforeEach(() => {
    cy.navigateTo('/my-page')
  })

  it('should display feature correctly', () => {
    cy.get('.my-element').should('be.visible')
    cy.inputAmount('1.5')
    cy.contains('button', 'Submit').click()
    cy.checkNoErrors()
  })
})
```

## Custom Cypress Commands

The following custom commands are available for E2E tests:

- `cy.navigateTo(route)` - Navigate to a route and wait for app
- `cy.mockWalletConnection()` - Mock wallet connection
- `cy.checkWalletConnected()` - Verify wallet is connected
- `cy.inputAmount(amount)` - Input amount in forms
- `cy.checkBalance(expectedText)` - Check balance display
- `cy.selectGasPrice(level)` - Select gas price option
- `cy.checkNoErrors()` - Verify no error messages
- `cy.checkBlogPost(title)` - Check blog post exists
- `cy.testResponsive(sizes)` - Test responsive design

## Environment Variables

### For E2E Tests
Set these in `cypress.config.js` or as environment variables:

```javascript
env: {
  TEST_WALLET_ADDRESS: '0x...',
  NETWORK: 'mainnet',
  SGETH_CONTRACT: '0x...',
  WSGETH_CONTRACT: '0x...',
}
```

### For CI/CD
Configure these as GitHub Secrets:
- `CYPRESS_RECORD_KEY` - For Cypress Dashboard
- `TEST_WALLET_ADDRESS` - Test wallet address
- `SLACK_WEBHOOK` - For notifications (optional)

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase timeout in `cypress.config.js`
   - Check if the app server is running

2. **Wallet connection failures**
   - Ensure mock wallet is properly configured
   - Check for Web3 provider errors

3. **Flaky tests**
   - Add proper waits using `cy.wait()` or custom commands
   - Use retry logic for network-dependent tests

### Debug Mode
```bash
# Run Cypress with debug output
DEBUG=cypress:* npx cypress run

# Run specific test with video recording
npx cypress run --spec "cypress/e2e/stake.cy.js" --headed
```

## Best Practices

1. **Keep tests independent** - Each test should be able to run in isolation
2. **Use data attributes** - Add `data-testid` attributes for reliable element selection
3. **Mock external dependencies** - Mock blockchain calls and API responses
4. **Test critical paths first** - Focus on user-facing functionality
5. **Regular test maintenance** - Update tests when features change

## Reporting

### Coverage Reports
After running `npm run test:unit:coverage`, view the coverage report:
- HTML Report: `coverage/index.html`
- Console Output: Coverage summary in terminal

### Cypress Dashboard
Configure Cypress Dashboard for detailed test analytics and history.

### Test Artifacts
GitHub Actions automatically uploads:
- Cypress screenshots (on failure)
- Cypress videos
- Coverage reports
- Performance metrics

## Contributing

When adding new features:
1. Write unit tests for utility functions
2. Add E2E tests for user interactions
3. Update this documentation
4. Ensure all tests pass before creating PR

## Support

For questions or issues with testing:
1. Check the troubleshooting section
2. Review existing test examples
3. Consult Cypress/Jest documentation
4. Open an issue with the `testing` label