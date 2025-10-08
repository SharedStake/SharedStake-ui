# 🛠️ Development Setup Guide

## ⚠️ **CRITICAL: Use Bun, NOT npm**

This project uses **Bun** as the package manager and build tool. **DO NOT** use npm or yarn.

### **Installation Commands**
```bash
# Install bun locally (if not already installed)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build

# Run linting
bun run lint
```

### **Why Bun?**
- **Faster**: 3-10x faster than npm/yarn
- **Built-in bundler**: No need for webpack configuration
- **TypeScript support**: Native TypeScript support
- **Project requirement**: This project is specifically configured for Bun

### **Common Commands**
```bash
# Development
bun run dev          # Start development server
bun run serve        # Alternative dev command

# Building
bun run build        # Production build
bun run build:analyze # Build with bundle analysis

# Code Quality
bun run lint         # Run ESLint
bun run lint:fix     # Fix ESLint issues
bun run type-check   # TypeScript type checking

# Utilities
bun run clean        # Clean build artifacts
bun run optimize:images # Optimize images
```

### **Project Structure**
- **Package Manager**: Bun (bun.lock file)
- **Build Tool**: Vue CLI Service (via Bun)
- **Framework**: Vue 2.7.16
- **Styling**: Tailwind CSS
- **TypeScript**: Supported

### **Troubleshooting**
If you see errors about missing modules:
1. Make sure you're using `bun` not `npm`
2. Run `bun install` to install dependencies
3. Check that bun is in your PATH: `bun --version`

### **Remember**
- ✅ **Use**: `bun install`, `bun run build`, `bun run dev`
- ❌ **Don't use**: `npm install`, `npm run build`, `npm run dev`
- ❌ **Don't use**: `yarn install`, `yarn build`, `yarn dev`

This project is optimized for Bun and may not work correctly with other package managers.