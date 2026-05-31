// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Errors} from "../lib/Errors.sol";

/// @title InstitutionalPolicyRegistry
/// @notice Standalone policy module for institutional access control semantics.
///         This registry is intentionally decoupled from staking/queue contracts so
///         it can be attached to modules or entrypoints incrementally.
contract InstitutionalPolicyRegistry is AccessControl {
    bytes32 public constant GOV = keccak256("GOV");
    bytes32 public constant POLICY_ADMIN = keccak256("POLICY_ADMIN");

    enum PolicyMode {
        Permissionless,
        AllowlistOnly,
        BlocklistOnly,
        Private
    }

    struct PolicyConfig {
        PolicyMode mode;
        address manager;
        bool exists;
    }

    mapping(bytes32 => PolicyConfig) private _policies;
    mapping(bytes32 => mapping(address => bool)) private _allowlisted;
    mapping(bytes32 => mapping(address => bool)) private _blocklisted;

    event PolicyCreated(bytes32 indexed policyId, PolicyMode mode, address manager);
    event PolicyModeSet(bytes32 indexed policyId, PolicyMode mode);
    event PolicyManagerSet(bytes32 indexed policyId, address manager);
    event AllowlistSet(bytes32 indexed policyId, address indexed account, bool allowed);
    event BlocklistSet(bytes32 indexed policyId, address indexed account, bool blocked);

    error PolicyAlreadyExists(bytes32 policyId);
    error PolicyNotFound(bytes32 policyId);

    constructor(address gov) {
        if (gov == address(0)) revert Errors.ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, gov);
        _grantRole(GOV, gov);
        _grantRole(POLICY_ADMIN, gov);
    }

    function createPolicy(bytes32 policyId, PolicyMode mode, address manager) external onlyRole(POLICY_ADMIN) {
        if (policyId == bytes32(0)) revert Errors.InvalidAmount();
        if (_policies[policyId].exists) revert PolicyAlreadyExists(policyId);

        if (mode == PolicyMode.Private && manager == address(0)) revert Errors.ZeroAddress();
        if (manager == address(0)) {
            manager = msg.sender;
        }

        _policies[policyId] = PolicyConfig({mode: mode, manager: manager, exists: true});
        emit PolicyCreated(policyId, mode, manager);
    }

    function setPolicyMode(bytes32 policyId, PolicyMode mode) external onlyRole(POLICY_ADMIN) {
        PolicyConfig storage cfg = _getPolicyOrRevert(policyId);
        cfg.mode = mode;
        emit PolicyModeSet(policyId, mode);
    }

    function setPolicyManager(bytes32 policyId, address manager) external onlyRole(POLICY_ADMIN) {
        if (manager == address(0)) revert Errors.ZeroAddress();
        PolicyConfig storage cfg = _getPolicyOrRevert(policyId);
        cfg.manager = manager;
        emit PolicyManagerSet(policyId, manager);
    }

    function setAllowlisted(bytes32 policyId, address account, bool allowed) external onlyRole(POLICY_ADMIN) {
        if (account == address(0)) revert Errors.ZeroAddress();
        _getPolicyOrRevert(policyId);
        _allowlisted[policyId][account] = allowed;
        emit AllowlistSet(policyId, account, allowed);
    }

    function setBlocklisted(bytes32 policyId, address account, bool blocked) external onlyRole(POLICY_ADMIN) {
        if (account == address(0)) revert Errors.ZeroAddress();
        _getPolicyOrRevert(policyId);
        _blocklisted[policyId][account] = blocked;
        emit BlocklistSet(policyId, account, blocked);
    }

    function isAllowed(bytes32 policyId, address account) external view returns (bool) {
        if (account == address(0)) return false;
        PolicyConfig storage cfg = _getPolicyOrRevert(policyId);

        if (_blocklisted[policyId][account]) return false;

        if (cfg.mode == PolicyMode.Permissionless) {
            return true;
        }
        if (cfg.mode == PolicyMode.AllowlistOnly) {
            return _allowlisted[policyId][account];
        }
        if (cfg.mode == PolicyMode.BlocklistOnly) {
            return true;
        }
        return account == cfg.manager || _allowlisted[policyId][account];
    }

    function getPolicy(
        bytes32 policyId
    ) external view returns (PolicyMode mode, address manager, bool exists) {
        PolicyConfig storage cfg = _policies[policyId];
        return (cfg.mode, cfg.manager, cfg.exists);
    }

    function isAllowlisted(bytes32 policyId, address account) external view returns (bool) {
        return _allowlisted[policyId][account];
    }

    function isBlocklisted(bytes32 policyId, address account) external view returns (bool) {
        return _blocklisted[policyId][account];
    }

    function _getPolicyOrRevert(bytes32 policyId) internal view returns (PolicyConfig storage cfg) {
        cfg = _policies[policyId];
        if (!cfg.exists) revert PolicyNotFound(policyId);
    }
}

