// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IStakingRouter} from "../interfaces/IStakingRouter.sol";
import {IStakingModule} from "../interfaces/IStakingModule.sol";
import {ILSTPriceOracle} from "../interfaces/ILSTPriceOracle.sol";
import {GranularPause} from "../../lib/GranularPause.sol";
import {Errors} from "../../lib/Errors.sol";

/// @title LSTWrapModule - accept LSTs (stETH, rETH, etc.) and mint stToken
/// @notice Separate entry/exit path from the validator modules. Users deposit an
///         existing LST, get stToken backed by the ETH equivalent of that LST.
///         Exits go through this module's `unwrapLST` (NOT the withdrawal queue):
///         the contract burns stToken via the Router and returns LST 1-for-1 with
///         what the user originally locked.
///
///         This module's `totalEth()` is `priceOracle.getEthValue(_lstHeld)` so the
///         Router's mint cap can bound exposure to LST market depeg risk.
///
/// Roles:
///   GOV       — set price oracle, pause/unpause
///   GUARDIAN  — emergency pause
contract LSTWrapModule is AccessControl, ReentrancyGuard, GranularPause, IStakingModule {
    using SafeERC20 for IERC20;

    // ── Roles ─────────────────────────────────────────────────────────────────
    bytes32 public constant GOV = keccak256("GOV");
    bytes32 public constant GUARDIAN = keccak256("GUARDIAN");

    // ── Pause IDs ─────────────────────────────────────────────────────────────
    uint16 public constant PAUSE_WRAP = 0;
    uint16 public constant PAUSE_UNWRAP = 1;

    // ── Immutables ────────────────────────────────────────────────────────────
    IStakingRouter public immutable ROUTER;
    bytes32 public immutable MODULE_ID;
    IERC20 public immutable LST_TOKEN;

    // ── State ─────────────────────────────────────────────────────────────────
    ILSTPriceOracle public priceOracle;
    uint256 internal _lstHeld;

    /// @notice Maximum allowed age (seconds) of the price oracle's last update before
    ///         `wrapLST` reverts with `StaleOracle`. Default 3600 (1 hour).
    uint256 public maxOracleAgeSecs = 3600;

    /// @notice Max cross-block ETH/LST price change (basis points). 0 disables the guard.
    ///         Protects against flash-loan oracle inflation: flash loans are single-tx,
    ///         so the stored price reflects the pre-attack state from the previous block.
    uint256 public maxWrapPriceDriftBps = 1000; // 10%

    // Per-block price observation for the wrap-side drift guard.
    uint256 private _lastWrapPrice;      // ETH per LST unit scaled by 1e18
    uint256 private _lastWrapPriceBlock;

    // ── Events ────────────────────────────────────────────────────────────────
    event PriceOracleSet(address indexed oracle);
    event LstWrapped(address indexed account, address indexed recipient, uint256 lstAmount, uint256 ethEquiv);
    event LstUnwrapped(address indexed account, address indexed recipient, uint256 stTokenAmount, uint256 lstAmount);
    event MaxOracleAgeSet(uint256 newValue);
    event MaxWrapPriceDriftSet(uint256 bps);

    // ── Errors ────────────────────────────────────────────────────────────────
    error PriceOracleNotSet();
    error InsufficientLstHeld(uint256 requested, uint256 held);
    error WrapPriceDriftTooHigh(uint256 currentPrice, uint256 lastPrice, uint256 driftBps, uint256 maxDriftBps);

    constructor(address router, bytes32 moduleId, address lstToken, address gov) {
        if (router == address(0) || lstToken == address(0) || gov == address(0)) {
            revert Errors.ZeroAddress();
        }
        if (moduleId == bytes32(0)) revert Errors.InvalidAmount();
        ROUTER = IStakingRouter(router);
        MODULE_ID = moduleId;
        LST_TOKEN = IERC20(lstToken);

        _grantRole(DEFAULT_ADMIN_ROLE, gov);
        _grantRole(GOV, gov);
        _grantRole(GUARDIAN, gov);
    }

    // ── User entry/exit ──────────────────────────────────────────────────────

    /// @notice Deposit `lstAmount` of the wrapped LST in exchange for stToken.
    ///         Caller must have approved this contract for at least `lstAmount`.
    /// @param recipient Address to receive the minted stToken.
    function wrapLST(
        uint256 lstAmount,
        address recipient
    ) external nonReentrant whenNotPaused(PAUSE_WRAP) returns (uint256 ethEquiv) {
        if (lstAmount == 0) revert Errors.InvalidAmount();
        if (recipient == address(0)) revert Errors.ZeroAddress();
        if (address(priceOracle) == address(0)) revert PriceOracleNotSet();

        // Reject stale oracle readings before querying price — protects against minting
        // unbacked stToken if an LST depegs and the oracle hasn't updated.
        uint256 lastUpdated = priceOracle.lastUpdated();
        if (lastUpdated > block.timestamp || block.timestamp - lastUpdated >= maxOracleAgeSecs) {
            revert Errors.StaleOracle();
        }
        ethEquiv = priceOracle.getEthValue(lstAmount);
        if (ethEquiv == 0) revert Errors.InvalidAmount();

        // Per-block price drift guard (H5 fix): compare current unit price against the
        // price observed in the most recent block that recorded a wrap. Flash loans are
        // single-transaction, so the stored price reflects the pre-manipulation state.
        uint256 unitPrice = (ethEquiv * 1e18) / lstAmount;
        _enforceWrapPriceDrift(unitPrice);

        // Pull LST in first so the router's totalEth() / mint-cap check sees the new balance.
        LST_TOKEN.safeTransferFrom(msg.sender, address(this), lstAmount);
        _lstHeld += lstAmount;

        // Router mints shares to recipient and (re)checks the cap.
        ROUTER.wrapFromModule(MODULE_ID, recipient, ethEquiv);

        emit LstWrapped(msg.sender, recipient, lstAmount, ethEquiv);
    }

    /// @notice Burn `stTokenAmount` of stToken and receive LST in return.
    ///         Caller must hold the stToken; the Router will burn it from `msg.sender`.
    function unwrapLST(
        uint256 stTokenAmount,
        address recipient
    ) external nonReentrant whenNotPaused(PAUSE_UNWRAP) returns (uint256 lstAmount) {
        if (stTokenAmount == 0) revert Errors.InvalidAmount();
        if (recipient == address(0)) revert Errors.ZeroAddress();
        if (address(priceOracle) == address(0)) revert PriceOracleNotSet();

        uint256 lastUpdated = priceOracle.lastUpdated();
        if (lastUpdated > block.timestamp || block.timestamp - lastUpdated >= maxOracleAgeSecs) {
            revert Errors.StaleOracle();
        }

        // Router burns the stToken shares from msg.sender and tells us the ETH value.
        uint256 ethValue = ROUTER.unwrapToModule(MODULE_ID, msg.sender, stTokenAmount);

        lstAmount = priceOracle.getLstValue(ethValue);
        if (lstAmount == 0) revert Errors.InvalidAmount();
        if (lstAmount > _lstHeld) revert InsufficientLstHeld(lstAmount, _lstHeld);

        _lstHeld -= lstAmount;
        LST_TOKEN.safeTransfer(recipient, lstAmount);

        emit LstUnwrapped(msg.sender, recipient, stTokenAmount, lstAmount);
    }

    // ── IStakingModule surface ───────────────────────────────────────────────

    /// @inheritdoc IStakingModule
    /// @dev Disallowed: LST module never receives raw ETH from the Router. Reverts to
    ///      surface routing mistakes loudly rather than silently accepting funds.
    function receiveDeposit() external payable override {
        revert Errors.PermissionDenied();
    }

    /// @inheritdoc IStakingModule
    function totalEth() external view override returns (uint256) {
        if (address(priceOracle) == address(0) || _lstHeld == 0) return 0;
        return priceOracle.getEthValue(_lstHeld);
    }

    /// @inheritdoc IStakingModule
    function moduleType() external pure override returns (bytes32) {
        return keccak256("LST_WRAP");
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    function _enforceWrapPriceDrift(uint256 unitPrice) private {
        uint256 cap = maxWrapPriceDriftBps;
        if (cap > 0 && _lastWrapPrice > 0) {
            uint256 prev = _lastWrapPrice;
            uint256 driftBps = unitPrice > prev
                ? ((unitPrice - prev) * 10000) / prev
                : ((prev - unitPrice) * 10000) / prev;
            if (driftBps > cap) {
                revert WrapPriceDriftTooHigh(unitPrice, prev, driftBps, cap);
            }
        }
        if (block.number > _lastWrapPriceBlock) {
            _lastWrapPrice = unitPrice;
            _lastWrapPriceBlock = block.number;
        }
    }

    // ── Admin ────────────────────────────────────────────────────────────────

    function setPriceOracle(address oracle) external onlyRole(GOV) {
        if (oracle == address(0)) revert Errors.ZeroAddress();
        priceOracle = ILSTPriceOracle(oracle);
        // Seed the drift-guard reference price so the very first wrapLST call is
        // protected. Without this, _lastWrapPrice == 0 bypasses the drift check
        // entirely on bootstrap, allowing oracle-manipulation on the first wrap.
        uint256 seedPrice = ILSTPriceOracle(oracle).getEthValue(1e18);
        if (seedPrice > 0) {
            _lastWrapPrice = seedPrice;
            _lastWrapPriceBlock = block.number;
        }
        emit PriceOracleSet(oracle);
    }

    /// @notice Update the maximum tolerated price-oracle staleness (seconds).
    /// @param secs New max age. `wrapLST` reverts when the oracle's `lastUpdated()`
    ///        is older than this.
    function setMaxOracleAge(uint256 secs) external onlyRole(GOV) {
        maxOracleAgeSecs = secs;
        emit MaxOracleAgeSet(secs);
    }

    function setMaxWrapPriceDrift(uint256 bps) external onlyRole(GOV) {
        maxWrapPriceDriftBps = bps;
        emit MaxWrapPriceDriftSet(bps);
    }

    function pause(uint16 fnId) external onlyRole(GUARDIAN) {
        _pause(fnId);
    }

    function unpause(uint16 fnId) external onlyRole(GOV) {
        _unpause(fnId);
    }

    // ── Views ────────────────────────────────────────────────────────────────

    function lstHeld() external view returns (uint256) {
        return _lstHeld;
    }
}
