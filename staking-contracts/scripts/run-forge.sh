#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FORGE_STD_DIR="$ROOT_DIR/lib/forge-std"
FORGE_STD_REV="620536fa5277db4e3fd46772d5cbc1ea0696fb43"

ensure_forge_std() {
  if [ -f "$FORGE_STD_DIR/src/Test.sol" ]; then
    return
  fi

  if [ -e "$FORGE_STD_DIR" ] && [ ! -d "$FORGE_STD_DIR/.git" ]; then
    echo "forge-std path exists but is not a git checkout: $FORGE_STD_DIR" >&2
    echo "Remove it or install forge-std manually at revision $FORGE_STD_REV." >&2
    exit 1
  fi

  if ! command -v git >/dev/null 2>&1; then
    echo "git not found. Install forge-std manually at $FORGE_STD_DIR revision $FORGE_STD_REV." >&2
    exit 1
  fi

  mkdir -p "$ROOT_DIR/lib"

  if [ ! -d "$FORGE_STD_DIR/.git" ]; then
    git clone https://github.com/foundry-rs/forge-std.git "$FORGE_STD_DIR"
  fi

  git -C "$FORGE_STD_DIR" fetch --quiet origin "$FORGE_STD_REV"
  git -C "$FORGE_STD_DIR" checkout --quiet "$FORGE_STD_REV"

  if [ "$(git -C "$FORGE_STD_DIR" rev-parse HEAD)" != "$FORGE_STD_REV" ]; then
    echo "forge-std revision mismatch; expected $FORGE_STD_REV." >&2
    exit 1
  fi
}

ensure_forge_std

if command -v forge >/dev/null 2>&1; then
  exec forge "$@"
fi

if [ -x "${HOME}/.foundry/bin/forge" ]; then
  exec "${HOME}/.foundry/bin/forge" "$@"
fi

echo "forge not found. Run: npm run setup:foundry" >&2
exit 1
