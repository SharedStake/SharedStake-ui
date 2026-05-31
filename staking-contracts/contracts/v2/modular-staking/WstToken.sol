// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {ERC20, ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {StToken} from "./StToken.sol";
import {Errors} from "../lib/Errors.sol";

/// @title WstToken - non-rebasing wrapped staked-ETH (wstETH parity)
/// @notice Each wstToken represents exactly 1 share of the underlying StToken.
///         This contract holds the actual stTokens in custody; as beacon rewards
///         cause StToken to rebase, the stToken balance held here grows while the
///         wstToken supply stays constant — producing an ever-increasing exchange rate.
///
///         Wrap:   stToken → wstToken (user deposits stTokens, receives wstTokens = shares)
///         Unwrap: wstToken → stToken (user burns wstTokens, receives rebased stTokens)
contract WstToken is ERC20Permit, ReentrancyGuard {
    using SafeERC20 for IERC20;

    StToken public immutable ST_TOKEN;

    event Wrap(address indexed account, uint256 stTokenAmount, uint256 wstTokenAmount);
    event Unwrap(address indexed account, uint256 wstTokenAmount, uint256 stTokenAmount);

    constructor(address stToken)
        ERC20("Wrapped SharedStake Staked Ether", "wstETH")
        ERC20Permit("Wrapped SharedStake Staked Ether")
    {
        if (stToken == address(0)) revert Errors.ZeroAddress();
        ST_TOKEN = StToken(stToken);
    }

    // ── Core operations ───────────────────────────────────────────────────────

    /// @notice Wrap `stAmount` stTokens into wstTokens.
    ///         Caller must have approved this contract for at least `stAmount`.
    /// @return wstAmount wstTokens minted (== shares represented by `stAmount`).
    function wrap(uint256 stAmount) external nonReentrant returns (uint256 wstAmount) {
        if (stAmount == 0) revert Errors.InvalidAmount();

        // Shares corresponding to this stToken amount at current exchange rate.
        wstAmount = ST_TOKEN.getSharesByPooledEth(stAmount);
        if (wstAmount == 0) revert Errors.InvalidAmount();

        // Pull stTokens into this contract (they rebase in place over time).
        IERC20(address(ST_TOKEN)).safeTransferFrom(msg.sender, address(this), stAmount);

        // Mint wstToken 1:1 with shares deposited.
        _mint(msg.sender, wstAmount);
        emit Wrap(msg.sender, stAmount, wstAmount);
    }

    /// @notice Unwrap `wstAmount` wstTokens back into stTokens.
    ///         The returned stToken amount reflects all beacon rewards accrued since wrapping.
    /// @return stAmount stTokens returned to caller.
    function unwrap(uint256 wstAmount) external nonReentrant returns (uint256 stAmount) {
        if (wstAmount == 0) revert Errors.InvalidAmount();
        if (balanceOf(msg.sender) < wstAmount) revert Errors.InsufficientBalance();

        // Current stToken equivalent of these shares (higher than when wrapped if rewards accrued).
        stAmount = getStTokenByWstToken(wstAmount);

        _burn(msg.sender, wstAmount);
        IERC20(address(ST_TOKEN)).safeTransfer(msg.sender, stAmount);
        emit Unwrap(msg.sender, wstAmount, stAmount);
    }

    // ── Exchange rate views ───────────────────────────────────────────────────

    /// @notice stTokens (wei) that correspond to `wstAmount` wstTokens at current exchange rate.
    function getStTokenByWstToken(uint256 wstAmount) public view returns (uint256) {
        return ST_TOKEN.getPooledEthByShares(wstAmount);
    }

    /// @notice wstTokens (shares) that correspond to `stAmount` stTokens at current exchange rate.
    function getWstTokenByStToken(uint256 stAmount) public view returns (uint256) {
        return ST_TOKEN.getSharesByPooledEth(stAmount);
    }

    /// @notice Current stTokens per wstToken (18-decimal fixed-point, increases over time as rewards accrue).
    function stTokensPerToken() external view returns (uint256) {
        uint256 totalShares = ST_TOKEN.getTotalShares();
        if (totalShares == 0) return 1e18;
        return (ST_TOKEN.totalPooledEther() * 1e18) / totalShares;
    }
}
