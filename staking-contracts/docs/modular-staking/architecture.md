# SharedStake V3 Modular Staking — Architecture

> **PR 379 scope**: This document describes the contracts merged in PR 379 (`feat/protocol-v3-fresh`). DVTModule is **not** part of PR 379; see [DVT deferred](#dvtmodule-deferred-to-featdvt-module-pr-381) below.

---

## System Overview

The SharedStake V3 modular staking system is a composable, upgradeable on-chain staking infrastructure. At its core is a `StakingRouter` contract that delegates operations to interchangeable modules. Each module handles a distinct staking strategy (native validator deposits, LST wrapping, DVT, etc.). Modules can be registered or deregistered at runtime via governance without deploying a new router.

```
                      ┌─────────────────────────────────┐
                      │         Governance / Timelock   │
                      └────────────────┬────────────────┘
                                       │ GOV role
                    ┌──────────────────▼──────────────────┐
                    │       StakingRouter (UUPS Proxy)     │
                    │  • routes stake/unstake to modules   │
                    │  • owns FeeController, StToken refs  │
                    └────┬─────────────┬──────────────────┘
                         │             │
             ┌───────────▼──┐   ┌──────▼────────────┐
             │ ValidatorMod │   │   LSTWrapModule   │
             │ (UUPS Proxy) │   │   (UUPS Proxy)    │
             └───────┬──────┘   └──────────────────┘
                     │
             ┌───────▼──────────────┐
             │   OperatorRegistry   │
             │   (UUPS Proxy)       │
             └──────────────────────┘
```

### Supporting Contracts (not proxied)

| Contract               | Role                                                                  |
| ---------------------- | --------------------------------------------------------------------- |
| `StakingCore`          | Core accounting and share math                                        |
| `StToken`              | Rebasing staking token (ERC-20)                                       |
| `WstToken`             | Non-rebasing wrapped token                                            |
| `WithdrawalQueueV2`    | Withdrawal processing queue                                           |
| `FeeController`        | Fee routing and distribution                                          |
| `DebtPool`             | Merkle-based debt distribution                                        |
| `SgEthV1Claim`         | sgETH V1 loss receipt-token Merkle claim; non-transferable by default |
| `OracleAdapter`        | Price feed interface                                                  |
| `QuorumOracleAdapter`  | Multi-oracle quorum impl                                              |
| `StEthPriceOracle`     | stETH parity price oracle                                             |
| `ReferralCodeRegistry` | Referral code management                                              |

---

## UUPS Proxy Upgradeability (ERC-1967)

**Contracts behind UUPS proxies in PR 379:**

| Contract           | Proxy pattern | Upgrade auth                |
| ------------------ | ------------- | --------------------------- |
| `StakingRouter`    | ERC-1967 UUPS | `GOV` role (timelock-gated) |
| `ValidatorModule`  | ERC-1967 UUPS | `GOV` role (timelock-gated) |
| `LSTWrapModule`    | ERC-1967 UUPS | `GOV` role (timelock-gated) |
| `OperatorRegistry` | ERC-1967 UUPS | `GOV` role (timelock-gated) |

### Why UUPS over redeployment

ETH-holding contracts cannot be easily replaced — migrating all deposited ETH to a new address requires costly coordinated withdrawals. The UUPS pattern (OpenZeppelin `UUPSUpgradeable`) keeps the proxy address and its ETH balance stable while allowing the logic contract to be swapped via `upgradeToAndCall()`. The proxy address is what all integrators, UI, and governance scripts reference; the implementation address changes silently on upgrade.

### Upgrade flow

1. Deploy new implementation contract (with same storage layout).
2. Governance submits an upgrade proposal through the timelock.
3. After the timelock delay elapses, `upgradeToAndCall(newImpl, data)` is called on the proxy.
4. Only addresses holding the `GOV` role (managed by the timelock) can authorize upgrades via `_authorizeUpgrade()`.

### Storage layout invariant

All upgradeable contracts inherit from `Initializable` and use `__gap` storage padding to reserve 50 slots. New versions **must not** reorder existing storage variables. Use the `hardhat-upgrades` `validateUpgrade()` helper before deploying any new implementation.

---

## GranularPauseUpgradeable

**File:** `contracts/v2/lib/GranularPauseUpgradeable.sol`

A UUPS-compatible selective pause library. Supports per-function-selector pause flags so a single misbehaving entry point can be frozen without taking down the entire contract.

**Why a separate `GranularPauseUpgradeable` instead of using `GranularPause`?**

`GranularPause` inherits from `Context`. In the UUPS inheritance chain (`UUPSUpgradeable → ERC1967UpgradeUpgradeable → ... → Context`) this creates a C3-linearization conflict when the upgradeable contracts also inherit from `AccessControlUpgradeable` (which itself pulls in `Context` via a separate path). Removing the `Context` inheritance in `GranularPauseUpgradeable` resolves the diamond conflict without changing any external-facing behavior.

---

## Module System

### Registering a new module

```solidity
// Governance calls this — no core contract changes required
stakingRouter.registerModule(moduleAddress);
```

Modules must implement `IStakingModule`. Once registered they are callable via the router's dispatch path. Modules can be deregistered without redeploying the router.

### Module isolation

Each module is independently upgradeable. A bug in `LSTWrapModule` can be patched by upgrading that proxy without touching `ValidatorModule` or `StakingRouter`.

---

## DVTModule — Deferred to `feat/dvt-module` (PR 381)

The Distributed Validator Technology (DVT) module is **not included in PR 379**.

It has been split to a separate branch `feat/dvt-module` (target PR 381) to:

1. Allow PR 379 to ship a clean, auditable UUPS proxy foundation.
2. Permit independent security review of the DVT-specific bond/slashing logic.

**Post-PR 379 integration path (no core changes required):**

```
git checkout feat/dvt-module   # branch with DVTModule
# ... audit and merge PR 381
# then on mainnet:
stakingRouter.registerModule(dvtModuleProxy);
```

DVTModule will use the same UUPS proxy pattern and `GranularPauseUpgradeable` base established in PR 379.

---

## Security Properties

| Property              | Mechanism                                                                                                                                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Upgrade authorization | `GOV` role only; enforced by `_authorizeUpgrade()`                                                                                                                                                             |
| Pause granularity     | Per-selector pause via `GranularPauseUpgradeable`                                                                                                                                                              |
| Initialization guard  | `initializer` modifier on all `initialize()` functions                                                                                                                                                         |
| Re-entrancy           | `ReentrancyGuardUpgradeable` on ETH-accepting paths                                                                                                                                                            |
| Oracle manipulation   | `StEthPriceOracle` derives price from Lido's share math (`getPooledEthByShares`), not a spot feed; Chainlink is used only as a staleness heartbeat. `LSTWrapModule` enforces a `maxOracleAge` staleness guard. |

---

## Contract Locations

```
staking-contracts/contracts/v2/modular-staking/
  StakingRouter.sol          # UUPS proxy — main router
  OperatorRegistry.sol       # UUPS proxy — operator bond/slot accounting
  modules/
    ValidatorModule.sol      # UUPS proxy — native validator deposits
    LSTWrapModule.sol        # UUPS proxy — LST wrapping strategy

staking-contracts/contracts/v2/lib/
  GranularPauseUpgradeable.sol   # UUPS-safe selective pause
  GranularPause.sol              # Non-upgradeable variant (legacy)
```

---

## See Also

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) — deployment sequence and env vars
- [deploy_log.md](../../deploy_log.md) — historical deploy addresses
