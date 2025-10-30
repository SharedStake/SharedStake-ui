# SharedDeposit Git Submodule Integration

## Current Status

The SharedDeposit repository has been added as a git submodule at:
```
SharedDeposit/
```

Repository URL: https://github.com/chimera-defi/SharedDeposit

## Current Implementation

Currently, ABIs are manually copied from the SharedDeposit repository into `src/contracts/abis/`. The contracts are imported directly in `src/contracts/index.js`.

### Current ABI Location
- Manual copies: `src/contracts/abis/*.json`
- Source: `SharedDeposit/data/abi/*.json` (109+ ABI files available)

## Future Improvements

### 1. Direct ABI Import from Submodule

**Goal:** Import ABIs directly from the SharedDeposit submodule instead of maintaining manual copies.

**Benefits:**
- Single source of truth
- Automatic updates when submodule is updated
- Reduces maintenance overhead
- Ensures ABI version consistency

**Implementation Approach:**
```javascript
// Example: Direct import from submodule
import sgETHABI from '../SharedDeposit/data/abi/SgETH.json';
import withdrawalsABI from '../SharedDeposit/data/abi/Withdrawals.json';
```

**Considerations:**
- Path resolution may need adjustment depending on build configuration
- May require updates to Vite/build configuration to handle submodule paths
- Need to ensure submodule is initialized (`git submodule update --init --recursive`)

### 2. Compile Contract ABIs Directly

**Goal:** Compile Solidity contracts from the SharedDeposit submodule and generate ABIs during the build process.

**Benefits:**
- Always use latest contract ABIs
- No manual copying required
- Ensures ABIs match exact contract versions
- Can leverage TypeScript types if using TypeChain

**Implementation Approach:**

#### Option A: Integrate Hardhat into Build Process
The SharedDeposit repo uses Hardhat with `hardhat-abi-exporter` plugin. We could:

1. **Add Hardhat as a dev dependency** (if not already present)
2. **Create a build script** that:
   - Compiles contracts from `SharedDeposit/contracts/`
   - Exports ABIs to a location accessible by the frontend
   - Optionally generates TypeScript types using TypeChain

Example build script:
```javascript
// scripts/build-contracts.js
const { execSync } = require('child_process');
const path = require('path');

// Navigate to SharedDeposit directory
process.chdir(path.join(__dirname, '../SharedDeposit'));

// Install dependencies if needed
// execSync('npm install', { stdio: 'inherit' });

// Compile contracts
execSync('npx hardhat compile', { stdio: 'inherit' });

// Export ABIs (if hardhat-abi-exporter is configured)
// ABIs should already be in SharedDeposit/data/abi/
```

#### Option B: Use Hardhat as Pre-build Step
Add to `package.json`:
```json
{
  "scripts": {
    "prebuild": "npm run build-contracts",
    "build-contracts": "cd SharedDeposit && npm install && npx hardhat compile"
  }
}
```

#### Option C: Copy ABIs on Submodule Update
Create a script that runs after submodule updates:
```bash
#!/bin/bash
# scripts/sync-abis.sh

# Copy ABIs from submodule to contracts directory
cp SharedDeposit/data/abi/*.json src/contracts/abis/
```

**Requirements:**
- Ensure SharedDeposit submodule dependencies are installed
- Configure Hardhat to compile contracts from submodule
- Update build process to run compilation step
- Handle cases where submodule is not initialized
- Consider caching compiled artifacts for faster builds

### 3. TypeScript Type Generation

**Goal:** Generate TypeScript types for contracts using TypeChain.

**Benefits:**
- Type safety for contract interactions
- Better IDE autocomplete
- Catch errors at compile time

**Implementation:**
The SharedDeposit repo already includes TypeChain setup. We could:
1. Run TypeChain generation from SharedDeposit
2. Import generated types in the frontend codebase
3. Use typed contract instances

### 4. Automated Submodule Updates

**Goal:** Automate checking and updating the SharedDeposit submodule.

**Implementation:**
- Add CI/CD step to check for submodule updates
- Create script to update submodule and regenerate ABIs
- Document update process for developers

## Recommended Implementation Order

1. **Phase 1:** Direct ABI imports (simplest)
   - Update import paths in `src/contracts/index.js`
   - Test path resolution in build process
   - Update documentation

2. **Phase 2:** Automated ABI copying
   - Create sync script
   - Add to pre-build step
   - Ensure submodule initialization in CI/CD

3. **Phase 3:** Direct compilation (most complex)
   - Integrate Hardhat compilation
   - Update build process
   - Add dependency management
   - Test on CI/CD

4. **Phase 4:** TypeScript types (optional enhancement)
   - Generate TypeChain types
   - Update contract usage to use types
   - Migrate existing code

## Notes

- The SharedDeposit repo uses Hardhat for compilation
- ABIs are located in `SharedDeposit/data/abi/` (109+ files)
- Current manual ABIs are in `src/contracts/abis/`
- The submodule should be initialized with: `git submodule update --init --recursive`
- Consider build time implications of compiling contracts during frontend builds

## Related Files

- `src/contracts/index.js` - Contract definitions and ABIs
- `src/contracts/abis/` - Current manually copied ABIs
- `SharedDeposit/data/abi/` - Source ABIs from submodule
- `SharedDeposit/hardhat.config.ts` - Hardhat configuration
- `SharedDeposit/package.json` - Build scripts and dependencies
