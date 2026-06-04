# Agent Instructions

<!-- token-reduce:begin -->
## Token-Reduce Routing

- If file location is unknown, your first discovery command MUST be `./skills/token-reduce/scripts/token-reduce-paths.sh topic words`.
- Use the user’s literal nouns from the prompt in that first query (feature name, file stem, hook name, symbol).
- Use `./skills/token-reduce/scripts/token-reduce-snippet.sh topic words` only if one ranked excerpt is needed after the path list.
- Do not start repo discovery with `find .`, `ls -R`, `grep -R`, `rg --files .`, or broad `Glob` patterns.
- Use scoped `rg -g` and targeted reads only after helper output.
<!-- token-reduce:end -->

<!-- SHARED_ATTRIBUTION_RULES_START -->
## Shared Attribution Rules

- Commit author should be the active agent model identity.
- Commit trailer must include: `Co-authored-by: Chimera <chimera_defi@protonmail.com>`.
- PR description must include:
  - `**Agent:** <actual model name>`
  - `**Co-authored-by:** Chimera <chimera_defi@protonmail.com>`
- Never use placeholder model names; record the actual model used.
<!-- SHARED_ATTRIBUTION_RULES_END -->

<!-- kimi-delegate:begin -->
## Kimi Delegate Routing — MANDATORY

All Kimi subagent calls MUST route through the skill wrapper. Direct `pi --provider kimi-coding` calls are **prohibited** — they bypass telemetry, fallback, auth detection, and timeout scaling.

- **One-liner:** `kimi-delegate --task "..."`
- **Interactive:** `kimi-delegate --interactive`
- **Long path (fallback):** `./skills/kimi-delegate/scripts/delegate.py --task "..."`

**Why this matters:**
- Structured envelopes prevent vague handoffs
- Auto-scaling timeouts prevent hangs on large repos
- Auth error detection gives explicit resume steps instead of silent failures
- Codex fallback ensures tasks always complete
- Telemetry enables continuous improvement

**Bypassing the wrapper will be detected and reported.**

- Always produce an envelope first with `./skills/kimi-delegate/scripts/plan_prompt.py --task "..."`.
- Keep delegation scoped and include acceptance criteria.
- If Kimi fails, keep fallback enabled and inspect telemetry (`./skills/kimi-delegate/scripts/kimi_delegate_telemetry.py summary --days 14`).
<!-- kimi-delegate:end -->

<!-- devin-delegate:begin -->
## Devin Delegate Routing — MANDATORY

All Devin calls MUST route through the skill wrapper. Direct `devin --print` and `devin --task` calls are **prohibited** — they bypass envelope checks, fallback routing, clarification handling, and telemetry.

- **One-liner:** `devin-delegate --task "..."`
- **Interactive:** `devin-delegate --interactive`
- **Long path (fallback):** `./skills/devin-delegate/scripts/delegate.py --task "..."`

**Why this matters:**
- Structured envelopes prevent vague handoffs
- Codex then Claude guidance resolves many clarification loops before human escalation
- Provider fallback keeps execution moving when Devin fails
- Telemetry enables continuous improvement

**Bypassing the wrapper will be detected and reported.**

- Always produce an envelope first with `./skills/devin-delegate/scripts/plan_prompt.py --task "..."`.
- Keep delegation scoped and include acceptance criteria.
- If Devin asks for clarification, use Codex guidance first and Claude second before asking a human.
- Inspect telemetry regularly (`./skills/devin-delegate/scripts/devin_delegate_telemetry.py summary --days 14`).
<!-- devin-delegate:end -->

<!-- sharedstake-pr379-workflow:begin -->
## SharedStake PR 379 / V2 Workflow

For PR 379 and related V2 modular-staking work, keep Claude and Codex aligned with `CLAUDE.md`:

