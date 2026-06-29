# X-Ray Audit Summary

Date: 2026-06-29

Scope: PR 379 modular staking contracts, Fizz fuzz harness, and Pashov smart-contract review workflow.

## Passes Run

| Pass | Command / source | Result |
|---|---|---|
| Pashov x-ray | manual inventory, entry-point map, invariants, git/security hygiene | Completed; artifacts in `x-ray/` |
| Solidity auditor | manual adversarial review plus Devin/Kimi/Nash delegate review | Concrete findings fixed; residual Slither false positives documented |
| Fizz Foundry | `FOUNDRY_PROFILE=fuzz forge build` and `forge test --match-contract FoundryTester -vv` | Passed |
| Echidna | `FOUNDRY_PROFILE=fuzz echidna . --contract FuzzTester --config echidna.yaml --test-limit 5 --seq-len 5 --format text` | Passed 7 properties, 24 calls, 13,266 unique instructions |
| Medusa | `FOUNDRY_PROFILE=fuzz medusa fuzz --config medusa.json --timeout 60 --test-limit 200 --seq-len 25` | Passed 42 tests, 0 failed |
| Slither | `slither . --exclude-dependencies --filter-paths 'node_modules|artifacts|cache|out|test|mocks'` | Completed; 461 findings across legacy + V2, no unresolved PR-379 critical fix left |

## Concrete Fixes From This Pass

- `DebtPool.receiveStETHAndUnwrap` is now nonReentrant, uses typed `IWstETH.wrap`, checks the allowance-reset result on wrap failure, and avoids stale balance-diff accounting.
- Removed unused DebtPool internal dead code and added real `StToken`/`WstToken` tests for `receiveStETHAndUnwrap` plus the fee-controller role gate.
- Root and staking dependency overrides were refreshed so `bun audit --level moderate` and `npm audit --audit-level=moderate` pass without taking the breaking Hardhat/upgrades migration path.
- Fizz insolvency property was corrected: zero pooled ETH with shares is allowed only after a recorded insolvency, and deposits must remain blocked in that state.
- Fizz handlers now exercise validator gains, validator loss/exit reports, batch withdrawals, overfunded finalization refunds, refund withdrawal, batch claims, and module codehash enforcement.
- Medusa and Echidna configs now run in property mode with sufficient target balance and standalone Slither instead of embedded Slither pre-passes.

## Slither Triage

Latest captured result after fixes:

- Total findings: 461
- High: 8
- Medium: 50
- Low: 105
- Informational: 282
- Optimization: 16

PR-379-relevant high/medium modular-staking items reviewed:

- `ReferralRegistry.recoverEth` arbitrary ETH send: GOV-only recovery function. Accepted as an administrative rescue path.
- `ValidatorModule._doBeaconDeposit` arbitrary ETH send: false positive; ETH goes to immutable configured beacon deposit contract after code-length and withdrawal-credential checks.
- `OperatorRegistry.pendingNftWithdrawals` uninitialized state: false positive; Solidity mappings are intentionally zero-initialized and populated during `exitBond`.
- `OperatorRegistry.slash` reentrancy-no-eth: function is already `nonReentrant`; token is configured governance asset. No state corruption path found in this pass.
- `StakingCore` tuple local uninitialized/unused-return findings: false positives caused by `try/catch` tuple assignment; failed external calls return early.
- `FeeController` and fee-share divide-before-multiply findings: expected fixed-point split rounding; covered by direct tests and fuzz properties.
- `StakingCore` locked-ether: accepted design for direct staking custody in the legacy core path. Router/module path remains the V2 preferred flow.

PR-379-relevant low/informational DebtPool items reviewed:

- `DebtPool.receiveStETHAndUnwrap` reentrancy-benign: function is `nonReentrant`; preserving wrap-failure telemetry requires state accounting after successful external wrap. Covered by real-token unwrap tests.
- `DebtPool.withdrawUnclaimedFees` timestamp: intentional 30-day minimum claim-period gate.
- DebtPool naming/missing-interface inheritance warnings: informational hygiene; no behavioral issue found in this pass.

## Residual Risk

- Full Slither still reports broad legacy findings outside PR 379 scope. They are not introduced by this pass.
- Fizz currently uses `via_ir` because the repo's mixed legacy contracts hit stack-depth limits without it. Coverage percentages should be treated as IR-deflated; branch/path review matters more than raw coverage.
- Short Echidna/Medusa runs are smoke gates. Longer overnight campaigns should reuse the committed harness/configs.
