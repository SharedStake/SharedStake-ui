# SharedStake V2 Modular Staking Handoff Log

Use this file for resumable execution across quotas and subagents.

## Operating Protocol (Mandatory)

Apply this protocol to each substantive work slice:

1. Goal-first:
- Start with one explicit goal statement.

2. Subagent-first side tasks:
- Delegate bounded analysis/review/implementation tasks by default.
- Keep critical-path blockers local.

3. Multipass verification (log all passes):
- Pass 1: targeted tests for changed paths.
- Pass 2: broader subsystem sweep.
- Pass 3: security/adversarial/static-analysis pass with triage notes.

4. De-bloat and anti-slop cleanup:
- Remove dead/redundant code and low-signal churn.
- Keep file/line growth intentional and minimal.

5. Production-quality gate:
- No stubs/placeholders/half-implemented paths in completion claims.
- Deferred items must be explicitly risk-accepted with owner + next action.

6. Continuous resumability:
- Update this file during execution, not just at session end.

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

- Lazy-decay governance behavior is accepted-by-design for this release track.
- Launch risk parameter defaults still require explicit pre-mainnet sign-off (delta bounds, inflow limits, bunker params, global cap).
- Wallet-extension strict E2E remains environment-gated and pending only where extension env is available.

## Next Actions

1. Execute wallet-extension strict E2E in an environment with `PW_WALLET_EXTENSION_PATH`, `PW_WALLET_EXTENSION_ID`, and `PW_WALLET_TEST_ADDRESS`.
2. Attach wallet-strict output + latest verification counts to PR #378 evidence block.
3. Keep any further cleanup limited to behavior-neutral deltas only.

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

### Session 2026-05-08 18:00 UTC
- What changed:
  - Re-validated PR `#378` status and branch head (`06c4076`) against local workspace.
  - Fixed modular test regressions introduced by `FeeController` interface expansion:
    - Updated `FeeController.deploy(...)` calls from 5 args to 7 args across 8 specs.
    - Updated `setFee(...)` and `setRecipients(...)` call signatures in scenario tests.
    - Updated fuzz fee invariant assertions to include `referral` remainder accounting.
  - Preserved compatibility of existing modular semantics by passing `ZeroAddress` as `referralRegistry` in tests that do not exercise referral routing.
- Kimi delegate status:
  - Ran envelope + delegate successfully for constructor-signature mapping task; applied suggested edits locally.
  - Second delegated “plan delta checklist” task stalled in the wrapper process; local fallback used for continuity.
- Tests run:
  - `cd SharedDeposit && npx hardhat test $(ls test/v2/modular-staking/*.spec.ts)` -> `223 passing`
  - `cd SharedDeposit && npx hardhat test` -> `294 passing`
- Decisions made:
  - Keep referral registry unused (`ZeroAddress`) in current modular tests unless a test explicitly targets referral accrual behavior.
  - Treat full `SharedDeposit` green run as the current safety gate for this slice.
- New risks:
  - Governance contracts under `contracts/v2/governance/` are currently compile-checked and included in full suite builds, but dedicated governance behavior tests are not yet present.
- Next actions:
  1. Add dedicated tests for `ReferralRegistry`, `GovernanceTimelock`, and `SharedStakeGovernor` behavior.
  2. Integrate/refine governance wiring docs with explicit role-transfer sequence and timelock ownership flow.
  3. Run wallet-extension strict E2E (`bun run test:e2e:wallet:strict`) when extension env is available.

### Session 2026-05-08 18:03 UTC
- What changed:
  - Added governance/referral behavior test coverage in:
    - `SharedDeposit/test/v2/modular-staking/governanceReferral.spec.ts`
  - New coverage includes:
    - `ReferralRegistry`: role checks, self-referral rejection, fee distribution, claim flow, fee-bps cap.
    - `GovernanceTimelock`: min-delay and proposer/executor/admin role wiring.
    - `SharedStakeGovernor`: governance parameters and proposal-threshold gating via delegated veSGT voting power.
- Tests run:
  - `cd SharedDeposit && npx hardhat test test/v2/modular-staking/governanceReferral.spec.ts` -> `8 passing`
  - `cd SharedDeposit && npx hardhat test` -> `302 passing`
- Decisions made:
  - Keep governance behavior coverage scoped to constructor/wiring and threshold gating in this slice; full queue/execute lifecycle can be added as a follow-up suite if desired.
- New risks:
  - No critical regressions observed in full-suite run after governance/referral test additions.
- Next actions:
  1. Optionally extend governor tests to cover full proposal lifecycle (`propose -> queue -> execute`) with timelock delay simulation.
  2. Execute wallet-extension strict E2E when extension env vars are available.

### Session 2026-05-09 01:15 UTC
- What changed:
  - Re-checked PR `#378` status (still open, no review threads/comments beyond Amplify bot) and confirmed all local work is unpushed.
  - Ran Kimi delegate review successfully for governance/referral security triage; applied confirmed findings locally.
  - Implemented referral hardening + wiring:
    - added `IReferralRegistry` interface and integrated referral recording in `StakingCore`/`StakingRouter` deposit paths when registry is configured.
    - integrated referral fee-share mint + booking in `StakingCore`/`StakingRouter` fee distribution paths.
    - hardened `ReferralRegistry`:
      - backing check on `depositReferralFeeShares(...)`
      - over-allocation guard in `distributeFees(...)`
      - tracked `totalAllocatedReferralShares`
      - switched claim payout to `transferShares(...)` and on-chain `ethValue` emission.
  - Implemented governance hardening:
    - fixed `VoteEscrowV2.increase_unlock_time(...)` to reject expired locks and recompute/balance voting power (delta mint/burn) instead of additive over-mint.
    - increased `SharedStakeGovernor` `votingDelay` to `7200` blocks (~1 day).
  - Expanded governance/referral tests:
    - added unbacked referral deposit rejection and over-allocation rejection checks.
    - added `VoteEscrowV2` regression tests for expired-lock extension and non-additive voting-power extension behavior.
    - retained full governor lifecycle coverage (`propose -> vote -> queue -> execute`).
