#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/contracts/_lib.sh
source "$SCRIPT_DIR/_lib.sh"

usage() {
  cat <<USAGE
Usage: $0 [network] [target_json]

Defaults:
  network: localhost
  target_json: src/contracts/addresses/local.json
USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

NETWORK="${1:-localhost}"
TARGET="${2:-$REPO_ROOT/src/contracts/addresses/local.json}"

require_cmd jq
ensure_shareddeposit_present
[[ -f "$TARGET" ]] || die "Target address file not found: $TARGET"

tmp_source="$(mktemp)"
tmp_drift="$(mktemp)"
cleanup() {
  rm -f "$tmp_source" "$tmp_drift"
}
trap cleanup EXIT

normalized_addresses_json "$NETWORK" | jq -S . > "$tmp_source"

jq -n \
  --slurpfile source "$tmp_source" \
  --slurpfile target "$TARGET" \
  '$source[0]
    | to_entries
    | map(
        select((.value | ascii_downcase) != (($target[0][.key] // "") | tostring | ascii_downcase))
        | {
            key: .key,
            deployment: .value,
            ui: ($target[0][.key] // null)
          }
      )' > "$tmp_drift"

if [[ "$(jq 'length' "$tmp_drift")" == "0" ]]; then
  log "No drift detected between $NETWORK deployments and $TARGET"
  exit 0
fi

warn "Drift detected between $NETWORK deployments and $TARGET"
jq -r '.[] | "- \(.key): deployment=\(.deployment), ui=\(.ui // \"null\")"' "$tmp_drift"
exit 1
