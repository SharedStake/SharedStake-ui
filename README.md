# SharedStake UI

[![Website](https://img.shields.io/badge/Website-sharedstake.org-blue?style=for-the-badge)](https://sharedstake.org)
[![Twitter](https://img.shields.io/badge/Twitter-@ChimeraDefi-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/ChimeraDefi)
[![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/C9GhCv86My)

Vue.js implementation of SharedStake DeFi protocol with optimized Bun-based build system.

## 🚀 Quick Start

### Prerequisites
- **Bun**: >= 1.0.0 (recommended for fastest performance)
- **Node.js**: 18+ (fallback option)

### Setup
```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install

# Start development server
bun run dev
```

### Development Commands
```bash
bun run dev      # Development server
bun run build    # Production build
bun run lint     # Code linting
```

### Local Contract Deploy + UI Sync
```bash
# 1) Ensure SharedDeposit submodule is present
bun run contracts:init

# 2) Start a mainnet fork on localhost:8545
~/.foundry/bin/anvil --fork-url "$MAINNET_RPC_URL" --host 127.0.0.1 --port 8545 --chain-id 31337

# 3) Deploy SharedDeposit to localhost fork and sync UI addresses
bun run contracts:deploy:local

# 4) Verify UI address map matches latest deployment
bun run contracts:drift:local
```

`contracts:deploy:local` exports normalized deployment addresses to
`scripts/contracts/generated/shareddeposit-localhost-addresses.json` and syncs
`src/contracts/addresses/local.json`.
It prefers `yarn --frozen-lockfile` inside `SharedDeposit` when `yarn.lock` exists.

### One-Command Fork E2E
```bash
# If no local fork is already running, provide an RPC URL for Anvil:
export MAINNET_RPC_URL="https://your-mainnet-rpc"

# Starts/reuses local fork, deploys contracts, syncs addresses, checks drift, runs browser E2E
bun run test:e2e:fork

# Same as above, plus wallet-extension E2E (requires wallet env vars)
bun run test:e2e:fork:wallet
```

`test:e2e:fork:wallet` defaults to strict real wallet connection
(`PW_WALLET_ENFORCE_REAL_CONNECT=true`) unless overridden, and now seeds
`PW_WALLET_TEST_ADDRESS` to a deterministic ETH balance before wallet tests.
Use `PW_WALLET_SEED_ETH` or `--seed-wallet-eth` to override (default: `5`).
It also defaults wallet Playwright runs to headless mode
(`PW_WALLET_HEADLESS=true`) to avoid X server requirements in CI/sandbox runs.

Base fork E2E now includes an injected-wallet tx flow test (`stake + approve + unstake`)
that uses an impersonated address on the local fork. Configure with:
- `E2E_IMPERSONATOR_ADDRESS` or `--impersonator-address`
- `E2E_IMPERSONATOR_SEED_ETH` or `--impersonator-seed-eth`

### Wallet E2E (Extension-Based)
```bash
# 1) Copy and fill wallet test env
cp .env.e2e.wallet.example .env.e2e.wallet
set -a; source .env.e2e.wallet; set +a

# 2) Run wallet E2E suite
bun run test:e2e:wallet

# 3) CI/strict wallet suite (fails if required wallet env is missing)
bun run test:e2e:wallet:strict
```

Notes:
- The wallet suite uses a separate Playwright config: `playwright.wallet.config.js`.
- `test:e2e:wallet` gracefully skips when wallet env vars are missing (local convenience).
- `test:e2e:wallet:strict` is recommended for CI and release gating.
- For fork/local E2E, set `VITE_ONBOARD_CHAIN_ID` and `VITE_ONBOARD_CHAIN_RPC_URL` (see `.env.example`).

## 📊 Project Status

**Tech Stack**: Vue 3.5.22 • Pinia 3.0.3 • Vite 7.1.12 • Bun 1.x • ethers.js v6.15.0 • Tailwind CSS 3.4.18

**Recent Achievements**: 
- ✅ Vue 2 → Vue 3 migration complete (Vue 3.5.22 + Pinia 3.0.3 + Vite 7.1.12)
- ✅ Web3.js → ethers.js v6 migration complete (eliminated 46 critical vulnerabilities)
- ✅ Bun migration (3-5x faster builds and package installation)
- ✅ Security improvements (vulnerability reduction from 250+ to 1 moderate)
- ✅ Blog system with 11 posts and comprehensive SEO (100/100 technical SEO score)
- ✅ Performance monitoring and lazy loading implementation

**Current Status**: Production ready with modern stack. See [`llm/README.md`](./llm/README.md) for detailed status and known issues.

## 🤖 AI Documentation

**📁 For AI Agents**: See [`/llm/`](./llm/) folder for comprehensive project context, migration history, and optimization guides. See [`.cursorrules`](.cursorrules) for project-specific AI guidelines.
