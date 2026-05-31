// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

interface IReferralRegistry {
    function recordDeposit(address referrer, address referee, uint256 ethAmount, uint256 shares) external;
    function depositReferralFeeShares(uint256 shares) external;
    function totalReferredEth() external view returns (uint256);
}
