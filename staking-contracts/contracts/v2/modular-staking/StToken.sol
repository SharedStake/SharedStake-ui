// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {ShareMath} from "./ShareMath.sol";
import {Errors} from "../lib/Errors.sol";

/// @title StToken - rebasing staked-ETH token (stETH parity)
/// @notice Balances rebase automatically when oracle reports new pooled ETH.
///         Under the hood, the contract stores shares. The rebasing balance is:
///             balanceOf(account) = sharesOf(account) * totalPooledEther / totalShares
/// @dev ERC20 events are emitted with token amounts, not share amounts.
///      TransferShares events provide the share-level view.
contract StToken is AccessControl, ReentrancyGuard {
    using ShareMath for *;

    // ── Roles ────────────────────────────────────────────────────────────────
    bytes32 public constant MINTER = keccak256("MINTER");
    bytes32 public constant GOV = keccak256("GOV");

    // ── State ─────────────────────────────────────────────────────────────────
    string public constant name = "SharedStake Staked Ether";
    string public constant symbol = "stETH";
    uint8 public constant decimals = 18;

    uint256 private _totalShares;
    uint256 private _totalPooledEther;

    mapping(address => uint256) private _sharesOf;
    /// @notice Token-denominated allowances (not share-denominated; mirrors ERC20 convention).
    mapping(address => mapping(address => uint256)) private _allowances;

    // ── Events ────────────────────────────────────────────────────────────────
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event TransferShares(address indexed from, address indexed to, uint256 sharesValue);
    event SharesMinted(address indexed account, uint256 tokenAmount, uint256 sharesAmount);
    event SharesBurned(address indexed account, uint256 tokenAmount, uint256 sharesAmount);
    event TotalPooledEtherUpdated(uint256 preTotalPooledEther, uint256 postTotalPooledEther);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ── ERC20 surface ─────────────────────────────────────────────────────────

    function totalSupply() external view returns (uint256) {
        return _totalPooledEther;
    }

    function balanceOf(address account) external view returns (uint256) {
        return ShareMath.getPooledEthByShares(_sharesOf[account], _totalShares, _totalPooledEther);
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external nonReentrant returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external nonReentrant returns (bool) {
        uint256 currentAllowance = _allowances[from][msg.sender];
        if (currentAllowance != type(uint256).max) {
            if (currentAllowance < amount) revert Errors.InsufficientAllowance();
            unchecked {
                _approve(from, msg.sender, currentAllowance - amount);
            }
        }
        _transfer(from, to, amount);
        return true;
    }

    // ── Share-aware functions ─────────────────────────────────────────────────

    function sharesOf(address account) external view returns (uint256) {
        return _sharesOf[account];
    }

    function getTotalShares() external view returns (uint256) {
        return _totalShares;
    }

    function totalPooledEther() external view returns (uint256) {
        return _totalPooledEther;
    }

    function getSharesByPooledEth(uint256 ethAmount) external view returns (uint256) {
        return ShareMath.getSharesByPooledEth(ethAmount, _totalShares, _totalPooledEther);
    }

    function getPooledEthByShares(uint256 sharesAmount) external view returns (uint256) {
        return ShareMath.getPooledEthByShares(sharesAmount, _totalShares, _totalPooledEther);
    }

    /// @notice Transfer by share amount rather than token amount.
    function transferShares(address to, uint256 sharesAmount) external returns (uint256 tokensAmount) {
        tokensAmount = ShareMath.getPooledEthByShares(sharesAmount, _totalShares, _totalPooledEther);
        _transferShares(msg.sender, to, sharesAmount);
        emit Transfer(msg.sender, to, tokensAmount);
    }

    // ── Privileged: share supply management ──────────────────────────────────

    /// @notice Mint shares to `recipient`. Called by StakingCore on deposit.
    function mintShares(address recipient, uint256 sharesAmount) external onlyRole(MINTER) {
        if (recipient == address(0)) revert Errors.ZeroAddress();
        if (sharesAmount == 0) revert Errors.InvalidAmount();

        _sharesOf[recipient] += sharesAmount;
        _totalShares += sharesAmount;

        uint256 tokenAmount = ShareMath.getPooledEthByShares(sharesAmount, _totalShares, _totalPooledEther);
        emit SharesMinted(recipient, tokenAmount, sharesAmount);
        emit Transfer(address(0), recipient, tokenAmount);
    }

    /// @notice Burn shares from `account`. Called by StakingCore on withdrawal.
    function burnShares(address account, uint256 sharesAmount) external onlyRole(MINTER) {
        if (sharesAmount == 0) revert Errors.InvalidAmount();
        if (_sharesOf[account] < sharesAmount) revert Errors.InsufficientBalance();

        uint256 tokenAmount = ShareMath.getPooledEthByShares(sharesAmount, _totalShares, _totalPooledEther);
        _sharesOf[account] -= sharesAmount;
        _totalShares -= sharesAmount;

        emit SharesBurned(account, tokenAmount, sharesAmount);
        emit Transfer(account, address(0), tokenAmount);
    }

    /// @notice Called by StakingCore when oracle reports new beacon balance (reward rebase).
    function setTotalPooledEther(uint256 newTotalPooledEther) external onlyRole(MINTER) {
        emit TotalPooledEtherUpdated(_totalPooledEther, newTotalPooledEther);
        _totalPooledEther = newTotalPooledEther;
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    function addMinter(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (minter == address(0)) revert Errors.ZeroAddress();
        grantRole(MINTER, minter);
    }

    function removeMinter(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(MINTER, minter);
    }

    function transferAdmin(address newAdmin) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newAdmin == address(0)) revert Errors.ZeroAddress();
        // Clean up MINTER role from old admin before transferring DEFAULT_ADMIN_ROLE
        if (hasRole(MINTER, msg.sender)) {
            renounceRole(MINTER, msg.sender);
        }
        grantRole(DEFAULT_ADMIN_ROLE, newAdmin);
        renounceRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    function _transfer(address from, address to, uint256 amount) internal {
        if (to == address(0)) revert Errors.ZeroAddress();
        if (amount == 0) {
            emit Transfer(from, to, 0);
            return;
        }
        uint256 shares = ShareMath.getSharesByPooledEth(amount, _totalShares, _totalPooledEther);
        if (shares == 0) revert Errors.InvalidAmount();
        _transferShares(from, to, shares);
        emit Transfer(from, to, amount);
    }

    function _transferShares(address from, address to, uint256 sharesAmount) internal {
        if (_sharesOf[from] < sharesAmount) revert Errors.InsufficientBalance();
        unchecked {
            _sharesOf[from] -= sharesAmount;
        }
        _sharesOf[to] += sharesAmount;
        emit TransferShares(from, to, sharesAmount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
}
