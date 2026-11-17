// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";

/// @title GovernanceTimelock — timelocked executor for SharedStake protocol governance
/// @notice Wraps OpenZeppelin TimelockController with a 48-hour default delay.
///         This contract holds the GOV role on all protocol contracts.
///         All privileged parameter changes must flow through Governor → Timelock.
///
/// Role model:
///   PROPOSER  — Governor contract (can queue proposals)
///   EXECUTOR  — Governor + guardian multisig (can execute after delay)
///   CANCELLER — Guardian multisig (can cancel malicious proposals)
///
/// Emergency path:
///   GUARDIAN can still `pause()` directly on all contracts without timelock.
///   This ensures fast incident response while keeping parameter changes slow.
contract GovernanceTimelock is TimelockController {
    /// @param minDelay Initial delay in seconds (e.g., 48 hours = 172800).
    /// @param proposers Addresses that can schedule operations (Governor).
    /// @param executors Addresses that can execute operations (Governor + guardian).
    /// @param admin Admin address for setup (renounced after wiring).
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {}
}
