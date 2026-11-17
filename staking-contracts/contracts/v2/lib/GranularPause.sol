// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.20;
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/// @title GranularPause 
/// @author ChimeraDefi - chimera_defi@protonmail.com
/// @notice allows more granular control of pausing functions
/// @dev Inherit in child contract, you need to number each function you want to pause

abstract contract GranularPause is Context {
    mapping(uint16 => bool) public paused;

    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address account, uint16 item);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address account, uint16 item);

    error IsPaused();
    error IsNotPaused();

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused(uint16 _id) {
        if (paused[_id]) {
            revert IsPaused();
        }
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused(uint16 _id) {
        if (!paused[_id]) {
            revert IsNotPaused();
        }
        _;
    }

    /// @notice pauses a function
    /// @param _id id of function to pause
    function _pause(uint16 _id) internal virtual {
        paused[_id] = true;
        emit Paused(_msgSender(), _id);
    }

    /// @notice unpauses a function
    /// @param _id id of function to unpause
    function _unpause(uint16 _id) internal virtual {
        paused[_id] = false;
        emit Unpaused(_msgSender(), _id);
    }
}

