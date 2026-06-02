# Claude Agent Instructions

Follow `AGENTS.md` first. This file exists to keep Claude and Codex on the same workflow for SharedStake PR work.

## Mandatory Routing

- Use the repo-local token-reduce helper first when it exists and file location is unknown.
- Use Kimi only through `kimi-delegate` after generating an envelope with the Kimi plan prompt.
- Use Devin only through `devin-delegate` after generating an envelope with the Devin plan prompt.
- Do not call direct provider CLIs for Kimi or Devin.
- Keep delegation scoped, with acceptance criteria and concrete output requirements.

## Attribution

- Commits must use the active agent model identity as author.
- Commit trailers must include `Co-authored-by: Chimera <chimera_defi@protonmail.com>`.
- PR descriptions must include the actual agent model and the Chimera co-author line.

## Skill Routing

- Smart contract audit, xray, or repeated security passes: use the x-ray smart contract audit methodology, then CSO/security review, then targeted local tests.
- PR review before landing: use the review workflow and focus findings on bugs, regressions, security issues, and missing tests.
- Documentation release/alignment: update docs only where they describe behavior, commands, or workflow that actually changed.

## Contract Audit Loop

For PR 379 and related modular-staking work:

1. Fetch the latest PR branch and confirm a clean worktree.
2. Confirm contracts are local under `staking-contracts/`; check for gitlinks, duplicate Solidity sources, stale submodule docs, and conflict markers.
3. Run dependency and static gates:
   - `bun audit --level moderate`
   - `cd staking-contracts && npm audit --audit-level=moderate`
   - `cd staking-contracts && npm run lint:sol`
4. Run build/test gates:
   - `bun run type-check`
   - `bun run build`
   - `cd staking-contracts && npx hardhat compile`
   - `cd staking-contracts && npx hardhat test test/v2/modular-staking/*.spec.ts`
   - `cd staking-contracts && npm run test:invariants`
5. If Slither is available, run it against `staking-contracts`; if unavailable, record that as residual tooling risk.
6. Fix only concrete bugs, vulnerabilities, broken gates, stale docs, or duplicate/dead code. Rerun the relevant gates after every fix.
7. Repeat until no new actionable bugs or security vulnerabilities are found.
