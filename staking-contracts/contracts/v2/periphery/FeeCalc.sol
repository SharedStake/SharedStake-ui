// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

contract FeeCalc is Ownable2Step {
    error ZeroAddress();

    struct Settings {
        uint256 adminFee;
        uint256 exitFee;
        bool refundFeesOnWithdraw;
        bool chargeOnDeposit;
        bool chargeOnExit;
    }
    Settings public config;
    uint256 public adminFee;
    uint256 public costPerValidator;

    uint256 private immutable BIPS = 10000;
    constructor(Settings memory _settings, address initialOwner) Ownable2Step() {
        if (initialOwner == address(0)) {
            revert ZeroAddress();
        }

        _transferOwnership(initialOwner);

        // admin fee in bips (10000 = 100%)
        adminFee = _settings.adminFee;
        config = _settings;
        costPerValidator = ((32 + (32 * adminFee)) * 1 ether) / BIPS;
    }

    function set(Settings calldata newSettings) external onlyOwner {
        config = newSettings;
        adminFee = newSettings.adminFee;
    }

    function setRefundFeesOnWithdraw(bool _refundFeesOnWithdraw) external onlyOwner {
        config.refundFeesOnWithdraw = _refundFeesOnWithdraw;
    }

    function setExitFee(uint256 _exitFee) external onlyOwner {
        config.exitFee = _exitFee;
    }

    function setAdminFee(uint256 amount) external onlyOwner {
        adminFee = amount;
        config.adminFee = amount;
    }

    function processDeposit(uint256 value, address _sender) external view returns (uint256 amt, uint256 fee) {
        // TODO: semder is currently unsused but can be used later to calculate a fee reduction based on token holdings
        if (config.chargeOnDeposit) {
            fee = (value * adminFee) / BIPS;
            amt = value - fee;
        }
    }

    function processWithdraw(uint256 value, address _sender) external view returns (uint256 amt, uint256 fee) {
        // TODO: semder is currently unsused but can be used later to calculate a fee reduction based on token holdings
        if (config.refundFeesOnWithdraw) {
            fee = (value * adminFee) / BIPS;
            amt = value + fee;
        } else if (config.chargeOnExit) {
            fee = (value * config.exitFee) / BIPS;
            amt = value - fee;
        } else {
            fee = 0;
            amt = value;
        }
    }
}
