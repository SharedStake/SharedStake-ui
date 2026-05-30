# SharedStake V2 Modular Staking Architecture

Status: router-first baseline for clean PR reconstruction (docs-first)

## 1. Primary Architecture Decision

This phase targets a single optimal path:
- Canonical staking entry: `StakingRouter`
- Canonical execution modules: `ValidatorModule`, `DVTModule`, `LSTWrapModule`
- Canonical token layer: `StToken` and `WstToken`
- Canonical exit layer: `WithdrawalQueueV2`

`StakingCore` is not treated as a compatibility requirement for this phase. It may still exist in-repo, but this workstream does not optimize for coexistence.

## 2. Objective

Deliver a production-oriented router-based staking system with:
- Explicit module risk budgets and policy controls
- Deterministic share accounting
- Oracle-gated pooled ETH updates
- Queue-based exits with stress-mode controls

## 3. Implemented Contract Surface (Router-First)

### Token and math layer
- `ShareMath.sol`: deterministic share/ETH conversion helpers.
- `StToken.sol`: share accounting, rebasing supply (`totalPooledEther`), MINTER-gated mint/burn.
- `WstToken.sol`: wrap/unwrap around `StToken` shares.

### Router and module layer
- `StakingRouter.sol`: module registry, deposit routing, module caps/limits, policy checks, pooled accounting.
- `modules/ValidatorModule.sol`: validator-backed module with beacon deposits and report forwarding.
- `modules/DVTModule.sol`: DVT-oriented validator module variant.
- `modules/LSTWrapModule.sol`: LST wrapping path into router-minted `StToken`.

### Oracle, fee, and policy layer
- `FeeController.sol`: fee bps and treasury/operator/referral/DebtPool split.
- `OracleAdapter.sol`: single-submitter sanity-gated reporting.
- `QuorumOracleAdapter.sol`: M-of-N submitter quorum reporting.
- `StEthPriceOracle`: stETH pricing adapter used by `LSTWrapModule` (now reads Chainlink updatedAt for staleness checks).
- `InstitutionalPolicyRegistry.sol`: policy hooks for allowlist/blocklist/private modes.

### Debt distribution layer
- `DebtPool.sol`: Merkle tree-based debt distribution for protocol liabilities and fee claims.

### Exit layer
- `WithdrawalQueueV2.sol`: request/finalize/claim lifecycle with TURBO/BUNKER modes.

### Referral backend layer
- `services/referral-service`: short-code referral API, SQLite persistence, API-key auth/rate limiting.
- `services/referral-service/src/worker/onchainSync.ts`: read-only ingestion of `ReferralRegistry.DepositRecorded` events with divergence logging.

## 4. High-Level Responsibilities

| Component | Responsibility |
|---|---|
| `StakingRouter` | Canonical entrypoint and pooled accounting coordinator. |
| `ValidatorModule` | ETH validator flow for router-based staking. |
| `DVTModule` | Validator flow variant reserved for DVT operations. |
| `LSTWrapModule` | LST in/out module using external price oracle. |
| `StToken` | Global share ledger and rebasing supply source of truth. |
| `WstToken` | Non-rebasing wrapper over `StToken` shares. |
| `FeeController` | Protocol fee config and split policy (treasury/operator/referral/DebtPool). |
| `OracleAdapter` | Single-submitter report validation and forwarding. |
| `QuorumOracleAdapter` | Consensus report validation and forwarding. |
| `StEthPriceOracle` | Chainlink-backed stETH price oracle for LST module with staleness checks. |
| `InstitutionalPolicyRegistry` | Optional per-module policy gate provider. |
| `DebtPool` | Merkle tree-based debt distribution for protocol liabilities and fee claims. |
| `WithdrawalQueueV2` | Exit queue with request-time value lock and guarded finalization. |
| `Referral Service` | Offchain code-to-address mapping and referral code lifecycle (create/revoke/list/resolve). |
| `Referral Sync Worker` | Reads onchain referral events and reports backend/onchain mapping divergence. |

## 5. Router-Centric Accounting Model

### 5.1 Share math
- Shares are minted from ETH-equivalent value using pool state.
- ETH-equivalent value is recovered from shares using current pooled state.
- Conversions floor on division to avoid over-issuance.

### 5.2 Pooled ETH invariant
`totalPooledEther` should track aggregate module value under the router:
- Validator modules: buffered ETH + beacon-side value
- LST module: oracle-priced ETH-equivalent value

### 5.3 Fee semantics
- Fees are accounted as share minting to fee recipients.
- Fee accounting changes ownership distribution, not direct user ETH transfers.

### 5.4 Exit semantics
- `requestWithdrawals` locks request value at request time.
- `finalize` requires guardian-provided ETH backing.
- `claimWithdrawal` / `claimWithdrawals` enforce ownership and one-time claim rules.

## 6. Roles and Trust Model

| Role | Primary authority | Typical holder |
|---|---|---|
| `DEFAULT_ADMIN_ROLE` | Role grant/revoke root authority | Timelock or multisig |
| `GOV` | Parameter/control-plane updates | Governance multisig/timelock |
| `GUARDIAN` | Emergency pause and queue finalization authority | Security multisig |
| `ORACLE` | Push accepted beacon reports into reportable contracts | Oracle adapter(s) |
| `SUBMITTER` | Submit raw oracle observations to adapter(s) | Oracle infra keys |
| `NODE_OPERATOR` | Beacon deposit baseline/deposit flows | Validator operations keys |
| `MINTER` | Mint/burn and pooled accounting authority on `StToken` | Router path contracts only |
| `POLICY_ADMIN` | Institutional policy management | Compliance or governance ops |

Trust notes:
- `MINTER` holders are critical to supply integrity.
- Oracle parameter quality directly affects dilution/slash handling safety.
- Guardian liveness affects user exit timing during stress events.

## 7. Built-In Risk Controls

- Pausing surface via guardian/governance roles.
- Oracle sanity bounds (drift, slash, staleness) in adapters.
- Per-module and global caps in router path.
- Inflow limiter windows in router path.
- Bunker mode constraints in withdrawal queue.
- Explicit beacon baseline notifications to avoid principal/reward misclassification.

## 8. Confirmed Test Surface

`SharedDeposit/test/v2/modular-staking/` contains targeted suites for:
- E2E and router E2E flows
- Router controls (caps, policies, inflow limits)
- Oracle and quorum behavior
- Role-access checks
- Adversarial and fuzz scenarios
- Queue lifecycle behavior
- LST module behavior

This doc does not claim all tests are currently green in this branch; it describes coverage targets and existing suites.

## 9. Deferred to Next Phase (After Core Stabilization)

- Safe upgradability design and operational guardrails.
- Backward compatibility and migration paths.
- Coexistence behavior with any legacy staking surface.