- Kimi delegate status:
  - Envelope + delegate succeeded for security findings; output used directly for fix scoping.
  - Second delegate run hit provider usage limit in fallback (`May 12, 2026` reset shown by wrapper); continued with local fallback implementation.
- Tests run:
  - `cd SharedDeposit && npx hardhat test test/v2/modular-staking/governanceReferral.spec.ts` -> `13 passing`
  - `cd SharedDeposit && npx hardhat test` -> `307 passing`
- Decisions made:
  - Preserve treasury/operator fee behavior when `referralRegistry == address(0)` (referral portion is not minted in that mode).
  - Treat referral liabilities as share-denominated and enforce backing/allocation invariants on-chain.
- New risks:
  - `wallet-extension strict` E2E remains env-gated (`PW_WALLET_EXTENSION_PATH`, `PW_WALLET_EXTENSION_ID`, `PW_WALLET_TEST_ADDRESS`).
  - Kimi delegate fallback path can fail under provider quota; local fallback remains required operationally.
- Next actions:
  1. Push the current local slice to branch head and refresh PR `#378` with updated test evidence (`307 passing`).
  2. Execute `bun run test:e2e:wallet:strict` in wallet-enabled CI/env and attach output.
  3. Optionally add explicit role-wiring deploy tests for `FEE_CTL` grants to core/router against `ReferralRegistry`.

### Session 2026-05-11 06:30 UTC (Codex GPT-5 → Claude Handoff)
- What changed:
  - **Audit Fixes (First Pass)** — All 15 findings addressed:
    - LOW-01: `StToken.transferAdmin()` revokes MINTER from old admin
    - LOW-02: Removed dead `FeeController.recordDistribution()`
    - LOW-04: Added `nonReentrant` to `StToken.transfer()` / `transferFrom()`
    - LOW-06: Tightened `maxPlausible` from 2× → 1.5× in `StakingCore` + `ValidatorModule`
    - LOW-08: Atomic state update in `WithdrawalQueueV2` (setTotalPooledEther before burnShares)
    - LOW-11: `OracleAdapter.submitReport()` now rejects future timestamps
    - INFO-02: Removed unused `IERC20Metadata` import from `StToken.sol`
  - **Governance Infrastructure (NEW contracts):**
    - `VoteEscrowV2.sol` — Curve-style lock, ERC20Votes compatible, 7-day to 3-year locks
    - `SharedStakeGovernor.sol` — OZ Governor (7200-block delay, 40320-block voting, 4% quorum, 1000 veSGT threshold)
    - `GovernanceTimelock.sol` — 48-hour delay, PROPOSER/EXECUTOR/CANCELLER roles
  - **Referral System (NEW contracts):**
    - `ReferralRegistry.sol` — MasterChef-style `accRewardPerEth` fee distribution
    - `IReferralRegistry.sol` — Router integration interface
  - **ValidatorModule Hardening:** Added `expectedWithdrawalCredentials` validation on beacon deposits via assembly calldataload
  - **Security Reports:**
    - `docs/modular-staking/AUDIT_SECOND_PASS.md` — 8-agent comprehensive audit
    - `SharedDeposit/x-ray/` — x-ray.md, entry-points.md, invariants.md, architecture.svg (verdict: ADEQUATE)
  - **Documentation:** `docs/modular-staking/DEPLOYMENT_GUIDE.md` — step-by-step governance deployment order, emergency procedures, role matrix
  - **PR #378** description updated via GitHub REST API with governance + referral details
  - **Devin Delegate** used successfully to review x-ray report factual accuracy (found 3 errors, all fixed)
- Tests run:
  - `cd SharedDeposit && npx hardhat test test/v2/modular-staking/*.spec.ts` -> `236 passing`
  - `cd SharedDeposit && npx hardhat test` -> `310 passing`
  - `bun run lint` -> pass
  - `bun run type-check` -> pass
  - `bun run build` -> pass
- Decisions made:
  - OZ Governor chosen over Aragon (lighter weight, industry standard)
  - MasterChef-style `accRewardPerEth` chosen for referral fee distribution (gas efficient)
  - Socialized loss to 0 accepted by design (identical to Lido v2)
  - `maxDeltaBps` default 1000 (10%) for testnet; must be lowered to 100 (1%) before mainnet
  - Module trust assumption: Router assumes honest modules; code-hash verification recommended but not enforced
- New risks:
  - `maxDeltaBps` at 10% allows rapid compounding if oracle is compromised
  - No global inflow limit across all modules (only per-module limits)
  - No minimum deposit check on-chain (frontend should enforce)
  - `wallet-extension strict` E2E still env-gated
- Next actions:
  1. **Claude should read `CLAUDE_HANDOFF_V2_HARDENING.md`** for full task list and delegation instructions
  2. Re-run audit skills (x-ray + solidity-auditor) via kimi-delegate and devin-delegate to surface any new findings
  3. Frontend referral integration (capture `?ref=0x...` from URL, pass to submit)
  4. Lower `maxDeltaBps` from 1000 → 100 before mainnet
  5. Add Foundry invariant tests for deposit/withdraw round-trips
  6. Engage external human security audit

