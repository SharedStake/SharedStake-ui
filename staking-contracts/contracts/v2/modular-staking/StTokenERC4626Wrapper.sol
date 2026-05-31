// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title StTokenERC4626Wrapper
 * @notice ERC-4626 vault wrapping the rebasing stToken into a non-rebasing vault token.
 *         Enables DeFi composability (Aave, Compound, Pendle, etc.) without protocols
 *         needing to handle rebasing balances.
 *
 * asset  = stToken  — the rebasing staked-ETH token (balanceOf returns ETH-equivalent)
 * share  = vault token issued by this contract (non-rebasing)
 *
 * Because stToken is rebasing, the vault's stToken balance grows as rewards accrue,
 * causing each vault share to appreciate in stToken terms automatically.
 *
 * Withdrawal note: withdraw()/redeem() return stToken synchronously.
 * To convert stToken back to ETH, use the WithdrawalQueueV2 two-step flow.
 */
contract StTokenERC4626Wrapper is ERC4626 {
    using Math for uint256;

    error ZeroSharesDeposit(uint256 assets);

    // Cached to avoid repeated asset() calls; same address as ERC4626._asset.
    IERC20 private immutable ST_TOKEN;

    constructor(address stToken)
        ERC20("SharedStake Wrapped StToken", "wstToken-4626")
        ERC4626(IERC20(stToken))
    {
        require(stToken != address(0), "StTokenERC4626Wrapper: zero address");
        ST_TOKEN = IERC20(stToken);
    }

    // ─── ERC-4626 overrides ──────────────────────────────────────────────────

    /**
     * @notice Total stToken (ETH-equivalent) held by this vault.
     *         stToken.balanceOf already returns ETH-equivalent (rebasing token),
     *         so no further conversion is needed.
     */
    function totalAssets() public view override returns (uint256) {
        return ST_TOKEN.balanceOf(address(this));
    }

    /**
     * @notice Convert vault shares to stToken amount at the current exchange rate.
     *         Uses Floor rounding (favours the vault, protects against dust attacks).
     */
    function convertToAssets(uint256 shares) public view override returns (uint256) {
        uint256 supply = totalSupply();
        if (supply == 0) return shares;
        return shares.mulDiv(totalAssets(), supply, Math.Rounding.Down);
    }

    /**
     * @notice Convert stToken amount to vault shares at the current exchange rate.
     *         Uses Floor rounding (user gets slightly fewer shares on deposit).
     */
    function convertToShares(uint256 assets) public view override returns (uint256) {
        uint256 supply = totalSupply();
        uint256 held = totalAssets();
        if (supply == 0 || held == 0) return assets;
        return assets.mulDiv(supply, held, Math.Rounding.Down);
    }

    function previewDeposit(uint256 assets) public view override returns (uint256) {
        return convertToShares(assets);
    }

    function previewMint(uint256 shares) public view override returns (uint256) {
        uint256 supply = totalSupply();
        uint256 held = totalAssets();
        if (supply == 0 || held == 0) return shares;
        return shares.mulDiv(held, supply, Math.Rounding.Up);
    }

    function previewWithdraw(uint256 assets) public view override returns (uint256) {
        uint256 supply = totalSupply();
        uint256 held = totalAssets();
        if (supply == 0 || held == 0) return assets;
        return assets.mulDiv(supply, held, Math.Rounding.Up);
    }

    function previewRedeem(uint256 shares) public view override returns (uint256) {
        return convertToAssets(shares);
    }

    // ─── Internal deposit/withdraw (OZ ERC4626 hooks) ────────────────────────

    function _deposit(address caller, address receiver, uint256 assets, uint256 shares) internal override {
        // Prevent zero-share deposits (donation inflation attack vector).
        if (assets > 0 && shares == 0) revert ZeroSharesDeposit(assets);
        SafeERC20.safeTransferFrom(ST_TOKEN, caller, address(this), assets);
        _mint(receiver, shares);
        emit Deposit(caller, receiver, assets, shares);
    }

    function _withdraw(
        address caller,
        address receiver,
        address owner,
        uint256 assets,
        uint256 shares
    ) internal override {
        if (caller != owner) {
            _spendAllowance(owner, caller, shares);
        }
        _burn(owner, shares);
        SafeERC20.safeTransfer(ST_TOKEN, receiver, assets);
        emit Withdraw(caller, receiver, owner, assets, shares);
    }
}
