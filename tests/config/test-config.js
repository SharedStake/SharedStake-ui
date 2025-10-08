// Test configuration for SharedStake DeFi application

export const testConfig = {
  // Test environment settings
  environment: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:8080',
    timeout: 10000,
    retries: 2,
    viewport: {
      width: 1280,
      height: 720
    }
  },

  // Web3 testing configuration
  web3: {
    defaultWallet: {
      address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      balance: '1000000000000000000', // 1 ETH in wei
      chainId: '0x1' // Mainnet
    },
    testNetworks: {
      mainnet: '0x1',
      goerli: '0x5',
      sepolia: '0xaa36a7'
    },
    contractAddresses: {
      staking: '0xStakingContractAddress',
      token: '0xTokenContractAddress'
    }
  },

  // Test data configuration
  testData: {
    amounts: {
      small: '0.1',
      medium: '1.0',
      large: '10.0',
      max: '100.0'
    },
    timeouts: {
      short: 1000,
      medium: 5000,
      long: 10000
    }
  },

  // Performance thresholds
  performance: {
    pageLoadTime: 3000, // 3 seconds
    apiResponseTime: 2000, // 2 seconds
    transactionTime: 30000, // 30 seconds
    memoryUsage: 100 * 1024 * 1024 // 100MB
  },

  // Security testing configuration
  security: {
    allowedOrigins: ['localhost:8080', 'sharedstake.io'],
    requiredHeaders: ['Content-Security-Policy'],
    forbiddenHeaders: ['X-Frame-Options']
  },

  // Accessibility testing
  accessibility: {
    requiredAriaLabels: ['button', 'input', 'select'],
    colorContrastRatio: 4.5,
    keyboardNavigation: true
  }
};

// Test utilities configuration
export const testUtils = {
  // Mock data generators
  generateWalletData: (overrides = {}) => ({
    address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    balance: '1000000000000000000',
    chainId: '0x1',
    isConnected: true,
    ...overrides
  }),

  generateTransactionData: (overrides = {}) => ({
    hash: '0x' + Math.random().toString(16).substr(2, 64),
    blockNumber: 18000000 + Math.floor(Math.random() * 1000),
    status: 1,
    gasUsed: '21000',
    gasPrice: '20000000000',
    ...overrides
  }),

  // Test assertions
  assertValidAddress: (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },

  assertValidAmount: (amount) => {
    return /^\d+(\.\d+)?$/.test(amount) && parseFloat(amount) >= 0;
  },

  assertValidHash: (hash) => {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
  }
};

// Test scenarios configuration
export const testScenarios = {
  // Critical user journeys
  criticalPaths: [
    'wallet-connection',
    'staking-flow',
    'withdrawal-flow',
    'reward-claiming'
  ],

  // Error scenarios
  errorScenarios: [
    'user-rejection',
    'insufficient-funds',
    'network-error',
    'contract-error',
    'timeout-error'
  ],

  // Performance scenarios
  performanceScenarios: [
    'page-load',
    'rapid-interactions',
    'large-data-sets',
    'concurrent-users'
  ]
};

export default testConfig;