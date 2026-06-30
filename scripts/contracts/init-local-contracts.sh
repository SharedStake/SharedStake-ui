#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/contracts/_lib.sh
source "$SCRIPT_DIR/_lib.sh"

if [[ ! -d "$REPO_ROOT/.git" && ! -f "$REPO_ROOT/.git" ]]; then
  die "Repository root is not a git checkout: $REPO_ROOT"
fi

ensure_contracts_present

log "Local staking contracts workspace is ready at: $CONTRACTS_DIR"
log "Install dependencies with: cd staking-contracts && npm ci --legacy-peer-deps"
