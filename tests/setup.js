import { config } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { vi } from 'vitest'

// Mock global objects that might be used in components
global.ethers = {
  providers: {
    JsonRpcProvider: vi.fn(),
    Web3Provider: vi.fn()
  },
  utils: {
    formatEther: vi.fn(),
    parseEther: vi.fn(),
    formatUnits: vi.fn(),
    parseUnits: vi.fn()
  },
  BigNumber: vi.fn(),
  Contract: vi.fn()
}

// Mock window.ethereum
Object.defineProperty(window, 'ethereum', {
  value: {
    request: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
    isMetaMask: true
  },
  writable: true
})

// Configure Vue Test Utils
config.mocks = {
  $t: (key) => key, // Mock i18n
  $tc: (key) => key,
  $te: (key) => true,
  $d: (value) => value,
  $n: (value) => value
}

// Global test utilities
global.createTestPinia = () => {
  return createPinia()
}