# PR 379 DVT Split + UUPS Module Proxy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split DVT code to a new `feat/dvt-module` branch, convert StakingRouter / ValidatorModule / LSTWrapModule / OperatorRegistry to UUPS upgradeable proxies, and update all deploy scripts, tests, and docs so PR 379 ships a secure, audited, proxy-upgradeable core.

**Architecture:** Four contracts that hold value or require future patching (StakingRouter, ValidatorModule, LSTWrapModule, OperatorRegistry) are converted from plain contracts to UUPS proxies using `@openzeppelin/contracts-upgradeable` v4. Constructor logic moves to an `initialize()` function; `immutable` state variables become regular state variables. DVTModule, its deploy script, its test suite, and DVTStakePanel.vue are extracted to a new `feat/dvt-module` branch and removed from `feat/protocol-v3-fresh`.

**Tech Stack:** Solidity 0.8.20, Hardhat, `hardhat-deploy` v1, `@openzeppelin/contracts-upgradeable` ^4.3.1, `@openzeppelin/hardhat-upgrades` (to install), TypeChain, TypeScript, Hardhat fixtures.

---

## File Map

### New files (PR 379 branch)
- `staking-contracts/contracts/v2/lib/GranularPauseUpgradeable.sol` — Context-free version of GranularPause for use with UUPSUpgradeable contracts
- `staking-contracts/test/v2/modular-staking/upgrades.spec.ts` — UUPS storage-survival upgrade tests
- `staking-contracts/deploy/upgrades/ValidatorModule_V2_template.ts` — Example upgrade script (not run on fresh deploy)
- `docs/superpowers/plans/2026-06-12-pr379-dvt-split-uups.md` — this file

### Modified files (PR 379 branch)
- `staking-contracts/package.json` — add `@openzeppelin/hardhat-upgrades`
- `staking-contracts/hardhat.config.ts` — import `@openzeppelin/hardhat-upgrades`
- `staking-contracts/contracts/v2/modular-staking/StakingRouter.sol` — UUPS conversion
- `staking-contracts/contracts/v2/modular-staking/modules/ValidatorModule.sol` — UUPS conversion
- `staking-contracts/contracts/v2/modular-staking/modules/LSTWrapModule.sol` — UUPS conversion
- `staking-contracts/contracts/v2/modular-staking/OperatorRegistry.sol` — UUPS conversion
- `staking-contracts/deploy/007_stakingRouter.ts` — use `hre.upgrades.deployProxy`
- `staking-contracts/deploy/008_validatorModule.ts` — use `hre.upgrades.deployProxy`
- `staking-contracts/deploy/010_lstWrapModule.ts` — use `hre.upgrades.deployProxy`
- `staking-contracts/deploy/020_operatorRegistry.ts` — use `hre.upgrades.deployProxy`
- `staking-contracts/test/v2/modular-staking/stakingRouter.spec.ts` — deploy via proxy
- `staking-contracts/test/v2/modular-staking/e2e-router.spec.ts` — deploy via proxy
- `staking-contracts/test/v2/modular-staking/e2e.spec.ts` — deploy via proxy
- `src/components/ModularStaking/ModularStakingApp.vue` — remove DVTStakePanel import
- `docs/modular-staking/architecture.md` — update Sections 3, 10

### Removed from PR 379 branch (moved to feat/dvt-module)
- `staking-contracts/contracts/v2/modular-staking/modules/DVTModule.sol`
- `staking-contracts/deploy/012_dvtModule.ts`
- `staking-contracts/test/v2/modular-staking/dvtModule.spec.ts`
- DVT sections within `staking-contracts/test/v2/modular-staking/fork.spec.ts`
- `src/components/ModularStaking/DVTStakePanel.vue`

---

## Task 1: Create feat/dvt-module branch and move DVT code

**Files:**
- Move: `staking-contracts/contracts/v2/modular-staking/modules/DVTModule.sol`
- Move: `staking-contracts/deploy/012_dvtModule.ts`
- Move: `staking-contracts/test/v2/modular-staking/dvtModule.spec.ts`
- Move: `src/components/ModularStaking/DVTStakePanel.vue`
- Modify: `staking-contracts/test/v2/modular-staking/fork.spec.ts` (remove DVT sections)
- Modify: `src/components/ModularStaking/ModularStakingApp.vue` (remove DVTStakePanel import)

- [ ] **Step 1.1: Create the DVT branch from current HEAD**

```bash
git checkout -b feat/dvt-module
```

- [ ] **Step 1.2: Commit current state to feat/dvt-module so nothing is lost**

```bash
git add -A
git commit --allow-empty -m "chore(dvt-branch): snapshot before dvt split"
```

- [ ] **Step 1.3: Return to the PR 379 branch**

```bash
git checkout feat/protocol-v3-fresh
```

- [ ] **Step 1.4: Remove DVTModule.sol from PR 379 branch**

```bash
git rm staking-contracts/contracts/v2/modular-staking/modules/DVTModule.sol
```

- [ ] **Step 1.5: Remove DVT deploy script**

```bash
git rm staking-contracts/deploy/012_dvtModule.ts
```

- [ ] **Step 1.6: Remove dvtModule.spec.ts**

```bash
git rm staking-contracts/test/v2/modular-staking/dvtModule.spec.ts
```

- [ ] **Step 1.7: Remove DVTStakePanel.vue**

```bash
git rm src/components/ModularStaking/DVTStakePanel.vue
```

- [ ] **Step 1.8: Remove DVTStakePanel import and usage from ModularStakingApp.vue**

