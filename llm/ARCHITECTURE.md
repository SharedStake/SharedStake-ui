# SharedStake UI - System Architecture

**Last Updated:** December 29, 2025  
**Status:** Production Architecture Documentation

---

## Overview

SharedStake UI is a Vue 3-based decentralized application (dApp) for liquid staking on Ethereum. The application provides a modern, performant interface for users to stake ETH, earn rewards, and manage their liquid staking positions.

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Browser                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Vue 3 UI   │  │  Pinia Store │  │  Vue Router  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │  ethers.js v6  │                        │
│                    │   Web3 Client  │                        │
│                    └───────┬────────┘                        │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             │ JSON-RPC
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                    Ethereum Network                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Mainnet     │  │  Sepolia     │  │  Goerli      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Smart Contracts (Ethereum)                  │    │
│  │  - SharedStake.sol                                  │    │
│  │  - vEth2Token.sol                                   │    │
│  │  - Geyser.sol / GeyserV2.sol                       │    │
│  │  - Withdrawals.sol                                 │    │
│  │  - Migrator.sol                                    │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend Framework
- **Vue 3.5.25** - Progressive JavaScript framework
  - Composition API for component logic
  - Reactive state management
  - Component-based architecture

### State Management
- **Pinia 3.0.4** - Vue 3 state management
  - Stores: `wallet.js`, `onboard.js`
  - Reactive state for wallet connection and app state
  - Type-safe store definitions

### Routing
- **Vue Router 4.6.3** - Client-side routing
  - Route definitions: `/`, `/stake`, `/earn`, `/withdraw`, `/blog`
  - Dynamic routes for blog posts
  - Navigation guards for protected routes

### Web3 Integration
- **ethers.js 6.16.0** - Ethereum JavaScript library
  - Provider management (BrowserProvider)
  - Contract interaction (Contract instances)
  - Transaction handling
  - Event listening

### Build System
- **Vite 7.2.6** - Next-generation build tool
  - Fast HMR (Hot Module Replacement)
  - Optimized production builds
  - Code splitting and tree-shaking
  - Plugin system for Vue support

### Runtime
- **Bun 1.2.23+** - JavaScript runtime and package manager
  - Fast package installation
  - Built-in bundler
  - Native TypeScript support
  - Faster than Node.js for many operations

### Styling
- **Tailwind CSS 3.4.18** - Utility-first CSS framework
  - Responsive design utilities
  - Custom theme configuration
  - PostCSS processing

### Additional Libraries
- **marked 16.4.1** - Markdown parsing for blog posts
- **bignumber.js 9.3.1** - Arbitrary precision decimal arithmetic
- **axios 1.13.2** - HTTP client for API calls
- **vue-toastification 2.0.0-rc.5** - Toast notifications

---

## Component Architecture

### Component Structure

```
src/
├── components/
│   ├── Common/          # Reusable components
│   │   ├── ApproveButton.vue
│   │   ├── ConnectButton.vue
│   │   ├── DappTxBtn.vue
│   │   └── ...
│   ├── Stake/           # Staking functionality
│   │   ├── Stake.vue
│   │   ├── Wrap.vue
│   │   └── Unwrap.vue
│   ├── Earn/            # Earning/rewards
│   │   ├── Earn.vue
│   │   ├── claim.vue
│   │   └── geyser.vue
│   ├── Withdraw/        # Withdrawal functionality
│   │   ├── Withdraw.vue
│   │   └── ...
│   ├── Blog/            # Blog system
│   │   ├── Blog.vue
│   │   ├── BlogPost.vue
│   │   └── posts/       # Markdown blog posts
│   └── Landing/         # Landing page
│       └── Landing.vue
├── stores/              # Pinia stores
│   ├── wallet.js        # Wallet state management
│   └── init/
│       └── onboard.js   # Web3Onboard initialization
├── router/              # Vue Router configuration
│   └── index.js
├── contracts/           # Smart contract ABIs and addresses
│   ├── abis/           # Contract ABIs
│   └── addresses/      # Network-specific addresses
└── utils/              # Utility functions
    ├── bignumber.js    # BigNumber utilities
    ├── markdown.js     # Markdown parsing
    └── ...
```

### Component Patterns

#### 1. Composition API Pattern
All components use Vue 3 Composition API:
```javascript
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from '@/stores/wallet'

const store = useStore()
const amount = ref('')
const isConnected = computed(() => store.isConnected)
</script>
```

#### 2. Pinia Store Pattern
State management through Pinia stores:
```javascript
import { defineStore } from 'pinia'

export const useWalletStore = defineStore('wallet', {
  state: () => ({
    isConnected: false,
    address: null
  }),
  actions: {
    async connect() { /* ... */ }
  }
})
```

#### 3. Contract Interaction Pattern
Standardized contract interaction:
```javascript
import { ethers } from 'ethers'
import contractABI from '@/contracts/abis/sharedStake.json'
import contractAddresses from '@/contracts/addresses/mainnet.json'

const provider = new ethers.BrowserProvider(window.ethereum)
const signer = await provider.getSigner()
const contract = new ethers.Contract(
  contractAddresses.sharedStake,
  contractABI,
  signer
)
```

---

## Data Flow

### Wallet Connection Flow

