// Advanced testing utilities for DeFi application testing

/**
 * Mock Web3 provider with comprehensive functionality
 */
export class MockWeb3Provider {
  constructor() {
    this.accounts = ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'];
    this.chainId = '0x1';
    this.isConnected = false;
    this.requestHandlers = new Map();
    this.eventListeners = new Map();
    
    this.setupDefaultHandlers();
  }

  setupDefaultHandlers() {
    this.requestHandlers.set('eth_requestAccounts', () => {
      this.isConnected = true;
      return Promise.resolve(this.accounts);
    });
    
    this.requestHandlers.set('eth_accounts', () => {
      return Promise.resolve(this.isConnected ? this.accounts : []);
    });
    
    this.requestHandlers.set('eth_chainId', () => {
      return Promise.resolve(this.chainId);
    });
    
    this.requestHandlers.set('eth_getBalance', () => {
      return Promise.resolve('0x16345785d8a0000'); // 100 ETH in wei
    });
    
    this.requestHandlers.set('wallet_switchEthereumChain', () => {
      return Promise.resolve();
    });
  }

  request({ method, params }) {
    const handler = this.requestHandlers.get(method);
    if (handler) {
      return handler(params);
    }
    return Promise.reject(new Error(`Method ${method} not implemented`));
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  removeListener(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Test utilities
  setAccounts(accounts) {
    this.accounts = accounts;
  }

  setChainId(chainId) {
    this.chainId = chainId;
  }

  setConnected(connected) {
    this.isConnected = connected;
  }

  addRequestHandler(method, handler) {
    this.requestHandlers.set(method, handler);
  }
}

/**
 * Mock smart contract for testing
 */
export class MockContract {
  constructor(address, abi) {
    this.address = address;
    this.abi = abi;
    this.methods = {};
    this.setupDefaultMethods();
  }

  setupDefaultMethods() {
    // Common ERC20 methods
    this.methods.balanceOf = jest.fn().mockResolvedValue('1000000000000000000');
    this.methods.totalSupply = jest.fn().mockResolvedValue('10000000000000000000');
    this.methods.allowance = jest.fn().mockResolvedValue('0');
    this.methods.approve = jest.fn().mockResolvedValue({
      hash: '0xapprovehash',
      wait: jest.fn().mockResolvedValue({ status: 1 })
    });
    this.methods.transfer = jest.fn().mockResolvedValue({
      hash: '0xtransferhash',
      wait: jest.fn().mockResolvedValue({ status: 1 })
    });

    // Staking contract methods
    this.methods.stake = jest.fn().mockResolvedValue({
      hash: '0xstakehash',
      wait: jest.fn().mockResolvedValue({ status: 1 })
    });
    this.methods.unstake = jest.fn().mockResolvedValue({
      hash: '0xunstakehash',
      wait: jest.fn().mockResolvedValue({ status: 1 })
    });
    this.methods.getStake = jest.fn().mockResolvedValue('500000000000000000');
    this.methods.getRewards = jest.fn().mockResolvedValue('10000000000000000');
    this.methods.claimRewards = jest.fn().mockResolvedValue({
      hash: '0xclaimhash',
      wait: jest.fn().mockResolvedValue({ status: 1 })
    });
  }

  // Test utilities
  setMethodReturn(method, value) {
    this.methods[method] = jest.fn().mockResolvedValue(value);
  }

  setMethodError(method, error) {
    this.methods[method] = jest.fn().mockRejectedValue(error);
  }
}

/**
 * Test data factory for creating consistent test data
 */
export class TestDataFactory {
  static createWalletData(overrides = {}) {
    return {
      address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      balance: '1000000000000000000', // 1 ETH in wei
      chainId: '0x1',
      isConnected: true,
      ...overrides
    };
  }

  static createStakingData(overrides = {}) {
    return {
      stakedAmount: '500000000000000000', // 0.5 ETH
      rewards: '10000000000000000', // 0.01 ETH
      apy: '5.0',
      totalStaked: '10000000000000000000', // 10 ETH
      ...overrides
    };
  }

  static createTransactionData(overrides = {}) {
    return {
      hash: '0x1234567890abcdef',
      blockNumber: 18000001,
      status: 1,
      gasUsed: '21000',
      gasPrice: '20000000000',
      ...overrides
    };
  }

  static createErrorData(overrides = {}) {
    return {
      code: 4001,
      message: 'User rejected request',
      data: null,
      ...overrides
    };
  }
}

/**
 * Test environment setup utilities
 */
export class TestEnvironment {
  static setupWeb3Mocks() {
    const provider = new MockWeb3Provider();
    const contract = new MockContract('0xContractAddress', []);
    
    // Set up global mocks
    global.ethereum = provider;
    global.mockContract = contract;
    
    return { provider, contract };
  }

  static cleanup() {
    delete global.ethereum;
    delete global.mockContract;
    jest.clearAllMocks();
  }

  static waitFor(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static flushPromises() {
    return new Promise(resolve => setImmediate(resolve));
  }
}

/**
 * Assertion helpers for Web3 testing
 */
export class Web3Assertions {
  static expectTransactionSuccess(transaction) {
    expect(transaction).toHaveProperty('hash');
    expect(transaction.hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(transaction).toHaveProperty('wait');
    expect(typeof transaction.wait).toBe('function');
  }

  static expectValidAddress(address) {
    expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
  }

  static expectValidAmount(amount) {
    expect(amount).toMatch(/^\d+$/);
    expect(parseInt(amount)).toBeGreaterThanOrEqual(0);
  }

  static expectWeb3Error(error) {
    expect(error).toHaveProperty('code');
    expect(error).toHaveProperty('message');
    expect(typeof error.code).toBe('number');
    expect(typeof error.message).toBe('string');
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceTestUtils {
  static async measureExecutionTime(fn) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    return end - start;
  }

  static async measureMemoryUsage(fn) {
    const before = process.memoryUsage();
    await fn();
    const after = process.memoryUsage();
    
    return {
      heapUsed: after.heapUsed - before.heapUsed,
      heapTotal: after.heapTotal - before.heapTotal,
      external: after.external - before.external
    };
  }

  static createLoadTest(concurrency = 10, iterations = 100) {
    return async (fn) => {
      const promises = [];
      
      for (let i = 0; i < concurrency; i++) {
        promises.push(
          (async () => {
            for (let j = 0; j < iterations; j++) {
              await fn();
            }
          })()
        );
      }
      
      const start = performance.now();
      await Promise.all(promises);
      const end = performance.now();
      
      return {
        totalTime: end - start,
        averageTime: (end - start) / (concurrency * iterations),
        operationsPerSecond: (concurrency * iterations) / ((end - start) / 1000)
      };
    };
  }
}

/**
 * Snapshot testing utilities
 */
export class SnapshotUtils {
  static createComponentSnapshot(component) {
    return {
      props: component.props,
      data: component.data,
      computed: component.computed,
      methods: Object.keys(component.methods || {}),
      template: component.template
    };
  }

  static createStateSnapshot(store) {
    return {
      state: store.state,
      getters: Object.keys(store.getters),
      mutations: Object.keys(store._mutations),
      actions: Object.keys(store._actions)
    };
  }

  static createWeb3Snapshot(provider, contract) {
    return {
      provider: {
        accounts: provider.accounts,
        chainId: provider.chainId,
        isConnected: provider.isConnected
      },
      contract: {
        address: contract.address,
        methods: Object.keys(contract.methods)
      }
    };
  }
}