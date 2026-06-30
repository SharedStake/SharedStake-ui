#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/contracts/_lib.sh
source "$SCRIPT_DIR/_lib.sh"

usage() {
  cat <<USAGE
Usage: $0 [--network <name>] [--tags <tag-list>] [--all-tags] [--skip-install] [--no-sync] [--sync-target <path>]

Defaults:
  --network localhost
  --tags modular-staking
  --sync-target src/contracts/addresses/local.json

Examples:
  $0
  $0 --network localhost --skip-install
  $0 --network localhost --tags modular-staking
  $0 --network sepolia --no-sync
USAGE
}

NETWORK="localhost"
DEPLOY_TAGS="${DEPLOY_TAGS:-modular-staking}"
SKIP_INSTALL=0
SYNC_UI=1
SYNC_TARGET="$REPO_ROOT/src/contracts/addresses/local.json"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --network)
      [[ $# -ge 2 ]] || die "Missing value for --network"
      NETWORK="$2"
      shift 2
      ;;
    --tags)
      [[ $# -ge 2 ]] || die "Missing value for --tags"
      DEPLOY_TAGS="$2"
      shift 2
      ;;
    --all-tags)
      DEPLOY_TAGS=""
      shift
      ;;
    --skip-install)
      SKIP_INSTALL=1
      shift
      ;;
    --no-sync)
      SYNC_UI=0
      shift
      ;;
    --sync-target)
      [[ $# -ge 2 ]] || die "Missing value for --sync-target"
      SYNC_TARGET="$2"
      shift 2
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

require_cmd npx
require_cmd jq
require_cmd node
ensure_contracts_present

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [[ "$NODE_MAJOR" -ge 24 ]]; then
  warn "Detected Node.js $NODE_MAJOR. Hardhat warns this is unsupported; prefer Node 20/22 for fork stability."
fi

if [[ ! -d "$CONTRACTS_DIR/node_modules" ]]; then
  if [[ "$SKIP_INSTALL" -eq 1 ]]; then
    die "Contract dependencies are missing. Remove --skip-install or run npm ci in staking-contracts."
  fi
  if [[ -f "$CONTRACTS_DIR/yarn.lock" ]] && command -v yarn >/dev/null 2>&1; then
    log "Installing contract dependencies with yarn --frozen-lockfile"
    (
      cd "$CONTRACTS_DIR"
      yarn install --frozen-lockfile
    )
  else
    require_cmd npm
    log "Installing contract dependencies (prefer npm ci, fallback npm install)"
    (
      cd "$CONTRACTS_DIR"
      if ! npm ci --legacy-peer-deps; then
        warn "npm ci failed (likely lockfile drift). Falling back to npm install --legacy-peer-deps."
        npm install --legacy-peer-deps
      fi
    )
  fi
fi

log "Compiling local staking contracts"
mkdir -p "$GENERATED_DIR/logs"
COMPILE_LOG_PATH="$GENERATED_DIR/logs/compile-$NETWORK.log"
DEPLOY_LOG_PATH="$GENERATED_DIR/logs/deploy-$NETWORK.log"

print_log_tail() {
  local path="$1"
  local lines="${2:-40}"
  if [[ -f "$path" ]]; then
    warn "Last ${lines} lines from $path:"
    tail -n "$lines" "$path" >&2 || true
  fi
}

if ! (
  cd "$CONTRACTS_DIR"
  npx hardhat compile > "$COMPILE_LOG_PATH" 2>&1
); then
  print_log_tail "$COMPILE_LOG_PATH" 80
  if grep -q "JsonRpcSigner" "$COMPILE_LOG_PATH"; then
    warn "Detected ethers/zksync compatibility error during compile."
  fi
  die "Contract compile failed. See $COMPILE_LOG_PATH"
fi
log "Compile finished. Log: $COMPILE_LOG_PATH"

log "Deploying local staking contracts to network: $NETWORK"
is_ephemeral_network=0
if [[ "$NETWORK" == "localhost" || "$NETWORK" == "hardhat" ]]; then
  is_ephemeral_network=1
fi

DEPLOY_ARGS=(--network "$NETWORK")
if [[ -n "$DEPLOY_TAGS" ]]; then
  DEPLOY_ARGS+=(--tags "$DEPLOY_TAGS")
fi
if [[ "$is_ephemeral_network" -eq 1 ]]; then
  # Ephemeral networks reuse chain snapshots frequently, so always reset deployment records.
  DEPLOY_ARGS+=(--reset)
fi

run_hardhat_deploy() {
  (
    cd "$CONTRACTS_DIR"
    npx hardhat deploy "${DEPLOY_ARGS[@]}" > "$DEPLOY_LOG_PATH" 2>&1
  )
}

if ! run_hardhat_deploy; then
  print_log_tail "$DEPLOY_LOG_PATH" 120
  if grep -Eq "for a different chainId|cannot get the transaction for .+previous deployment" "$DEPLOY_LOG_PATH"; then
    DEPLOYMENTS_DIR="$CONTRACTS_DIR/deployments/$NETWORK"
    if [[ -d "$DEPLOYMENTS_DIR" ]]; then
      BACKUP_DIR="$CONTRACTS_DIR/deployments/${NETWORK}.stale-deployments.$(date +%Y%m%d%H%M%S)"
      warn "Detected stale or incompatible deployments metadata in $DEPLOYMENTS_DIR. Moving it to $BACKUP_DIR and retrying."
      mv "$DEPLOYMENTS_DIR" "$BACKUP_DIR"
      if ! run_hardhat_deploy; then
        print_log_tail "$DEPLOY_LOG_PATH" 120
        die "Contract deploy failed after stale-deployments recovery. See $DEPLOY_LOG_PATH"
      fi
    else
      die "Deploy failed with stale deployment metadata but no deployments directory found. See $DEPLOY_LOG_PATH"
    fi
  else
    die "Contract deploy failed. See $DEPLOY_LOG_PATH"
  fi
fi

DEPLOY_SUMMARY="$(
  grep -E 'deploying \"[^\"]+\"|Adding minter role|setWithdrawalCredential' "$DEPLOY_LOG_PATH" || true
)"
if [[ -n "$DEPLOY_SUMMARY" ]]; then
  while IFS= read -r line; do
    log "$line"
  done <<< "$DEPLOY_SUMMARY"
fi
log "Deploy finished. Log: $DEPLOY_LOG_PATH"

if [[ ! -d "$CONTRACTS_DIR/deployments/$NETWORK" ]]; then
  if [[ "$NETWORK" == "hardhat" ]]; then
    warn "Hardhat in-memory deployments do not persist metadata; skipping address export and UI sync. Use --network localhost with a running Hardhat node to sync local.json."
    exit 0
  fi
  die "Deployment directory not found: $CONTRACTS_DIR/deployments/$NETWORK"
fi

ARTIFACT_PATH="$GENERATED_DIR/staking-contracts-$NETWORK-addresses.json"
normalized_addresses_json "$NETWORK" | jq -S . > "$ARTIFACT_PATH"
log "Exported normalized addresses: $ARTIFACT_PATH"

if [[ "$SYNC_UI" -eq 1 ]]; then
  "$SCRIPT_DIR/sync-addresses.sh" "$NETWORK" "$SYNC_TARGET"
fi
