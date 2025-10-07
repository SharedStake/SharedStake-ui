import { mount, createLocalVue } from '@vue/test-utils'
import VueRouter from 'vue-router'
import Vuex from 'vuex'

/**
 * Create a test Vue instance with common plugins
 */
export function createTestVue() {
  const localVue = createLocalVue()
  localVue.use(VueRouter)
  localVue.use(Vuex)
  return localVue
}

/**
 * Create a test router with common routes
 */
export function createTestRouter() {
  return new VueRouter({
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/stake', component: { template: '<div>Stake</div>' } },
      { path: '/earn', component: { template: '<div>Earn</div>' } },
      { path: '/withdraw', component: { template: '<div>Withdraw</div>' } },
      { path: '/blog', component: { template: '<div>Blog</div>' } },
      { path: '/blog/:slug', component: { template: '<div>Blog Post</div>' } }
    ]
  })
}

/**
 * Create a test Vuex store with common modules
 */
export function createTestStore(modules = {}) {
  const defaultModules = {
    user: {
      namespaced: true,
      state: {
        address: null,
        isConnected: false
      },
      getters: {
        userAddress: state => state.address,
        isConnected: state => state.isConnected
      },
      actions: {
        setAddress: jest.fn(),
        connectWallet: jest.fn(),
        disconnectWallet: jest.fn()
      }
    },
    staking: {
      namespaced: true,
      state: {
        balance: '0',
        stakedAmount: '0',
        rewards: '0'
      },
      getters: {
        balance: state => state.balance,
        stakedAmount: state => state.stakedAmount,
        rewards: state => state.rewards
      },
      actions: {
        stake: jest.fn(),
        unstake: jest.fn(),
        claimRewards: jest.fn()
      }
    }
  }

  return new Vuex.Store({
    modules: { ...defaultModules, ...modules }
  })
}

/**
 * Mock Web3 provider for testing
 */
export function mockWeb3Provider() {
  return {
    isMetaMask: true,
    request: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn(),
    selectedAddress: '0x1234567890abcdef1234567890abcdef12345678',
    chainId: '0x1'
  }
}

/**
 * Mock ethers provider for testing
 */
export function mockEthersProvider() {
  return {
    getBalance: jest.fn().mockResolvedValue('1000000000000000000'),
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1, name: 'homestead' }),
    getSigner: jest.fn().mockReturnValue({
      getAddress: jest.fn().mockResolvedValue('0x1234567890abcdef1234567890abcdef12345678'),
      signMessage: jest.fn().mockResolvedValue('0xsignedmessage')
    })
  }
}

/**
 * Common test stubs for components
 */
export const commonStubs = {
  'router-link': true,
  'router-view': true,
  'transition': true,
  'transition-group': true,
  'notifications': true
}

/**
 * Mount component with common test setup
 */
export function mountWithTestSetup(component, options = {}) {
  const localVue = createTestVue()
  const router = createTestRouter()
  const store = createTestStore()

  const defaultOptions = {
    localVue,
    router,
    store,
    stubs: commonStubs
  }

  return mount(component, { ...defaultOptions, ...options })
}

/**
 * Wait for next tick and DOM updates
 */
export async function waitForUpdate(wrapper) {
  await wrapper.vm.$nextTick()
  await new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * Mock console methods to avoid noise in tests
 */
export function mockConsole() {
  const originalConsole = global.console
  
  global.console = {
    ...originalConsole,
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn()
  }
  
  return () => {
    global.console = originalConsole
  }
}

/**
 * Create mock blog data for testing
 */
export function createMockBlogData(count = 3) {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    title: `Test Blog Post ${index + 1}`,
    slug: `test-blog-post-${index + 1}`,
    excerpt: `This is a test blog post excerpt ${index + 1}`,
    content: `Full blog post content ${index + 1}`,
    author: `Test Author ${index + 1}`,
    publishDate: `2024-01-${String(index + 1).padStart(2, '0')}`,
    featured: index === 0
  }))
}

/**
 * Create mock staking data for testing
 */
export function createMockStakingData() {
  return {
    balance: '1000000000000000000', // 1 ETH in wei
    stakedAmount: '500000000000000000', // 0.5 ETH in wei
    rewards: '10000000000000000', // 0.01 ETH in wei
    apy: '5.2',
    totalStaked: '10000000000000000000' // 10 ETH in wei
  }
}