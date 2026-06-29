# X-Ray Audit Summary

Date: 2026-06-29

Scope: PR 379 modular staking contracts plus PR 380 `OldVeth2WithdrawalQueue`, frontend contract wiring, deploy handover, and Fizz fuzz coverage.

## Passes Run

| Pass | Command / source | Result |
|---|---|---|
| Pashov x-ray | contract inventory, entry-point map, invariants, git/security hygiene, docs alignment | Completed; artifacts in `x-ray/` |
| Solidity auditor | manual adversarial review plus Devin/Kimi delegate review | Concrete findings fixed; residual Slither findings triaged below |
| Dependency audit | `bun audit --level moderate`; `npm audit --audit-level=moderate` | Passed; staking npm audit has only known low-severity Hardhat/ethers transitive advisories |
| Type/build | `bun run type-check`; `bun run build` | Passed |
| Hardhat | `npx hardhat compile`; `npx hardhat test test/v2/modular-staking/*.spec.ts`; `npm run test:invariants` | Passed; modular-staking suite 383 passing / 15 pending; invariants 8 passing |
| Old-vETH2 focused tests | `npx hardhat test test/v2/modular-staking/oldVeth2WithdrawalQueue.spec.ts` | Passed; 21 passing |
| Coverage | `npx hardhat coverage` | Passed; 473 passing / 15 pending. Modular-staking: 86.49% statements / 59.92% branches. `OldVeth2WithdrawalQueue`: 97.56% statements / 67.54% branches |
| Fizz Foundry | `FOUNDRY_PROFILE=fuzz forge build`; `FOUNDRY_PROFILE=fuzz forge test --match-contract FoundryTester -vv` | Passed |
| Fizz Echidna | `FOUNDRY_PROFILE=fuzz echidna . --contract FuzzTester --config echidna.yaml --test-limit 200 --seq-len 25 --format text` | Passed 10 properties, 282 calls, 32,378 unique instructions, corpus size 9 |
| Fizz Medusa | `FOUNDRY_PROFILE=fuzz node /home/agents/.codex/skills/fizz/scripts/run_medusa.js . --meta-dir fizz_data --timeout 600` | Passed 53 tests/properties, 0 failed, about 501,988 calls before transaction limit |
| Slither | `FOUNDRY_PROFILE=fuzz slither . --exclude-dependencies --filter-paths 'node_modules|artifacts|cache|out|test|mocks|crytic-export' --json /tmp/pr380-slither-current.json` | Completed; 466 findings across legacy + V2, no unresolved PR380 critical/current-code issue |
| Mainnet-fork E2E | `MAINNET_RPC_URL=https://rpc.sharedtools.org/rpc bun run test:e2e:fork -- --fresh-fork --port 18546 --web-port 14174 --old-veth2-address 0x898bad2774eb97cf6b94605677f43b41871410b1 --old-veth2-redemption-rate 1000000000000000000 --old-veth2-source-address 0x610c92c70Eb55dFeAFe8970513D13771Da79f2e0` | Passed; fresh Anvil fork, deploy/sync drift check, fresh Vite server, 26 passed / 1 skipped. Old-vETH2 request/finalize/claim used the real mainnet vETH2 token holder |

## Concrete Fixes From This Pass

- `OldVeth2WithdrawalQueue._enqueueRequest` now checks the exact vETH2 custody balance delta after `safeTransferFrom`, rejecting fee-on-transfer or misconfigured token behavior before request accounting is written.
- Fizz now deploys and exercises `OldVeth2WithdrawalQueue`, with handlers for request, finalize, finalize-with-refund, cancel, claim, and refund withdrawal.
- Fizz properties now cover old-vETH2 finalized-claim ETH backing, pending-vETH2 custody backing, and claimed-plus-locked ETH bounded by finalized ETH.
- `deploy/015_governanceHandover.ts` now migrates `GUARDIAN` roles to the governance timelock and includes the old-vETH2 queue in handover dependencies.
- Frontend contract exports no longer duplicate `oldVeth2WithdrawalQueue`.
- Fork E2E now waits for async old-vETH2 queue state and impersonates the timelock guardian after production-style governance handover.

## Slither Triage

Latest captured result after fixes:

- Total findings: 466
- High: 8
- Medium: 48
- Low: 105
- Informational: 289
- Optimization: 16

PR380 old-vETH2 findings reviewed:

- `calls-loop` in `_enqueueRequest`: accepted. User batch requests intentionally loop over independent requested amounts; each transfer has an exact balance-delta check and all entry points are `nonReentrant`.
- `timestamp` in `finalize`: accepted. `minRequestAge` is an operational delay, not randomness or pricing.
- `costly-loop` in request/finalize/claim paths: accepted. Guardian finalization is bounded by `maxRequestsPerFinalize`; user batch request/claim paths are optional convenience flows.
- `naming-convention` for `VETH2`: informational only; immutable legacy token dependency is intentionally uppercase.

Inherited high/medium findings reviewed and not introduced by PR380:

- `WithdrawalQueue.requestRedeem` arbitrary ERC20 transfer: legacy delegated ERC-7540-style request flow, still allowance-gated. This pattern is intentionally not copied into old-vETH2 queue.
- `ReferralRegistry.recoverEth` arbitrary ETH send: GOV-only rescue path.
- `ValidatorModule._doBeaconDeposit` arbitrary ETH send: false positive; ETH goes to the immutable beacon deposit contract after withdrawal-credential checks.
- `Withdrawals._redeem` arbitrary ETH send: legacy path outside PR379/PR380 scope.
- `OperatorRegistry.pendingNftWithdrawals` uninitialized state: false positive; Solidity mappings are intentionally zero-initialized.
- Upgradeable storage-gap shadowing and NFT metadata encode-packed findings are legacy or non-PR379/380 surfaces.

## Residual Risk

- Slither still reports broad inherited legacy findings outside the PR379/PR380 scope; they remain tracked as legacy risk, not new regressions from this pass.
- Echidna and Medusa campaigns were bounded local audit runs. Longer overnight campaigns should reuse the committed Fizz harness/configs before mainnet activation.
- Mainnet-fork E2E validated deployment wiring, local address sync, frontend contract calls, and old-vETH2 production-token redemption flow, but not wallet-extension mode because no real extension credentials were provided.
