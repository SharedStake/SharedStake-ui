// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IBlocklist {
    function inBlockList(address _user) external returns (bool _isInBlocklist);
}
