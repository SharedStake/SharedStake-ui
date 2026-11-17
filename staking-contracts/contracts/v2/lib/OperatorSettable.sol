// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.20;
import {Errors} from "./Errors.sol";

/**
 * @title OperatorSettable
 * @author Sharedstake
 * @notice Handles operators for ERC-7450 like contracts
 */
abstract contract OperatorSettable {
    mapping(address requester => mapping(address operator => bool)) public isOperator;
    event OperatorSet(address indexed owner, address indexed operator, bool value);

    modifier onlyOwnerOrOperator(address owner) {
        if (owner != msg.sender && !isOperator[owner][msg.sender]) {
            revert Errors.PermissionDenied();
        }
        _;
    }

    function setOperator(address operator, bool approved) external returns (bool) {
        isOperator[msg.sender][operator] = approved;
        emit OperatorSet(msg.sender, operator, approved);
        return true;
    }
}
