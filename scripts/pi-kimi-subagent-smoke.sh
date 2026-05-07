#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v pi-kimi-subagent >/dev/null 2>&1; then
  echo "FAIL: pi-kimi-subagent is not installed or not on PATH." >&2
  exit 1
fi

SMOKE_DIR="artifacts/pi-kimi-subagent-smoke"
INPUT_FILE="$SMOKE_DIR/input.txt"
OUTPUT_FILE="$SMOKE_DIR/output.txt"
EXPECTED_FILE="$SMOKE_DIR/expected.txt"
LOG_FILE="$SMOKE_DIR/run.log"

mkdir -p "$SMOKE_DIR"
rm -f "$OUTPUT_FILE" "$EXPECTED_FILE" "$LOG_FILE"

cat > "$INPUT_FILE" <<'EOF'
alpha
EOF

cat > "$EXPECTED_FILE" <<'EOF'
alpha
beta
EOF

PROMPT="$(cat <<'EOF'
You are running a coding smoke test in this repository.
1) Read artifacts/pi-kimi-subagent-smoke/input.txt.
2) Create artifacts/pi-kimi-subagent-smoke/output.txt with exactly two lines:
alpha
beta
3) Reply with exactly DONE.
EOF
)"

set +e
RESULT="$(PI_KIMI_TIMEOUT="${PI_KIMI_TIMEOUT:-180s}" pi-kimi-subagent "$PROMPT" 2>&1)"
STATUS=$?
set -e

printf '%s\n' "$RESULT" > "$LOG_FILE"

if [ "$STATUS" -ne 0 ]; then
  echo "FAIL: pi-kimi-subagent returned a non-zero exit status: $STATUS" >&2
  tail -n 30 "$LOG_FILE" >&2 || true
  exit "$STATUS"
fi

if [ ! -f "$OUTPUT_FILE" ]; then
  echo "FAIL: expected output file was not created: $OUTPUT_FILE" >&2
  exit 1
fi

ACTUAL_CONTENT="$(cat "$OUTPUT_FILE")"
EXPECTED_CONTENT="$(cat "$EXPECTED_FILE")"

if [ "$ACTUAL_CONTENT" != "$EXPECTED_CONTENT" ]; then
  echo "FAIL: output file content mismatch." >&2
  diff -u "$EXPECTED_FILE" "$OUTPUT_FILE" >&2 || true
  exit 1
fi

if ! printf '%s\n' "$RESULT" | rg -q 'DONE'; then
  echo "FAIL: expected completion token DONE was not found in model output." >&2
  tail -n 20 "$LOG_FILE" >&2 || true
  exit 1
fi

echo "PASS: pi-kimi-subagent completed coding smoke test."
echo "Artifacts: $SMOKE_DIR"
