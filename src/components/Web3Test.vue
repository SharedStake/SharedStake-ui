<template>
  <div class="p-6 bg-gray-800 rounded-lg text-white">
    <h2 class="text-2xl font-bold mb-4">🧪 Web3 Integration Test</h2>
    
    <div class="space-y-4">
      <!-- Test Results -->
      <div v-for="(test, index) in testResults" :key="index" class="p-4 rounded border-l-4" 
           :class="test.passed ? 'border-green-500 bg-green-900' : 'border-red-500 bg-red-900'">
        <div class="flex items-center">
          <span class="text-2xl mr-2">{{ test.passed ? '✅' : '❌' }}</span>
          <span class="font-semibold">{{ test.name }}</span>
        </div>
        <p class="text-sm mt-1">{{ test.message }}</p>
        <pre v-if="test.details" class="text-xs mt-2 p-2 bg-gray-700 rounded overflow-x-auto">{{ test.details }}</pre>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex gap-4 mt-6">
        <button @click="runTests" 
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold">
          🔄 Run Tests
        </button>
        <button @click="testWalletConnection" 
                class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-semibold">
          🔗 Test Wallet Connection
        </button>
        <button @click="testContractInteraction" 
                class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded font-semibold">
          📄 Test Contract Interaction
        </button>
        <button @click="testStakeUnstakeRoutes" 
                class="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded font-semibold">
          🛣️ Test Routes
        </button>
        <button @click="testStoreIntegration" 
                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded font-semibold">
          🗄️ Test Store
        </button>
      </div>
      
      <!-- Test Status -->
      <div class="mt-4 p-4 bg-gray-700 rounded">
        <h3 class="font-semibold mb-2">Test Status:</h3>
        <p>Total Tests: {{ testResults.length }}</p>
        <p>Passed: {{ testResults.filter(t => t.passed).length }}</p>
        <p>Failed: {{ testResults.filter(t => !t.passed).length }}</p>
        <p>Success Rate: {{ Math.round((testResults.filter(t => t.passed).length / testResults.length) * 100) }}%</p>
      </div>
    </div>
  </div>
</template>

<script>
import Web3 from 'web3';
import Onboard from '@web3-onboard/core';
import injectedModule from '@web3-onboard/injected-wallets';
import { addresses, ABIs } from '../contracts/index.js';