---

## Claude Handoff Document

**Read this first:** `CLAUDE_HANDOFF_V2_HARDENING.md` (in repo root)

This document contains:
- Full audit fix summary
- New contract inventory
- Delegation instructions for kimi-delegate + devin-delegate
- Test status: 236 passing
- Pre-mainnet deployment checklist
- Critical files to read

## Update Template (append each session)

```md
### Session YYYY-MM-DD HH:MM UTC
- Goal:
- Delegation runs:
  - Kimi:
  - Devin:
- Multipass verification:
  - Pass 1 (targeted):
  - Pass 2 (subsystem):
  - Pass 3 (security/adversarial/static):
- De-bloat/quality pass:
  - dead/redundant code removed:
  - artifact churn pruned/kept:
  - stubs/placeholders check:
- What changed:
- Tests run:
- Decisions made:
- New risks:
- Next actions:
```

### Session 2026-05-18 18:15 UTC
- What changed:
  - Hardened `ValidatorModule`/`DVTModule` beacon report path by enforcing `reported validators <= deposited validators ever observed`:
    - `SharedDeposit/contracts/v2/modular-staking/modules/ValidatorModule.sol`
    - added `_depositedValidatorCount` state, increment in `_doBeaconDeposit(...)`, and guard in `reportBeacon(...)`.
    - added `depositedValidatorCount()` view.
  - Added adversarial regression coverage:
    - `SharedDeposit/test/v2/modular-staking/adversarial.spec.ts`
      - new test: reject inflated validator count with unchanged beacon balance (`1000 validators / 32 ETH` after one deposit).
    - `SharedDeposit/test/v2/modular-staking/stakingRouter.spec.ts`
      - updated expected revert for the “no deposit yet” report path to the stricter module-level guard.
  - Refreshed audit artifacts:
    - `SharedDeposit/x-ray/enumeration.txt`
    - `SharedDeposit/x-ray/git-security-analysis.json`
    - `SharedDeposit/x-ray/git-security-analysis.log`
    - `SharedDeposit/x-ray/slither-high-med.txt`
- Tests run:
  - `cd SharedDeposit && npx hardhat test test/v2/modular-staking/adversarial.spec.ts test/v2/modular-staking/stakingRouter.spec.ts test/v2/modular-staking/dvtModule.spec.ts` -> `81 passing`
  - `cd SharedDeposit && npx hardhat test $(find test/v2/modular-staking -name '*.spec.ts' -print)` -> `272 passing, 10 pending, 0 failing`
- Delegation status:
  - Kimi wrapper run (`plan_prompt.py` + `kimi-delegate`) for validator bootstrap review timed out; fallback runner also timed out. Continued with local fallback implementation per AGENTS policy.
  - Devin delegate returned a governance-correctness concern for `VoteEscrowV2` lazy decay snapshots; issue validated as architectural and not fully addressable with a small patch.
- Decisions made:
  - Keep validator-count sanity enforced at module level (stricter/earlier than router checks) to block count manipulation that could degrade downstream drift checks.
  - Treat lazy-decay voting-power snapshot correctness in `VoteEscrowV2` as an explicit remaining risk requiring a larger governance-token redesign or strict operational checkpointing policy before mainnet.
- New risks:
  - `VoteEscrowV2` + `GovernorVotes` can overstate voting power at proposal snapshot if accounts are not checkpointed before snapshot; this is a structural limitation of lazy decay with ERC20Votes checkpoints.
- Next actions:
  1. Run a dedicated governance design pass to replace/augment lazy checkpointing (preferred: historical lock-point based `IVotes` semantics with timestamp clock) before production governance activation.
  2. Complete final multi-agent security sweep synthesis and fold any actionable findings into code/tests.
  3. Push branch updates and refresh PR #378 evidence (test counts + updated audit artifacts).

### Session 2026-05-18 19:10 UTC
- What changed:
  - Queue oracle-mode hardening:
    - `SharedDeposit/contracts/v2/modular-staking/WithdrawalQueueV2.sol`
      - added non-decreasing timestamp guard for `updateModeFromOracle(...)` (`StaleReportTimestamp`).
    - `SharedDeposit/test/v2/modular-staking/withdrawalQueueV2.spec.ts`
      - added regression test for non-monotonic timestamp rejection.
  - Deployment hardening:
    - removed placeholder `ORACLE` grants to gov in:
      - `SharedDeposit/deploy/v2-modular-staking/008_validatorModule.ts`
      - `SharedDeposit/deploy/v2-modular-staking/011_dvtModule.ts`
    - added automatic revocation of legacy gov `ORACLE` grant in:
      - `SharedDeposit/deploy/v2-modular-staking/009_oracleAdapter.ts`
      - `SharedDeposit/deploy/v2-modular-staking/012_quorumOracleAdapter.ts`
    - added signer/governance identity mismatch fail-fast in:
      - `SharedDeposit/deploy/v2-modular-staking/013_governance.ts`
    - changed governance handover behavior to fail closed on non-local networks when prerequisites/roles are missing:
      - `SharedDeposit/deploy/v2-modular-staking/014_governanceHandover.ts`
  - Keeper-script hardening:
    - `SharedDeposit/scripts/v2/keeper.js`
      - role preflight checks (`NODE_OPERATOR`, `SUBMITTER`, `GUARDIAN`)
      - fail-fast on non-local dummy deposit payload usage unless explicitly overridden
      - removed silent swallow for critical tx failures; failures now propagate.
