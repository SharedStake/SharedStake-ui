# pendingEther Wiring + PR 380 Security Audit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire `pendingEther` accounting in `WithdrawalQueueV2.sol` (PR 379) and complete a security audit of `OldVeth2WithdrawalQueue.sol` (PR 380) using the 21-pattern DeFi checklist from project memory.

**Architecture:** Two independent streams run in parallel. Stream A implements the 3-point `pendingEther` wiring in the contract + TDD test coverage, then runs all 4 gates. Stream B fetches PR 380's branch, applies the 21-pattern security checklist to `OldVeth2WithdrawalQueue.sol`, fixes any findings, and runs PR 380's gate suite. Both streams converge in a final `code-review` + advisor Opus sign-off.

**Tech Stack:** Solidity 0.8.20, Hardhat + TypeScript (Mocha/Chai), ethers v6, OpenZeppelin v4.9, `npx hardhat test`, `npm run test:invariants` (Foundry), `npm run lint:sol`.

---

## Spec reference

`docs/superpowers/specs/2026-06-11-pendingEther-wiring-design.md`

---

## STREAM A — `pendingEther` wiring in PR 379

### Task A1: Wire `pendingEther` increment in `_enqueueRequest`

**Files:**
- Modify: `staking-contracts/contracts/v2/modular-staking/WithdrawalQueueV2.sol:156-167`

- [ ] **Step 1: Write the failing test**

Add the following `it` block inside the existing `describe("requestWithdrawals()", () => {` block in `staking-contracts/test/v2/modular-staking/withdrawalQueueV2.spec.ts` (after the "batch request" test, around line 103):

```typescript
it("increments pendingEther on request", async () => {
  expect(await queue.pendingEther()).to.equal(0n);

  await queue.connect(alice).requestWithdrawals([parseEther("1")], alice.address);
  const req1 = await queue.getRequest(1);
  expect(await queue.pendingEther()).to.equal(req1.ethAmount);

  await queue.connect(alice).requestWithdrawals([parseEther("2")], alice.address);
  const req2 = await queue.getRequest(2);
  expect(await queue.pendingEther()).to.equal(req1.ethAmount + req2.ethAmount);
});
```

- [ ] **Step 2: Run the test — expect FAIL**

```bash
cd staking-contracts && npx hardhat test test/v2/modular-staking/withdrawalQueueV2.spec.ts --grep "increments pendingEther on request"
```
Expected: `AssertionError: expected 0n to equal <non-zero>`

- [ ] **Step 3: Implement — add `pendingEther += ethValue;` in contract**

In `staking-contracts/contracts/v2/modular-staking/WithdrawalQueueV2.sol`, inside `_enqueueRequest`, add one line **after** the `requests[requestId] = WithdrawalRequest({...})` closing brace (line ~164, before the `emit`):

```solidity
        requestId = nextRequestId++;
        requests[requestId] = WithdrawalRequest({
            owner: owner,
            stShares: shares,
            ethAmount: ethValue, // locked at request-time exchange rate
            requestedAt: block.timestamp,
            finalized: false,
            claimed: false
        });
        pendingEther += ethValue;

        emit WithdrawalRequested(owner, requestId, shares, stTokenAmount);
```

- [ ] **Step 4: Run the test — expect PASS**

```bash
cd staking-contracts && npx hardhat test test/v2/modular-staking/withdrawalQueueV2.spec.ts --grep "increments pendingEther on request"
```
Expected: 1 passing

- [ ] **Step 5: Commit**

```bash
git add staking-contracts/contracts/v2/modular-staking/WithdrawalQueueV2.sol \
        staking-contracts/test/v2/modular-staking/withdrawalQueueV2.spec.ts
git commit -m "feat(withdrawalQueue): wire pendingEther increment in _enqueueRequest

Co-authored-by: Chimera <chimera_defi@protonmail.com>"
```

---

### Task A2: Wire `pendingEther` decrement in `finalize`

**Files:**
- Modify: `staking-contracts/contracts/v2/modular-staking/WithdrawalQueueV2.sol:199-214`

- [ ] **Step 1: Write the failing test**

Add the following `it` block inside the existing `describe("finalize()", () => {` block in `staking-contracts/test/v2/modular-staking/withdrawalQueueV2.spec.ts` (after the "reverts on invalid request range" test):

