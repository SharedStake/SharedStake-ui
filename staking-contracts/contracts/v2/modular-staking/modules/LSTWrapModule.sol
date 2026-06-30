// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IStakingRouter} from "../interfaces/IStakingRouter.sol";
import {IStakingModule} from "../interfaces/IStakingModule.sol";
import {ILSTPriceOracle} from "../interfaces/ILSTPriceOracle.sol";
import {GranularPauseUpgradeable} from "../../lib/GranularPauseUpgradeable.sol";
import {Errors} from "../../lib/Errors.sol";

interface IRouterStTokenGetter {
    // slither-disable-next-line naming-convention
    function ST_TOKEN() external view returns (address);
}

interface IRouterAccountingSyncer {
    function syncAccounting() external;
}

/// @title LSTWrapModule - accept LSTs (stETH, rETH, etc.) and mint stToken
/// @notice Separate entry/exit path from the validator modules. Users deposit an
///         existing LST, get stToken backed by the ETH equivalent of that LST.
///         Exits go through this module's `unwrapLST` (NOT the withdrawal queue):
///         the module pulls approved stToken, burns its own custody via the Router,
///         and returns LST at the current oracle value.
///
///         This module's `totalEth()` is `priceOracle.getEthValue(LST balance)` so
///         the Router can sync rebases/depegs into global stToken accounting.
///
/// Roles:
///   GOV       — set price oracle, pause/unpause
///   GUARDIAN  — emergency pause
/// @custom:oz-upgrades-unsafe-allow constructor
contract LSTWrapModule is Initializable, UUPSUpgradeable, AccessControlUpgradeable, ReentrancyGuardUpgradeable, GranularPauseUpgradeable, IStakingModule {
    using SafeERC20 for IERC20;

    // ── Roles ─────────────────────────────────────────────────────────────────
    bytes32 public constant GOV = keccak256("GOV");
    bytes32 public constant GUARDIAN = keccak256("GUARDIAN");

    // ── Pause IDs ─────────────────────────────────────────────────────────────
    uint16 public constant PAUSE_WRAP = 0;
    uint16 public constant PAUSE_UNWRAP = 1;

    // ── State (was immutables) ────────────────────────────────────────────────
    IStakingRouter public ROUTER;
    bytes32 public MODULE_ID;
    IERC20 public LST_TOKEN;

    // ── State ─────────────────────────────────────────────────────────────────
    ILSTPriceOracle public priceOracle;

    /// @notice Maximum allowed age (seconds) of the price oracle's last update before
    ///         `wrapLST` reverts with `StaleOracle`. Default 3600 (1 hour).
    uint256 public maxOracleAgeSecs;

    /// @notice Max cross-block ETH/LST price change (basis points). 0 disables the guard.
    ///         Protects against flash-loan oracle inflation: flash loans are single-tx,
    ///         so the stored price reflects the pre-attack state from the previous block.
    uint256 public maxWrapPriceDriftBps;

    // Per-block price observation for the wrap-side drift guard.
    uint256 private _lastWrapPrice; // ETH per LST unit scaled by 1e18
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

    constructor() {
        _disableInitializers();
    }

    function initialize(address router, bytes32 moduleId, address lstToken, address gov) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        if (router == address(0) || lstToken == address(0) || gov == address(0)) {
            revert Errors.ZeroAddress();
        }
        if (moduleId == bytes32(0)) revert Errors.InvalidAmount();
        ROUTER = IStakingRouter(router);
        MODULE_ID = moduleId;
        LST_TOKEN = IERC20(lstToken);
        maxOracleAgeSecs = 3600;
        maxWrapPriceDriftBps = 1000; // 10%

        _grantRole(DEFAULT_ADMIN_ROLE, gov);
        _grantRole(GOV, gov);
        _grantRole(GUARDIAN, gov);
    }

    function _authorizeUpgrade(address) internal override onlyRole(GOV) {}

    /// @dev Disambiguate _msgSender across ContextUpgradeable and GranularPauseUpgradeable.
    function _msgSender() internal view override(ContextUpgradeable, GranularPauseUpgradeable) returns (address) {
        return ContextUpgradeable._msgSender();
    }

    // ── User entry/exit ──────────────────────────────────────────────────────

    /// @notice Deposit `lstAmount` of the wrapped LST in exchange for stToken.
    ///         Caller must have approved this contract for at least `lstAmount`.
    /// @param recipient Address to receive the minted stToken.
    // slither-disable-start reentrancy-benign
    // The token transfer precedes drift-guard state writes so fee-on-transfer LSTs
    // can be measured by balance delta; nonReentrant blocks module callback entry.
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
        // slither-disable-start reentrancy-balance
        // False positive: nonReentrant blocks module reentry, and the post-transfer
        // balance delta is intentionally used to support fee-on-transfer LSTs.
        uint256 balanceBefore = LST_TOKEN.balanceOf(address(this));
        LST_TOKEN.safeTransferFrom(msg.sender, address(this), lstAmount);
        uint256 balanceAfter = LST_TOKEN.balanceOf(address(this));
        uint256 received = balanceAfter - balanceBefore;
        if (received < 1) revert Errors.InvalidAmount();
        // slither-disable-end reentrancy-balance

        ethEquiv = priceOracle.getEthValue(received);
        if (ethEquiv < 1) revert Errors.InvalidAmount();

        // Per-block price drift guard (H5 fix): compare current unit price against the
        // price observed in the most recent block that recorded a wrap. Flash loans are
        // single-transaction, so the stored price reflects the pre-manipulation state.
        uint256 unitPrice = (ethEquiv * 1e18) / received;
        _enforceWrapPriceDrift(unitPrice);

        // Router mints shares to recipient and (re)checks the cap.
        ROUTER.wrapFromModule(MODULE_ID, recipient, ethEquiv);

        emit LstWrapped(msg.sender, recipient, received, ethEquiv);
    }
    // slither-disable-end reentrancy-benign

    /// @notice Burn `stTokenAmount` of stToken and receive LST in return.
    ///         Caller must approve this module for stToken; the module pulls the
    ///         shares into custody before asking the Router to burn them.
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

        // Sync module valuation before ERC20 token-amount allowance math, then pull
        // stToken into module custody. The router will only burn from this module.
        IRouterAccountingSyncer(address(ROUTER)).syncAccounting();
        IERC20(IRouterStTokenGetter(address(ROUTER)).ST_TOKEN()).safeTransferFrom(
            msg.sender,
            address(this),
            stTokenAmount
        );
        uint256 ethValue = ROUTER.unwrapToModule(MODULE_ID, address(this), stTokenAmount);

        lstAmount = priceOracle.getLstValue(ethValue);
        if (lstAmount == 0) revert Errors.InvalidAmount();
        uint256 held = LST_TOKEN.balanceOf(address(this));
        if (lstAmount > held) revert InsufficientLstHeld(lstAmount, held);

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
        uint256 held = LST_TOKEN.balanceOf(address(this));
        if (address(priceOracle) == address(0) || held < 1) return 0;
        return priceOracle.getEthValue(held);
    }

    /// @inheritdoc IStakingModule
    function moduleType() external pure override returns (bytes32) {
        return keccak256("LST_WRAP");
    }

    /// @inheritdoc IStakingModule
    function implementationCodeHash() external view override returns (bytes32) {
        address implementation = _getImplementation();
        if (implementation == address(0)) return address(this).codehash;
        return implementation.codehash;
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
        // Require a valid seed — a zero price means the oracle is broken/uninitialized,
        // and would leave _lastWrapPrice == 0, bypassing all drift enforcement on first wrap.
        if (seedPrice == 0) revert Errors.InvalidAmount();
        _lastWrapPrice = seedPrice;
        _lastWrapPriceBlock = block.number;
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
        return LST_TOKEN.balanceOf(address(this));
    }

    // ── Storage gap ─────────────────────────────────────────────────────────────
    uint256[50] private __gap;
}
