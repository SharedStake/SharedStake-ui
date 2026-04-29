#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/contracts/_lib.sh
source "$SCRIPT_DIR/_lib.sh"

usage() {
  cat <<USAGE
Usage: $0 [options]

Options:
  --rpc-url <url>        Mainnet RPC URL for Anvil fork (default: \$MAINNET_RPC_URL)
  --network <name>       Hardhat network for deploy/sync (default: localhost)
  --host <host>          Local fork host (default: 127.0.0.1)
  --port <port>          Local fork port (default: 8545)
  --chain-id <id>        Local fork chain id, hex or decimal (default: 31337)
  --sync-target <path>   UI addresses target file (default: src/contracts/addresses/local.json)
  --with-wallet          Also run wallet extension E2E tests
  --keep-anvil           Keep spawned Anvil process alive after completion
  --skip-deploy          Skip contract deploy/sync and only run drift + tests
  -h, --help             Show this help message
USAGE
}

NETWORK="localhost"
HOST="127.0.0.1"
PORT="8545"
CHAIN_ID="31337"
RPC_URL="${MAINNET_RPC_URL:-}"
SYNC_TARGET="$REPO_ROOT/src/contracts/addresses/local.json"
RUN_WALLET=0
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
    --sync-target)
      [[ $# -ge 2 ]] || die "Missing value for --sync-target"
      SYNC_TARGET="$2"
      shift 2
      ;;
    --with-wallet)
      RUN_WALLET=1
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
  log "Reusing existing RPC at http://$HOST:$PORT"
else
  [[ -n "$RPC_URL" ]] || die "Mainnet RPC URL required. Set --rpc-url or MAINNET_RPC_URL."
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
fi

if [[ "$SKIP_DEPLOY" -eq 0 ]]; then
  "$SCRIPT_DIR/deploy-local.sh" --network "$NETWORK" --sync-target "$SYNC_TARGET"
else
  log "Skipping deploy step (--skip-deploy)"
fi

"$SCRIPT_DIR/check-drift.sh" "$NETWORK" "$SYNC_TARGET"

ONBOARD_CHAIN_ID="$(normalize_chain_id_hex "$CHAIN_ID")"
ONBOARD_CHAIN_RPC_URL="http://$HOST:$PORT"
ONBOARD_CHAIN_LABEL="Localhost Fork"
ONBOARD_CHAIN_TOKEN="ETH"

log "Running base browser E2E on fork"
VITE_ONBOARD_CHAIN_ID="$ONBOARD_CHAIN_ID" \
VITE_ONBOARD_CHAIN_RPC_URL="$ONBOARD_CHAIN_RPC_URL" \
VITE_ONBOARD_CHAIN_LABEL="$ONBOARD_CHAIN_LABEL" \
VITE_ONBOARD_CHAIN_TOKEN="$ONBOARD_CHAIN_TOKEN" \
bun run test:e2e -- tests/e2e/airdrop.spec.js

if [[ "$RUN_WALLET" -eq 1 ]]; then
  if [[ -z "${PW_WALLET_EXTENSION_PATH:-}" || -z "${PW_WALLET_EXTENSION_ID:-}" || -z "${PW_WALLET_TEST_ADDRESS:-}" ]]; then
    die "Wallet E2E requested but required env is missing. Set PW_WALLET_EXTENSION_PATH, PW_WALLET_EXTENSION_ID, and PW_WALLET_TEST_ADDRESS."
  fi
  log "Running wallet extension E2E on fork"
  VITE_ONBOARD_CHAIN_ID="$ONBOARD_CHAIN_ID" \
  VITE_ONBOARD_CHAIN_RPC_URL="$ONBOARD_CHAIN_RPC_URL" \
  VITE_ONBOARD_CHAIN_LABEL="$ONBOARD_CHAIN_LABEL" \
  VITE_ONBOARD_CHAIN_TOKEN="$ONBOARD_CHAIN_TOKEN" \
  PW_WALLET_ENFORCE_REAL_CONNECT="${PW_WALLET_ENFORCE_REAL_CONNECT:-true}" \
  bun run test:e2e:wallet
fi

log "Fork E2E flow completed successfully"
