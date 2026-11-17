// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/// @title MockBeaconDeposit
/// @notice Test-only stand-in for the canonical beacon-chain deposit contract
///         (`0x00000000219ab540356cBB839Cbe05303d7705Fa`). Absorbs ETH on
///         `deposit()` calls without performing any real validator processing.
/// @dev Used by hardhat unit/integration tests so `ValidatorModule.depositToBeaconChain`
///      can be exercised against a local mock instead of forking mainnet.
contract MockBeaconDeposit {
    event DepositEvent(
        bytes pubkey,
        bytes withdrawal_credentials,
        bytes signature,
        bytes32 deposit_data_root,
        uint256 amount
    );

    /// @notice Mirrors the canonical `IDepositContract.deposit` selector.
    function deposit(
        bytes calldata pubkey,
        bytes calldata withdrawal_credentials,
        bytes calldata signature,
        bytes32 deposit_data_root
    ) external payable {
        emit DepositEvent(pubkey, withdrawal_credentials, signature, deposit_data_root, msg.value);
    }

    /// @notice Stub: real deposit contract returns SSZ-encoded little-endian count.
    function get_deposit_count() external pure returns (bytes memory) {
        return new bytes(8);
    }

    /// @notice Stub: real deposit contract returns the SSZ deposit-tree root.
    function get_deposit_root() external pure returns (bytes32) {
        return bytes32(0);
    }

    /// @notice Allow direct ETH transfers (no-op accumulator) for symmetry with
    ///         the real contract's `receive`-via-deposit semantics.
    receive() external payable {}
}
