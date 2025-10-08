import { config } from '@vue/test-utils'
import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import { vi } from 'vitest'

// Create a local Vue instance for testing
const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(VueRouter)

// Mock global objects
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

// Mock window.ethereum for Web3 testing
Object.defineProperty(window, 'ethereum', {
  value: {
    isMetaMask: true,
    request: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
  },
  writable: true,
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Configure Vue Test Utils for Vue 2
config.mocks = {
  $t: (_key) => _key, // Mock i18n
  $tc: (_key) => _key,
  $te: (_key) => true,
  $d: (value) => value,
  $n: (value) => value,
}

config.stubs = {
  'router-link': true,
  'router-view': true,
}