# SharedStake V2 Modular Staking Architecture

Status: router-first launch candidate with OperatorRegistry, migration helper, and frontend ABI coverage

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
- `StTokenERC4626Wrapper.sol`: ERC-4626 vault wrapper for non-rebasing DeFi integrations that want a standard tokenized-vault surface.

### Router and module layer

- `StakingRouter.sol`: module registry, deposit routing, module caps/limits, policy checks, pooled accounting.
- `modules/ValidatorModule.sol`: validator-backed module with beacon deposits and report forwarding.
- `modules/DVTModule.sol`: DVT-oriented validator module variant.
- `modules/LSTWrapModule.sol`: LST wrapping path into router-minted `StToken`.
- `OperatorRegistry.sol`: ETH + SGT bond registry for validator/DVT module eligibility, with optional escrowed NFT SGT credit.
- `MigrationHelper.sol`: governance-controlled router migration notice and activation signal.

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
- `OldVeth2WithdrawalQueue.sol`: standalone FIFO queue for legacy vEth2 redemptions into guardian-funded ETH claims.

### Referral backend layer

- `services/referral-service`: short-code referral API, SQLite persistence, API-key auth/rate limiting.
- `services/referral-service/src/worker/onchainSync.ts`: read-only ingestion of `ReferralRegistry.DepositRecorded` events with divergence logging.

## 4. High-Level Responsibilities

| Component | Responsibility |
|---|---|
| `StakingRouter` | Canonical entrypoint and pooled accounting coordinator. |
| `ValidatorModule` | ETH validator flow for router-based staking. |
| `DVTModule` | Validator flow variant reserved for DVT operations. |
| `LSTWrapModule` | LST in/out module using external price oracle; unwraps require stToken approval and burn only module-custodied shares. |
| `OperatorRegistry` | Operator eligibility, bond accounting, slashing, module caller controls, optional NFT credit escrow. |
| `MigrationHelper` | Timelocked migration announcement and activation state for frontends/integrators. |
| `StToken` | Global share ledger and rebasing supply source of truth. |
| `WstToken` | Non-rebasing wrapper over `StToken` shares. |
| `StTokenERC4626Wrapper` | ERC-4626 compatibility wrapper over `StToken`; synchronous redeem returns `stToken`, while ETH exits still use `WithdrawalQueueV2`. |
| `FeeController` | Protocol fee config and split policy (treasury/operator/referral/DebtPool). |
| `OracleAdapter` | Single-submitter report validation and forwarding. |
| `QuorumOracleAdapter` | Consensus report validation and forwarding. |
| `StEthPriceOracle` | Chainlink-backed stETH price oracle for LST module with staleness checks. |
| `InstitutionalPolicyRegistry` | Optional per-module policy gate provider. |
| `DebtPool` | Merkle tree-based debt distribution for protocol liabilities and fee claims. |
| `WithdrawalQueueV2` | Exit queue with request-time value lock, optional router accounting syncer, and guarded finalization. |
| `OldVeth2WithdrawalQueue` | Legacy vEth2 FIFO exit queue. It escrows old vEth2, locks ETH owed at request-time redemption rate, and requires guardian-funded FIFO finalization before claim. |
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
- `requestWithdrawals` requires the request owner to be the caller, so burning shares cannot assign claim ownership to another account.
- `finalize` requires guardian-provided ETH backing.
- `claimWithdrawal` / `claimWithdrawals` enforce ownership and one-time claim rules.
- Legacy vEth2 exits use `OldVeth2WithdrawalQueue`: request transfers the caller's old vEth2 into escrow, finalize advances sequential request IDs with ETH funding, and claim pays only finalized locked ETH back to the request owner. Delegated request ownership and recipient redirection are intentionally unsupported for this legacy queue.

## 6. Standards Surface

