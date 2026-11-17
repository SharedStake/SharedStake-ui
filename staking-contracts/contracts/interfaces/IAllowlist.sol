// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IAllowlist {
    function inAllowlist(address _user) external returns (bool _isInAllowlist);
}
