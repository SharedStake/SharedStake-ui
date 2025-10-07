// Setup file for Jest tests
import '@testing-library/jest-dom'

// Mock window.ethereum for blockchain tests
global.ethereum = {
  isMetaMask: true,
  selectedAddress: null,
  chainId: '0x1',
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}