// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {StToken} from "./StToken.sol";
import {FeeController} from "./FeeController.sol";
import {ShareMath} from "./ShareMath.sol";
import {IStakingModule} from "./interfaces/IStakingModule.sol";
import {IStakingRouter} from "./interfaces/IStakingRouter.sol";
import {IInstitutionalPolicyRegistry} from "./interfaces/IInstitutionalPolicyRegistry.sol";
import {IReferralRegistry} from "./interfaces/IReferralRegistry.sol";
import {IReferralCodeRegistry} from "./interfaces/IReferralCodeRegistry.sol";
import {GranularPause} from "../lib/GranularPause.sol";
import {Errors} from "../lib/Errors.sol";

/// @title IDebtPool - Interface for DebtPool contract
interface IDebtPool {
    function receiveStETHAndUnwrap(uint256 _amount) external;
}

/// @title StakingRouter - modular front-door for ETH staking
/// @notice The Router is the single MINTER on StToken for deposits and rebases.
///         It maintains a registry of modules, each with its own ETH custody and
///         (optionally) validator orchestration. Deposits are routed to a default
///         module or to a caller-specified module. Per-module mint caps prevent
///         any single module from breaching its risk budget.
///
/// Accounting invariant:
///         totalPooledEther == sum_over_modules( module.totalEth() )
///                          == sum( bufferedEther_i + beaconBalance_i ) for validator modules
///                          == priceOracle.getEthValue(lstHeld_i) for LST modules
///
///         The Router stores `moduleBeaconBalance[moduleId]` — the baseline of the
///         module's beacon side. It is bumped when validator modules call
///         `notifyBeaconDeposit` (buffered-to-beacon transfer) and used as the
///         delta baseline when oracle reports arrive.
///
/// Role model:
///   GOV       — register/configure modules, set fee controller, unpause.
///   GUARDIAN  — emergency pause (no timelock).
contract StakingRouter is AccessControl, ReentrancyGuard, GranularPause, IStakingRouter {
    using ShareMath for *;

    bytes32 private constant MODULE_TYPE_SOLO_VALIDATOR = keccak256("SOLO_VALIDATOR");
    bytes32 private constant MODULE_TYPE_DVT_VALIDATOR = keccak256("DVT_VALIDATOR");
    bytes32 private constant MODULE_TYPE_LST_WRAP = keccak256("LST_WRAP");

    struct InflowLimitConfig {
        uint256 windowSeconds;
        uint256 maxInflowEthPerWindow;
    }

    struct InflowWindowState {
        uint256 windowStart;
        uint256 inflowEth;
    }

    // ── Roles ─────────────────────────────────────────────────────────────────
    bytes32 public constant GOV = keccak256("GOV");
    bytes32 public constant GUARDIAN = keccak256("GUARDIAN");

    // ── Pause IDs ─────────────────────────────────────────────────────────────
    uint16 public constant PAUSE_SUBMIT = 0;

    // ── Immutables ────────────────────────────────────────────────────────────
    StToken public immutable ST_TOKEN;

    // ── State ─────────────────────────────────────────────────────────────────
    FeeController public feeController;

    /// @notice Module registry. moduleId => info.
    mapping(bytes32 => ModuleInfo) private _modules;
    mapping(address => bytes32) private _moduleIdByAddress;

    /// @notice Last reported beacon balance per module — used for delta-only oracle reports.
    mapping(bytes32 => uint256) public moduleBeaconBalance;

    /// @notice Optional per-module limiter config. Disabled if either field is zero.
    mapping(bytes32 => InflowLimitConfig) public moduleInflowLimitConfig;

    /// @notice Current inflow window state per module.
    mapping(bytes32 => InflowWindowState) public moduleInflowWindowState;

    /// @notice Optional global limiter config across all module inflows.
    ///         Disabled if either field is zero.
    InflowLimitConfig public globalInflowLimitConfig;

    /// @notice Current global inflow window state.
    InflowWindowState public globalInflowWindowState;

    /// @notice The module that `submit()` (no moduleId) routes to.
    bytes32 public defaultModuleId;

    /// @notice Optional registry for institutional policy checks. Zero address disables checks.
    IInstitutionalPolicyRegistry public policyRegistry;

    /// @notice Optional resolver for referral code hashes. Zero address disables
    ///         code resolution and preserves legacy address-only referral flow.
    IReferralCodeRegistry public referralCodeRegistry;

    /// @notice Optional per-module policy id. Zero value disables policy checks for that module.
    mapping(bytes32 => bytes32) public modulePolicyId;

    /// @notice Optional allowlist for module runtime code hashes keyed by module type.
    ///         When enforcement is enabled, registration only succeeds for allowlisted hashes.
    mapping(bytes32 => mapping(bytes32 => bool)) public moduleCodeHashAllowed;

    /// @notice Enable strict code-hash allowlist checks in registerModule().
    bool public enforceModuleCodeHashAllowlist;

    /// @notice Sanity bound (basis points) on per-report beacon balance gains.
    ///         A module reporting `newBeaconBalance > prior * (1 + maxDeltaBps/10000)`
    ///         reverts. Prevents a compromised/buggy module from inflating
    ///         `totalPooledEther` and diluting all stakers' shares.
    ///         Default 100 = 1% (safe for mainnet). Can be raised temporarily
    ///         via governance during high-reward periods (e.g. post-Merge).
    ///         Max absolute ceiling enforced at 1000 (10%) by setter.
    uint256 public maxDeltaBps = 100;

    /// @notice Global circuit breaker on total pooled ETH. Default 0 = unlimited.
    ///         When set to a non-zero value, any deposit or wrap that would push
    ///         totalPooledEther beyond this cap reverts. GOV can raise the cap
    ///         gradually as the protocol scales.
    uint256 public maxTotalPooledEther;

    // ── Events ────────────────────────────────────────────────────────────────
    event Deposited(
        bytes32 indexed moduleId,
        address indexed user,
        uint256 ethAmount,
        uint256 sharesAmount,
        address referral
    );
    event DepositAttributed(
        bytes32 indexed moduleId,
        address indexed user,
        bytes32 indexed sourceId,
        uint256 ethAmount,
        uint256 sharesAmount,
        address referral
    );
    event ModuleRegistered(bytes32 indexed moduleId, address indexed addr, bytes32 moduleType, uint256 mintCapEth);
    event ModuleMintCapSet(bytes32 indexed moduleId, uint256 mintCapEth);
    event ModulePausedSet(bytes32 indexed moduleId, bool paused);
    event DefaultModuleSet(bytes32 indexed moduleId);
    event ModuleBeaconReported(bytes32 indexed moduleId, uint256 newBeaconBalance, int256 delta);
    event BeaconDepositNotified(bytes32 indexed moduleId, uint256 amount);
    event FeeControllerSet(address indexed feeController);
    event FeeSharesMinted(
        address indexed treasury,
        uint256 treasuryShares,
        address indexed operator,
        uint256 operatorShares
    );
    event FeeRoutingTelemetry(
        bytes32 indexed moduleId,
        uint256 rewards,
        uint256 treasuryAmount,
        uint256 operatorAmount,
        uint256 treasuryShares,
        uint256 operatorShares,
        uint256 totalFeeAmount,
        uint256 totalPooledBeforeFees,
        uint256 totalPooledAfterFees
    );
    event LSTWrapped(bytes32 indexed moduleId, address indexed recipient, uint256 ethEquiv, uint256 sharesAmount);
    event LSTUnwrapped(bytes32 indexed moduleId, address indexed account, uint256 stTokenAmount, uint256 ethValue);
    event MaxDeltaBpsSet(uint256 newValue);
    event MaxTotalPooledEtherSet(uint256 newValue);
    event PoolInsolvent(bytes32 indexed moduleId, uint256 loss, uint256 pooledAtTime);
    event ModuleInflowLimitSet(bytes32 indexed moduleId, uint256 windowSeconds, uint256 maxInflowEthPerWindow);
    event GlobalInflowLimitSet(uint256 windowSeconds, uint256 maxInflowEthPerWindow);
    event PolicyRegistrySet(address indexed registry);
    event ModulePolicySet(bytes32 indexed moduleId, bytes32 indexed policyId);
    event ModuleCodeHashAllowedSet(bytes32 indexed moduleType, bytes32 indexed codeHash, bool allowed);
    event ModuleCodeHashAllowlistEnforcementSet(bool enabled);
    event ReferralCodeRegistrySet(address indexed registry);

    // ── Errors ────────────────────────────────────────────────────────────────
    error ModuleNotRegistered(bytes32 moduleId);
    error ModuleAlreadyRegistered(bytes32 moduleId);
    error ModuleAddressAlreadyRegistered(address moduleAddr, bytes32 existingModuleId);
    error ModuleAddressNotContract(address moduleAddr);
    error ModuleIdMismatch(bytes32 expectedModuleId, bytes32 moduleReportedId);
    error ModuleRouterMismatch(bytes32 moduleId, address moduleAddr, address expectedRouter, address actualRouter);
    error ModuleInactive(bytes32 moduleId);
    error ModulePaused(bytes32 moduleId);
    error MintCapExceeded(bytes32 moduleId, uint256 attempted, uint256 cap);
    error NotModule(bytes32 moduleId, address caller);
    error DefaultModuleNotSet();
    error BeaconReportSanityFailed(bytes32 moduleId, uint256 gainBps, uint256 maxDeltaBps);
    error MaxTotalPooledExceeded(uint256 attempted, uint256 cap);
    error BeaconBaselineNotInitialized(bytes32 moduleId, uint256 reportedBalance);
    error InflowLimitExceeded(bytes32 moduleId, uint256 attemptedWindowInflow, uint256 maxInflowEthPerWindow);
    error GlobalInflowLimitExceeded(uint256 attemptedWindowInflow, uint256 maxInflowEthPerWindow);
    error PolicyDenied(bytes32 moduleId, bytes32 policyId, address account);
    error ModuleTypeActionMismatch(bytes32 moduleId, bytes32 moduleType, bytes4 action);
    error ModuleCodeHashNotAllowed(bytes32 moduleId, address moduleAddr, bytes32 moduleType, bytes32 codeHash);
    error CodeHashEnforcementAlreadyEnabled();
    error ReferralCodeRegistryNotContract(address registry);
    error ReferralCodeRegistryInvalid(address registry);

    constructor(address stToken, address gov) {
        if (stToken == address(0) || gov == address(0)) revert Errors.ZeroAddress();
        ST_TOKEN = StToken(stToken);
        enforceModuleCodeHashAllowlist = false; // Start disabled for backward compatibility
        _grantRole(DEFAULT_ADMIN_ROLE, gov);
        _grantRole(GOV, gov);
        _grantRole(GUARDIAN, gov);
    }

    // ── External: deposit entry points ────────────────────────────────────────

    /// @notice Deposit ETH and receive stToken shares from the default module.
    function submit(
        address referral
    ) external payable nonReentrant whenNotPaused(PAUSE_SUBMIT) returns (uint256 sharesAmount) {
        if (msg.value == 0) revert Errors.InvalidAmount();
        if (defaultModuleId == bytes32(0)) revert DefaultModuleNotSet();
        sharesAmount = _deposit(defaultModuleId, msg.sender, msg.value, referral, false, bytes32(0));
    }

    /// @notice Deposit ETH into a specific module by id.
    function submitToModule(
        bytes32 moduleId,
        address referral
    ) external payable nonReentrant whenNotPaused(PAUSE_SUBMIT) returns (uint256 sharesAmount) {
        if (msg.value == 0) revert Errors.InvalidAmount();
        sharesAmount = _deposit(moduleId, msg.sender, msg.value, referral, false, bytes32(0));
    }

    /// @notice Deposit ETH and include source attribution metadata for indexers.
    function submitWithSource(
        address referral,
        bytes32 sourceId
    ) external payable nonReentrant whenNotPaused(PAUSE_SUBMIT) returns (uint256 sharesAmount) {
        if (msg.value == 0) revert Errors.InvalidAmount();
        if (defaultModuleId == bytes32(0)) revert DefaultModuleNotSet();
        sharesAmount = _deposit(defaultModuleId, msg.sender, msg.value, referral, true, sourceId);
    }

    /// @notice Deposit ETH and resolve referral from a short-code hash.
    /// @dev Falls back to no referral when the resolver is unset or code is missing.
    function submitWithReferralCode(
        bytes32 referralCode
    ) external payable nonReentrant whenNotPaused(PAUSE_SUBMIT) returns (uint256 sharesAmount) {
        if (msg.value == 0) revert Errors.InvalidAmount();
        if (defaultModuleId == bytes32(0)) revert DefaultModuleNotSet();
        address referral = _resolveReferralCode(referralCode);
        sharesAmount = _deposit(defaultModuleId, msg.sender, msg.value, referral, false, bytes32(0));
    }

    /// @notice Deposit ETH into a specific module and resolve referral from a short-code hash.
    /// @dev Falls back to no referral when the resolver is unset or code is missing.
    function submitToModuleWithReferralCode(
        bytes32 moduleId,
        bytes32 referralCode
    ) external payable nonReentrant whenNotPaused(PAUSE_SUBMIT) returns (uint256 sharesAmount) {
        if (msg.value == 0) revert Errors.InvalidAmount();
        address referral = _resolveReferralCode(referralCode);
        sharesAmount = _deposit(moduleId, msg.sender, msg.value, referral, false, bytes32(0));
    }

    /// @notice Deposit ETH with source attribution and referral short-code hash.
    /// @dev Falls back to no referral when the resolver is unset or code is missing.
    function submitWithSourceAndReferralCode(
        bytes32 referralCode,
        bytes32 sourceId
    ) external payable nonReentrant whenNotPaused(PAUSE_SUBMIT) returns (uint256 sharesAmount) {
        if (msg.value == 0) revert Errors.InvalidAmount();
        if (defaultModuleId == bytes32(0)) revert DefaultModuleNotSet();
        address referral = _resolveReferralCode(referralCode);
        sharesAmount = _deposit(defaultModuleId, msg.sender, msg.value, referral, true, sourceId);
    }

    /// @notice Deposit ETH into a specific module with source attribution and a referral short-code hash.
    /// @dev Falls back to no referral when the resolver is unset or code is missing.
    function submitToModuleWithSourceAndReferralCode(
        bytes32 moduleId,
        bytes32 referralCode,
        bytes32 sourceId
    ) external payable nonReentrant whenNotPaused(PAUSE_SUBMIT) returns (uint256 sharesAmount) {
        if (msg.value == 0) revert Errors.InvalidAmount();
        address referral = _resolveReferralCode(referralCode);
        sharesAmount = _deposit(moduleId, msg.sender, msg.value, referral, true, sourceId);
    }

    /// @notice Deposit ETH into a specific module and include source attribution metadata for indexers.
    function submitToModuleWithSource(
        bytes32 moduleId,
        address referral,
        bytes32 sourceId
    ) external payable nonReentrant whenNotPaused(PAUSE_SUBMIT) returns (uint256 sharesAmount) {
        if (msg.value == 0) revert Errors.InvalidAmount();
        sharesAmount = _deposit(moduleId, msg.sender, msg.value, referral, true, sourceId);
    }

    /// @dev Plain ETH transfer: route to default module (no referral).
    receive() external payable nonReentrant whenNotPaused(PAUSE_SUBMIT) {
        if (msg.value == 0) revert Errors.InvalidAmount();
        if (defaultModuleId == bytes32(0)) revert DefaultModuleNotSet();
        _deposit(defaultModuleId, msg.sender, msg.value, address(0), false, bytes32(0));
    }

    // ── Internal: deposit pipeline ────────────────────────────────────────────

    function _deposit(
        bytes32 moduleId,
        address user,
        uint256 amount,
        address referral,
        bool emitAttribution,
        bytes32 sourceId
    ) internal returns (uint256 sharesAmount) {
        ModuleInfo storage m = _modules[moduleId];
        if (m.addr == address(0)) revert ModuleNotRegistered(moduleId);
        if (!m.active) revert ModuleInactive(moduleId);
        if (m.paused) revert ModulePaused(moduleId);
        _enforcePolicy(moduleId, user);

        // Mint cap: 0 == unlimited; otherwise post-deposit total must not exceed cap.
        if (m.mintCapEth != 0) {
            uint256 newTotal = _effectiveModuleTotalForCap(moduleId, m.addr) + amount;
            if (newTotal > m.mintCapEth) revert MintCapExceeded(moduleId, newTotal, m.mintCapEth);
        }

        _consumeInflow(moduleId, amount);
        _consumeGlobalInflow(amount);

        // Compute shares BEFORE updating pool — pre-deposit exchange rate (no inflation).
        uint256 currentPooled = ST_TOKEN.totalPooledEther();
        uint256 currentShares = ST_TOKEN.getTotalShares();
        sharesAmount = ShareMath.getSharesByPooledEth(amount, currentShares, currentPooled);
        if (sharesAmount == 0) revert Errors.InvalidAmount();

        // Effects before external call (CEI): cap enforcement and share minting happen
        // before ETH is forwarded to the module. Combined with nonReentrant this ensures
        // state is consistent even if the module's receiveDeposit makes a re-entrant call.
        _enforceGlobalCap(currentPooled + amount);
        ST_TOKEN.mintShares(user, sharesAmount);
        _recordReferral(user, referral, amount, sharesAmount);

        // Interaction last: forward ETH to the module after all state changes are committed.
        IStakingModule(m.addr).receiveDeposit{value: amount}();

        emit Deposited(moduleId, user, amount, sharesAmount, referral);
        if (emitAttribution) {
            emit DepositAttributed(moduleId, user, sourceId, amount, sharesAmount, referral);
        }
    }

    // ── Module-callback path: beacon-balance reports ─────────────────────────

    /// @inheritdoc IStakingRouter
    function reportModuleBeaconBalance(bytes32 moduleId, uint256 newBeaconBalance) external override nonReentrant {
        ModuleInfo storage m = _requireModuleCaller(moduleId);
        _requireValidatorModuleType(moduleId, m.moduleType, this.reportModuleBeaconBalance.selector);
        if (m.paused) revert ModulePaused(moduleId);
        uint256 prior = moduleBeaconBalance[moduleId];
        uint256 currentPooled = ST_TOKEN.totalPooledEther();
        moduleBeaconBalance[moduleId] = newBeaconBalance;
        int256 delta = _applyBeaconDelta(moduleId, prior, newBeaconBalance, currentPooled);

        emit ModuleBeaconReported(moduleId, newBeaconBalance, delta);
    }

    /// @inheritdoc IStakingRouter
    function notifyBeaconDeposit(bytes32 moduleId, uint256 amount) external override nonReentrant {
        ModuleInfo storage m = _requireModuleCaller(moduleId);
        _requireValidatorModuleType(moduleId, m.moduleType, this.notifyBeaconDeposit.selector);
        moduleBeaconBalance[moduleId] += amount;
        emit BeaconDepositNotified(moduleId, amount);
    }

    /// @inheritdoc IStakingRouter
    function wrapFromModule(
        bytes32 moduleId,
        address recipient,
        uint256 ethEquiv
    ) external override nonReentrant whenNotPaused(PAUSE_SUBMIT) {
        ModuleInfo storage m = _requireModuleCaller(moduleId);
        _requireLSTWrapModuleType(moduleId, m.moduleType, this.wrapFromModule.selector);
        if (!m.active) revert ModuleInactive(moduleId);
        if (m.paused) revert ModulePaused(moduleId);
        if (recipient == address(0)) revert Errors.ZeroAddress();
        if (ethEquiv == 0) revert Errors.InvalidAmount();
        _enforcePolicy(moduleId, recipient);

        if (m.mintCapEth != 0) {
            uint256 newTotal = _effectiveModuleTotalForCap(moduleId, m.addr) + ethEquiv;
            if (newTotal > m.mintCapEth) revert MintCapExceeded(moduleId, newTotal, m.mintCapEth);
        }

        _consumeInflow(moduleId, ethEquiv);
        _consumeGlobalInflow(ethEquiv);

        uint256 currentPooled = ST_TOKEN.totalPooledEther();
        uint256 currentShares = ST_TOKEN.getTotalShares();
        uint256 shares = ShareMath.getSharesByPooledEth(ethEquiv, currentShares, currentPooled);
        if (shares == 0) revert Errors.InvalidAmount();

        _enforceGlobalCap(currentPooled + ethEquiv);
        ST_TOKEN.mintShares(recipient, shares);

        emit LSTWrapped(moduleId, recipient, ethEquiv, shares);
    }

    /// @inheritdoc IStakingRouter
    function unwrapToModule(
        bytes32 moduleId,
        address caller,
        uint256 stTokenAmount
    ) external override nonReentrant returns (uint256 ethValue) {
        ModuleInfo storage m = _requireModuleCaller(moduleId);
        _requireLSTWrapModuleType(moduleId, m.moduleType, this.unwrapToModule.selector);
        if (caller == address(0)) revert Errors.ZeroAddress();
        if (stTokenAmount == 0) revert Errors.InvalidAmount();

        // H8 — TRUST BOUNDARY: `caller` is supplied by the registered LST_WRAP module.
        // The router cannot verify this is the genuine originating user. A compromised or
        // malicious module could pass an arbitrary address, burning that account's shares.
        //
        // Required module convention (enforced by module code review at registration time):
        //   1. Transfer stToken from the end-user to address(this) via safeTransferFrom.
        //   2. Call unwrapToModule(..., address(this), amount) so `caller` == module.
        //   3. This limits the worst-case to the module's own holdings.
        //
        // A future hardening path: verify module code-hash at call-time (stored in ModuleInfo
        // at registration) so an upgradeable-proxy swap cannot retroactively change the convention.

        // Compute shares from token amount at current exchange rate.
        uint256 shares = ST_TOKEN.getSharesByPooledEth(stTokenAmount);
        if (shares == 0) revert Errors.InvalidAmount();
        ethValue = ST_TOKEN.getPooledEthByShares(shares);

        // Burn the shares from the original LST holder, reduce the pool to keep rate.
        uint256 currentPooled = ST_TOKEN.totalPooledEther();
        ST_TOKEN.burnShares(caller, shares);
        if (currentPooled >= ethValue) {
            ST_TOKEN.setTotalPooledEther(currentPooled - ethValue);
        } else {
            ST_TOKEN.setTotalPooledEther(0);
        }

        emit LSTUnwrapped(moduleId, caller, stTokenAmount, ethValue);
    }

    // ── Fee distribution (mirrors StakingCore behaviour for parity) ──────────

    function _computeFeeShares(
        uint256 treasuryAmount,
        uint256 operatorAmount,
        uint256 referralAmount,
        uint256 debtPoolAmount,
        uint256 newTotalShares,
        uint256 newTotalPooled
    ) private pure returns (uint256, uint256, uint256, uint256) {
        uint256 treasuryShares = ShareMath.getSharesByPooledEth(treasuryAmount, newTotalShares, newTotalPooled);
        uint256 operatorShares = ShareMath.getSharesByPooledEth(operatorAmount, newTotalShares, newTotalPooled);
        uint256 referralShares = ShareMath.getSharesByPooledEth(referralAmount, newTotalShares, newTotalPooled);
        uint256 debtPoolShares = ShareMath.getSharesByPooledEth(debtPoolAmount, newTotalShares, newTotalPooled);
        return (treasuryShares, operatorShares, referralShares, debtPoolShares);
    }

    function _adjustReferralForZeroReferredEth(
        address referralRegistry,
        uint256 referralShares
    ) private view returns (uint256 adjustedTreasuryShares, uint256 adjustedReferralShares) {
        if (referralRegistry == address(0) || referralShares == 0) {
            return (0, 0);
        }

        uint256 referredEth = IReferralRegistry(referralRegistry).totalReferredEth();
        if (referredEth == 0) {
            return (referralShares, 0);
        }

        return (0, referralShares);
    }

    function _mintFeeShares(
        address treasury,
        uint256 treasuryShares,
        address operator,
        uint256 operatorShares,
        address referralRegistry,
        uint256 referralShares
    ) private {
        if (treasuryShares > 0) ST_TOKEN.mintShares(treasury, treasuryShares);
        if (operatorShares > 0) ST_TOKEN.mintShares(operator, operatorShares);
        if (referralRegistry != address(0) && referralShares > 0) {
            ST_TOKEN.mintShares(referralRegistry, referralShares);
            IReferralRegistry(referralRegistry).depositReferralFeeShares(referralShares);
        }
    }

    function _distributeToDebtPool(address debtPool, uint256 debtPoolShares) private {
        if (debtPool != address(0) && debtPoolShares > 0) {
            ST_TOKEN.mintShares(debtPool, debtPoolShares);

            // Trigger unwrapping to wstETH by calling debt pool
            // DebtPool.receiveStETHAndUnwrap(debtPoolShares)
            // Note: This requires DebtPool to have FEE_CONTROLLER role
            try IDebtPool(debtPool).receiveStETHAndUnwrap(debtPoolShares) {
                // Success: stETH unwrapped to wstETH, no action needed
            } catch {
                // Failure: stETH remains in debt pool, can be unwrapped later
            }
        }
    }

    function _distributeFees(bytes32 moduleId, uint256 rewards, uint256 newTotalPooled) internal {
        // getFeeConfig / computeFees are external calls. If FeeController is misconfigured
        // or reverted, we must NOT propagate the revert — the pool update already landed and
        // oracle liveness is more critical than fee distribution. Fees are skipped for this
        // report cycle; they resume automatically on the next successful report.
        uint256 treasuryAmount;
        uint256 operatorAmount;
        uint256 debtPoolAmount;
        uint256 referralAmount;
        address treasury;
        address operator;
        address referralRegistry;
        address debtPool;
        try feeController.getFeeConfig() returns (
            uint16, uint16, uint16, uint16, address t, address o, address rr, address dp
        ) {
            treasury = t; operator = o; referralRegistry = rr; debtPool = dp;
        } catch { return; }
        try feeController.computeFees(rewards) returns (
            uint256 ta, uint256 oa, uint256 dpa, uint256 ra
        ) {
            treasuryAmount = ta; operatorAmount = oa; debtPoolAmount = dpa; referralAmount = ra;
        } catch { return; }
        if (referralRegistry == address(0)) {
            referralAmount = 0;
        }
        if (debtPool == address(0)) {
            debtPoolAmount = 0;
        }
        if (treasuryAmount == 0 && operatorAmount == 0 && referralAmount == 0 && debtPoolAmount == 0) return;

        uint256 totalFee = treasuryAmount + operatorAmount + referralAmount + debtPoolAmount;
        uint256 newTotalShares = ST_TOKEN.getTotalShares();

        // Keep pool accounting strictly tied to real backing (buffer + beacon).
        // Fee recipients are paid via share dilution from existing rewards.

        // Mint fee shares at post-rebase rate so recipients capture exactly their cut.
        (
            uint256 treasuryShares,
            uint256 operatorShares,
            uint256 referralShares,
            uint256 debtPoolShares
        ) = _computeFeeShares(
                treasuryAmount,
                operatorAmount,
                referralAmount,
                debtPoolAmount,
                newTotalShares,
                newTotalPooled
            );

        // If no referred volume exists yet, route referral-share allocation to treasury
        // instead of reverting the whole beacon report path.
        (uint256 adjustedTreasuryShares, uint256 adjustedReferralShares) = _adjustReferralForZeroReferredEth(
            referralRegistry,
            referralShares
        );
        treasuryShares += adjustedTreasuryShares;
        referralShares = adjustedReferralShares;

        // Keep pool accounting strictly tied to real backing (buffer + beacon).
        // Fee recipients are paid via share dilution from existing rewards.
        _mintFeeShares(treasury, treasuryShares, operator, operatorShares, referralRegistry, referralShares);
        _distributeToDebtPool(debtPool, debtPoolShares);

        emit FeeSharesMinted(treasury, treasuryShares, operator, operatorShares);
        emit FeeRoutingTelemetry(
            moduleId,
            rewards,
            treasuryAmount,
            operatorAmount,
            treasuryShares,
            operatorShares,
            totalFee,
            newTotalPooled,
            newTotalPooled
        );
    }

    function _recordReferral(address user, address referral, uint256 amount, uint256 sharesAmount) internal {
        if (referral == address(0) || address(feeController) == address(0)) return;
        (, , , , , , address referralRegistry, ) = feeController.getFeeConfig();
        if (referralRegistry == address(0)) return;
        IReferralRegistry(referralRegistry).recordDeposit(referral, user, amount, sharesAmount);
    }

    function _resolveReferralCode(bytes32 referralCode) internal view returns (address referral) {
        IReferralCodeRegistry registry = referralCodeRegistry;
        if (referralCode == bytes32(0) || address(registry) == address(0)) {
            return address(0);
        }
        try registry.resolveReferralCode(referralCode) returns (address resolved) {
            return resolved;
        } catch {
            return address(0);
        }
    }

    function _consumeInflow(bytes32 moduleId, uint256 amount) internal {
        InflowLimitConfig storage cfg = moduleInflowLimitConfig[moduleId];
        if (cfg.windowSeconds == 0 || cfg.maxInflowEthPerWindow == 0) {
            return;
        }

        InflowWindowState storage windowState = moduleInflowWindowState[moduleId];
        if (windowState.windowStart == 0 || block.timestamp - windowState.windowStart >= cfg.windowSeconds) {
            windowState.windowStart = block.timestamp;
            windowState.inflowEth = 0;
        }

        uint256 newInflow = windowState.inflowEth + amount;
        if (newInflow > cfg.maxInflowEthPerWindow) {
            revert InflowLimitExceeded(moduleId, newInflow, cfg.maxInflowEthPerWindow);
        }

        windowState.inflowEth = newInflow;
    }

    function _consumeGlobalInflow(uint256 amount) internal {
        InflowLimitConfig storage cfg = globalInflowLimitConfig;
        if (cfg.windowSeconds == 0 || cfg.maxInflowEthPerWindow == 0) {
            return;
        }

        InflowWindowState storage windowState = globalInflowWindowState;
        if (windowState.windowStart == 0 || block.timestamp - windowState.windowStart >= cfg.windowSeconds) {
            windowState.windowStart = block.timestamp;
            windowState.inflowEth = 0;
        }

        uint256 newInflow = windowState.inflowEth + amount;
        if (newInflow > cfg.maxInflowEthPerWindow) {
            revert GlobalInflowLimitExceeded(newInflow, cfg.maxInflowEthPerWindow);
        }

        windowState.inflowEth = newInflow;
    }

    function _requireModuleCaller(bytes32 moduleId) internal view returns (ModuleInfo storage m) {
        m = _modules[moduleId];
        if (m.addr == address(0)) revert ModuleNotRegistered(moduleId);
        if (msg.sender != m.addr) revert NotModule(moduleId, msg.sender);
    }

    function _requireModuleRegistered(bytes32 moduleId) internal view returns (ModuleInfo storage m) {
        m = _modules[moduleId];
        if (m.addr == address(0)) revert ModuleNotRegistered(moduleId);
    }

    /// @dev Effective module TVL used by mint-cap checks.
    ///      For validator modules, include pending principal that was moved to
    ///      beacon via `notifyBeaconDeposit` but is not yet reflected in module
    ///      `beaconBalance()` until the next oracle report.
    function _effectiveModuleTotalForCap(bytes32 moduleId, address moduleAddr) internal view returns (uint256) {
        uint256 total = IStakingModule(moduleAddr).totalEth();
        uint256 baseline = moduleBeaconBalance[moduleId];
        if (baseline == 0) return total;

        (bool ok, bytes memory data) = moduleAddr.staticcall(abi.encodeWithSignature("beaconBalance()"));
        if (!ok || data.length < 32) return total;

        uint256 reportedBeacon = abi.decode(data, (uint256));
        if (baseline <= reportedBeacon) return total;
        return total + (baseline - reportedBeacon);
    }

    /// @dev Checks the global pooled-ether cap, updates StToken, and returns `newPooled`.
    ///      Reverts if the cap is set and would be exceeded.
    function _enforceGlobalCap(uint256 newPooled) internal returns (uint256) {
        uint256 cap = maxTotalPooledEther;
        if (cap != 0 && newPooled > cap) revert MaxTotalPooledExceeded(newPooled, cap);
        ST_TOKEN.setTotalPooledEther(newPooled);
        return newPooled;
    }

    function _applyBeaconDelta(
        bytes32 moduleId,
        uint256 prior,
        uint256 newBeaconBalance,
        uint256 currentPooled
    ) internal returns (int256 delta) {
        if (newBeaconBalance >= prior) {
            uint256 gain = newBeaconBalance - prior;
            if (gain == 0) return 0;

            _enforceBeaconGainSanity(moduleId, prior, gain, newBeaconBalance);
            uint256 postPool = currentPooled + gain;
            ST_TOKEN.setTotalPooledEther(postPool);
            if (address(feeController) != address(0)) {
                _distributeFees(moduleId, gain, postPool);
            }
            return int256(gain);
        }

        uint256 loss = prior - newBeaconBalance;
        // Explicit branch on insolvency so we leave a trace before clamping to 0.
        if (currentPooled <= loss) {
            emit PoolInsolvent(moduleId, loss, currentPooled);
            ST_TOKEN.setTotalPooledEther(0);
        } else {
            ST_TOKEN.setTotalPooledEther(currentPooled - loss);
        }
        return -int256(loss);
    }

    function _enforceBeaconGainSanity(
        bytes32 moduleId,
        uint256 prior,
        uint256 gain,
        uint256 newBeaconBalance
    ) internal view {
        // Require module baseline initialization via notifyBeaconDeposit before
        // any positive report to prevent counting principal as rewards.
        if (prior == 0) revert BeaconBaselineNotInitialized(moduleId, newBeaconBalance);

        uint256 gainBps = (gain * 10000) / prior;
        if (gainBps > maxDeltaBps) {
            revert BeaconReportSanityFailed(moduleId, gainBps, maxDeltaBps);
        }
    }

    function _enforcePolicy(bytes32 moduleId, address account) internal view {
        IInstitutionalPolicyRegistry registry = policyRegistry;
        bytes32 policyId = modulePolicyId[moduleId];
        if (address(registry) == address(0) || policyId == bytes32(0)) {
            return;
        }
        if (!registry.isAllowed(policyId, account)) {
            revert PolicyDenied(moduleId, policyId, account);
        }
    }

    function _isValidatorModuleType(bytes32 moduleType) internal pure returns (bool) {
        return moduleType == MODULE_TYPE_SOLO_VALIDATOR || moduleType == MODULE_TYPE_DVT_VALIDATOR;
    }

    function _requireValidatorModuleType(bytes32 moduleId, bytes32 moduleType, bytes4 action) internal pure {
        if (!_isValidatorModuleType(moduleType)) {
            revert ModuleTypeActionMismatch(moduleId, moduleType, action);
        }
    }

    function _requireLSTWrapModuleType(bytes32 moduleId, bytes32 moduleType, bytes4 action) internal pure {
        if (moduleType != MODULE_TYPE_LST_WRAP) {
            revert ModuleTypeActionMismatch(moduleId, moduleType, action);
        }
    }

    // ── GOV: module registry ──────────────────────────────────────────────────

    function _validateModuleId(bytes32 moduleId) private pure {
        if (moduleId == bytes32(0)) revert Errors.InvalidAmount();
    }

    function _validateModuleAddress(address moduleAddr) private view {
        if (moduleAddr == address(0)) revert Errors.ZeroAddress();
        if (moduleAddr.code.length == 0) revert ModuleAddressNotContract(moduleAddr);
    }

    function _validateModuleNotRegistered(bytes32 moduleId, address moduleAddr) private view {
        if (_modules[moduleId].addr != address(0)) revert ModuleAlreadyRegistered(moduleId);
        bytes32 existingModuleId = _moduleIdByAddress[moduleAddr];
        if (existingModuleId != bytes32(0)) {
            revert ModuleAddressAlreadyRegistered(moduleAddr, existingModuleId);
        }
    }

    function _validateModuleWiring(bytes32 moduleId, address moduleAddr) private view {
        address wiredRouter = address(IStakingModule(moduleAddr).ROUTER());
        if (wiredRouter != address(this)) {
            revert ModuleRouterMismatch(moduleId, moduleAddr, address(this), wiredRouter);
        }
        bytes32 moduleReportedId = IStakingModule(moduleAddr).MODULE_ID();
        if (moduleReportedId != moduleId) {
            revert ModuleIdMismatch(moduleId, moduleReportedId);
        }
    }

    function _validateModuleCodeHash(address moduleAddr, bytes32 mType) private view {
        if (enforceModuleCodeHashAllowlist) {
            bytes32 codeHash = moduleAddr.codehash;
            if (!moduleCodeHashAllowed[mType][codeHash]) {
                revert ModuleCodeHashNotAllowed(bytes32(0), moduleAddr, mType, codeHash);
            }
        }
    }

    function registerModule(bytes32 moduleId, address moduleAddr, uint256 mintCapEth) external onlyRole(GOV) {
        _validateModuleId(moduleId);
        _validateModuleAddress(moduleAddr);
        _validateModuleNotRegistered(moduleId, moduleAddr);
        _validateModuleWiring(moduleId, moduleAddr);

        bytes32 mType = IStakingModule(moduleAddr).moduleType();
        _validateModuleCodeHash(moduleAddr, mType);

        _modules[moduleId] = ModuleInfo({
            addr: moduleAddr,
            moduleType: mType,
            mintCapEth: mintCapEth,
            active: true,
            paused: false
        });
        _moduleIdByAddress[moduleAddr] = moduleId;
        emit ModuleRegistered(moduleId, moduleAddr, mType, mintCapEth);
    }

    function setMintCap(bytes32 moduleId, uint256 mintCapEth) external onlyRole(GOV) {
        ModuleInfo storage m = _requireModuleRegistered(moduleId);
        m.mintCapEth = mintCapEth;
        emit ModuleMintCapSet(moduleId, mintCapEth);
    }

    /// @notice Configure optional per-module inflow limiter.
    /// @dev Disabled whenever `windowSeconds == 0` or `maxInflowEthPerWindow == 0`.
    function setModuleInflowLimit(
        bytes32 moduleId,
        uint256 windowSeconds,
        uint256 maxInflowEthPerWindow
    ) external onlyRole(GOV) {
        _requireModuleRegistered(moduleId);
        moduleInflowLimitConfig[moduleId] = InflowLimitConfig({
            windowSeconds: windowSeconds,
            maxInflowEthPerWindow: maxInflowEthPerWindow
        });
        delete moduleInflowWindowState[moduleId];
        emit ModuleInflowLimitSet(moduleId, windowSeconds, maxInflowEthPerWindow);
    }

    /// @notice Configure optional global inflow limiter across all module routes.
    /// @dev Disabled whenever `windowSeconds == 0` or `maxInflowEthPerWindow == 0`.
    function setGlobalInflowLimit(uint256 windowSeconds, uint256 maxInflowEthPerWindow) external onlyRole(GOV) {
        globalInflowLimitConfig = InflowLimitConfig({
            windowSeconds: windowSeconds,
            maxInflowEthPerWindow: maxInflowEthPerWindow
        });
        delete globalInflowWindowState;
        emit GlobalInflowLimitSet(windowSeconds, maxInflowEthPerWindow);
    }

    /// @notice Set or clear institutional policy registry. Zero address disables policy checks.
    function setPolicyRegistry(address registry) external onlyRole(GOV) {
        policyRegistry = IInstitutionalPolicyRegistry(registry);
        emit PolicyRegistrySet(registry);
    }

    /// @notice Assign policy id for a module. Set to zero bytes32 to disable module-level policy checks.
    function setModulePolicy(bytes32 moduleId, bytes32 policyId) external onlyRole(GOV) {
        _requireModuleRegistered(moduleId);
        modulePolicyId[moduleId] = policyId;
        emit ModulePolicySet(moduleId, policyId);
    }

    /// @notice Allow or disallow a module runtime code hash for a module type.
    function setModuleCodeHashAllowed(bytes32 moduleType, bytes32 codeHash, bool allowed) external onlyRole(GOV) {
        if (moduleType == bytes32(0) || codeHash == bytes32(0)) revert Errors.InvalidAmount();
        moduleCodeHashAllowed[moduleType][codeHash] = allowed;
        emit ModuleCodeHashAllowedSet(moduleType, codeHash, allowed);
    }

    /// @notice Enable code-hash allowlist enforcement (one-way latch).
    /// @dev Enforcement starts DISABLED at deployment. Once enabled via governance (GOV + timelock),
    ///      it cannot be disabled. Modules registered before enforcement is enabled
    ///      continue to work — the hash check runs at call-time, not at registration.
    function enableCodeHashEnforcement() external onlyRole(GOV) {
        if (enforceModuleCodeHashAllowlist) revert CodeHashEnforcementAlreadyEnabled();
        enforceModuleCodeHashAllowlist = true;
        emit ModuleCodeHashAllowlistEnforcementSet(true);
    }

    function setDefaultModule(bytes32 moduleId) external onlyRole(GOV) {
        _requireModuleRegistered(moduleId);
        defaultModuleId = moduleId;
        emit DefaultModuleSet(moduleId);
    }

    function pauseModule(bytes32 moduleId) external onlyRole(GUARDIAN) {
        ModuleInfo storage m = _requireModuleRegistered(moduleId);
        m.paused = true;
        emit ModulePausedSet(moduleId, true);
    }

    function unpauseModule(bytes32 moduleId) external onlyRole(GOV) {
        ModuleInfo storage m = _requireModuleRegistered(moduleId);
        m.paused = false;
        emit ModulePausedSet(moduleId, false);
    }

    function setFeeController(address fc) external onlyRole(GOV) {
        if (fc == address(0)) revert Errors.ZeroAddress();
        feeController = FeeController(fc);
        emit FeeControllerSet(fc);
    }

    /// @notice Set or clear the referral short-code resolver.
    /// @dev Zero address disables code resolution. Non-zero must implement
    ///      `resolveReferralCode(bytes32)`. Interface validation is performed
    ///      via a try-catch call to ensure the contract implements the required
    ///      function, rather than checking against a specific interface ID.
    function setReferralCodeRegistry(address registry) external onlyRole(GOV) {
        if (registry != address(0)) {
            if (registry.code.length == 0) revert ReferralCodeRegistryNotContract(registry);
            try IReferralCodeRegistry(registry).resolveReferralCode(bytes32(0)) returns (address) {} catch {
                revert ReferralCodeRegistryInvalid(registry);
            }
        }
        referralCodeRegistry = IReferralCodeRegistry(registry);
        emit ReferralCodeRegistrySet(registry);
    }

    /// @notice Update the per-report sanity bound on beacon-balance gains.
    /// @param bps New maximum gain in basis points (10000 = 100%).
    ///         Hard ceiling at 1000 (10%) to prevent runaway inflation.
    ///         Values above 1000 revert regardless of GOV.
    function setMaxDeltaBps(uint256 bps) external onlyRole(GOV) {
        if (bps > 1000) revert Errors.InvalidAmount();
        maxDeltaBps = bps;
        emit MaxDeltaBpsSet(bps);
    }

    /// @notice Set a global cap on totalPooledEther. 0 = unlimited.
    /// @param cap New maximum total pooled ETH in wei.
    function setMaxTotalPooledEther(uint256 cap) external onlyRole(GOV) {
        maxTotalPooledEther = cap;
        emit MaxTotalPooledEtherSet(cap);
    }

    // ── GUARDIAN: pause hub ──────────────────────────────────────────────────

    function pause(uint16 fnId) external onlyRole(GUARDIAN) {
        _pause(fnId);
    }

    function unpause(uint16 fnId) external onlyRole(GOV) {
        _unpause(fnId);
    }

    /// @notice Emergency: pause submit AND every registered module flag.
    /// @dev Iterates a caller-supplied list; we don't store enumerable list to keep storage lean.
    function emergencyPauseAll(bytes32[] calldata moduleIds) external onlyRole(GUARDIAN) {
        _pause(PAUSE_SUBMIT);
        for (uint256 i; i < moduleIds.length; ++i) {
            ModuleInfo storage m = _modules[moduleIds[i]];
            if (m.addr != address(0)) {
                m.paused = true;
                emit ModulePausedSet(moduleIds[i], true);
            }
        }
    }

    // ── Views ────────────────────────────────────────────────────────────────

    /// @inheritdoc IStakingRouter
    function modules(
        bytes32 moduleId
    ) external view override returns (address addr, bytes32 moduleType, uint256 mintCapEth, bool active, bool paused) {
        ModuleInfo storage m = _modules[moduleId];
        return (m.addr, m.moduleType, m.mintCapEth, m.active, m.paused);
    }

    /// @notice ETH attributable to the system, summed across an explicit list of modules.
    ///         Off-chain observers compute this by enumerating ModuleRegistered events.
    function totalEthOf(bytes32[] calldata ids) external view returns (uint256 sum) {
        for (uint256 i; i < ids.length; ++i) {
            address a = _modules[ids[i]].addr;
            if (a != address(0)) sum += IStakingModule(a).totalEth();
        }
    }
}
