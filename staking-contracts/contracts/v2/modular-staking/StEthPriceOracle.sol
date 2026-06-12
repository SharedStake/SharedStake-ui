// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {ILSTPriceOracle} from "./interfaces/ILSTPriceOracle.sol";
import {Errors} from "../lib/Errors.sol";

/// @title StEthPriceOracle - reference ILSTPriceOracle for stETH
/// @notice Reads stETH's per-share pooled ETH directly from the source protocol. Since
///         stETH balances ARE ETH-denominated (rebasing), the price function is the
///         identity 1:1 in normal conditions; we still route through the stETH contract
///         so this oracle can be swapped for a wstETH-style one without touching
///         consumers.
interface IStEth {
    function getPooledEthByShares(uint256 sharesAmount) external view returns (uint256);
    function getSharesByPooledEth(uint256 ethAmount) external view returns (uint256);
}

interface AggregatorV3Interface {
    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

contract StEthPriceOracle is ILSTPriceOracle {
    IStEth public immutable ST_ETH;
    AggregatorV3Interface public immutable CHAINLINK_FEED;

    // Chainlink stETH/ETH feed on mainnet: 0x86392dC19c0b719886221c78AB11eb8Cf5c52812
    constructor(address stEth, address chainlinkFeed) {
        if (stEth == address(0)) revert Errors.ZeroAddress();
        if (chainlinkFeed == address(0)) revert Errors.ZeroAddress();
        ST_ETH = IStEth(stEth);
        CHAINLINK_FEED = AggregatorV3Interface(chainlinkFeed);
    }

    /// @inheritdoc ILSTPriceOracle
    /// @dev For stETH: 1 stETH ≈ 1 ETH (rebasing). The LST balance IS the ETH backing
    ///      net of slashings. Returning the LST amount as ETH equivalent is correct
    ///      for stETH-denominated holdings.
    function getEthValue(uint256 lstAmount) external view override returns (uint256) {
        // Round-trip via shares to reflect the precise current rebase rate.
        uint256 shares = ST_ETH.getSharesByPooledEth(lstAmount);
        return ST_ETH.getPooledEthByShares(shares);
    }

    /// @inheritdoc ILSTPriceOracle
    function getLstValue(uint256 ethAmount) external view override returns (uint256) {
        // Same round-trip in the inverse direction.
        uint256 shares = ST_ETH.getSharesByPooledEth(ethAmount);
        return ST_ETH.getPooledEthByShares(shares);
    }

    /// @inheritdoc ILSTPriceOracle
    /// @dev Returns the Chainlink feed's updatedAt timestamp for staleness checks.
    ///      NOTE: Chainlink is used here ONLY for its update cadence (staleness signal),
    ///      NOT for its price answer. The actual ETH value is sourced entirely from Lido's
    ///      own share-math (getPooledEthByShares). This asymmetric trust is intentional:
    ///      Lido's oracle is the authoritative price source; Chainlink provides an
    ///      independent heartbeat so consumers can detect if neither oracle has reported
    ///      recently. A stale Chainlink timestamp with a fresh Lido oracle still reverts
    ///      under LSTWrapModule's maxOracleAge guard — callers should set maxOracleAge
    ///      to a value that accounts for both Chainlink's round interval and Lido's oracle cadence.
    function lastUpdated() external view override returns (uint256) {
        (, , , uint256 updatedAt, ) = CHAINLINK_FEED.latestRoundData();
        return updatedAt;
    }
}
