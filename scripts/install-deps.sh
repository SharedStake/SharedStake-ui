#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

has() {
  command -v "$1" >/dev/null 2>&1
}

if [[ -f bun.lock || -f bun.lockb ]]; then
  if ! has bun; then
    echo "[deps] bun lockfile detected but bun is not installed (or not in PATH)." >&2
    echo "[deps] Install bun: https://bun.sh/docs/installation" >&2
    echo "[deps] Or run 'npm install' manually as a Node.js fallback." >&2
    exit 1
  fi

  echo "[deps] bun lockfile detected -> bun install"
  exec bun install "$@"
elif [[ -f pnpm-lock.yaml ]]; then
  echo "[deps] pnpm lockfile detected -> corepack pnpm install"
  corepack enable >/dev/null 2>&1 || true
  exec corepack pnpm install "$@"
elif [[ -f package-lock.json ]]; then
  echo "[deps] npm lockfile detected -> npm ci"
  exec npm ci "$@"
elif [[ -f yarn.lock ]]; then
  echo "[deps] yarn lockfile detected -> corepack yarn install --frozen-lockfile"
  corepack enable >/dev/null 2>&1 || true
  exec corepack yarn install --frozen-lockfile "$@"
else
  echo "[deps] no lockfile found -> npm install"
  exec npm install "$@"
fi
