# Vue 3 Migration Plan for SharedStake UI

## Overview
This document outlines the comprehensive migration strategy from Vue 2 to Vue 3 for the SharedStake UI project.

## Current State Analysis

### Vue 2 Dependencies
- **Vue**: 2.7.16 (latest Vue 2)
- **Vue Router**: 3.6.5
- **Vuex**: 3.6.2
- **Vue CLI**: 5.0.9
- **Vue Test Utils**: 1.3.6 (Vue 2 compatible)

### Component Structure
- **Total Components**: ~25+ components across 8 main categories
- **Main Components**: Stake, Earn, Withdraw, Blog, Landing, Navigation
- **Architecture**: Options API with Vuex state management
- **Routing**: Nested routes with lazy loading

### Key Features to Migrate
1. **Web3 Integration**: ethers.js v6 (already modernized)
2. **State Management**: Vuex with modules
3. **Routing**: Nested routes with preloading
4. **UI Components**: Custom components with Tailwind CSS
5. **Blog System**: Markdown-based blog with SEO
6. **Testing**: Vitest + Vue Test Utils + Playwright

## Migration Strategy

### Phase 1: Preparation & Setup (Week 1-2)

#### 1.1 Create Migration Branch
```bash
git checkout -b vue3-migration
```

#### 1.2 Update Dependencies
```json
{
  "vue": "^3.4.0",
  "vue-router": "^4.2.0",
  "pinia": "^2.1.0",
  "@vue/test-utils": "^2.4.0",
  "vue-template-compiler": "REMOVE"
}
```

#### 1.3 Install Vue 3 Dependencies
```bash
yarn add vue@^3.4.0 vue-router@^4.2.0 pinia@^2.1.0
yarn add -D @vue/test-utils@^2.4.0 @vitejs/plugin-vue@^5.0.0
yarn remove vue-template-compiler
```

#### 1.4 Update Build Configuration
- Replace Vue CLI with Vite
- Update PostCSS and Tailwind configuration
- Configure Vue 3 plugin for Vite

### Phase 2: Core Migration (Week 3-4)

#### 2.1 Update Main Application
- **File**: `src/main.js`
- **Changes**:
  - Replace `new Vue()` with `createApp()`
  - Update plugin registration
  - Migrate global error handling

#### 2.2 Migrate Router
- **File**: `src/router/index.js`
- **Changes**:
  - Update Vue Router 4 syntax
  - Migrate route definitions
  - Update navigation guards
  - Preserve preloading logic

#### 2.3 Migrate State Management
- **Files**: `src/store/` directory
- **Changes**:
  - Replace Vuex with Pinia
  - Convert modules to Pinia stores
  - Update component state access
  - Migrate actions and getters

### Phase 3: Component Migration (Week 5-8)

#### 3.1 Migration Order (Low Risk → High Risk)
1. **Static Components**: FAQ, Privacy, Terms
2. **Simple Components**: Navigation, Common utilities
3. **Complex Components**: Stake, Earn, Withdraw
4. **Blog System**: Blog components and routing

#### 3.2 Component Migration Pattern
For each component:
1. Update template syntax (if needed)
2. Convert Options API to Composition API
3. Update state management calls
4. Update event handling
5. Test functionality

#### 3.3 Key Component Updates

**Stake Component**:
- Convert complex state logic to Composition API
- Update ethers.js integration
- Migrate form handling and validation

**Earn Component**:
- Update reward calculation logic
- Migrate Web3 interactions
- Update progress tracking

**Blog System**:
- Update markdown parsing
- Migrate SEO meta handling
- Update routing for blog posts

### Phase 4: Testing & Validation (Week 9-10)

#### 4.1 Update Test Suite
- Migrate unit tests to Vue 3
- Update test utilities and mocks
- Ensure E2E tests work with new routing

#### 4.2 Performance Testing
- Bundle size analysis
- Runtime performance comparison
- Memory usage optimization

#### 4.3 Browser Compatibility
- Test across target browsers
- Verify Web3 wallet integrations
- Validate responsive design

## Detailed Migration Steps

### Step 1: Update package.json
```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0"
  },
  "devDependencies": {
    "@vue/test-utils": "^2.4.0",
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

### Step 2: Create Vite Configuration
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '~': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 8080
  }
})
```

### Step 3: Update main.js
```javascript
// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import '../public/assets/styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && (
    event.reason.message?.includes('reverse') || 
    event.reason.message?.includes('ENS') ||
    event.reason.message?.includes('Internal error')
  )) {
    console.warn('ENS resolution failed (non-critical):', event.reason.message);
    event.preventDefault();
  }
});

app.mount('#app')
```

### Step 4: Migrate Router
```javascript
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ... existing routes
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
})

// Preload critical routes
router.beforeEach((to, from, next) => {
  const criticalRoutes = ['/stake', '/earn', '/withdraw'];
  
  if (criticalRoutes.includes(to.path)) {
    const nextRoute = criticalRoutes[criticalRoutes.indexOf(to.path) + 1];
    if (nextRoute) {
      setTimeout(() => {
        import(`../components${nextRoute === '/stake' ? '/Stake/Stake.vue' : 
          nextRoute === '/earn' ? '/Earn/Earn.vue' : 
          '/Withdraw/Withdraw.vue'}`);
      }, 1000);
    }
  }
  
  next();
});

export default router
```

### Step 5: Migrate State Management
```javascript
// src/stores/wallet.js
import { defineStore } from 'pinia'

export const useWalletStore = defineStore('wallet', {
  state: () => ({
    address: null,
    ethersProvider: null,
    walletname: null,
    network: null,
  }),
  
  getters: {
    userAddress: (state) => state.address,
    isAuth: (state) => !!state.address,
    ethersProvider: (state) => state.ethersProvider,
  },
  
  actions: {
    setAddress(address) {
      this.address = address
    },
    setProvider(provider) {
      this.ethersProvider = provider
    },
    // ... other actions
  }
})
```

## Risk Mitigation

### 1. Incremental Migration
- Migrate one component at a time
- Maintain feature parity at each step
- Test thoroughly after each migration

### 2. Rollback Strategy
- Keep Vue 2 branch as backup
- Document all changes for easy rollback
- Test rollback procedure

### 3. Testing Strategy
- Unit tests for each migrated component
- Integration tests for critical flows
- E2E tests for user journeys
- Performance regression testing

## Success Criteria

### Technical Metrics
- ✅ Zero build errors
- ✅ All tests passing
- ✅ Bundle size ≤ current size
- ✅ Performance ≥ current performance

### Functional Metrics
- ✅ All features working
- ✅ Web3 integrations functional
- ✅ Responsive design maintained
- ✅ SEO optimization preserved

## Timeline

| Week | Phase | Tasks |
|------|-------|-------|
| 1-2 | Preparation | Setup, dependencies, build config |
| 3-4 | Core Migration | Main app, router, state management |
| 5-8 | Component Migration | All components to Composition API |
| 9-10 | Testing & Validation | Tests, performance, compatibility |

## Post-Migration Benefits

1. **Security**: Eliminate Vue 2 vulnerabilities
2. **Performance**: Better tree-shaking and optimization
3. **Developer Experience**: Composition API, better TypeScript support
4. **Future-Proof**: Access to latest Vue ecosystem
5. **Maintainability**: Modern patterns and best practices

## Next Steps

1. Create migration branch
2. Set up Vite build system
3. Begin with core application migration
4. Migrate components incrementally
5. Comprehensive testing and validation

---

*This migration plan ensures a smooth transition to Vue 3 while maintaining all current functionality and improving the overall codebase quality.*