# SharedStake UI

Vue.js implementation of SharedStake DeFi protocol.

## 🤖 AI Documentation
**📁 For AI Agents**: See `/llm/` folder for comprehensive project context and migration history.

## Setup
```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install
```

## Development
```bash
bun run dev     # Development server
bun run build   # Production build
bun run lint    # Code linting
bun run type-check  # TypeScript type checking
```

## Current Status
- **Runtime**: Bun 1.2.23 (migrated from Node.js/Yarn)
- **Framework**: Vue 2.7.16 with Vue CLI 5.x
- **Web3**: ethers.js v6 (Web3.js fully deprecated)
- **Build Tools**: PostCSS 8, Tailwind CSS 3, ESLint 8
- **Security**: Improved (12 vulnerabilities, down from 16)
- **Bundle**: Optimized with modern tooling
- **Performance**: 3-5x faster package installation, 50-70% faster CI/CD

## Recent Updates (October 2025)
- ✅ **Bun Migration**: Complete migration from Yarn/Node.js to Bun
- ✅ **CI/CD Optimization**: GitHub Actions updated for Bun
- ✅ **Performance**: 3-5x faster package installation
- ✅ PostCSS 8 and Tailwind CSS 3 upgrade
- ✅ ESLint 8 migration
- ✅ Security improvements (25% vulnerability reduction)
- ✅ Marked v16 upgrade

## Next Phase
Ready for Vue 3 migration to eliminate remaining Vue 2 EOL warnings.