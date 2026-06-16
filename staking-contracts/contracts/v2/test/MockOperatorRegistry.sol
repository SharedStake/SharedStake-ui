// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {IOperatorRegistry} from "../modular-staking/interfaces/IOperatorRegistry.sol";

contract MockOperatorRegistry is IOperatorRegistry {
    mapping(address => bool) public eligible;

    function setEligible(address operator, bool value) external {
        eligible[operator] = value;
    }

    function canDeposit(address operator) external view override returns (bool) {
        return eligible[operator];
    }

    function incrementActive(address) external override {}

    function decrementActive(address) external override {}

    function escrowedNftCount(address) external pure override returns (uint256) {
        return 0;
    }

    function lockNftForCredit(uint256) external override {}

    function nftSgtCredit() external pure override returns (uint256) {
        return 0;
    }

    function withdrawEscrowedNfts() external override {}
}