| Surface                                | Standard posture                                                                                   | Notes                                                                                                                                                                             |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `StakingRouter`                        | Custom native-ETH staking entry                                                                    | ERC-4626 is not a fit because deposits are native ETH and routing includes module caps, policy checks, referrals, source attribution, and module custody.                         |
| `StToken`                              | ERC-20-compatible rebasing token, custom share ledger                                              | `StToken` is the pooled accounting source of truth and remains intentionally minimal around MINTER-gated share mint/burn.                                                         |
| `WstToken`                             | ERC-20 + ERC-2612-style permit wrapper                                                             | Lido-style non-rebasing share wrapper for users who want fixed balances.                                                                                                          |
| `StTokenERC4626Wrapper`                | ERC-4626 wrapper with ERC-165 detection for `IERC4626`                                             | Permissionless integration wrapper. `withdraw`/`redeem` return `stToken` synchronously; conversion from `stToken` to ETH remains the queue flow.                                  |
| `WithdrawalQueueV2`                    | Custom async exit queue, ERC-7540-inspired but not ERC-7540-compliant                              | Preserves request-time value locking, guardian finalization, TURBO/BUNKER modes, and batch claims. ERC-7540 should be added only as an adapter/facade if an integration needs it. |
| `OldVeth2WithdrawalQueue`              | Custom legacy redemption queue                                                                     | Not ERC-7540 or ERC-4626. It exists only for old vEth2 liabilities and uses configurable virtual-price quotes plus strict FIFO finalization.                                      |
| `VoteEscrowV2` / `SharedStakeGovernor` | OpenZeppelin `ERC20Votes` / `GovernorVotes` using `IERC5805` and `IERC6372` surfaces from OZ 4.9.6 | veSGT is non-transferable and decays by lock time; keepers/users should checkpoint before proposal snapshots.                                                                     |

## 7. Roles and Trust Model

| Role                 | Primary authority                                      | Typical holder                     |
| -------------------- | ------------------------------------------------------ | ---------------------------------- |
| `DEFAULT_ADMIN_ROLE` | Role grant/revoke root authority                       | Timelock or multisig               |
| `GOV`                | Parameter/control-plane updates                        | Governance multisig/timelock       |
| `GUARDIAN`           | Emergency pause and queue finalization authority       | Security multisig                  |
| `ORACLE`             | Push accepted beacon reports into reportable contracts | Oracle adapter(s)                  |
| `SUBMITTER`          | Submit raw oracle observations to adapter(s)           | Oracle infra keys                  |
| `NODE_OPERATOR`      | Beacon deposit baseline/deposit flows                  | Validator operations keys          |
| `MINTER`             | Mint/burn and pooled accounting authority on `StToken` | Router path contracts only         |
| `POLICY_ADMIN`       | Institutional policy management                        | Compliance or governance ops       |
| `CALLER`             | OperatorRegistry active-validator callbacks            | ValidatorModule and DVTModule only |

Trust notes:

- `MINTER` holders are critical to supply integrity.
- Oracle parameter quality directly affects dilution/slash handling safety.
- Guardian liveness affects user exit timing during stress events.

## 8. Built-In Risk Controls

- Pausing surface via guardian/governance roles.
- Oracle sanity bounds (drift, slash, staleness) in adapters.
- Per-module and global caps in router path.
- Inflow limiter windows in router path.
- Bunker mode constraints in withdrawal queue.
- Legacy vEth2 queue separates request pausing, finalization pausing, and cancellation pausing; locked ETH, pending finalize refunds, and unfinalized vEth2 are excluded from recovery.
- OperatorRegistry bond accounting for SGT/ETH collateral and optional locked-NFT SGT credit.
- MigrationHelper's fixed notice period before router migration activation.
- Explicit beacon baseline notifications to avoid principal/reward misclassification.

## 9. Confirmed Test Surface

`staking-contracts/test/v2/modular-staking/` contains targeted suites for:

- E2E and router E2E flows
- Router controls (caps, policies, inflow limits)
- Oracle and quorum behavior
- Role-access checks
- Adversarial and fuzz scenarios
- Queue lifecycle behavior
- Legacy vEth2 FIFO redemption lifecycle and recovery boundaries
- LST module behavior

This doc does not claim all tests are currently green in this branch; it describes coverage targets and existing suites.

## 10. Deferred to Next Phase (After Core Stabilization)

- Safe upgradability design and operational guardrails.
- Backward compatibility and migration paths.
- Coexistence behavior with any legacy staking surface.
