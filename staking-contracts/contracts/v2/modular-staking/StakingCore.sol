// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {StToken} from "./StToken.sol";
import {FeeController} from "./FeeController.sol";
import {ShareMath} from "./ShareMath.sol";
import {IReferralRegistry} from "./interfaces/IReferralRegistry.sol";
import {IReferralCodeRegistry} from "./interfaces/IReferralCodeRegistry.sol";
import {GranularPause} from "../lib/GranularPause.sol";
import {Errors} from "../lib/Errors.sol";

/// @title IDebtPool - Interface for DebtPool contract
interface IDebtPool {
    function receiveStETHAndUnwrap(uint256 _amount) external;
}

/// @title IWithdrawalQueue - Interface for WithdrawalQueueV2
interface IWithdrawalQueue {
    function lockedEther() external view returns (uint256);
    function totalUnclaimedEther() external view returns (uint256);
}

/// @title StakingCore - SharedStake V2 ETH staking vault
/// @notice Entry point for ETH deposits. Issues stToken shares to depositors.
///         Oracle (ORACLE role) reports beacon chain balance changes, triggering reward rebases.
///         Fee shares are minted to protocol recipients on each reward report.
///
/// @dev StakingCore and StakingRouter are mutually exclusive on the same StToken.
///      Only one should hold MINTER and ORACLE roles at a time. StakingRouter is the
///      preferred V2 deployment path. StakingCore is retained for standalone deployments
///      (no module routing needed).
///
/// Role model (principle of least privilege):
///   GOV          — governance (timelock/multisig): set fee controller, add/remove roles, unpause
///   ORACLE       — trusted report submitter (OracleAdapter contract)
///   GUARDIAN     — emergency pause (can act fast, no timelock needed)
///   NODE_OPERATOR— moves buffered ETH into beacon baseline via notifyBeaconDeposit
contract StakingCore is AccessControl, ReentrancyGuard, GranularPause {
    using ShareMath for *;

    // ── Roles ─────────────────────────────────────────────────────────────────
    bytes32 public constant GOV = keccak256("GOV");
    bytes32 public constant ORACLE = keccak256("ORACLE");
    bytes32 public constant GUARDIAN = keccak256("GUARDIAN");
    bytes32 public constant NODE_OPERATOR = keccak256("NODE_OPERATOR");

    // ── Pause IDs ─────────────────────────────────────────────────────────────
    uint16 public constant PAUSE_SUBMIT = 0;

    // ── Immutables ────────────────────────────────────────────────────────────
    StToken public immutable ST_TOKEN;

    // ── State ─────────────────────────────────────────────────────────────────
    FeeController public feeController;
    IReferralCodeRegistry public referralCodeRegistry;
    address public withdrawalQueue; // WithdrawalQueueV2 address (zero if none)
    bool public routerMode; // If true, StakingCore is disabled (StakingRouter active)

    uint256 private _bufferedEther; // ETH held in this contract (pending validator assignment)
    uint256 private _beaconBalance; // last reported sum of all validator balances
    uint256 private _beaconValidators; // last reported validator count

    // ── Events ────────────────────────────────────────────────────────────────
    event Submitted(address indexed sender, uint256 ethAmount, address referral, uint256 sharesAmount);
    event SubmittedWithAttribution(
        address indexed sender,
        address indexed referral,
        bytes32 indexed sourceId,
        uint256 ethAmount,
        uint256 sharesAmount
    );
    event BeaconReported(uint256 beaconValidators, uint256 beaconBalance, uint256 totalPooledEther);
    event FeeSharesMinted(
        address indexed treasury,
        uint256 treasuryShares,
        address indexed operator,
        uint256 operatorShares
    );
    event FeeRoutingTelemetry(
        uint256 rewardsAmount,
        uint256 totalFeeAmount,
        address indexed treasury,
        uint256 treasuryAmount,
        uint256 treasuryShares,
        address indexed operator,
        uint256 operatorAmount,
        uint256 operatorShares
    );
    event FeeControllerSet(address indexed feeController);
    event FeeDistributionFailed(uint256 rewards);
    event ReferralCodeRegistrySet(address indexed registry);
    event WithdrawalQueueSet(address indexed queue);
    event RouterModeEnabled(address indexed gov);
    event BufferedEtherUpdated(uint256 bufferedEther);
    event BeaconDepositNotified(uint256 amount, uint256 bufferedEther, uint256 beaconBalance);

    // ── Errors ────────────────────────────────────────────────────────────────
    error BeaconBalanceSanityFailed(uint256 reported, uint256 expected);
    error BeaconBaselineNotInitialized(uint256 reportedBalance);
    error BeaconDepositExceedsBuffered(uint256 amount, uint256 bufferedEther);
    error InvalidBeaconReportTuple(uint256 beaconValidators, uint256 beaconBalance);
    error ReferralCodeRegistryNotContract(address registry);
    error ReferralCodeRegistryInvalid(address registry);
    error RouterModeDisabled();
    error RouterModeAlreadyEnabled();
    error QueueExceedsPooledEther(uint256 reserved, uint256 postTotalPooled);

    constructor(address stToken, address gov) {
        if (stToken == address(0) || gov == address(0)) revert Errors.ZeroAddress();
        ST_TOKEN = StToken(stToken);
        _grantRole(DEFAULT_ADMIN_ROLE, gov);
        _grantRole(GOV, gov);
        _grantRole(GUARDIAN, gov);
        _grantRole(NODE_OPERATOR, gov);
    }

    // ── Deposit ───────────────────────────────────────────────────────────────

    /// @notice Deposit ETH and receive stToken shares.
    /// @param referral Optional referral address for front-end attribution.
    /// @return sharesAmount Shares minted to msg.sender.
    function submit(
        address referral
    ) external payable nonReentrant whenNotPaused(PAUSE_SUBMIT) returns (uint256 sharesAmount) {
        if (routerMode) revert RouterModeDisabled();
        if (msg.value == 0) revert Errors.InvalidAmount();
        sharesAmount = _submit(msg.sender, msg.value, referral);
    }

    /// @notice Deposit ETH and receive stToken shares with source attribution metadata.
    /// @param referral Optional referral address for front-end attribution.
    /// @param sourceId Optional source identifier for indexer and analytics attribution.
    /// @return sharesAmount Shares minted to msg.sender.
    function submitWithAttribution(
        address referral,
        bytes32 sourceId
    ) external payable nonReentrant whenNotPaused(PAUSE_SUBMIT) returns (uint256 sharesAmount) {
        if (routerMode) revert RouterModeDisabled();
        if (msg.value == 0) revert Errors.InvalidAmount();
        sharesAmount = _submit(msg.sender, msg.value, referral);
        emit SubmittedWithAttribution(msg.sender, referral, sourceId, msg.value, sharesAmount);
    }

    /// @notice Deposit ETH and resolve referral from a short-code hash.
    /// @dev Falls back to no referral when the resolver is unset or code is missing.
    function submitWithReferralCode(
        bytes32 referralCode
    ) external payable nonReentrant whenNotPaused(PAUSE_SUBMIT) returns (uint256 sharesAmount) {
        if (routerMode) revert RouterModeDisabled();
        if (msg.value == 0) revert Errors.InvalidAmount();
        address referral = _resolveReferralCode(referralCode);
        sharesAmount = _submit(msg.sender, msg.value, referral);
    }

    /// @notice Deposit ETH with source attribution and referral short-code hash.
    /// @dev Falls back to no referral when the resolver is unset or code is missing.
    function submitWithCodeAttribution(
        bytes32 referralCode,
        bytes32 sourceId
    ) external payable nonReentrant whenNotPaused(PAUSE_SUBMIT) returns (uint256 sharesAmount) {
        if (routerMode) revert RouterModeDisabled();
        if (msg.value == 0) revert Errors.InvalidAmount();
        address referral = _resolveReferralCode(referralCode);
        sharesAmount = _submit(msg.sender, msg.value, referral);
        emit SubmittedWithAttribution(msg.sender, referral, sourceId, msg.value, sharesAmount);
    }

    /// @notice Fallback: plain ETH transfer treated as a deposit with no referral.
    receive() external payable nonReentrant whenNotPaused(PAUSE_SUBMIT) {
        if (routerMode) revert RouterModeDisabled();
        if (msg.value == 0) revert Errors.InvalidAmount();
        _submit(msg.sender, msg.value, address(0));
    }

    function _submit(address sender, uint256 amount, address referral) internal returns (uint256 sharesAmount) {
        uint256 currentPooled = ST_TOKEN.totalPooledEther();
        uint256 currentShares = ST_TOKEN.getTotalShares();

        sharesAmount = ShareMath.getSharesByPooledEth(amount, currentShares, currentPooled);

        _bufferedEther += amount;
        // Pool grows by deposit amount before shares are issued (conservative: no dilution).
        ST_TOKEN.setTotalPooledEther(currentPooled + amount);
        ST_TOKEN.mintShares(sender, sharesAmount);
        _recordReferral(sender, referral, amount, sharesAmount);

        emit Submitted(sender, amount, referral, sharesAmount);
        emit BufferedEtherUpdated(_bufferedEther);
    }

    // ── Oracle reporting ──────────────────────────────────────────────────────

    /// @notice Called by OracleAdapter when a new beacon chain report is accepted.
    ///         Updates totalPooledEther and distributes fee shares on positive rewards.
    /// @param newBeaconValidators Number of validators being reported.
    /// @param newBeaconBalance    Sum of all validator balances (in wei).
    // solhint-disable-next-line code-complexity
    function reportBeacon(
        uint256 newBeaconValidators,
        uint256 newBeaconBalance
    ) external nonReentrant onlyRole(ORACLE) {
        if (routerMode) revert RouterModeDisabled();
        if (newBeaconValidators == 0 && newBeaconBalance != 0) {
            revert InvalidBeaconReportTuple(newBeaconValidators, newBeaconBalance);
        }

        // Reject (0,0) reports unless this is the deliberate initialization report
        // (before any validators have been added). After the first non-zero report,
        // a (0,0) report would collapse totalPooledEther to bufferedEther only.
        if (newBeaconValidators == 0 && newBeaconBalance == 0 && _beaconBalance > 0) {
            revert Errors.InvalidAmount();
        }

        // Sanity: beacon balance cannot be more than 1.5× the maximum honest value.
        if (newBeaconValidators > 0) {
            uint256 maxPlausible = (newBeaconValidators * 32 ether * 3) / 2;
            if (newBeaconBalance > maxPlausible) {
                revert BeaconBalanceSanityFailed(newBeaconBalance, maxPlausible);
            }
        }

        // Prevent principal from being counted as rewards on the first positive
        // report. NODE_OPERATOR must move buffered ETH into beacon baseline first.
        if (_beaconBalance == 0 && newBeaconBalance > 0) {
            revert BeaconBaselineNotInitialized(newBeaconBalance);
        }

        uint256 preTotalPooled = ST_TOKEN.totalPooledEther();

        _beaconValidators = newBeaconValidators;
        _beaconBalance = newBeaconBalance;

        uint256 postTotalPooled = _bufferedEther + newBeaconBalance;
        uint256 reserved = _queueReservedEther();
        // Ensure we don't underflow if queue has more locked than pooled.
        // reserved == postTotalPooled is the legitimate wind-down state (all ETH in queue).
        // reserved > postTotalPooled can occur after a major validator slash. Hard-reverting
        // here would permanently freeze oracle reporting. Instead, cap postTotalPooled at
        // reserved so oracle reports proceed — no positive delta (rewards) are distributed
        // until the beacon balance recovers. The exchange rate may drop (loss socialised),
        // but the protocol does not freeze.
        if (reserved > postTotalPooled) {
            postTotalPooled = reserved;
        }
        postTotalPooled -= reserved; // reaches 0 cleanly during wind-down or slash recovery
        ST_TOKEN.setTotalPooledEther(postTotalPooled);

        // Distribute fee shares when there are positive rewards.
        if (postTotalPooled > preTotalPooled && address(feeController) != address(0)) {
            uint256 rewards = postTotalPooled - preTotalPooled;
            _distributeFees(rewards, postTotalPooled);
        }

        emit BeaconReported(newBeaconValidators, newBeaconBalance, postTotalPooled);
    }

    /// @notice Moves ETH accounting from buffered to beacon-side baseline.
    /// @dev Called by NODE_OPERATOR when validator deposits are broadcast.
    ///      Keeps total pooled ETH unchanged while initializing or growing the
    ///      beacon baseline used by oracle delta reports.
    function notifyBeaconDeposit(uint256 amount) external onlyRole(NODE_OPERATOR) {
        if (routerMode) revert RouterModeDisabled();
        if (amount == 0) revert Errors.InvalidAmount();
        uint256 buffered = _bufferedEther;
        if (amount > buffered) revert BeaconDepositExceedsBuffered(amount, buffered);

        _bufferedEther = buffered - amount;
        _beaconBalance += amount;

        emit BeaconDepositNotified(amount, _bufferedEther, _beaconBalance);
        emit BufferedEtherUpdated(_bufferedEther);
    }

    function _queueReservedEther() private view returns (uint256) {
        if (withdrawalQueue == address(0)) return 0;
        return IWithdrawalQueue(withdrawalQueue).totalUnclaimedEther();
    }

    function _computeFeeShares(
        uint256 treasuryAmount,
        uint256 operatorAmount,
        uint256 referralAmount,
        uint256 debtPoolAmount,
        uint256 newTotalShares,
        uint256 newTotalPooled
    ) private pure returns (uint256, uint256, uint256, uint256) {
        uint256 totalFeeAmount = treasuryAmount + operatorAmount + referralAmount + debtPoolAmount;
        if (totalFeeAmount == 0 || newTotalShares == 0 || totalFeeAmount >= newTotalPooled) {
            return (0, 0, 0, 0);
        }

        uint256 totalFeeShares = (totalFeeAmount * newTotalShares) / (newTotalPooled - totalFeeAmount);
        uint256 treasuryShares = (totalFeeShares * treasuryAmount) / totalFeeAmount;
        uint256 operatorShares = (totalFeeShares * operatorAmount) / totalFeeAmount;
        uint256 referralShares = (totalFeeShares * referralAmount) / totalFeeAmount;
        uint256 debtPoolShares = (totalFeeShares * debtPoolAmount) / totalFeeAmount;

        uint256 allocated = treasuryShares + operatorShares + referralShares + debtPoolShares;
        uint256 remainder = totalFeeShares - allocated;
        if (remainder != 0) {
            if (treasuryAmount != 0) {
                treasuryShares += remainder;
            } else if (operatorAmount != 0) {
                operatorShares += remainder;
            } else if (referralAmount != 0) {
                referralShares += remainder;
            } else {
                debtPoolShares += remainder;
            }
        }
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

    function _distributeFees(uint256 rewards, uint256 newTotalPooled) internal {
        // Wrap FeeController calls in try/catch: a buggy or governance-upgraded FeeController
        // must not be able to DoS oracle updates by reverting here (H1 fix).
        address treasury;
        address operator;
        address referralRegistry;
        address debtPool;
        try feeController.getFeeConfig() returns (
            uint16,
            uint16,
            uint16,
            uint16,
            address _treasury,
            address _operator,
            address _referralRegistry,
            address _debtPool
        ) {
            treasury = _treasury;
            operator = _operator;
            referralRegistry = _referralRegistry;
            debtPool = _debtPool;
        } catch {
            emit FeeDistributionFailed(rewards);
            return;
        }

        uint256 treasuryAmount;
        uint256 operatorAmount;
        uint256 debtPoolAmount;
        uint256 referralAmount;
        try feeController.computeFees(rewards) returns (
            uint256 _treasuryAmount,
            uint256 _operatorAmount,
            uint256 _debtPoolAmount,
            uint256 _referralAmount
        ) {
            treasuryAmount = _treasuryAmount;
            operatorAmount = _operatorAmount;
            debtPoolAmount = _debtPoolAmount;
            referralAmount = _referralAmount;
        } catch {
            emit FeeDistributionFailed(rewards);
            return;
        }
        if (referralRegistry == address(0)) {
            referralAmount = 0;
        }
        if (debtPool == address(0)) {
            debtPoolAmount = 0;
        }
        if (treasuryAmount == 0 && operatorAmount == 0 && referralAmount == 0 && debtPoolAmount == 0) return;

        uint256 totalFee = treasuryAmount + operatorAmount + referralAmount + debtPoolAmount;
        uint256 newTotalShares = ST_TOKEN.getTotalShares();

        // Mint fee shares at the post-rebase exchange rate so fee recipients are
        // compensated exactly for their portion of the rewards.
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

        // Keep reward reporting live even before any referee exists.
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
            rewards,
            totalFee,
            treasury,
            treasuryAmount,
            treasuryShares,
            operator,
            operatorAmount,
            operatorShares
        );
    }

    function _recordReferral(address sender, address referral, uint256 amount, uint256 sharesAmount) internal {
        if (referral == address(0) || address(feeController) == address(0)) return;
        (, , , , , , address referralRegistry, ) = feeController.getFeeConfig();
        if (referralRegistry == address(0)) return;
        IReferralRegistry(referralRegistry).recordDeposit(referral, sender, amount, sharesAmount);
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

    // ── Admin ─────────────────────────────────────────────────────────────────

    function setFeeController(address fc) external onlyRole(GOV) {
        if (fc == address(0)) revert Errors.ZeroAddress();
        feeController = FeeController(fc);
        emit FeeControllerSet(fc);
    }

    /// @notice Set or clear the referral short-code resolver.
    /// @dev Zero address disables code resolution. Non-zero must implement
    ///      `resolveReferralCode(bytes32)`.
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

    /// @notice Set the withdrawal queue address.
    /// @dev When set, reportBeacon subtracts totalUnclaimedEther from totalPooledEther.
    ///      Zero address disables queue awareness (for standalone deployments).
    function setWithdrawalQueue(address queue) external onlyRole(GOV) {
        if (queue != address(0)) {
            if (queue.code.length == 0) revert Errors.NotAContract();
            // Verify it implements IWithdrawalQueue by calling totalUnclaimedEther().
            try IWithdrawalQueue(queue).totalUnclaimedEther() returns (uint256) {
                // interface validated
            } catch {
                revert Errors.InvalidAddress();
            }
        }
        withdrawalQueue = queue;
        emit WithdrawalQueueSet(queue);
    }

    /// @notice Enable router mode (one-way latch).
    /// @dev When enabled, StakingCore operations are disabled (StakingRouter is active).
    ///      This enforces mutual exclusivity between StakingCore and StakingRouter.
    ///      Once enabled, routerMode cannot be disabled.
    /// @param router The StakingRouter address that must hold MINTER role on ST_TOKEN
    function enableRouterMode(address router) external onlyRole(GOV) {
        if (routerMode) revert RouterModeAlreadyEnabled();
        if (router == address(0) || router.code.length == 0) revert Errors.NotAContract();
        // Verify router holds MINTER on ST_TOKEN (proves it is a real StakingRouter)
        bytes32 MINTER = ST_TOKEN.MINTER();
        if (!ST_TOKEN.hasRole(MINTER, router)) revert Errors.Unauthorized();
        routerMode = true;
        emit RouterModeEnabled(router);
    }

    function pause(uint16 fnId) external onlyRole(GUARDIAN) {
        _pause(fnId);
    }

    function unpause(uint16 fnId) external onlyRole(GOV) {
        _unpause(fnId);
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    /// @notice Returns net total pooled ETH (withdrawal queue deducted). Matches stToken exchange rate.
    /// @dev Use this for price calculations. For gross balance (before queue deduction), use
    ///      bufferedEther() + beaconBalance().
    function totalPooledEther() external view returns (uint256) {
        return ST_TOKEN.totalPooledEther();
    }

    function bufferedEther() external view returns (uint256) {
        return _bufferedEther;
    }

    function beaconBalance() external view returns (uint256) {
        return _beaconBalance;
    }

    function beaconValidators() external view returns (uint256) {
        return _beaconValidators;
    }
}
