# Agent Instructions

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

## Session Meta Defaults — MANDATORY

These defaults apply to all non-trivial work in this repo.

1. Goal-first execution:
- Start each work block with one explicit goal statement.
- Keep one critical-path goal local and delegate independent side tasks.

2. Subagent-first delegation:
- Default to using subagents for bounded analysis/implementation tasks.
- Use `kimi-delegate` for cheap iterative tasks and review passes.
- Use `devin-delegate` for heavier execution or long-running tasks.
- If delegation fails, continue locally and record failure + fallback in handoff notes.

3. Multipass verification after each meaningful code slice:
- Pass 1: targeted tests for changed areas.
- Pass 2: broader suite for affected subsystem.
- Pass 3: security/static analysis or adversarial review (tool-based + manual triage).
- Log commands + outcomes in `docs/modular-staking/handoff.md`.

4. PR de-bloat and anti-slop discipline:
- Remove dead/redundant code introduced during the session.
- Avoid generated/noisy artifact churn unless explicitly required.
- Prefer fewer, higher-signal files and concise diffs.
- Run a dedicated cleanup/review pass before declaring a slice complete.

5. Production quality bar:
- No stubs, placeholders, TODO scaffolding, or half-wired paths in landed work.
- Any deferred item must be explicitly marked as risk-accepted with owner + next action in handoff docs.
- If code is not production-ready, do not present it as complete.

6. Resumability logging:
- Append a session entry to `docs/modular-staking/handoff.md` as work progresses.
- Include: goal, delegated tasks, tests/audits run, decisions, open risks, and next actions.
- Ensure another agent can resume without re-triaging context.
