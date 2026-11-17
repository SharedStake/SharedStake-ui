// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;
pragma experimental ABIEncoderV2;

import {OwnershipRolesTemplate} from "./util/OwnershipRolesTemplate.sol";
import {BlocklistBase} from "./util/BlocklistBase.sol";

contract Blocklist is OwnershipRolesTemplate, BlocklistBase {
    bytes32 public constant BLOCKLIST_OWNER = keccak256("BLOCKLIST_OWNER");

    modifier onlyOwners() {
        _checkOnlyOwners();
        _;
    }

    function initialize(address[] calldata _addresses) external initializer {
        __OwnershipRolesTemplate_init();
        __BlocklistBase_init_unchained(_addresses);
        _setupRole(BLOCKLIST_OWNER, _msgSender());
    }

    function populateBlocklist(address[] calldata _addresses) external onlyOwners whenNotPaused {
        _populateBlocklist(_addresses);
    }

    function setBlockListed(address _user, bool _isBlocked) external onlyOwners whenNotPaused {
        _setBlocklisted(_user, _isBlocked);
    }

    function transferOwnership(address _governance) external onlyOwners {
        grantRole(BLOCKLIST_OWNER, _governance);
        _setRoleAdmin(BLOCKLIST_OWNER, GOVERNANCE_ROLE);
        grantGovernanceRoles(_governance);
        renoucePrivileges();
    }

    /// @dev Private method is used instead of inlining into modifier because modifiers are copied into each method,
    ///     and the use of immutable means the address bytes are copied in every place the modifier is used.
    function _checkOnlyOwners() private view {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()) ||
                hasRole(GOVERNANCE_ROLE, _msgSender()) ||
                hasRole(BLOCKLIST_OWNER, _msgSender()),
            "B:NA"
        );
    }
}
