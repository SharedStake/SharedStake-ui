// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ISharedDeposit} from "../../interfaces/ISharedDeposit.sol";

// User referral rewards tracking contract
// Fires events on user deposits to assits attribution of rewards
// Calls proper flow to retrieve interest bearing staked eth
// TODO: Tests, scripts to aggregate events offchain and calc referral rewards
contract UserDepositHelper {
    ISharedDeposit private immutable MINTER;

    event Deposit(address indexed _from, uint256 _value);
    event ExtraDepositData(address indexed _from, uint256 _value, bytes32 data);
    event DepositRef(address indexed _from, uint256 _value, address ref);
    event DepositFrontend(address indexed _from, uint256 _value, address ref);

    constructor(address _sgEth, address _minter) {
        MINTER = ISharedDeposit(_minter);
        IERC20(_sgEth).approve(_minter, 2 ** 256 - 1);
    }

    // Deposit multiple users and amts from a single call with referral and frontend address emitted. useful for batch deposits to reduce gas costs
    // An external contract can buffer ETH and call this
    function depositMultipleWithReferral(
        address[] memory addrs,
        uint256[] memory amts,
        address ref,
        address frontend,
        bytes32[] memory bytesToBroadcast
    ) external payable {
        uint256 i = addrs.length;
        if (addrs.length != amts.length || addrs.length != bytesToBroadcast.length) {
            payable(msg.sender).transfer(msg.value);
        }
        while (i > 0) {
            unchecked {
                --i;

                emit Deposit(addrs[i], amts[i]);
                emit ExtraDepositData(msg.sender, msg.value, bytesToBroadcast[i]);
                emit DepositRef(msg.sender, msg.value, ref);
                emit DepositFrontend(msg.sender, msg.value, frontend);
                MINTER.depositAndStakeFor{value: amts[i]}(addrs[i]);
            }
        }
    }

    // User deposit helper. User needs to call this function.
    // Referral data can be filled in by frontend
    function depositWithEvents(address ref, address frontend, bytes32 data) external payable {
        MINTER.depositAndStakeFor{value: msg.value}(msg.sender);
        emit Deposit(msg.sender, msg.value);
        emit ExtraDepositData(msg.sender, msg.value, data);
        emit DepositRef(msg.sender, msg.value, ref);
        emit DepositFrontend(msg.sender, msg.value, frontend);
    }
}
