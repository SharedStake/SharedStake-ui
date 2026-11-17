# Comprehensive Audit & Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zero outstanding security findings, zero stubs, zero test failures, clean lint across all 29 Solidity contracts in PR 379 + PR 380. Every contract audited against the full 21-pattern DeFi checklist. Iterate until advisor and all gates return clean.

**Architecture:** Risk-tiered kimi-delegate audit (5 batches, Tiers 1–5) runs in parallel with a 3-angle code-review diff scan. All FINDING items are fixed, gates re-run, then Opus advisor signs off. Loop repeats until clean.

**Tech Stack:** Solidity 0.8.20, Hardhat, TypeScript, OpenZeppelin v4.9, kimi-delegate, code-review skill, advisor (Opus), ethers v6, Mocha/Chai.

---

## File Inventory

**Audit targets (contracts):**
- `staking-contracts/contracts/v2/modular-staking/StakingRouter.sol`
- `staking-contracts/contracts/v2/modular-staking/StakingCore.sol`
- `staking-contracts/contracts/v2/modular-staking/WithdrawalQueueV2.sol`
- `staking-contracts/contracts/v2/modular-staking/FeeController.sol`
- `staking-contracts/contracts/v2/modular-staking/StToken.sol`
- `staking-contracts/contracts/v2/modular-staking/OracleAdapter.sol`
- `staking-contracts/contracts/v2/modular-staking/QuorumOracleAdapter.sol`
- `staking-contracts/contracts/v2/modular-staking/lib/OracleValidation.sol`
- `staking-contracts/contracts/v2/modular-staking/modules/ValidatorModule.sol`
- `staking-contracts/contracts/v2/modular-staking/modules/DVTModule.sol`
- `staking-contracts/contracts/v2/modular-staking/modules/LSTWrapModule.sol`
- `staking-contracts/contracts/v2/modular-staking/OperatorRegistry.sol`
- `staking-contracts/contracts/v2/modular-staking/InstitutionalPolicyRegistry.sol`
- `staking-contracts/contracts/v2/modular-staking/ReferralRegistry.sol`
- `staking-contracts/contracts/v2/modular-staking/ReferralCodeRegistry.sol`
- `staking-contracts/contracts/v2/modular-staking/DebtPool.sol`
- `staking-contracts/contracts/v2/modular-staking/MigrationHelper.sol`
- `staking-contracts/contracts/v2/modular-staking/WstToken.sol`
- `staking-contracts/contracts/v2/modular-staking/StTokenERC4626Wrapper.sol`
- `staking-contracts/contracts/v2/modular-staking/ShareMath.sol`
- `staking-contracts/contracts/v2/modular-staking/StEthPriceOracle.sol`

**Audit context files (write before delegating):**
- `artifacts/kimi-delegate/tier1a-context.md`
- `artifacts/kimi-delegate/tier1b-context.md`
- `artifacts/kimi-delegate/tier2a-context.md`
- `artifacts/kimi-delegate/tier2b-context.md`
- `artifacts/kimi-delegate/tier3-context.md`
- `artifacts/kimi-delegate/tier4-context.md`
- `artifacts/kimi-delegate/tier5-context.md`

**Test files (gates):**
- `staking-contracts/test/v2/modular-staking/*.spec.ts` (22 files)

---

## Task 1: Baseline gates

**Files:** read-only run

- [ ] **Step 1: Run full test suite and capture output**

```bash
cd staking-contracts && npx hardhat test 2>&1 | tee /tmp/baseline-tests.txt | tail -20
```

Expected: some number passing. Record total passing/failing. Any failures are pre-existing bugs.

- [ ] **Step 2: Run Solidity lint**

```bash
cd staking-contracts && npm run lint:sol 2>&1 | tee /tmp/baseline-lint.txt | tail -30
```

Expected: note any errors or warnings. These are the starting quality baseline.

- [ ] **Step 3: Record baseline**

Save counts: `grep -E "passing|failing|error" /tmp/baseline-tests.txt`

---

## Task 2: Tier 1A audit — StakingRouter + StakingCore