Open `src/components/ModularStaking/ModularStakingApp.vue`. Remove the `import DVTStakePanel` line and its `<DVTStakePanel ...>` template usage. The component file has it as a tab — delete the DVT tab entry entirely. Save.

- [ ] **Step 1.9: Remove DVT sections from fork.spec.ts**

Open `staking-contracts/test/v2/modular-staking/fork.spec.ts`. Remove any `describe("DVT` or `it(... dvt` blocks and their imports of `DVTModule__factory`. Save.

- [ ] **Step 1.10: Compile and verify no DVT references remain on PR 379 branch**

```bash
cd staking-contracts && npx hardhat compile 2>&1 | grep -i dvt
```

Expected: no output (no DVT references).

- [ ] **Step 1.11: Commit the DVT removal**

```bash
git add -A
git commit -m "chore(split): extract DVTModule to feat/dvt-module branch

DVTModule.sol, 012_dvtModule.ts, dvtModule.spec.ts, DVTStakePanel.vue,
and DVT sections of fork.spec.ts have moved to feat/dvt-module for
separate audit and PR 381.

Co-authored-by: Chimera <chimera_defi@protonmail.com>"
```

---

## Task 2: Install @openzeppelin/hardhat-upgrades and configure Hardhat

**Files:**
- Modify: `staking-contracts/package.json`
- Modify: `staking-contracts/hardhat.config.ts`

- [ ] **Step 2.1: Install the plugin**

```bash
cd staking-contracts && npm install --save-dev @openzeppelin/hardhat-upgrades
```

Expected: package-lock.json updated, no peer-dep errors.

- [ ] **Step 2.2: Add the import to hardhat.config.ts**

In `staking-contracts/hardhat.config.ts`, add this line after the existing plugin imports (around line 14):

```ts
import "@openzeppelin/hardhat-upgrades";
```

- [ ] **Step 2.3: Verify the plugin loads**

```bash
cd staking-contracts && npx hardhat --version
```

Expected: prints Hardhat version without errors.

- [ ] **Step 2.4: Commit**

```bash
git add staking-contracts/package.json staking-contracts/package-lock.json staking-contracts/hardhat.config.ts
git commit -m "chore(deps): add @openzeppelin/hardhat-upgrades

Co-authored-by: Chimera <chimera_defi@protonmail.com>"
```

---

## Task 3: Create GranularPauseUpgradeable

`GranularPause` inherits `Context`. `AccessControlUpgradeable` inherits `ContextUpgradeable`. Both define `_msgSender()`, creating a linearization conflict. The fix is a new abstract contract that drops the `Context` dependency — the concrete UUPS contract will provide `_msgSender()` through `AccessControlUpgradeable`.

**Files:**
- Create: `staking-contracts/contracts/v2/lib/GranularPauseUpgradeable.sol`

- [ ] **Step 3.1: Create the file**

```solidity
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.20;

/// @title GranularPauseUpgradeable
/// @notice Context-free variant of GranularPause for use with OZ upgradeable contracts.
///         `_msgSender()` is provided by AccessControlUpgradeable in the inheriting contract.
abstract contract GranularPauseUpgradeable {
    mapping(uint16 => bool) public paused;

    event Paused(address account, uint16 item);
    event Unpaused(address account, uint16 item);

    error IsPaused();
    error IsNotPaused();

    modifier whenNotPaused(uint16 _id) {
        if (paused[_id]) revert IsPaused();
        _;
    }

    modifier whenPaused(uint16 _id) {
        if (!paused[_id]) revert IsNotPaused();
        _;
    }

    function _pause(uint16 _id) internal virtual {
        paused[_id] = true;
        emit Paused(msg.sender, _id);
    }

    function _unpause(uint16 _id) internal virtual {
        paused[_id] = false;
        emit Unpaused(msg.sender, _id);
    }

    uint256[49] private __gap;
}
```

- [ ] **Step 3.2: Compile**

```bash
cd staking-contracts && npx hardhat compile
```

Expected: compiles without errors.

- [ ] **Step 3.3: Commit**

```bash
git add staking-contracts/contracts/v2/lib/GranularPauseUpgradeable.sol
git commit -m "feat(lib): add GranularPauseUpgradeable for UUPS contracts

Co-authored-by: Chimera <chimera_defi@protonmail.com>"
```

---

## Task 4: Convert ValidatorModule to UUPS

**Files:**
- Modify: `staking-contracts/contracts/v2/modular-staking/modules/ValidatorModule.sol`

- [ ] **Step 4.1: Replace the imports block**

Replace the current imports at the top of `ValidatorModule.sol`:

```solidity
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
```

With:

```solidity
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {GranularPauseUpgradeable} from "../../lib/GranularPauseUpgradeable.sol";
```

Also remove the existing `GranularPause` import (it was imported from the same `lib/` directory).

- [ ] **Step 4.2: Update the contract declaration**

Replace:

```solidity
contract ValidatorModule is AccessControl, ReentrancyGuard, GranularPause, IStakingModule {
```

With:

```solidity
contract ValidatorModule is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable, GranularPauseUpgradeable, IStakingModule {
```

- [ ] **Step 4.3: Remove `immutable` from state variables**

Replace the three immutable declarations:

```solidity
    IStakingRouter public immutable ROUTER;
    bytes32 public immutable MODULE_ID;
    address public immutable BEACON_DEPOSIT_CONTRACT;
```

With (drop the `immutable` keyword only):

```solidity
    IStakingRouter public ROUTER;
    bytes32 public MODULE_ID;
    address public BEACON_DEPOSIT_CONTRACT;
```

- [ ] **Step 4.4: Replace the constructor with initialize()**

