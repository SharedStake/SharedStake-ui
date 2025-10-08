# 🔧 SharedStake Linting Guide

## 📚 Table of Contents

1. [Overview](#overview)
2. [Common Lint Errors](#common-lint-errors)
3. [ESLint Rules](#eslint-rules)
4. [Quick Fixes](#quick-fixes)
5. [Prevention Strategies](#prevention-strategies)
6. [CI/CD Integration](#cicd-integration)

---

## 🎯 Overview

This guide provides comprehensive information about linting in the SharedStake project, including common errors, fixes, and prevention strategies.

### **Current Linting Setup**
- **ESLint**: JavaScript/TypeScript linting
- **Vue ESLint Plugin**: Vue.js specific rules
- **Configuration**: `eslint.config.js`
- **Scripts**: `npm run lint` and `npm run lint:fix`

---

## 🚨 Common Lint Errors

### **1. Unused Variables (`no-unused-vars`)**

#### **Error Example**:
```javascript
// ❌ Error: 'error' is defined but never used
try {
  await someAsyncOperation();
} catch (error) {
  console.log('Operation failed');
}
```

#### **Fix**:
```javascript
// ✅ Option 1: Remove the variable
try {
  await someAsyncOperation();
} catch {
  console.log('Operation failed');
}

// ✅ Option 2: Use the variable
try {
  await someAsyncOperation();
} catch (error) {
  console.error('Operation failed:', error.message);
}
```

### **2. Undefined Variables (`no-undef`)**

#### **Error Example**:
```javascript
// ❌ Error: 'gtag' is not defined
gtag('event', 'page_view', { page_title: 'Home' });
```

#### **Fix**:
```javascript
// ✅ Check if variable exists
if (typeof window !== 'undefined' && window.gtag) {
  window.gtag('event', 'page_view', { page_title: 'Home' });
}

// ✅ Or use optional chaining
window.gtag?.('event', 'page_view', { page_title: 'Home' });
```

### **3. Vue v-html Security Warning (`vue/no-v-html`)**

#### **Error Example**:
```vue
<!-- ❌ Warning: 'v-html' directive can lead to XSS attack -->
<div v-html="userContent"></div>
```

#### **Fix**:
```vue
<!-- ✅ Add ESLint disable comment for trusted content -->
<!-- eslint-disable-next-line vue/no-v-html -->
<div v-html="trustedContent"></div>
```

### **4. Constant Binary Expression (`no-constant-binary-expression`)**

#### **Error Example**:
```javascript
// ❌ Warning: Unexpected constant truthiness
return true || window.ethereum;
```

#### **Fix**:
```javascript
// ✅ Remove unnecessary constant
return true;

// ✅ Or use proper conditional logic
return window.ethereum ? true : false;
```

### **5. Unused Imports**

#### **Error Example**:
```javascript
// ❌ Error: 'onMounted' is defined but never used
import { ref, computed, onMounted, onUnmounted } from 'vue';
```

#### **Fix**:
```javascript
// ✅ Remove unused imports
import { ref, computed } from 'vue';
```

---

## 📋 ESLint Rules

### **Vue.js Rules**

#### **vue/no-v-html**
- **Purpose**: Prevent XSS attacks from user content
- **Fix**: Add ESLint disable comment for trusted content
- **Example**:
```vue
<!-- eslint-disable-next-line vue/no-v-html -->
<div v-html="sanitizedContent"></div>
```

#### **vue/multi-word-component-names**
- **Purpose**: Ensure component names are descriptive
- **Status**: Disabled in project config
- **Reason**: Many components are single-word (e.g., `Blog`, `Stake`)

#### **vue/no-reserved-component-names**
- **Purpose**: Prevent conflicts with HTML elements
- **Status**: Disabled in project config
- **Reason**: Some components use reserved names intentionally

### **JavaScript Rules**

#### **no-unused-vars**
- **Purpose**: Prevent unused variables
- **Fix**: Remove unused variables or use them
- **Example**:
```javascript
// Remove unused parameter
catch {
  // Handle error without using error object
}

// Or use the parameter
catch (error) {
  console.error('Error:', error.message);
}
```

#### **no-undef**
- **Purpose**: Prevent undefined variables
- **Fix**: Check if variable exists before using
- **Example**:
```javascript
// Check for global variables
if (typeof window !== 'undefined' && window.gtag) {
  window.gtag('event', 'page_view');
}
```

#### **no-constant-binary-expression**
- **Purpose**: Prevent unnecessary constant expressions
- **Fix**: Remove constants or use proper conditionals
- **Example**:
```javascript
// Remove unnecessary constant
return true;

// Or use proper conditional
return condition ? true : false;
```

---

## 🛠️ Quick Fixes

### **Automated Fixes**

#### **Run ESLint with Auto-fix**:
```bash
npm run lint:fix
```

#### **Fix Specific Files**:
```bash
npx eslint src/components/Blog/BlogPost.vue --fix
```

### **Manual Fixes**

#### **1. Remove Unused Variables**:
```javascript
// Before
try {
  await operation();
} catch (error) {
  console.log('Failed');
}

// After
try {
  await operation();
} catch {
  console.log('Failed');
}
```

#### **2. Fix Undefined Variables**:
```javascript
// Before
gtag('event', 'page_view');

// After
if (typeof window !== 'undefined' && window.gtag) {
  window.gtag('event', 'page_view');
}
```

#### **3. Fix v-html Warnings**:
```vue
<!-- Before -->
<div v-html="content"></div>

<!-- After -->
<!-- eslint-disable-next-line vue/no-v-html -->
<div v-html="content"></div>
```

#### **4. Remove Unused Imports**:
```javascript
// Before
import { ref, computed, onMounted, onUnmounted } from 'vue';

// After
import { ref, computed } from 'vue';
```

---

## 🚀 Prevention Strategies

### **1. Pre-commit Hooks**

#### **Install Husky**:
```bash
npm install --save-dev husky lint-staged
```

#### **Configure Pre-commit**:
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "src/**/*.{js,vue,ts}": [
      "eslint --fix",
      "git add"
    ]
  }
}
```

### **2. IDE Integration**

#### **VS Code Settings**:
```json
{
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "vue"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

#### **Recommended Extensions**:
- ESLint
- Vue Language Features (Volar)
- TypeScript Vue Plugin (Volar)

### **3. Code Review Checklist**

#### **Before Committing**:
- [ ] Run `npm run lint` and fix all errors
- [ ] Check for unused variables and imports
- [ ] Verify all global variables are properly checked
- [ ] Add ESLint disable comments for intentional violations
- [ ] Test that changes don't break functionality

#### **During Code Review**:
- [ ] Check for new lint errors
- [ ] Verify error handling is proper
- [ ] Ensure security warnings are addressed
- [ ] Confirm code follows project standards

### **4. Automated Testing**

#### **CI/CD Pipeline**:
```yaml
# .github/workflows/lint.yml
name: Lint
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
```

---

## 🔧 CI/CD Integration

### **GitHub Actions**

#### **Lint Workflow**:
```yaml
name: Lint and Test
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run ESLint
        run: npm run lint
        
      - name: Run type check
        run: npm run type-check
```

### **Pre-commit Configuration**

#### **Install Pre-commit**:
```bash
npm install --save-dev husky lint-staged
```

#### **Package.json Scripts**:
```json
{
  "scripts": {
    "prepare": "husky install",
    "lint": "eslint src --ext .vue,.js,.ts --fix",
    "lint:fix": "eslint src --ext .vue,.js,.ts --fix",
    "type-check": "vue-tsc --noEmit"
  },
  "lint-staged": {
    "src/**/*.{js,vue,ts}": [
      "eslint --fix",
      "git add"
    ]
  }
}
```

---

## 📊 Linting Best Practices

### **1. Error Handling**

#### **Always Handle Errors Properly**:
```javascript
// ✅ Good: Handle errors without unused variables
try {
  await riskyOperation();
} catch {
  console.error('Operation failed');
}

// ✅ Good: Use error information
try {
  await riskyOperation();
} catch (error) {
  console.error('Operation failed:', error.message);
  // Handle specific error types
}
```

### **2. Global Variables**

#### **Check for Global Variables**:
```javascript
// ✅ Good: Check if global exists
if (typeof window !== 'undefined' && window.gtag) {
  window.gtag('event', 'page_view');
}

// ✅ Good: Use optional chaining
window.gtag?.('event', 'page_view');
```

### **3. Vue.js Security**

#### **Handle v-html Safely**:
```vue
<!-- ✅ Good: Disable ESLint for trusted content -->
<!-- eslint-disable-next-line vue/no-v-html -->
<div v-html="sanitizedContent"></div>

<!-- ✅ Good: Use v-text for user content -->
<div v-text="userContent"></div>
```

### **4. Import Management**

#### **Keep Imports Clean**:
```javascript
// ✅ Good: Only import what you need
import { ref, computed } from 'vue';

// ❌ Bad: Import unused modules
import { ref, computed, onMounted, onUnmounted } from 'vue';
```

---

## 🎯 Common Patterns

### **1. Error Handling Pattern**

```javascript
// Standard error handling
async function performOperation() {
  try {
    const result = await someAsyncOperation();
    return result;
  } catch {
    console.error('Operation failed');
    return null;
  }
}

// Error handling with specific error info
async function performOperationWithErrorInfo() {
  try {
    const result = await someAsyncOperation();
    return result;
  } catch (error) {
    console.error('Operation failed:', error.message);
    // Handle specific error types
    if (error.code === 'NETWORK_ERROR') {
      // Handle network error
    }
    return null;
  }
}
```

### **2. Global Variable Pattern**

```javascript
// Check for global variables
function trackEvent(eventName, data) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, data);
  }
}

// Use optional chaining
function trackEventOptional(eventName, data) {
  window.gtag?.(eventName, data);
}
```

### **3. Vue Component Pattern**

```vue
<template>
  <div>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-html="trustedContent"></div>
    
    <!-- Use v-text for user content -->
    <div v-text="userContent"></div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  name: 'MyComponent',
  setup() {
    const trustedContent = ref('<p>Trusted HTML content</p>');
    const userContent = ref('User input content');
    
    return {
      trustedContent,
      userContent
    };
  }
};
</script>
```

---

## 🚨 Emergency Fixes

### **Quick Fix All Common Issues**:

```bash
# Fix all auto-fixable issues
npm run lint:fix

# Check remaining issues
npm run lint

# Fix specific patterns manually
```

### **Common Manual Fixes**:

1. **Remove unused error variables**:
   ```bash
   # Find and replace
   sed -i 's/} catch (error) {/} catch {/g' src/**/*.js
   sed -i 's/} catch (e) {/} catch {/g' src/**/*.js
   ```

2. **Fix undefined variables**:
   ```bash
   # Add window checks
   sed -i 's/gtag(/window.gtag(/g' src/**/*.js
   ```

3. **Remove unused imports**:
   ```bash
   # Remove common unused imports
   sed -i 's/onMounted, //g' src/**/*.js
   sed -i 's/onUnmounted, //g' src/**/*.js
   ```

---

## 📈 Monitoring and Maintenance

### **1. Regular Lint Checks**

#### **Daily**:
- Run `npm run lint` before committing
- Fix any new errors immediately

#### **Weekly**:
- Review lint configuration
- Update ESLint rules if needed
- Check for new best practices

#### **Monthly**:
- Audit ESLint configuration
- Update dependencies
- Review and update this guide

### **2. Performance Monitoring**

#### **Track Lint Performance**:
```bash
# Time lint execution
time npm run lint

# Check for slow rules
npx eslint --debug src/
```

### **3. Team Training**

#### **New Developer Onboarding**:
1. Install recommended IDE extensions
2. Configure pre-commit hooks
3. Review this linting guide
4. Practice with common error patterns

#### **Regular Training**:
- Monthly lint best practices review
- Quarterly ESLint rule updates
- Annual configuration review

---

## 🎉 Conclusion

This linting guide provides comprehensive coverage of:

- ✅ **Common lint errors** and their fixes
- ✅ **Prevention strategies** for clean code
- ✅ **CI/CD integration** for automated checking
- ✅ **Best practices** for maintainable code
- ✅ **Emergency fixes** for quick resolution

### **Key Takeaways**:
1. **Always run lint before committing**
2. **Fix errors immediately** to prevent accumulation
3. **Use automated tools** for consistent code quality
4. **Follow established patterns** for common scenarios
5. **Keep this guide updated** as the project evolves

### **Success Metrics**:
- **Zero lint errors** in CI/CD pipeline
- **Fast lint execution** (< 30 seconds)
- **Consistent code quality** across the team
- **Reduced code review time** for style issues

---

*This guide ensures consistent, high-quality code across the SharedStake project. Follow these practices to maintain excellent code standards.*