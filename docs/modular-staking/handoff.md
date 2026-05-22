# Modular Staking Handoff

## 2026-05-20 — Audit Pass 1 (x-ray scoped)
- Goal: Run x-ray-style audit pass focused on `contracts/v2/modular-staking` and `contracts/v2/governance`, preserving full `contracts/v2` context.
- Delegation: Kimi fallback path engaged; work completed locally.
- Outputs regenerated:
  - `SharedDeposit/x-ray/enumeration-pass1.txt`
  - `SharedDeposit/x-ray/git-security-analysis.json` (src-dir=`contracts/v2`)
  - `SharedDeposit/x-ray/pass1-modular-governance.md`
- Verification commands:
  - `bash ../skills/x-ray/scripts/enumerate.sh . contracts/v2 > x-ray/enumeration-pass1.txt` (success)
  - `python3 ../skills/x-ray/scripts/analyze_git_security.py --repo . --src-dir contracts/v2 --json x-ray/git-security-analysis.json` (success)
  - `slither . --compile-force-framework hardhat ...` (ran; findings mostly informational/noise outside scoped threat model)
  - `npx hardhat test test/v2/modular-staking/governanceReferral.spec.ts test/v2/modular-staking/roleAccess.spec.ts` (blocked by environment reporter error: `ERR_MOCHA_INVALID_REPORTER` + `spawnSync ... EPERM`)
- Decisions:
  - Kept one actionable low-severity hardening item (`ReferralRegistry.setFeeToken` config safety).
  - Classified guardian immediate pause + module allowlist toggle + quorum submitter seeding as accepted-by-design operational tradeoffs.
- Open risks:
  - Misconfiguration risk remains if `feeToken` is set to an invalid contract.
  - Deployment correctness is critical for allowlist enforcement and quorum submitter setup.
- Next actions:
  1. Add guardrails in `ReferralRegistry.setFeeToken`.
  2. Add deployment assertions for router allowlist enforcement and quorum submitter readiness.

## 2026-05-20 — Audit Pass 2 (multipass rerun)
- Goal: Re-run full contract-focused audit multipass after cleanup for `contracts/v2/modular-staking` + `contracts/v2/governance`.
- Delegation:
  - `kimi-delegate` launched for scoped finding triage; timed out repeatedly and was terminated.
  - `devin-delegate` completed and produced a 2-finding report; both findings were triaged locally before acceptance.
- Verification commands:
  - Pass 1 (targeted adversarial/fuzz):
    - `cd SharedDeposit && npx hardhat test test/v2/modular-staking/adversarial.spec.ts test/v2/modular-staking/fuzz.spec.ts`
    - Result: `36 passing`.
  - Pass 2 (broader modular suite):
    - `cd SharedDeposit && npx hardhat test $(ls test/v2/modular-staking/*.spec.ts)`
    - Result: `288 passing`, `10 pending`.
  - Pass 3 (static/security):
    - `cd SharedDeposit && slither . --compile-force-framework hardhat --filter-paths "(lib|node_modules|test|mocks|interfaces)"`
    - Result: completed with findings log at `/tmp/pr378-slither-20260520-031005.log` (expected non-zero due detector findings).
  - x-ray refresh:
    - `cd SharedDeposit && bash ../skills/x-ray/scripts/enumerate.sh . contracts/v2`
    - `cd SharedDeposit && python3 ../skills/x-ray/scripts/analyze_git_security.py --repo . --src-dir contracts/v2 --json x-ray/git-security-analysis.json`
    - Result: both succeeded; `x-ray/git-security-analysis.json` regenerated (`generated_at=2026-05-20T01:11:17.794200+00:00`, `git_head=9d91084`, `classification=normal_dev`).
- Triage decisions:
  - Slither `locked-ether` on `StakingCore` treated as design-intent signal (buffered deposit accounting + beacon migration path), not immediate exploit.
  - Devin finding on ignored return from `getFeeConfig()` was false-positive interpretation (tuple destructuring intentionally ignores first fields; call reverts on failure).
  - No new high-confidence exploitable issues confirmed from this rerun.
- Open risks:
  - `forge` is not installed in current environment, so Foundry invariant rerun is still blocked.
  - Slither output remains noisy across legacy/out-of-scope contracts; keep scoped triage discipline to avoid false urgency.
- Next actions:
  1. Install `forge` and rerun `test/foundry/ModularStakingInvariants.t.sol`.
  2. Keep high-signal detector suppressions/risk-acceptance notes synchronized with `SOLIDITY_SECURITY_AUDIT.md` to reduce repeat noise.

## 2026-05-20 — Foundry Unblock + Invariant Gate Re-run
- Goal: Remove `forge` blocker, codify Foundry as a project dependency path, and rerun invariant gate through repo scripts.
- Installation:
  - `curl -L https://foundry.paradigm.xyz | bash`
  - Verified toolchain: `forge Version: 1.7.1` (`Commit SHA 4072e48705af9d93e3c0f6e29e93b5e9a40caed8`).
- Dependency + script wiring:
  - Added `@metamask/foundryup` to `SharedDeposit` `devDependencies` for scriptable bootstrap.
  - Added `yaml` devDependency to satisfy `@metamask/foundryup` runtime import under Node 24.
  - Added `SharedDeposit/scripts/run-forge.sh` (PATH-safe resolver for `forge`).
  - Added scripts in `SharedDeposit/package.json`:
    - `setup:foundry` (pinned to `v1.7.1` toolchain)
    - `test:invariants`
    - `test:invariants:gas`
