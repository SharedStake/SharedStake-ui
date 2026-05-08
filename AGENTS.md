# Agent Instructions

<!-- kimi-delegate:begin -->
## Kimi Delegate Routing

- **For bounded side tasks (search/summarize/draft/review), use the skill wrapper.**
  - `./skills/kimi-delegate/scripts/delegate.py --task "..."`
  - Or, if `setup.sh` has been run: `kimi-delegate --task "..."`
- **Always produce an envelope first** with `./skills/kimi-delegate/scripts/plan_prompt.py --task "..."`.
- **Direct `pi --provider kimi-coding` calls bypass telemetry and fallback.** Route through the skill so savings, quality, and fallback behavior are tracked.
- Keep delegation scoped and include acceptance criteria.
- If Kimi fails, keep fallback enabled and inspect telemetry (`./skills/kimi-delegate/scripts/kimi_delegate_telemetry.py summary --days 14`).
<!-- kimi-delegate:end -->