```typescript
it("decrements pendingEther and increments lockedEther on finalize", async () => {
  // beforeEach already created requests 1 (1 ETH) and 2 (2 ETH)
  const req1 = await queue.getRequest(1);
  const req2 = await queue.getRequest(2);
  const totalExpected = req1.ethAmount + req2.ethAmount;

  expect(await queue.pendingEther()).to.equal(totalExpected);
  expect(await queue.lockedEther()).to.equal(0n);

  await queue.connect(gov).finalize(2, {value: totalExpected});

  expect(await queue.pendingEther()).to.equal(0n);
  expect(await queue.lockedEther()).to.equal(totalExpected);
});

it("pendingEther tracks partial finalization correctly", async () => {
  // Finalize only request 1, leave request 2 pending
  const req1 = await queue.getRequest(1);
  const req2 = await queue.getRequest(2);

  await queue.connect(gov).finalize(1, {value: req1.ethAmount});

  expect(await queue.pendingEther()).to.equal(req2.ethAmount);
  expect(await queue.lockedEther()).to.equal(req1.ethAmount);
});
```

- [ ] **Step 2: Run the tests — expect FAIL**

```bash
cd staking-contracts && npx hardhat test test/v2/modular-staking/withdrawalQueueV2.spec.ts --grep "decrements pendingEther"
```
Expected: `AssertionError: expected <totalExpected> to equal 0n`

- [ ] **Step 3: Implement — add `pendingEther -= totalEthRequired;` in finalize**

In `WithdrawalQueueV2.sol`, inside `finalize()`, add one line **after** `lockedEther += totalEthRequired;` (line ~203):

```solidity
        lockedEther += totalEthRequired;
        pendingEther -= totalEthRequired;
        lastFinalizedRequestId = lastRequestId;
```

- [ ] **Step 4: Run the tests — expect PASS**

```bash
cd staking-contracts && npx hardhat test test/v2/modular-staking/withdrawalQueueV2.spec.ts --grep "pendingEther"
```
Expected: 3 passing (increment test + 2 finalize tests)

- [ ] **Step 5: Commit**

```bash
git add staking-contracts/contracts/v2/modular-staking/WithdrawalQueueV2.sol \
        staking-contracts/test/v2/modular-staking/withdrawalQueueV2.spec.ts
git commit -m "feat(withdrawalQueue): wire pendingEther decrement in finalize

Co-authored-by: Chimera <chimera_defi@protonmail.com>"
```

---

### Task A3: Add `totalUnclaimedEther()` view + full-lifecycle test

**Files:**
- Modify: `staking-contracts/contracts/v2/modular-staking/WithdrawalQueueV2.sol` (Views section, ~line 318)
- Modify: `staking-contracts/test/v2/modular-staking/withdrawalQueueV2.spec.ts`

- [ ] **Step 1: Write the failing test**

Add a new `describe` block at the bottom of the test file, before the closing `});`:

```typescript
describe("pendingEther + lockedEther accounting", () => {
  it("full lifecycle: request → finalize → claim zeroes both counters", async () => {
    await queue.connect(alice).requestWithdrawals([parseEther("1")], alice.address);
    const req = await queue.getRequest(1);

    // After request
    expect(await queue.pendingEther()).to.equal(req.ethAmount);
    expect(await queue.lockedEther()).to.equal(0n);
    expect(await queue.totalUnclaimedEther()).to.equal(req.ethAmount);

    // After finalize
    await queue.connect(gov).finalize(1, {value: req.ethAmount});
    expect(await queue.pendingEther()).to.equal(0n);
    expect(await queue.lockedEther()).to.equal(req.ethAmount);
    expect(await queue.totalUnclaimedEther()).to.equal(req.ethAmount);

    // After claim
    await queue.connect(alice).claimWithdrawal(1, alice.address);
    expect(await queue.pendingEther()).to.equal(0n);
    expect(await queue.lockedEther()).to.equal(0n);
    expect(await queue.totalUnclaimedEther()).to.equal(0n);
  });
});
```

- [ ] **Step 2: Run the test — expect FAIL**

```bash
cd staking-contracts && npx hardhat test test/v2/modular-staking/withdrawalQueueV2.spec.ts --grep "totalUnclaimedEther"
```
Expected: `TypeError: queue.totalUnclaimedEther is not a function`

- [ ] **Step 3: Add `totalUnclaimedEther()` view to contract**

In `WithdrawalQueueV2.sol`, in the `// ── Views` section after `availableEther()`:

```solidity
    /// @notice Total ETH owed across all outstanding withdrawal requests (pending + finalized-unclaimed).
    function totalUnclaimedEther() external view returns (uint256) {
        return pendingEther + lockedEther;
    }
```

- [ ] **Step 4: Run the test — expect PASS**

```bash
cd staking-contracts && npx hardhat test test/v2/modular-staking/withdrawalQueueV2.spec.ts --grep "full lifecycle"
```
Expected: 1 passing

- [ ] **Step 5: Commit**

