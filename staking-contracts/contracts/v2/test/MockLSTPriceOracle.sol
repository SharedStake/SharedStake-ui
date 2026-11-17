// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ILSTPriceOracle} from "../modular-staking/interfaces/ILSTPriceOracle.sol";

/// @title MockLSTPriceOracle
/// @notice Test-only oracle that lets a test set the ETH-per-LST exchange rate.
///         Used to model peg deviations and price-oracle manipulation scenarios.
contract MockLSTPriceOracle is ILSTPriceOracle {
    /// @notice Wei of ETH represented by 1e18 of the LST token.
    uint256 public ethPerLst;

    /// @notice Timestamp returned by `lastUpdated()`. Zero means "live" — return
    ///         `block.timestamp` (oracle is always fresh). A non-zero value
    ///         freezes the reported update time so tests can simulate staleness.
    uint256 public lastUpdatedOverride;

    constructor(uint256 _ethPerLst) {
        ethPerLst = _ethPerLst;
    }

    function setEthPerLst(uint256 _ethPerLst) external {
        ethPerLst = _ethPerLst;
    }

    /// @notice Test hook: pin the value `lastUpdated()` returns. Pass `0` to
    ///         restore live behavior (returns `block.timestamp`).
    function setLastUpdated(uint256 ts) external {
        lastUpdatedOverride = ts;
    }

    /// @inheritdoc ILSTPriceOracle
    function getEthValue(uint256 lstAmount) external view override returns (uint256) {
        return (lstAmount * ethPerLst) / 1e18;
    }

    /// @inheritdoc ILSTPriceOracle
    function getLstValue(uint256 ethAmount) external view override returns (uint256) {
        if (ethPerLst == 0) return 0;
        return (ethAmount * 1e18) / ethPerLst;
    }

    /// @inheritdoc ILSTPriceOracle
    function lastUpdated() external view override returns (uint256) {
        return lastUpdatedOverride == 0 ? block.timestamp : lastUpdatedOverride;
    }
}