- Verification commands:
  - `cd SharedDeposit && npm run setup:foundry -- --help` (success).
  - `cd SharedDeposit && npm run setup:foundry` (success, installs `forge/cast/anvil/chisel` at `v1.7.1`).
  - `cd SharedDeposit && npm run test:invariants` (success: `7 passed; 0 failed`).
  - `cd SharedDeposit && npm run test:invariants:gas` (success: `7 passed; 0 failed`).
  - `cd SharedDeposit && forge test --match-path test/foundry/ModularStakingInvariants.t.sol` (success: `7 passed; 0 failed`).
  - `cd SharedDeposit && npx hardhat test test/v2/modular-staking/adversarial.spec.ts test/v2/modular-staking/fuzz.spec.ts` (success: `36 passing`).
  - `cd SharedDeposit && slither . --compile-force-framework hardhat --filter-paths "(lib|node_modules|test|mocks|interfaces)"` (completed; scoped detector profile unchanged at `203` hits / `18` detector categories).
- Decisions:
  - Foundry test path now treated as first-class audit gate in repo scripts and docs, not an ad-hoc local prerequisite.
- Open risks:
  - None for Foundry availability in this environment; dependency bootstrap path is now documented and executable.
- Next actions:
  1. Keep `npm run test:invariants` in each multipass audit cycle before finalizing contract slices.

## 2026-05-20 — Full E2E Validation Sweep
- Goal: Confirm whether contracts work across full lifecycle paths (not only unit/adversarial slices).
- Commands + outcomes:
  - `cd SharedDeposit && npx hardhat test test/v2/core/e2e.spec.ts test/v2/modular-staking/e2e.spec.ts test/v2/modular-staking/e2e-router.spec.ts test/v2/modular-staking/scenarioTests.spec.ts`
    - Result: `38 passing`.
  - `cd SharedDeposit && MAINNET_RPC_URL=https://ethereum.publicnode.com npx hardhat test test/v2/modular-staking/fork.spec.ts`
    - Result: `10 passing`.
  - `cd SharedDeposit && npx hardhat test $(ls test/v2/modular-staking/*.spec.ts)`
    - Result: `288 passing`, `10 pending`.
- Coverage confirmed in this sweep:
  - Core + modular deposit -> beacon deposit notification/report -> reward accounting -> fee share minting.
  - Wrap/unwrap (`stToken` <-> `wstToken`) and withdrawal queue request/finalize/claim lifecycle.
  - Router/module path with ValidatorModule + DVT cluster gating and fork-mode beacon address flow.
  - Scenario stress flows (pause/resume, slash interactions, queue/accounting invariants).
- Residual caveat:
  - This is strong local + forked-network validation; it is not a live mainnet deployment execution proof.

## 2026-05-22 — Artifact Retention
- Scope: prune x-ray artifact noise while preserving audit evidence used by this handoff.
- Kept (high-signal / referenced):
  - `SharedDeposit/x-ray/enumeration-pass1.txt` — canonical inventory/context file referenced in this handoff and `x-ray/x-ray.md`.
  - `SharedDeposit/x-ray/git-security-analysis.json` — structured git-risk evidence referenced in this handoff.
  - `SharedDeposit/x-ray/pass1-modular-governance.md` — pass-level finding/triage evidence referenced in this handoff.
  - `SharedDeposit/x-ray/entry-points-pass1.md` and `SharedDeposit/x-ray/invariants-pass1.md` — concise pass summaries with contract/line evidence.
  - `SharedDeposit/x-ray/slither-pass1.json` — compact record that slither output was intentionally truncated to avoid raw artifact bloat.
- Removed (low-signal duplicate):
  - `SharedDeposit/x-ray/entrypoints-pass1-raw.txt` — transient/raw placeholder that duplicated information already captured in `entry-points-pass1.md`.

## 2026-05-22 — Multipass Finalization + Meta Learnings
- Goal: final pre-push multipass for PR 378 with docs/code parity, old-doc drift reconciliation, and referral-path hardening.
- Multipass checklist executed:
  - UI/docs build: `npm run build` (pass).
  - Targeted modular referral suites:
    - `npx hardhat test test/v2/modular-staking/stakingRouter.spec.ts test/v2/modular-staking/stakingCore.spec.ts test/v2/modular-staking/governanceReferral.spec.ts` (pass, `121 passing`).
  - Invariants: `npm run test:invariants` (pass, `7 passing`).
  - Deploy wiring smoke: `npx hardhat deploy --tags referral-code-registry,referral-code-wiring` (pass).
  - Static audit: `slither . --compile-force-framework hardhat --filter-paths "(lib|node_modules|test|mocks|interfaces)"` (completed with expected legacy/noise findings).
- Delegated reviews:
  - Security-focused subagent pass on changed referral paths.
  - Docs-consistency subagent pass vs implementation + old docs.
  - Gaps were integrated directly into docs and deployment guidance.
- Hardening landed from this pass:
  - `StakingCore`/`StakingRouter` referral code resolution now safely catches resolver reverts and degrades to zero-referral behavior.
  - Added `RevertingReferralCodeRegistry` mock + tests to lock this behavior.
  - `015_referralCodeRegistryWiring.ts` now fails closed on non-local networks when registry deployment is missing.
  - Website docs now explicitly cover migration/cutover state, governance preview-only status, module code-hash allowlist release gates, and current UI deployment gating behavior.
  - Legacy docs drift corrected (`UPGRADE_PATH.md`, `DEPLOYMENT_GUIDE.md`) for current signatures/defaults.
- Meta learnings (propagated defaults):
  1. Treat every feature landing as a required multipass: build + targeted tests + invariants + static analysis + docs parity.
  2. Run delegated read-only review passes before final push; keep critical-path edits local.
  3. Prefer fail-closed deployment behavior on non-local networks for control-plane wiring.
  4. Keep docs explicit about “implemented now” vs “integration/roadmap” to avoid support ambiguity.
