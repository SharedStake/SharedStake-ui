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

## Pi Kimi Subagent Recommendation

- Keep Codex as orchestrator for the critical path (plan, integration, final review).
- Delegate independent side tasks to `pi-kimi-subagent` (exploration, checks, scoped drafting).
- Use defaults from Takopi config: `pi.provider="kimi-coding"` and `pi.model="k2p6"`.
- If `pi-kimi-subagent` fails (auth/provider/runtime), fall back immediately to built-in `explorer`/`worker`.
- Run `./scripts/pi-kimi-subagent-smoke.sh` after toolchain upgrades to confirm coding-task path still works.