```bash
git add staking-contracts/contracts/v2/modular-staking/WithdrawalQueueV2.sol \
        staking-contracts/test/v2/modular-staking/withdrawalQueueV2.spec.ts
git commit -m "feat(withdrawalQueue): add totalUnclaimedEther() view + lifecycle accounting test

Co-authored-by: Chimera <chimera_defi@protonmail.com>"
```

---

### Task A4: Run all PR 379 gates

**Files:** No changes — gate run only.

- [ ] **Step 1: Lint**

```bash
cd staking-contracts && npm run lint:sol
```
Expected: 0 errors (baseline ~102 warnings is acceptable)

- [ ] **Step 2: Compile**

```bash
cd staking-contracts && npx hardhat compile
```
Expected: `Compiled N Solidity files successfully`

- [ ] **Step 3: Full test suite**

```bash
cd staking-contracts && npx hardhat test test/v2/modular-staking/withdrawalQueueV2.spec.ts
```
Expected: all tests passing (previous count + 4 new tests)

- [ ] **Step 4: Full modular-staking suite**

```bash
cd staking-contracts && npx hardhat test test/v2/modular-staking/*.spec.ts
```
Expected: 429 passing, 0 failing

- [ ] **Step 5: Invariants (Foundry)**

```bash
cd staking-contracts && npm run test:invariants
```
Expected: all passing (Foundry)

- [ ] **Step 6: Commit if any gate fixes were needed; push branch**

```bash
git push origin feat/protocol-v3-fresh
```

---

## STREAM B — PR 380 Security Audit (`OldVeth2WithdrawalQueue`)

> Run in parallel with Stream A. Work on a checked-out copy of `origin/codex/old-veth2-withdrawals-20260603` or in a worktree.

### Task B1: Fetch and orient on PR 380

**Files:** Read-only orientation.

- [ ] **Step 1: Fetch PR 380 branch**

```bash
git fetch origin codex/old-veth2-withdrawals-20260603
git show origin/codex/old-veth2-withdrawals-20260603:staking-contracts/contracts/v2/modular-staking/OldVeth2WithdrawalQueue.sol | wc -l
```

- [ ] **Step 2: Read the full contract**

```bash
git show origin/codex/old-veth2-withdrawals-20260603:staking-contracts/contracts/v2/modular-staking/OldVeth2WithdrawalQueue.sol
```

- [ ] **Step 3: Read the deploy script**

```bash
git show origin/codex/old-veth2-withdrawals-20260603:staking-contracts/deploy/022_oldVeth2WithdrawalQueue.ts
```

---

### Task B2: Apply 21-pattern security checklist (focus patterns)

> Use the `cso` skill and `security-review` skill for this task. Focus on the highest-yield patterns from project memory for this contract type.

**Files:** `OldVeth2WithdrawalQueue.sol` (read from remote branch)

- [ ] **Step 1: Pattern #7 — transferFrom direction (vEth2 escrow)**

In `request()`: verify `VETH2.safeTransferFrom(msg.sender, address(this), vEth2Amount)` pulls from caller INTO the contract (not the reverse). Check that `pendingVeth2 += vEth2Amount` is incremented on the same path.

Expected: CLEAN — contract escrows vEth2 from requester.

If FINDING: note file:line and fix before proceeding.

- [ ] **Step 2: Pattern #18 — pull-not-push for ETH/vEth2 returns**

Check `cancel()` and `claim()`:
- ETH is returned to `owner` via `address(payable(req.owner)).sendValue(req.ethAmount)` — this is push. Verify `nonReentrant` is on both functions (CEI order required).
- vEth2 cancel: verify `VETH2.safeTransfer(req.owner, req.vEth2Amount)` uses CEI (state changes before transfer).
- Check `recovery` functions: `recoverRedeemedVeth2` and `recoverEth` should exclude locked/pending amounts.

Expected: CLEAN (the PR notes pull pattern for refunds; verify claim/cancel are CEI-compliant).

If FINDING: note file:line.

- [ ] **Step 3: Pattern #20 — separate ADMIN/GUARDIAN roles in governance handover**

```bash
git show origin/codex/old-veth2-withdrawals-20260603:staking-contracts/deploy/ --name-only | grep -i handover
```
Verify `OldVeth2WithdrawalQueue` is added to the governance handover deploy script (the `GOVERNED_DEPLOYMENTS` array). If not present, that's a FINDING.

- [ ] **Step 4: Pattern #21 — last-submitter equivalent (role removal safety)**

`OldVeth2WithdrawalQueue` uses `GUARDIAN` for `finalize()`. If all GUARDIANs are removed, finalization is frozen. Check if `removeGuardian` or equivalent exists. If it does, verify there's a minimum-count guard or equivalent note in comments.

