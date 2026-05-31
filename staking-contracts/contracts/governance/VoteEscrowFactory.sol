// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.7;
import "./voteEscrow.sol";
import "../interfaces/IVotingEscrow.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VoteEscrowFactory {
    event VoteEscrowCreated(
        address indexed addr,
        string name,
        string indexed symbol,
        address lockedToken,
        uint256 minLockedAmount
    );

    constructor() {}

    function createVoteEscrowContract(
        string memory _name,
        string memory _symbol,
        address _lockedToken,
        uint256 _minLockedAmount
    ) external returns (address ve) {
        ve = address(new VoteEscrow(_name, _symbol, _lockedToken, _minLockedAmount));
        Ownable(ve).transferOwnership(msg.sender);
        emit VoteEscrowCreated(ve, _name, _symbol, _lockedToken, _minLockedAmount);
        return ve;
    }
}
