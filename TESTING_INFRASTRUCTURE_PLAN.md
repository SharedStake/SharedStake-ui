# Testing Infrastructure Plan

## Overview
This document outlines the comprehensive testing infrastructure setup for the SharedStake UI project, including unit tests, component tests, and E2E tests.

## Current State
- **Testing Framework**: None currently implemented
- **Test Coverage**: 0%
- **Testing Tools**: Not configured
- **CI/CD Testing**: Not integrated

## Testing Strategy

### **1. Unit Testing (Vitest)**
- **Framework**: Vitest (Vue 3 compatible, faster than Jest)
- **Coverage**: Components, utilities, stores
- **Target**: 80%+ code coverage

### **2. Component Testing (Vue Test Utils)**
- **Framework**: @vue/test-utils
- **Coverage**: Vue components, props, events
- **Target**: All components tested

### **3. E2E Testing (Playwright)**
- **Framework**: Playwright (cross-browser)
- **Coverage**: Critical user flows
- **Target**: Stake, unstake, wallet connection flows

## Implementation Plan

### **Phase 1: Setup and Configuration (1 week)**

#### **1.1 Install Dependencies**
```bash
# Unit testing
npm install -D vitest @vue/test-utils jsdom

# E2E testing
npm install -D @playwright/test

# Testing utilities
npm install -D @testing-library/vue @testing-library/jest-dom
```

#### **1.2 Configuration Files**

**Vitest Configuration (vitest.config.js)**
```javascript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
```

**Playwright Configuration (playwright.config.js)**
```javascript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'yarn serve',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
  },
})
```

#### **1.3 Test Setup Files**

**Test Setup (src/test/setup.js)**
```javascript
import '@testing-library/jest-dom'
import { config } from '@vue/test-utils'

// Mock Web3 and wallet providers
global.ethereum = {
  isMetaMask: true,
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
}

// Mock window.ethereum
Object.defineProperty(window, 'ethereum', {
  value: global.ethereum,
  writable: true,
})

// Mock Web3
jest.mock('web3', () => {
  return jest.fn().mockImplementation(() => ({
    eth: {
      getBlockNumber: jest.fn().mockResolvedValue(12345678),
      getGasPrice: jest.fn().mockResolvedValue('1000000000'),
      net: {
        getId: jest.fn().mockResolvedValue(1)
      }
    },
    utils: {
      toChecksumAddress: jest.fn((addr) => addr),
      fromWei: jest.fn((wei) => wei / 1e18)
    }
  }))
})

// Mock Web3-Onboard
jest.mock('@web3-onboard/core', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    connectWallet: jest.fn().mockResolvedValue([{
      label: 'MetaMask',
      accounts: [{ address: '0x1234567890123456789012345678901234567890' }],
      chains: [{ id: '0x1' }]
    }])
  }))
}))
```

### **Phase 2: Unit Testing Implementation (2 weeks)**

#### **2.1 Utility Functions Testing**

**Example: src/utils/common.test.js**
```javascript
import { describe, it, expect } from 'vitest'
import { formatAddress, formatBalance } from '../utils/common'

describe('Common Utils', () => {
  describe('formatAddress', () => {
    it('should format address correctly', () => {
      const address = '0x1234567890123456789012345678901234567890'
      const formatted = formatAddress(address)
      expect(formatted).toBe('0x1234...7890')
    })

    it('should handle invalid address', () => {
      const address = 'invalid'
      const formatted = formatAddress(address)
      expect(formatted).toBe('Invalid Address')
    })
  })

  describe('formatBalance', () => {
    it('should format balance correctly', () => {
      const balance = '1000000000000000000' // 1 ETH in wei
      const formatted = formatBalance(balance)
      expect(formatted).toBe('1.00')
    })
  })
})
```

#### **2.2 Store Testing**

**Example: src/store/modules/module.test.js**
```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { createStore } from 'vuex'
import module from './module'

describe('Module Store', () => {
  let store

  beforeEach(() => {
    store = createStore({
      modules: {
        module
      }
    })
  })

  it('should initialize with default state', () => {
    expect(store.state.module.address).toBe('')
    expect(store.state.module.web3).toBe(null)
  })

  it('should set address', () => {
    const address = '0x1234567890123456789012345678901234567890'
    store.commit('module/setAddress', address)
    expect(store.state.module.address).toBe(address)
  })

  it('should set web3 instance', () => {
    const web3 = { version: '4.16.0' }
    store.commit('module/setWeb3', web3)
    expect(store.state.module.web3).toBe(web3)
  })
})
```

### **Phase 3: Component Testing Implementation (2 weeks)**

