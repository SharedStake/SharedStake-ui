# Build Testing Process - CRITICAL

## Date: October 6, 2024

## ⚠️ CRITICAL LESSON LEARNED

**ALWAYS TEST THE BUILD BEFORE COMMITTING CSS CHANGES**

I broke the build twice by not properly testing CSS changes. This document outlines the proper process to prevent this.

---

## Common CSS Build Breakers to Avoid

### 1. **Pseudo-elements Not Supported**
```css
/* ❌ WILL BREAK BUILD */
.blog-content li::marker {
  color: #e6007a;
}

/* ✅ SAFE ALTERNATIVE */
/* Use default list styles */
.blog-content li {
  @apply list-disc text-gray-400;
}
```

### 2. **Modern CSS Properties**
```css
/* ❌ WILL BREAK BUILD */
text-decoration-style: dotted;
text-underline-offset: 2px;

/* ✅ SAFE ALTERNATIVE */
border-bottom: 1px dotted currentColor;
```

### 3. **Unsupported Tailwind Classes (v2.2.17)**
```css
/* ❌ NOT AVAILABLE IN v2 */
@apply border-x-0;           /* No x/y axis utilities */
@apply gap-y-8;              /* No axis-specific gap */
@apply space-x-4;            /* space-x/y actually IS available */
@apply decoration-dotted;    /* No decoration utilities */
@apply underline-offset-2;   /* No underline offset */

/* ✅ USE INSTEAD */
@apply border-l-0 border-r-0;  /* Individual sides */
@apply gap-8;                  /* All sides only */
@apply space-x-4;              /* This works in v2! */
@apply underline;              /* Basic underline only */
/* Add custom CSS for advanced styling */
```

### 4. **Complex Opacity Utilities**
```css
/* ⚠️ USE CAREFULLY */
@apply bg-gray-800/50;  /* May not work */

/* ✅ SAFER APPROACH */
@apply bg-gray-800 bg-opacity-50;  /* Explicit opacity */

/* ✅ SAFEST */
@apply bg-gray-800;  /* No opacity */
```

---

## The Proper Build Testing Process

### Step 1: Check for Syntax Errors
```bash
# Run linter first - quick check
npm run lint

# Should see: "No lint errors found!"
```

### Step 2: Check for Problematic CSS
```bash
# Search for known problematic patterns
grep -E "::marker|text-decoration-style|text-underline-offset|decoration-dotted" src/components/Blog/BlogPost.vue

# Should return nothing
```

### Step 3: Test Build
```bash
# Try a production build
npm run build

# For memory-constrained environments:
NODE_OPTIONS="--max-old-space-size=2048" npm run build
```

### Step 4: Check Build Output
```bash
# Look for ERROR or error in output
npm run build 2>&1 | grep -i error

# Should return nothing
```

### Step 5: Test Dev Server
```bash
# As a fallback, test dev server compilation
npm run serve

# Should see: "Compiled successfully"
```

---

## CSS Guidelines for SharedStake

### ALWAYS USE:
1. **Standard Tailwind 2.x classes** - Check docs if unsure
2. **Simple @apply directives** - One class at a time if problematic
3. **Basic CSS properties** - border, background, color, etc.

### NEVER USE:
1. **::marker pseudo-element** - Not supported
2. **Modern CSS properties** - text-decoration-style, etc.
3. **Tailwind v3+ utilities** - We're on v2.2.17
4. **Complex transforms** - Can cause PostCSS issues

### WHEN IN DOUBT:
1. **Test with a minimal example first**
2. **Check Tailwind 2.2.17 documentation**
3. **Use simpler alternatives**
4. **Test the build immediately**

---

## Quick Pre-Commit Checklist

Before ANY commit involving CSS changes:

```bash
# 1. Lint check (5 seconds)
npm run lint

# 2. Search for problematic patterns (1 second)
grep -E "::marker|decoration-" src/components/**/*.vue

# 3. Quick build test (30 seconds)
timeout 30 npm run build 2>&1 | grep -i error

# If all pass, safe to commit
```

---

## Recovery Process if Build Breaks

1. **Identify the error**
   ```bash
   npm run build 2>&1 | grep -A5 -B5 ERROR
   ```

2. **Check recent CSS changes**
   ```bash
   git diff HEAD~1 -- "*.vue" | grep "^+"
   ```

3. **Remove problematic CSS**
   - Remove pseudo-elements (::marker, ::before, ::after if complex)
   - Simplify Tailwind classes
   - Remove modern CSS properties

4. **Test again**
   ```bash
   npm run lint && npm run build
   ```

5. **Document the issue** in this file for future reference

---

## Lessons from Build Failures

### Failure 1: decoration-* utilities
- **Cause**: Used Tailwind v3 utilities not available in v2.2.17
- **Fix**: Replaced with standard CSS border properties
- **Lesson**: Always check Tailwind version compatibility

### Failure 2: ::marker pseudo-element
- **Cause**: Used ::marker which isn't supported by build system
- **Fix**: Removed and used default list styles
- **Lesson**: Avoid modern pseudo-elements

### Failure 3: Complex opacity utilities
- **Cause**: Mixed opacity syntax causing PostCSS issues
- **Fix**: Used explicit bg-opacity-* classes or removed opacity
- **Lesson**: Use simple, explicit Tailwind utilities

### Failure 4: border-x-0 utility
- **Cause**: Used border-x-0 which doesn't exist in Tailwind v2.2.17
- **Fix**: Replaced with border-l-0 border-r-0
- **Lesson**: Tailwind v2 doesn't have x/y axis utilities - use individual sides

### Failure 5: gap-y-12 utility
- **Cause**: Used gap-y-12 which doesn't exist in Tailwind v2.2.17
- **Fix**: Removed gap-y-12, kept gap-8 for uniform spacing
- **Lesson**: No axis-specific gap utilities (gap-x, gap-y) in v2 - only gap for all sides

---

## The Golden Rule

**If you're adding CSS, run the build BEFORE committing.**

It takes 30 seconds and prevents hours of debugging.

---

## Resources

- [Tailwind v2.2 Docs](https://v2.tailwindcss.com/docs)
- [PostCSS Compatibility](https://github.com/postcss/postcss/wiki/PostCSS-7-plugins)
- [Vue CLI CSS Reference](https://cli.vuejs.org/guide/css.html)

---

*This document is a living guide. Update it whenever a new build issue is discovered and resolved.*