- Tests run:
  - `cd SharedDeposit && npx hardhat test test/v2/modular-staking/withdrawalQueueV2.spec.ts` -> `24 passing`
  - `cd SharedDeposit && npx hardhat test $(find test/v2/modular-staking -name '*.spec.ts' -print)` -> `273 passing, 10 pending, 0 failing`
- Decisions made:
  - Keep queue mode updates monotonic to prevent bunker freeze via timestamp rollback.
  - Remove direct gov ORACLE bypass path from default deploy flow; oracle adapters are now the intended reporting surface.
- New risks:
  - Governance lazy-decay vote snapshots remain unresolved (`VoteEscrowV2` architectural item).
  - Several multi-agent audit findings are operational/design-level and require explicit risk acceptance or larger redesign (not tactical patches).
- Next actions:
  1. Triaged merge: decide which remaining multi-agent findings are launch blockers vs accepted-by-design.
  2. Update PR #378 description/checklist with latest `273 passing` and hardened deployment/keeper posture.
  3. Continue governance-voting redesign track (lazy checkpoint decay issue) before mainnet governance activation.

### Session 2026-05-18 20:55 UTC
- What changed:
  - Deployment fail-closed hardening (non-local):
    - `SharedDeposit/deploy/helpers/governance.ts`
      - added `resolveOracleSubmitterAddresses(...)` with required env gating
      - added `resolveOperatorAddress(...)` with required env gating
    - `SharedDeposit/deploy/v2-modular-staking/003_feeController.ts`
      - `operator` now resolved from env on non-local (no silent deployer default)
    - `SharedDeposit/deploy/v2-modular-staking/006_oracleAdapter.ts`
      - submitter bootstrap now env-driven for non-local (no implicit deployer-only path)
    - `SharedDeposit/deploy/v2-modular-staking/008_validatorModule.ts`
      - added non-local required mint cap env and mint-cap update path
      - added NODE_OPERATOR bootstrap from env/governance resolver
    - `SharedDeposit/deploy/v2-modular-staking/009_oracleAdapter.ts`
      - grants ORACLE to both `ValidatorModule` and `DVTModule` (if deployed)
      - submitter bootstrap now env-driven for non-local
    - `SharedDeposit/deploy/v2-modular-staking/011_dvtModule.ts`
      - added non-local required mint cap env and mint-cap update path
      - added NODE_OPERATOR bootstrap from env/governance resolver
    - `SharedDeposit/deploy/v2-modular-staking/012_quorumOracleAdapter.ts`
      - quorum now checked against configured submitter set before deploy
      - grants ORACLE to both validator-style modules
      - fails if post-bootstrap submitterCount < quorum
    - `SharedDeposit/deploy/v2-modular-staking/013_governance.ts`
      - non-local SGT address now required via env (no silent skip)
      - removed duplicate `Ship.init(...)` and kept signer/governance mismatch guard
    - `SharedDeposit/utils/ship.ts`
      - default `waitConfirmations` now `5` on mainnet, `1` otherwise
      - default `verify: false` unless explicitly set per deployment
  - Keeper hardening:
    - `SharedDeposit/scripts/keepers/depositSweep.ts`
      - validates configured withdrawal credentials against on-chain module expectation
    - `SharedDeposit/scripts/keepers/oracleReporter.ts`
      - report timestamp now sourced from latest EL block timestamp
    - `SharedDeposit/scripts/keepers/withdrawalFinalizer.ts`
      - removed `BigInt -> Number` batch-size conversion risk
    - `SharedDeposit/scripts/keepers/balanceMonitor.ts`
      - `ORACLE_ADAPTER_ADDRESS` optional integration; pauses on oracle staleness (`MAX_ORACLE_AGE_SEC`)
    - `SharedDeposit/scripts/keepers/README.md`
      - documented new oracle staleness monitoring env/config
  - Keeper test coverage expanded:
    - `SharedDeposit/test/v2/keepers/depositSweep.spec.ts`
      - new mismatch test for withdrawal credentials
    - `SharedDeposit/test/v2/keepers/balanceMonitor.spec.ts`
      - new stale-oracle pause regression
    - `SharedDeposit/test/v2/keepers/helpers.ts`
      - provider fake now supports `getBlock(...)` for chain-timestamp reporting
  - Security artifacts refreshed:
    - `SharedDeposit/x-ray/enumeration.txt`
    - `SharedDeposit/x-ray/git-security-analysis.json`
    - `SharedDeposit/x-ray/git-security-analysis.log`
    - `SharedDeposit/x-ray/slither-high-med.txt`
- Tests run:
  - `cd SharedDeposit && npx hardhat test test/v2/keepers/*.spec.ts` -> `24 passing`
  - `cd SharedDeposit && npx hardhat test $(find test/v2/modular-staking -name '*.spec.ts' -print)` -> `277 passing, 10 pending`
  - `cd SharedDeposit && npx hardhat test test/v2/keepers/*.spec.ts test/v2/modular-staking/stakingRouter.spec.ts` -> `79 passing`
  - `cd SharedDeposit && npx hardhat test` -> `372 passing, 10 pending`
- Delegation status:
  - Devin delegate used twice:
    - cleanup/churn triage (safe cleanup limited to analysis artifacts)
    - slither triage summary
  - Kimi delegate used with required envelope flow:
    - one long-running review path timed out/retried
    - one focused fail-closed review completed and produced actionable deployment-default gaps
