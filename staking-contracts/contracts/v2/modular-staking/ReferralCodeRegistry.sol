// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Errors} from "../lib/Errors.sol";
import {IReferralCodeRegistry} from "./interfaces/IReferralCodeRegistry.sol";

/// @title ReferralCodeRegistry - on-chain short-code resolver for referrals
/// @notice Stores immutable key/value mappings from normalized referral code hash
///         (`bytes32`) to a referrer address. Code normalization (casing, spacing,
///         charset policy) must happen off-chain before hashing.
///
/// Roles:
///   GOV         — governance role, full admin controls
///   CODE_ADMIN  — operations role to register/update/revoke referral codes
contract ReferralCodeRegistry is AccessControl, IReferralCodeRegistry {
    bytes32 public constant GOV = keccak256("GOV");
    bytes32 public constant CODE_ADMIN = keccak256("CODE_ADMIN");

    struct ReferralCodeRecord {
        address referrer;
        bytes32 metadataHash;
        bool exists;
    }

    mapping(bytes32 => ReferralCodeRecord) private _records;

    event ReferralCodeRegistered(bytes32 indexed codeHash, address indexed referrer, bytes32 indexed metadataHash);
    event ReferralCodeUpdated(
        bytes32 indexed codeHash,
        address indexed previousReferrer,
        address indexed newReferrer,
        bytes32 metadataHash
    );
    event ReferralCodeRevoked(bytes32 indexed codeHash, address indexed previousReferrer, bytes32 indexed metadataHash);

    error InvalidReferralCode(bytes32 codeHash);
    error ReferralCodeAlreadyExists(bytes32 codeHash);
    error ReferralCodeNotFound(bytes32 codeHash);

    constructor(address gov) {
        if (gov == address(0)) revert Errors.ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, gov);
        _grantRole(GOV, gov);
        _grantRole(CODE_ADMIN, gov);
    }

    /// @notice Registers a new referral code hash -> referrer mapping.
    /// @dev `codeHash` must be produced from pre-normalized input off-chain.
    function registerReferralCode(bytes32 codeHash, address referrer, bytes32 metadataHash)
        external
        onlyRole(CODE_ADMIN)
    {
        _validateCodeInput(codeHash, referrer);
        if (_records[codeHash].exists) revert ReferralCodeAlreadyExists(codeHash);

        _records[codeHash] = ReferralCodeRecord({
            referrer: referrer,
            metadataHash: metadataHash,
            exists: true
        });

        emit ReferralCodeRegistered(codeHash, referrer, metadataHash);
    }

    /// @notice Updates an existing referral code mapping.
    function updateReferralCode(bytes32 codeHash, address referrer, bytes32 metadataHash)
        external
        onlyRole(CODE_ADMIN)
    {
        _validateCodeInput(codeHash, referrer);
        ReferralCodeRecord storage rec = _records[codeHash];
        if (!rec.exists) revert ReferralCodeNotFound(codeHash);

        address previousReferrer = rec.referrer;
        rec.referrer = referrer;
        rec.metadataHash = metadataHash;

        emit ReferralCodeUpdated(codeHash, previousReferrer, referrer, metadataHash);
    }

    /// @notice Registers or updates a referral code in a single call.
    function upsertReferralCode(bytes32 codeHash, address referrer, bytes32 metadataHash)
        external
        onlyRole(CODE_ADMIN)
    {
        _validateCodeInput(codeHash, referrer);
        ReferralCodeRecord storage rec = _records[codeHash];
        if (!rec.exists) {
            _records[codeHash] = ReferralCodeRecord({
                referrer: referrer,
                metadataHash: metadataHash,
                exists: true
            });
            emit ReferralCodeRegistered(codeHash, referrer, metadataHash);
            return;
        }

        address previousReferrer = rec.referrer;
        rec.referrer = referrer;
        rec.metadataHash = metadataHash;
        emit ReferralCodeUpdated(codeHash, previousReferrer, referrer, metadataHash);
    }

    /// @notice Revokes an existing code mapping.
    function revokeReferralCode(bytes32 codeHash) external onlyRole(CODE_ADMIN) {
        if (codeHash == bytes32(0)) revert InvalidReferralCode(codeHash);
        ReferralCodeRecord memory rec = _records[codeHash];
        if (!rec.exists) revert ReferralCodeNotFound(codeHash);
        delete _records[codeHash];

        emit ReferralCodeRevoked(codeHash, rec.referrer, rec.metadataHash);
    }

    /// @inheritdoc IReferralCodeRegistry
    function resolveReferralCode(bytes32 codeHash) external view returns (address referrer) {
        if (codeHash == bytes32(0)) return address(0);
        ReferralCodeRecord storage rec = _records[codeHash];
        if (!rec.exists) return address(0);
        return rec.referrer;
    }

    function getReferralCode(bytes32 codeHash)
        external
        view
        returns (address referrer, bytes32 metadataHash, bool exists)
    {
        ReferralCodeRecord storage rec = _records[codeHash];
        return (rec.referrer, rec.metadataHash, rec.exists);
    }

    function _validateCodeInput(bytes32 codeHash, address referrer) internal pure {
        if (codeHash == bytes32(0)) revert InvalidReferralCode(codeHash);
        if (referrer == address(0)) revert Errors.ZeroAddress();
    }
}
