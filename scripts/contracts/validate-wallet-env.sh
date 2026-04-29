#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/contracts/_lib.sh
source "$SCRIPT_DIR/_lib.sh"

REQUIRED_VARS=(
  PW_WALLET_EXTENSION_PATH
  PW_WALLET_EXTENSION_ID
  PW_WALLET_TEST_ADDRESS
)

missing=()

for var_name in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    missing+=("$var_name")
  fi
done

if [[ "${#missing[@]}" -gt 0 ]]; then
  warn "Wallet E2E strict mode missing required environment variables:"
  for var_name in "${missing[@]}"; do
    warn "  - $var_name"
  done
  die "Populate .env.e2e.wallet and export it before running strict wallet E2E."
fi

log "Wallet E2E strict preflight passed"
