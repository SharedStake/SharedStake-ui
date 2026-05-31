#!/usr/bin/env bash
set -euo pipefail

if command -v forge >/dev/null 2>&1; then
  exec forge "$@"
fi

if [ -x "${HOME}/.foundry/bin/forge" ]; then
  exec "${HOME}/.foundry/bin/forge" "$@"
fi

echo "forge not found. Run: npm run setup:foundry" >&2
exit 1
