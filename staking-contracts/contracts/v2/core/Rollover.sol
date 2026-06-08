// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {SafeERC20, SafeMath, IERC20, RedemptionsBase} from "../lib/RedemptionsBase.sol";

/// @title Rollover - ERC20 token to ETH redemption contract
/// @author @ChimeraDefi - sharedstake.org
/// @notice Rollover accepts an underlying ERC20 and redeems it for another ERC20
/** @dev Deployer chooses static virtual price at launch in 1e18 and the underlying ERC20 token
    Users call deposit(amt) to stake their ERC20 and signal intent to exit
    When the contract has enough ETH to service the users debt
    Users call redeem() to redeem for ERC20 = deposited shares * virtualPrice
    The user can further call withdraw() if they change their mind about redeeming for ETH
    This is retained as a legacy fixed-rate rollover helper; new V2 withdrawal work should use the
    request/finalize/claim lifecycle instead of extending this contract.
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

        NEW_TOKEN.safeTransfer(msg.sender, amountToReturn);
    }
}