- Decisions made:
  - Non-local deploy paths now prefer explicit env configuration over implicit EOA fallbacks.
  - `VoteEscrowV2.emergencyWithdraw` slither reentrancy flag treated as non-actionable under current `nonReentrant` guard; keep for manual auditor review.
- New risks:
  - Full TypeScript workspace `tsc --noEmit` remains red due pre-existing repository-wide typing issues unrelated to this session.
  - Governance lazy-decay snapshot architecture risk remains open.
- Next actions:
  1. Apply same explicit submitter/operator/mint-cap env pattern to any remaining legacy deploy scripts intended for production use.
  2. Decide whether to keep or remove large generated `x-ray/*` artifacts in PR body vs follow-up artifact-storage flow.
  3. Final parity pass against PR #378 checklist and push updated evidence block.

### Session 2026-05-19 (Contract Hardening: Module Admission + Callback Gating)
- What changed:
  - Added router callback-type gating in `SharedDeposit/contracts/v2/modular-staking/StakingRouter.sol`:
    - validator-only actions: `reportModuleBeaconBalance`, `notifyBeaconDeposit`
    - LST-only actions: `wrapFromModule`, `unwrapToModule`
    - new revert: `ModuleTypeActionMismatch(moduleId, moduleType, actionSelector)`
  - Added module runtime code-hash admission controls in `StakingRouter`:
    - state: `moduleCodeHashAllowed[moduleType][codeHash]`, `enforceModuleCodeHashAllowlist`
    - GOV setters: `setModuleCodeHashAllowed(...)`, `setEnforceModuleCodeHashAllowlist(...)`
    - registration guard when enforcement is enabled:
      - `ModuleCodeHashNotAllowed(moduleId, moduleAddr, moduleType, codeHash)`
  - Wired deployment scripts to use the new admission path before module registration:
    - `SharedDeposit/deploy/v2-modular-staking/008_validatorModule.ts`
    - `SharedDeposit/deploy/v2-modular-staking/010_lstWrapModule.ts`
    - `SharedDeposit/deploy/v2-modular-staking/011_dvtModule.ts`
  - Extended tests:
    - `SharedDeposit/test/v2/modular-staking/stakingRouter.spec.ts`
      - allowlist-enforcement registration test
      - validator/LST callback-type gating tests via impersonated module addresses
      - GOV-only checks for allowlist setters
    - `SharedDeposit/test/v2/modular-staking/roleAccess.spec.ts`
      - role checks for `setModuleCodeHashAllowed` and `setEnforceModuleCodeHashAllowlist`
  - Updated deployment docs:
    - `docs/modular-staking/DEPLOYMENT_GUIDE.md` now includes module code-hash allowlisting and enforcement steps.
- Tests run:
  - `cd SharedDeposit && npx hardhat test test/v2/modular-staking/stakingRouter.spec.ts` -> `66 passing`
  - `cd SharedDeposit && npx hardhat test test/v2/modular-staking/roleAccess.spec.ts` -> `10 passing`
  - `cd SharedDeposit && npx hardhat test $(find test/v2/modular-staking -name '*.spec.ts' -print)` -> `288 passing, 10 pending`
- Audit/tooling run:
  - `slither` rerun succeeded under hardhat framework but still reports broad repository-wide legacy findings outside this patch scope.
  - `forge` unavailable in this environment (`forge: command not found`), so Foundry invariant rerun was not possible in this session.
- Decisions made:
  - Keep code-hash enforcement configurable (`off` by default in contract, enabled by deploy flow).
  - Enforce callback capability at router boundary irrespective of module trust assumptions.
- New risks:
  - Slither output remains noisy at repo scope; no scoped-only gate exists yet for `contracts/v2/modular-staking/**`.
- Next actions:
  1. Add a scoped static-analysis command/profile for modular-staking-only CI gating.
  2. Re-run Foundry invariants once `forge` is installed on runner.
  3. Apply the same code-hash admission wiring to any additional module deploy paths introduced later.

### Session 2026-05-19 (Meta Learning Propagation)
- Goal:
  - Codify execution defaults so all future agents consistently use goal-first + subagent-first + multipass + de-bloat + production-quality standards.
- Delegation runs:
  - Kimi:
    - none (docs/process codification done locally to avoid coordination lag).
  - Devin:
    - none.
- Multipass verification:
  - Pass 1 (targeted):
    - verified policy updates landed in `AGENTS.md` and modular docs.
  - Pass 2 (subsystem):
    - verified `master-pr-plan.md` and `handoff.md` now include mandatory workflow discipline.
  - Pass 3 (security/adversarial/static):
    - not applicable for this docs-only slice.
- De-bloat/quality pass:
  - dead/redundant code removed:
    - none in this slice (docs/policy only).
  - artifact churn pruned/kept:
    - no new generated artifacts added.
  - stubs/placeholders check:
    - added explicit “no stubs/placeholders” policy language to agent and handoff defaults.
- What changed:
  - Added mandatory session meta defaults to `AGENTS.md`.
  - Added “Execution Discipline (Mandatory)” section to `docs/modular-staking/master-pr-plan.md`.
  - Added “Operating Protocol (Mandatory)” and richer update template to `docs/modular-staking/handoff.md`.
- Tests run:
  - none (docs-only slice).
- Decisions made:
  - Future work should default to subagent-assisted execution for bounded side tasks.
  - Every substantive code slice must include a multipass verification trail and resumability logs.
