// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

/// @title ShareMath - precision share accounting for the SharedStake V2 staking core
/// @notice All arithmetic uses 256-bit integers; Solidity 0.8 reverts on overflow.
///         Rounding policy: share minting rounds DOWN (protects pool);
///         pooled-ETH-by-shares rounds DOWN (protects pool on redemption).
library ShareMath {
    error InvalidBootstrapState(uint256 totalShares, uint256 totalPooledEth);

    /// @dev Bootstrap: first depositor receives shares 1:1 with wei.
    ///      Prevents the classic "first deposit inflation" attack because the
    ///      attacker cannot make totalPooledEth >> totalShares before any shares exist.
    function getSharesByPooledEth(
        uint256 ethAmount,
        uint256 totalShares,
        uint256 totalPooledEth
    ) internal pure returns (uint256) {
        if (totalPooledEth == 0) {
            if (totalShares != 0) {
                revert InvalidBootstrapState(totalShares, totalPooledEth);
            }
            // Bootstrap: 1 wei => 1 share
            return ethAmount;
        }
        // Rounds DOWN: minter receives floor(shares). Pool balance never overstated.
        return (ethAmount * totalShares) / totalPooledEth;
    }

    function getPooledEthByShares(
        uint256 sharesAmount,
        uint256 totalShares,
        uint256 totalPooledEth
    ) internal pure returns (uint256) {
        if (totalShares == 0) {
            return 0;
        }
        // Rounds DOWN: redeemer receives floor(eth). Pool never drained beyond entitlement.
        return (sharesAmount * totalPooledEth) / totalShares;
    }

    /// @notice Exchange rate: how many wei one share is worth.
    ///         Returns 0 when no shares exist (undefined until first deposit).
    function sharePrice(uint256 totalShares, uint256 totalPooledEth) internal pure returns (uint256) {
        if (totalShares == 0) return 0;
        return (totalPooledEth * 1e18) / totalShares;
    }
}