**Files:**
- Read: `staking-contracts/contracts/v2/modular-staking/StakingRouter.sol`
- Read: `staking-contracts/contracts/v2/modular-staking/StakingCore.sol`
- Write: `artifacts/kimi-delegate/tier1a-context.md`

- [ ] **Step 1: Build context file**

Read both contracts fully, then write `artifacts/kimi-delegate/tier1a-context.md` containing the full source of both files verbatim.

- [ ] **Step 2: Run kimi-delegate Tier 1A batch**

```bash
kimi-delegate --context-file artifacts/kimi-delegate/tier1a-context.md --task "You are auditing Solidity contracts for a DeFi staking protocol. Answer CLEAN or FINDING+file:line+description for each. No preamble. One line per answer.

Q1 (StakingRouter — reentrancy): Does submit() or any ETH-receiving function update all state variables before making external calls or sending ETH? Can a malicious ERC-20/LST module re-enter and double-count a deposit?

Q2 (StakingRouter — unbounded loops): Are there any loops over storage arrays (validator lists, module lists, operator lists) in hot paths (submit, reportBeaconBalance, distributeRewards)? Could a long array cause an out-of-gas revert that permanently locks the function?

Q3 (StakingRouter — access control): Are privileged functions (setFees, addModule, removeModule, reportBeaconBalance) protected by onlyRole guards? Is there any function that should be permissioned but is not?

Q4 (StakingCore — ETH accounting): After the pendingEther wiring, can lockedEther + pendingEther + pendingRefunds ever exceed address(this).balance, causing availableEther() to underflow and revert?

Q5 (StakingCore — admin transfer): Is DEFAULT_ADMIN_ROLE or any owner transfer a single-step operation? Single-step admin handoff to a wrong address is irreversible — should be two-step (nominate + accept)."
```

- [ ] **Step 3: Save output to findings log**

Append kimi output to `/tmp/audit-findings.md` with header `## Tier 1A — StakingRouter + StakingCore`.

---

## Task 3: Tier 1B audit — WithdrawalQueueV2 + FeeController + StToken

**Files:**
- Read: `staking-contracts/contracts/v2/modular-staking/WithdrawalQueueV2.sol`
- Read: `staking-contracts/contracts/v2/modular-staking/FeeController.sol`
- Read: `staking-contracts/contracts/v2/modular-staking/StToken.sol`
- Write: `artifacts/kimi-delegate/tier1b-context.md`

- [ ] **Step 1: Build context file**

Read all three contracts and write verbatim to `artifacts/kimi-delegate/tier1b-context.md`.

- [ ] **Step 2: Run kimi-delegate Tier 1B batch**

```bash
kimi-delegate --context-file artifacts/kimi-delegate/tier1b-context.md --task "You are auditing Solidity contracts for a DeFi staking protocol. Answer CLEAN or FINDING+file:line+description for each. No preamble. One line per answer.

Q1 (WithdrawalQueueV2 — accounting): Can recoverEth() extract ETH that is owed to pending or finalized withdrawal requests? Specifically: does availableEther() = balance - lockedEther - totalPendingRefunds correctly exclude pendingEther (pre-finalization ETH obligations)?

Q2 (WithdrawalQueueV2 — finalize over-ETH): If msg.value > totalEthRequired in finalize(), excess goes to pendingRefunds[msg.sender]. Is withdrawRefund() protected against reentrancy? Is totalPendingRefunds kept consistent with per-address mappings?

Q3 (FeeController — fee cap): Are fee basis points validated to be <= 10000 (100%)? Can governance set fees to 100%+ causing all depositor ETH to be taken as fees?

Q4 (FeeController — fee sandwich): Can a miner/MEV bot front-run a user's submit() with a setFee() governance call to extract value? Is there a timelock or max-fee-change-per-block limit?

Q5 (StToken — inflation attack): Can an attacker donate ETH directly to the StToken contract to inflate the share price before the first deposit, causing subsequent depositors to receive 0 shares? Is totalSupply == 0 handled at mint?"
```

- [ ] **Step 3: Save output**

Append to `/tmp/audit-findings.md` with header `## Tier 1B — WithdrawalQueueV2 + FeeController + StToken`.

---