- New risks:
  - Existing branch still contains broad historical churn; a dedicated de-bloat/refactor pass remains pending.
- Next actions:
  1. Run a focused de-bloat pass on PR #378 scope (remove dead/redundant code and non-essential artifact churn).
  2. Add a repeatable scoped audit command set for modular-staking-only multipass runs.
  3. Enforce production-quality checks (no stubs/placeholders) during final pre-merge review.

### Session 2026-05-19 (PR #378 De-bloat Pass)
- Goal:
  - Reduce low-signal PR churn without changing contract or keeper behavior.
- Delegation runs:
  - Kimi (`kimi-delegate`, envelope-first via `plan_prompt.py`):
    - audited current `SharedDeposit` diff for safe de-bloat candidates and evidence.
    - confirmed no dead-code/stub findings in touched contracts/tests; flagged only artifact churn + deploy-script duplication opportunities.
  - Devin:
    - none in this slice.
- De-bloat actions completed:
  - Removed generated x-ray artifacts from `SharedDeposit` working tree:
    - `x-ray/enumeration.txt`
    - `x-ray/git-security-analysis.log`
    - `x-ray/slither-high-med.txt`
  - Reverted noisy machine-generated delta:
    - `SharedDeposit/x-ray/git-security-analysis.json` restored to baseline.
  - Minor no-behavior cleanup:
    - renamed duplicated test title in `SharedDeposit/test/v2/modular-staking/stakingRouter.spec.ts` for clarity.
    - tightened wording in `SharedDeposit/deploy/v2-modular-staking/009_oracleAdapter.ts` comment (`legacy direct ORACLE grant`).
- Multipass verification:
  - Pass 1 (targeted):
    - `cd SharedDeposit && npx hardhat test test/v2/modular-staking/stakingRouter.spec.ts` -> `66 passing`
    - `cd SharedDeposit && npx hardhat test test/v2/keepers/depositSweep.spec.ts` -> `5 passing`
  - Pass 2 (broader subsystem):
    - `cd SharedDeposit && npx hardhat test $(ls test/v2/modular-staking/*.spec.ts)` -> `288 passing, 10 pending`
  - Pass 3 (security/adversarial/fuzz):
    - `cd SharedDeposit && npx hardhat test test/v2/modular-staking/adversarial.spec.ts test/v2/modular-staking/fuzz.spec.ts` -> `36 passing`
- Decisions made:
  - Treat raw x-ray text/log outputs plus regenerated large JSON as non-essential PR noise unless explicitly required in review artifacts.
  - Keep deploy-script functional refactors (shared helper extraction for `008_validatorModule.ts` + `011_dvtModule.ts`) for a separate focused cleanup commit to avoid mixing structural rewrites into this de-bloat slice.
- Open risks:
  - `SharedDeposit` appears as dirty submodule pointer in the UI repo until submodule changes are committed/updated intentionally.
  - Deploy-script duplication remains (known, documented) but does not affect runtime behavior.
- Next actions:
  1. Optional follow-up: extract shared deploy helper functions to reduce duplicated lines across validator/DVT deploy scripts.
  2. Keep x-ray evidence in curated markdown only unless reviewers request raw artifacts.
  3. Continue parity/hardening work on top of this lower-noise baseline.

### Session 2026-05-19 (Legacy/Dead Code Removal Pass)
- Goal:
  - Remove legacy deployment/ops paths and backwards-compat branches from PR #378 scope, keeping only canonical V2 flow.
- Delegation runs:
  - Kimi (`kimi-delegate`, envelope-first):
    - performed evidence scan of current diff and identified safe legacy-removal targets (legacy adapter deploy path, old ops scripts, duplicated compatibility branches).
  - Devin:
    - none in this slice.
- Legacy/dead code removed:
  - Deleted legacy deployment script:
    - `SharedDeposit/deploy/v2-modular-staking/006_oracleAdapter.ts`
  - Deleted old monolithic V2 scripts superseded by `scripts/keepers/*` + deploy tasks:
    - `SharedDeposit/scripts/v2/keeper.js`
    - `SharedDeposit/scripts/v2/deploy_governance_v2.js`
  - Removed legacy references from governance handover:
    - dropped `OracleAdapter` from governed deployment list/dependencies in `deploy/v2-modular-staking/014_governanceHandover.ts`
  - Removed backward-compat env key fallback paths (V2-only):
    - `deploy/helpers/governance.ts`
    - `deploy/v2-modular-staking/008_validatorModule.ts`
    - `deploy/v2-modular-staking/011_dvtModule.ts`
    - `deploy/v2-modular-staking/012_quorumOracleAdapter.ts`
    - `deploy/v2-modular-staking/013_governance.ts`
    - docs/readme updated accordingly (`docs/modular-staking/DEPLOYMENT_GUIDE.md`, `SharedDeposit/README.md`)
  - Minor legacy wording cleanup:
    - `contracts/v2/modular-staking/OracleAdapter.sol` comments
    - `test/v2/modular-staking/stakingRouter.spec.ts` test title
    - `deploy/v2-modular-staking/009_oracleAdapter.ts` wording
- Multipass verification:
  - Pass 1 (targeted):
    - `cd SharedDeposit && npx hardhat test test/v2/modular-staking/stakingRouter.spec.ts` -> `66 passing`
    - `cd SharedDeposit && npx hardhat test test/v2/keepers/depositSweep.spec.ts` -> `5 passing`
  - Pass 2 (broader subsystem):
    - `cd SharedDeposit && npx hardhat test $(ls test/v2/modular-staking/*.spec.ts)` -> `288 passing, 10 pending`
  - Pass 3 (security/adversarial/fuzz):
    - `cd SharedDeposit && npx hardhat test test/v2/modular-staking/adversarial.spec.ts test/v2/modular-staking/fuzz.spec.ts` -> `36 passing`
