#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8787}"
API_KEY="${API_KEY:-local-dev-key-change-me}"
REFERRER="${REFERRER:-0x000000000000000000000000000000000000dEaD}"
CODE="SMK$(date +%s | tail -c 7)"

json_get() {
  node -e 'const fs=require("fs");const obj=JSON.parse(fs.readFileSync(0,"utf8"));const key=process.argv[1];if(!(key in obj)){process.exit(2)};process.stdout.write(String(obj[key]));' "$1"
}

echo "[smoke] health"
HEALTH=$(curl -sS "$BASE_URL/health")
printf '%s' "$HEALTH" | json_get ok >/dev/null

echo "[smoke] create code $CODE"
CREATE=$(curl -sS -X POST "$BASE_URL/v1/codes" \
  -H "content-type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d "{\"code\":\"$CODE\",\"referrerAddress\":\"$REFERRER\",\"createdBy\":\"smoke\"}")
CREATED_CODE=$(printf '%s' "$CREATE" | json_get code)

echo "[smoke] resolve code $CREATED_CODE"
RESOLVE=$(curl -sS "$BASE_URL/v1/codes/$CREATED_CODE/resolve")
printf '%s' "$RESOLVE" | json_get referrerAddress >/dev/null

echo "[smoke] list codes for referrer"
LIST=$(curl -sS "$BASE_URL/v1/referrers/$REFERRER/codes?status=all" -H "x-api-key: $API_KEY")
printf '%s' "$LIST" | json_get count >/dev/null

echo "[smoke] revoke code $CREATED_CODE"
REVOKE=$(curl -sS -X POST "$BASE_URL/v1/codes/$CREATED_CODE/revoke" \
  -H "content-type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"reason":"smoke_test"}')
printf '%s' "$REVOKE" | json_get status >/dev/null

echo "[smoke] completed successfully"
