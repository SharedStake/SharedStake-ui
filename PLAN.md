# SharedStake UI - Upgrade and Maintenance Plan

## Goals
- Keep the app compiling, linting, and building reliably.
- Modernize dependencies conservatively to avoid breaking the Vue 2 UI.
- Document follow-ups for major upgrades or code rewrites.
- Address critical security vulnerabilities.

## Current Stack (Updated)
- **Node.js**: 18.x LTS (updated from 16.x)
- **Framework**: Vue 2.7.14, Vue Router 3, Vuex 3
- **Build tooling**: Vue CLI 5.x, Babel 7.x, ESLint 7.x
- **Styling**: Tailwind CSS 2 (PostCSS 7 compat), Autoprefixer 9
- **Web3**: `ethers@^6.12.1`, `web3@^1.10.4`, `@web3-onboard` packages

## Strategy
1. ✅ Align build tooling versions (Vue CLI 5.x for better Node.js 18 support)
2. ✅ Apply safe dependency upgrades within current major versions
3. ✅ Build and fix compile/runtime errors iteratively
4. ✅ Use Node.js 18.x LTS for better compatibility
5. 🚨 **NEXT**: Address critical security vulnerabilities
6. Plan larger upgrades (Vue 3, Tailwind 3+, PostCSS 8, ESLint 8)

## Risk Notes
- ✅ Node.js 18.x provides better compatibility than 16.x
- ✅ Vue CLI 5.x works well with Node.js 18.x
- 🚨 **CRITICAL**: Web3.js 1.10.4 has 46 critical security vulnerabilities
- `ethers@6` has API differences from v5; verify call sites

## Near-Term Tasks (Priority Order)

### 🚨 URGENT: Security Updates (1-2 weeks)
- [ ] **CRITICAL**: Update Web3.js from 1.10.4 to 4.x or migrate to ethers.js
- [ ] Update crypto-related dependencies (elliptic, secp256k1, etc.)
- [ ] Update axios to latest secure version
- [ ] Run security audit and fix critical vulnerabilities

### ✅ Completed Tasks
- [x] Align `@vue/cli-*` packages on v5.x
- [x] Update security-sensitive libs within safe range
- [x] Build, fix TS/JS errors, and run lints
- [x] Pin Node.js 18.x LTS in CI and local (`.nvmrc`)
- [x] Update all CI/CD configuration files

### Medium Priority (2-4 weeks)
- [ ] Update Tailwind CSS to v3.x with PostCSS 8
- [ ] Optimize bundle sizes (currently 2.46 MiB vendor, 1.08 MiB main)
- [ ] Optimize large images (vEth2_1.png: 8.58 MiB, tokenomics.png: 1.01 MiB)
- [ ] Implement code splitting and lazy loading

## Longer-Term Upgrades (post-stabilization)

### Phase 2: Framework Modernization (4-6 weeks)
- [ ] Migrate to Vue 3 + Vue Router 4 + Vuex → Pinia
- [ ] Move to Tailwind 3/4 + PostCSS 8
- [ ] Upgrade ESLint to v8 and config to latest `eslint-plugin-vue`
- [ ] Assess replacing legacy `web3` where not needed; consolidate on ethers

### Phase 3: Development Experience (2-4 weeks)
- [ ] Add TypeScript support
- [ ] Implement testing infrastructure (Vitest, Vue Test Utils, Playwright)
- [ ] Add development tools and debugging utilities
- [ ] Improve error handling and logging

### Phase 4: Performance & Monitoring (ongoing)
- [ ] Bundle size optimization
- [ ] Performance monitoring
- [ ] Advanced optimizations
- [ ] Analytics integration

## Best Practices To Adopt
- ✅ Lock Node version via `.nvmrc` and CI
- ✅ Run `yarn lint` and `yarn build` in CI for PRs
- [ ] Set up Dependabot/Renovate for automated upgrades
- [ ] Implement automated security scanning
- [ ] Add performance monitoring

## Security Status 🚨

### Critical Issues (46 Critical vulnerabilities)
- **Web3.js 1.10.4**: Multiple critical elliptic and crypto vulnerabilities
- **Vue template compiler**: XSS vulnerability
- **Crypto libraries**: sha.js, cipher-base, secp256k1 vulnerabilities

### Immediate Actions Required
1. **Update Web3.js**: Migrate to Web3.js 4.x or consolidate on ethers.js
2. **Update crypto dependencies**: Fix elliptic, secp256k1, and related packages
3. **Security audit**: Run `yarn audit` and fix all critical issues

## Current Status ✅

### Working Features
- ✅ Development server running on localhost:8080
- ✅ Build process successful (no compilation errors)
- ✅ Linting passes without errors
- ✅ Node.js 18.x LTS compatibility
- ✅ All CI/CD pipelines updated and working

### Build Output
- ✅ Vendor chunk: 2.46 MiB
- ✅ Main chunk: 1.08 MiB
- ✅ CSS: 3.59 MiB
- ✅ Images: 9.59 MiB (needs optimization)

## Next Immediate Steps

1. **Week 1**: Address critical security vulnerabilities
2. **Week 2**: Test Web3 functionality and wallet connections
3. **Week 3-4**: Plan Vue 3 migration strategy
4. **Month 2**: Begin framework modernization

---
**Last Updated:** September 24, 2025