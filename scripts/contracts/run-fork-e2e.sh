#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/contracts/_lib.sh
source "$SCRIPT_DIR/_lib.sh"

usage() {
  cat <<USAGE
Usage: $0 [options]

Options:
  --rpc-url <url>        Mainnet RPC URL for Anvil fork (default: \$MAINNET_RPC_URL,
                         or Alchemy mainnet URL derived from \$ALCHEMY_KEY)
  --network <name>       Hardhat network for deploy/sync (default: localhost)
  --host <host>          Local fork host (default: 127.0.0.1)
  --port <port>          Local fork port (default: 8545)
  --chain-id <id>        Local fork chain id, hex or decimal (default: 31337)
  --web-port <port>      Vite/Playwright web server port (default: \$E2E_WEB_PORT or 4173)
  --sync-target <path>   UI addresses target file (default: src/contracts/addresses/local.json)
  --impersonator-address <addr>
                         Address used for injected-wallet tx E2E (default: \$E2E_IMPERSONATOR_ADDRESS or 0x111...1111)
  --impersonator-seed-eth <n>
                         Exact ETH balance to set for impersonator address (default: \$E2E_IMPERSONATOR_SEED_ETH or 5)
  --with-wallet          Also run wallet extension E2E tests
  --seed-wallet-eth <n>  Exact ETH balance to set for PW_WALLET_TEST_ADDRESS (default: \$PW_WALLET_SEED_ETH or 5)
  --fresh-fork           Require this script to spawn Anvil; fail instead of reusing an existing RPC
  --keep-anvil           Keep spawned Anvil process alive after completion
  --skip-deploy          Skip contract deploy/sync and only run drift + tests
  -h, --help             Show this help message

Examples:
  MAINNET_RPC_URL=https://... bun run test:e2e:fork -- --fresh-fork --port 8546 --web-port 4174
  ALCHEMY_KEY=... bun run test:e2e:fork -- --fresh-fork --port 8546 --web-port 4174
USAGE
}

NETWORK="localhost"
HOST="127.0.0.1"
PORT="8545"
CHAIN_ID="31337"
WEB_PORT="${E2E_WEB_PORT:-4173}"
RPC_URL="${MAINNET_RPC_URL:-}"
if [[ -z "$RPC_URL" && -n "${ALCHEMY_KEY:-}" ]]; then
  RPC_URL="https://eth-mainnet.g.alchemy.com/v2/$ALCHEMY_KEY"
