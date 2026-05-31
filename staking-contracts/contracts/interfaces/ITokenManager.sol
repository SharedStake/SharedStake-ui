// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface ITokenManager {
    function donate(uint256 shares) external payable;

    function setTokenAddress(address _address) external;

    function mint(address recv, uint256 amt) external;

    function burn(address recv, uint256 amt) external;

    function petrifyMinterTransfer() external;

    function transferTokenMinterRights(address payable minter_) external;
}