#### **3.1 Basic Component Testing**

**Example: src/components/Common/ConnectButton.test.js**
```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import ConnectButton from './ConnectButton.vue'

describe('ConnectButton', () => {
  let store
  let wrapper

  beforeEach(() => {
    store = createStore({
      state: {
        address: '',
        wallet: ''
      },
      mutations: {
        setAddress: (state, address) => { state.address = address },
        setWallet: (state, wallet) => { state.wallet = wallet }
      }
    })

    wrapper = mount(ConnectButton, {
      global: {
        plugins: [store]
      }
    })
  })

  it('renders connect button when not connected', () => {
    expect(wrapper.text()).toContain('Connect Wallet')
  })

  it('renders disconnect button when connected', async () => {
    store.commit('setAddress', '0x1234567890123456789012345678901234567890')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Disconnect')
  })

  it('emits connect event when clicked', async () => {
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted().connect).toBeTruthy()
  })
})
```

#### **3.2 Web3 Component Testing**

**Example: src/components/Stake/Stake.test.js**
```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import Stake from './Stake.vue'

// Mock Web3 contracts
vi.mock('@/contracts', () => ({
  addresses: {
    validator: '0x1234567890123456789012345678901234567890',
    vEth2: '0x0987654321098765432109876543210987654321'
  },
  ABIs: {
    validator: [{ name: 'stake', type: 'function' }],
    vEth2: [{ name: 'balanceOf', type: 'function' }]
  }
}))

describe('Stake Component', () => {
  let store
  let wrapper

  beforeEach(() => {
    store = createStore({
      state: {
        address: '0x1234567890123456789012345678901234567890',
        web3: {
          eth: {
            Contract: vi.fn(() => ({
              methods: {
                stake: vi.fn(() => ({
                  send: vi.fn().mockResolvedValue({})
                }))
              }
            }))
          }
        }
      }
    })

    wrapper = mount(Stake, {
      global: {
        plugins: [store]
      }
    })
  })

  it('renders stake form', () => {
    expect(wrapper.find('[data-testid="stake-form"]').exists()).toBe(true)
  })

  it('validates input amount', async () => {
    const input = wrapper.find('[data-testid="amount-input"]')
    await input.setValue('0')
    await wrapper.find('[data-testid="stake-button"]').trigger('click')
    expect(wrapper.text()).toContain('Amount must be greater than 0')
  })

  it('calls stake function with correct parameters', async () => {
    const input = wrapper.find('[data-testid="amount-input"]')
    await input.setValue('1.0')
    await wrapper.find('[data-testid="stake-button"]').trigger('click')
    
    // Verify contract method was called
    expect(store.state.web3.eth.Contract).toHaveBeenCalled()
  })
})
```

### **Phase 4: E2E Testing Implementation (2 weeks)**

#### **4.1 Critical User Flows**

**Example: tests/e2e/stake-flow.spec.js**
```javascript
import { test, expect } from '@playwright/test'

test.describe('Stake Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/stake')
  })

  test('should connect wallet and stake tokens', async ({ page }) => {
    // Connect wallet
    await page.click('[data-testid="connect-wallet"]')
    await page.click('[data-testid="metamask-option"]')
    
    // Wait for wallet connection
    await expect(page.locator('[data-testid="wallet-address"]')).toBeVisible()
    
    // Enter stake amount
    await page.fill('[data-testid="amount-input"]', '1.0')
    
    // Click stake button
    await page.click('[data-testid="stake-button"]')
    
    // Wait for transaction confirmation
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    // Verify balance updated
    await expect(page.locator('[data-testid="staked-balance"]')).toContainText('1.0')
  })

  test('should show error for invalid amount', async ({ page }) => {
    await page.fill('[data-testid="amount-input"]', '0')
    await page.click('[data-testid="stake-button"]')
    
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Amount must be greater than 0')
  })
})
```

**Example: tests/e2e/wallet-connection.spec.js**
```javascript
import { test, expect } from '@playwright/test'

test.describe('Wallet Connection', () => {
  test('should connect with MetaMask', async ({ page }) => {
    await page.goto('/')
    
    // Click connect wallet
    await page.click('[data-testid="connect-wallet"]')
    
    // Select MetaMask
    await page.click('[data-testid="metamask-option"]')
    
    // Wait for connection
    await expect(page.locator('[data-testid="wallet-address"]')).toBeVisible()
    
    // Verify wallet info is displayed
    await expect(page.locator('[data-testid="wallet-name"]')).toContainText('MetaMask')
  })

  test('should disconnect wallet', async ({ page }) => {
    // First connect wallet
    await page.goto('/')
    await page.click('[data-testid="connect-wallet"]')
    await page.click('[data-testid="metamask-option"]')
    await expect(page.locator('[data-testid="wallet-address"]')).toBeVisible()
    
    // Then disconnect
    await page.click('[data-testid="disconnect-wallet"]')
    await expect(page.locator('[data-testid="connect-wallet"]')).toBeVisible()
  })
})
```

