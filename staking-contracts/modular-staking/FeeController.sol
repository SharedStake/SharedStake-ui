// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Errors} from "../lib/Errors.sol";

/// @title FeeController - protocol fee configuration and accounting
/// @notice Stores fee rate and recipients; called by StakingCore when beacon rewards are reported.
///         Fees are distributed as minted shares (not ETH), so recipients earn from the reward pool
///         without requiring an ETH transfer on every oracle report.
///
///         Fee split model (all in basis points, sum <= 10000):
///           totalFee      = rewards * feeBps / 10000
///           treasury      = totalFee * treasurySplitBps / 10000
///           operator      = totalFee * operatorSplitBps / 10000
///           debtPool      = totalFee * debtPoolSplitBps / 10000
///           referralPool  = totalFee - treasury - operator - debtPool (remainder)
/// @dev Fee is expressed in basis points (1 bp = 0.01%). Max 2000 bp (20%).
///      Debt pool is optional; set debtPool address to address(0) to disable.
contract FeeController is AccessControl {
    bytes32 public constant GOV = keccak256("GOV");

    uint16 public constant MAX_FEE_BPS = 2000; // 20% ceiling

    uint16 public feeBps;           // total protocol fee in basis points
    uint16 public treasurySplitBps; // fraction of feeBps going to treasury
    uint16 public operatorSplitBps; // fraction of feeBps going to operator
    uint16 public debtPoolSplitBps;  // fraction of feeBps going to debt pool
    address public treasury;
    address public operator;
    address public referralRegistry; // ReferralRegistry contract for fee sharing
    address public debtPool;         // DebtPool contract for debt repayment

    event FeeSet(uint16 feeBps, uint16 treasurySplitBps, uint16 operatorSplitBps, uint16 debtPoolSplitBps);
    event RecipientsSet(address treasury, address operator, address referralRegistry, address debtPool);
    event FeesDistributed(address indexed treasury, uint256 treasuryAmount, address indexed operator, uint256 operatorAmount, uint256 debtPoolAmount, uint256 referralAmount);

    error FeeTooHigh();
    error SplitTooHigh();
    error NotAContract();
    error DebtPoolSplitWithoutAddress();

    constructor(
        address gov,
        address _treasury,
        address _operator,
        address _referralRegistry,
        address _debtPool,
        uint16 _feeBps,
        uint16 _treasurySplitBps,
        uint16 _operatorSplitBps,
        uint16 _debtPoolSplitBps
    ) {
        if (gov == address(0) || _treasury == address(0) || _operator == address(0)) revert Errors.ZeroAddress();
        if (_feeBps > MAX_FEE_BPS) revert FeeTooHigh();
        if (_treasurySplitBps + _operatorSplitBps + _debtPoolSplitBps > 10000) revert SplitTooHigh();
        
        // Validate debt pool is a contract if address is set
        if (_debtPool != address(0) && _debtPool.code.length == 0) revert NotAContract();

        _grantRole(DEFAULT_ADMIN_ROLE, gov);
        _grantRole(GOV, gov);

        treasury = _treasury;
        operator = _operator;
        referralRegistry = _referralRegistry;
        debtPool = _debtPool;
        feeBps = _feeBps;
        treasurySplitBps = _treasurySplitBps;
        operatorSplitBps = _operatorSplitBps;
        debtPoolSplitBps = _debtPoolSplitBps;

        emit RecipientsSet(_treasury, _operator, _referralRegistry, _debtPool);
        emit FeeSet(_feeBps, _treasurySplitBps, _operatorSplitBps, _debtPoolSplitBps);
    }

    // ── Config ────────────────────────────────────────────────────────────────

    function setFee(uint16 _feeBps, uint16 _treasurySplitBps, uint16 _operatorSplitBps, uint16 _debtPoolSplitBps) external onlyRole(GOV) {
        if (_feeBps > MAX_FEE_BPS) revert FeeTooHigh();
        if (_treasurySplitBps + _operatorSplitBps + _debtPoolSplitBps > 10000) revert SplitTooHigh();
        if (_debtPoolSplitBps > 0 && debtPool == address(0)) revert DebtPoolSplitWithoutAddress();
        feeBps = _feeBps;
        treasurySplitBps = _treasurySplitBps;
        operatorSplitBps = _operatorSplitBps;
        debtPoolSplitBps = _debtPoolSplitBps;
        emit FeeSet(_feeBps, _treasurySplitBps, _operatorSplitBps, _debtPoolSplitBps);
    }

    function setRecipients(address _treasury, address _operator, address _referralRegistry, address _debtPool) external onlyRole(GOV) {
        // treasury and operator must be set; referralRegistry can be zero (disables referral fee split)
        if (_treasury == address(0) || _operator == address(0)) revert Errors.ZeroAddress();

        // Validate debt pool is a contract if address is set
        if (_debtPool != address(0) && _debtPool.code.length == 0) revert NotAContract();

        // If clearing debtPool address, ensure debtPoolSplitBps is 0
        if (_debtPool == address(0) && debtPoolSplitBps > 0) revert DebtPoolSplitWithoutAddress();

        treasury = _treasury;
        operator = _operator;
        referralRegistry = _referralRegistry;
        debtPool = _debtPool;
        emit RecipientsSet(_treasury, _operator, _referralRegistry, _debtPool);
    }

    /// @notice Set referral registry address, allowing zero to disable referral fee distribution
    /// @dev Zero address means no referral fee distribution (all referral pool goes to treasury)
    function setReferralRegistry(address _referralRegistry) external onlyRole(GOV) {
        referralRegistry = _referralRegistry;
        emit RecipientsSet(treasury, operator, _referralRegistry, debtPool);
    }

    // ── Query ─────────────────────────────────────────────────────────────────

    /// @notice Compute how many ETH-worth of fee shares to mint given `rewards` ETH.
    ///         Returns (treasuryAmount, operatorAmount, debtPoolAmount, referralAmount) in wei.
    ///         Caller (StakingCore) then mints corresponding shares to treasury/operator/debtPool.
    ///         Referral amount is sent to ReferralRegistry as shares.
    ///         If debtPool is address(0), debtPoolAmount will be 0.
    function computeFees(uint256 rewards)
        external
        view
        returns (uint256 treasuryAmount, uint256 operatorAmount, uint256 debtPoolAmount, uint256 referralAmount)
    {
        uint256 totalFee = (rewards * feeBps) / 10000;
        treasuryAmount = (totalFee * treasurySplitBps) / 10000;
        operatorAmount = (totalFee * operatorSplitBps) / 10000;
        
        // Only allocate to debt pool if address is set
        if (debtPool != address(0)) {
            debtPoolAmount = (totalFee * debtPoolSplitBps) / 10000;
        } else {
            debtPoolAmount = 0;
        }
        
        referralAmount = totalFee - treasuryAmount - operatorAmount - debtPoolAmount;
    }

    /// @notice Convenience getter for StakingCore to retrieve config in one call.
    function getFeeConfig()
        external
        view
        returns (uint16 _feeBps, uint16 _treasurySplitBps, uint16 _operatorSplitBps, uint16 _debtPoolSplitBps, address _treasury, address _operator, address _referralRegistry, address _debtPool)
    {
        return (feeBps, treasurySplitBps, operatorSplitBps, debtPoolSplitBps, treasury, operator, referralRegistry, debtPool);
    }

    /// @notice Convenience getter for fee recipients only.
    function getRecipients() external view returns (address _treasury, address _operator, address _debtPool) {
        return (treasury, operator, debtPool);
    }
}
