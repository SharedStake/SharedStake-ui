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
npm run setup:foundry
npm run test:invariants
```

## Mainnet Fork E2E

Use a real mainnet RPC and force a fresh Anvil process so an existing localhost
chain cannot be mistaken for a fork:

```bash
MAINNET_RPC_URL=https://... bun run test:e2e:fork -- --fresh-fork --port 8546 --web-port 4174
```

Alchemy can be provided as a key instead of a full URL:

```bash
ALCHEMY_KEY=... bun run test:e2e:fork -- --fresh-fork --port 8546 --web-port 4174
```

`--skip-deploy` is acceptable only as a local harness smoke against an already
running node. Do not record it as mainnet-fork production validation unless that
node is known to be an Anvil mainnet fork.

The fork runner forces a fresh Vite/Playwright web server so bundled contract
addresses match the just-synced `local.json`. Use `--web-port` when a long-lived
local Vite process already occupies the default Playwright port.

When `--port` is not `8545`, the runner exports `LOCALHOST_RPC_URL` for Hardhat
deploys so contracts are deployed to the same fork RPC that Playwright uses.

The V2 Playwright suites also preflight `eth_getCode` for the required local
contracts before opening the app. A failure such as `No contract code at local
stakingRouter address ...` means the browser is pointed at a different RPC than
the deploy step, `local.json` is stale, or an old Vite server is serving a stale
bundle. Rerun with `--fresh-fork`, a free `--port`, and a free `--web-port`.

## Optional Static Analysis

If Slither is available:

```bash
cd staking-contracts
slither . --exclude-dependencies --filter-paths 'node_modules|artifacts|cache|test'
```

If Slither is not available, do not treat that as a pass. Record it as unavailable tooling and rely on Hardhat, Foundry, dependency audit, and manual x-ray review for the current pass.

## Iteration Rule

Fix concrete findings only. After each fix, rerun the smallest failing gate first, then the full required gates before the branch is considered complete.