#### **4.2 Cross-Browser Testing**

**Example: tests/e2e/cross-browser.spec.js**
```javascript
import { test, expect } from '@playwright/test'

test.describe('Cross-Browser Compatibility', () => {
  test('should work in Chrome', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium')
    
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should work in Firefox', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox')
    
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should work in Safari', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit')
    
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()
  })
})
```

### **Phase 5: CI/CD Integration (1 week)**

#### **5.1 GitHub Actions Workflow**

**Example: .github/workflows/test.yml**
```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'yarn'
      
      - name: Install dependencies
        run: yarn install
      
      - name: Run unit tests
        run: yarn test:unit
      
      - name: Run component tests
        run: yarn test:component
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'yarn'
      
      - name: Install dependencies
        run: yarn install
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Build application
        run: yarn build
      
      - name: Run E2E tests
        run: yarn test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

#### **5.2 Package.json Scripts**

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --coverage",
    "test:component": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "yarn test:unit && yarn test:e2e"
  }
}
```

## Testing Best Practices

### **1. Test Organization**
```
tests/
├── unit/
│   ├── components/
│   ├── utils/
│   └── store/
├── e2e/
│   ├── stake-flow.spec.js
│   ├── wallet-connection.spec.js
│   └── cross-browser.spec.js
└── fixtures/
    ├── contracts.json
    └── mock-data.json
```

### **2. Test Data Management**
- Use factories for test data generation
- Mock external dependencies
- Use fixtures for complex data structures
- Clean up after each test

### **3. Web3 Testing Patterns**
- Mock Web3 providers
- Mock contract interactions
- Test error scenarios
- Test loading states

### **4. Performance Testing**
- Test component rendering performance
- Test bundle size impact
- Test memory usage
- Test loading times

## Coverage Goals

### **Unit Tests**
- **Target**: 80%+ code coverage
- **Focus**: Utils, stores, pure functions
- **Tools**: Vitest coverage

### **Component Tests**
- **Target**: 100% component coverage
- **Focus**: Props, events, user interactions
- **Tools**: Vue Test Utils

### **E2E Tests**
- **Target**: Critical user flows
- **Focus**: Stake, unstake, wallet connection
- **Tools**: Playwright

## Monitoring and Maintenance

### **1. Test Monitoring**
- Track test execution time
- Monitor flaky tests
- Track coverage trends
- Alert on test failures

### **2. Test Maintenance**
- Regular test updates
- Remove obsolete tests
- Update test data
- Refactor test code

### **3. Performance Monitoring**
- Test execution time
- Bundle size impact
- Memory usage
- CI/CD performance

## Timeline

### **Week 1: Setup**
- [ ] Install dependencies
- [ ] Configure testing tools
- [ ] Set up test environment
- [ ] Create basic test structure

### **Week 2-3: Unit Testing**
- [ ] Test utility functions
- [ ] Test store modules
- [ ] Test basic components
- [ ] Achieve 80% coverage

### **Week 4-5: Component Testing**
- [ ] Test all Vue components
- [ ] Test Web3 integration
- [ ] Test user interactions
- [ ] Test error scenarios

### **Week 6-7: E2E Testing**
- [ ] Test critical user flows
- [ ] Test wallet connections
- [ ] Test stake/unstake flows
- [ ] Test cross-browser compatibility

### **Week 8: CI/CD Integration**
- [ ] Set up GitHub Actions
- [ ] Configure test reporting
- [ ] Set up coverage reporting
- [ ] Document testing process

## Success Criteria

### **Technical**
- [ ] 80%+ unit test coverage
- [ ] 100% component test coverage
- [ ] All critical E2E flows tested
- [ ] Tests run in CI/CD pipeline

### **Functional**
- [ ] All tests passing
- [ ] No flaky tests
- [ ] Fast test execution
- [ ] Reliable CI/CD pipeline

### **Quality**
- [ ] Tests catch regressions
- [ ] Tests are maintainable
- [ ] Tests are well-documented
- [ ] Tests follow best practices

---

**Created**: 2025-01-24
**Last Updated**: 2025-01-24
**Status**: Planning Phase
**Estimated Duration**: 8 weeks
**Priority**: High (Code Quality and Reliability)