## Task 4: Tier 2A audit — OracleAdapter + QuorumOracleAdapter + OracleValidation

**Files:**
- Read: `staking-contracts/contracts/v2/modular-staking/OracleAdapter.sol`
- Read: `staking-contracts/contracts/v2/modular-staking/QuorumOracleAdapter.sol`
- Read: `staking-contracts/contracts/v2/modular-staking/lib/OracleValidation.sol`
- Write: `artifacts/kimi-delegate/tier2a-context.md`

- [ ] **Step 1: Build context file**

Read all three files and write to `artifacts/kimi-delegate/tier2a-context.md`.

- [ ] **Step 2: Run kimi-delegate Tier 2A batch**

```bash
kimi-delegate --context-file artifacts/kimi-delegate/tier2a-context.md --task "You are auditing Solidity oracle contracts for a DeFi staking protocol. Answer CLEAN or FINDING+file:line+description for each. No preamble. One line per answer.

Q1 (OracleAdapter — staleness): Is there a maximum age check on submitted reports? Can a keeper replay a stale report from a previous epoch to manipulate share price?

Q2 (OracleAdapter — last-submitter guard): After the round-4 fix, does the last-submitter guard prevent the same oracle from submitting two consecutive reports without an intervening report from a different oracle?

Q3 (QuorumOracleAdapter — quorum bypass): Can a single oracle reach quorum by submitting the same report multiple times (duplicate submission), bypassing the N-of-M requirement?

Q4 (OracleValidation — bounds check): Does OracleValidation enforce both a floor and a ceiling on the reported beacon balance? Can a malicious oracle report balance = 0 or balance = type(uint256).max to crash share price in either direction?

Q5 (QuorumOracleAdapter — griefing): Can an operator spam competing reports to prevent quorum from ever being reached (liveness attack)? Is there a report expiry or cleanup mechanism?"
```

- [ ] **Step 3: Save output**

Append to `/tmp/audit-findings.md` with header `## Tier 2A — Oracle`.

---

## Task 5: Tier 2B audit — ValidatorModule + DVTModule + LSTWrapModule

**Files:**
- Read: `staking-contracts/contracts/v2/modular-staking/modules/ValidatorModule.sol`
- Read: `staking-contracts/contracts/v2/modular-staking/modules/DVTModule.sol`
- Read: `staking-contracts/contracts/v2/modular-staking/modules/LSTWrapModule.sol`
- Write: `artifacts/kimi-delegate/tier2b-context.md`

- [ ] **Step 1: Build context file**

Read all three and write to `artifacts/kimi-delegate/tier2b-context.md`.

- [ ] **Step 2: Run kimi-delegate Tier 2B batch**

```bash
kimi-delegate --context-file artifacts/kimi-delegate/tier2b-context.md --task "You are auditing Solidity staking module contracts. Answer CLEAN or FINDING+file:line+description for each. No preamble. One line per answer.

Q1 (ValidatorModule — deposit replay): Can the same validator pubkey be registered and funded twice? Is there a uniqueness check before calling the deposit contract?

Q2 (DVTModule — slashing propagation): When a DVT cluster is slashed, does the module correctly reduce the StakingCore share price or trigger a loss event? Or does slashing silently leave shares over-valued?

Q3 (LSTWrapModule — price manipulation): Does LSTWrapModule use a TWAP or spot price when valuing wrapped LST assets? Can a flash loan manipulate the spot price to over-value deposited assets?

Q4 (ValidatorModule — exit queue): If a validator is exited/withdrawn, is the ETH correctly returned to the WithdrawalQueueV2 finalization pool? Could ETH get stuck if the exit path bypasses the queue?

Q5 (DVTModule + LSTWrapModule — reentrancy): Do wrap/unwrap operations that call external LST contracts update internal accounting before the external call?"
```

- [ ] **Step 3: Save output**

Append to `/tmp/audit-findings.md` with header `## Tier 2B — Modules`.

---

## Task 6: Tier 3 audit — Registries + DebtPool + MigrationHelper

