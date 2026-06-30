#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/contracts/_lib.sh
source "$SCRIPT_DIR/_lib.sh"

usage() {
  cat <<USAGE
Usage: $0 --address <wallet_address> [options]

Options:
  --rpc-url <url>      JSON-RPC endpoint (default: http://127.0.0.1:8545)
  --eth <amount>       ETH amount to set as exact wallet balance (default: 5)
  --address <address>  Wallet address to seed (required)
  -h, --help           Show this help message
USAGE
}

RPC_URL="http://127.0.0.1:8545"
ETH_AMOUNT="5"
WALLET_ADDRESS=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --rpc-url)
      [[ $# -ge 2 ]] || die "Missing value for --rpc-url"
      RPC_URL="$2"
      shift 2
      ;;
    --eth)
      [[ $# -ge 2 ]] || die "Missing value for --eth"
      ETH_AMOUNT="$2"
      shift 2
      ;;
    --address)
      [[ $# -ge 2 ]] || die "Missing value for --address"
      WALLET_ADDRESS="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Unknown argument: $1"
      ;;
  esac
done

[[ -n "$WALLET_ADDRESS" ]] || die "--address is required"

require_cmd curl
require_cmd jq
require_cmd node

is_valid_address="$(
  node -e '
    const input = process.argv[1] || "";
    process.stdout.write(/^0x[0-9a-fA-F]{40}$/.test(input) ? "1" : "0");
  ' "$WALLET_ADDRESS"
)"
[[ "$is_valid_address" == "1" ]] || die "Invalid wallet address: $WALLET_ADDRESS"

WEI_HEX="$(
  node -e '
    const value = String(process.argv[1] || "").trim();
    if (!/^\d+(\.\d+)?$/.test(value)) {
      console.error("Invalid ETH amount:", value);
      process.exit(1);
    }
    const [whole, frac = ""] = value.split(".");
    if (frac.length > 18) {
      console.error("ETH amount supports up to 18 decimals:", value);
      process.exit(1);
    }
    const wholeWei = BigInt(whole) * (10n ** 18n);
    const fracPadded = (frac + "0".repeat(18)).slice(0, 18);
    const fracWei = BigInt(fracPadded);
    const wei = wholeWei + fracWei;
    process.stdout.write("0x" + wei.toString(16));
  ' "$ETH_AMOUNT"
)"

set_balance_response=""
set_balance() {
  local method="$1"
  local payload
  payload="$(jq -n \
    --arg method "$method" \
    --arg address "$WALLET_ADDRESS" \
    --arg wei "$WEI_HEX" \
    '{jsonrpc:"2.0", method:$method, params:[$address, $wei], id:1}')"

  set_balance_response="$(curl -sS "$RPC_URL" -H "content-type: application/json" --data "$payload")"
  [[ "$(jq -r '.error // empty' <<< "$set_balance_response")" == "" ]]
}

if ! set_balance "anvil_setBalance"; then
  warn "anvil_setBalance response: $set_balance_response"
  if ! set_balance "hardhat_setBalance"; then
    warn "hardhat_setBalance response: $set_balance_response"
    die "Failed to seed wallet balance via anvil_setBalance or hardhat_setBalance"
  fi
fi

balance_payload="$(jq -n \
  --arg address "$WALLET_ADDRESS" \
  '{jsonrpc:"2.0", method:"eth_getBalance", params:[$address, "latest"], id:1}')"

balance_response="$(curl -sS "$RPC_URL" -H "content-type: application/json" --data "$balance_payload")"
balance_hex="$(jq -r '.result // empty' <<< "$balance_response")"
[[ -n "$balance_hex" && "$balance_hex" != "null" ]] || die "Failed to read seeded wallet balance"

balance_eth="$(
  node -e '
    const hex = process.argv[1];
    const wei = BigInt(hex);
    const whole = wei / (10n ** 18n);
    const frac = (wei % (10n ** 18n)).toString().padStart(18, "0").replace(/0+$/, "");
    process.stdout.write(frac ? `${whole}.${frac}` : `${whole}`);
  ' "$balance_hex"
)"

log "Seeded $WALLET_ADDRESS with $balance_eth ETH ($balance_hex) via $RPC_URL"