Replace the entire `constructor` block:

```solidity
    constructor(address router, bytes32 moduleId, address gov, address beaconDepositContract) {
        if (router == address(0) || gov == address(0)) revert Errors.ZeroAddress();
        if (moduleId == bytes32(0)) revert Errors.InvalidAmount();
        ROUTER = IStakingRouter(router);
        MODULE_ID = moduleId;
        BEACON_DEPOSIT_CONTRACT = beaconDepositContract == address(0)
            ? DEFAULT_BEACON_DEPOSIT_CONTRACT
            : beaconDepositContract;

        _grantRole(DEFAULT_ADMIN_ROLE, gov);
        _grantRole(GOV, gov);
        _grantRole(GUARDIAN, gov);
    }
```

With:

```solidity
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address router,
        bytes32 moduleId,
        address gov,
        address beaconDepositContract
    ) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        if (router == address(0) || gov == address(0)) revert Errors.ZeroAddress();
        if (moduleId == bytes32(0)) revert Errors.InvalidAmount();
        ROUTER = IStakingRouter(router);
        MODULE_ID = moduleId;
        BEACON_DEPOSIT_CONTRACT = beaconDepositContract == address(0)
            ? DEFAULT_BEACON_DEPOSIT_CONTRACT
            : beaconDepositContract;

        _grantRole(DEFAULT_ADMIN_ROLE, gov);
        _grantRole(GOV, gov);
        _grantRole(GUARDIAN, gov);
    }
```

- [ ] **Step 4.5: Add _authorizeUpgrade and __gap at the end of the contract**

Before the closing `}` of the contract, add:

```solidity
    // ── UUPS ─────────────────────────────────────────────────────────────────

    function _authorizeUpgrade(address) internal override onlyRole(GOV) {}

    uint256[50] private __gap;
```

- [ ] **Step 4.6: Compile to catch errors**

```bash
cd staking-contracts && npx hardhat compile 2>&1 | tail -5
```

Expected: `Compiled N Solidity files successfully`.

- [ ] **Step 4.7: Commit**

```bash
git add staking-contracts/contracts/v2/modular-staking/modules/ValidatorModule.sol
git commit -m "feat(ValidatorModule): convert to UUPS upgradeable proxy

Co-authored-by: Chimera <chimera_defi@protonmail.com>"
```

---

## Task 5: Convert LSTWrapModule to UUPS

**Files:**
- Modify: `staking-contracts/contracts/v2/modular-staking/modules/LSTWrapModule.sol`

- [ ] **Step 5.1: Replace imports**

Replace:

```solidity
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
```

With:

```solidity
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {GranularPauseUpgradeable} from "../../lib/GranularPauseUpgradeable.sol";
```

Remove the existing `GranularPause` import.

- [ ] **Step 5.2: Update contract declaration**

Replace:

```solidity
contract LSTWrapModule is AccessControl, ReentrancyGuard, GranularPause, IStakingModule {
```

With:

```solidity
contract LSTWrapModule is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable, GranularPauseUpgradeable, IStakingModule {
```

- [ ] **Step 5.3: Remove immutable from ROUTER, MODULE_ID, LST_TOKEN**

Replace:

```solidity
    IStakingRouter public immutable ROUTER;
    bytes32 public immutable MODULE_ID;
    IERC20 public immutable LST_TOKEN;
```

With:

```solidity
    IStakingRouter public ROUTER;
    bytes32 public MODULE_ID;
    IERC20 public LST_TOKEN;
```

- [ ] **Step 5.4: Replace constructor with initialize()**

Replace the constructor:

```solidity
    constructor(address router, bytes32 moduleId, address lstToken, address gov) {
        if (router == address(0) || lstToken == address(0) || gov == address(0)) {
            revert Errors.ZeroAddress();
        }
        if (moduleId == bytes32(0)) revert Errors.InvalidAmount();
        ROUTER = IStakingRouter(router);
        MODULE_ID = moduleId;
        LST_TOKEN = IERC20(lstToken);
        _grantRole(DEFAULT_ADMIN_ROLE, gov);
        _grantRole(GOV, gov);
        _grantRole(GUARDIAN, gov);
    }
```

With:

```solidity
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address router,
        bytes32 moduleId,
        address lstToken,
        address gov
    ) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        if (router == address(0) || lstToken == address(0) || gov == address(0)) {
            revert Errors.ZeroAddress();
        }
        if (moduleId == bytes32(0)) revert Errors.InvalidAmount();
        ROUTER = IStakingRouter(router);
        MODULE_ID = moduleId;
        LST_TOKEN = IERC20(lstToken);
        _grantRole(DEFAULT_ADMIN_ROLE, gov);
        _grantRole(GOV, gov);
        _grantRole(GUARDIAN, gov);
    }
```

- [ ] **Step 5.5: Add _authorizeUpgrade and __gap at end of contract**

```solidity
    // ── UUPS ─────────────────────────────────────────────────────────────────

    function _authorizeUpgrade(address) internal override onlyRole(GOV) {}

    uint256[50] private __gap;
```

- [ ] **Step 5.6: Compile**

```bash
cd staking-contracts && npx hardhat compile 2>&1 | tail -5
```

Expected: `Compiled N Solidity files successfully`.

- [ ] **Step 5.7: Commit**

```bash
git add staking-contracts/contracts/v2/modular-staking/modules/LSTWrapModule.sol
git commit -m "feat(LSTWrapModule): convert to UUPS upgradeable proxy

Co-authored-by: Chimera <chimera_defi@protonmail.com>"
```

---

