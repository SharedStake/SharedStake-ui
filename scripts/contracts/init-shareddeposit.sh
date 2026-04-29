#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/contracts/_lib.sh
source "$SCRIPT_DIR/_lib.sh"

require_cmd git

if [[ ! -d "$REPO_ROOT/.git" && ! -f "$REPO_ROOT/.git" ]]; then
  die "Repository root is not a git checkout: $REPO_ROOT"
fi

log "Initializing SharedDeposit submodule"
git -C "$REPO_ROOT" submodule update --init SharedDeposit

log "Attempting recursive submodule initialization for SharedDeposit"
if ! git -C "$REPO_ROOT" submodule update --init --recursive SharedDeposit; then
  warn "Recursive init from root failed. Continuing with non-recursive SharedDeposit checkout."
fi

if [[ -d "$SHAREDDEPOSIT_DIR" ]]; then
  log "Attempting nested submodule initialization inside SharedDeposit"
  if ! git -C "$SHAREDDEPOSIT_DIR" submodule update --init --recursive; then
    warn "Nested SharedDeposit submodules failed to initialize (often SSH permissions). Continuing."
  fi
fi

ensure_shareddeposit_present
log "SharedDeposit is ready at: $SHAREDDEPOSIT_DIR"
