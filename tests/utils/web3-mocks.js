// Web3 testing utilities and mocks for DeFi application testing

// Mock ethers.js provider
export const mockProvider = {
  getNetwork: jest.fn().mockResolvedValue({
    chainId: 1,
    name: 'homestead'
  }),
  getBlockNumber: jest.fn().mockResolvedValue(18000000),
  getBalance: jest.fn().mockResolvedValue('1000000000000000000'), // 1 ETH
  getTransactionCount: jest.fn().mockResolvedValue(10),
  call: jest.fn(),
  send: jest.fn(),
  estimateGas: jest.fn().mockResolvedValue('21000'),
  getGasPrice: jest.fn().mockResolvedValue('20000000000'), // 20 gwei
  waitForTransaction: jest.fn().mockResolvedValue({
    hash: '0x1234567890abcdef',
    blockNumber: 18000001,
    status: 1
  })
};

// Mock ethers.js wallet
export const mockWallet = {
  address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  provider: mockProvider,
  getBalance: jest.fn().mockResolvedValue('1000000000000000000'),
  getTransactionCount: jest.fn().mockResolvedValue(10),
  sendTransaction: jest.fn().mockResolvedValue({
    hash: '0x1234567890abcdef',
    wait: jest.fn().mockResolvedValue({
      hash: '0x1234567890abcdef',
      blockNumber: 18000001,
      status: 1
    })
  }),
  signMessage: jest.fn().mockResolvedValue('0xsignedmessage'),
  signTransaction: jest.fn().mockResolvedValue('0xsignedtransaction')
};

// Mock contract instance
export const mockContract = {
  address: '0xContractAddress',
  interface: {
    getFunction: jest.fn(),
    encodeFunctionData: jest.fn(),
    decodeFunctionResult: jest.fn()
  },
  // Common DeFi contract methods
  balanceOf: jest.fn().mockResolvedValue('1000000000000000000'),
  totalSupply: jest.fn().mockResolvedValue('10000000000000000000'),
  allowance: jest.fn().mockResolvedValue('0'),
  approve: jest.fn().mockResolvedValue({
    hash: '0xapprovehash',
    wait: jest.fn().mockResolvedValue({ status: 1 })
  }),
  transfer: jest.fn().mockResolvedValue({
    hash: '0xtransferhash',
    wait: jest.fn().mockResolvedValue({ status: 1 })
  }),
  transferFrom: jest.fn().mockResolvedValue({
    hash: '0xtransferfromhash',
    wait: jest.fn().mockResolvedValue({ status: 1 })
  }),
  // Staking contract methods
  stake: jest.fn().mockResolvedValue({
    hash: '0xstakehash',
    wait: jest.fn().mockResolvedValue({ status: 1 })
  }),
  unstake: jest.fn().mockResolvedValue({
    hash: '0xunstakehash',
    wait: jest.fn().mockResolvedValue({ status: 1 })
  }),
  getStake: jest.fn().mockResolvedValue('500000000000000000'), // 0.5 ETH staked
  getRewards: jest.fn().mockResolvedValue('10000000000000000'), // 0.01 ETH rewards
  claimRewards: jest.fn().mockResolvedValue({
    hash: '0xclaimhash',
    wait: jest.fn().mockResolvedValue({ status: 1 })
  })
};

// Mock Web3Onboard
export const mockWeb3Onboard = {
  connectWallet: jest.fn().mockResolvedValue([{
    accounts: [{
      address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      balance: '1.0',
      ens: null
    }],
    chains: [{
      id: '0x1',
      namespace: 'evm',
      rpcUrl: 'https://mainnet.infura.io/v3/test'
    }],
    wallet: {
      label: 'MetaMask',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PC9zdmc+'
    }
  }]),
  disconnectWallet: jest.fn().mockResolvedValue(undefined),
  setChain: jest.fn().mockResolvedValue(undefined),
  state: {
    select: jest.fn().mockReturnValue({
      subscribe: jest.fn()
    })
  }
};

// Mock transaction states
export const mockTransactionStates = {
  pending: {
    hash: '0xpendinghash',
    status: 'pending',
    confirmations: 0
  },
  confirmed: {
    hash: '0xconfirmedhash',
    status: 'confirmed',
    confirmations: 1,
    blockNumber: 18000001
  },
  failed: {
    hash: '0xfailedhash',
    status: 'failed',
    error: 'Transaction failed'
  }
};

// Helper function to create mock store state
export const createMockStore = (overrides = {}) => ({
  state: {
    wallet: {
      connected: false,
      address: null,
      balance: '0',
      chainId: null
    },
    staking: {
      stakedAmount: '0',
      rewards: '0',
      apy: '5.0'
    },
    contracts: {
      stakingContract: null,
      tokenContract: null
    },
    ...overrides
  },
  getters: {
    isWalletConnected: (state) => state.wallet.connected,
    getStakedAmount: (state) => state.staking.stakedAmount,
    getRewards: (state) => state.staking.rewards,
    ...overrides.getters
  },
  mutations: {
    SET_WALLET_CONNECTED: jest.fn(),
    SET_WALLET_ADDRESS: jest.fn(),
    SET_WALLET_BALANCE: jest.fn(),
    SET_STAKED_AMOUNT: jest.fn(),
    SET_REWARDS: jest.fn(),
    ...overrides.mutations
  },
  actions: {
    connectWallet: jest.fn(),
    disconnectWallet: jest.fn(),
    stake: jest.fn(),
    unstake: jest.fn(),
    claimRewards: jest.fn(),
    ...overrides.actions
  }
});

// Helper function to wait for async operations
export const waitFor = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to flush promises
export const flushPromises = () => new Promise(resolve => setImmediate(resolve));