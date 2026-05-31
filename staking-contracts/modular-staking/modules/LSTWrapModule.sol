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

    // ── Events ────────────────────────────────────────────────────────────────
    event PriceOracleSet(address indexed oracle);
    event LstWrapped(address indexed account, address indexed recipient, uint256 lstAmount, uint256 ethEquiv);
    event LstUnwrapped(address indexed account, address indexed recipient, uint256 stTokenAmount, uint256 lstAmount);
    event MaxOracleAgeSet(uint256 newValue);

    // ── Errors ────────────────────────────────────────────────────────────────
    error PriceOracleNotSet();
    error InsufficientLstHeld(uint256 requested, uint256 held);

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
    function wrapLST(uint256 lstAmount, address recipient)
        external
        nonReentrant
        whenNotPaused(PAUSE_WRAP)
        returns (uint256 ethEquiv)
    {
        if (lstAmount == 0) revert Errors.InvalidAmount();
        if (recipient == address(0)) revert Errors.ZeroAddress();
        if (address(priceOracle) == address(0)) revert PriceOracleNotSet();

        // Reject stale oracle readings before querying price — protects against minting
        // unbacked stToken if an LST depegs and the oracle hasn't updated.
        if (block.timestamp - priceOracle.lastUpdated() > maxOracleAgeSecs) {
            revert Errors.StaleOracle();
        }
        ethEquiv = priceOracle.getEthValue(lstAmount);
        if (ethEquiv == 0) revert Errors.InvalidAmount();

        // Pull LST in first so the router's totalEth() / mint-cap check sees the new balance.
        LST_TOKEN.safeTransferFrom(msg.sender, address(this), lstAmount);
        _lstHeld += lstAmount;

        // Router mints shares to recipient and (re)checks the cap.
        ROUTER.wrapFromModule(MODULE_ID, recipient, ethEquiv);

        emit LstWrapped(msg.sender, recipient, lstAmount, ethEquiv);
    }

    /// @notice Burn `stTokenAmount` of stToken and receive LST in return.
    ///         Caller must hold the stToken; the Router will burn it from `msg.sender`.
    function unwrapLST(uint256 stTokenAmount, address recipient)
        external
        nonReentrant
        whenNotPaused(PAUSE_UNWRAP)
        returns (uint256 lstAmount)
    {
        if (stTokenAmount == 0) revert Errors.InvalidAmount();
        if (recipient == address(0)) revert Errors.ZeroAddress();
        if (address(priceOracle) == address(0)) revert PriceOracleNotSet();

        if (block.timestamp - priceOracle.lastUpdated() > maxOracleAgeSecs) {
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

    // ── Admin ────────────────────────────────────────────────────────────────

    function setPriceOracle(address oracle) external onlyRole(GOV) {
        if (oracle == address(0)) revert Errors.ZeroAddress();
        priceOracle = ILSTPriceOracle(oracle);
        emit PriceOracleSet(oracle);
    }

    /// @notice Update the maximum tolerated price-oracle staleness (seconds).
    /// @param secs New max age. `wrapLST` reverts when the oracle's `lastUpdated()`
    ///        is older than this.
    function setMaxOracleAge(uint256 secs) external onlyRole(GOV) {
        maxOracleAgeSecs = secs;
        emit MaxOracleAgeSet(secs);
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
