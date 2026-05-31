// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

/// @title IDepositContract - canonical Ethereum 2.0 beacon-chain deposit contract
/// @dev Live address: 0x00000000219ab540356cBB839Cbe05303d7705Fa
interface IDepositContract {
    function deposit(
        bytes calldata pubkey,
        bytes calldata withdrawal_credentials,
        bytes calldata signature,
        bytes32 deposit_data_root
    ) external payable;

    function get_deposit_count() external view returns (bytes memory);

    function get_deposit_root() external view returns (bytes32);
}
