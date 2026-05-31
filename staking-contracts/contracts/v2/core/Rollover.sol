// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {SafeERC20, SafeMath, IERC20, RedemptionsBase} from "../lib/RedemptionsBase.sol";

/// @title Rollover - ERC20 token to ETH redemption contract
/// @author @ChimeraDefi - sharedstake.org
/// @notice Rollover accepts an underlying ERC20 and redeems it for another ERC20
/** @dev Deployer chooses static virtual price at launch in 1e18 and the underlying ERC20 token
    Users call deposit(amt) to stake their ERC20 and signal intent to exit
    When the contract has enough ETH to service the users debt
    Users call redeem() to redem for ERC20 = deposited shares * virtualPrice
    The user can further call withdraw() if they change their mind about redeeming for ETH
    TODO Docs
    Test on goerli deployed at https://goerli.etherscan.io/address/0x4db116ad5cca33ba5d2956dba80d56f27b6b2455
**/
contract Rollover is RedemptionsBase {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public immutable NEW_TOKEN;

    constructor(
        address _underlying,
        address _newToken,
        uint256 _virtualPrice
    ) payable RedemptionsBase(_underlying, _virtualPrice) {
        NEW_TOKEN = IERC20(_newToken);
    }

    function _redeem(uint256 amountToReturn) internal override {
        // make sure user has tokens to redeem offchain first by looking at userEntries otherwise this will just waste gas
        if (amountToReturn > NEW_TOKEN.balanceOf(address(this))) {
            revert ContractBalanceTooLow();
        }

        NEW_TOKEN.transfer(msg.sender, amountToReturn);
    }
}