## Task 6: Convert StakingRouter to UUPS

**Files:**
- Modify: `staking-contracts/contracts/v2/modular-staking/StakingRouter.sol`

- [ ] **Step 6.1: Replace imports**

Replace:

```solidity
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
```

With:

```solidity
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {GranularPauseUpgradeable} from "../lib/GranularPauseUpgradeable.sol";
```

Remove the existing `GranularPause` import.

- [ ] **Step 6.2: Update contract declaration**

Replace:

```solidity
contract StakingRouter is AccessControl, ReentrancyGuard, GranularPause, IStakingRouter {
```

With:

```solidity
contract StakingRouter is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable, GranularPauseUpgradeable, IStakingRouter {
```

- [ ] **Step 6.3: Remove immutable from ST_TOKEN**

Replace:

```solidity
    StToken public immutable ST_TOKEN;
```

With:

```solidity
    StToken public ST_TOKEN;
```

- [ ] **Step 6.4: Replace constructor with initialize()**

Replace:

```solidity
    constructor(address stToken, address gov) {
        if (stToken == address(0) || gov == address(0)) revert Errors.ZeroAddress();
        ST_TOKEN = StToken(stToken);
        enforceModuleCodeHashAllowlist = false;
        _grantRole(DEFAULT_ADMIN_ROLE, gov);
        _grantRole(GOV, gov);
        _grantRole(GUARDIAN, gov);
    }
```

With:

```solidity
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address stToken, address gov) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        if (stToken == address(0) || gov == address(0)) revert Errors.ZeroAddress();
        ST_TOKEN = StToken(stToken);
        enforceModuleCodeHashAllowlist = false;
        _grantRole(DEFAULT_ADMIN_ROLE, gov);
        _grantRole(GOV, gov);
        _grantRole(GUARDIAN, gov);
    }
```

- [ ] **Step 6.5: Add _authorizeUpgrade and __gap at end of contract**

```solidity
    // ── UUPS ─────────────────────────────────────────────────────────────────

    function _authorizeUpgrade(address) internal override onlyRole(GOV) {}

    uint256[50] private __gap;
```

- [ ] **Step 6.6: Compile**

```bash
cd staking-contracts && npx hardhat compile 2>&1 | tail -5
```

Expected: `Compiled N Solidity files successfully`.

- [ ] **Step 6.7: Commit**

```bash
git add staking-contracts/contracts/v2/modular-staking/StakingRouter.sol
git commit -m "feat(StakingRouter): convert to UUPS upgradeable proxy

Co-authored-by: Chimera <chimera_defi@protonmail.com>"
```

---

## Task 7: Convert OperatorRegistry to UUPS

**Files:**
- Modify: `staking-contracts/contracts/v2/modular-staking/OperatorRegistry.sol`

- [ ] **Step 7.1: Replace imports**

Replace:

```solidity
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
```

With:

```solidity
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
```

- [ ] **Step 7.2: Update contract declaration**

Replace:

```solidity
contract OperatorRegistry is AccessControl, ReentrancyGuard {
```

With:

```solidity
contract OperatorRegistry is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
```

- [ ] **Step 7.3: Remove immutable from sgtToken**

Replace:

```solidity
    IERC20 public immutable sgtToken;
```

With:

```solidity
    IERC20 public sgtToken;
```

- [ ] **Step 7.4: Replace constructor with initialize()**

Replace:

```solidity
    constructor(address _sgtToken, address gov) {
        if (_sgtToken == address(0) || gov == address(0)) revert Errors.ZeroAddress();
        sgtToken = IERC20(_sgtToken);
        _grantRole(DEFAULT_ADMIN_ROLE, gov);
        _grantRole(GOV, gov);
    }
```

With:

```solidity
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _sgtToken, address gov) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        if (_sgtToken == address(0) || gov == address(0)) revert Errors.ZeroAddress();
        sgtToken = IERC20(_sgtToken);
        _grantRole(DEFAULT_ADMIN_ROLE, gov);
        _grantRole(GOV, gov);
    }
```

- [ ] **Step 7.5: Add _authorizeUpgrade and __gap at end of contract**

```solidity
    // ── UUPS ─────────────────────────────────────────────────────────────────

    function _authorizeUpgrade(address) internal override onlyRole(GOV) {}

    uint256[50] private __gap;
```

- [ ] **Step 7.6: Compile full suite**

```bash
cd staking-contracts && npx hardhat compile 2>&1 | tail -5
```

Expected: `Compiled N Solidity files successfully`. If TypeChain artifacts are stale, regenerate:

```bash
cd staking-contracts && npx hardhat typechain
```

- [ ] **Step 7.7: Commit**

```bash
git add staking-contracts/contracts/v2/modular-staking/OperatorRegistry.sol
git commit -m "feat(OperatorRegistry): convert to UUPS upgradeable proxy

Co-authored-by: Chimera <chimera_defi@protonmail.com>"
```

---

## Task 8: Update deploy script for StakingRouter

**Files:**
- Modify: `staking-contracts/deploy/007_stakingRouter.ts`

- [ ] **Step 8.1: Rewrite the deploy call in 007_stakingRouter.ts**

Replace the block starting with `const {contract: router} = await deploy(StakingRouter__factory, {` through its closing `});` with:

