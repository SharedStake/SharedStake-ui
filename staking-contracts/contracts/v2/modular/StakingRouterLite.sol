// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

import {IDepositContract} from "../interfaces/IDepositContract.sol";
import {IStakingModuleLite} from "./interfaces/IStakingModuleLite.sol";
import {IStakingRouterLite} from "./interfaces/IStakingRouterLite.sol";

/// @notice Control-plane prototype for module registration, allocation preview, and guarded deposits.
/// @dev This contract is intentionally isolated from v2/core minter flows.
contract StakingRouterLite is AccessControl, IStakingRouterLite {
    bytes32 public constant GOV = keccak256("GOV");
    uint16 public constant MAX_BPS = 10_000;
    uint256 public constant VALIDATOR_DEPOSIT = 32 ether;

    IDepositContract public immutable DEPOSIT_CONTRACT;
    bytes32 public immutable WITHDRAWAL_CREDENTIALS;

    uint256 public moduleCount;
    uint16 public totalTargetShareBps;

    mapping(uint256 => ModuleView) internal _modules;
    mapping(address => uint256) public moduleIdByAddress;

    error ZeroAddress();
    error InvalidBps();
    error InvalidStatus();
    error UnknownModule();
    error ModuleAlreadyExists();
    error InvalidArrayLength();
    error InvalidDeposits();
    error InvalidWithdrawalCredentials();
    error ValueMismatch();
    error PermissionDenied();
    error ModuleUnavailable();
    error Overflow();

    event ModuleAdded(
        uint256 indexed moduleId,
        address indexed module,
        uint16 targetShareBps,
        uint16 maxShareBps,
        uint16 moduleFeeBps,
        uint16 treasuryFeeBps
    );
    event ModuleUpdated(
        uint256 indexed moduleId,
        uint16 targetShareBps,
        uint16 maxShareBps,
        uint16 moduleFeeBps,
        uint16 treasuryFeeBps
    );
    event ModuleStatusChanged(uint256 indexed moduleId, ModuleStatus status);
    event ModuleStateReported(
        uint256 indexed moduleId,
        uint64 availableValidatorKeys,
        uint64 depositedValidatorCount,
        uint64 exitedValidatorCount
    );
    event ModuleDepositsExecuted(uint256 indexed moduleId, uint64 depositsCount);

    constructor(address governance, address depositContract, bytes memory withdrawalCredentials) {
        if (governance == address(0) || depositContract == address(0)) {
            revert ZeroAddress();
        }
        if (withdrawalCredentials.length != 32) {
            revert InvalidWithdrawalCredentials();
        }

        DEPOSIT_CONTRACT = IDepositContract(depositContract);
        bytes32 withdrawalCredentialsWord;
        assembly {
            withdrawalCredentialsWord := mload(add(withdrawalCredentials, 0x20))
        }
        WITHDRAWAL_CREDENTIALS = withdrawalCredentialsWord;
        _grantRole(GOV, governance);
    }

    function getModule(uint256 moduleId) external view returns (ModuleView memory) {
        return _getModuleOrRevert(moduleId);
    }

    function addModule(
        address module,
        uint16 targetShareBps,
        uint16 maxShareBps,
        uint16 moduleFeeBps,
        uint16 treasuryFeeBps
    ) external onlyRole(GOV) returns (uint256 moduleId) {
        if (module == address(0)) {
            revert ZeroAddress();
        }
        if (moduleIdByAddress[module] != 0) {
            revert ModuleAlreadyExists();
        }
        _validateBps(targetShareBps, maxShareBps, moduleFeeBps, treasuryFeeBps);

        uint16 newTotalTarget = totalTargetShareBps + targetShareBps;
        if (newTotalTarget > MAX_BPS) {
            revert InvalidBps();
        }

        moduleId = moduleCount + 1;
        moduleCount = moduleId;
        moduleIdByAddress[module] = moduleId;
        totalTargetShareBps = newTotalTarget;

        _modules[moduleId] = ModuleView({
            module: module,
            status: ModuleStatus.Active,
            targetShareBps: targetShareBps,
            maxShareBps: maxShareBps,
            moduleFeeBps: moduleFeeBps,
            treasuryFeeBps: treasuryFeeBps,
            availableValidatorKeys: IStakingModuleLite(module).availableValidatorKeys(),
            depositedValidatorCount: 0,
            exitedValidatorCount: 0
        });

        emit ModuleAdded(moduleId, module, targetShareBps, maxShareBps, moduleFeeBps, treasuryFeeBps);
    }

    function setModuleStatus(uint256 moduleId, ModuleStatus status) external onlyRole(GOV) {
        ModuleView storage moduleData = _getModuleStorageOrRevert(moduleId);
        moduleData.status = status;
        emit ModuleStatusChanged(moduleId, status);
    }

    function setModuleConfig(
        uint256 moduleId,
        uint16 targetShareBps,
        uint16 maxShareBps,
        uint16 moduleFeeBps,
        uint16 treasuryFeeBps
    ) external onlyRole(GOV) {
        _validateBps(targetShareBps, maxShareBps, moduleFeeBps, treasuryFeeBps);

        ModuleView storage moduleData = _getModuleStorageOrRevert(moduleId);
        uint16 newTotalTarget = totalTargetShareBps + targetShareBps - moduleData.targetShareBps;
        if (newTotalTarget > MAX_BPS) {
            revert InvalidBps();
        }

        totalTargetShareBps = newTotalTarget;
        moduleData.targetShareBps = targetShareBps;
        moduleData.maxShareBps = maxShareBps;
        moduleData.moduleFeeBps = moduleFeeBps;
        moduleData.treasuryFeeBps = treasuryFeeBps;

        emit ModuleUpdated(moduleId, targetShareBps, maxShareBps, moduleFeeBps, treasuryFeeBps);
    }

    function reportModuleState(
        uint256 moduleId,
        uint64 availableValidatorKeys,
        uint64 depositedValidatorCount,
        uint64 exitedValidatorCount
    ) external {
        ModuleView storage moduleData = _getModuleStorageOrRevert(moduleId);
        if (msg.sender != moduleData.module) {
            revert PermissionDenied();
        }

        moduleData.availableValidatorKeys = availableValidatorKeys;
        moduleData.depositedValidatorCount = depositedValidatorCount;
        moduleData.exitedValidatorCount = exitedValidatorCount;

        emit ModuleStateReported(moduleId, availableValidatorKeys, depositedValidatorCount, exitedValidatorCount);
    }

    function previewAllocation(
        uint256 validatorDepositsToAllocate
    ) external view returns (uint256[] memory moduleIds, uint64[] memory allocations) {
        if (validatorDepositsToAllocate == 0) {
            revert InvalidDeposits();
        }

        moduleIds = new uint256[](moduleCount);
        allocations = new uint64[](moduleCount);

        uint256 remaining = validatorDepositsToAllocate;
        uint256 totalDeposited;
        for (uint256 i = 0; i < moduleCount; i++) {
            totalDeposited += _modules[i + 1].depositedValidatorCount;
        }
        uint256 totalAfter = totalDeposited + validatorDepositsToAllocate;

        for (uint256 i = 0; i < moduleCount; i++) {
            uint256 moduleId = i + 1;
            ModuleView memory moduleData = _modules[moduleId];
            moduleIds[i] = moduleId;

            if (remaining == 0 || moduleData.status != ModuleStatus.Active || moduleData.targetShareBps == 0) {
                continue;
            }

            uint256 desiredAfter = (totalAfter * moduleData.targetShareBps) / MAX_BPS;
            if (desiredAfter <= moduleData.depositedValidatorCount) {
                continue;
            }

            uint256 needed = desiredAfter - moduleData.depositedValidatorCount;
            if (needed > remaining) {
                needed = remaining;
            }
            if (needed > moduleData.availableValidatorKeys) {
                needed = moduleData.availableValidatorKeys;
            }

            allocations[i] = uint64(needed);
            remaining -= needed;
        }
    }

    function executeDeposits(uint256 moduleId, uint64 depositsCount) external payable onlyRole(GOV) {
        ModuleView storage moduleData = _getModuleStorageOrRevert(moduleId);
        if (moduleData.status != ModuleStatus.Active) {
            revert InvalidStatus();
        }
        if (depositsCount == 0 || depositsCount > moduleData.availableValidatorKeys) {
            revert ModuleUnavailable();
        }

        uint256 expectedValue = uint256(depositsCount) * VALIDATOR_DEPOSIT;
        if (msg.value != expectedValue) {
            revert ValueMismatch();
        }

        (bytes[] memory pubkeys, bytes[] memory signatures, bytes32[] memory roots) = IStakingModuleLite(moduleData.module)
            .getDepositData(depositsCount);

        if (pubkeys.length != depositsCount || signatures.length != depositsCount || roots.length != depositsCount) {
            revert InvalidArrayLength();
        }

        bytes memory creds = abi.encodePacked(WITHDRAWAL_CREDENTIALS);
        uint256 singleDeposit = VALIDATOR_DEPOSIT;
        for (uint256 i = 0; i < depositsCount; i++) {
            DEPOSIT_CONTRACT.deposit{value: singleDeposit}(pubkeys[i], creds, signatures[i], roots[i]);
        }

        IStakingModuleLite(moduleData.module).markDeposited(depositsCount);

        moduleData.availableValidatorKeys = moduleData.availableValidatorKeys - depositsCount;
        uint256 newDepositCount = uint256(moduleData.depositedValidatorCount) + depositsCount;
        if (newDepositCount > type(uint64).max) {
            revert Overflow();
        }
        moduleData.depositedValidatorCount = uint64(newDepositCount);

        emit ModuleDepositsExecuted(moduleId, depositsCount);
    }

    function _validateBps(uint16 targetShareBps, uint16 maxShareBps, uint16 moduleFeeBps, uint16 treasuryFeeBps) internal pure {
        if (
            targetShareBps > MAX_BPS ||
            maxShareBps > MAX_BPS ||
            moduleFeeBps > MAX_BPS ||
            treasuryFeeBps > MAX_BPS ||
            targetShareBps > maxShareBps
        ) {
            revert InvalidBps();
        }
    }

    function _getModuleStorageOrRevert(uint256 moduleId) internal view returns (ModuleView storage moduleData) {
        if (moduleId == 0 || moduleId > moduleCount) {
            revert UnknownModule();
        }
        moduleData = _modules[moduleId];
    }

    function _getModuleOrRevert(uint256 moduleId) internal view returns (ModuleView memory) {
        if (moduleId == 0 || moduleId > moduleCount) {
            revert UnknownModule();
        }
        return _modules[moduleId];
    }
}
