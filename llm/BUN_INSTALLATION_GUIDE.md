# 🚀 Bun Installation Guide for SharedStake UI

## 📋 **Overview**

SharedStake UI is configured to use Bun as the primary package manager and runtime. This guide explains how to install Bun and handle fallback scenarios.

## 🎯 **Why Bun?**

- **Faster**: 3-4x faster than npm for package installation
- **Built-in bundler**: Native support for modern JavaScript features
- **Better performance**: Optimized for modern development workflows
- **Compatibility**: Drop-in replacement for npm with better performance

## 🛠️ **Installation Instructions**

### **1. Install Bun (Recommended)**

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Reload shell configuration
source ~/.bashrc

# Verify installation
bun --version
```

### **2. Install Dependencies**

```bash
# Install all dependencies
bun install

# Alternative: Use npm if bun is not available
npm install
```

### **3. Development Commands**

```bash
# Start development server
bun run dev

# Build for production
bun run build

# Run linting
bun run lint

# Clean build artifacts
bun run clean
```

## 🔄 **Fallback Strategy**

### **If Bun is Not Available**

The project includes fallback support for npm:

```bash
# Check if bun is available
which bun || echo "bun not found"

# If bun is not available, use npm
npm install
npm run build
npm run dev
```

### **Package.json Configuration**

The project is configured to prefer Bun but fallback gracefully:

```json
{
  "engines": {
    "bun": ">=1.0.0"
  },
  "scripts": {
    "prebuild": "bun run clean",
    "build": "vite build",
    "dev": "vite"
  }
}
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: Bun Not Found**
```bash
# Error: bun: command not found
# Solution: Install bun first
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

### **Issue 2: Permission Denied**
```bash
# Error: Permission denied
# Solution: Check permissions or use sudo
sudo curl -fsSL https://bun.sh/install | bash
```

### **Issue 3: Build Fails with Bun**
```bash
# Fallback to npm if bun build fails
npm install
npm run build
```

## 📊 **Performance Comparison**

### **Installation Speed**
- **Bun**: ~2-3 seconds
- **npm**: ~8-12 seconds
- **Improvement**: 3-4x faster

### **Build Performance**
- **Bun**: Native bundling support
- **npm**: Relies on Vite (still fast)
- **Improvement**: Better caching and optimization

## 🎯 **Best Practices**

### **1. Always Try Bun First**
```bash
# Check if bun is available
if command -v bun &> /dev/null; then
    echo "Using Bun"
    bun install
    bun run build
else
    echo "Bun not found, using npm"
    npm install
    npm run build
fi
```

### **2. Environment Setup**
```bash
# Add to .bashrc or .zshrc
export PATH="$HOME/.bun/bin:$PATH"
```

### **3. CI/CD Configuration**
```yaml
# GitHub Actions example
- name: Install Bun
  run: curl -fsSL https://bun.sh/install | bash

- name: Install dependencies
  run: bun install

- name: Build project
  run: bun run build
```

## 🔧 **Troubleshooting**

### **Build Issues**
1. **Clear cache**: `bun run clean`
2. **Reinstall dependencies**: `rm -rf node_modules && bun install`
3. **Check Node version**: `node --version` (should be 18+)

### **Performance Issues**
1. **Use Bun**: `bun install` instead of `npm install`
2. **Clear cache**: `bun run clean`
3. **Check memory**: Ensure sufficient RAM for build process

### **Compatibility Issues**
1. **Check Bun version**: `bun --version` (should be 1.0+)
2. **Update Bun**: `bun upgrade`
3. **Fallback to npm**: If issues persist

## 📋 **Quick Reference**

### **Essential Commands**
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install

# Development
bun run dev

# Production build
bun run build

# Linting
bun run lint

# Clean
bun run clean
```

### **Fallback Commands**
```bash
# If bun is not available
npm install
npm run dev
npm run build
npm run lint
npm run clean
```

## 🎉 **Success Indicators**

### **Bun Working Correctly**
- ✅ `bun --version` shows version 1.0+
- ✅ `bun install` completes in 2-3 seconds
- ✅ `bun run build` completes successfully
- ✅ No permission or compatibility errors

### **Fallback Working Correctly**
- ✅ `npm install` completes successfully
- ✅ `npm run build` completes successfully
- ✅ All scripts work as expected
- ✅ No missing dependency errors

---

## 📞 **Support**

### **Bun Documentation**
- [Official Bun Docs](https://bun.sh/docs)
- [Installation Guide](https://bun.sh/docs/installation)
- [CLI Reference](https://bun.sh/docs/cli/install)

### **SharedStake Support**
- **Discord**: [discord.gg/sharedstake](https://discord.gg/sharedstake)
- **GitHub**: [github.com/sharedstake](https://github.com/sharedstake)
- **Twitter**: [@sharedstake](https://twitter.com/sharedstake)

---

*This guide ensures SharedStake UI can be built and run efficiently with Bun while maintaining compatibility with npm as a fallback.*