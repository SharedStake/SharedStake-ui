#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/contracts/_lib.sh
source "$SCRIPT_DIR/_lib.sh"

usage() {
  cat <<USAGE
Usage: $0 [network] [target_json]

Examples:
  $0 localhost
  $0 sepolia src/contracts/addresses/sepolia.json
USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

NETWORK="${1:-localhost}"
TARGET="${2:-$REPO_ROOT/src/contracts/addresses/local.json}"

require_cmd jq
ensure_contracts_present

mkdir -p "$(dirname "$TARGET")"

tmp_file="$(mktemp)"
cleanup() {
  rm -f "$tmp_file"
}
trap cleanup EXIT

normalized_addresses_json "$NETWORK" | jq -S . > "$tmp_file"
mv "$tmp_file" "$TARGET"

log "Synced $NETWORK deployment addresses to: $TARGET"