**Files:**
- Read: `staking-contracts/contracts/v2/modular-staking/OperatorRegistry.sol`
- Read: `staking-contracts/contracts/v2/modular-staking/InstitutionalPolicyRegistry.sol`
- Read: `staking-contracts/contracts/v2/modular-staking/ReferralRegistry.sol`
- Read: `staking-contracts/contracts/v2/modular-staking/ReferralCodeRegistry.sol`
- Read: `staking-contracts/contracts/v2/modular-staking/DebtPool.sol`
- Read: `staking-contracts/contracts/v2/modular-staking/MigrationHelper.sol`
- Write: `artifacts/kimi-delegate/tier3-context.md`

- [ ] **Step 1: Build context file**

Read all six and write to `artifacts/kimi-delegate/tier3-context.md`. For large files, include the full source.

- [ ] **Step 2: Run kimi-delegate Tier 3 batch**

```bash
kimi-delegate --context-file artifacts/kimi-delegate/tier3-context.md --task "You are auditing Solidity registry and governance contracts. Answer CLEAN or FINDING+file:line+description for each. No preamble. One line per answer.

Q1 (OperatorRegistry — NFT griefing): Can an operator transfer their NFT to address(0) or a non-EOA to brick the registry entry? Is the NFT transferability restricted?

Q2 (DebtPool — Merkle replay): Can the same Merkle proof be claimed twice (double-spend)? Is there a nullifier/bitmap tracking which leafs have been claimed?

Q3 (MigrationHelper — replay): Can MigrationHelper.migrate() be called multiple times for the same user, minting double shares or double-crediting ETH?

Q4 (ReferralCodeRegistry — front-run): Can an attacker front-run a user's referral code registration to steal a code, then collect referral fees on that user's behalf?

Q5 (InstitutionalPolicyRegistry — policy bypass): Can an institutional address bypass a policy by self-removing it between the policy check and the action that the policy should restrict?"
```

- [ ] **Step 3: Save output**

Append to `/tmp/audit-findings.md` with header `## Tier 3 — Registries + Governance`.

---

## Task 7: Tier 4 audit — Wrappers + Math + PriceOracle

**Files:**
- Read: `staking-contracts/contracts/v2/modular-staking/WstToken.sol`
- Read: `staking-contracts/contracts/v2/modular-staking/StTokenERC4626Wrapper.sol`
- Read: `staking-contracts/contracts/v2/modular-staking/ShareMath.sol`
- Read: `staking-contracts/contracts/v2/modular-staking/StEthPriceOracle.sol`
- Write: `artifacts/kimi-delegate/tier4-context.md`

- [ ] **Step 1: Build context file**

Read all four and write to `artifacts/kimi-delegate/tier4-context.md`.

- [ ] **Step 2: Run kimi-delegate Tier 4 batch**

```bash
kimi-delegate --context-file artifacts/kimi-delegate/tier4-context.md --task "You are auditing Solidity token wrapper and math contracts. Answer CLEAN or FINDING+file:line+description for each. No preamble. One line per answer.

Q1 (StTokenERC4626Wrapper — inflation): Does the ERC4626 wrapper correctly handle the first-depositor inflation attack (deposit 1 wei, donate ETH, next depositor gets 0 shares)? Is virtual shares or a minimum deposit enforced?

Q2 (StTokenERC4626Wrapper — rounding): Does previewDeposit/previewMint round in favor of the vault (round down shares out on deposit, round up assets in)? Incorrect rounding direction can drain the vault.

Q3 (WstToken — wrap invariant): After wrap(x) + unwrap(result), does the user always get back <= x stTokens (no free tokens)? Is there a rounding edge case at token amounts near 0?

Q4 (ShareMath — division by zero): Can totalShares or totalAssets ever be 0 in a live pool, causing a division-by-zero revert in share price calculations?

Q5 (StEthPriceOracle — staleness): Is there a maximum acceptable age for the oracle price? Can a stale stETH price cause stakers to over- or under-receive shares?"
```

- [ ] **Step 3: Save output**

Append to `/tmp/audit-findings.md` with header `## Tier 4 — Wrappers + Math`.

---

## Task 8: Tier 5 audit — Deploy scripts

