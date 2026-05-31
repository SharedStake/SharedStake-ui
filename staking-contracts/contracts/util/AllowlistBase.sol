// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;
pragma experimental ABIEncoderV2;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IAllowlist} from "../interfaces/IAllowlist.sol";

// Inspired by pool together
contract AllowlistBase is Initializable, IAllowlist {
    // Mapping of addresses isBlocked status
    mapping(address => bool) public isAllowlisted;

    /**
     * @notice Emitted when a user is blocked/unblocked from receiving a prize award.
     * @dev Emitted when a contract owner blocks/unblocks user from award selection in _distribute.
     * @param user Address of user to block or unblock
     * @param isAllowed User blocked status
     */
    event AllowlistSet(address indexed user, bool isAllowed);

    function inAllowlist(address _user) external view override returns (bool _isInAllowlist) {
        return isAllowlisted[_user];
    }

    function __AllowlistBase_init(address[] calldata _addresses) internal initializer {
        __AllowlistBase_init_unchained(_addresses);
    }

    function __AllowlistBase_init_unchained(address[] calldata _addresses) internal initializer {
        _populateAllowlist(_addresses);
    }

    /**
     * @notice Block/unblock a user from winning during prize distribution.
     * @dev Block/unblock a user from winning award in prize distribution by updating the isBlocklisted mapping.
     * @param _user Address of blocked user
     * @param _isAllowed Blocked Status (true or false) of user
     */
    function _setAllowlisted(address _user, bool _isAllowed) internal {
        isAllowlisted[_user] = _isAllowed;
        emit AllowlistSet(_user, _isAllowed);
    }

    // Helper to block a list of addreses
    function _populateAllowlist(address[] calldata _addresses) internal {
        if (_addresses.length == 0) {
            return;
        }

        for (uint256 i = 0; i < _addresses.length; i++) {
            _setAllowlisted(_addresses[i], true);
        }
    }

    uint256[50] private ______gap;
}