```ts
  const StakingRouterFactory = await hre.ethers.getContractFactory("StakingRouter", accounts.deployer);
  const routerProxy = await hre.upgrades.deployProxy(
    StakingRouterFactory,
    [stTokenAddress, gov],
    { kind: "uups", initializer: "initialize" },
  );
  await routerProxy.waitForDeployment();
  const routerProxyAddress = await routerProxy.getAddress();

  // Save proxy address under the canonical name so downstream scripts resolve it.
  await hre.deployments.save("StakingRouter", {
    abi: StakingRouter__factory.abi,
    address: routerProxyAddress,
  });

  const router = StakingRouter__factory.connect(routerProxyAddress, govSigner);
  console.log(`  StakingRouter proxy deployed to ${routerProxyAddress}`);
```

Remove the `const router = await connect(StakingRouter__factory);` line that was below the old deploy call (the router variable is now set above).

- [ ] **Step 8.2: Run the deploy script on local network to verify**

```bash
cd staking-contracts && npx hardhat deploy --tags staking-router --network localhost 2>&1 | tail -10
```

Expected: prints `StakingRouter proxy deployed to 0x...` with no errors.

- [ ] **Step 8.3: Commit**

```bash
git add staking-contracts/deploy/007_stakingRouter.ts
git commit -m "chore(deploy): deploy StakingRouter as UUPS proxy

Co-authored-by: Chimera <chimera_defi@protonmail.com>"
```

---

## Task 9: Update deploy script for ValidatorModule

**Files:**
- Modify: `staking-contracts/deploy/008_validatorModule.ts`

- [ ] **Step 9.1: Rewrite the deploy call**

Replace the block starting with `const {contract: validatorModule} = await deploy(ValidatorModule__factory, {` through its closing `});` with:

```ts
  const ValidatorModuleFactory = await hre.ethers.getContractFactory("ValidatorModule", accounts.deployer);
  const validatorProxy = await hre.upgrades.deployProxy(
    ValidatorModuleFactory,
    [routerAddress, moduleId, gov, beaconDeposit],
    { kind: "uups", initializer: "initialize" },
  );
  await validatorProxy.waitForDeployment();
  const validatorProxyAddress = await validatorProxy.getAddress();

  await hre.deployments.save("ValidatorModule", {
    abi: ValidatorModule__factory.abi,
    address: validatorProxyAddress,
  });

  const validatorModule = ValidatorModule__factory.connect(validatorProxyAddress, govSigner);
  console.log(`  ValidatorModule proxy deployed to ${validatorProxyAddress}`);
```

- [ ] **Step 9.2: Verify deploy on local network**

```bash
cd staking-contracts && npx hardhat deploy --tags validator-module --network localhost 2>&1 | tail -10
```

Expected: `ValidatorModule proxy deployed to 0x...`

- [ ] **Step 9.3: Commit**

```bash
git add staking-contracts/deploy/008_validatorModule.ts
git commit -m "chore(deploy): deploy ValidatorModule as UUPS proxy

Co-authored-by: Chimera <chimera_defi@protonmail.com>"
```

---

## Task 10: Update deploy script for LSTWrapModule

**Files:**
- Modify: `staking-contracts/deploy/010_lstWrapModule.ts`

- [ ] **Step 10.1: Read the current constructor call in 010_lstWrapModule.ts and identify the deploy block**

Open `staking-contracts/deploy/010_lstWrapModule.ts`. Find the `deploy(LSTWrapModule__factory, { args: [...] })` call and note the four init args (router, moduleId, lstToken, gov).

- [ ] **Step 10.2: Replace the deploy call**

Replace the `deploy(LSTWrapModule__factory, ...)` block with:

```ts
  const LSTWrapModuleFactory = await hre.ethers.getContractFactory("LSTWrapModule", accounts.deployer);
  const lstProxy = await hre.upgrades.deployProxy(
    LSTWrapModuleFactory,
    [routerAddress, moduleId, lstTokenAddress, gov],
    { kind: "uups", initializer: "initialize" },
  );
  await lstProxy.waitForDeployment();
  const lstProxyAddress = await lstProxy.getAddress();

  await hre.deployments.save("LSTWrapModule", {
    abi: LSTWrapModule__factory.abi,
    address: lstProxyAddress,
  });

  const lstWrapModule = LSTWrapModule__factory.connect(lstProxyAddress, govSigner);
  console.log(`  LSTWrapModule proxy deployed to ${lstProxyAddress}`);
```

Preserve the post-deploy wiring (oracle setup, module registration with router) unchanged; only the factory deploy call changes.

- [ ] **Step 10.3: Compile + deploy test**

```bash
cd staking-contracts && npx hardhat compile 2>&1 | tail -3
```

- [ ] **Step 10.4: Commit**

```bash
git add staking-contracts/deploy/010_lstWrapModule.ts
git commit -m "chore(deploy): deploy LSTWrapModule as UUPS proxy

Co-authored-by: Chimera <chimera_defi@protonmail.com>"
```

---

## Task 11: Update deploy script for OperatorRegistry

**Files:**
- Modify: `staking-contracts/deploy/020_operatorRegistry.ts`

- [ ] **Step 11.1: Read 020_operatorRegistry.ts to find the deploy call**

Open `staking-contracts/deploy/020_operatorRegistry.ts`. Find the `deploy(OperatorRegistry__factory, { args: [sgtToken, gov] })` call.

- [ ] **Step 11.2: Replace the deploy call**

```ts
  const OperatorRegistryFactory = await hre.ethers.getContractFactory("OperatorRegistry", accounts.deployer);
  const registryProxy = await hre.upgrades.deployProxy(
    OperatorRegistryFactory,
    [sgtTokenAddress, gov],
    { kind: "uups", initializer: "initialize" },
  );
  await registryProxy.waitForDeployment();
  const registryProxyAddress = await registryProxy.getAddress();

  await hre.deployments.save("OperatorRegistry", {
    abi: OperatorRegistry__factory.abi,
    address: registryProxyAddress,
  });

  const operatorRegistry = OperatorRegistry__factory.connect(registryProxyAddress, govSigner);
  console.log(`  OperatorRegistry proxy deployed to ${registryProxyAddress}`);
```

