// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;
// solhint-disable not-rely-on-time, ordering, max-states-count

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

import {Errors} from "../lib/Errors.sol";
import {GranularPause} from "../lib/GranularPause.sol";

/// @title OldVeth2WithdrawalQueue
/// @notice FIFO redemption queue for legacy vEth2 holders exiting to ETH.
/// @dev The queue preserves legacy virtual-price redemption semantics while
///      using the V2 request/finalize/claim lifecycle. Redeemed vEth2 is
///      escrowed here; the contract does not assume it can become the vEth2
///      minter and burn legacy supply. Request ownership is always the
///      caller, and claim/cancel proceeds always return to that owner.
contract OldVeth2WithdrawalQueue is AccessControl, ReentrancyGuard, GranularPause {
    using Address for address payable;
    using SafeERC20 for IERC20;

    // -- Types -----------------------------------------------------------------
    struct WithdrawalRequest {
        address owner;
        uint256 vEth2Amount;
        uint256 ethAmount;
        uint256 requestedAt;
        bool finalized;
        bool claimed;
        bool canceled;
    }

    // -- Roles -----------------------------------------------------------------
    bytes32 public constant GOV = keccak256("GOV");
    bytes32 public constant GUARDIAN = keccak256("GUARDIAN");

    // -- Pause IDs -------------------------------------------------------------
    uint16 public constant PAUSE_REQUESTS = 1;
    uint16 public constant PAUSE_FINALIZE = 2;
    uint16 public constant PAUSE_CANCEL = 3;

    // -- State -----------------------------------------------------------------
    IERC20 public immutable VETH2;

    uint256 public nextRequestId = 1;
    uint256 public lastFinalizedRequestId;
    uint256 public redemptionRate;

    uint256 public minWithdrawal = 0.01 ether;
    uint256 public maxWithdrawal = 1000 ether;
    uint256 public maxRequestsPerFinalize = 128;
    uint256 public minRequestAge;

    mapping(uint256 => WithdrawalRequest) public requests;

    // ETH locked for finalized-but-unclaimed withdrawal requests.
    uint256 public lockedEther;

    // vEth2 still backing unfinalized requests and therefore unavailable for recovery.
    uint256 public pendingVeth2;

    uint256 public totalRequestedVeth2;
    uint256 public totalFinalizedEth;
    uint256 public totalClaimedEth;
    uint256 public totalCanceledVeth2;

    // Tracks number of distinct GUARDIAN role holders; guards against removing the last guardian.
    uint256 public guardianCount;

    // Pull-based refunds for excess ETH sent during finalize.
    mapping(address => uint256) public pendingRefunds;
    uint256 public totalPendingRefunds;

    // -- Events ----------------------------------------------------------------
    event WithdrawalRequested(
        address indexed requester,
        address indexed owner,
        uint256 indexed requestId,
        uint256 vEth2Amount,
        uint256 ethAmount
    );
    event BatchFinalized(uint256 indexed fromRequestId, uint256 indexed toRequestId, uint256 ethProvided);
    event WithdrawalClaimed(
        address indexed owner,
        address indexed recipient,
        uint256 indexed requestId,
        uint256 ethAmount
    );
    event WithdrawalCanceled(
        address indexed owner,
        address indexed recipient,
        uint256 indexed requestId,
        uint256 amount
    );
    event RedemptionRateUpdated(uint256 oldRate, uint256 newRate);
    event RequestLimitsUpdated(uint256 minWithdrawal, uint256 maxWithdrawal);
    event FinalizeLimitsUpdated(uint256 maxRequestsPerFinalize, uint256 minRequestAge);
    event RedeemedVeth2Recovered(address indexed to, uint256 amount);
    event EthRecovered(address indexed to, uint256 amount);

    // -- Errors ----------------------------------------------------------------
    error AmountOutOfBounds(uint256 amount);
    error InvalidRequestRange(uint256 from, uint256 to);
    error InsufficientFinalizeEth(uint256 required, uint256 provided);
    error RequestTooYoung(uint256 requestId, uint256 requestTimestamp, uint256 minFinalizableTimestamp);
    error FinalizeBatchTooLarge(uint256 requested, uint256 maxAllowed);
    error RequestNotFinalized(uint256 requestId);
    error RequestAlreadyFinalized(uint256 requestId);
    error RequestAlreadyClaimed(uint256 requestId);
    error RequestCanceled(uint256 requestId);
    error NotRequestOwner(uint256 requestId, address caller);
    error InvalidRequestLimits(uint256 min, uint256 max);
    error CannotRemoveLastGuardian();

    constructor(address vEth2, uint256 initialRedemptionRate, address gov) {
        if (vEth2 == address(0) || gov == address(0)) revert Errors.ZeroAddress();
        if (initialRedemptionRate == 0) revert Errors.InvalidAmount();

        VETH2 = IERC20(vEth2);
        redemptionRate = initialRedemptionRate;

        _grantRole(DEFAULT_ADMIN_ROLE, gov);
        _grantRole(GOV, gov);
        _grantRole(GUARDIAN, gov);
    }

    // -- Request ---------------------------------------------------------------

    /// @notice Enqueue one legacy vEth2 redemption request.
    /// @param amount Amount of vEth2 transferred from the caller.
    function requestWithdrawal(
        uint256 amount
    ) external nonReentrant whenNotPaused(PAUSE_REQUESTS) returns (uint256 requestId) {
        requestId = _enqueueRequest(amount);
    }

    /// @notice Enqueue multiple legacy vEth2 redemption requests.
    /// @param amounts vEth2 amounts; each amount creates one FIFO request.
    function requestWithdrawals(
        uint256[] calldata amounts
    ) external nonReentrant whenNotPaused(PAUSE_REQUESTS) returns (uint256[] memory requestIds) {
        if (amounts.length == 0) revert Errors.InvalidAmount();

        requestIds = new uint256[](amounts.length);
        for (uint256 i; i < amounts.length; ++i) {
            requestIds[i] = _enqueueRequest(amounts[i]);
        }
    }

    function _enqueueRequest(uint256 amount) internal returns (uint256 requestId) {
        if (amount < minWithdrawal || amount > maxWithdrawal) revert AmountOutOfBounds(amount);

        uint256 ethAmount = quoteEth(amount);
        if (ethAmount == 0) revert Errors.InvalidAmount();

        // slither-disable-start reentrancy-benign
        // slither-disable-start reentrancy-balance
        // Custody precedes request accounting; nonReentrant blocks callback
        // entry, and the balance delta rejects fee-on-transfer tokens.
        uint256 balanceBefore = VETH2.balanceOf(address(this));
        VETH2.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = VETH2.balanceOf(address(this)) - balanceBefore;
        if (received != amount) revert Errors.InvalidAmount();
        // slither-disable-end reentrancy-balance

        requestId = nextRequestId++;
        requests[requestId] = WithdrawalRequest({
            owner: msg.sender,
            vEth2Amount: amount,
            ethAmount: ethAmount,
            requestedAt: block.timestamp,
            finalized: false,
            claimed: false,
            canceled: false
        });

        pendingVeth2 += amount;
        totalRequestedVeth2 += amount;

        emit WithdrawalRequested(msg.sender, msg.sender, requestId, amount, ethAmount);
        // slither-disable-end reentrancy-benign
    }

    // -- Finalize --------------------------------------------------------------

    /// @notice Finalize all non-canceled requests up to and including `lastRequestId`.
    /// @dev Enforces FIFO order by requiring finalization to start at
    ///      `lastFinalizedRequestId + 1`.
    function finalize(
        uint256 lastRequestId
    ) external payable onlyRole(GUARDIAN) nonReentrant whenNotPaused(PAUSE_FINALIZE) {
        uint256 fromId = lastFinalizedRequestId + 1;
        if (lastRequestId < fromId || lastRequestId >= nextRequestId) {
            revert InvalidRequestRange(fromId, lastRequestId);
        }

        uint256 requestsCount = lastRequestId - fromId + 1;
        if (requestsCount > maxRequestsPerFinalize) {
            revert FinalizeBatchTooLarge(requestsCount, maxRequestsPerFinalize);
        }

        uint256 totalEthRequired = 0;
        for (uint256 id = fromId; id <= lastRequestId; ++id) {
            WithdrawalRequest storage req = requests[id];
            if (req.canceled) continue;

            uint256 minFinalizableTimestamp = req.requestedAt + minRequestAge;
            if (block.timestamp < minFinalizableTimestamp) {
                revert RequestTooYoung(id, req.requestedAt, minFinalizableTimestamp);
            }

            req.finalized = true;
            pendingVeth2 -= req.vEth2Amount;
            totalEthRequired += req.ethAmount;
        }

        if (msg.value < totalEthRequired) {
            revert InsufficientFinalizeEth(totalEthRequired, msg.value);
        }

        lockedEther += totalEthRequired;
        totalFinalizedEth += totalEthRequired;
        lastFinalizedRequestId = lastRequestId;

        if (msg.value > totalEthRequired) {
            uint256 refund = msg.value - totalEthRequired;
            pendingRefunds[msg.sender] += refund;
            totalPendingRefunds += refund;
        }

        emit BatchFinalized(fromId, lastRequestId, totalEthRequired);
    }

    /// @notice Withdraw excess ETH sent during finalize().
    function withdrawRefund() external nonReentrant {
        uint256 amount = pendingRefunds[msg.sender];
        if (amount == 0) revert Errors.InvalidAmount();
        pendingRefunds[msg.sender] = 0;
        totalPendingRefunds -= amount;
        payable(msg.sender).sendValue(amount);
    }

    // -- Cancel ----------------------------------------------------------------

    /// @notice Cancel an unfinalized request and return escrowed vEth2 to the request owner.
    function cancelWithdrawal(uint256 requestId) external nonReentrant whenNotPaused(PAUSE_CANCEL) {
        WithdrawalRequest storage req = requests[requestId];
        if (req.owner != msg.sender) revert NotRequestOwner(requestId, msg.sender);
        if (req.finalized) revert RequestAlreadyFinalized(requestId);
        if (req.canceled) revert RequestCanceled(requestId);

        req.canceled = true;
        pendingVeth2 -= req.vEth2Amount;
        totalCanceledVeth2 += req.vEth2Amount;

        VETH2.safeTransfer(msg.sender, req.vEth2Amount);
        emit WithdrawalCanceled(msg.sender, msg.sender, requestId, req.vEth2Amount);
    }

    // -- Claim -----------------------------------------------------------------

    /// @notice Claim ETH for one finalized withdrawal request to the request owner.
    function claimWithdrawal(uint256 requestId) external nonReentrant {
        uint256 ethAmount = _markClaimed(requestId);
        payable(msg.sender).sendValue(ethAmount);
    }

    /// @notice Claim ETH for multiple finalized withdrawal requests to the request owner.
    function claimWithdrawals(uint256[] calldata requestIds) external nonReentrant {
        if (requestIds.length == 0) revert Errors.InvalidAmount();

        uint256 totalEth = 0;
        for (uint256 i; i < requestIds.length; ++i) {
            totalEth += _markClaimed(requestIds[i]);
        }

        payable(msg.sender).sendValue(totalEth);
    }

    function _markClaimed(uint256 requestId) internal returns (uint256 ethAmount) {
        WithdrawalRequest storage req = requests[requestId];

        if (req.owner != msg.sender) revert NotRequestOwner(requestId, msg.sender);
        if (req.canceled) revert RequestCanceled(requestId);
        if (!req.finalized) revert RequestNotFinalized(requestId);
        if (req.claimed) revert RequestAlreadyClaimed(requestId);

        req.claimed = true;
        ethAmount = req.ethAmount;
        lockedEther -= ethAmount;
        totalClaimedEth += ethAmount;

        emit WithdrawalClaimed(msg.sender, msg.sender, requestId, ethAmount);
    }

    // -- Gov setters -----------------------------------------------------------

    function setRedemptionRate(uint256 newRate) external onlyRole(GOV) {
        if (newRate == 0) revert Errors.InvalidAmount();
        uint256 oldRate = redemptionRate;
        redemptionRate = newRate;
        emit RedemptionRateUpdated(oldRate, newRate);
    }

    function setRequestLimits(uint256 newMinWithdrawal, uint256 newMaxWithdrawal) external onlyRole(GOV) {
        if (newMinWithdrawal == 0 || newMaxWithdrawal < newMinWithdrawal) {
            revert InvalidRequestLimits(newMinWithdrawal, newMaxWithdrawal);
        }
        minWithdrawal = newMinWithdrawal;
        maxWithdrawal = newMaxWithdrawal;
        emit RequestLimitsUpdated(newMinWithdrawal, newMaxWithdrawal);
    }

    function setFinalizeLimits(uint256 newMaxRequestsPerFinalize, uint256 newMinRequestAge) external onlyRole(GOV) {
        if (newMaxRequestsPerFinalize == 0) revert Errors.InvalidAmount();
        if (newMinRequestAge > 365 days) revert InvalidRequestLimits(0, newMinRequestAge);
        maxRequestsPerFinalize = newMaxRequestsPerFinalize;
        minRequestAge = newMinRequestAge;
        emit FinalizeLimitsUpdated(newMaxRequestsPerFinalize, newMinRequestAge);
    }

    function togglePause(uint16 func) external onlyRole(GOV) {
        bool isPaused = paused[func];
        if (isPaused) {
            _unpause(func);
        } else {
            _pause(func);
        }
    }

    /// @notice Recover accidentally sent ETH that is not locked for claims.
    function recoverEth(address payable to, uint256 amount) external onlyRole(GOV) nonReentrant {
        if (to == address(0)) revert Errors.ZeroAddress();
        uint256 available = address(this).balance - lockedEther - totalPendingRefunds;
        if (amount > available) revert Errors.InsufficientBalance();
        to.sendValue(amount);
        emit EthRecovered(to, amount);
    }

    /// @notice Recover vEth2 that has already been finalized and can no longer be canceled.
    function recoverRedeemedVeth2(address to, uint256 amount) external onlyRole(GOV) nonReentrant {
        if (to == address(0)) revert Errors.ZeroAddress();
        uint256 recoverable = VETH2.balanceOf(address(this)) - pendingVeth2;
        if (amount > recoverable) revert Errors.InsufficientBalance();
        VETH2.safeTransfer(to, amount);
        emit RedeemedVeth2Recovered(to, amount);
    }

    // -- Views -----------------------------------------------------------------

    function quoteEth(uint256 vEth2Amount) public view returns (uint256) {
        return (vEth2Amount * redemptionRate) / 1e18;
    }

    function getRequest(uint256 requestId) external view returns (WithdrawalRequest memory) {
        return requests[requestId];
    }

    function availableEther() external view returns (uint256) {
        return address(this).balance - lockedEther - totalPendingRefunds;
    }

    function recoverableVeth2() external view returns (uint256) {
        return VETH2.balanceOf(address(this)) - pendingVeth2;
    }

    // -- Internal role overrides -----------------------------------------------

    function _grantRole(bytes32 role, address account) internal override {
        if (role == GUARDIAN && !hasRole(GUARDIAN, account)) {
            ++guardianCount;
        }
        super._grantRole(role, account);
    }

    function _revokeRole(bytes32 role, address account) internal override {
        if (role == GUARDIAN && hasRole(GUARDIAN, account)) {
            if (guardianCount <= 1) revert CannotRemoveLastGuardian();
            super._revokeRole(role, account);
            --guardianCount;
        } else {
            super._revokeRole(role, account);
        }
    }

    receive() external payable {}
}
