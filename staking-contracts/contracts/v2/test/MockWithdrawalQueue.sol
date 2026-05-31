// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

/// @title MockWithdrawalQueue - Mock for testing StakingCore withdrawal queue integration
contract MockWithdrawalQueue {
    uint256 public lockedEther;

    constructor(uint256 _lockedEther) {
        lockedEther = _lockedEther;
    }

    function setLockedEther(uint256 _lockedEther) external {
        lockedEther = _lockedEther;
    }
}