- [ ] **Step 11.3: Commit**

```bash
git add staking-contracts/deploy/020_operatorRegistry.ts
git commit -m "chore(deploy): deploy OperatorRegistry as UUPS proxy

Co-authored-by: Chimera <chimera_defi@protonmail.com>"
```

---

## Task 12: Add upgrade example script

**Files:**
- Create: `staking-contracts/deploy/upgrades/ValidatorModule_V2_template.ts`

- [ ] **Step 12.1: Create the directory and template**

```bash
mkdir -p staking-contracts/deploy/upgrades
```

Create `staking-contracts/deploy/upgrades/ValidatorModule_V2_template.ts`:

```ts
/**
 * Template for upgrading ValidatorModule to a new implementation.
 * Not run on fresh deploys — execute manually as a governance action.
 *
 * Usage:
 *   npx hardhat run deploy/upgrades/ValidatorModule_V2_template.ts --network mainnet
 *
 * Prerequisites:
 *   1. New ValidatorModuleV2.sol compiled and in the typechain types.
 *   2. GOV signer available (timelock must have queued + executed the upgrade).
 *   3. .openzeppelin/<network>.json present from original proxy deploy.
 */
import {ethers, upgrades, deployments} from "hardhat";

async function main() {
  const [govSigner] = await ethers.getSigners();
  const deployment = await deployments.get("ValidatorModule");
  const proxyAddress = deployment.address;

  console.log(`Upgrading ValidatorModule proxy at ${proxyAddress}...`);

  const ValidatorModuleV2 = await ethers.getContractFactory("ValidatorModuleV2", govSigner);

  // upgrades.upgradeProxy validates storage layout compatibility before upgrading.
  const upgraded = await upgrades.upgradeProxy(proxyAddress, ValidatorModuleV2, { kind: "uups" });
  await upgraded.waitForDeployment();

  console.log(`ValidatorModule upgraded. Proxy address unchanged: ${proxyAddress}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 12.2: Commit**

```bash
git add staking-contracts/deploy/upgrades/ValidatorModule_V2_template.ts
git commit -m "docs(deploy): add UUPS upgrade template for ValidatorModule

Co-authored-by: Chimera <chimera_defi@protonmail.com>"
```

---

## Task 13: Update core spec files to deploy via proxy

The spec files that construct these contracts directly (not via fixture) need to use `upgrades.deployProxy`.

**Files:**
- Modify: `staking-contracts/test/v2/modular-staking/stakingRouter.spec.ts`
- Modify: `staking-contracts/test/v2/modular-staking/e2e-router.spec.ts`
- Modify: `staking-contracts/test/v2/modular-staking/e2e.spec.ts`

- [ ] **Step 13.1: Add upgrades import to each spec that deploys UUPS contracts**

At the top of each affected spec file, add:

```ts
import { upgrades } from "hardhat";
```

- [ ] **Step 13.2: Replace direct factory deploys with deployProxy calls**

In any spec that does:

```ts
const router = await new StakingRouter__factory(deployer).deploy(stToken.address, gov);
```

Replace with:

```ts
const factory = await ethers.getContractFactory("StakingRouter", deployer);
const router = StakingRouter__factory.connect(
  await (await upgrades.deployProxy(factory, [stToken.address, gov], { kind: "uups", initializer: "initialize" })).getAddress(),
  deployer,
);
```

Apply the same pattern for `ValidatorModule`:

```ts
// Before
const module = await new ValidatorModule__factory(deployer).deploy(router.address, moduleId, gov, beaconDeposit);

// After
const vmFactory = await ethers.getContractFactory("ValidatorModule", deployer);
const module = ValidatorModule__factory.connect(
  await (await upgrades.deployProxy(vmFactory, [router.address, moduleId, gov, beaconDeposit], { kind: "uups", initializer: "initialize" })).getAddress(),
  deployer,
);
```

And for `LSTWrapModule`:

```ts
// Before
const lstModule = await new LSTWrapModule__factory(deployer).deploy(router.address, moduleId, lstToken.address, gov);

// After
const lstFactory = await ethers.getContractFactory("LSTWrapModule", deployer);
const lstModule = LSTWrapModule__factory.connect(
  await (await upgrades.deployProxy(lstFactory, [router.address, moduleId, lstToken.address, gov], { kind: "uups", initializer: "initialize" })).getAddress(),
  deployer,
);
```

Specs that use `hre.deployments.fixture("modular-staking")` do NOT need manual changes — they will pick up the updated deploy scripts automatically.

- [ ] **Step 13.3: Run the affected suites to verify**

```bash
cd staking-contracts && npx hardhat test test/v2/modular-staking/stakingRouter.spec.ts 2>&1 | tail -20
```

Expected: all tests pass.

```bash
cd staking-contracts && npx hardhat test test/v2/modular-staking/e2e-router.spec.ts 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 13.4: Commit**

```bash
git add staking-contracts/test/v2/modular-staking/stakingRouter.spec.ts \
        staking-contracts/test/v2/modular-staking/e2e-router.spec.ts \
        staking-contracts/test/v2/modular-staking/e2e.spec.ts
git commit -m "test: update specs to deploy UUPS proxies via upgrades.deployProxy