**Files:**
- Read: `staking-contracts/deploy/015_governanceHandover.ts`
- Read: all other `staking-contracts/deploy/*.ts` files (skim for handover gaps and init order)
- Write: `artifacts/kimi-delegate/tier5-context.md`

- [ ] **Step 1: List all deploy scripts**

```bash
ls staking-contracts/deploy/*.ts | sort
```

- [ ] **Step 2: Build context file**

Read `015_governanceHandover.ts` in full. Read the first 60 lines of each other deploy script to capture the `func.tags` and `func.dependencies` declarations. Write to `artifacts/kimi-delegate/tier5-context.md`.

- [ ] **Step 3: Run kimi-delegate Tier 5 batch**

```bash
kimi-delegate --context-file artifacts/kimi-delegate/tier5-context.md --task "You are auditing Hardhat deploy scripts for a DeFi staking protocol. Answer CLEAN or FINDING+file:line+description for each. No preamble. One line per answer.

Q1 (governanceHandover — completeness): Is every contract that has a GOV or DEFAULT_ADMIN_ROLE present in the GOVERNED_DEPLOYMENTS array? List any missing contract names as FINDING.

Q2 (governanceHandover — GUARDIAN migration): Is GUARDIAN intentionally excluded from timelock migration (it is a keeper role)? Confirm this is documented and not an oversight.

Q3 (deploy ordering — init order): Do any deploy scripts grant roles or call setters on contracts that might not be deployed yet (dependency listed in func.dependencies but order not guaranteed)? FINDING if a script calls a contract address that could be address(0).

Q4 (deploy scripts — idempotency): Do deploy scripts check before granting roles (hasRole before grantRole)? If re-run, could they double-grant or create duplicate state?

Q5 (deploy scripts — deployer cleanup): After handover, does the deployer's address retain any privileged roles on any contract? FINDING if any contract's deployer still holds GOV or DEFAULT_ADMIN_ROLE post-handover."
```

- [ ] **Step 4: Save output**

Append to `/tmp/audit-findings.md` with header `## Tier 5 — Deploy Scripts`.

---

## Task 9: code-review diff scan (3 angles)

**Files:** full `git diff main...HEAD`

- [ ] **Step 1: Invoke code-review skill**

Use the `code-review` skill with the full `main...HEAD` diff as the target. The skill runs 3 angles (line-by-line, removed-behavior, cross-file) via Agent subagents and then verifies candidates.

```
code-review skill target: git diff main...HEAD
effort: high
```

Expected output: JSON array of ≤10 findings ranked most-severe first. Save output to `/tmp/code-review-findings.json`.

- [ ] **Step 2: Merge code-review findings with kimi findings**

Append all CONFIRMED and PLAUSIBLE code-review findings to `/tmp/audit-findings.md` with header `## Code Review — Diff Scan`.

---

## Task 10: Consolidate all findings

**Files:** `/tmp/audit-findings.md` → `artifacts/kimi-delegate/consolidated-findings.md`

- [ ] **Step 1: Triage findings**

Read `/tmp/audit-findings.md`. For each FINDING, categorize:
- `CRITICAL` — can lose funds or permanently brick the protocol
- `HIGH` — can lose funds under specific conditions or bypass access control
- `MEDIUM` — incorrect behavior, DoS, or broken invariant
- `LOW` — code quality, best practice, minor inefficiency

- [ ] **Step 2: Write consolidated report**

Write `artifacts/kimi-delegate/consolidated-findings.md` with all findings grouped by severity. For each:
- Contract name + file + line
- One-sentence description
- Severity
- Recommended fix (1-2 sentences)

- [ ] **Step 3: Filter CLEAN results**

Any tier that returned all-CLEAN entries: note explicitly that those contracts have no findings.

---

## Task 11: Fix pass — implement all CRITICAL and HIGH fixes

**Files:** whichever contracts have CRITICAL/HIGH findings

- [ ] **Step 1: Fix each CRITICAL finding**

For each CRITICAL item in the consolidated report:
- Read the relevant contract
- Apply the minimal fix (no scope creep)
- Run `cd staking-contracts && npx hardhat compile` to verify it compiles

- [ ] **Step 2: Fix each HIGH finding**

