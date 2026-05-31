// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

/// @title IReportable - target of an oracle beacon report
/// @notice Implemented by both legacy `StakingCore` and the new `ValidatorModule`.
///         OracleAdapter is generic — it forwards a validated report through this
///         interface, so the same adapter works with both pre- and post-router systems.
interface IReportable {
    function reportBeacon(uint256 newBeaconValidators, uint256 newBeaconBalance) external;
}