Co-authored-by: Chimera <chimera_defi@protonmail.com>"
```

---

## Task 14: Add upgrades.spec.ts (UUPS storage survival tests)

**Files:**
- Create: `staking-contracts/test/v2/modular-staking/upgrades.spec.ts`

- [ ] **Step 14.1: Create the file**

```ts
import { ethers, upgrades } from "hardhat";
import { expect } from "chai";
import {
  StakingRouter__factory,
  ValidatorModule__factory,
  LSTWrapModule__factory,
  OperatorRegistry__factory,
} from "../../../types";

/**
 * Verifies that UUPS upgrades preserve storage state.
 * Each test: deploys proxy → writes state → upgrades to same impl (no-op) → reads state.
 */
describe("UUPS Upgrade storage survival", () => {
  let deployer: any;
  let gov: string;

  before(async () => {
    [deployer] = await ethers.getSigners();
    gov = deployer.address;
  });

  it("StakingRouter: GOV role and ST_TOKEN survive an upgrade", async () => {
    // Deploy a minimal StToken stub (or use zero-address with a mock)
    // For this test we deploy the real StToken
    const StTokenFactory = await ethers.getContractFactory("StToken", deployer);
    const stToken = await StTokenFactory.deploy(gov);
    await stToken.waitForDeployment();
    const stTokenAddress = await stToken.getAddress();

    const RouterFactory = await ethers.getContractFactory("StakingRouter", deployer);
    const proxy = await upgrades.deployProxy(RouterFactory, [stTokenAddress, gov], {
      kind: "uups",
      initializer: "initialize",
    });
    await proxy.waitForDeployment();
    const proxyAddress = await proxy.getAddress();

    const router = StakingRouter__factory.connect(proxyAddress, deployer);
    const GOV_ROLE = await router.GOV();
    expect(await router.hasRole(GOV_ROLE, gov)).to.equal(true);
    expect((await router.ST_TOKEN()).toLowerCase()).to.equal(stTokenAddress.toLowerCase());

    // Upgrade to same implementation (no-op upgrade)
    const RouterFactoryV2 = await ethers.getContractFactory("StakingRouter", deployer);
    const upgraded = await upgrades.upgradeProxy(proxyAddress, RouterFactoryV2, { kind: "uups" });
    await upgraded.waitForDeployment();

    // State must be intact
    expect(await router.hasRole(GOV_ROLE, gov)).to.equal(true, "GOV role lost after upgrade");
    expect((await router.ST_TOKEN()).toLowerCase()).to.equal(stTokenAddress.toLowerCase(), "ST_TOKEN lost after upgrade");
  });

  it("ValidatorModule: ROUTER, MODULE_ID, and GOV role survive an upgrade", async () => {
    // Deploy a minimal StToken and Router first
    const StTokenFactory = await ethers.getContractFactory("StToken", deployer);
    const stToken = await StTokenFactory.deploy(gov);
    await stToken.waitForDeployment();
    const RouterFactory = await ethers.getContractFactory("StakingRouter", deployer);
    const routerProxy = await upgrades.deployProxy(RouterFactory, [await stToken.getAddress(), gov], { kind: "uups" });
    await routerProxy.waitForDeployment();
    const routerAddress = await routerProxy.getAddress();

    const moduleId = ethers.keccak256(ethers.toUtf8Bytes("SOLO_VALIDATOR_TEST"));
    const beaconDeposit = ethers.ZeroAddress; // local test — default fallback to constant

    const VMFactory = await ethers.getContractFactory("ValidatorModule", deployer);
    const proxy = await upgrades.deployProxy(
      VMFactory,
      [routerAddress, moduleId, gov, beaconDeposit],
      { kind: "uups", initializer: "initialize" },
    );
    await proxy.waitForDeployment();
    const proxyAddress = await proxy.getAddress();

    const vm = ValidatorModule__factory.connect(proxyAddress, deployer);
    expect(await vm.MODULE_ID()).to.equal(moduleId);
    expect((await vm.ROUTER()).toLowerCase()).to.equal(routerAddress.toLowerCase());

    // No-op upgrade
    const VMFactoryV2 = await ethers.getContractFactory("ValidatorModule", deployer);
    await upgrades.upgradeProxy(proxyAddress, VMFactoryV2, { kind: "uups" });

    expect(await vm.MODULE_ID()).to.equal(moduleId, "MODULE_ID lost after upgrade");
    expect((await vm.ROUTER()).toLowerCase()).to.equal(routerAddress.toLowerCase(), "ROUTER lost after upgrade");
  });

  it("OperatorRegistry: sgtToken and GOV role survive an upgrade", async () => {
    const MockERC20Factory = await ethers.getContractFactory("StToken", deployer); // reuse StToken as ERC20
    const sgt = await MockERC20Factory.deploy(gov);
    await sgt.waitForDeployment();
    const sgtAddress = await sgt.getAddress();

    const RegistryFactory = await ethers.getContractFactory("OperatorRegistry", deployer);
    const proxy = await upgrades.deployProxy(RegistryFactory, [sgtAddress, gov], { kind: "uups", initializer: "initialize" });
    await proxy.waitForDeployment();
    const proxyAddress = await proxy.getAddress();

    const reg = OperatorRegistry__factory.connect(proxyAddress, deployer);
    const GOV_ROLE = await reg.GOV();
    expect(await reg.hasRole(GOV_ROLE, gov)).to.equal(true);
    expect((await reg.sgtToken()).toLowerCase()).to.equal(sgtAddress.toLowerCase());

    const RegistryFactoryV2 = await ethers.getContractFactory("OperatorRegistry", deployer);
    await upgrades.upgradeProxy(proxyAddress, RegistryFactoryV2, { kind: "uups" });


    expect(await reg.hasRole(GOV_ROLE, gov)).to.equal(true, "GOV role lost after upgrade");
    expect((await reg.sgtToken()).toLowerCase()).to.equal(sgtAddress.toLowerCase(), "sgtToken lost after upgrade");
  });
});
```

- [ ] **Step 14.2: Run the suite**

```bash
cd staking-contracts && npx hardhat test test/v2/modular-staking/upgrades.spec.ts 2>&1 | tail -20
```

Expected: 3 passing.

- [ ] **Step 14.3: Commit**

```bash
git add staking-contracts/test/v2/modular-staking/upgrades.spec.ts
git commit -m "test(upgrades): add UUPS storage-survival tests for proxied contracts

