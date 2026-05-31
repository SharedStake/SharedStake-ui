// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Errors} from "../lib/Errors.sol";

interface IShareTransferToken {
    function transferShares(address to, uint256 sharesAmount) external returns (uint256 tokensAmount);
}

/// @title ReferralRegistry — on-chain referral attribution for SharedStake V2
/// @notice Tracks referrer → referee relationships and accrued referral fees.
///         Uses a MasterChef-style reward-per-share model for gas-efficient
///         fee distribution across all referrers.
///
///         Integration:
///           - StakingRouter calls `recordDeposit(referee, referrer, ethAmount, shares)`
///             on every deposit that includes a referral address.
///           - StakingRouter mints fee shares to this contract and calls
///             `depositReferralFeeShares(shares)`.
///           - Referrers claim accrued fee shares proportional to their referred volume.
///
///         Anti-gaming:
///           - Self-referral is blocked (referee == referrer).
///           - Referrer must have referred at least `minReferralStake` total ETH
///             before they can claim fees.
///           - GOV can adjust fee rate and minimums.
///
/// Roles:
///   GOV        — set fee params, recover stranded tokens
///   FEE_CTRL   — deposit fee revenue (StakingRouter via FeeController role)
///   ROUTER     — record deposits (StakingRouter)
contract ReferralRegistry is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── Roles ─────────────────────────────────────────────────────────────────
    bytes32 public constant GOV = keccak256("GOV");
    bytes32 public constant FEE_CTRL = keccak256("FEE_CTRL");
    bytes32 public constant ROUTER = keccak256("ROUTER");

    // ── State ───────────────────────────────────────────────────────────────────
    struct ReferralRecord {
        uint256 totalReferredEth;      // cumulative ETH deposited by referee
        uint256 totalReferredShares;   // cumulative shares minted to referee
        uint256 firstReferralTime;     // timestamp of first referral
    }

    struct ReferrerStats {
        uint256 totalReferredEth;      // cumulative across all referees
        uint256 totalReferredShares;   // cumulative across all referees
        uint256 refereeCount;          // number of unique referees
        int256 rewardDebt;             // MasterChef-style reward debt
    }

    /// @notice referralFeeBps: percentage of protocol fees directed to referrals
    ///         e.g., 1000 = 10% of protocol fees go to referral pool.
    uint256 public referralFeeBps = 1000; // 10% default
    uint256 public constant MAX_REFERRAL_FEE_BPS = 3000; // 30% cap
    uint256 public minReferralStake = 1 ether; // must have referred ≥1 ETH to claim

    /// @notice MasterChef-style accrual: accumulated fee shares per unit of referred ETH.
    uint256 public accRewardPerEth;
    uint256 public constant ACC_PRECISION = 1e18;
    uint256 public totalReferredEth; // cumulative ETH referred across ALL referrers

    mapping(address => mapping(address => ReferralRecord)) public records; // referrer => referee => record
    mapping(address => ReferrerStats) public stats;
    mapping(address => bool) public hasReferred; // referee => true (legacy mirror of `referrerOf`)
    mapping(address => address) public referrerOf; // referee => canonical referrer (first referrer wins)

    address public feeToken; // token used for fee payouts (address(0) = stToken shares)

    // ── Events ────────────────────────────────────────────────────────────────
    event DepositRecorded(address indexed referrer, address indexed referee, uint256 ethAmount, uint256 shares);
    event FeeSharesDeposited(address indexed sender, uint256 shares);
    event FeesClaimed(address indexed referrer, uint256 shares);
    event ReferralFeeBpsSet(uint256 oldBps, uint256 newBps);
    event MinReferralStakeSet(uint256 oldMin, uint256 newMin);

    // ── Errors ────────────────────────────────────────────────────────────────
    error SelfReferral();
    error ZeroAmount();
    error MinStakeNotMet(uint256 required, uint256 actual);
    error NoFeesToClaim();
    error FeeTooHigh();
    error NoReferees();

    constructor(address _gov, address _feeToken) {
        if (_gov == address(0)) revert Errors.ZeroAddress();
        if (_feeToken == address(0)) revert Errors.ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, _gov);
        _grantRole(GOV, _gov);
        feeToken = _feeToken;
    }

    // ── Core: deposit recording (ROUTER only) ───────────────────────────────

    /// @notice Called by StakingRouter on each deposit with a referral address.
    ///         Records the referrer → referee relationship and referred amounts.
    function recordDeposit(
        address referrer,
        address referee,
        uint256 ethAmount,
        uint256 shares
    ) external onlyRole(ROUTER) {
        if (referrer == address(0)) return; // no-op for missing referral
        if (referrer == referee) revert SelfReferral();
        if (ethAmount == 0 || shares == 0) revert ZeroAmount();

        // First referrer wins; subsequent deposits for the same referee continue
        // accruing to that canonical referrer.
        address canonicalReferrer = referrerOf[referee];
        bool isNewReferee = canonicalReferrer == address(0);
        if (isNewReferee) {
            canonicalReferrer = referrer;
            referrerOf[referee] = referrer;
            hasReferred[referee] = true;
        } else if (canonicalReferrer != referrer) {
            // Ignore attempts to override attribution.
            return;
        }

        ReferralRecord storage rec = records[canonicalReferrer][referee];
        rec.totalReferredEth += ethAmount;
        rec.totalReferredShares += shares;
        if (rec.firstReferralTime == 0) {
            rec.firstReferralTime = block.timestamp;
        }

        ReferrerStats storage s = stats[canonicalReferrer];
        // Update reward debt before changing totalReferredEth
        s.rewardDebt += int256((ethAmount * accRewardPerEth) / ACC_PRECISION);
        s.totalReferredEth += ethAmount;
        s.totalReferredShares += shares;
        if (isNewReferee) {
            s.refereeCount += 1;
        }

        totalReferredEth += ethAmount;

        emit DepositRecorded(canonicalReferrer, referee, ethAmount, shares);
    }

    // ── Core: fee deposit (FEE_CTRL only) ─────────────────────────────────────

    /// @notice Called by StakingRouter when fee shares are minted to this contract.
    ///         Distributes new shares proportionally across all referrers via
    ///         the accRewardPerEth accumulator.
    function depositReferralFeeShares(uint256 shares) external onlyRole(FEE_CTRL) {
        if (shares == 0) revert ZeroAmount();
        if (totalReferredEth == 0) revert NoReferees();

        accRewardPerEth += (shares * ACC_PRECISION) / totalReferredEth;
        emit FeeSharesDeposited(msg.sender, shares);
    }

    // ── Core: fee claiming ────────────────────────────────────────────────────

    /// @notice Referrer claims their accrued fee shares.
    function claimFees() external nonReentrant {
        ReferrerStats storage s = stats[msg.sender];
        uint256 referredEth = s.totalReferredEth;
        if (referredEth == 0) revert NoFeesToClaim();
        if (referredEth < minReferralStake) {
            revert MinStakeNotMet(minReferralStake, referredEth);
        }

        uint256 pending = _pendingReward(msg.sender);
        if (pending == 0) revert NoFeesToClaim();

        s.rewardDebt = int256((referredEth * accRewardPerEth) / ACC_PRECISION);

        // Transfer fee shares to referrer using share-native transfer semantics.
        IShareTransferToken(feeToken).transferShares(msg.sender, pending);

        emit FeesClaimed(msg.sender, pending);
    }

    // ── Admin (GOV only) ────────────────────────────────────────────────────────

    function setReferralFeeBps(uint256 _bps) external onlyRole(GOV) {
        if (_bps > MAX_REFERRAL_FEE_BPS) revert FeeTooHigh();
        uint256 old = referralFeeBps;
        referralFeeBps = _bps;
        emit ReferralFeeBpsSet(old, _bps);
    }

    function setMinReferralStake(uint256 _min) external onlyRole(GOV) {
        uint256 old = minReferralStake;
        minReferralStake = _min;
        emit MinReferralStakeSet(old, _min);
    }

    function setFeeToken(address _token) external onlyRole(GOV) {
        feeToken = _token;
    }

    /// @notice Recover accidentally sent ERC20 tokens (not feeToken).
    function recoverToken(address token, address to, uint256 amount) external onlyRole(GOV) {
        if (token == feeToken) revert Errors.InvalidAmount();
        IERC20(token).safeTransfer(to, amount);
    }

    /// @notice Recover accidentally sent ETH.
    function recoverEth(address to, uint256 amount) external onlyRole(GOV) {
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "ETH transfer failed");
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    function getReferrerStats(address referrer)
        external
        view
        returns (ReferrerStats memory)
    {
        return stats[referrer];
    }

    function getRecord(address referrer, address referee)
        external
        view
        returns (ReferralRecord memory)
    {
        return records[referrer][referee];
    }

    function pendingReward(address referrer) external view returns (uint256) {
        return _pendingReward(referrer);
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    function _pendingReward(address referrer) internal view returns (uint256) {
        ReferrerStats storage s = stats[referrer];
        uint256 referredEth = s.totalReferredEth;
        if (referredEth == 0) return 0;
        int256 accumulated = int256((referredEth * accRewardPerEth) / ACC_PRECISION);
        return uint256(accumulated - s.rewardDebt);
    }

    receive() external payable {}
}
