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
./scripts/run-forge.sh test --match-path test/foundry/DebtPoolFuzz.t.sol
./scripts/run-forge.sh test --match-path test/foundry/MigrationHelperFuzz.t.sol
```

`npm run setup:foundry` wraps `mm-foundryup` with retries. Use the wrapper in
CI and local audit runs so transient GitHub release download failures do not
obscure contract test results.

## Mainnet Fork E2E

Any production recommendation that depends on deployment ordering, local address
sync, wallet transactions, old-vETH2 redemption, or frontend contract wiring must
be tested against a local mainnet fork before it is treated as production-ready.
Use a real mainnet RPC and force a fresh Anvil process so an existing localhost
chain cannot be mistaken for a fork:

```bash
MAINNET_RPC_URL=https://... bun run test:e2e:fork -- --fresh-fork --port 8546 --web-port 4174
```

Alchemy can be provided as a key instead of a full URL:

```bash
ALCHEMY_KEY=... bun run test:e2e:fork -- --fresh-fork --port 8546 --web-port 4174
```

For old-vETH2 production-token validation, pass the legacy token address, the
1e18-scaled redemption rate, and an impersonated source holder with enough
legacy vETH2 on the fork. Without these flags, the localhost deploy path uses
the local `OldVeth2Mock` and validates only the queue/UI lifecycle:

```bash
MAINNET_RPC_URL=https://... bun run test:e2e:fork -- --fresh-fork --port 8546 --web-port 4174 \
  --old-veth2-address 0x898bAD2774EB97cF6B94605677F43b41871410B1 \
  --old-veth2-redemption-rate 1000000000000000000 \
  --old-veth2-source-address 0x...
```

Wallet-extension E2E requires `PW_WALLET_EXTENSION_PATH`,
`PW_WALLET_EXTENSION_ID`, and `PW_WALLET_TEST_ADDRESS`, then:

```bash
MAINNET_RPC_URL=https://... bun run test:e2e:fork:wallet -- --fresh-fork --port 8546
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

## Static Analysis

Slither is required for local completion of modular staking contract work. CI
keeps the Slither step `continue-on-error` so analyzer output is preserved, but
local review must inspect the report and classify any actionable findings.

```bash
cd staking-contracts
python3 -m venv /tmp/slither-venv
/tmp/slither-venv/bin/python -m pip install --upgrade pip
/tmp/slither-venv/bin/python -m pip install slither-analyzer
PATH="$PWD/node_modules/.bin:$HOME/.local/bin:$HOME/.foundry/bin:$PATH" \
FOUNDRY_PROFILE=fuzz \
  /tmp/slither-venv/bin/python -m slither . \
  --exclude-dependencies \
  --filter-paths 'node_modules|artifacts|cache|out|test|mocks' \
  > /tmp/sharedstake-slither-latest.log 2>&1 || true
```

If Slither cannot be installed or run, do not treat that as a pass. Record it as
unavailable tooling or a blocker, then rely on Hardhat, Foundry, dependency
audit, and manual x-ray review only as a residual-risk fallback for the current
pass.

## Pashov Skill Stack

Keep the Pashov Audit Group skills from `https://github.com/pashov/skills`
available through the repo-local `skills/` links:

```bash
python3 /home/agents/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py --repo pashov/skills --path fizz solidity-auditor
python3 /home/agents/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py --repo pashov/skills --path x-ray --name pashov-x-ray
```

Run the three smart-contract review passes together for protocol changes:

```bash
# x-ray / audit readiness
# Use the installed x-ray methodology and, when needed, the pashov-x-ray scripts.

# multi-agent Solidity review
# Use solidity-auditor against staking-contracts/ or narrowed changed files.

# fuzz-suite setup
cd staking-contracts
PATH="$HOME/.local/bin:$HOME/.foundry/bin:$PATH" forge --version
PATH="$HOME/.local/bin:$HOME/.foundry/bin:$PATH" medusa --version
PATH="$HOME/.local/bin:$HOME/.foundry/bin:$PATH" echidna --version
PATH="$HOME/.local/bin:$HOME/.foundry/bin:$PATH" FOUNDRY_PROFILE=fuzz forge build
PATH="$HOME/.local/bin:$HOME/.foundry/bin:$PATH" FOUNDRY_PROFILE=fuzz forge test --match-contract FoundryTester -vv
PATH="$HOME/.local/bin:$HOME/.foundry/bin:$PATH" FOUNDRY_PROFILE=fuzz echidna . --contract FuzzTester --config echidna.yaml --test-limit 5 --seq-len 5 --format text
PATH="$HOME/.local/bin:$HOME/.foundry/bin:$PATH" FOUNDRY_PROFILE=fuzz medusa fuzz --config medusa.json --timeout 60 --test-limit 200 --seq-len 25
```

`fizz` expects Foundry, Medusa, and Echidna before generating or running the
suite. Generated fuzz harnesses should stay in `staking-contracts/test/fizz/`;
runtime metadata should stay in `staking-contracts/fizz_data/`.

For PR 379, embedded Echidna/Medusa Slither pre-passes are disabled so fuzz
campaigns start promptly; run Slither as a separate explicit gate and record
triage in `staking-contracts/x-ray/x-ray.md`.

## Iteration Rule

Fix concrete findings only. After each fix, rerun the smallest failing gate first, then the full required gates before the branch is considered complete.