Co-authored-by: Chimera <chimera_defi@protonmail.com>"
```

---

## Task 15: Run full test suite and fix failures

- [ ] **Step 15.1: Run all modular-staking tests**

```bash
cd staking-contracts && npx hardhat test test/v2/modular-staking/*.spec.ts 2>&1 | tail -40
```

- [ ] **Step 15.2: For each failing test, identify whether it uses a direct deploy or fixture**

If a test fails with `TypeError: ... is not a function` or `Error: unknown function initialize` it is using a direct factory deploy that needs updating per the pattern in Task 13, Step 13.2.

If a test fails with `Error: ... has no signer` or access control revert, check that the proxy `initialize()` args match what was previously passed to the constructor.

- [ ] **Step 15.3: Run invariant tests**

```bash
cd staking-contracts && npm run test:invariants 2>&1 | tail -20
```

Expected: all invariants pass.

- [ ] **Step 15.4: Commit any fixes**

```bash
git add staking-contracts/test/
git commit -m "test: fix remaining spec files after UUPS proxy conversion

Co-authored-by: Chimera <chimera_defi@protonmail.com>"
```

---

## Task 16: Update architecture.md and PR.md

**Files:**
- Modify: `docs/modular-staking/architecture.md`
- Modify: `PR.md`

- [ ] **Step 16.1: Update Section 3 of architecture.md**

In the "Router and module layer" table under Section 3, append to each proxied contract entry:

| Contract | Note |
|---|---|
| `StakingRouter.sol` | Deployed as UUPS proxy. GOV-gated `_authorizeUpgrade`. |
| `modules/ValidatorModule.sol` | Deployed as UUPS proxy. GOV-gated `_authorizeUpgrade`. |
| `modules/LSTWrapModule.sol` | Deployed as UUPS proxy. GOV-gated `_authorizeUpgrade`. |
| `OperatorRegistry.sol` | Deployed as UUPS proxy. GOV-gated `_authorizeUpgrade`. |

Add a new "Upgrade Mechanism" note after Section 3:

```markdown
#### Upgrade Mechanism

StakingRouter, ValidatorModule, LSTWrapModule, and OperatorRegistry are deployed as
UUPS proxies (ERC-1967). The proxy address is stable across upgrades; the implementation
address can be changed via `upgradeToAndCall()` gated by `onlyRole(GOV)`. Because GOV is
behind a timelock post-handover, all upgrades have a mandatory delay window.

DVTModule will be registered post-launch via `StakingRouter.registerModule()` with no
changes to any deployed core contract. See `feat/dvt-module` for the DVT implementation.
```

- [ ] **Step 16.2: Update Section 10 (Deferred) of architecture.md**

Replace:

```markdown
- Safe upgradability design and operational guardrails.
```

With:

```markdown
- DVTModule — deferred to `feat/dvt-module` (PR 381). Registers via `StakingRouter.registerModule()` post-launch.
```

- [ ] **Step 16.3: Update PR.md**

Replace the existing summary bullets with:

```markdown
## Summary
- Ship modular staking V3 core: ERC4626 wrapper, veSGT governance locks, old vEth2 withdrawal history UI
- UUPS proxy upgradeability on StakingRouter, ValidatorModule, LSTWrapModule, OperatorRegistry
- DVTModule extracted to feat/dvt-module (PR 381) for separate audit
- 5-round Solidity security audit: 25+ bugs fixed across validator modules, oracle adapters, DVT (pre-split)
- CI hardening: Foundry invariant pipeline + UUPS upgrade survival tests
```

- [ ] **Step 16.4: Commit**

```bash
git add docs/modular-staking/architecture.md PR.md
git commit -m "docs: update architecture and PR.md for UUPS + DVT split

Co-authored-by: Chimera <chimera_defi@protonmail.com>"
```

---

## Task 17: Final gate — full build, lint, and test pass

- [ ] **Step 17.1: Run all gates in sequence**

```bash
cd staking-contracts && npm run lint:sol 2>&1 | tail -5
```

Expected: no errors (warnings OK).

```bash
cd staking-contracts && npx hardhat compile 2>&1 | tail -3
```

Expected: `Compiled N Solidity files successfully`.

```bash
bun run type-check 2>&1 | tail -5
```

Expected: no TypeScript errors.

```bash
cd staking-contracts && npx hardhat test test/v2/modular-staking/*.spec.ts 2>&1 | grep -E "passing|failing|pending"
```

Expected: N passing, 0 failing.

```bash
cd staking-contracts && npm run test:invariants 2>&1 | grep -E "passing|failing"
```

Expected: all invariants pass.

- [ ] **Step 17.2: Commit final state if any fixes were needed**

```bash
git add -A
git commit -m "chore(gates): all gates green after UUPS + DVT split

Co-authored-by: Chimera <chimera_defi@protonmail.com>"
```
