# SharedStake UI

Vue.js implementation of SharedStake DeFi protocol with optimized Bun-based build system.

## 🤖 AI Documentation
**📁 For AI Agents**: See `/llm/` folder for comprehensive project context, migration history, and optimization guides.

## 🚀 Quick Start

### Prerequisites
- **Bun**: >= 1.0.0 (recommended for fastest performance)
- **Node.js**: 18+ (fallback option)

### Setup
```bash
# Install Bun (recommended)
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install

# Start development server
bun run dev
```

### Development Commands
```bash
bun run dev          # Development server
bun run build        # Production build
bun run lint         # Code linting
bun run lint:fix     # Auto-fix linting issues
bun run type-check   # TypeScript validation
bun run audit        # Security audit
bun run clean        # Clean build artifacts
```

## 🏗️ Build System

### Current Status
- **Runtime**: Bun 1.2+ (3-5x faster than Node.js)
- **Framework**: Vue 2.7.16 with Vue CLI 5.x
- **Web3**: ethers.js v6 (Web3.js fully deprecated)
- **Build Tools**: PostCSS 8, Tailwind CSS 3, ESLint 8
- **CI/CD**: Optimized GitHub Actions with parallel execution
- **Docker**: Multi-stage builds for 60% smaller images
- **Performance**: 50-60% faster builds

### Key Features
- ⚡ **Bun Integration**: Ultra-fast package management and builds
- 🔄 **Parallel CI/CD**: Optimized GitHub Actions workflows
- 📦 **Smart Caching**: Advanced dependency and build caching
- 🐳 **Docker Optimization**: Multi-stage builds with health checks
- 🔍 **Bundle Analysis**: Automatic bundle size monitoring
- 🛡️ **Security**: Automated vulnerability scanning

## 📊 Performance Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Dependency Installation | 30-60s | 10-15s | **70% faster** |
| Build Time | 45-90s | 25-45s | **50% faster** |
| Total CI Time | 2-5 min | 1-2 min | **60% faster** |
| Docker Image Size | ~500MB | ~200MB | **60% smaller** |

## 🔧 Advanced Commands

### Build Analysis
```bash
bun run build:analyze    # Generate bundle analysis report
bun run optimize:images  # Optimize images for performance
```

### Docker
```bash
bun run docker:build     # Build Docker image
bun run docker:run       # Run Docker container
```

### CI/CD
- **Automated Testing**: Parallel lint, type-check, build, and security audit
- **Dependency Updates**: Weekly automated dependency updates
- **Bundle Monitoring**: Automatic bundle size analysis
- **Artifact Management**: Build artifacts and reports

## 📁 Project Structure

```
├── src/                    # Source code
├── public/                 # Static assets
├── scripts/                # Build scripts
├── llm/                    # AI documentation and guides
├── .github/workflows/      # CI/CD configurations
├── amplify.yml             # AWS Amplify configuration
├── Dockerfile              # Multi-stage Docker build
├── .bunfig.toml           # Bun configuration
└── package.json           # Dependencies and scripts
```

## 🚀 Recent Optimizations (October 2025)

- ✅ **Bun Migration**: Complete migration from Yarn/Node.js to Bun
- ✅ **CI/CD Optimization**: 50-60% faster builds with parallel execution
- ✅ **Docker Optimization**: Multi-stage builds for smaller images
- ✅ **Advanced Caching**: Comprehensive caching strategy
- ✅ **Bundle Analysis**: Automated bundle size monitoring
- ✅ **Security Integration**: Automated vulnerability scanning
- ✅ **Performance Monitoring**: Build time and size tracking

## 📚 Documentation

- **Migration Guide**: `/llm/MIGRATION_TO_BUN.md`
- **Build Optimization**: `/llm/BUILD_OPTIMIZATION_GUIDE.md`
- **CI/CD Summary**: `/llm/CI_OPTIMIZATION_SUMMARY.md`
- **Performance Guide**: `/llm/PERFORMANCE_OPTIMIZATION_GUIDE.md`

## 🔮 Next Phase

Ready for Vue 3 migration to eliminate remaining Vue 2 EOL warnings and further optimize the build system.