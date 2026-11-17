// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;
pragma experimental ABIEncoderV2;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {SafeMathUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";

contract VaultWithSharesAndCapUpgradeable is Initializable {
    using SafeMathUpgradeable for uint256;
    uint256 public curShares; //initialized to 0
    uint256 public maxShares;
    // Its hard to exactly hit the max deposit amount with small shares. this allows a small bit of overflow room
    // Tokens in the buffer cannot be withdrawn by an admin, only by burning the underlying token via a user withdraw
    uint256 public buffer;
    uint256 public costPerShare;

    function __VaultWithSharesAndCapUpgradeable_init(uint256 _sharePrice) internal initializer {
        __VaultWithSharesAndCapUpgradeable_init_unchained(_sharePrice);
    }

    function __VaultWithSharesAndCapUpgradeable_init_unchained(uint256 _sharePrice) internal initializer {
        costPerShare = _sharePrice;
    }

    function getSharesGivenAmount(uint256 amount) public view returns (uint256) {
        return amount.div(costPerShare).mul(1e18);
    }

    function getAmountGivenShares(uint256 shares) public view returns (uint256) {
        return shares.mul(costPerShare).div(1e18);
    }

    function _setCap(uint256 amount) internal {
        require(amount > 0, "VWSAC:VL0");
        maxShares = amount;
    }

    function _setBuffer(uint256 amount) internal {
        require(amount > 0, "VWSAC:VL0");
        buffer = amount;
    }

    function _incrementShares(uint256 amount) internal {
        uint256 newSharesTotal = curShares.add(amount);
        // Check that we are under the cap
        require(newSharesTotal <= buffer.add(maxShares), "VWSAC:AGC");
        curShares = newSharesTotal;
    }

    function _decrementShares(uint256 amount) internal {
        uint256 newSharesTotal = curShares.sub(amount);
        // check we are above 0
        require(newSharesTotal >= 0, "VWSAC:VL0");
        curShares = newSharesTotal;
    }

    function _depositAndAccountShares(uint256 amount) internal returns (uint256) {
        uint256 newShares = getSharesGivenAmount(amount);
        _incrementShares(newShares);
        return newShares;
    }

    function _withdrawAndAccountShares(uint256 amount) internal returns (uint256) {
        uint256 newShares = getAmountGivenShares(amount);
        _decrementShares(amount);
        return newShares;
    }

    uint256[50] private ______gap;
}
