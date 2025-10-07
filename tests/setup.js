import { config } from '@vue/test-utils'
import { createLocalVue } from '@vue/test-utils'
import VueRouter from 'vue-router'
import Vuex from 'vuex'

// Create a local Vue instance for testing
const localVue = createLocalVue()
localVue.use(VueRouter)
localVue.use(Vuex)

// Mock global properties that might be used in components
global.console = {
  ...console,
  // Suppress console warnings in tests unless explicitly needed
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock window.ethereum for Web3 testing
Object.defineProperty(window, 'ethereum', {
  value: {
    isMetaMask: true,
    request: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn(),
  },
  writable: true,
})

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(cb) {
    this.cb = cb
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(cb) {
    this.cb = cb
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Configure Vue Test Utils
config.global.mocks = {
  $t: (key) => key, // Mock i18n if used
  $route: {
    path: '/',
    params: {},
    query: {},
  },
  $router: {
    push: jest.fn(),
    replace: jest.fn(),
    go: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  },
}

config.global.stubs = {
  'router-link': true,
  'router-view': true,
  'transition': true,
  'transition-group': true,
}