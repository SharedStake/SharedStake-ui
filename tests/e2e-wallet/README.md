# Wallet E2E Runbook

This suite validates the extension wallet connection path using Playwright persistent contexts.

## 1) Prerequisites

- Chromium-compatible wallet extension unpacked on disk.
- Extension id and local test address.
- Optional local fork RPC for wallet impersonation flow.

## 2) Environment

Use `.env.e2e.wallet.example` as the base:

```bash
cp .env.e2e.wallet.example .env.e2e.wallet
set -a; source .env.e2e.wallet; set +a
```

Required variables:

- `PW_WALLET_EXTENSION_PATH`
- `PW_WALLET_EXTENSION_ID`
- `PW_WALLET_TEST_ADDRESS`

Optional strict mode:

- `PW_WALLET_ENFORCE_REAL_CONNECT=true` to fail unless the extension flow itself yields a connected address (no `e2eAddress` fallback).
  The `bun run test:e2e:fork:wallet` flow enables this by default.

## 3) Local Fork + Wallet Impersonation (Recommended)

Start a local fork (if `anvil` is installed):

```bash
anvil \
  --fork-url "$MAINNET_RPC_URL" \
  --chain-id 31337 \
  --host 127.0.0.1 \
  --port 8545
```

Point the UI wallet onboarding to the fork chain:

```bash
export VITE_ONBOARD_CHAIN_ID=0x7a69
export VITE_ONBOARD_CHAIN_RPC_URL=http://127.0.0.1:8545
export VITE_ONBOARD_CHAIN_LABEL="Localhost Fork"
export VITE_ONBOARD_CHAIN_TOKEN=ETH
```

Use a fork account in your wallet extension (example Anvil default #0):

- address: `0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266`
- private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

Set `PW_WALLET_TEST_ADDRESS` to the imported extension account.

## 4) Run

```bash
# If no local fork is running already:
export MAINNET_RPC_URL="https://your-mainnet-rpc"

# Recommended full local fork flow (deploy + sync + drift + base e2e + wallet e2e)
bun run test:e2e:fork:wallet

# Wallet suite only (assumes app/fork already running)
bun run test:e2e:wallet
```

Headed and debug modes:

```bash
bun run test:e2e:wallet:headed
bun run test:e2e:wallet:debug
```
