// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Errors} from "../lib/Errors.sol";

/// @title VoteEscrowV2 — vote-escrowed SGT for SharedStake V2 governance
/// @notice Curve-style vote escrow that locks SGTv2 for decaying voting power.
///         Voting power is compatible with OpenZeppelin Governor (ERC20Votes).
///
///         Lock SGTv2 → receive veSGT voting power that decays linearly to 0
///         at lock expiry. Longer locks = more voting power per SGT locked.
///
///         Key difference from V1: voting power properly decays in ERC20Votes
///         checkpoints, enabling accurate on-chain governance voting.
///
/// Roles:
///   GOV — set params (penalty rate, min lock)
///   No owner after initial setup (renounced)
contract VoteEscrowV2 is ERC20, ERC20Permit, ERC20Votes, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── Roles ─────────────────────────────────────────────────────────────────
    address public gov;

    // ── Constants ─────────────────────────────────────────────────────────────
    uint256 public constant MINDAYS = 7;
    uint256 public constant MAXDAYS = 3 * 365;
    uint256 public constant MAXTIME = MAXDAYS * 1 days;
    uint256 public constant MAX_WITHDRAWAL_PENALTY = 50000; // 50%
    uint256 public constant PRECISION = 100000;

    // ── Immutables ────────────────────────────────────────────────────────────
    IERC20 public immutable SGT;

    // ── State ─────────────────────────────────────────────────────────────────
    struct LockedBalance {
        uint256 amount;
        uint256 end;
    }

    uint256 public earlyWithdrawPenaltyRate = 30000; // 30%
    uint256 public minLockedAmount;
    address public penaltyCollector;

    mapping(address => LockedBalance) public locked;
    mapping(address => uint256) public mintedForLock;
    mapping(address => uint256) public lastCheckpointBlock;
    mapping(address => uint256) public lastCheckpointTimestamp;

    // ── Events ────────────────────────────────────────────────────────────────
    event Deposit(address indexed provider, uint256 value, uint256 locktime, uint256 timestamp);
    event Withdraw(address indexed provider, uint256 value, uint256 timestamp);
    event EarlyWithdraw(address indexed provider, uint256 value, uint256 fee, uint256 timestamp);
    event PenaltyCollectorSet(address indexed addr);
    event EarlyWithdrawPenaltySet(uint256 indexed penalty);
    event MinLockedAmountSet(uint256 indexed amount);
    event GovTransferred(address indexed oldGov, address indexed newGov);
    event CheckpointSynced(address indexed account, uint256 checkpointBlock, uint256 checkpointTimestamp);

    // ── Errors ────────────────────────────────────────────────────────────────
    error NothingToWithdraw();
    error LockNotExpired();
    error LessThanMinAmount();
    error WithdrawOldTokensFirst();
    error MinDaysTooShort();
    error MaxDaysTooLong();
    error CannotExtendBeyondMax();
    error NoBenefitToLock();
    error LockExpired();
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

    // ── Governance modifier ───────────────────────────────────────────────────
    modifier onlyGov() {
        if (msg.sender != gov) revert PermissionDenied();
        _;
    }

    // ── Locking ───────────────────────────────────────────────────────────────

    function create_lock(uint256 _value, uint256 _days) external nonReentrant {
        if (_value < minLockedAmount) revert LessThanMinAmount();
        if (locked[msg.sender].amount != 0) revert WithdrawOldTokensFirst();
        if (_days < MINDAYS) revert MinDaysTooShort();
        if (_days > MAXDAYS) revert MaxDaysTooLong();

        _deposit_for(msg.sender, _value, _days);
    }

    function increase_amount(uint256 _value) external nonReentrant {
        if (_value < minLockedAmount) revert LessThanMinAmount();
        _syncVotingPower(msg.sender);
        _deposit_for(msg.sender, _value, 0);
    }

    function increase_unlock_time(uint256 _days) external nonReentrant {
        if (_days < MINDAYS) revert MinDaysTooShort();
        if (_days > MAXDAYS) revert MaxDaysTooLong();

        LockedBalance storage _locked = locked[msg.sender];
        if (_locked.amount == 0) revert NothingToWithdraw();
        if (block.timestamp >= _locked.end) revert LockExpired();

        _syncVotingPower(msg.sender);

        uint256 _now = block.timestamp;
        uint256 _end = _locked.end;
        uint256 _amount = _locked.amount;

        // Cannot increase amount and extend lock simultaneously
        uint256 _vp = voting_power_locked_days(_amount, _days);
        _locked.end = _end + _days * 1 days;
        if (_locked.end - _now > MAXTIME) revert CannotExtendBeyondMax();

        if (_vp == 0) revert NoBenefitToLock();

        // Mint additional voting power for the extension
        _mint(msg.sender, _vp);
        mintedForLock[msg.sender] += _vp;

        emit Deposit(msg.sender, _locked.amount, _locked.end, _now);
    }

    function withdraw() external nonReentrant {
        _syncVotingPower(msg.sender);

        LockedBalance storage _locked = locked[msg.sender];
        uint256 _now = block.timestamp;
        if (_locked.amount == 0) revert NothingToWithdraw();
        if (_now < _locked.end) revert LockNotExpired();

        uint256 _amount = _locked.amount;
        _locked.end = 0;
        _locked.amount = 0;

        uint256 _minted = mintedForLock[msg.sender];
        mintedForLock[msg.sender] = 0;
        _burn(msg.sender, _minted);

        SGT.safeTransfer(msg.sender, _amount);
        emit Withdraw(msg.sender, _amount, _now);
    }

    function emergencyWithdraw() external nonReentrant {
        _syncVotingPower(msg.sender);

        LockedBalance storage _locked = locked[msg.sender];
        uint256 _now = block.timestamp;
        if (_locked.amount == 0) revert NothingToWithdraw();

        uint256 _amount = _locked.amount;
        if (_now < _locked.end) {
            uint256 _fee = (_amount * earlyWithdrawPenaltyRate) / PRECISION;
            _penalize(_fee);
            _amount -= _fee;
            emit EarlyWithdraw(msg.sender, _amount, _fee, _now);
        }

        _locked.end = 0;
        _locked.amount = 0;

        uint256 _minted = mintedForLock[msg.sender];
        mintedForLock[msg.sender] = 0;
        _burn(msg.sender, _minted);

        SGT.safeTransfer(msg.sender, _amount);
        emit Withdraw(msg.sender, _amount, _now);
    }

    // ── Admin (GOV only) ──────────────────────────────────────────────────────

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

    // ── Public views ──────────────────────────────────────────────────────────

    function voting_power_unlock_time(uint256 _value, uint256 _unlockTime) public view returns (uint256) {
        uint256 _now = block.timestamp;
        if (_unlockTime <= _now) return 0;
        uint256 _lockedSeconds = _unlockTime - _now;
        if (_lockedSeconds >= MAXTIME) {
            return _value;
        }
        return (_value * _lockedSeconds) / MAXTIME;
    }

    function voting_power_locked_days(uint256 _value, uint256 _days) public view returns (uint256) {
        if (_days >= MAXDAYS) {
            return _value;
        }
        return (_value * _days) / MAXDAYS;
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    function _deposit_for(address _addr, uint256 _value, uint256 _days) internal {
        LockedBalance storage _locked = locked[_addr];
        uint256 _now = block.timestamp;
        uint256 _amount = _locked.amount;
        uint256 _end = _locked.end;
        uint256 _vp;
        if (_amount == 0) {
            _vp = voting_power_locked_days(_value, _days);
            _locked.amount = _value;
            _locked.end = _now + _days * 1 days;
        } else if (_days == 0) {
            _vp = voting_power_unlock_time(_value, _end);
            _locked.amount = _amount + _value;
        } else {
            // This path is unreachable from the external entry points,
            // but kept for internal consistency.
            _vp = voting_power_locked_days(_amount, _days);
            _locked.end = _end + _days * 1 days;
            if (_locked.end - _now > MAXTIME) revert CannotExtendBeyondMax();
        }
        if (_vp == 0) revert NoBenefitToLock();
        if (_value > 0) {
            SGT.safeTransferFrom(msg.sender, address(this), _value);
        }
        _mint(_addr, _vp);
        mintedForLock[_addr] += _vp;
        _markCheckpoint(_addr);

        emit Deposit(_addr, _locked.amount, _locked.end, _now);
    }

    function _penalize(uint256 _amount) internal {
        if (penaltyCollector != address(0)) {
            SGT.safeTransfer(penaltyCollector, _amount);
        } else {
            // If no collector set, tokens are effectively burned by staying in contract
            // or could be sent to dead address via future gov action
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

    // ── ERC20Votes required overrides ─────────────────────────────────────────

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
