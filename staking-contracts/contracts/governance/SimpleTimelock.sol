pragma solidity 0.8.7;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../util/TokenTimelock.sol";

/**
Token timelock forked from badger and upgraded to remove upgradeability and executor capabilities
Previously reviewed by certik and immunefi
 */

/* 
    A token timelock that is capable of interacting with other smart contracts.
    This allows the beneficiary to participate in on-chain goverance processes, despite having locked tokens.
    Features safety functions to allow beneficiary to claim ETH & ERC20-compliant tokens sent to the timelock contract, accidentially or otherwise.
    An optional 'governor' address has the ability to allow the timelock to send it's tokens to approved destinations. 
    This is intended to allow the token holder to stake their tokens in approved mechanisms.
*/

contract SimpleTimelock is TokenTimelock, ReentrancyGuard {
    mapping(address => bool) internal _transferAllowed;

    constructor(
        IERC20 token,
        address beneficiary,
        uint256 releaseTime
    ) public TokenTimelock(token, beneficiary, releaseTime) {}

    event ClaimToken(IERC20 token, uint256 amount);
    event ClaimEther(uint256 amount);

    /**
     * @notice Claim ERC20-compliant tokens other than locked token.
     * @param tokenToClaim Token to claim balance of.
     */
    function claimToken(IERC20 tokenToClaim) external onlyOwner nonReentrant {
        require(address(tokenToClaim) != address(token()), "smart-timelock/no-locked-token-claim");
        uint256 preAmount = token().balanceOf(address(this));

        uint256 claimableTokenAmount = tokenToClaim.balanceOf(address(this));
        require(claimableTokenAmount > 0, "smart-timelock/no-token-balance-to-claim");

        tokenToClaim.transfer(beneficiary(), claimableTokenAmount);

        uint256 postAmount = token().balanceOf(address(this));
        require(postAmount >= preAmount, "smart-timelock/locked-balance-check");

        emit ClaimToken(tokenToClaim, claimableTokenAmount);
    }

    /**
     * @notice Claim Ether in contract.
     */
    function claimEther() external onlyOwner nonReentrant {
        uint256 preAmount = token().balanceOf(address(this));

        uint256 etherToTransfer = address(this).balance;
        require(etherToTransfer > 0, "smart-timelock/no-ether-balance-to-claim");

        payable(beneficiary()).transfer(etherToTransfer);

        uint256 postAmount = token().balanceOf(address(this));
        require(postAmount >= preAmount, "smart-timelock/locked-balance-check");

        emit ClaimEther(etherToTransfer);
    }

    /**
     * @notice Allow timelock to receive Ether
     */
    receive() external payable {}
}