```
User clicks "Connect Wallet"
    ↓
Web3Onboard initializes
    ↓
User selects wallet (MetaMask, etc.)
    ↓
Wallet connects → Provider available
    ↓
Pinia store updates (isConnected, address)
    ↓
UI updates reactively
```

### Transaction Flow

```
User initiates transaction (stake, withdraw, etc.)
    ↓
Component calls contract method via ethers.js
    ↓
Transaction sent to network
    ↓
Transaction hash returned
    ↓
User confirms in wallet
    ↓
Transaction mined
    ↓
Event emitted from contract
    ↓
UI updates with new state
```

### State Management Flow

```
Component Action
    ↓
Pinia Store Action
    ↓
Contract Call (ethers.js)
    ↓
State Update (Pinia)
    ↓
Reactive UI Update (Vue)
```

---

## Smart Contract Integration

### Contract Addresses

Contracts are organized by network:
- **Mainnet**: `src/contracts/addresses/mainnet.json`
- **Sepolia**: `src/contracts/addresses/sepolia.json`
- **Goerli**: `src/contracts/addresses/goerli.json`

### Contract ABIs

All contract ABIs stored in `src/contracts/abis/`:
- `sharedStake.json` - Main staking contract
- `vEth2Token.json` - Liquid staking token
- `geyser.json` / `geyserV2.json` - Rewards contracts
- `withdrawals.json` - Withdrawal functionality
- `migrator.json` - Migration functionality

### Contract Interaction Pattern

```javascript
// 1. Get provider and signer
const provider = new ethers.BrowserProvider(window.ethereum)
const signer = await provider.getSigner()

// 2. Create contract instance
const contract = new ethers.Contract(
  address,
  abi,
  signer
)

// 3. Call contract method
const tx = await contract.methodName(params)
await tx.wait()

// 4. Listen for events
contract.on('EventName', (event) => {
  // Handle event
})
```

---

## Build & Deployment

### Development Build
```bash
bun run dev
# Starts Vite dev server on http://localhost:5173
# Hot Module Replacement (HMR) enabled
```

### Production Build
```bash
bun run build
# Output: dist/
# - Optimized JavaScript bundles
# - Minified CSS
# - Optimized assets
# - Code splitting applied
```

### Build Process
1. **Vite processes Vue files** → JavaScript modules
2. **PostCSS processes Tailwind** → CSS
3. **Code splitting** → Multiple chunks
4. **Tree shaking** → Remove unused code
5. **Minification** → Optimize bundle size
6. **Asset optimization** → Images, fonts, etc.

---

## Performance Optimizations

### Code Splitting
- Route-based code splitting (Vue Router)
- Dynamic imports for heavy components
- Lazy loading for blog posts

### Asset Optimization
- Image lazy loading with Intersection Observer
- Optimized image formats (WebP where supported)
- Asset compression

### Bundle Optimization
- Tree shaking (remove unused code)
- Minification (reduce bundle size)
- Vendor chunk separation

### Runtime Optimizations
- Vue 3 reactivity optimizations
- Computed properties caching
- Memoization for expensive operations

---

## Security Architecture

### Wallet Security
- **Web3Onboard** - Secure wallet connection
- **No private key storage** - Keys never leave wallet
- **Transaction signing** - All transactions signed in wallet

### Contract Security
- **ABI validation** - Contract ABIs verified
- **Address validation** - Contract addresses validated per network
- **Error handling** - Comprehensive error handling for failed transactions

### Frontend Security
- **No sensitive data in code** - No API keys or secrets
- **HTTPS only** - Production served over HTTPS
- **CSP headers** - Content Security Policy (if configured)

---

## Monitoring & Analytics

### Performance Monitoring
- **Core Web Vitals** - Real-time performance tracking
- **Lazy loading metrics** - Track lazy-loaded components
- **Bundle size monitoring** - Track bundle size over time

### Error Tracking
- **Console error logging** - Development error tracking
- **User error reporting** - Production error tracking (if configured)

---

## Environment Configuration

### Environment Variables
- `.env` - Local development
- `.env.example` - Template for environment variables
- RPC URLs configurable per environment

### Network Configuration
- Network detection via `window.ethereum`
- Fallback RPC providers
- Network switching support

---

## Future Architecture Considerations

### Planned Improvements
1. **TypeScript Migration** - Full TypeScript support
2. **Testing Infrastructure** - Vitest + Playwright
3. **Service Worker** - Offline support
4. **GraphQL API** - Backend API integration (if needed)
5. **Micro-frontends** - Modular architecture (if scaling)

### Scalability
- Component-based architecture supports scaling
- Pinia stores can be split by domain
- Route-based code splitting reduces initial load
- Lazy loading supports large applications

---

## Related Documentation

- **[DESIGN.md](./DESIGN.md)** - Design system and UI/UX guidelines
- **[DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md)** - Development environment setup
- **[README.md](./README.md)** - Project overview and status
- **[IMPROVED_GAP_ANALYSIS_TEMPLATE.md](./IMPROVED_GAP_ANALYSIS_TEMPLATE.md)** - Gap analysis methodology
- **[AGENT_HANDOFF.md](./AGENT_HANDOFF.md)** - Next steps for agent sessions

---

**Document Version:** 1.0  
**Last Updated:** December 29, 2025  
**Maintained By:** Development Team
