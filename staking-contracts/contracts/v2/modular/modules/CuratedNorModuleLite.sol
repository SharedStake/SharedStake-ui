// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IStakingModuleLite} from "../interfaces/IStakingModuleLite.sol";

contract CuratedNorModuleLite is AccessControl, IStakingModuleLite {
    bytes32 public constant OPERATOR = keccak256("OPERATOR");
    bytes32 public constant ROUTER = keccak256("ROUTER");

    uint64 public override availableValidatorKeys;
    uint64 public depositedValidatorCount;
    uint64 public exitedValidatorCount;

    bytes[] private _pubkeys;
    bytes[] private _signatures;
    bytes32[] private _depositDataRoots;

    error ZeroAddress();
    error LengthMismatch();
    error InvalidCount();

    event ModuleDataConfigured(uint256 keyCount);
    event AvailableValidatorKeysSet(uint64 value);
    event DepositedMarked(uint64 amount);
    event ExitedSet(uint64 value);

    constructor(address admin, address operator) {
        if (admin == address(0) || operator == address(0)) {
            revert ZeroAddress();
        }

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR, operator);
    }

    function setRouter(address router) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (router == address(0)) {
            revert ZeroAddress();
        }
        _grantRole(ROUTER, router);
    }

    function setAvailableValidatorKeys(uint64 value) external onlyRole(OPERATOR) {
        availableValidatorKeys = value;
        emit AvailableValidatorKeysSet(value);
    }

    function setExitedValidatorCount(uint64 value) external onlyRole(OPERATOR) {
        exitedValidatorCount = value;
        emit ExitedSet(value);
    }

    function setDepositData(
        bytes[] calldata pubkeys,
        bytes[] calldata signatures,
        bytes32[] calldata depositDataRoots
    ) external onlyRole(OPERATOR) {
        if (pubkeys.length != signatures.length || pubkeys.length != depositDataRoots.length) {
            revert LengthMismatch();
        }

        delete _pubkeys;
        delete _signatures;
        delete _depositDataRoots;

        for (uint256 i = 0; i < pubkeys.length; i++) {
            _pubkeys.push(pubkeys[i]);
            _signatures.push(signatures[i]);
            _depositDataRoots.push(depositDataRoots[i]);
        }

        emit ModuleDataConfigured(pubkeys.length);
    }

    function getDepositData(
        uint256 depositsCount
    ) external view override returns (bytes[] memory pubkeys, bytes[] memory signatures, bytes32[] memory depositDataRoots) {
        if (depositsCount == 0) {
            revert InvalidCount();
        }
        if (depositsCount > availableValidatorKeys || depositsCount > _pubkeys.length) {
            revert InvalidCount();
        }

        pubkeys = new bytes[](depositsCount);
        signatures = new bytes[](depositsCount);
        depositDataRoots = new bytes32[](depositsCount);

        for (uint256 i = 0; i < depositsCount; i++) {
            pubkeys[i] = _pubkeys[i];
            signatures[i] = _signatures[i];
            depositDataRoots[i] = _depositDataRoots[i];
        }
    }

    function markDeposited(uint64 depositsCount) external override onlyRole(ROUTER) {
        if (depositsCount == 0 || depositsCount > availableValidatorKeys) {
            revert InvalidCount();
        }

        availableValidatorKeys = availableValidatorKeys - depositsCount;
        depositedValidatorCount = depositedValidatorCount + depositsCount;
        emit DepositedMarked(depositsCount);
    }
}

