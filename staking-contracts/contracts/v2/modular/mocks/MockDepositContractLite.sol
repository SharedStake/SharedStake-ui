// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

contract MockDepositContractLite {
    uint64 public depositCount;

    event DepositAccepted(bytes pubkey, bytes withdrawalCredentials, bytes signature, bytes32 depositDataRoot, uint256 value);

    function deposit(
        bytes calldata pubkey,
        bytes calldata withdrawalCredentials,
        bytes calldata signature,
        bytes32 depositDataRoot
    ) external payable {
        depositCount = depositCount + 1;
        emit DepositAccepted(pubkey, withdrawalCredentials, signature, depositDataRoot, msg.value);
    }
}

