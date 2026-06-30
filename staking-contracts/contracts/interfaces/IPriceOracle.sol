// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IPriceOracle {
    function setCostPerShare(uint256 shares) external;

    function getCostPerShare() external returns (uint256 _costPerShare);
}
