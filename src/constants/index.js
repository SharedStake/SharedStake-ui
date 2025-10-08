/**
 * Shared constants for the application
 * Centralizes common values and configuration
 */

// Network configuration
export const NETWORKS = {
  MAINNET: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    explorerUrl: 'https://etherscan.io'
  },
  SEPOLIA: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    explorerUrl: 'https://sepolia.etherscan.io'
  },
  GOERLI: {
    chainId: 5,
    name: 'Goerli Testnet',
    rpcUrl: 'https://goerli.infura.io/v3/',
    explorerUrl: 'https://goerli.etherscan.io'
  }
};

// Token configuration
export const TOKENS = {
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000'
  },
  SGT: {
    symbol: 'SGT',
    name: 'SharedStake Governance Token',
    decimals: 18,
    address: '0x24C19F7101c1731b85F1127EaA0407732E36EcDD'
  },
  SGETH: {
    symbol: 'sgETH',
    name: 'SharedStake ETH',
    decimals: 18
  },
  WSGETH: {
    symbol: 'wsgETH',
    name: 'Wrapped SharedStake ETH',
    decimals: 18
  }
};

// Contract addresses
export const CONTRACTS = {
  MAINNET: {
    SGT: '0x24C19F7101c1731b85F1127EaA0407732E36EcDD',
    SGETH: '0x5e74C9036fb86BD7eCdcb084a6773E4A1Ec9AF9b',
    WSGETH: '0x5e74C9036fb86BD7eCdcb084a6773E4A1Ec9AF9b'
  },
  SEPOLIA: {
    SGT: '0x24C19F7101c1731b85F1127EaA0407732E36EcDD',
    SGETH: '0x5e74C9036fb86BD7eCdcb084a6773E4A1Ec9AF9b',
    WSGETH: '0x5e74C9036fb86BD7eCdcb084a6773E4A1Ec9AF9b'
  }
};

// UI configuration
export const UI_CONFIG = {
  ANIMATION_DURATION: 300,
  NOTIFICATION_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 1000,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  SUPPORTED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg']
};

// API configuration
export const API_CONFIG = {
  BASE_URL: process.env.VUE_APP_API_URL || 'https://api.sharedstake.finance',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// Validation rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  PRIVATE_KEY: /^[a-fA-F0-9]{64}$/,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 20
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  INVALID_ADDRESS: 'Please enter a valid Ethereum address.',
  INSUFFICIENT_FUNDS: 'Insufficient funds for this transaction.',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  USER_REJECTED: 'Transaction was cancelled by user.',
  GAS_ESTIMATION_FAILED: 'Gas estimation failed. Please try again.',
  CONTRACT_NOT_FOUND: 'Contract not found on this network.',
  INVALID_AMOUNT: 'Please enter a valid amount.',
  AMOUNT_TOO_LARGE: 'Amount is too large.',
  AMOUNT_TOO_SMALL: 'Amount is too small.',
  UNKNOWN_ERROR: 'An unknown error occurred.'
};

// Success messages
export const SUCCESS_MESSAGES = {
  TRANSACTION_SUCCESS: 'Transaction completed successfully!',
  COPIED_TO_CLIPBOARD: 'Copied to clipboard!',
  SAVED_SUCCESSFULLY: 'Saved successfully!',
  UPDATED_SUCCESSFULLY: 'Updated successfully!',
  DELETED_SUCCESSFULLY: 'Deleted successfully!'
};

// Loading messages
export const LOADING_MESSAGES = {
  CONNECTING_WALLET: 'Connecting to wallet...',
  LOADING_BALANCE: 'Loading balance...',
  ESTIMATING_GAS: 'Estimating gas...',
  CONFIRMING_TRANSACTION: 'Confirming transaction...',
  PROCESSING_TRANSACTION: 'Processing transaction...',
  LOADING_DATA: 'Loading data...',
  SAVING_DATA: 'Saving data...'
};

// Social media links
export const SOCIAL_LINKS = {
  TWITTER: 'https://twitter.com/ChimeraDefi',
  DISCORD: 'https://discord.gg/C9GhCv86My',
  GITHUB: 'https://github.com/SharedStake',
  MEDIUM: 'https://medium.com/@chimera_defi',
  DOCS: 'https://docs.sharedstake.finance/',
  DAO: 'https://snapshot.page/#/sharedstake.eth',
  DUNE: 'https://duneanalytics.com/sushi2000/shared-stake-metrics',
  SHAREDTOOLS: 'https://sharedtools.org'
};

// Trading links
export const TRADING_LINKS = {
  UNISWAP: 'https://app.uniswap.org/#/swap?outputCurrency=0x24C19F7101c1731b85F1127EaA0407732E36EcDD',
  COWSWAP: 'https://swap.cow.fi/#/1/swap/ETH/0x24C19F7101c1731b85F1127EaA0407732E36EcDD',
  CURVE: 'https://curve.fi/factory/49'
};

// Default values
export const DEFAULTS = {
  GAS_LIMIT: 200000,
  GAS_PRICE: 20,
  SLIPPAGE_TOLERANCE: 0.5, // 0.5%
  DEADLINE: 20, // 20 minutes
  PAGE_SIZE: 10,
  CACHE_TTL: 300000, // 5 minutes
  RETRY_DELAY: 1000,
  MAX_RETRIES: 3
};

// Feature flags
export const FEATURES = {
  ENABLE_ANALYTICS: process.env.VUE_APP_ENABLE_ANALYTICS === 'true',
  ENABLE_DEBUG: process.env.VUE_APP_ENABLE_DEBUG === 'true',
  ENABLE_TESTNET: process.env.VUE_APP_ENABLE_TESTNET === 'true',
  ENABLE_BLOG: true,
  ENABLE_FAQ: true,
  ENABLE_STAKING: false, // Coming soon
  ENABLE_WITHDRAWAL: false // Coming soon
};