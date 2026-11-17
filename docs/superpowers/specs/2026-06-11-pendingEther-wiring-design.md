# pendingEther Wiring — WithdrawalQueueV2

**Date:** 2026-06-11  
**Branch:** feat/protocol-v3-fresh (PR 379)  
**Status:** Approved for implementation

## Context

`pendingEther` was added as a state variable in `WithdrawalQueueV2.sol` (4-line diff, uncommitted). The variable declaration is:

```solidity
// ETH committed to requested-but-not-yet-finalized requests. Together with
// lockedEther this is the total ETH owed to unclaimed withdrawals.
uint256 public pendingEther;
```

The variable is **not yet wired** — it is declared but never mutated.

## Goal

Complete the accounting so that:
- `pendingEther` = ETH obligated to all requested-but-not-yet-finalized withdrawal requests
- `lockedEther` = ETH held for finalized-but-unclaimed requests
- `pendingEther + lockedEther` = total ETH owed across all outstanding requests

## Architecture

### Wiring points (3 touch points in contract)

**1. `_enqueueRequest` — increment**  
After `ethValue` is computed (line 144) and before emitting the event, add:
```solidity
pendingEther += ethValue;
```

**2. `finalize` — decrement**  
After `lockedEther += totalEthRequired` (line 203), add:
```solidity
pendingEther -= totalEthRequired;
```

**3. `recoverEth` — no change needed**  
`pendingEther` is an obligation, not held ETH. The ETH only arrives during `finalize()`.  
`availableEther()` view also unchanged for the same reason.

### Test assertions to add (withdrawalQueueV2.spec.ts)

- After `requestWithdrawals([amount], owner)`: `pendingEther == amount`
- After `finalize(lastId)`: `pendingEther == 0`, `lockedEther == amount`
- After `claimWithdrawal`: `pendingEther == 0`, `lockedEther == 0`
- Multi-request batch: `pendingEther` tracks sum correctly across partial finalization

## Workflow

1. **Advisor** — validate exact wiring spec above, catch any edge cases
2. **Devin** — implement contract + test changes, run all 4 gates:
   - `lint:sol`
   - `npx hardhat compile`
   - `npx hardhat test test/v2/modular-staking/withdrawalQueueV2.spec.ts`
   - `npm run test:invariants`
3. **code-review skill** — diff review after Devin lands
4. **advisor** — final security sign-off (Opus pass)

## PR 380 scope (OldVeth2WithdrawalQueue)

- Full x-ray / CSO security audit of `OldVeth2WithdrawalQueue.sol` using the 21-pattern checklist from memory
- Fix any findings
- Run PR 380's gate suite: `oldVeth2WithdrawalQueue.spec.ts` (14 tests)
- `lint:sol` and `compile` on the codex branch

## Execution order (parallel where possible)

| Stream | Work | Tool |
|--------|------|------|
| A | Advisor spec → Devin: wire pendingEther + tests + gates | devin-delegate |
| B | x-ray security audit of OldVeth2WithdrawalQueue (PR 380) | cso + security-review |
| C (after A+B) | code-review diff, advisor Opus final sign-off | code-review + advisor |
