# SharedStake V2 Modular Staking Threat Model

Status: working threat model for clean PR planning

## 1. Assets At Risk

- Buffered ETH in staking entry contracts/modules.
- Beacon-side accounting reflected through oracle reports.
- Share ownership in `StToken`.
- Finalized but unclaimed ETH in `WithdrawalQueueV2`.

## 2. Threat Scenarios

| ID | Scenario | Impact | Existing controls | Residual risk / follow-up |
|---|---|---|---|---|
| T1 | Oracle overstates beacon balance | Dilutive over-mint and incorrect rebase | Adapter sanity checks (`maxDeltaBps`, staleness/slash bounds) | Tighten launch bounds and monitor outliers |
| T2 | Oracle submitter compromise | Report manipulation attempts | `SUBMITTER` role gating; optional quorum adapter | Prefer quorum for production if ops maturity allows |
| T3 | Role misconfiguration (`MINTER`) | Arbitrary mint/burn possibility | AccessControl and explicit role assignment | Add deployment checklist and role diff audit scripts |
| T4 | Guardian unavailable during stress | Exit finalization delays | GOV fallback and configurable queue params | Incident runbook and backup guardian ops needed |
| T5 | Bunker params too permissive/strict | Unfair finalization or stalled exits | `setBunkerMaxRequestsPerFinalize`, `setBunkerMinRequestAge` | Simulate crisis modes before launch |
| T6 | Module cap mis-sizing | Concentration or blocked growth | Per-module mint caps + global cap | Tune caps from telemetry, not static guesswork |
| T7 | Inflow limiter misconfiguration | Burst risk or false throttling | Router inflow windows and limits | Load-test expected traffic envelopes |
| T8 | LST oracle stale/manipulated | Incorrect minting in `LSTWrapModule` | Max oracle age checks + dedicated oracle contract | Add oracle redundancy and on-call monitoring |
| T9 | Share conversion rounding abuse attempts | Micro extraction over repeated actions | Floor rounding in share/ETH conversions | Quantify long-horizon dust accumulation |
| T10 | Queue claim replay or unauthorized claim | Double-claim or theft attempt | finalized/claimed checks + owner checks | Keep adversarial tests and reentrancy tests up to date |
| T11 | Beacon principal miscounted as rewards | Artificial reward inflation | `notifyBeaconDeposit` baseline flows | Add operational safeguards around deposit/report ordering |
| T12 | Governance key compromise | Broad config abuse | Multisig/timelock architecture expected | Define key rotation and emergency governance controls |

## 3. Security Priorities Before Mainnet

1. Lock role assignment model and publish role matrix with signers.
2. Finalize oracle topology and explicitly document submitter quorum operations.
3. Run stress/fuzz/adversarial suites with launch-like parameters.
4. Execute a formal incident rehearsal for pause, bunker mode, and queue finalization.
