# PR 379 — DVT Split + UUPS Module Proxy Design

**Date:** 2026-06-12  
**Status:** Approved for implementation  
**Branch:** `feat/protocol-v3-fresh` → split into `feat/protocol-v3-fresh` (PR 379) + `feat/dvt-module` (PR 381)

---

## 1. Objective

Ship PR 379 with a secure, audited core protocol that is modular enough to add DVT post-launch. Extract DVTModule and all DVT-related code to a new branch (`feat/dvt-module`) for a separate audit and PR. Add UUPS proxy upgradeability to the contracts that hold value or require future patching.

---

## 2. Branch Split

### Moves to `feat/dvt-module`

| File | Notes |
|---|---|
| `staking-contracts/contracts/v2/modular-staking/modules/DVTModule.sol` | Full contract |
| `staking-contracts/deploy/012_dvtModule.ts` | Deploy script |
| `staking-contracts/test/v2/modular-staking/dvtModule.spec.ts` | Unit tests |
| DVT-specific sections of `test/v2/modular-staking/fork.spec.ts` | Extract to fork-dvt.spec.ts on dvt branch |
| `src/components/ModularStaking/DVTStakePanel.vue` | Frontend panel |

### Stays in PR 379

All core contracts, all deploy scripts 001–011 and 013–021, all tests except DVT-specific, all other frontend components. `ModularStakingApp.vue` is updated to remove the DVTStakePanel import.

### Why DVT is deferred

DVTModule has been the source of ~4 of the security findings across audit rounds (H3 state-after-deposit, F-01 cancel-grief, incrementActive(executor) asymmetry, _executeProposal duplicating _doBeaconDeposit logic). Its test suite is the smallest of the major contracts. The `IStakingModule` interface already provides a clean hook point — DVTModule can be registered post-launch via `StakingRouter.registerModule()` with zero changes to any deployed core contract.

---

## 3. UUPS Proxy Upgradeability

### Which contracts get UUPS proxies

| Contract | Proxy | Reason |
|---|---|---|
| `StakingRouter` | Yes | Central accounting coordinator; upgrading without re-registering all modules is essential |
| `ValidatorModule` | Yes | Holds buffered ETH; bug patches must be in-place |
| `LSTWrapModule` | Yes | Holds LST tokens; oracle address or slippage logic may need patching |
| `OperatorRegistry` | Yes | Bond/slash accounting; holds SGT NFT escrow |
| `StToken` | No | Immutable share ledger; upgrading risks supply integrity |
| `WithdrawalQueueV2` | No | Holds user-locked ETH; proxy risk > benefit; V3 queue replaces it |
| `FeeController`, oracles, `DebtPool`, `MigrationHelper` | No | Config-only or replaceable via setter; low value-at-risk |

### Mechanical changes per proxied contract

1. Inherit `UUPSUpgradeable` + `Initializable` (OpenZeppelin v5) instead of bare `AccessControl`.
2. Add `constructor() { _disableInitializers(); }` to prevent direct-implementation initialization attacks.
3. Replace constructor body with `function initialize(...) public initializer { ... }`.
4. Add `function _authorizeUpgrade(address) internal override onlyRole(GOV) {}`.
5. Add `uint256[50] private __gap;` at the end of each contract's storage to protect inheritance-chain extensions.

### Deploy script pattern

```ts
// Before (raw deploy)
const { contract } = await deploy(ValidatorModule__factory, { args: [...] });

// After (UUPS proxy)
const impl = await deploy(ValidatorModule__factory, { args: [] }); // no-arg constructor
const proxy = await upgrades.deployProxy(ValidatorModule__factory, initArgs, {
  kind: "uups",
  initializer: "initialize",
});
```

Proxy addresses (not implementation addresses) are what downstream scripts wire together. The `hardhat-upgrades` plugin validates storage layout compatibility at deploy time.

### Upgrade authority

`GOV` role controls `_authorizeUpgrade` on all proxied contracts. The governance handover script puts `GOV` behind a timelock, so upgrades have a mandatory delay before execution. This matches Lido's upgrade safety posture.

### Upgrade scripts

Future upgrade proposals go in `staking-contracts/deploy/upgrades/`:
```
upgrades/ValidatorModule_V2.ts   — template for future upgrades
```
These are not run on fresh deployments.

---

## 4. Test Changes

- All proxy-aware tests use `upgrades.deployProxy(...)` instead of `Factory.deploy(...)`.
- Add `staking-contracts/test/v2/modular-staking/upgrades.spec.ts`:
  - Deploys each UUPS-proxied contract via proxy.
  - Upgrades to a V2 stub implementation.
  - Asserts all storage slots survive the upgrade (balances, roles, config).
- `dvtModule.spec.ts` removed from PR 379 (moves to `feat/dvt-module`).
- DVT sections extracted from `fork.spec.ts` and removed; remaining fork tests cover solo-validator and LST paths only.

---

## 5. Architecture Doc Updates

- `docs/modular-staking/architecture.md`:
  - Section 3: add UUPS proxy entries for StakingRouter, ValidatorModule, LSTWrapModule, OperatorRegistry.
  - Section 10 (Deferred): replace "Safe upgradability design" with "UUPS proxy deployed (see Section 3)"; add "DVTModule deferred to feat/dvt-module — register post-launch via StakingRouter.registerModule()".
- `PR.md`: update scope to reflect DVT removal and UUPS addition.

---

## 6. How DVT Gets Added Post-Launch

No changes to any deployed core contract are required. The sequence is:

1. Audit DVTModule independently on `feat/dvt-module`.
2. Deploy `DVTModule` pointing to the already-deployed `StakingRouter` proxy.
3. Governance proposal calls:
   - `StakingRouter.allowlistModuleCodeHash(DVT_VALIDATOR, dvtCodeHash, true)`
   - `StakingRouter.registerModule(DVT_VALIDATOR_1, dvtModuleAddress, mintCapWei)`
4. DVTStakePanel.vue ships with the frontend PR.

---

## 7. Security Considerations

- **Storage layout drift:** The `__gap` pattern and `hardhat-upgrades` storage layout validator prevent silent storage corruption on upgrade. All proxied contracts must pass `upgrades.validateImplementation()` in CI.
- **Initializer replay:** `_disableInitializers()` in each implementation constructor blocks direct calls to `initialize()` on the implementation contract.
- **Upgrade authority concentration:** GOV behind a timelock is the only path to `_authorizeUpgrade`. No multisig-bypass path exists.
- **DVT deferred risk:** By not shipping DVTModule in PR 379, the beacon deposit attack surface is limited to the simpler `ValidatorModule._doBeaconDeposit` path, which has been audited through 5 rounds.
