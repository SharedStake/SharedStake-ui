// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IReportable} from "./interfaces/IReportable.sol";
import {Errors} from "../lib/Errors.sol";

/// @title OracleAdapter - beacon chain report ingestion with sanity gates
/// @notice Accepts signed reports from authorized submitters and forwards valid
///         ones to a target implementing IReportable.
///
/// Safety rules enforced before forwarding:
///   1. Staleness   — report must arrive within `maxStalenessSeconds` of now.
///   2. Drift       — beacon balance change (per validator) must not exceed `maxDriftBps` bps.
///   3. Slash guard — balance cannot drop more than `maxSlashBps` bps per report.
///
/// @dev Multiple submitters are supported so oracle infra can be redundant.
///      A quorum mechanism (requiring M-of-N) is intentionally deferred to Phase 2.
contract OracleAdapter is AccessControl {
    // ── Roles ─────────────────────────────────────────────────────────────────
    bytes32 public constant GOV = keccak256("GOV");
    bytes32 public constant SUBMITTER = keccak256("SUBMITTER");

    // ── Config ────────────────────────────────────────────────────────────────
    IReportable public immutable REPORT_TARGET;

    uint256 public constant MIN_DRIFT_BPS = 100; // 1% minimum drift cap (cannot be disabled)
    uint256 public constant MIN_SLASH_BPS = 50; // 0.5% minimum slash cap (cannot be disabled)

    uint256 public maxStalenessSeconds = 6 hours;
    uint256 public maxDriftBps = 1000; // 10% per-validator balance change cap
    uint256 public maxSlashBps = 500; // 5% total-balance slash cap per report
    uint256 public minReportIntervalSeconds = 1 hours;

    // ── State ─────────────────────────────────────────────────────────────────
    uint256 public lastReportTime;
    uint256 public lastReportTimestamp;
    uint256 public lastBeaconBalance;
    uint256 public lastBeaconValidators;

    // ── Events ────────────────────────────────────────────────────────────────
    event ReportSubmitted(
        address indexed submitter,
        uint256 beaconValidators,
        uint256 beaconBalance,
        uint256 timestamp
    );
    event ReportRejected(address indexed submitter, string reason);
    event MaxStalenessSet(uint256 seconds_);
    event MaxDriftSet(uint256 bps);
    event MaxSlashSet(uint256 bps);
    event MinReportIntervalSet(uint256 seconds_);

    // ── Errors ────────────────────────────────────────────────────────────────
    error StaleReport(uint256 reportAge, uint256 maxAge);
    error BalanceDriftTooHigh(uint256 actual, uint256 max);
    error SlashTooLarge(uint256 actual, uint256 max);
    error BelowMinimum(uint256 value, uint256 minimum);
    error FutureReportTimestamp(uint256 reportTimestamp, uint256 currentTimestamp);
    error InvalidBeaconReportTuple(uint256 beaconValidators, uint256 beaconBalance);
    error NonMonotonicReportTimestamp(uint256 reportTimestamp, uint256 lastReportTimestamp);
    error ReportTooFrequent(uint256 earliestNextReportTime, uint256 currentTime);

    constructor(address reportTarget, address gov) {
        if (reportTarget == address(0) || gov == address(0)) revert Errors.ZeroAddress();
        REPORT_TARGET = IReportable(reportTarget);
        _grantRole(DEFAULT_ADMIN_ROLE, gov);
        _grantRole(GOV, gov);
    }

    // ── Report submission ─────────────────────────────────────────────────────

    /// @notice Validate beacon report tuple integrity
    function _validateBeaconTuple(uint256 beaconValidators, uint256 beaconBalance) private pure {
        if (beaconValidators == 0 && beaconBalance != 0) {
            revert InvalidBeaconReportTuple(beaconValidators, beaconBalance);
        }
    }

    /// @notice Validate report timestamp is not in future and is monotonic
    function _validateTimestamp(uint256 reportTimestamp) private view {
        if (reportTimestamp > block.timestamp) {
            revert FutureReportTimestamp(reportTimestamp, block.timestamp);
        }
        if (lastReportTimestamp != 0 && reportTimestamp <= lastReportTimestamp) {
            revert NonMonotonicReportTimestamp(reportTimestamp, lastReportTimestamp);
        }
    }

    /// @notice Validate minimum report interval
    function _validateReportInterval() private view {
        if (lastReportTime != 0 && minReportIntervalSeconds != 0) {
            uint256 earliest = lastReportTime + minReportIntervalSeconds;
            if (block.timestamp < earliest) {
                revert ReportTooFrequent(earliest, block.timestamp);
            }
        }
    }

    /// @notice Validate report staleness
    function _validateStaleness(uint256 reportTimestamp) private view {
        uint256 reportAge = block.timestamp > reportTimestamp ? block.timestamp - reportTimestamp : 0;
        if (reportAge > maxStalenessSeconds) {
            revert StaleReport(reportAge, maxStalenessSeconds);
        }
    }

    /// @notice Validate balance drift per validator
    function _validateDrift(uint256 beaconValidators, uint256 beaconBalance) private view {
        if (lastBeaconValidators > 0 && beaconValidators > 0) {
            uint256 prevAvg = lastBeaconBalance / lastBeaconValidators;
            uint256 newAvg = beaconBalance / beaconValidators;

            if (prevAvg > 0 && newAvg > prevAvg) {
                uint256 gainBps = ((newAvg - prevAvg) * 10000) / prevAvg;
                if (gainBps > maxDriftBps) revert BalanceDriftTooHigh(gainBps, maxDriftBps);
            }
        }
    }

    /// @notice Validate slash guard
    function _validateSlashGuard(uint256 beaconBalance) private view {
        if (lastBeaconBalance > 0 && beaconBalance < lastBeaconBalance) {
            uint256 lossBps = ((lastBeaconBalance - beaconBalance) * 10000) / lastBeaconBalance;
            if (lossBps > maxSlashBps) revert SlashTooLarge(lossBps, maxSlashBps);
        }
    }

    /// @notice Submit a beacon chain report.
    ///         Reverts if any sanity check fails.
    /// @param beaconValidators  Number of active validators being reported.
    /// @param beaconBalance     Sum of validator balances in wei.
    /// @param reportTimestamp   Off-chain timestamp of the report (for staleness check).
    function submitReport(
        uint256 beaconValidators,
        uint256 beaconBalance,
        uint256 reportTimestamp
    ) external onlyRole(SUBMITTER) {
        _validateBeaconTuple(beaconValidators, beaconBalance);
        _validateTimestamp(reportTimestamp);
        _validateReportInterval();
        _validateStaleness(reportTimestamp);
        _validateDrift(beaconValidators, beaconBalance);
        _validateSlashGuard(beaconBalance);

        // All checks pass — update state and forward to report target.
        lastBeaconBalance = beaconBalance;
        lastBeaconValidators = beaconValidators;
        lastReportTime = block.timestamp;
        lastReportTimestamp = reportTimestamp;

        REPORT_TARGET.reportBeacon(beaconValidators, beaconBalance);

        emit ReportSubmitted(msg.sender, beaconValidators, beaconBalance, reportTimestamp);
    }

    // ── Config (GOV only) ─────────────────────────────────────────────────────

    function setMaxStaleness(uint256 seconds_) external onlyRole(GOV) {
        maxStalenessSeconds = seconds_;
        emit MaxStalenessSet(seconds_);
    }

    function setMaxDriftBps(uint256 bps) external onlyRole(GOV) {
        if (bps < MIN_DRIFT_BPS) revert BelowMinimum(bps, MIN_DRIFT_BPS);
        maxDriftBps = bps;
        emit MaxDriftSet(bps);
    }

    function setMaxSlashBps(uint256 bps) external onlyRole(GOV) {
        if (bps < MIN_SLASH_BPS) revert BelowMinimum(bps, MIN_SLASH_BPS);
        maxSlashBps = bps;
        emit MaxSlashSet(bps);
    }

    /// @notice Set minimum interval between accepted reports. 0 disables cadence gating.
    function setMinReportInterval(uint256 seconds_) external onlyRole(GOV) {
        minReportIntervalSeconds = seconds_;
        emit MinReportIntervalSet(seconds_);
    }

    function addSubmitter(address submitter) external onlyRole(GOV) {
        if (submitter == address(0)) revert Errors.ZeroAddress();
        grantRole(SUBMITTER, submitter);
    }

    function removeSubmitter(address submitter) external onlyRole(GOV) {
        revokeRole(SUBMITTER, submitter);
    }
}
