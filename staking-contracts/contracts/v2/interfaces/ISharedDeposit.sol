// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface ISharedDeposit {
    function withdraw(uint256 amount) external;
    function withdraw(uint256 amount, address dest) external;

    function deposit() external payable;

    function remainingSpaceInEpoch() external;
    function depositAndStakeFor(address dest) external payable;
}
