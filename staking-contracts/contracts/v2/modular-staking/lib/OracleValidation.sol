// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

/// @title OracleValidation - shared beacon report sanity-check helpers
/// @notice Pure/view validation functions used by OracleAdapter and
///         QuorumOracleAdapter.  All state is passed explicitly so the
///         library has no storage dependencies.
///
///         Errors are declared here so both adapters share the same
///         revert selectors.
library OracleValidation {
    // ── Errors ────────────────────────────────────────────────────────────────
    error StaleReport(uint256 reportAge, uint256 maxAge);
    error BalanceDriftTooHigh(uint256 actual, uint256 max);
    error SlashTooLarge(uint256 actual, uint256 max);
    error FutureReportTimestamp(uint256 reportTimestamp, uint256 currentTimestamp);
    error InvalidBeaconReportTuple(uint256 beaconValidators, uint256 beaconBalance);
    error NonMonotonicReportTimestamp(uint256 reportTimestamp, uint256 lastReportTimestamp);
    error ReportTooFrequent(uint256 earliestNextReportTime, uint256 currentTime);

    // ── Helpers ───────────────────────────────────────────────────────────────

    /// @notice Validate beacon report tuple integrity:
    ///         validators == 0 implies balance must also be 0.
    function validateBeaconTuple(uint256 beaconValidators, uint256 beaconBalance) internal pure {
        if (beaconValidators == 0 && beaconBalance != 0) {
            revert InvalidBeaconReportTuple(beaconValidators, beaconBalance);
        }
    }

    /// @notice Validate report timestamp is not in the future and is
    ///         monotonically increasing vs. the last accepted report.
    /// @param reportTimestamp   Off-chain timestamp carried in the report.
    /// @param lastReportTimestamp_  Timestamp of the last accepted report
    ///                              (0 if no report has been accepted yet).
    function validateTimestamp(uint256 reportTimestamp, uint256 lastReportTimestamp_) internal view {
        if (reportTimestamp > block.timestamp) {
            revert FutureReportTimestamp(reportTimestamp, block.timestamp);
        }
        if (lastReportTimestamp_ != 0 && reportTimestamp <= lastReportTimestamp_) {
            revert NonMonotonicReportTimestamp(reportTimestamp, lastReportTimestamp_);
        }
    }

    /// @notice Validate minimum time elapsed since the last accepted report.
    /// @param lastReportTime_           block.timestamp of last accepted report (0 = no prior report).
    /// @param minReportIntervalSeconds_ Minimum gap required between reports (0 = no gate).
    function validateReportInterval(uint256 lastReportTime_, uint256 minReportIntervalSeconds_) internal view {
        if (lastReportTime_ != 0 && minReportIntervalSeconds_ != 0) {
            uint256 earliest = lastReportTime_ + minReportIntervalSeconds_;
            if (block.timestamp < earliest) {
                revert ReportTooFrequent(earliest, block.timestamp);
            }
        }
    }

    /// @notice Validate the report is not too old (staleness check).
    /// @param reportTimestamp      Off-chain timestamp of the report.
    /// @param maxStalenessSeconds_ Maximum age accepted.
    function validateStaleness(uint256 reportTimestamp, uint256 maxStalenessSeconds_) internal view {
        // Underflow-safe: clamp age to 0 when reportTimestamp is ahead of block time
        // (already caught by validateTimestamp, but guards against edge cases in tests).
        uint256 reportAge = block.timestamp > reportTimestamp ? block.timestamp - reportTimestamp : 0;
        if (reportAge > maxStalenessSeconds_) {
            revert StaleReport(reportAge, maxStalenessSeconds_);
        }
    }

    /// @notice Validate per-validator balance drift is within bounds.
    /// @param beaconValidators     Number of validators in the new report.
    /// @param beaconBalance        Sum of balances in the new report (wei).
    /// @param lastBeaconValidators_ Validator count from the last accepted report.
    /// @param lastBeaconBalance_    Balance sum from the last accepted report (wei).
    /// @param maxDriftBps_         Maximum allowed per-validator gain in basis points.
    function validateDrift(
        uint256 beaconValidators,
        uint256 beaconBalance,
        uint256 lastBeaconValidators_,
        uint256 lastBeaconBalance_,
        uint256 maxDriftBps_
    ) internal pure {
        if (lastBeaconValidators_ > 0 && beaconValidators > 0) {
            uint256 prevAvg = lastBeaconBalance_ / lastBeaconValidators_;
            uint256 newAvg = beaconBalance / beaconValidators;

            if (prevAvg > 0 && newAvg > prevAvg) {
                uint256 gainBps = ((newAvg - prevAvg) * 10000) / prevAvg;
                if (gainBps > maxDriftBps_) revert BalanceDriftTooHigh(gainBps, maxDriftBps_);
            }
        }
    }

    /// @notice Validate that a slash event did not exceed the per-report cap.
    /// @param beaconBalance        New total beacon balance (wei).
    /// @param lastBeaconBalance_   Prior total beacon balance (wei).
    /// @param maxSlashBps_         Maximum allowed balance drop in basis points.
    function validateSlashGuard(
        uint256 beaconBalance,
        uint256 lastBeaconBalance_,
        uint256 maxSlashBps_
    ) internal pure {
        if (lastBeaconBalance_ > 0 && beaconBalance < lastBeaconBalance_) {
            uint256 lossBps = ((lastBeaconBalance_ - beaconBalance) * 10000) / lastBeaconBalance_;
            if (lossBps > maxSlashBps_) revert SlashTooLarge(lossBps, maxSlashBps_);
        }
    }
}