- Treat `origin/feat/protocol-v3-fresh` as the PR 379 target branch unless the user says otherwise.
- Before changing code, fetch the PR branch, confirm the current branch/head, and check for a clean worktree.
- If repo-local token-reduce helpers are missing or unreadable, use the installed fallback at `/home/agents/workspace/token-reduce-skill/scripts/` and state the fallback briefly.
- Use x-ray for Solidity audit loops: inventory contracts, classify entry points and roles, derive invariants, check duplicate sources/gitlinks/conflict markers, run static analysis, then do manual adversarial review.
- For smart-contract review passes, keep Pashov Audit Group skills available from `https://github.com/pashov/skills` through repo-local links in `skills/`: run x-ray, `solidity-auditor`, and `fizz` together when the work touches protocol contracts or fuzz/invariant coverage.
- Run `fizz` against `staking-contracts/` in automatic mode for fuzz-suite setup. Required local tools are Foundry `forge`, Medusa, and Echidna; if any are missing, install them or record the tool gap before claiming fuzzing coverage.
- For withdrawal/redeem queues, treat claim ownership as a hard invariant: asset owner and request controller must not diverge, and operators may initiate only without reassigning claim ownership.
- Recovery functions must subtract every reserved balance, including locked claims, pending refunds, and pending escrowed tokens/shares, before sending assets to governance or arbitrary recipients.
- Use Devin and Kimi only through their delegate wrappers, with an envelope first, scoped tasks, acceptance criteria, and concrete output requirements.
- Fix only concrete bugs, vulnerabilities, broken gates, stale docs, duplicate/dead code, or low-risk coverage gaps. Do not broaden PR 379 into speculative redesign.
- After each fix, rerun the narrow relevant tests first, then the broader gates needed for confidence.
- Fork E2E must use a fresh Vite/Playwright server with a free `--web-port`; stale reused Vite servers can serve old bundled `local.json` contract addresses and make fork validation meaningless.
- Fork E2E deploys must set Hardhat `LOCALHOST_RPC_URL` to the same `http://<host>:<port>` that Playwright uses; otherwise `--port 8546` can deploy to Hardhat's default `8545` while the browser tests `8546`.
- V2 Playwright suites should preflight `eth_getCode` for required local contract addresses; a zero-code address is a stale-address or wrong-RPC failure, not a valid UI pass.
- V2 deploy/wiring scripts must wait for state-changing transaction receipts before dependent reads or verification; an `ethers` `TransactionResponse` alone can race on Anvil mainnet forks.
- Router module code-hash allowlists must use the same hash the Router enforces. For UUPS modules, read `implementationCodeHash()` from the module instead of hashing proxy runtime bytecode.
- Governance handover scripts must revoke bootstrap/direct bypass roles, such as `StakingCore.ORACLE`, before revoking the signer's admin role.
- Standard PR 379 gates:
  - `bun audit --level moderate`
  - `bun run type-check`
  - `bun run build`
  - `cd staking-contracts && npm audit --audit-level=moderate`
  - `cd staking-contracts && npm run lint:sol`
  - `cd staking-contracts && npx hardhat compile`
  - `cd staking-contracts && npx hardhat test test/v2/modular-staking/*.spec.ts`
  - `cd staking-contracts && npm run test:invariants`
  - Slither when available; if unavailable, record it as residual tooling risk.
- Push completed changes back to PR 379 and verify remote `CI` and `Contract Audit` before claiming completion.
<!-- sharedstake-pr379-workflow:end -->

<!-- sharedstake-legacy-veth2:begin -->
## SharedStake Legacy vEth2 Withdrawal Work

- For separate legacy-vEth2 work derived from PR 379, branch from the latest PR 379 head but open a separate PR, normally stacked on `feat/protocol-v3-fresh`.
- Do not reuse `RedemptionsBase` / `Withdrawals` for new old-vEth2 redemption work; the legacy cancellation path used `transferFrom(address(this), user, amount)` and is not a safe pattern to copy.
- Preserve old-vEth2 semantics through an explicit redemption rate, but use the V2 request/finalize/claim lifecycle with strict request-ID FIFO finalization, pull refunds, and locked-asset recovery guards. Legacy old-vEth2 queues should be owner-only: `msg.sender` owns requests, and cancel/claim proceeds return to `msg.sender`; do not add delegated owner or arbitrary recipient redirection unless governance explicitly asks for it.
- Do not assume the legacy `vEth2` minter can be moved to a new queue. Escrow old vEth2 unless governance explicitly designs a burn/retirement step.
- Non-local old-vEth2 queue deployment must require an explicit legacy token address and 1e18-scaled redemption rate; local deploys may use a mock token fallback.
<!-- sharedstake-legacy-veth2:end -->

<!-- gbrain-workflow:begin -->
## Central Agent Memory (gBrain) — MANDATORY

- Central root: `/home/agents/agent-memory`
- Writer namespace: `agents/claude/`
- Durable private memory → `agents/claude/private/`; shareable facts → `agents/claude/public/`
- Do NOT read other agents private sources without explicit human instruction.
- Never store plaintext secrets; use pointers to secret managers only.
- Retrieval: search first, then cite as `brain:agent-claude-private:<slug>`.
- Sync after any session that changes durable facts: run the `gstack-sync-gbrain` skill.
<!-- gbrain-workflow:end -->

<!-- context-save-restore:begin -->
## Context Save / Restore

- Before ending a long-running work session, run `/context-save` so the next session can resume without context loss.
- At the start of a new session on in-progress work, run `/context-restore` first.
- Pair with `gstack-sync-gbrain` so both gBrain and local memory stay aligned.
<!-- context-save-restore:end -->
