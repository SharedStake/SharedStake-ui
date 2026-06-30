// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

// solhint-disable not-rely-on-time

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title VoteEscrowV2 - vote-escrowed SGT for SharedStake V2 governance
/// @notice Curve-style vote escrow that locks SGTv2 for decaying voting power.
///         Voting power is compatible with OpenZeppelin Governor (ERC20Votes).
///
///         Lock SGTv2 -> receive veSGT voting power that decays linearly to 0
///         at lock expiry. Longer locks = more voting power per SGT locked.
///         Lock durations are rounded to whole-week increments and may run up
///         to four years, matching the governance alignment window popularized
///         by Curve's veCRV model.
///
///         Key difference from V1: voting power properly decays in ERC20Votes
///         checkpoints, enabling accurate on-chain governance voting when users
///         or keepers checkpoint accounts before proposal snapshots.
///
/// Roles:
///   GOV - set params (penalty rate, min lock)
///   No owner after initial setup (renounced)
contract VoteEscrowV2 is ERC20, ERC20Permit, ERC20Votes, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // -- Roles -----------------------------------------------------------------
    address public gov;

    // -- Constants -------------------------------------------------------------
    uint256 public constant WEEK = 7 days;
    uint256 public constant MINDAYS = 7;
    uint256 public constant MAXDAYS = 4 * 365;
    uint256 public constant MAXTIME = MAXDAYS * 1 days;
    uint256 public constant MAX_WITHDRAWAL_PENALTY = 50000; // 50%
    uint256 public constant PRECISION = 100000;

    // -- Immutables ------------------------------------------------------------
    IERC20 public immutable SGT;

    // -- State -----------------------------------------------------------------
    struct LockedBalance {
        uint256 amount;
        uint256 start;
        uint256 end;
        uint256 lastDepositTime;
        uint256 penaltyRateAtLock; // rate stored at creation time for emergencyWithdraw
    }

    uint256 public earlyWithdrawPenaltyRate = 30000; // 30%
    uint256 public minLockedAmount;
    address public penaltyCollector;

    uint256 public totalLocked;
    uint256 public openLockCount;
    uint256 public totalLocksCreated;
    uint256 public totalActiveLockCommitment;

    mapping(address => LockedBalance) public locked;
    mapping(address => uint256) public mintedForLock;
    mapping(address => uint256) public lastCheckpointBlock;
    mapping(address => uint256) public lastCheckpointTimestamp;

    // -- Events ----------------------------------------------------------------
    event Deposit(address indexed provider, uint256 value, uint256 locktime, uint256 timestamp);
    event Withdraw(address indexed provider, uint256 value, uint256 timestamp);
    event EarlyWithdraw(address indexed provider, uint256 value, uint256 fee, uint256 timestamp);
    event PenaltyCollectorSet(address indexed addr);
    event EarlyWithdrawPenaltySet(uint256 indexed penalty);
    event MinLockedAmountSet(uint256 indexed amount);
    event GovTransferred(address indexed oldGov, address indexed newGov);
    event CheckpointSynced(address indexed account, uint256 checkpointBlock, uint256 checkpointTimestamp);
    event LockCreated(address indexed provider, uint256 amount, uint256 start, uint256 end, uint256 votingPower);
    event LockAmountIncreased(
        address indexed provider,
        uint256 addedAmount,
        uint256 totalAmount,
        uint256 end,
        uint256 addedVotingPower
    );
    event LockExtended(address indexed provider, uint256 oldEnd, uint256 newEnd, uint256 addedVotingPower);
    event LockStatsUpdated(uint256 totalLocked, uint256 openLockCount, uint256 totalActiveLockCommitment);

    // -- Errors ----------------------------------------------------------------
    error NothingToWithdraw();
    error LockNotExpired();
    error LessThanMinAmount();
    error WithdrawOldTokensFirst();
    error MinDaysTooShort();
    error MaxDaysTooLong();
    error CannotExtendBeyondMax();
    error NoBenefitToLock();
    error LockExpired();
    error UnlockTimeNotIncreasing();
    error PenaltyTooHigh();
    error ZeroAddress();
    error PermissionDenied();
    error NonTransferable();

    constructor(
        string memory _name,
        string memory _symbol,
        address _sgt,
        uint256 _minLockedAmount,
        address _gov
    ) ERC20(_name, _symbol) ERC20Permit(_name) {
        if (_sgt == address(0) || _gov == address(0)) revert ZeroAddress();
        SGT = IERC20(_sgt);
        minLockedAmount = _minLockedAmount;
        gov = _gov;
    }

    // -- Governance modifier ---------------------------------------------------
    modifier onlyGov() {
        if (msg.sender != gov) revert PermissionDenied();
        _;
    }

    // -- Locking ---------------------------------------------------------------

    function create_lock(uint256 _value, uint256 _days) external nonReentrant {
        if (_value < minLockedAmount) revert LessThanMinAmount();
        if (locked[msg.sender].amount != 0) revert WithdrawOldTokensFirst();

        _createLock(msg.sender, _value, unlock_time_for_days(_days));
    }

    /// @notice Lock SGT until an absolute timestamp, rounded down to a whole-week boundary.
    /// @dev This mirrors Curve-style unlock timestamps while preserving the duration-based
    ///      create_lock API used by the existing frontend.
    function create_lock_until(uint256 _value, uint256 _unlockTime) external nonReentrant {
        if (_value < minLockedAmount) revert LessThanMinAmount();
        if (locked[msg.sender].amount != 0) revert WithdrawOldTokensFirst();

        _createLock(msg.sender, _value, normalized_unlock_time(_unlockTime));
    }

    function increase_amount(uint256 _value) external nonReentrant {
        if (_value < minLockedAmount) revert LessThanMinAmount();
        LockedBalance storage _locked = locked[msg.sender];
        if (_locked.amount == 0) revert NothingToWithdraw();
        if (block.timestamp >= _locked.end) revert LockExpired();

        _syncVotingPower(msg.sender);

        uint256 _now = block.timestamp;
        uint256 oldAmount = _locked.amount;
        uint256 oldStart = _locked.start;
        uint256 oldEnd = _locked.end;
        uint256 addedVotingPower = voting_power_unlock_time(_value, oldEnd);
        if (addedVotingPower == 0) revert NoBenefitToLock();

        SGT.safeTransferFrom(msg.sender, address(this), _value);
        _locked.amount = oldAmount + _value;
        _locked.lastDepositTime = _now;
        mintedForLock[msg.sender] += addedVotingPower;
        _mint(msg.sender, addedVotingPower);
        _updateLockAggregates(oldAmount, oldStart, oldEnd, _locked.amount, _locked.start, _locked.end);
        _markCheckpoint(msg.sender);

        emit Deposit(msg.sender, _locked.amount, _locked.end, _now);
        emit LockAmountIncreased(msg.sender, _value, _locked.amount, _locked.end, addedVotingPower);
    }

    function increase_unlock_time(uint256 _days) external nonReentrant {
        LockedBalance storage _locked = locked[msg.sender];
        if (_locked.amount == 0) revert NothingToWithdraw();
        if (block.timestamp >= _locked.end) revert LockExpired();

        uint256 newEnd = _locked.end + normalized_lock_days(_days) * 1 days;
        _extendLock(msg.sender, newEnd);
    }

    /// @notice Extend an existing lock to an absolute timestamp, rounded down to a whole-week boundary.
    function increase_unlock_time_to(uint256 _unlockTime) external nonReentrant {
        LockedBalance storage _locked = locked[msg.sender];
        if (_locked.amount == 0) revert NothingToWithdraw();
        if (block.timestamp >= _locked.end) revert LockExpired();

        _extendLock(msg.sender, normalized_unlock_time(_unlockTime));
    }

    function withdraw() external nonReentrant {
        _syncVotingPower(msg.sender);

        LockedBalance storage _locked = locked[msg.sender];
        uint256 _now = block.timestamp;
        if (_locked.amount == 0) revert NothingToWithdraw();
        if (_now < _locked.end) revert LockNotExpired();

        uint256 _amount = _locked.amount;
        uint256 oldStart = _locked.start;
        uint256 oldEnd = _locked.end;
        _locked.end = 0;
        _locked.start = 0;
        _locked.amount = 0;
        _locked.lastDepositTime = 0;
        _locked.penaltyRateAtLock = 0;

        uint256 _minted = mintedForLock[msg.sender];
        mintedForLock[msg.sender] = 0;
        _burn(msg.sender, _minted);
        _updateLockAggregates(_amount, oldStart, oldEnd, 0, 0, 0);

        SGT.safeTransfer(msg.sender, _amount);
        emit Withdraw(msg.sender, _amount, _now);
    }

    function emergencyWithdraw() external nonReentrant {
        _syncVotingPower(msg.sender);

        LockedBalance storage _locked = locked[msg.sender];
        uint256 _now = block.timestamp;
        if (_locked.amount == 0) revert NothingToWithdraw();

        uint256 originalAmount = _locked.amount;
        uint256 _amount = originalAmount;
        uint256 oldStart = _locked.start;
        uint256 oldEnd = _locked.end;
        if (_now < _locked.end) {
            uint256 rate = _locked.penaltyRateAtLock < earlyWithdrawPenaltyRate
                ? _locked.penaltyRateAtLock
                : earlyWithdrawPenaltyRate;
            uint256 _fee = (_amount * rate) / PRECISION;
            _penalize(_fee);
            _amount -= _fee;
            emit EarlyWithdraw(msg.sender, _amount, _fee, _now);
        }

        _locked.end = 0;
        _locked.start = 0;
        _locked.amount = 0;
        _locked.lastDepositTime = 0;
        _locked.penaltyRateAtLock = 0;

        uint256 _minted = mintedForLock[msg.sender];
        mintedForLock[msg.sender] = 0;
        _burn(msg.sender, _minted);
        _updateLockAggregates(originalAmount, oldStart, oldEnd, 0, 0, 0);

        SGT.safeTransfer(msg.sender, _amount);
        emit Withdraw(msg.sender, _amount, _now);
    }

    // -- Admin (GOV only) ------------------------------------------------------

    function setEarlyWithdrawPenaltyRate(uint256 _rate) external onlyGov {
        if (_rate > MAX_WITHDRAWAL_PENALTY) revert PenaltyTooHigh();
        earlyWithdrawPenaltyRate = _rate;
        emit EarlyWithdrawPenaltySet(_rate);
    }

    function setMinLockedAmount(uint256 _amount) external onlyGov {
        minLockedAmount = _amount;
        emit MinLockedAmountSet(_amount);
    }

    function setPenaltyCollector(address _addr) external onlyGov {
        if (_addr == address(0)) revert ZeroAddress();
        penaltyCollector = _addr;
        emit PenaltyCollectorSet(_addr);
    }

    function transferGov(address _newGov) external onlyGov {
        if (_newGov == address(0)) revert ZeroAddress();
        address oldGov = gov;
        gov = _newGov;
        emit GovTransferred(oldGov, _newGov);
    }

    /// @notice Permissionless voting-power decay checkpoint.
    /// @dev Burns stale ve balance down to current lock-derived voting power.
    function checkpoint(address account) external {
        _syncVotingPower(account);
    }

    /// @notice Batch checkpoint helper to refresh multiple delegates in one transaction.
    function checkpointMany(address[] calldata accounts) external {
        for (uint256 i; i < accounts.length; ++i) {
            _syncVotingPower(accounts[i]);
        }
    }

    // -- Public views ----------------------------------------------------------

    function voting_power_unlock_time(uint256 _value, uint256 _unlockTime) public view returns (uint256) {
        uint256 _now = block.timestamp;
        if (_unlockTime <= _now) return 0;
        uint256 _lockedSeconds = _unlockTime - _now;
        if (_lockedSeconds >= MAXTIME) {
            return _value;
        }
        return (_value * _lockedSeconds) / MAXTIME;
    }

    function voting_power_locked_days(uint256 _value, uint256 _days) public pure returns (uint256) {
        uint256 daysRounded = normalized_lock_days(_days);
        if (daysRounded >= MAXDAYS) {
            return _value;
        }
        return (_value * daysRounded) / MAXDAYS;
    }

    function projectedBalanceOf(address account) public view returns (uint256) {
        LockedBalance memory lock = locked[account];
        return voting_power_unlock_time(lock.amount, lock.end);
    }

    function normalized_lock_days(uint256 _days) public pure returns (uint256) {
        if (_days < MINDAYS) revert MinDaysTooShort();
        if (_days > MAXDAYS) revert MaxDaysTooLong();

        uint256 roundedDays = ((_days + MINDAYS - 1) / MINDAYS) * MINDAYS;
        if (roundedDays > MAXDAYS) return MAXDAYS;
        return roundedDays;
    }

    function unlock_time_for_days(uint256 _days) public view returns (uint256) {
        return block.timestamp + normalized_lock_days(_days) * 1 days;
    }

    function normalized_unlock_time(uint256 _unlockTime) public view returns (uint256) {
        uint256 rounded = (_unlockTime / WEEK) * WEEK;
        uint256 _now = block.timestamp;
        if (rounded < _now + MINDAYS * 1 days) revert MinDaysTooShort();
        if (rounded > _now + MAXTIME) revert MaxDaysTooLong();
        return rounded;
    }

    function averageLockDuration() public view returns (uint256) {
        if (totalLocked == 0) return 0;
        return totalActiveLockCommitment / totalLocked;
    }

    function getLockStats(
        address account
    )
        external
        view
        returns (
            uint256 amount,
            uint256 start,
            uint256 end,
            uint256 remaining,
            uint256 lockDuration,
            uint256 currentVotingPower,
            uint256 checkpointedVotingPower,
            uint256 maxVotingPower,
            uint256 penaltyRateAtLock
        )
    {
        LockedBalance memory lock = locked[account];
        amount = lock.amount;
        start = lock.start;
        end = lock.end;
        if (end > block.timestamp) remaining = end - block.timestamp;
        if (end > start) lockDuration = end - start;
        currentVotingPower = voting_power_unlock_time(lock.amount, lock.end);
        checkpointedVotingPower = mintedForLock[account];
        maxVotingPower = lock.amount;
        penaltyRateAtLock = lock.penaltyRateAtLock;
    }

    function globalLockStats()
        external
        view
        returns (
            uint256 lockedAmount,
            uint256 openLocks,
            uint256 locksCreated,
            uint256 activeLockCommitment,
            uint256 averageDuration,
            uint256 checkpointedVotingSupply,
            uint256 maxVotingSupply
        )
    {
        lockedAmount = totalLocked;
        openLocks = openLockCount;
        locksCreated = totalLocksCreated;
        activeLockCommitment = totalActiveLockCommitment;
        averageDuration = averageLockDuration();
        checkpointedVotingSupply = totalSupply();
        maxVotingSupply = totalLocked;
    }

    // -- Internal --------------------------------------------------------------

    function _createLock(address _addr, uint256 _value, uint256 _unlockTime) internal {
        uint256 _now = block.timestamp;
        if (_unlockTime <= _now) revert NoBenefitToLock();
        if (_unlockTime - _now > MAXTIME) revert CannotExtendBeyondMax();

        uint256 _vp = voting_power_unlock_time(_value, _unlockTime);
        if (_vp == 0) revert NoBenefitToLock();

        LockedBalance storage _locked = locked[_addr];
        _locked.amount = _value;
        _locked.start = _now;
        _locked.end = _unlockTime;
        _locked.lastDepositTime = _now;
        _locked.penaltyRateAtLock = earlyWithdrawPenaltyRate;

        SGT.safeTransferFrom(msg.sender, address(this), _value);
        _mint(_addr, _vp);
        mintedForLock[_addr] += _vp;
        _updateLockAggregates(0, 0, 0, _value, _now, _unlockTime);
        _markCheckpoint(_addr);

        emit Deposit(_addr, _locked.amount, _locked.end, _now);
        emit LockCreated(_addr, _value, _now, _unlockTime, _vp);
    }

    function _extendLock(address account, uint256 newEnd) internal {
        _syncVotingPower(account);

        LockedBalance storage lock = locked[account];
        uint256 _now = block.timestamp;
        uint256 oldAmount = lock.amount;
        uint256 oldStart = lock.start;
        uint256 oldEnd = lock.end;
        if (newEnd <= oldEnd) revert UnlockTimeNotIncreasing();
        if (newEnd - _now > MAXTIME) revert CannotExtendBeyondMax();

        uint256 currentPower = mintedForLock[account];
        uint256 newPower = voting_power_unlock_time(oldAmount, newEnd);
        if (newPower <= currentPower) revert NoBenefitToLock();

        uint256 addedPower = newPower - currentPower;
        lock.end = newEnd;
        mintedForLock[account] = newPower;
        _mint(account, addedPower);
        _updateLockAggregates(oldAmount, oldStart, oldEnd, lock.amount, lock.start, lock.end);
        _markCheckpoint(account);

        emit Deposit(account, lock.amount, lock.end, _now);
        emit LockExtended(account, oldEnd, newEnd, addedPower);
    }

    function _penalize(uint256 _amount) internal {
        if (penaltyCollector != address(0)) {
            SGT.safeTransfer(penaltyCollector, _amount);
        } else {
            SGT.safeTransfer(address(0x000000000000000000000000000000000000dEaD), _amount);
        }
    }

    function _syncVotingPower(address account) internal {
        uint256 minted = mintedForLock[account];
        if (minted == 0) {
            _markCheckpoint(account);
            return;
        }

        LockedBalance storage lock = locked[account];
        uint256 currentPower = voting_power_unlock_time(lock.amount, lock.end);
        if (currentPower >= minted) {
            _markCheckpoint(account);
            return;
        }

        uint256 decay = minted - currentPower;
        mintedForLock[account] = currentPower;
        _burn(account, decay);
        _markCheckpoint(account);
    }

    function _markCheckpoint(address account) internal {
        if (account == address(0)) return;
        lastCheckpointBlock[account] = block.number;
        lastCheckpointTimestamp[account] = block.timestamp;
        emit CheckpointSynced(account, block.number, block.timestamp);
    }

    function _lockCommitment(uint256 amount, uint256 start, uint256 end) internal pure returns (uint256) {
        if (amount == 0 || end <= start) return 0;
        return amount * (end - start);
    }

    function _updateLockAggregates(
        uint256 oldAmount,
        uint256 oldStart,
        uint256 oldEnd,
        uint256 newAmount,
        uint256 newStart,
        uint256 newEnd
    ) internal {
        uint256 oldCommitment = _lockCommitment(oldAmount, oldStart, oldEnd);
        uint256 newCommitment = _lockCommitment(newAmount, newStart, newEnd);

        if (oldAmount == 0 && newAmount != 0) {
            openLockCount += 1;
            totalLocksCreated += 1;
        } else if (oldAmount != 0 && newAmount == 0) {
            openLockCount -= 1;
        }

        totalLocked = totalLocked - oldAmount + newAmount;
        totalActiveLockCommitment = totalActiveLockCommitment - oldCommitment + newCommitment;
        emit LockStatsUpdated(totalLocked, openLockCount, totalActiveLockCommitment);
    }

    // -- ERC20Votes required overrides -----------------------------------------

    function _mint(address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._burn(account, amount);
    }

    function _afterTokenTransfer(address from, address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
        if (from != address(0) && to != address(0)) revert NonTransferable();
        super._beforeTokenTransfer(from, to, amount);
    }
}
