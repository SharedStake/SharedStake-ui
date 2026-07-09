// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {IOperatorRegistry} from "../modular-staking/interfaces/IOperatorRegistry.sol";

contract MockOperatorRegistry is IOperatorRegistry {
    mapping(address => bool) public eligible;

    function setEligible(address operator, bool value) external {
        eligible[operator] = value;
    }

    // solhint-disable-next-line no-empty-blocks
    function incrementActive(address) external override {}

    // solhint-disable-next-line no-empty-blocks
    function decrementActive(address) external override {}

    // solhint-disable-next-line no-empty-blocks
    function lockNftForCredit(uint256) external override {}

    // solhint-disable-next-line no-empty-blocks
    function withdrawEscrowedNfts() external override {}

    function canDeposit(address operator) external view override returns (bool) {
        return eligible[operator];
    }

    function escrowedNftCount(address) external pure override returns (uint256) {
        return 0;
    }

    function nftSgtCredit() external pure override returns (uint256) {
        return 0;
    }
}
