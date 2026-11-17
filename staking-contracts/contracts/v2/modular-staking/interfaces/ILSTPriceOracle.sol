// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

/// @title ILSTPriceOracle - price oracle for an LST (e.g. stETH, rETH)
/// @notice Returns the ETH equivalent of an LST balance. Used by `LSTWrapModule` to
///         compute the stToken share entitlement for an LST deposit and the LST owed
///         on unwrap. Implementations must be view-only and deterministic.
///
///         Reference implementation `StEthPriceOracle.sol` reads stETH's per-share
///         pooled ETH directly from the stETH contract.
interface ILSTPriceOracle {
    /// @notice ETH value (wei) of `lstAmount` LST tokens at current price.
    function getEthValue(uint256 lstAmount) external view returns (uint256);

    /// @notice Inverse: how many LST tokens correspond to `ethAmount` wei.
    function getLstValue(uint256 ethAmount) external view returns (uint256);

    /// @notice Unix timestamp of the most recent price update the oracle relied on.
    /// @dev Consumers compare `block.timestamp - lastUpdated()` against a max age to
    ///      reject stale prices. Live-read oracles (e.g. ones reading from a canonical
    ///      LST contract each call) may return `block.timestamp` since freshness is
    ///      sourced upstream rather than via push updates.
    function lastUpdated() external view returns (uint256);
}
