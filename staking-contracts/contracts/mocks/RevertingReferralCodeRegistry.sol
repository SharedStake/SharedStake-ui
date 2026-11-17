// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Test helper that passes wiring validation (zero-code lookup succeeds)
///         but reverts on non-zero code lookups to simulate resolver failures.
contract RevertingReferralCodeRegistry {
    function resolveReferralCode(bytes32 codeHash) external pure returns (address) {
        if (codeHash == bytes32(0)) return address(0);
        revert("forced-referral-code-resolver-revert");
    }
}
