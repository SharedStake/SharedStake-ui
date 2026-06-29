// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2 <0.9.0;

import {Properties} from "../Properties.sol";
import {vm} from "../utils/Hevm.sol";

abstract contract OldVeth2WithdrawalQueueHandler is Properties {
    function oldVeth2WithdrawalQueue_requestWithdrawal_clamped(uint256 actorSeed, uint256 amountSeed) public {
        address selected = selectActor(actorSeed);
        uint256 balance = oldVeth2.balanceOf(selected);
        if (balance < MIN_WITHDRAWAL) return;

        uint256 maxAmount = balance < MAX_HANDLER_WITHDRAWAL ? balance : MAX_HANDLER_WITHDRAWAL;
        uint256 amount = clampBetween(amountSeed, MIN_WITHDRAWAL, maxAmount);

        vm.prank(selected);
        oldVeth2WithdrawalQueue.requestWithdrawal(amount);
        ghosts.oldVeth2Requests += 1;
    }

    function oldVeth2WithdrawalQueue_finalize_clamped(uint256 lastRequestSeed) public {
        _oldVeth2WithdrawalQueue_finalize(lastRequestSeed, 0);
    }

    function oldVeth2WithdrawalQueue_finalizeWithRefund_clamped(
        uint256 lastRequestSeed,
        uint256 refundSeed
    ) public {
        uint256 refund = clampBetween(refundSeed, 1 wei, 1 ether);
        _oldVeth2WithdrawalQueue_finalize(lastRequestSeed, refund);
    }

    function oldVeth2WithdrawalQueue_cancelWithdrawal_clamped(uint256 requestSeed) public {
        uint256 nextId = oldVeth2WithdrawalQueue.nextRequestId();
        if (nextId <= 1) return;

        uint256 requestId = clampBetween(requestSeed, 1, nextId - 1);
        (
            address owner,
            ,
            ,
            bool finalized,
            bool claimed,
            bool canceled
        ) = _oldVeth2Request(requestId);
        if (owner == address(0) || finalized || claimed || canceled) return;

        vm.prank(owner);
        oldVeth2WithdrawalQueue.cancelWithdrawal(requestId);
        ghosts.oldVeth2CanceledRequests += 1;
    }

    function oldVeth2WithdrawalQueue_claimWithdrawal_clamped(uint256 requestSeed) public {
        uint256 nextId = oldVeth2WithdrawalQueue.nextRequestId();
        if (nextId <= 1) return;

        uint256 requestId = clampBetween(requestSeed, 1, nextId - 1);
        (
            address owner,
            ,
            ,
            bool finalized,
            bool claimed,
            bool canceled
        ) = _oldVeth2Request(requestId);
        if (owner == address(0) || !finalized || claimed || canceled) return;

        vm.prank(owner);
        oldVeth2WithdrawalQueue.claimWithdrawal(requestId);
        ghosts.oldVeth2ClaimedRequests += 1;
    }

    function oldVeth2WithdrawalQueue_withdrawRefund() public {
        if (oldVeth2WithdrawalQueue.pendingRefunds(gov) == 0) return;
        vm.prank(gov);
        oldVeth2WithdrawalQueue.withdrawRefund();
    }

    function _oldVeth2WithdrawalQueue_finalize(uint256 lastRequestSeed, uint256 extraEth) internal {
        uint256 nextId = oldVeth2WithdrawalQueue.nextRequestId();
        uint256 fromId = oldVeth2WithdrawalQueue.lastFinalizedRequestId() + 1;
        if (fromId >= nextId) return;

        uint256 lastRequestId = clampBetween(lastRequestSeed, fromId, nextId - 1);
        uint256 required;
        for (uint256 id = fromId; id <= lastRequestId; id++) {
            (, , uint256 ethAmount, , , bool canceled) = _oldVeth2Request(id);
            if (!canceled) required += ethAmount;
        }

        vm.deal(gov, required + extraEth);
        vm.prank(gov);
        oldVeth2WithdrawalQueue.finalize{value: required + extraEth}(lastRequestId);
        ghosts.oldVeth2FinalizedRequests += lastRequestId - fromId + 1;
    }

    function _oldVeth2Request(
        uint256 requestId
    )
        internal
        view
        returns (
            address owner,
            uint256 vEth2Amount,
            uint256 ethAmount,
            bool finalized,
            bool claimed,
            bool canceled
        )
    {
        uint256 requestedAt;
        (owner, vEth2Amount, ethAmount, requestedAt, finalized, claimed, canceled) =
            oldVeth2WithdrawalQueue.requests(requestId);
        requestedAt;
    }
}
