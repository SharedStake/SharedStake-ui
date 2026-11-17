// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;
pragma experimental ABIEncoderV2;

import {OwnershipRolesTemplate} from "./util/OwnershipRolesTemplate.sol";
import {AllowlistBase} from "./util/AllowlistBase.sol";

contract Allowlist is OwnershipRolesTemplate, AllowlistBase {
    bytes32 public constant ALLOWLIST_OWNER = keccak256("ALLOWLIST_OWNER");

    modifier onlyOwners() {
        _checkOnlyOwners();
        _;
    }

    function initialize(address[] calldata _addresses) external initializer {
        __OwnershipRolesTemplate_init();
        __AllowlistBase_init_unchained(_addresses);
        _setupRole(ALLOWLIST_OWNER, _msgSender());
    }

    function populateBlocklist(address[] calldata _addresses) external onlyOwners whenNotPaused {
        _populateAllowlist(_addresses);
    }

    function setBlockListed(address _user, bool _val) external onlyOwners whenNotPaused {
        _setAllowlisted(_user, _val);
    }

    function transferOwnership(address _governance) external onlyOwners {
        grantRole(ALLOWLIST_OWNER, _governance);
        _setRoleAdmin(ALLOWLIST_OWNER, GOVERNANCE_ROLE);
        grantGovernanceRoles(_governance);
        renoucePrivileges();
    }

    /// @dev Private method is used instead of inlining into modifier because modifiers are copied into each method,
    ///     and the use of immutable means the address bytes are copied in every place the modifier is used.
    function _checkOnlyOwners() private view {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()) ||
                hasRole(GOVERNANCE_ROLE, _msgSender()) ||
                hasRole(ALLOWLIST_OWNER, _msgSender()),
            "A:NA"
        );
    }
}
