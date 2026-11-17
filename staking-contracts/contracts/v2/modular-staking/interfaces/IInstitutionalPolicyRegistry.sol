// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

/// @title IInstitutionalPolicyRegistry
/// @notice Minimal view surface consumed by StakingRouter.
interface IInstitutionalPolicyRegistry {
    function isAllowed(bytes32 policyId, address account) external view returns (bool);
}
