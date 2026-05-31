// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

interface IClaimableQueue {
    function claimWithdrawal(uint256 requestId, address payable recipient) external;
    function requestWithdrawals(uint256[] calldata amounts, address owner)
        external
        returns (uint256[] memory requestIds);
}

interface IStTokenLite {
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

/// @title ReentrantClaimer
/// @notice Test-only adversarial contract that attempts to call
///         `claimWithdrawal` again from inside its `receive()` hook.
///         Used to exercise WithdrawalQueueV2's ReentrancyGuard.
contract ReentrantClaimer {
    IClaimableQueue public immutable QUEUE;
    uint256 public requestId;
    bool public attempted;

    constructor(address queue) {
        QUEUE = IClaimableQueue(queue);
    }

    /// @notice Set the request id that this contract should try to re-claim
    ///         from inside the ETH-receive hook.
    function setRequestId(uint256 id) external {
        requestId = id;
    }

    /// @notice Initiate the legitimate first claim. The reentrancy attempt
    ///         happens inside `receive()` when the queue forwards ETH.
    function attack(uint256 id) external {
        requestId = id;
        QUEUE.claimWithdrawal(id, payable(address(this)));
    }

    receive() external payable {
        if (!attempted && requestId != 0) {
            attempted = true;
            // This call must revert with ReentrancyGuardReentrantCall, surfaced
            // by the queue's nonReentrant modifier. We swallow the revert via
            // try/catch so the outer claim still progresses far enough for the
            // test to inspect state — but if the guard is missing the second
            // claim succeeds and `attempted` flips, which the test asserts on.
            try QUEUE.claimWithdrawal(requestId, payable(address(this))) {
                // If we reach here, the guard failed. Surface loudly.
                revert("REENTRANCY_GUARD_FAILED");
            } catch {
                // Expected: nonReentrant reverts the inner call.
            }
        }
    }
}
