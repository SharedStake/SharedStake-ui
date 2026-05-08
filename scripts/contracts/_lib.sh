#!/usr/bin/env bash
set -euo pipefail

CONTRACTS_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$CONTRACTS_SCRIPT_DIR/../.." && pwd)"
SHAREDDEPOSIT_DIR="${SHAREDDEPOSIT_DIR:-$REPO_ROOT/SharedDeposit}"
GENERATED_DIR="${GENERATED_DIR:-$CONTRACTS_SCRIPT_DIR/generated}"

log() {
  printf '[contracts] %s\n' "$*"
}

warn() {
  printf '[contracts][warn] %s\n' "$*" >&2
}

die() {
  printf '[contracts][error] %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || die "Missing required command: $cmd"
}

ensure_shareddeposit_present() {
  [[ -d "$SHAREDDEPOSIT_DIR" ]] || die "SharedDeposit directory not found: $SHAREDDEPOSIT_DIR"
  [[ -f "$SHAREDDEPOSIT_DIR/package.json" ]] || die "SharedDeposit does not look initialized (missing package.json)"
}

deployment_file() {
  local network="$1"
  local contract_name="$2"
  printf '%s/deployments/%s/%s.json\n' "$SHAREDDEPOSIT_DIR" "$network" "$contract_name"
}

read_address_or_empty() {
  local network="$1"
  local contract_name="$2"
  local file

  file="$(deployment_file "$network" "$contract_name")"
  if [[ -f "$file" ]]; then
    jq -r '.address // empty' "$file"
  else
    printf ''
  fi
}

resolve_validator_address() {
  local network="$1"
  local minter_address

  minter_address="$(read_address_or_empty "$network" "SharedDepositMinterV2")"
  if [[ -n "$minter_address" ]]; then
    printf '%s\n' "$minter_address"
    return 0
  fi

  read_address_or_empty "$network" "DepositContract"
}

normalized_addresses_json() {
  local network="$1"
  local deployment_dir="$SHAREDDEPOSIT_DIR/deployments/$network"

  [[ -d "$deployment_dir" ]] || die "Deployment directory not found: $deployment_dir"

  local validator
  local sg_eth
  local wsg_eth
  local withdrawals
  local payment_splitter
  local rewards_receiver
  local staking_core
  local st_token
  local wst_token
  local withdrawal_queue_v2
  local staking_router
  local validator_module
  local dvt_module
  local oracle_adapter
  local quorum_oracle_adapter
  local fee_controller

  validator="$(resolve_validator_address "$network")"
  sg_eth="$(read_address_or_empty "$network" "SgETH")"
  wsg_eth="$(read_address_or_empty "$network" "WSGETH")"
  withdrawals="$(read_address_or_empty "$network" "WithdrawalQueue")"
  payment_splitter="$(read_address_or_empty "$network" "PaymentSplitter")"
  rewards_receiver="$(read_address_or_empty "$network" "RewardsReceiver")"
  staking_core="$(read_address_or_empty "$network" "StakingCore")"
  st_token="$(read_address_or_empty "$network" "StToken")"
  wst_token="$(read_address_or_empty "$network" "WstToken")"
  withdrawal_queue_v2="$(read_address_or_empty "$network" "WithdrawalQueueV2")"
  staking_router="$(read_address_or_empty "$network" "StakingRouter")"
  validator_module="$(read_address_or_empty "$network" "ValidatorModule")"
  dvt_module="$(read_address_or_empty "$network" "DVTModule")"
  oracle_adapter="$(read_address_or_empty "$network" "OracleAdapter")"
  quorum_oracle_adapter="$(read_address_or_empty "$network" "QuorumOracleAdapter")"
  fee_controller="$(read_address_or_empty "$network" "FeeController")"

  jq -n \
    --arg validator "$validator" \
    --arg sg_eth "$sg_eth" \
    --arg wsg_eth "$wsg_eth" \
    --arg withdrawals "$withdrawals" \
    --arg payment_splitter "$payment_splitter" \
    --arg rewards_receiver "$rewards_receiver" \
    --arg staking_core "$staking_core" \
    --arg st_token "$st_token" \
    --arg wst_token "$wst_token" \
    --arg withdrawal_queue_v2 "$withdrawal_queue_v2" \
    --arg staking_router "$staking_router" \
    --arg validator_module "$validator_module" \
    --arg dvt_module "$dvt_module" \
    --arg oracle_adapter "$oracle_adapter" \
    --arg quorum_oracle_adapter "$quorum_oracle_adapter" \
    --arg fee_controller "$fee_controller" \
    '{
      validator: $validator,
      sgETH: $sg_eth,
      wsgETH: $wsg_eth,
      withdrawals: $withdrawals,
      PaymentSplitter: $payment_splitter,
      RewardsReceiver: $rewards_receiver,
      stakingCore: $staking_core,
      stToken: $st_token,
      wstToken: $wst_token,
      withdrawalQueueV2: $withdrawal_queue_v2,
      stakingRouter: $staking_router,
      validatorModule: $validator_module,
      dvtModule: $dvt_module,
      oracleAdapter: $oracle_adapter,
      quorumOracleAdapter: $quorum_oracle_adapter,
      feeController: $fee_controller
    } | with_entries(select(.value != ""))'
}
