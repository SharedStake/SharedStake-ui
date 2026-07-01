# CLAUDE — delegate routing

<!-- delegate-skill:begin -->
## AI Delegation Routing

Route bounded tasks to the right AI delegate. Never call delegates directly —
always use the wrapper binaries (envelope, fallback, telemetry).

`devin-delegate` = general implement/review workhorse (browser/sandbox is a sub-capability).
`kimi-delegate` = cheap small read-only. `grok-delegate` = **dormant** (revival gate: ≥5
successful calls + a documented devin failure on a large repo).

| Task | Delegate | Quick command |
|------|----------|---------------|
| General implement / review / debug (workhorse) | `devin-delegate` | `devin-delegate --task "..."` |
| Browser / UI / screenshot / sandbox (a devin capability) | `devin-delegate` | `devin-delegate --task "..."` |
| Cheap **small read-only** research / review / summarize | `kimi-delegate` | `kimi-delegate --task "..."` |
| Local Codex write-mode impl | `/spark` | invoke `/spark` skill |
| Multi-file refactor / very large codebase (DORMANT) | `grok-delegate` | `grok-delegate --task "..."` |
| Unknown scope | `devin-delegate` (workhorse); if cheap+small, `kimi-delegate` | — |

**Auth errors exit 126** — do not auto-retry; print resume steps. Canonical routing table
+ fallback/auth/latency notes: `~/.claude/skills/delegate-skill/SKILL.md`.
<!-- delegate-skill:end -->
