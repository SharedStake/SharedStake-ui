#!/usr/bin/env bash
set -euo pipefail

CONTRACTS_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$CONTRACTS_SCRIPT_DIR/../.." && pwd)"
CONTRACTS_DIR="${CONTRACTS_DIR:-$REPO_ROOT/staking-contracts}"
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

ensure_contracts_present() {
  [[ -d "$CONTRACTS_DIR" ]] || die "Contracts directory not found: $CONTRACTS_DIR"
  [[ -f "$CONTRACTS_DIR/package.json" ]] || die "Contracts workspace is missing package.json: $CONTRACTS_DIR"
  [[ -f "$CONTRACTS_DIR/hardhat.config.ts" ]] || die "Contracts workspace is missing hardhat.config.ts: $CONTRACTS_DIR"
}

deployment_file() {
  local network="$1"
  local contract_name="$2"
  printf '%s/deployments/%s/%s.json\n' "$CONTRACTS_DIR" "$network" "$contract_name"
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
  local deployment_dir="$CONTRACTS_DIR/deployments/$network"

  [[ -d "$deployment_dir" ]] || die "Deployment directory not found: $deployment_dir"

  local validator
  local sg_eth
  local wsg_eth
  local v_eth2
  local withdrawals
  local payment_splitter
  local rewards_receiver
  local staking_core
  local st_token
  local wst_token
  local withdrawal_queue_v2
  local old_veth2_withdrawal_queue
  local staking_router
  local validator_module
  local dvt_module
  local lst_wrap_module
  local st_token_erc4626_wrapper
  local oracle_adapter
  local quorum_oracle_adapter
  local fee_controller
  local referral_code_registry
  local referral_registry
  local debt_pool
  local institutional_policy_registry
  local operator_registry
  local migration_helper
  local sgt_v2
  local vote_escrow_v2
  local governance_timelock
  local shared_stake_governor

  validator="$(resolve_validator_address "$network")"
  sg_eth="$(read_address_or_empty "$network" "SgETH")"
  wsg_eth="$(read_address_or_empty "$network" "WSGETH")"
  v_eth2="$(read_address_or_empty "$network" "vEth2")"
  if [[ -z "$v_eth2" ]]; then
    v_eth2="$(read_address_or_empty "$network" "OldVeth2Mock")"
  fi
  withdrawals="$(read_address_or_empty "$network" "WithdrawalQueue")"
  payment_splitter="$(read_address_or_empty "$network" "PaymentSplitter")"
  rewards_receiver="$(read_address_or_empty "$network" "RewardsReceiver")"
  staking_core="$(read_address_or_empty "$network" "StakingCore")"
  st_token="$(read_address_or_empty "$network" "StToken")"
  wst_token="$(read_address_or_empty "$network" "WstToken")"
  withdrawal_queue_v2="$(read_address_or_empty "$network" "WithdrawalQueueV2")"
  old_veth2_withdrawal_queue="$(read_address_or_empty "$network" "OldVeth2WithdrawalQueue")"
  staking_router="$(read_address_or_empty "$network" "StakingRouter")"
  validator_module="$(read_address_or_empty "$network" "ValidatorModule")"
  dvt_module="$(read_address_or_empty "$network" "DVTModule")"
  lst_wrap_module="$(read_address_or_empty "$network" "LSTWrapModule")"
  st_token_erc4626_wrapper="$(read_address_or_empty "$network" "StTokenERC4626Wrapper")"
  oracle_adapter="$(read_address_or_empty "$network" "OracleAdapter")"
  quorum_oracle_adapter="$(read_address_or_empty "$network" "QuorumOracleAdapter")"
  fee_controller="$(read_address_or_empty "$network" "FeeController")"
  referral_code_registry="$(read_address_or_empty "$network" "ReferralCodeRegistry")"
  referral_registry="$(read_address_or_empty "$network" "ReferralRegistry")"
  debt_pool="$(read_address_or_empty "$network" "DebtPool")"
  institutional_policy_registry="$(read_address_or_empty "$network" "InstitutionalPolicyRegistry")"
  operator_registry="$(read_address_or_empty "$network" "OperatorRegistry")"
  migration_helper="$(read_address_or_empty "$network" "MigrationHelper")"
  sgt_v2="$(read_address_or_empty "$network" "SGTV2")"
  vote_escrow_v2="$(read_address_or_empty "$network" "VoteEscrowV2")"
  governance_timelock="$(read_address_or_empty "$network" "GovernanceTimelock")"
  shared_stake_governor="$(read_address_or_empty "$network" "SharedStakeGovernor")"

  jq -n \
    --arg validator "$validator" \
    --arg sg_eth "$sg_eth" \
    --arg wsg_eth "$wsg_eth" \
    --arg v_eth2 "$v_eth2" \
    --arg withdrawals "$withdrawals" \
    --arg payment_splitter "$payment_splitter" \
    --arg rewards_receiver "$rewards_receiver" \
    --arg staking_core "$staking_core" \
    --arg st_token "$st_token" \
    --arg wst_token "$wst_token" \
    --arg withdrawal_queue_v2 "$withdrawal_queue_v2" \
    --arg old_veth2_withdrawal_queue "$old_veth2_withdrawal_queue" \
    --arg staking_router "$staking_router" \
    --arg validator_module "$validator_module" \
    --arg dvt_module "$dvt_module" \
    --arg lst_wrap_module "$lst_wrap_module" \
    --arg st_token_erc4626_wrapper "$st_token_erc4626_wrapper" \
    --arg oracle_adapter "$oracle_adapter" \
    --arg quorum_oracle_adapter "$quorum_oracle_adapter" \
    --arg fee_controller "$fee_controller" \
    --arg referral_code_registry "$referral_code_registry" \
    --arg referral_registry "$referral_registry" \
    --arg debt_pool "$debt_pool" \
    --arg institutional_policy_registry "$institutional_policy_registry" \
    --arg operator_registry "$operator_registry" \
    --arg migration_helper "$migration_helper" \
    --arg sgt_v2 "$sgt_v2" \
    --arg vote_escrow_v2 "$vote_escrow_v2" \
    --arg governance_timelock "$governance_timelock" \
    --arg shared_stake_governor "$shared_stake_governor" \
    '{
      validator: $validator,
      sgETH: $sg_eth,
      wsgETH: $wsg_eth,
      vEth2: $v_eth2,
      withdrawals: $withdrawals,
      PaymentSplitter: $payment_splitter,
      RewardsReceiver: $rewards_receiver,
      stakingCore: $staking_core,
      stToken: $st_token,
      wstToken: $wst_token,
      withdrawalQueueV2: $withdrawal_queue_v2,
      oldVeth2WithdrawalQueue: $old_veth2_withdrawal_queue,
      stakingRouter: $staking_router,
      validatorModule: $validator_module,
      dvtModule: $dvt_module,
      lstWrapModule: $lst_wrap_module,
      stTokenERC4626Wrapper: $st_token_erc4626_wrapper,
      oracleAdapter: $oracle_adapter,
      quorumOracleAdapter: $quorum_oracle_adapter,
      feeController: $fee_controller,
      referralCodeRegistry: $referral_code_registry,
      referralRegistry: $referral_registry,
      debtPool: $debt_pool,
      institutionalPolicyRegistry: $institutional_policy_registry,
      operatorRegistry: $operator_registry,
      migrationHelper: $migration_helper,
      sgtV2: $sgt_v2,
      voteEscrowV2: $vote_escrow_v2,
      governanceTimelock: $governance_timelock,
      sharedStakeGovernor: $shared_stake_governor
    } | with_entries(select(.value != ""))'
}
