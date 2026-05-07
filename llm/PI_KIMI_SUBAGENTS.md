# Pi Kimi Subagent How-To

This repo uses `pi-kimi-subagent` as the recommended side-task delegate while Codex remains the orchestrator.

## Recommendation

- Keep critical-path work local in Codex: final plan, cross-file integration, and final validation.
- Offload independent side work to `pi-kimi-subagent`: exploration, non-blocking checks, and scoped drafting.
- Use Takopi defaults unless intentionally testing alternatives: `pi.provider="kimi-coding"` and `pi.model="k2p6"`.
- If `pi-kimi-subagent` fails (auth/provider/runtime), fall back to built-in Codex `explorer`/`worker` immediately.

## Basic Usage

```bash
pi-kimi-subagent "Summarize src/router/index.js and list risky assumptions."
```

Optional overrides:

```bash
PI_KIMI_PROVIDER=kimi-coding PI_KIMI_MODEL=k2p6 PI_KIMI_TIMEOUT=180s \
  pi-kimi-subagent "Inspect src/stores and list all network calls."
```

If authentication fails:

```bash
kimi login
```

## End-to-End Coding Smoke Test

Run:

```bash
./scripts/pi-kimi-subagent-smoke.sh
```

The smoke test validates that `pi-kimi-subagent` can execute a coding-style task by reading a file, writing a new file, and returning a deterministic completion token.
