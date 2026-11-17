// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;
pragma experimental ABIEncoderV2;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IBlocklist} from "../interfaces/IBlocklist.sol";

// Inspired by pool together
contract BlocklistBase is Initializable, IBlocklist {
    // Mapping of addresses isBlocked status
    mapping(address => bool) public isBlocklisted;

    /**
     * @notice Emitted when a user is blocked/unblocked from receiving a prize award.
     * @dev Emitted when a contract owner blocks/unblocks user from award selection in _distribute.
     * @param user Address of user to block or unblock
     * @param isBlocked User blocked status
     */
    event BlocklistSet(address indexed user, bool isBlocked);

    function inBlockList(address _user) external view override returns (bool _isInBlocklist) {
        return isBlocklisted[_user];
    }

    function __BlocklistBase_init(address[] calldata _addresses) internal initializer {
        __BlocklistBase_init_unchained(_addresses);
    }

    function __BlocklistBase_init_unchained(address[] calldata _addresses) internal initializer {
        _populateBlocklist(_addresses);
    }

    /**
     * @notice Block/unblock a user from winning during prize distribution.
     * @dev Block/unblock a user from winning award in prize distribution by updating the isBlocklisted mapping.
     * @param _user Address of blocked user
     * @param _isBlocked Blocked Status (true or false) of user
     */
    function _setBlocklisted(address _user, bool _isBlocked) internal {
        isBlocklisted[_user] = _isBlocked;
        emit BlocklistSet(_user, _isBlocked);
    }

    // Helper to block a list of addreses
    function _populateBlocklist(address[] calldata _addresses) internal {
        if (_addresses.length == 0) {
            return;
        }

        for (uint256 i = 0; i < _addresses.length; i++) {
            _setBlocklisted(_addresses[i], true);
        }
    }

    uint256[50] private ______gap;
}
