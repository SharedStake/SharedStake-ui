#!/usr/bin/env bash
set -euo pipefail

VERSION="${FOUNDRY_VERSION:-v1.7.1}"
ATTEMPTS="${FOUNDRY_SETUP_ATTEMPTS:-4}"
DELAY_SECONDS="${FOUNDRY_SETUP_RETRY_DELAY:-10}"

if ! [[ "$ATTEMPTS" =~ ^[0-9]+$ ]] || [ "$ATTEMPTS" -lt 1 ]; then
  echo "FOUNDRY_SETUP_ATTEMPTS must be a positive integer" >&2
  exit 2
fi

attempt=1
while [ "$attempt" -le "$ATTEMPTS" ]; do
  echo "Installing Foundry ${VERSION} (attempt ${attempt}/${ATTEMPTS})"
  if mm-foundryup --version "$VERSION"; then
    exit 0
  fi

  if [ "$attempt" -eq "$ATTEMPTS" ]; then
    echo "Foundry setup failed after ${ATTEMPTS} attempts" >&2
    exit 1
  fi

  echo "Foundry setup failed; retrying in ${DELAY_SECONDS}s" >&2
  sleep "$DELAY_SECONDS"
  attempt=$((attempt + 1))
  DELAY_SECONDS=$((DELAY_SECONDS * 2))
done