export default {
  name: 'Web3Test',
  data() {
    return {
      testResults: [],
      onboard: null,
      web3: null
    }
  },
  mounted() {
    this.initializeOnboard();
    this.runTests();
  },
  methods: {
    initializeOnboard() {
      try {
        const injected = injectedModule();
        this.onboard = Onboard({
          wallets: [injected],
          chains: [
            {
              id: '0x1',
              token: 'ETH',
              label: 'Ethereum Mainnet',
              rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/Wck5Sff8d5x1yOLZtQq_qE2X--_ETOMd'
            }
          ]
        });
      } catch (error) {
        console.error('Failed to initialize Onboard:', error);
      }
    },
    
    runTests() {
      this.testResults = [];
      
      // Test 1: Web3.js Import
      this.addTest('Web3.js Import', () => {
        return Web3 && typeof Web3 === 'function';
      }, 'Web3.js should be imported and available');
      
      // Test 2: Web3 Instance Creation
      this.addTest('Web3 Instance Creation', () => {
        this.web3 = new Web3('https://eth-mainnet.g.alchemy.com/v2/Wck5Sff8d5x1yOLZtQq_qE2X--_ETOMd');
        return this.web3 && typeof this.web3 === 'object';
      }, 'Web3 instance should be created successfully');
      
      // Test 3: Web3 Version
      this.addTest('Web3 Version Check', () => {
        return this.web3 && this.web3.version && this.web3.version.web3;
      }, `Web3 version: ${this.web3?.version?.web3 || 'Unknown'}`);
      
      // Test 4: Web3-Onboard Import
      this.addTest('Web3-Onboard Import', () => {
        return Onboard && typeof Onboard === 'function';
      }, 'Web3-Onboard should be imported and available');
      
      // Test 5: Injected Wallets Import
      this.addTest('Injected Wallets Import', () => {
        return injectedModule && typeof injectedModule === 'function';
      }, 'Injected wallets module should be available');
      
      // Test 6: Onboard Configuration
      this.addTest('Onboard Configuration', () => {
        return this.onboard && typeof this.onboard === 'object';
      }, 'Onboard should be configured successfully');
      
      // Test 7: Web3 Utility Functions
      this.addTest('Web3 Utility Functions', () => {
        if (!this.web3) return false;
        const address = '0x742d35cc6634c0532925a3b8d0c0e4c8e4c8e4c8';
        const checksummed = this.web3.utils.toChecksumAddress(address);
        return checksummed && checksummed !== address;
      }, 'Web3 utility functions should work');
      
      // Test 8: Contract Creation
      this.addTest('Contract Creation', () => {
        if (!this.web3) return false;
        const mockABI = [{ "constant": true, "inputs": [], "name": "name", "outputs": [{"name": "", "type": "string"}], "type": "function" }];
        const contract = new this.web3.eth.Contract(mockABI, '0x0000000000000000000000000000000000000000');
        return contract && typeof contract === 'object';
      }, 'Web3 contract creation should work');
      
      // Test 9: Window.ethereum Check
      this.addTest('Window.ethereum Check', () => {
        return typeof window !== 'undefined' && window.ethereum;
      }, 'Window.ethereum should be available (if wallet is connected)');
      
      // Test 10: Network Check
      this.addTest('Network Check', () => {
        if (!this.web3) return false;
        return this.web3.currentProvider && this.web3.currentProvider.host;
      }, `Provider: ${this.web3?.currentProvider?.host || 'Not connected'}`);
    },
    
    addTest(name, testFn, message) {
      try {
        const passed = testFn();
        this.testResults.push({
          name,
          passed,
          message,
          details: passed ? null : 'Test function returned false or threw an error'
        });
      } catch (error) {
        this.testResults.push({
          name,
          passed: false,
          message,
          details: error.message
        });
      }
    },
    
    async testWalletConnection() {
      if (!this.onboard) {
        alert('Onboard not initialized');
        return;
      }
      
      try {
        const wallets = await this.onboard.connectWallet();
        if (wallets && wallets.length > 0) {
          const wallet = wallets[0];
          this.addTest('Wallet Connection', () => true, `Connected to ${wallet.label}`);
          this.addTest('Wallet Provider', () => wallet.provider, 'Wallet provider available');
          this.addTest('Wallet Accounts', () => wallet.accounts && wallet.accounts.length > 0, `Account: ${wallet.accounts[0]?.address || 'None'}`);
        } else {
          this.addTest('Wallet Connection', () => false, 'No wallet connected');
        }
      } catch (error) {
        this.addTest('Wallet Connection', () => false, `Connection failed: ${error.message}`);
      }
    },
    
    async testContractInteraction() {
      if (!this.web3) {
        alert('Web3 not initialized');
        return;
      }
      
      try {
        // Test getting block number
        const blockNumber = await this.web3.eth.getBlockNumber();
        this.addTest('Block Number', () => blockNumber > 0, `Current block: ${blockNumber}`);
        
        // Test getting gas price
        const gasPrice = await this.web3.eth.getGasPrice();
        this.addTest('Gas Price', () => gasPrice > 0, `Gas price: ${this.web3.utils.fromWei(gasPrice, 'gwei')} Gwei`);
        
        // Test getting network ID
        const networkId = await this.web3.eth.net.getId();
        this.addTest('Network ID', () => networkId === 1, `Network ID: ${networkId} (should be 1 for mainnet)`);
        
        // Test SharedStake contract addresses
        this.addTest('Contract Addresses', () => {
          return addresses && Object.keys(addresses).length > 0;
        }, `Found ${Object.keys(addresses || {}).length} contract addresses`);
        
        // Test contract creation
        if (addresses && ABIs) {
          try {
            const validatorContract = new this.web3.eth.Contract(ABIs.validator, addresses.validator);
            this.addTest('Validator Contract', () => validatorContract, 'Validator contract created successfully');
            
            const vEth2Contract = new this.web3.eth.Contract(ABIs.vEth2, addresses.vEth2);
            this.addTest('vEth2 Contract', () => vEth2Contract, 'vEth2 contract created successfully');
            
            const sgtContract = new this.web3.eth.Contract(ABIs.SGT, addresses.SGT);
            this.addTest('SGT Contract', () => sgtContract, 'SGT contract created successfully');
            
            // Test geyser contracts
            if (addresses.geyser_vEth2) {
              const geyserContract = new this.web3.eth.Contract(ABIs.geyser, addresses.geyser_vEth2);
              this.addTest('Geyser Contract', () => geyserContract, 'Geyser contract created successfully');
            }
            
          } catch (error) {
            this.addTest('Contract Creation', () => false, `Contract creation failed: ${error.message}`);
          }
        }
        
      } catch (error) {
        this.addTest('Contract Interaction', () => false, `Interaction failed: ${error.message}`);
      }
    },
    
    async testStakeUnstakeRoutes() {
      this.addTest('Stake Route Available', () => {
        return this.$router.resolve({ name: 'Stake' }).resolved.matched.length > 0;
      }, 'Stake route is accessible');
      
      this.addTest('Earn Route Available', () => {
        return this.$router.resolve({ name: 'Earn' }).resolved.matched.length > 0;
      }, 'Earn route is accessible');
      
      this.addTest('Withdraw Route Available', () => {
        return this.$router.resolve({ name: 'Withdraw' }).resolved.matched.length > 0;
      }, 'Withdraw route is accessible');
      
      this.addTest('Wrap Route Available', () => {
        return this.$router.resolve({ name: 'Wrap' }).resolved.matched.length > 0;
      }, 'Wrap route is accessible');
      
      this.addTest('Unwrap Route Available', () => {
        return this.$router.resolve({ name: 'Unwrap' }).resolved.matched.length > 0;
      }, 'Unwrap route is accessible');
    },
    
    async testStoreIntegration() {
      try {
        // Test if store is available
        this.addTest('Vuex Store', () => {
          return this.$store && typeof this.$store === 'object';
        }, 'Vuex store is available');
        
        // Test if Web3 is stored in store
        this.addTest('Web3 in Store', () => {
          return this.$store.state.web3 && typeof this.$store.state.web3 === 'object';
        }, 'Web3 instance stored in Vuex store');
        
        // Test if address is stored
        this.addTest('Address in Store', () => {
          return this.$store.state.address && typeof this.$store.state.address === 'string';
        }, `Address stored: ${this.$store.state.address || 'None'}`);
        
        // Test if wallet is stored
        this.addTest('Wallet in Store', () => {
          return this.$store.state.wallet && typeof this.$store.state.wallet === 'string';
        }, `Wallet stored: ${this.$store.state.wallet || 'None'}`);
        
      } catch (error) {
        this.addTest('Store Integration', () => false, `Store test failed: ${error.message}`);
      }
    }
  }
}
</script>