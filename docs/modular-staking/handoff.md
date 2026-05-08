# SharedStake V2 Modular Staking Handoff Log

Use this file for resumable execution across quotas and subagents.

## Session Snapshot

- Date: 2026-05-08
- Branch: `feat/sharedstake-v2-modular-staking-master`
- Strategy: Option B (clean PR)
- Architecture posture: router-first, no backward-compat optimization in this phase

## Completed In This Session

- Created docs baseline:
  - `docs/modular-staking/README.md`
  - `docs/modular-staking/architecture.md`
  - `docs/modular-staking/diagrams.md`
  - `docs/modular-staking/threat-model.md`
  - `docs/modular-staking/composite-profile-prd.md`
  - `docs/modular-staking/master-pr-plan.md`
  - `docs/modular-staking/pr376-keep-drop-matrix.md`
  - `docs/modular-staking/code-port-checklist.md`
  - `docs/modular-staking/track-a-integration-runbook.md`
  - `docs/modular-staking/execution-plan.md`
- Linked docs from root `README.md`.
- Verified `pi-kimi-subagent` execution path is available.
- Reset workflow to fresh `main` and rebuilt this branch from clean baseline.
- Preserved old PR working context in stashes:
  - parent stash: `pr376-parent-wip-before-master-plan`
  - submodule stash: `pr376-submodule-wip-before-master-plan`
- Re-established `SharedDeposit` baseline at `acc8801` and applied saved submodule delta files (router/deploy/test additions).
- Attempted Kimi runbook delegation; timed out twice, local fallback runbook created.
- Began Track A3 integration:
  - added new ABIs: `stToken`, `wstToken`, `stakingCore`, `withdrawalQueueV2`
  - applied `src/contracts/index.js` override hardening delta

## Working Agreements

- Keep one optimal architecture first.
- Keep full old-PR capability surface in program scope, packaged in clean slices.
- Deliver as one master PR with track-based commit grouping.
- Document continuously for resumability.

## Open Decisions (Current)

- Oracle launch mode choice (`OracleAdapter` vs `QuorumOracleAdapter`).
- Launch risk parameter defaults (delta bounds, inflow limits, bunker params, global cap).
- Minimal pre-deploy operational controls.

## Next Actions

1. Draft the concrete code-port checklist by subsystem from `KEEP-NOW` and `KEEP-OPTIONAL`.
2. Execute first code-port batch and record validation output.
3. Keep naming and docs aligned to the canonical product name (`SharedStake V2 Modular Staking`), including `StEthPriceOracle`.

### Session 2026-05-08 08:45 UTC
- What changed:
  - Completed naming cleanup (`StEthPriceOracle`, `MockIStEth`, test/script/docs updates).
  - Hardened modular contracts from Slither triage (`WstToken` SafeERC20, router report ordering, fee-recipient getter, explicit accumulator init).
  - Fixed local deploy/e2e blockers:
    - modular deploy scripts now fallback `accounts.multiSig ?? accounts.deployer`
    - `deploy/helpers/governance.ts` marked non-executable for hardhat-deploy recursion.
  - Stabilized fork E2E stake-approve flow for local deterministic runs.
- Tests run:
  - `cd SharedDeposit && npx hardhat test $(ls test/v2/modular-staking/*.spec.ts)` -> `223 passing`
  - `cd SharedDeposit && npx hardhat test test/v2/modular-staking/fuzz.spec.ts` -> `19 passing`
  - `bun run test:e2e:fork` -> `2 passed` (`airdrop`, `stake-approve-flow`)
- Decisions made:
  - Keep two remaining Slither mediums (`divide-before-multiply`, `locked-ether`) as explicit risk-accepted-by-design items.
- New risks:
  - Wallet-extension strict E2E still requires env (`PW_WALLET_EXTENSION_PATH`, `PW_WALLET_EXTENSION_ID`, `PW_WALLET_TEST_ADDRESS`).
  - Hardhat warns Node 24 unsupported; prefer Node 20/22 for CI reliability.
- Next actions:
  1. Run `bun run test:e2e:wallet:strict` in a wallet-enabled environment.
  2. Complete remaining checklist items for role matrix/oracle sanity/queue stress validation notes.

### Session 2026-05-08 10:20 UTC
- What changed:
  - Extended UI address sync export to include modular keys (`stakingCore`, `stToken`, `wstToken`, `withdrawalQueueV2`, router/module/oracle/controller keys).
  - Updated modular store chain-address resolution to use `src/contracts/addresses/*.json` and auto-bootstrap provider from `window.ethereum` when wallet provider is unset.
  - Added input normalization before `ethers.parseEther(...)` for `/v2` amount fields.
  - Added modular browser E2E spec: `tests/e2e/modular-staking-v2.spec.js` (stake -> wrap -> withdrawal request).
  - Included modular spec in fork runner (`scripts/contracts/run-fork-e2e.sh`).
- Tests run:
  - `bun run test:e2e:fork` -> `3 passed` (`airdrop`, `stake-approve-flow`, `modular-staking-v2`)
  - `bun run lint` -> pass
  - `bun run type-check` -> pass
  - `bun run build` -> pass
- Decisions made:
  - Treat modular `/v2` browser path as required in the standard fork E2E gate (not optional/manual).
- New risks:
  - Fork script still requires `MAINNET_RPC_URL` unless a local RPC is already running (expected behavior, documented in runner usage).
- Next actions:
  1. Add wallet-extension strict run when env is provided.
  2. Finish remaining hardening checklist lines (role/oracle/queue/runbook evidence) for master PR closure.

### Session 2026-05-08 11:05 UTC
- What changed:
  - Verified PR-376 parity deltas for key unresolved UI/files (`DappTxBtn`, `Stake`, `Root`, `Landing`, `utils/common`, `README`) against PR patch content.
  - Closed remaining master checklist items after validation pass.
  - Updated README to explicitly include modular `/v2` flow in fork E2E narrative.
  - Added explicit hardening evidence (role/oracle/queue) into progress/completion docs.
- Kimi delegate status:
  - Ran `plan_prompt.py` envelope successfully.
  - `delegate.py` timed out again (`exit 124`); continued with local fallback analysis per routing policy.
- Tests run:
  - `cd SharedDeposit && npx hardhat test test/v2/modular-staking/roleAccess.spec.ts test/v2/modular-staking/stEthPriceOracle.spec.ts test/v2/modular-staking/quorumOracleAdapter.spec.ts test/v2/modular-staking/quorumOracleOperational.spec.ts test/v2/modular-staking/withdrawalQueueV2.spec.ts test/v2/modular-staking/scenarioTests.spec.ts` -> `61 passing`
  - `bun run test:e2e:fork` -> `3 passed`
  - `bun run lint` -> pass
  - `bun run type-check` -> pass
  - `bun run build` -> pass
- Decisions made:
  - Treat modular `/v2` browser flow as part of default fork E2E gate.
  - Consider parity target met against PR #376 changed-file intent; remaining gap is env-gated wallet-extension strict E2E and optional dependency audit cleanup.
- Next actions:
  1. Run `bun run test:e2e:wallet:strict` once wallet extension env vars are available.
  2. Split dependency-audit remediation into a follow-up track if desired.

## Update Template (append each session)

```md
### Session YYYY-MM-DD HH:MM UTC
- What changed:
- Tests run:
- Decisions made:
- New risks:
- Next actions:
```
