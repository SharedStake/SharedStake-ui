# SharedStake V2 Modular Staking Execution Plan

Status: active
Branch: `feat/sharedstake-v2-modular-staking-master`
Delivery: one master PR

## 1. Goal

Deliver a clean, router-first V2 modular staking implementation path with rigorous documentation, test evidence, and a handoff-ready trail, while retaining the full old-PR system intent.

## 2. Phase Plan

### Phase A: Docs-first architecture lock (current)
- Define canonical architecture and non-goals.
- Publish diagrams and threat model.
- Capture decisions that gate code work.
- Lock one-master-PR plan and inclusion map.

Exit criteria:
- Docs in `docs/modular-staking/` reviewed and accepted.

### Phase B: Clean code-port plan from PR #376
- Build explicit keep/drop map from old PR.
- Preserve full signal across contracts, frontend, ops, harness, and docs layers.
- Split work into reviewable chunks.

Exit criteria:
- Port map approved and staged by subsystem.

### Phase C: Implementation and verification
- Apply code changes in small batches.
- Run targeted test suites and build checks.
- Record failing/known gaps explicitly.

Exit criteria:
- All in-scope tests pass or open failures are documented with owners.

### Phase D: PR packaging
- Write concise PR narrative with risk notes.
- Include validation evidence and unresolved items.
- Prepare reviewer guide.

Exit criteria:
- Clean PR ready for human review.

## 3. Subagent Work Pattern

Use `pi-kimi-subagent` for side tasks only:
- File classification and draft mapping
- Drafting summaries/checklists
- Non-blocking analysis

Keep local orchestrator ownership for:
- Final architecture decisions
- Code edits and conflict resolution
- Final test runs and integration decisions

Fallback rule:
- If Kimi fails (auth/runtime), immediately continue using built-in local analysis.

## 4. Immediate Next Steps

1. Start track-by-track checklist from `pr376-keep-drop-matrix.md` and `master-pr-plan.md`.
2. Execute Track A (core product signal) first.
3. Complete naming normalization (`StEthPriceOracle` and remaining legacy lido-parity labels).