- Decisions made:
  - No backward-compat fallback keys retained in V2 deployment helpers; non-local deploys now require explicit V2 env keys.
  - Legacy `StakingCore` oracle deploy path removed from active deploy flow; canonical oracle path is router-module based.
- Open risks:
  - If any external runbooks still invoke deleted `scripts/v2/*` paths, they must migrate to `scripts/keepers/*`.
  - Historical mentions of removed files remain in older handoff entries for audit trail context.
- Next actions:
  1. Optionally extract shared module-deploy helper logic from `008_validatorModule.ts` and `011_dvtModule.ts` to reduce structural duplication.
  2. Reconcile any external CI/runbook references to removed `scripts/v2/*` paths.

### Session 2026-05-19 (Deletion Scope Verification + DVT Deploy Validation)
- Goal:
  - Confirm we only deleted recently added PR-scope files (not older pre-PR legacy), and verify DVT deployment/testing still works end-to-end.
- Deletion scope audit (git history evidence):
  - `deploy/v2-modular-staking/006_oracleAdapter.ts`
    - introduced in recent PR-era commits (`58b117b` 2026-05-04, `acc8801` 2026-05-06, `721a055` 2026-05-08).
  - `scripts/v2/keeper.js`
    - introduced in `f681acf` (2026-05-12).
  - `scripts/v2/deploy_governance_v2.js`
    - introduced in `695a538` (2026-05-12).
  - Conclusion: deleted files were recently added in the current PR time window, not older historical repository artifacts.
- Verification runs:
  - Deploy path validation (local hardhat):
    - `cd SharedDeposit && npx hardhat deploy --network hardhat --tags dvt-module`
    - Result: success; logs show `DVTModule` deployment, router registration, code-hash allowlisting, and expected withdrawal credentials wiring.
  - DVT module test validation:
    - `cd SharedDeposit && npx hardhat test test/v2/modular-staking/dvtModule.spec.ts`
    - Result: `13 passing`.
  - Regression safety checks re-run:
    - `cd SharedDeposit && npx hardhat test test/v2/modular-staking/stakingRouter.spec.ts` -> `66 passing`
    - `cd SharedDeposit && npx hardhat test test/v2/keepers/depositSweep.spec.ts` -> `5 passing`
    - `cd SharedDeposit && npx hardhat test $(ls test/v2/modular-staking/*.spec.ts)` -> `288 passing, 10 pending`
    - `cd SharedDeposit && npx hardhat test test/v2/modular-staking/adversarial.spec.ts test/v2/modular-staking/fuzz.spec.ts` -> `36 passing`
- Decisions made:
  - Keep current deletions; they satisfy “recent PR-scope only” and do not break DVT deployment/testing.
  - Preserve historical references inside older handoff sections for audit trail, but keep active deploy/ops paths on canonical V2 scripts.

### Session 2026-05-19 (Handoff Follow-through: Reference Reconciliation + Full Deploy Sweep)
- Goal:
  - Execute pending handoff reconciliation after legacy removals: confirm no stale repo references remain and validate full canonical modular deploy flow.
- Delegation runs:
  - Kimi:
    - none (fast local verification path used).
  - Devin:
    - none.
- Multipass verification:
  - Pass 1 (targeted):
    - `cd SharedDeposit && rg -n "scripts/v2/keeper\\.js|scripts/v2/deploy_governance_v2\\.js|006_oracleAdapter\\.ts|deploy/v2-modular-staking/006_oracleAdapter" .`
    - Result: no matches (no stale references in current tree).
  - Pass 2 (subsystem):
    - `cd SharedDeposit && npx hardhat deploy --network hardhat --tags modular-staking`
    - Result: success end-to-end across StToken/WstToken/FeeController/StakingCore/WithdrawalQueueV2/StakingRouter/ValidatorModule/Oracle adapters/DVTModule/governance stack/governance handover.
  - Pass 3 (security/adversarial/static):
    - covered by prior session’s adversarial+fuzz re-run (`36 passing`); no new code changes introduced in this slice.
- De-bloat/quality pass:
  - dead/redundant code removed:
    - none in this slice (verification-only).
  - artifact churn pruned/kept:
    - none.
  - stubs/placeholders check:
    - deploy flow exercises full live scripts; no stub-only path observed.
- Decisions made:
  - Keep deleted files removed; canonical deploy and DVT paths are intact.
  - Keep `scripts/keepers/*` as only active ops path and treat `scripts/v2/*` references as migration errors if reintroduced.
- New risks:
  - none new from this verification slice.
- Next actions:
  1. Continue de-bloat on remaining duplication (shared helper extraction in module deploy scripts) without touching behavior.
  2. Keep future deletion scope constrained to files introduced after merge-base unless explicitly approved otherwise.

### Session 2026-05-19 (Duplication Cleanup + Lazy-Decay Risk Acceptance)
- Goal:
  - Close remaining actionable cleanup by removing duplicated deploy logic across validator/DVT module scripts, then re-verify full behavior.
- Delegation runs:
  - Kimi (`skills/kimi-delegate`, envelope-first):
    - ran `plan_prompt.py` and `delegate.py` for bounded refactor design; used output to scope helper-based extraction with behavior-preservation checks.
  - Devin:
    - none in this slice.
