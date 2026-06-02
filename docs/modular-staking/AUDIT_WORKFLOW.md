# Modular Staking Audit Workflow

Use this workflow for PR 379 and any follow-up work touching `staking-contracts/` or modular staking UI integrations.

## Layout Checks

Run from the repository root:

```bash
git ls-files --stage | awk '$1 == "160000" { print }'
git ls-files '*.sol' | grep -v '^staking-contracts/'
git ls-files '*.sol' | xargs sha256sum | sort | awk 'BEGIN{last=""; files=""; count=0} {hash=$1; file=$2; if (hash==last) {files=files "\n" file; count++} else {if (count>0) print last files "\n"; last=hash; files=file; count=0}} END{if (count>0) print last files}'
rg -n '^(<<<<<<<|=======|>>>>>>>)' -g '!node_modules' -g '!staking-contracts/artifacts' -g '!staking-contracts/cache' -g '!dist'
```

Expected result: no gitlinks, no Solidity outside `staking-contracts/`, no exact duplicate Solidity sources, and no conflict markers.

## Required Gates

```bash
bun audit --level moderate
bun run type-check
bun run build
cd staking-contracts
npm ci --legacy-peer-deps
npm audit --audit-level=moderate
npm run lint:sol
npx hardhat compile
npx hardhat test test/v2/modular-staking/*.spec.ts
npm run test:invariants
```

## Optional Static Analysis

If Slither is available:

```bash
cd staking-contracts
slither . --exclude-dependencies --filter-paths 'node_modules|artifacts|cache|test'
```

If Slither is not available, do not treat that as a pass. Record it as unavailable tooling and rely on Hardhat, Foundry, dependency audit, and manual x-ray review for the current pass.

## Iteration Rule

Fix concrete findings only. After each fix, rerun the smallest failing gate first, then the full required gates before the branch is considered complete.