Same process as CRITICAL.

- [ ] **Step 3: Fix each MEDIUM finding**

Same process. If a MEDIUM fix requires a new test to prevent regression, write the test.

- [ ] **Step 4: Address LOW / code-quality items**

Apply refactors for any LOW items that are unambiguous improvements (dead code removal, NatSpec gaps, naming inconsistency). Skip if speculative.

- [ ] **Step 5: Compile check**

```bash
cd staking-contracts && npx hardhat compile
```

Expected: no errors.

---

## Task 12: Re-run all gates

**Files:** test suite, lint config

- [ ] **Step 1: Run full test suite**

```bash
cd staking-contracts && npx hardhat test 2>&1 | tee /tmp/post-fix-tests.txt | tail -20
```

Expected: same or more tests passing than baseline; 0 new failures.

- [ ] **Step 2: Run lint**

```bash
cd staking-contracts && npm run lint:sol 2>&1 | tee /tmp/post-fix-lint.txt | tail -20
```

Expected: 0 errors. Warnings acceptable if pre-existing.

- [ ] **Step 3: Fix any new failures**

If the fix pass introduced test failures, fix the tests (they may need updating for new behavior) or fix the contract (if the fix was wrong). Re-run Step 1 until green.

---

## Task 13: Commit all fixes

- [ ] **Step 1: Stage changed contracts and tests**

```bash
git add staking-contracts/contracts/v2/modular-staking/
git add staking-contracts/test/v2/modular-staking/
git add artifacts/kimi-delegate/
git add docs/superpowers/
```

- [ ] **Step 2: Commit**

```bash
git commit -m "$(cat <<'EOF'
security(audit): comprehensive 5-tier audit pass — all findings addressed

- Tier 1: StakingRouter, StakingCore, WithdrawalQueueV2, FeeController, StToken
- Tier 2: OracleAdapter, QuorumOracleAdapter, OracleValidation, modules
- Tier 3: Registries, DebtPool, MigrationHelper
- Tier 4: WstToken, ERC4626Wrapper, ShareMath, StEthPriceOracle
- Tier 5: Deploy scripts / governance handover
- code-review 3-angle diff scan
- All gates green: hardhat test + lint:sol

Co-authored-by: Chimera <chimera_defi@protonmail.com>
EOF
)"
```

---

## Task 14: Advisor Opus sign-off

**Files:** `artifacts/kimi-delegate/consolidated-findings.md`

- [ ] **Step 1: Call advisor**

Call `advisor()` with the full conversation context. The advisor sees all audit findings, all fixes, all test results. Ask for explicit sign-off: are there any remaining concerns? Any patterns missed?

- [ ] **Step 2: If advisor raises new concerns**

Document the concerns. Return to Task 2 (run new targeted kimi batches on the flagged contracts). Re-run fix pass and gates.

- [ ] **Step 3: If advisor approves**

Post a final summary comment to both PRs:
```bash
gh pr comment 379 --repo SharedStake/SharedStake-ui --body "..."
gh pr comment 380 --repo SharedStake/SharedStake-ui --body "..."
```

---

## Task 15: Final iteration check

- [ ] **Step 1: Verify done criteria**

```bash
# Tests green
cd staking-contracts && npx hardhat test 2>&1 | grep -E "passing|failing"

# Lint green
cd staking-contracts && npm run lint:sol 2>&1 | grep -c "error" || echo "0 errors"
```

- [ ] **Step 2: Confirm no open findings**

Check `artifacts/kimi-delegate/consolidated-findings.md` — every FINDING entry should have a status of `FIXED` or `ACCEPTED (LOW, documented)`.

- [ ] **Step 3: Done**

If both gates green and advisor approved: work is complete. If not: iterate from Task 2.

---

## Iteration Protocol

If after Task 14 the advisor raises new concerns:
1. Add new kimi batch targeting the flagged contracts (5 Qs per call)
2. Fix any new findings
3. Re-run gates (Task 12)
4. Call advisor again (Task 14)
5. Repeat until advisor gives explicit approval

Maximum 3 iterations before escalating to user with a summary of unresolved concerns.
