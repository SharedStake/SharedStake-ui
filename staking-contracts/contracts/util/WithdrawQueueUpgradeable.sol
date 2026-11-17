// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {SafeMathUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";

contract WithdrawQueueUpgradeable is Initializable {
    using SafeMathUpgradeable for uint256;
    struct UserEntry {
        uint256 amount;
        uint256 timestamp;
    }
    mapping(address => UserEntry) public userEntries;
    uint256 public epochLength;

    // Error map:
    // prefix origin wq - WithdrawQueue
    // CBL0 - contract bal less than 0 after op
    // AGSA - Amount greater than stored amount
    // TS - Too soon
    // EG30 - Epoch cant be greater than 30 days

    // if you just use the foll func you open yourself up to attacks
    // remember to move funds from the user
    // Based on:
    /*
     * Xdai easy staking deployed at
     * https://etherscan.io/address/0xecdaa01647290e1e9fdc8a26628a33561ba02949#code
     */
    function _checkWithdraw(
        address sender,
        uint256 balanceOfSelf,
        uint256 amountToWithdraw,
        uint256 _epochLength
    ) internal returns (bool withdrawalAllowed) {
        UserEntry memory userEntry = userEntries[sender];
        require(amountToWithdraw >= balanceOfSelf, "WQ:CBL0");
        require(userEntry.amount >= amountToWithdraw, "WQ:AGC");

        uint256 lockEnd = userEntry.timestamp.add(_epochLength);
        require(block.timestamp >= lockEnd, "WQ:TS");
        return true;
    }

    // Init
    function __WithdrawQueue_init(uint256 len) internal initializer {
        __WithdrawQueue_init_unchained(len);
    }

    function __WithdrawQueue_init_unchained(uint256 len) internal initializer {
        _setEpochLength(len);
    }

    // should be admin only or used in a constructor upstream
    function _setEpochLength(uint256 _value) internal {
        require(_value <= 30 days, "WQ:AGC");
        epochLength = _value;
    }

    function _stakeForWithdrawal(address sender, uint256 amount) internal {
        UserEntry memory ue = userEntries[sender];
        ue.amount = ue.amount.add(amount);
        ue.timestamp = block.timestamp;
        userEntries[sender] = ue;
    }
}
