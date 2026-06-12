// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IReportable} from "./interfaces/IReportable.sol";
import {Errors} from "../lib/Errors.sol";
import {OracleValidation} from "./lib/OracleValidation.sol";

/// @title QuorumOracleAdapter - threshold-consensus beacon report adapter
/// @notice Accepts report votes from authorized submitters and forwards the
///         report to an IReportable target once quorum is reached and sanity
///         checks pass.
contract QuorumOracleAdapter is AccessControl {
    // ── Roles ─────────────────────────────────────────────────────────────────
    bytes32 public constant GOV = keccak256("GOV");
    bytes32 public constant SUBMITTER = keccak256("SUBMITTER");

    // ── Config ────────────────────────────────────────────────────────────────
    IReportable public immutable REPORT_TARGET;
    uint256 public quorum;
    uint256 public submitterCount;

    uint256 public constant MIN_DRIFT_BPS = 100; // 1% minimum drift cap (cannot be disabled)
    uint256 public constant MIN_SLASH_BPS = 50; // 0.5% minimum slash cap (cannot be disabled)
    uint256 public constant MIN_REPORT_TIMESTAMP_AGE = 12; // 1 Ethereum beacon slot = 12 s

    uint256 public maxStalenessSeconds = 6 hours;
    uint256 public maxDriftBps = 1000; // 10% per-validator balance change cap
    uint256 public maxSlashBps = 500; // 5% total-balance slash cap per report
    uint256 public minReportIntervalSeconds = 1 hours;

    // ── State ─────────────────────────────────────────────────────────────────
    uint256 public lastReportTime;
    uint256 public lastReportTimestamp;
    uint256 public lastBeaconBalance;
    uint256 public lastBeaconValidators;

    // Incrementing nonce invalidates all in-flight votes. Allows GOV to clear fragmented
    // vote state caused by a malicious or faulty submitter (M1 fix).
    uint256 public voteNonce;

    mapping(bytes32 => uint256) public reportVotes;
    mapping(bytes32 => bool) public reportFinalized;
    mapping(bytes32 => mapping(address => bool)) public hasVoted;

    // ── Events ────────────────────────────────────────────────────────────────
    event VoteSubmitted(
        bytes32 indexed reportHash,
        address indexed submitter,
        uint256 beaconValidators,
        uint256 beaconBalance,
        uint256 reportTimestamp,
        uint256 votes,
        uint256 quorum
    );
    event ReportFinalized(
        bytes32 indexed reportHash,
        uint256 beaconValidators,
        uint256 beaconBalance,
        uint256 reportTimestamp,
        uint256 votes
    );
    event EmergencyReport(address indexed gov, uint256 beaconValidators, uint256 beaconBalance);
    event SubmitterAdded(address indexed submitter);
    event SubmitterRemoved(address indexed submitter);
    event QuorumSet(uint256 quorum);
    event MaxStalenessSet(uint256 seconds_);
    event MaxDriftSet(uint256 bps);
    event MaxSlashSet(uint256 bps);
    event MinReportIntervalSet(uint256 seconds_);
    event VotesCleared(uint256 indexed newNonce);

    // ── Errors ────────────────────────────────────────────────────────────────
    error InvalidQuorum(uint256 provided, uint256 submitterCount_);
    error DuplicateVote(bytes32 reportHash, address submitter);
    error ReportAlreadyFinalized(bytes32 reportHash);
    error BelowMinimum(uint256 value, uint256 minimum);

    // Re-exported from OracleValidation library so these appear in the ABI and
    // off-chain tools (ethers.js / viem) can decode oracle revert reasons.
    error StaleReport(uint256 reportAge, uint256 maxAge);
    error BalanceDriftTooHigh(uint256 actual, uint256 max);
    error SlashTooLarge(uint256 actual, uint256 max);
    error FutureReportTimestamp(uint256 reportTimestamp, uint256 currentTimestamp);
    error InvalidBeaconReportTuple(uint256 beaconValidators, uint256 beaconBalance);
    error NonMonotonicReportTimestamp(uint256 reportTimestamp, uint256 lastReportTimestamp);
    error ReportTooFrequent(uint256 earliestNextReportTime, uint256 currentTime);
    error ReportTimestampTooFresh(uint256 reportTimestamp, uint256 blockTimestamp, uint256 minAge);

    constructor(address reportTarget, address gov, uint256 initialQuorum) {
        if (reportTarget == address(0) || gov == address(0)) revert Errors.ZeroAddress();
        if (initialQuorum == 0) revert InvalidQuorum(initialQuorum, 0);

        REPORT_TARGET = IReportable(reportTarget);
        quorum = initialQuorum;

        _grantRole(DEFAULT_ADMIN_ROLE, gov);
        _grantRole(GOV, gov);
    }

    // ── Report voting / finalization ─────────────────────────────────────────

    /// @notice Submit a vote for a report payload.
    /// @dev A payload is uniquely identified by (beaconValidators, beaconBalance, reportTimestamp).
    ///      The same submitter cannot vote twice for the same payload.
    function submitReport(
        uint256 beaconValidators,
        uint256 beaconBalance,
        uint256 reportTimestamp
    ) external onlyRole(SUBMITTER) {
        bytes32 reportHash = keccak256(abi.encode(voteNonce, beaconValidators, beaconBalance, reportTimestamp));

        if (reportFinalized[reportHash]) revert ReportAlreadyFinalized(reportHash);
        if (hasVoted[reportHash][msg.sender]) revert DuplicateVote(reportHash, msg.sender);
        _enforceSanityChecks(beaconValidators, beaconBalance, reportTimestamp);

        hasVoted[reportHash][msg.sender] = true;
        uint256 votes = ++reportVotes[reportHash];

        emit VoteSubmitted(reportHash, msg.sender, beaconValidators, beaconBalance, reportTimestamp, votes, quorum);

        if (votes < quorum) return;

        reportFinalized[reportHash] = true;
        lastBeaconBalance = beaconBalance;
        lastBeaconValidators = beaconValidators;
        lastReportTime = block.timestamp;
        lastReportTimestamp = reportTimestamp;

        REPORT_TARGET.reportBeacon(beaconValidators, beaconBalance);

        emit ReportFinalized(reportHash, beaconValidators, beaconBalance, reportTimestamp, votes);
    }

    function _enforceSanityChecks(
        uint256 beaconValidators,
        uint256 beaconBalance,
        uint256 reportTimestamp
    ) internal view {
        OracleValidation.validateBeaconTuple(beaconValidators, beaconBalance);
        OracleValidation.validateTimestamp(reportTimestamp, lastReportTimestamp);
        OracleValidation.validateReportInterval(lastReportTime, minReportIntervalSeconds);
        if (block.timestamp - reportTimestamp < MIN_REPORT_TIMESTAMP_AGE) {
            revert ReportTimestampTooFresh(reportTimestamp, block.timestamp, MIN_REPORT_TIMESTAMP_AGE);
        }
        OracleValidation.validateStaleness(reportTimestamp, maxStalenessSeconds);
        OracleValidation.validateDrift(beaconValidators, beaconBalance, lastBeaconValidators, lastBeaconBalance, maxDriftBps);
        OracleValidation.validateSlashGuard(beaconBalance, lastBeaconBalance, maxSlashBps);
    }

    // ── Config (GOV only) ─────────────────────────────────────────────────────

    function setQuorum(uint256 newQuorum) external onlyRole(GOV) {
        if (newQuorum == 0 || newQuorum > submitterCount) {
            revert InvalidQuorum(newQuorum, submitterCount);
        }
        quorum = newQuorum;
        emit QuorumSet(newQuorum);
    }

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

    /// @notice Invalidate all in-flight votes by incrementing the nonce.
    /// @dev Use when a malicious or faulty submitter has fragmented vote state with
    ///      unreachable hashes. All pending votes become orphaned; submitters must re-vote
    ///      under the new nonce.
    function clearVotes() external onlyRole(GOV) {
        uint256 newNonce = ++voteNonce;
        emit VotesCleared(newNonce);
    }

    function addSubmitter(address submitter) external onlyRole(GOV) {
        if (submitter == address(0)) revert Errors.ZeroAddress();
        if (!hasRole(SUBMITTER, submitter)) {
            grantRole(SUBMITTER, submitter);
            submitterCount += 1;
            emit SubmitterAdded(submitter);
        }
    }

    function removeSubmitter(address submitter) external onlyRole(GOV) {
        if (!hasRole(SUBMITTER, submitter)) return;

        uint256 newCount = submitterCount - 1;
        if (quorum > newCount) revert InvalidQuorum(quorum, newCount);

        revokeRole(SUBMITTER, submitter);
        submitterCount = newCount;
        emit SubmitterRemoved(submitter);
    }

    /// @notice Emergency report submission bypassing quorum (GOV only).
    /// @dev GOV can directly submit a report bypassing quorum, but only via the 7-day timelock.
    ///      This is the break-glass path if all submitters are lost.
    /// @param newBeaconValidators Number of validators being reported.
    /// @param newBeaconBalance Sum of all validator balances (in wei).
    function emergencySubmitReport(
        uint256 newBeaconValidators,
        uint256 newBeaconBalance,
        uint256 reportTimestamp
    ) external onlyRole(GOV) {
        // Break-glass path when all submitters are lost. Still enforces the same
        // oracle sanity bounds (drift, slash, staleness) — only quorum is bypassed.
        _enforceSanityChecks(newBeaconValidators, newBeaconBalance, reportTimestamp);

        // Update state so subsequent normal reports can pass the monotonic guard.
        lastBeaconBalance = newBeaconBalance;
        lastBeaconValidators = newBeaconValidators;
        lastReportTime = block.timestamp;
        lastReportTimestamp = reportTimestamp;

        REPORT_TARGET.reportBeacon(newBeaconValidators, newBeaconBalance);
        emit EmergencyReport(msg.sender, newBeaconValidators, newBeaconBalance);
    }
}
