// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

interface IStakingModuleLite {
    function availableValidatorKeys() external view returns (uint64);

    function getDepositData(
        uint256 depositsCount
    ) external view returns (bytes[] memory pubkeys, bytes[] memory signatures, bytes32[] memory depositDataRoots);

    function markDeposited(uint64 depositsCount) external;
}

