// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.20;

import {IERC20MintableBurnable} from "../../interfaces/IERC20MintableBurnable.sol";
import {IWSGEth} from "../../interfaces/IWSGEth.sol";
import {ISharedDeposit} from "../../interfaces/ISharedDeposit.sol";

contract Zap {
    IERC20MintableBurnable public sgeth;
    IWSGEth public wsgeth;
    ISharedDeposit public MINTER;

    constructor(IERC20MintableBurnable _sgETHAddr, IWSGEth _wsgETHAddr, ISharedDeposit _minter) {
        sgeth = _sgETHAddr;
        wsgeth = _wsgETHAddr;
        MINTER = _minter;
        uint256 MAX_INT = 2 ** 256 - 1;

        sgeth.approve(address(_wsgETHAddr), MAX_INT);
        sgeth.approve(address(_minter), MAX_INT);
    }

    function depositAndStake() external payable {
        uint256 amt = msg.value;
        MINTER.deposit{value: amt}();
        wsgeth.deposit(amt, msg.sender);
    }

    function unstakeAndWithdraw(uint256 amount) external {
        uint256 assets = wsgeth.redeem(amount, address(this), msg.sender);
        MINTER.withdraw(assets, msg.sender);
    }
}
