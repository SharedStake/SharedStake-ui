// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2 <0.9.0;

import {Base} from "./Base.sol";

abstract contract Snapshots is Base {
    struct State {
        uint256 totalPooledEther;
        uint256 totalShares;
        uint256 moduleBufferedEther;
        uint256 moduleBeaconBalance;
        uint256 queuePendingEther;
        uint256 queueLockedEther;
        uint256 actorStTokenBalance;
        uint256 actorWstTokenBalance;
    }

    State internal stateBefore;
    State internal stateAfter;

    function _takeSnapshot(State storage state) private {
        state.totalPooledEther = stToken.totalPooledEther();
        state.totalShares = stToken.getTotalShares();
        state.moduleBufferedEther = validatorModule.bufferedEther();
        state.moduleBeaconBalance = validatorModule.beaconBalance();
        state.queuePendingEther = withdrawalQueueV2.pendingEther();
        state.queueLockedEther = withdrawalQueueV2.lockedEther();
        state.actorStTokenBalance = stToken.balanceOf(actor);
        state.actorWstTokenBalance = wstToken.balanceOf(actor);
    }

    function snapshotBefore() internal {
        _takeSnapshot(stateBefore);
    }

    function snapshotAfter() internal {
        _takeSnapshot(stateAfter);
    }
}
