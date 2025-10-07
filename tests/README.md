# SharedStake UI Testing Guide

This directory contains all automated tests for the SharedStake UI application.

## Test Structure

```
tests/
├── setup.js                 # Global test setup and mocks
├── unit/                    # Unit tests
│   ├── App.test.js         # Main app component tests
│   └── components/         # Component-specific tests
│       ├── Common/         # Common component tests
│       └── Blog/           # Blog component tests
└── e2e/                    # End-to-end tests
    ├── landing.spec.js     # Landing page tests
    └── staking.spec.js     # Staking flow tests
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
yarn test

# Run tests in watch mode
yarn test:ui

# Run tests once
yarn test:run

# Run with coverage
yarn test:coverage
```

### End-to-End Tests
```bash
# Run all E2E tests
yarn test:e2e

# Run E2E tests with UI
yarn test:e2e:ui

# Install Playwright browsers
yarn test:install
```

### All Tests
```bash
# Run both unit and E2E tests
yarn test:all
```

## Test Configuration

### Vitest Configuration
- **Environment**: jsdom (for DOM testing)
- **Coverage**: V8 provider with 70% threshold
- **Setup**: Global mocks and Vue Test Utils configuration

### Playwright Configuration
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Mobile Chrome, Mobile Safari
- **Base URL**: http://localhost:8080
- **Retries**: 2 on CI, 0 locally

## Writing Tests

### Unit Tests
- Use Vue Test Utils for component testing
- Mock external dependencies (Vuex, Router, Web3)
- Test component props, events, and computed properties
- Aim for 70%+ code coverage

### E2E Tests
- Test critical user journeys
- Focus on staking, earning, and withdrawal flows
- Test responsive design and accessibility
- Use page object pattern for complex flows

## CI/CD Integration

Tests run automatically on:
- **GitHub Actions**: On push and pull requests
- **AWS Amplify**: During build process
- **Coverage**: Uploaded to Codecov

## Best Practices

1. **Test Structure**: Follow AAA pattern (Arrange, Act, Assert)
2. **Naming**: Use descriptive test names
3. **Isolation**: Each test should be independent
4. **Mocking**: Mock external dependencies appropriately
5. **Coverage**: Aim for meaningful coverage, not just high numbers

## Debugging Tests

### Unit Tests
```bash
# Run specific test file
yarn test SharedButton.test.js

# Run with verbose output
yarn test --reporter=verbose
```

### E2E Tests
```bash
# Run in headed mode
yarn test:e2e --headed

# Run specific test
yarn test:e2e landing.spec.js

# Debug mode
yarn test:e2e --debug
```

## Test Data

- Use factories for creating test data
- Mock API responses consistently
- Use realistic but minimal test data
- Clean up test data after each test

## Performance Testing

- Monitor test execution time
- Use parallel execution where possible
- Optimize slow tests
- Set reasonable timeouts

## Accessibility Testing

- Test keyboard navigation
- Verify ARIA labels and roles
- Check color contrast
- Test screen reader compatibility