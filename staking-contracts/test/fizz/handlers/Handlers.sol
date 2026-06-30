// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2 <0.9.0;

import "../Base.sol";
import {StakingRouterHandler} from "./StakingRouterHandler.sol";
import {ValidatorModuleHandler} from "./ValidatorModuleHandler.sol";
import {WithdrawalQueueV2Handler} from "./WithdrawalQueueV2Handler.sol";
import {OldVeth2WithdrawalQueueHandler} from "./OldVeth2WithdrawalQueueHandler.sol";
import {WstTokenHandler} from "./WstTokenHandler.sol";

/// @notice Inherits from all the handlers to expose all entry points in a single contract.
///         Manages environment changes (e.g. current actor, current token, mocks setup, etc.).
abstract contract Handlers is
    StakingRouterHandler,
    ValidatorModuleHandler,
    WithdrawalQueueV2Handler,
    OldVeth2WithdrawalQueueHandler,
    WstTokenHandler
{
    function setCurrentActor(uint256 entropy) public {
        actor = actors[entropy % actors.length];
    }
}
