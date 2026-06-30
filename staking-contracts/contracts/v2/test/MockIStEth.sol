// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/// @title MockIStEth
/// @notice Minimal mock of stETH interface for testing StEthPriceOracle.
///         Identity mapping: 1 share = 1 wei, so round-trip is exact.
contract MockIStEth {
    function getPooledEthByShares(uint256 sharesAmount) external pure returns (uint256) {
        return sharesAmount;
    }

    function getSharesByPooledEth(uint256 ethAmount) external pure returns (uint256) {
        return ethAmount;
    }
}
