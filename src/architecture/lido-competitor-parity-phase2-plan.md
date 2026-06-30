# Lido / Rocket Pool / StakeWise Parity Plan (Phase 2+)

Last updated: 2026-05-06
Owner: protocol + contracts

## Scope

Build a modular roadmap to reach competitive parity while preserving SharedStake's documented phased rollout and security-first posture.

Primary references:
- SharedStake modular staking architecture (`docs/modular-staking/architecture.md`)
- SharedStake protocol diagrams (`docs/modular-staking/diagrams.md`)
- Lido docs (StakingRouter, Lido, WithdrawalQueue, Accounting/Oracle flow)
- Rocket Pool docs (minipool architecture, deposit queue, operator-bonded model)
- StakeWise docs (vault architecture, oracle quorum, osToken overcollateralization)
- Frax / Ether.fi docs for additional large-market patterns (redemption queues, restaking-aware LSD design)

## Current SharedStake Baseline

- Two-token model (`sgETH`/`wsgETH`) and buffer-centric minter flow are already aligned with standard LSD semantics.
- Phase 2 role hardening, quorum-oracle path, bunker controls, and per-module risk limits are implemented in branch and covered by dedicated tests.
- Router/module architecture is now a hardened Phase 2 surface (module risk limits + policy hooks + attribution telemetry), with explicit core/router beacon-baseline guards and Phase 3+ decentralization work still pending.

## Competitor Parity Matrix

Legend:
- `✅` implemented in current branch MVP
- `🟡` partial
- `⬜` not yet implemented

| Capability | Lido | Rocket Pool | StakeWise | SharedStake now | Target phase |
|---|---|---|---|---|---|
| Rebasing + wrapped token pair | stETH + wstETH | rETH (exchange-rate) | osETH model | ✅ (stToken + wstToken / sgETH + wsgETH) | Phase 1 done |
| Staking module router | StakingRouter | Minipool sets (operator-centric) | Vault families | 🟡 (router + inflow limits + policy hooks + attribution telemetry) | Phase 2 |
| Withdrawal queue with deterministic claims | WithdrawalQueueERC721 | Pool + queue dynamics | Vault exits + oracle workflow | 🟡 (queue + bunker-mode finalize guards) | Phase 2 hardening |
| Oracle committee consensus | Accounting Oracle committee | Oracle DAO | 11-oracle threshold model | 🟡 quorum adapter + operational tests (single-adapter fallback retained) | Phase 2 immediate |
| Turbo/bunker style stress mode | Yes | Queue/risk controls | Vault/oracle controlled flows | 🟡 queue mode controls + bunker finalize guards | Phase 2-3 |
| Attribution + fee-routing telemetry | Referral/indexer ecosystem | Limited | Vault/accounting telemetry | ✅ additive entrypoints + events in core/router | Phase 2-3 |
| Permissionless/expanded operator onboarding | Module expansion path | Core design pillar | Permissionless vault creation | 🟡 roadmap only | Phase 3 |
| Operator collateral / slash isolation | Module/accounting split | RPL-backed bonded operators | Vault isolation + overcollateralized osToken | ⬜ | Phase 3-4 |
| Institutional policy controls (allow/block/private pools) | Limited by modules | Limited | First-class vault options | 🟡 standalone registry + router module gating (optional) | Phase 3 |
| Multichain mint/distribution | Expanding | Limited | ETH + Gnosis and integrations | ⬜ | Phase 5 |

## Phase 2 Architecture (What We Build Next)

## A. Consensus Oracle Layer

- Add a threshold-based oracle adapter module (N-of-M submitters).
- Keep existing single-submitter adapter for fallback/testnet compatibility.
- Enforce:
  - staleness bounds
  - per-validator drift bounds
  - slash bounds
  - duplicate vote prevention
  - one-time finalization per report payload

## B. Withdrawal Risk Mode Layer

- Introduce mode controller (`TURBO` / `BUNKER`) consumed by withdrawal finalization logic.
- `BUNKER` mode activation conditions:
  - large negative rebase/slash event
  - oracle disagreement or delayed finality threshold breach
