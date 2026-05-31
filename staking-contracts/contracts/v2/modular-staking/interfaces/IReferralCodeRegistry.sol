// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

interface IReferralCodeRegistry {
    function resolveReferralCode(bytes32 codeHash) external view returns (address referrer);
}