Expected: GUARDIAN is `DEFAULT_ADMIN_ROLE` grantee only — likely no removal function, so not applicable.

- [ ] **Step 5: Pattern #3 — roles granted at deploy**

In the deploy script `022_oldVeth2WithdrawalQueue.ts`: verify `GOV`, `GUARDIAN` roles are granted to the correct addresses. Verify the deploy script doesn't leave any role on the deployer EOA post-deploy.

- [ ] **Step 6: Pattern #9 — one-way state (finalized requests)**

`finalize()` sets `req.finalized = true`. Verify there is NO path to un-finalize. Also check `cancel()` does not allow canceling an already-finalized request.

Expected: `RequestAlreadyFinalized` revert guard — CLEAN.

- [ ] **Step 7: Pattern #16 — slippage in rate math**

`ethAmount = (vEth2Amount * redemptionRate) / 1e18`. Verify there's no division-before-multiplication precision loss and the rate is validated at deploy (`initialRedemptionRate == 0` reverts).

- [ ] **Step 8: Recovery ETH exclusion math**

In `recoverEth(address to, uint256 amount)`: verify the available amount excludes BOTH `lockedEther` (finalized claims) AND `totalPendingRefunds`. Formula should be:
```
available = address(this).balance - lockedEther - totalPendingRefunds
```
If it only excludes `lockedEther` without `totalPendingRefunds`, that's a FINDING.

---

### Task B3: Fix any findings from B2

**Files:** Whichever finding-bearing files were identified in B2.

- [ ] **Step 1: For each FINDING from B2, apply the fix**

(Specific fix steps depend on findings discovered in B2. Apply CEI order, add minimum-count guards, correct recovery math, add to handover script — as appropriate.)

- [ ] **Step 2: Run PR 380 gate suite**

```bash
# From repo root, on the codex branch or via merge into a temp worktree:
cd staking-contracts
git stash  # or use worktree — save current branch state
git checkout origin/codex/old-veth2-withdrawals-20260603 -- staking-contracts/ 2>/dev/null || \
  git worktree add /tmp/pr380-audit origin/codex/old-veth2-withdrawals-20260603

# In the PR 380 worktree:
npx hardhat test test/v2/modular-staking/oldVeth2WithdrawalQueue.spec.ts
```
Expected: 14 passing, 0 failing

- [ ] **Step 3: Lint**

```bash
npm run lint:sol
```
Expected: 0 errors

- [ ] **Step 4: Open a PR comment or patch commit on PR 380 branch with findings + fixes**

If findings were fixed:
```bash
git add staking-contracts/contracts/v2/modular-staking/OldVeth2WithdrawalQueue.sol \
        staking-contracts/deploy/022_oldVeth2WithdrawalQueue.ts
git commit -m "security: fix audit findings in OldVeth2WithdrawalQueue

Co-authored-by: Chimera <chimera_defi@protonmail.com>"
git push origin codex/old-veth2-withdrawals-20260603
```

---

## CONVERGENCE — Final review (after A4 + B3)

### Task C1: `code-review` diff on PR 379 changes

- [ ] **Step 1: Run code-review skill on PR 379 diff**

Invoke `code-review` skill (medium effort) on the diff from `main` to `feat/protocol-v3-fresh`. Focus on:
- `WithdrawalQueueV2.sol` pendingEther wiring correctness
- Test quality (no echo-input gotcha from advisor)
- Any CEI violations introduced

- [ ] **Step 2: Fix any blocking findings**

- [ ] **Step 3: Push final state**

```bash
git push origin feat/protocol-v3-fresh
```

### Task C2: Advisor Opus final sign-off

- [ ] **Step 1: Call advisor with full context**

Invoke the `advisor` tool with prompt context covering:
- The `pendingEther` wiring diff
- PR 380 audit findings and fixes
- All gate results

Ask advisor to confirm: (a) no CEI or reentrancy issues introduced, (b) `recoverEth` is still correct (pendingEther is obligation not held ETH), (c) any patterns from the 21-pattern checklist not yet applied.

- [ ] **Step 2: Fix any advisor findings**

- [ ] **Step 3: Final push and update PR descriptions**

```bash
git push origin feat/protocol-v3-fresh
gh pr comment 379 --body "pendingEther accounting wired and tested. Gates: lint✓ compile✓ 429+4 tests✓ invariants✓. Advisor Opus sign-off: clean."
gh pr comment 380 --body "Security audit complete (patterns #3 #7 #9 #16 #18 #20 #21). Findings: [list from B2]. Gates: 14 tests✓ lint✓."
```
