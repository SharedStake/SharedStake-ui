// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

/// @title IOperatorRegistry - interface for operator eligibility system
/// @notice Modules like ValidatorModule use this to check if an operator is
///         eligible to deposit based on bond requirements, and to track
///         active validator counts.
interface IOperatorRegistry {
    /// @notice Check if an operator is eligible to deposit (has available slots)
    /// @param operator Operator address to check
    /// @return True if operator can deposit
    function canDeposit(address operator) external view returns (bool);

    /// @notice Increment active validator count after successful deposit
    /// @param operator Operator address
    function incrementActive(address operator) external;

    /// @notice Decrement active validator count after validator exit
    /// @param operator Operator address
    function decrementActive(address operator) external;

    /// @notice Number of NFTs currently escrowed for an operator.
    /// @param operator Operator address
    /// @return Count of escrowed NFTs
    function escrowedNftCount(address operator) external view returns (uint256);

    /// @notice Lock a SharedStake NFT to earn SGT bond credit.
    ///         The NFT is escrowed here and returned on exitBond.
    /// @param tokenId ERC-721 token ID to lock (caller must approve first)
    function lockNftForCredit(uint256 tokenId) external;

    /// @notice SGT credit applied per locked NFT (in wei).
    function nftSgtCredit() external view returns (uint256);

    /// @notice Pull NFTs back after exitBond() using the two-step pull pattern.
    ///         Separated from exitBond() to prevent a single reverting transferFrom
    ///         from bricking the entire bond exit.
    function withdrawEscrowedNfts() external;
}