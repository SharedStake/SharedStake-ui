// Jest setup file for Vue.js testing
import { config } from '@vue/test-utils';
import Vue from 'vue';

// Mock Web3 and blockchain-related globals
global.ethereum = {
  isMetaMask: true,
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
};

// Mock window.ethereum for Web3 wallet connections
Object.defineProperty(window, 'ethereum', {
  value: global.ethereum,
  writable: true,
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore a specific log level
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Configure Vue Test Utils
config.mocks = {
  $t: (msg) => msg, // Mock i18n
  $tc: (msg) => msg,
  $te: (msg) => true,
  $d: (date) => date,
  $n: (number) => number,
};

// Mock Vue Router
config.stubs = {
  'router-link': true,
  'router-view': true,
};

// Mock Vuex store
config.mocks.$store = {
  state: {},
  getters: {},
  commit: jest.fn(),
  dispatch: jest.fn(),
};

// Mock Vue Router
config.mocks.$route = {
  path: '/',
  name: 'home',
  params: {},
  query: {},
  meta: {},
};

config.mocks.$router = {
  push: jest.fn(),
  replace: jest.fn(),
  go: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
};