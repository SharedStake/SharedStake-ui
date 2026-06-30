# SharedStake V2 Modular Staking Composite Profile

Status: synthesized from the historical PR #376 design thread, the PR #378/PR #379 modular staking workstream, and the current local `staking-contracts/` contract tree.

## 1. Naming History (What We Called It Before)

Observed names across the workstream:

1. `Lido-parity V2 staking MVP`
- Used in PR #376 title/body and early contract/test framing.
- Focused on stETH/wstETH parity-style economics and withdrawal lifecycle.

2. `modular-staking`
- Explicit rename in the historical contract-side commit `acc8801` (`refactor(modular-staking): complete lido-parity -> modular-staking rename...`).
- Reflected in contract paths: `contracts/v2/modular-staking/**`.

3. `V2 Staking (Beta)`
- Product-facing naming in frontend navigation and route language.

Interpretation:
- The initiative started as a parity MVP and evolved into a broader modular staking platform.

## 2. Product Intent and User Jobs

Core intent from the historical PR trajectory and current PR #378 delivery:

1. Ship a full-stack V2 staking product, not just isolated contracts.
2. Give users a complete stake/wrap/withdraw loop with clear onchain accounting.
3. Make architecture production-oriented through hardening, role controls, and operational runbooks.
4. Evolve from a single-vault model into a modular router model for future extension (validator, DVT, LST).

Primary user jobs:
- Deposit ETH and receive rebasing stake exposure.
- Convert rebasing exposure to non-rebasing wrapped exposure for DeFi usage.
- Request and claim withdrawals in a controlled queue model.
- For operators/governance: run oracle reporting, finalization, fee routing, and incident controls safely.

## 3. Complete Feature Inventory

## 3.1 Onchain product features

Token/accounting layer:
- `ShareMath`: share/ETH conversion rules.
- `StToken`: rebasing share token with MINTER role controls.
- `WstToken`: non-rebasing wrapper for `StToken`.

Core staking and exits:
- `StakingCore`: submit + oracle report + fee logic path.
- `WithdrawalQueueV2`: request/finalize/claim lifecycle with TURBO/BUNKER modes.
- `FeeController`: configurable fee and recipient split.

Oracle/reporting paths:
- `OracleAdapter`: single-submitter guarded reporting.
- `QuorumOracleAdapter`: quorum reporting model.
- `StEthPriceOracle` target (current code identifier: `LidoPriceOracle`): LST pricing integration.

Modular architecture path:
- `StakingRouter`: module registry, inflow/cap controls, pooled accounting, policy checks.
- `ValidatorModule`: validator-backed staking module.
- `DVTModule`: DVT-focused module variant.
- `LSTWrapModule`: external LST wrap/unwrap module.
- `InstitutionalPolicyRegistry`: policy modes for institutional constraints.

## 3.2 Frontend features (from parent repo scope)

- Dedicated modular staking application surface:
  - `ModularStakingApp`
  - `StakePanel`
  - `WrapPanel`
  - `WithdrawPanel`
- Store-driven transaction flows (`modularStaking.js`).
- ABI integration for new contracts.
- Route/nav integration for V2 staking entry.
- Shared tx button support (`DappTxBtn`).

## 3.3 Ops and readiness features (local under `staking-contracts/`)

- Deployment scripts for modular staking stack.
- Keeper scripts (`depositSweep`, `oracleReporter`, `withdrawalFinalizer`).
- Manifest generation tooling.
- Operational runbook and readiness/security documents.
- Governance helper wiring and role/access test expansions.

## 3.4 Test profile expansion

`staking-contracts/` added broad test surface across:
- Unit and e2e staking flows.
- Router/module behavior.
- Role-access and negative tests.
- Fuzz and adversarial scenarios.
- Quorum oracle operational behavior.
- Long scenario/integration suites.

This indicates the target was a production candidate path, not an isolated MVP prototype.

## 4. Target Architecture (Composite)

Architecture that emerges from the full old PR history:

1. Shared token/accounting plane
- `StToken` as canonical pooled value/share representation.
- `WstToken` for non-rebasing interoperability.

2. Execution plane
- Legacy-compatible path via `StakingCore`.
- Scalable path via `StakingRouter` + modules.
- Module-specific asset logic (validator/DVT/LST) abstracted behind router accounting.

3. Control plane
- Fee policy in `FeeController`.
- Oracle pathways (`OracleAdapter` and `QuorumOracleAdapter`).
- Institutional gating via policy registry.
- Role-based governance + guardian + operator responsibilities.

4. Exit plane
- `WithdrawalQueueV2` as deterministic user exit contract with mode controls.

5. Operational plane
- Deploy scripts + keeper automation + runbooks + readiness gates.

## 5. Risk/Security Posture and Readiness Gates

The old PR trajectory clearly moved toward structured hardening:

- Explicit security-hardening commit wave (`d8b8eb1`).
- Role/access negative matrix and pre-mainnet scenario gates (`9ac1638`).
- Deployment manifest/runbook closure (`b234bee`).
- Fee model reconciliation across core and router (`e239a55`).
- Large scenario and adversarial test additions.

Interpretation:
- Security posture targeted operational launch readiness, not just code correctness.

## 6. Noise vs Core Signal in Old PR

Core signal:
- Local `staking-contracts/` tree advancement carrying the real protocol/system buildout.
- Modular staking frontend integration.
- Contract ABIs, stores, routes, and staking panels.
- Test and operational harness improvements.

Noise:
- Large unrelated SEO/blog/docs churn in parent repo.
- Landing/UI redesign changes not directly tied to V2 staking core goals.
- General documentation consolidations unrelated to staking architecture.

Important nuance:
- The old PR mixed meaningful product work with broad repo hygiene churn, which obscured reviewability.

## 7. Proposed Canonical Name Now

Recommended name:
`SharedStake V2 Modular Staking`

Rationale:
- Matches the final technical direction (`modular-staking` rename in `acc8801`).
- Avoids locking product identity to one external parity narrative.
- Leaves room for multiple module types (validator, DVT, LST) without renaming again.
- Aligns product, code paths, and reviewer mental model.

Legacy label retention guidance:
- Keep `Lido-parity` only as historical context in migration notes/changelog.

## 8. Launch Readiness Decisions

1. Canonical architecture cut:
- `StakingRouter` + modules is the primary V2 path; `StakingCore` remains as compatibility/fallback surface during rollout.

2. Oracle launch mode:
- Single-adapter and quorum adapter support both exist; final mainnet default is an ops/governance deployment decision.

3. Minimum launch package:
- PR #378 ships contracts, frontend, referral-service skeleton, keeper code, runbooks, and validation docs together.

4. Parameter baselines:
- Fee split defaults, delta bounds, inflow caps, queue bunker settings remain deployment-parameter checks before mainnet.

5. Governance/ops readiness gates:
- Remaining gates are operational: withdrawal credentials, role transfer to timelock, external audit, and keeper env/process setup.

## 9. Practical Conclusion

What we were building was not just a "Lido-parity MVP"; it evolved into a full
`SharedStake V2 Modular Staking` platform effort spanning:
- protocol design,
- frontend product flows,
- security hardening,
- operational readiness,
- and extensive testing.

PR #378 preserves that full-system intent in one reviewable delivery slice. The code/test blockers are closed; only the documented pre-mainnet ops and governance gates remain before production rollout.