fi
SYNC_TARGET="$REPO_ROOT/src/contracts/addresses/local.json"
IMPERSONATOR_ADDRESS="${E2E_IMPERSONATOR_ADDRESS:-0x1111111111111111111111111111111111111111}"
IMPERSONATOR_SEED_ETH="${E2E_IMPERSONATOR_SEED_ETH:-5}"
RUN_WALLET=0
SEED_WALLET_ETH="${PW_WALLET_SEED_ETH:-5}"
FRESH_FORK=0
KEEP_ANVIL=0
SKIP_DEPLOY=0
ANVIL_PID=""
ANVIL_LOG_PATH=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --rpc-url)
      [[ $# -ge 2 ]] || die "Missing value for --rpc-url"
      RPC_URL="$2"
      shift 2
      ;;
    --network)
      [[ $# -ge 2 ]] || die "Missing value for --network"
      NETWORK="$2"
      shift 2
      ;;
    --host)
      [[ $# -ge 2 ]] || die "Missing value for --host"
      HOST="$2"
      shift 2
      ;;
    --port)
      [[ $# -ge 2 ]] || die "Missing value for --port"
      PORT="$2"
      shift 2
      ;;
    --chain-id)
      [[ $# -ge 2 ]] || die "Missing value for --chain-id"
      CHAIN_ID="$2"
      shift 2
      ;;
    --web-port)
      [[ $# -ge 2 ]] || die "Missing value for --web-port"
      WEB_PORT="$2"
      shift 2
      ;;
    --sync-target)
      [[ $# -ge 2 ]] || die "Missing value for --sync-target"
      SYNC_TARGET="$2"
      shift 2
      ;;
    --impersonator-address)
      [[ $# -ge 2 ]] || die "Missing value for --impersonator-address"
      IMPERSONATOR_ADDRESS="$2"
      shift 2
      ;;
    --impersonator-seed-eth)
      [[ $# -ge 2 ]] || die "Missing value for --impersonator-seed-eth"
      IMPERSONATOR_SEED_ETH="$2"
      shift 2
      ;;
    --with-wallet)
      RUN_WALLET=1
      shift
      ;;
    --seed-wallet-eth)
      [[ $# -ge 2 ]] || die "Missing value for --seed-wallet-eth"
      SEED_WALLET_ETH="$2"
      shift 2
      ;;
    --fresh-fork)
      FRESH_FORK=1
      shift
      ;;
    --keep-anvil)
      KEEP_ANVIL=1
      shift
      ;;
    --skip-deploy)
      SKIP_DEPLOY=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Unknown argument: $1"
      ;;
  esac
done

require_cmd curl
require_cmd bun

[[ "$WEB_PORT" =~ ^[0-9]+$ ]] || die "Invalid web port: $WEB_PORT"

normalize_chain_id_hex() {
  local raw="$1"
  if [[ "$raw" =~ ^0x[0-9a-fA-F]+$ ]]; then
    printf '0x%x\n' "$((raw))"
    return 0
  fi
  [[ "$raw" =~ ^[0-9]+$ ]] || die "Invalid chain id: $raw"
  printf '0x%x\n' "$raw"
}

is_local_rpc_up() {
  curl -sf "http://$HOST:$PORT" \
    -H "content-type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
    >/dev/null
}

wait_for_local_rpc() {
  local retries=60
  while (( retries > 0 )); do
    if is_local_rpc_up; then
      return 0
    fi
    sleep 0.5
    retries=$((retries - 1))
  done
  return 1
}

resolve_anvil_bin() {
  if command -v anvil >/dev/null 2>&1; then
    command -v anvil
    return 0
  fi
  if [[ -x "$HOME/.foundry/bin/anvil" ]]; then
    printf '%s\n' "$HOME/.foundry/bin/anvil"
    return 0
  fi
  return 1
}

cleanup() {
  if [[ -n "$ANVIL_PID" && "$KEEP_ANVIL" -eq 0 ]]; then
    log "Stopping Anvil fork (pid $ANVIL_PID)"
    kill "$ANVIL_PID" >/dev/null 2>&1 || true
    wait "$ANVIL_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

if is_local_rpc_up; then
  if [[ "$FRESH_FORK" -eq 1 ]]; then
    die "RPC already running at http://$HOST:$PORT. Stop it or choose another --port for a fresh mainnet fork."
  fi
  log "Reusing existing RPC at http://$HOST:$PORT"
  warn "Existing RPC reuse is a local harness smoke unless you independently know that node is a mainnet fork."
else
  [[ -n "$RPC_URL" ]] || die "Mainnet RPC URL required. Set --rpc-url, MAINNET_RPC_URL, or ALCHEMY_KEY."
  ANVIL_BIN="$(resolve_anvil_bin)" || die "Anvil not found. Install Foundry or add anvil to PATH."
  mkdir -p "$GENERATED_DIR/logs"
  ANVIL_LOG_PATH="$GENERATED_DIR/logs/anvil-fork.log"

  log "Starting Anvil fork from $RPC_URL"
  "$ANVIL_BIN" \
    --fork-url "$RPC_URL" \
    --host "$HOST" \
    --port "$PORT" \
    --chain-id "$CHAIN_ID" \
    > "$ANVIL_LOG_PATH" 2>&1 &
  ANVIL_PID="$!"

  if ! wait_for_local_rpc; then
    warn "Anvil did not become ready in time."
    if [[ -f "$ANVIL_LOG_PATH" ]]; then
      tail -n 120 "$ANVIL_LOG_PATH" >&2 || true
    fi
    die "Failed to start local fork RPC"
  fi

  log "Anvil fork ready at http://$HOST:$PORT (pid $ANVIL_PID)"
  log "Anvil log: $ANVIL_LOG_PATH"
  if [[ "$KEEP_ANVIL" -eq 1 ]]; then
    disown "$ANVIL_PID" 2>/dev/null || true
  fi
fi

if [[ "$SKIP_DEPLOY" -eq 0 ]]; then
  LOCALHOST_RPC_URL="http://$HOST:$PORT" "$SCRIPT_DIR/deploy-local.sh" --network "$NETWORK" --sync-target "$SYNC_TARGET"
else
  log "Skipping deploy step (--skip-deploy)"
fi

"$SCRIPT_DIR/check-drift.sh" "$NETWORK" "$SYNC_TARGET"

ONBOARD_CHAIN_ID="$(normalize_chain_id_hex "$CHAIN_ID")"
ONBOARD_CHAIN_RPC_URL="http://$HOST:$PORT"
ONBOARD_CHAIN_LABEL="Localhost Fork"
ONBOARD_CHAIN_TOKEN="ETH"

log "Seeding impersonator wallet for base tx E2E"
"$SCRIPT_DIR/seed-wallet.sh" \
  --rpc-url "$ONBOARD_CHAIN_RPC_URL" \
  --address "$IMPERSONATOR_ADDRESS" \
  --eth "$IMPERSONATOR_SEED_ETH"

log "Running base browser E2E on fork"
VITE_ONBOARD_CHAIN_ID="$ONBOARD_CHAIN_ID" \
VITE_ONBOARD_CHAIN_RPC_URL="$ONBOARD_CHAIN_RPC_URL" \
VITE_ONBOARD_CHAIN_LABEL="$ONBOARD_CHAIN_LABEL" \
VITE_ONBOARD_CHAIN_TOKEN="$ONBOARD_CHAIN_TOKEN" \
E2E_IMPERSONATOR_RPC_URL="$ONBOARD_CHAIN_RPC_URL" \
E2E_IMPERSONATOR_CHAIN_ID="$ONBOARD_CHAIN_ID" \
E2E_IMPERSONATOR_ADDRESS="$IMPERSONATOR_ADDRESS" \
E2E_IMPERSONATOR_SEED_ETH="$IMPERSONATOR_SEED_ETH" \
PW_FORCE_FRESH_SERVER=1 \
PW_WEB_SERVER_PORT="$WEB_PORT" \
bun run test:e2e -- \
  tests/e2e/airdrop.spec.js \
  tests/e2e/stake-approve-flow.spec.js \
  tests/e2e/modular-staking-v2.spec.js \
  tests/e2e/wrap-panel.spec.js \
  tests/e2e/withdraw-panel.spec.js \
  tests/e2e/lock-gov.spec.js

if [[ "$RUN_WALLET" -eq 1 ]]; then
  if [[ -z "${PW_WALLET_EXTENSION_PATH:-}" || -z "${PW_WALLET_EXTENSION_ID:-}" || -z "${PW_WALLET_TEST_ADDRESS:-}" ]]; then
    die "Wallet E2E requested but required env is missing. Set PW_WALLET_EXTENSION_PATH, PW_WALLET_EXTENSION_ID, and PW_WALLET_TEST_ADDRESS."
  fi
  log "Seeding wallet address for deterministic local tx execution"
  "$SCRIPT_DIR/seed-wallet.sh" \
    --rpc-url "$ONBOARD_CHAIN_RPC_URL" \
    --address "$PW_WALLET_TEST_ADDRESS" \
    --eth "$SEED_WALLET_ETH"
  log "Running wallet extension E2E on fork"
  VITE_ONBOARD_CHAIN_ID="$ONBOARD_CHAIN_ID" \
  VITE_ONBOARD_CHAIN_RPC_URL="$ONBOARD_CHAIN_RPC_URL" \
  VITE_ONBOARD_CHAIN_LABEL="$ONBOARD_CHAIN_LABEL" \
  VITE_ONBOARD_CHAIN_TOKEN="$ONBOARD_CHAIN_TOKEN" \
  PW_WALLET_HEADLESS="${PW_WALLET_HEADLESS:-true}" \
  PW_WALLET_ENFORCE_REAL_CONNECT="${PW_WALLET_ENFORCE_REAL_CONNECT:-true}" \
  PW_FORCE_FRESH_SERVER=1 \
  PW_WEB_SERVER_PORT="$WEB_PORT" \
  bun run test:e2e:wallet
fi

log "Fork E2E flow completed successfully"