- What changed:
  - Refactored module deploy scripts to reuse shared helper flows in `SharedDeposit/deploy/helpers/moduleDeployment.ts`:
    - `SharedDeposit/deploy/v2-modular-staking/008_validatorModule.ts`
    - `SharedDeposit/deploy/v2-modular-staking/011_dvtModule.ts`
  - Shared helper usage now covers:
    - governance signer assertion
    - mint-cap env parsing
    - beacon deposit address/mock resolution
    - NODE_OPERATOR grant path
    - module code-hash allowlisting
    - module register/update + mint-cap path
    - expected withdrawal credentials wiring
  - Removed one dead parameter from helper API:
    - `wireWithdrawalCredentials(..., logLabel)` -> `wireWithdrawalCredentials(...)`
- Multipass verification:
  - Pass 1 (targeted):
    - `cd SharedDeposit && npx hardhat compile` -> pass
    - `cd SharedDeposit && npx hardhat deploy --network hardhat --tags validator-module,dvt-module` -> pass
    - `cd SharedDeposit && npx hardhat test test/v2/modular-staking/dvtModule.spec.ts test/v2/modular-staking/stakingRouter.spec.ts` -> `79 passing`
  - Pass 2 (broader subsystem):
    - `cd SharedDeposit && npx hardhat test $(ls test/v2/modular-staking/*.spec.ts)` -> `288 passing, 10 pending`
  - Pass 3 (security/adversarial/static):
    - `cd SharedDeposit && npx hardhat test test/v2/modular-staking/adversarial.spec.ts test/v2/modular-staking/fuzz.spec.ts` -> `36 passing`
- Decisions made:
  - Accept lazy-decay governance behavior as risk-accepted-by-design for this release track (per product decision); no redesign blocker remains in this PR scope.
  - Keep helper extraction scoped to no-behavior-change refactor only.
- New risks:
  - local workspace currently has required deployment helper files that are not yet tracked in git index (`SharedDeposit/deploy/helpers/moduleDeployment.ts`, `SharedDeposit/deploy/helpers/withdrawalCredentials.ts`, `SharedDeposit/deploy/v2-modular-staking/014_governanceHandover.ts`); they must be included in the PR commit set.
- Next actions:
  1. Continue with final PR cleanliness sweep (only if behavior-neutral and review-signal positive).

### Session 2026-05-19 (Subagent-Led Final Sweep + Handoff Closure)
- Goal:
  - Finish remaining handoff items using Kimi/Devin delegates, perform behavior-neutral cleanliness sweep, and close stale risks.
- Delegation runs:
  - Kimi (`kimi-delegate`):
    - run 1 (broad redundant-code review): timed out in wrapper fallback path; continued per local fallback policy.
    - run 2 (focused stale-reference scan): success; confirmed no active code references to removed `deploy/v2-modular-staking/006_oracleAdapter.ts` or `scripts/v2/*`.
  - Devin (`devin-delegate`):
    - success; produced final handoff-completion checklist and explicit wallet-E2E env gate status.
- Multipass verification:
  - Pass 1 (targeted):
    - subagent scans confirmed no active imports/registrations referencing removed legacy scripts.
  - Pass 2 (subsystem):
    - latest modular suite baseline remains `288 passing, 10 pending` from prior completed run.
  - Pass 3 (security/adversarial/static):
    - latest adversarial+fuzz baseline remains `36 passing` from prior completed run.
- De-bloat/quality pass:
  - dead/redundant code removed:
    - none additionally removed in this slice; no safe behavior-neutral code deletions surfaced by subagents.
  - artifact churn pruned/kept:
    - no new artifact churn introduced.
  - stubs/placeholders check:
    - deploy helper and module paths show production-wired behavior; no new stub paths found.
- Parity/Hardening Summary (PR #378 evidence block):
  - Modular architecture: `StakingRouter` with module admission controls, callback-type gating, and code-hash allowlisting.
  - Modules: `ValidatorModule`, `DVTModule`, `LSTWrapModule` with explicit role wiring and credential checks.
  - Oracle/control plane: `OracleAdapter` + `QuorumOracleAdapter` role hardening and report-path constraints.
  - Governance/referral: `VoteEscrowV2`, `SharedStakeGovernor`, `GovernanceTimelock`, `ReferralRegistry` integrated and covered by dedicated tests.
  - Deploy/ops hardening: explicit env-gated non-local deploy requirements, governance handover script, keeper role preflights.
  - Verification baseline:
    - `npx hardhat test $(ls test/v2/modular-staking/*.spec.ts)` -> `288 passing, 10 pending`
    - `npx hardhat test test/v2/modular-staking/adversarial.spec.ts test/v2/modular-staking/fuzz.spec.ts` -> `36 passing`
    - `npx hardhat deploy --network hardhat --tags modular-staking` -> success
- Decisions made:
  - Treat wallet strict E2E as the only remaining environment-gated validation item for full closure.
  - Keep historical filename mentions in prior session logs for audit trail rather than rewriting old entries.
- Open risks:
  - wallet-extension strict E2E still pending due missing env (`PW_WALLET_EXTENSION_PATH`, `PW_WALLET_EXTENSION_ID`, `PW_WALLET_TEST_ADDRESS`) in current runner.
- Next actions:
  1. Run `bun run test:e2e:wallet:strict` in wallet-enabled CI/runner.
  2. Update PR #378 with wallet-strict output and final pass/fail evidence.
