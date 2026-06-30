// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2 <0.9.0;

import {WithdrawalQueueV2} from "contracts/v2/modular-staking/WithdrawalQueueV2.sol";
import {Properties} from "../Properties.sol";
import {vm} from "../utils/Hevm.sol";

abstract contract WithdrawalQueueV2Handler is Properties {
    function withdrawalQueueV2_requestWithdrawals_clamped(uint256 actorSeed, uint256 amount, uint256 batchSeed) public {
        address selected = selectActor(actorSeed);
        uint256 balance = stToken.balanceOf(selected);
        if (balance < MIN_WITHDRAWAL) return;
        uint256 requestable = balance < MAX_HANDLER_WITHDRAWAL ? balance : MAX_HANDLER_WITHDRAWAL;
        uint256 maxCount = requestable / MIN_WITHDRAWAL;
        if (maxCount > MAX_BATCH_WITHDRAWALS) maxCount = MAX_BATCH_WITHDRAWALS;
        uint256 count = clampBetween(batchSeed, 1, maxCount);

        uint256[] memory amounts = _splitWithdrawalAmounts(amount, count, requestable);
        vm.prank(selected);
        withdrawalQueueV2.requestWithdrawals(amounts, selected);
        ghosts.withdrawalRequests += count;
    }

    function withdrawalQueueV2_finalize_clamped(uint256 lastRequestSeed) public {
        _withdrawalQueueV2_finalize(lastRequestSeed, 0);
    }

    function withdrawalQueueV2_finalizeWithRefund_clamped(uint256 lastRequestSeed, uint256 refundSeed) public {
        uint256 refund = clampBetween(refundSeed, 1 wei, 1 ether);
        _withdrawalQueueV2_finalize(lastRequestSeed, refund);
    }

    function _withdrawalQueueV2_finalize(uint256 lastRequestSeed, uint256 extraEth) internal {
        uint256 nextId = withdrawalQueueV2.nextRequestId();
        uint256 fromId = withdrawalQueueV2.lastFinalizedRequestId() + 1;
        if (fromId >= nextId) return;
        uint256 lastRequestId = clampBetween(lastRequestSeed, fromId, nextId - 1);

        uint256 required;
        for (uint256 id = fromId; id <= lastRequestId; id++) {
            WithdrawalQueueV2.WithdrawalRequest memory req = withdrawalQueueV2.getRequest(id);
            required += req.ethAmount;
        }

        vm.deal(gov, required + extraEth);
        vm.prank(gov);
        withdrawalQueueV2.finalize{value: required + extraEth}(lastRequestId);
        ghosts.finalizedRequests += lastRequestId - fromId + 1;
    }

    function withdrawalQueueV2_claimWithdrawal_clamped(uint256 requestSeed, uint256 recipientSeed) public {
        uint256 nextId = withdrawalQueueV2.nextRequestId();
        if (nextId <= 1) return;
        uint256 requestId = clampBetween(requestSeed, 1, nextId - 1);
        WithdrawalQueueV2.WithdrawalRequest memory req = withdrawalQueueV2.getRequest(requestId);
        if (!req.finalized || req.claimed) return;

        address recipient = selectActor(recipientSeed);
        vm.prank(req.owner);
        withdrawalQueueV2.claimWithdrawal(requestId, payable(recipient));
        ghosts.claimedRequests += 1;
    }

    function withdrawalQueueV2_claimWithdrawals_clamped(
        uint256 ownerSeed,
        uint256 recipientSeed,
        uint256 maxCountSeed
    ) public {
        address owner = toActor(address(uint160(ownerSeed)));
        uint256 maxCount = clampBetween(maxCountSeed, 1, MAX_BATCH_WITHDRAWALS);
        uint256[] memory scratch = new uint256[](maxCount);
        uint256 count;
        uint256 nextId = withdrawalQueueV2.nextRequestId();

        for (uint256 id = 1; id < nextId && count < maxCount; id++) {
            WithdrawalQueueV2.WithdrawalRequest memory req = withdrawalQueueV2.getRequest(id);
            if (req.owner == owner && req.finalized && !req.claimed) {
                scratch[count] = id;
                count += 1;
            }
        }
        if (count == 0) return;

        uint256[] memory requestIds = new uint256[](count);
        for (uint256 i; i < count; i++) requestIds[i] = scratch[i];

        address recipient = selectActor(recipientSeed);
        vm.prank(owner);
        withdrawalQueueV2.claimWithdrawals(requestIds, payable(recipient));
        ghosts.claimedRequests += count;
    }

    function withdrawalQueueV2_withdrawRefund() public {
        if (withdrawalQueueV2.pendingRefunds(gov) == 0) return;
        vm.prank(gov);
        withdrawalQueueV2.withdrawRefund();
    }

    function withdrawalQueueV2_requestWithdrawals(uint256[] memory amounts, address owner) public {
        address selected = toActor(owner);
        uint256 balance = stToken.balanceOf(selected);
        if (balance < MIN_WITHDRAWAL) return;

        uint256 requestable = balance < MAX_HANDLER_WITHDRAWAL ? balance : MAX_HANDLER_WITHDRAWAL;
        uint256 maxCount = requestable / MIN_WITHDRAWAL;
        if (maxCount > MAX_BATCH_WITHDRAWALS) maxCount = MAX_BATCH_WITHDRAWALS;
        uint256 requestedCount = amounts.length == 0 ? 1 : amounts.length;
        uint256 count = requestedCount > maxCount ? maxCount : requestedCount;
        uint256 seed = amounts.length == 0 ? MIN_WITHDRAWAL : amounts[0];
        uint256[] memory clampedAmounts = _splitWithdrawalAmounts(seed, count, requestable);

        vm.prank(selected);
        withdrawalQueueV2.requestWithdrawals(clampedAmounts, selected);
        ghosts.withdrawalRequests += count;
    }

    function withdrawalQueueV2_finalize(uint256 lastRequestId) public payable {
        withdrawalQueueV2_finalize_clamped(lastRequestId);
    }

    function withdrawalQueueV2_claimWithdrawal(uint256 requestId, address recipient) public {
        uint256 nextId = withdrawalQueueV2.nextRequestId();
        if (nextId <= 1) return;
        requestId = clampBetween(requestId, 1, nextId - 1);
        WithdrawalQueueV2.WithdrawalRequest memory req = withdrawalQueueV2.getRequest(requestId);
        if (!req.finalized || req.claimed) return;

        vm.prank(req.owner);
        withdrawalQueueV2.claimWithdrawal(requestId, payable(toActor(recipient)));
        ghosts.claimedRequests += 1;
    }

    function withdrawalQueueV2_claimWithdrawals(uint256[] memory requestIds, address recipient) public {
        if (requestIds.length == 0) return;
        uint256 requestId = requestIds[0];
        uint256 nextId = withdrawalQueueV2.nextRequestId();
        if (nextId <= 1) return;
        requestId = clampBetween(requestId, 1, nextId - 1);
        WithdrawalQueueV2.WithdrawalRequest memory first = withdrawalQueueV2.getRequest(requestId);
        if (!first.finalized || first.claimed) return;

        uint256 maxCount = requestIds.length > MAX_BATCH_WITHDRAWALS ? MAX_BATCH_WITHDRAWALS : requestIds.length;
        uint256[] memory scratch = new uint256[](maxCount);
        scratch[0] = requestId;
        uint256 count = 1;
        for (uint256 i = 1; i < maxCount; i++) {
            uint256 id = clampBetween(requestIds[i], 1, nextId - 1);
            WithdrawalQueueV2.WithdrawalRequest memory req = withdrawalQueueV2.getRequest(id);
            if (req.owner == first.owner && req.finalized && !req.claimed) {
                bool duplicate;
                for (uint256 j; j < count; j++) {
                    if (scratch[j] == id) duplicate = true;
                }
                if (!duplicate) {
                    scratch[count] = id;
                    count += 1;
                }
            }
        }

        uint256[] memory clampedIds = new uint256[](count);
        for (uint256 i; i < count; i++) clampedIds[i] = scratch[i];

        vm.prank(first.owner);
        withdrawalQueueV2.claimWithdrawals(clampedIds, payable(toActor(recipient)));
        ghosts.claimedRequests += count;
    }

    function _splitWithdrawalAmounts(
        uint256 seed,
        uint256 count,
        uint256 totalLimit
    ) internal returns (uint256[] memory amounts) {
        amounts = new uint256[](count);
        uint256 remaining = totalLimit;
        for (uint256 i; i < count; i++) {
            uint256 slotsLeft = count - i;
            uint256 maxAmount = remaining - ((slotsLeft - 1) * MIN_WITHDRAWAL);
            uint256 entropy = uint256(keccak256(abi.encode(seed, i, totalLimit)));
            amounts[i] = clampBetween(entropy, MIN_WITHDRAWAL, maxAmount);
            remaining -= amounts[i];
        }
    }
}
