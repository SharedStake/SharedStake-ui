# Testing Guide for SharedStake UI

This document provides comprehensive guidance on testing the SharedStake DeFi application to prevent regressions and ensure code quality.

## 🎯 Testing Strategy

Our testing approach follows a **pyramid strategy** with three levels:

1. **Unit Tests** (70%) - Fast, isolated component and utility tests
2. **Integration Tests** (20%) - Component interaction and store tests  
3. **End-to-End Tests** (10%) - Critical user journey tests

## 🛠️ Testing Tools & Frameworks

### Unit Testing
- **Jest** - JavaScript testing framework
- **Vue Test Utils** - Vue.js component testing utilities
- **Custom Web3 Mocks** - Blockchain interaction testing

### End-to-End Testing
- **Cypress** - Browser automation and testing
- **Custom Commands** - Web3 wallet and DeFi-specific testing utilities

### CI/CD Integration
- **GitHub Actions** - Automated testing pipeline
- **Code Coverage** - Test coverage reporting
- **Security Audits** - Vulnerability scanning

## 📁 Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── components/         # Component tests
│   ├── utils/             # Utility function tests
│   └── store/             # Vuex store tests
├── e2e/                   # End-to-end tests
│   ├── support/           # Cypress support files
│   ├── fixtures/          # Test data
│   └── *.cy.js           # Test specifications
└── utils/                 # Shared testing utilities
    └── web3-mocks.js      # Web3 testing mocks
```

## 🚀 Running Tests

### Unit Tests
```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci
```

### End-to-End Tests
```bash
# Run E2E tests headlessly
npm run test:e2e

# Open Cypress Test Runner
npm run test:e2e:open

# Run E2E tests with browser UI
npm run test:e2e:headed
```

### All Tests
```bash
# Run both unit and E2E tests
npm run test:all
```

## 🧪 Writing Tests

### Unit Test Example

```javascript
import { mount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import ConnectButton from '@/components/Common/ConnectButton.vue';
import { createMockStore } from '../utils/web3-mocks';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('ConnectButton.vue', () => {
  let wrapper;
  let store;

  beforeEach(() => {
    store = new Vuex.Store(createMockStore());
    wrapper = mount(ConnectButton, {
      localVue,
      store
    });
  });

  it('should render connect button when not connected', () => {
    expect(wrapper.text()).toBe('Connect Wallet');
  });

  it('should call setAddress action when clicked', async () => {
    await wrapper.trigger('click');
    expect(store._actions.setAddress).toHaveBeenCalled();
  });
});
```

### E2E Test Example

```javascript
describe('Wallet Connection', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForWeb3();
  });

  it('should connect wallet successfully', () => {
    cy.connectWallet();
    cy.get('[data-testid="wallet-address"]')
      .should('contain', '0x74');
  });
});
```

## 🔧 Web3 Testing

### Mocking Web3 Interactions

Our testing utilities provide comprehensive Web3 mocking:

```javascript
import { 
  mockProvider, 
  mockWallet, 
  mockContract, 
  mockWeb3Onboard 
} from '../utils/web3-mocks';

// Mock provider responses
mockProvider.getBalance.mockResolvedValue('1000000000000000000');

// Mock contract interactions
mockContract.stake.mockResolvedValue({
  hash: '0xstakehash',
  wait: jest.fn().mockResolvedValue({ status: 1 })
});
```

### Custom Cypress Commands

```javascript
// Connect wallet
cy.connectWallet();

// Mock contract calls
cy.mockContractCall('stake', { hash: '0xstakehash' });

// Wait for Web3 to be ready
cy.waitForWeb3();
```

## 📊 Test Coverage

### Coverage Goals
- **Overall Coverage**: >80%
- **Critical Components**: >90%
- **Utility Functions**: >95%

### Critical Components to Test
- ✅ Wallet connection/disconnection
- ✅ Staking functionality
- ✅ Withdrawal processes
- ✅ Token approvals
- ✅ Error handling
- ✅ Loading states

### Running Coverage Reports
```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

## 🚨 Testing Best Practices

### 1. Test Structure
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests focused and atomic
- Mock external dependencies

### 2. Web3 Testing
- Always mock blockchain interactions
- Test both success and failure scenarios
- Verify transaction states
- Test network switching

### 3. Component Testing
- Test user interactions
- Verify prop handling
- Test computed properties
- Check event emissions

### 4. E2E Testing
- Test critical user journeys
- Verify cross-browser compatibility
- Test responsive design
- Check accessibility

## 🔍 Debugging Tests

### Unit Test Debugging
```bash
# Run specific test file
npm test -- ConnectButton.spec.js

# Run tests matching pattern
npm test -- --testNamePattern="should connect wallet"

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### E2E Test Debugging
```bash
# Open Cypress with debugging
npm run test:e2e:open

# Run specific test file
npx cypress run --spec "tests/e2e/wallet-connection.cy.js"

# Debug with browser
npx cypress run --headed --browser chrome
```

## 🚀 CI/CD Integration

### GitHub Actions Workflow
Our CI pipeline runs:
1. **Unit Tests** - On multiple Node.js versions
2. **E2E Tests** - With Cypress in headless mode
3. **Security Audit** - Vulnerability scanning
4. **Build Test** - Production build verification

### Pre-commit Hooks
```bash
# Install pre-commit hooks
npm install --save-dev husky lint-staged

# Add to package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,vue}": ["npm run lint", "npm test"]
  }
}
```

## 📈 Performance Testing

### Lighthouse CI
```bash
# Install Lighthouse CI
npm install --save-dev @lhci/cli

# Run performance tests
npx lhci autorun
```

### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npx webpack-bundle-analyzer dist/js/*.js
```

## 🐛 Common Issues & Solutions

### Issue: Jest/Vue Test Utils Compatibility
**Solution**: Use compatible versions and proper Babel configuration

### Issue: Web3 Mocking Failures
**Solution**: Ensure proper mock setup in test setup files

### Issue: Cypress Timeout Errors
**Solution**: Increase timeout values and add proper waits

### Issue: CI Test Failures
**Solution**: Check Node.js version compatibility and dependency versions

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Vue Test Utils Guide](https://vue-test-utils.vuejs.org/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Web3 Testing Guide](https://ethereum.org/en/developers/docs/testing/)

## 🤝 Contributing

When adding new features:
1. Write unit tests for new components
2. Add E2E tests for critical user flows
3. Update this documentation
4. Ensure all tests pass in CI

## 📞 Support

For testing questions or issues:
- Check existing test examples
- Review this documentation
- Create an issue in the repository
- Contact the development team

---

**Remember**: Good tests are an investment in code quality and developer confidence. Take time to write meaningful tests that catch real bugs and prevent regressions.