// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';
import './defi-commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Mock Web3 wallet for testing
Cypress.on('window:before:load', (win) => {
  // Mock ethereum provider
  win.ethereum = {
    isMetaMask: true,
    request: cy.stub().callsFake(({ method, params }) => {
      switch (method) {
        case 'eth_requestAccounts':
          return Promise.resolve(['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6']);
        case 'eth_accounts':
          return Promise.resolve(['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6']);
        case 'eth_chainId':
          return Promise.resolve('0x1');
        case 'eth_getBalance':
          return Promise.resolve('0x16345785d8a0000'); // 100 ETH in wei
        case 'wallet_switchEthereumChain':
          return Promise.resolve();
        case 'wallet_addEthereumChain':
          return Promise.resolve();
        default:
          return Promise.resolve();
      }
    }),
    on: cy.stub(),
    removeListener: cy.stub(),
  };

  // Mock Web3Onboard
  win.web3Onboard = {
    connectWallet: cy.stub().resolves([{
      accounts: [{
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        balance: '100.0',
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
    disconnectWallet: cy.stub().resolves(),
    setChain: cy.stub().resolves(),
  };
});