- In bunker:
  - slower finalization window
  - stricter per-batch cap
  - governance/guardian visibility events

## C. Module Risk Budget Layer

- Extend module controls:
  - per-module mint cap (exists)
  - per-module net inflow cap per epoch/day
  - module pause + global emergency pause
  - module health flags from oracle layer

## D. Attribution and Fee Routing Layer (SharedStake docs-aligned)

- Deposit source attribution (frontend/referral/operator source IDs).
- Fee event routing for DAO accounting and merkle-distribution compatibility.
- Keep this modular and optional at entrypoints (`submitWithAttribution` style) to avoid breaking base flows.

## E. Security and Governance Layer

- Final role split:
  - `GOV`: timelocked, multisig-controlled parameter changes
  - `GUARDIAN`: rapid pause / safety toggles
  - `ORACLE_SUBMITTER`: report voting
  - `OPERATOR`: validator execution only
- Add explicit role-admin mapping tests for every privileged selector.

## Implementation Backlog (Modular)

P2-1 (Immediate):
- Quorum oracle adapter contract + tests.
- Pause-path hardening to prevent ETH transfer entrypoint bypass.
- Negative tests for role restrictions across router/core/queue.

Status 2026-05-06:
- Implemented: quorum oracle adapter + tests.
- Implemented: pause-path hardening in staking receive entrypoints + tests.
- Implemented: broadened role-negative and role-admin mapping tests across privileged selectors.

P2-2:
- Withdrawal mode controller + queue integration tests.
- Per-module inflow/risk-limit enforcement.
- Oracle disagreement and stale-frame operational tests.

Status 2026-05-06:
- Implemented: withdrawal mode controller (`TURBO`/`BUNKER`) with bunker batch-size and min-age constraints.
- Implemented: per-module inflow/risk-limit enforcement on both ETH submit and LST wrap mint paths.
- Implemented: quorum oracle disagreement/stale-frame operational tests.
- Implemented: router-side baseline initialization guard to reject positive beacon reports before `notifyBeaconDeposit` baseline setup.
- Implemented: core-side baseline initialization guard and bounded `notifyBeaconDeposit` to prevent principal/reward mis-accounting.

P2-3:
- Attribution/referral metadata path + events + indexer schema.
- Fee-routing events for DAO accounting pipelines.

Status 2026-05-06:
- Implemented: additive `submitWithAttribution` (core), `submitWithSource` / `submitToModuleWithSource` (router) entrypoints.
- Implemented: attribution events (`SubmittedWithAttribution`, `DepositAttributed`) without changing legacy submit flows.
- Implemented: fee-routing telemetry events on reward reports in both core and router paths.

P3-prep (implemented as standalone module):
- Institutional policy registry for permissionless/allowlist/blocklist/private policy modes.
- Deployable independently and attachable to module entrypoints when governance enables institutional pools.
- Implemented (additive): optional router policy registry + per-module policy id checks on deposit/wrap entrypoints.

## Security Gates Before Promotion

- Property/invariant suite for:
  - no over-mint
  - no over-claim
  - monotonic conversion rules outside explicit slash events
  - finalized withdrawal solvency
- Static analysis + lint clean.
- Two-reviewer approval on accounting/withdrawal/oracle changes.
- Role manifest + emergency runbook updated.

Current validation snapshot (2026-05-06):
- `npx hardhat test test/v2/lido-parity/*.spec.ts test/v2/modular/*.spec.ts` → 179 passing.
- `npx hardhat test` (full `staking-contracts`) → 220 passing.
- `solhint` on changed parity contracts is warnings-only (no errors).

## Modular Deployment Strategy

1. Ship adapter/controls behind additive modules first (no forced migration).
2. Activate modules on testnet with conservative caps and kill-switches.
3. Increase caps only after on-chain telemetry and adversarial simulation pass.
4. Promote to mainnet in feature flags:
   - oracle quorum
   - withdrawal mode controller
   - attribution routing
5. Expand operator set only after Phase 2 controls are stable.
