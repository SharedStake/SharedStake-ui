// SPDX-License-Identifier: UNLICENSED

// based on ref code from gnt
pragma solidity 0.8.7;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "../interfaces/IBlocklist.sol";
import "../interfaces/IAllowlist.sol";

// Allows user to migrate from old token to new token by burning the old token

contract TokenMigrator is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    struct SwapRecord {
        uint256 amount;
        uint256 unlockTimestamp;
    }

    ERC20Burnable public target;
    IERC20 public oldToken;
    IBlocklist private _blocklist;
    IAllowlist private _allowlist;
    uint256 public startTime;

    address[] public stakers;
    // address public constant burn = 0x000000000000000000000000000000000000dEaD;

    mapping(address => SwapRecord) public lockedSwaps;

    event TargetChanged(ERC20Burnable previousTarget, ERC20Burnable changedTarget);
    event BlocklistChanged(IBlocklist previousTarget, IBlocklist changedTarget);
    event AllowlistChanged(IAllowlist previousTarget, IAllowlist changedTarget);

    event SwapLocked(address from, uint256 value, uint256 unlockTimestamp);
    event Migrated(address from, address to, ERC20Burnable target, uint256 value);

    constructor(IERC20 _oldToken, ERC20Burnable _target, IBlocklist bl, IAllowlist al) {
        require(address(_oldToken) != address(0), "FD:0AD");
        oldToken = _oldToken;
        target = _target;
        _blocklist = bl;
        _allowlist = al;
        startTime = block.timestamp;
    }

    function migrate(uint256 _value) external {
        require(address(target) != address(0), "FD:0AD");

        oldToken.transferFrom(msg.sender, 0x000000000000000000000000000000000000dEaD, _value);

        if (_inAllowlist(msg.sender) || _inBlocklist(msg.sender)) {
            _sendTokens(_value, msg.sender);
            return;
        }
        uint256 tenPrctOfDeposit = _value / 10;
        _value -= tenPrctOfDeposit;

        SwapRecord memory existingSwap = lockedSwaps[msg.sender];
        existingSwap.amount += _value;
        existingSwap.unlockTimestamp = block.timestamp + 5 days;
        lockedSwaps[msg.sender] = existingSwap;

        _sendTokens(tenPrctOfDeposit, msg.sender);
        emit SwapLocked(msg.sender, _value, existingSwap.unlockTimestamp);
    }

    function releaseTokens() external {
        require(address(target) != address(0), "FD:0AD");
        _releaseForUser(msg.sender);
    }

    function setTarget(ERC20Burnable _target) external onlyOwner {
        emit TargetChanged(target, _target);
        target = _target;
    }

    function setBlocklist(IBlocklist bl) external onlyOwner {
        emit BlocklistChanged(_blocklist, bl);
        _blocklist = bl;
    }

    function setAllowlist(IAllowlist al) external onlyOwner {
        emit AllowlistChanged(_allowlist, al);
        _allowlist = al;
    }

    function releaseForAll() external onlyOwner {
        uint256 stakersLength = stakers.length;
        for (uint256 i = 0; i < stakersLength; i++) {
            address staker = stakers[i];
            _releaseForUser(staker);
        }
    }

    // Based on community advice. once a preset epoch of 1-2 mos expired,
    // all tokens in the contract
    // should be burnt. this will reduce circulating supply and
    // reassure the community of limited dilution
    function burnAll() external onlyOwner {
        require((startTime + 60 days) < block.timestamp, "TM:Too early");
        target.burn(target.balanceOf(address(this)));
    }

    function _inBlocklist(address to) internal returns (bool) {
        if (address(_blocklist) != address(0) && _blocklist.inBlockList(to)) {
            return true;
        } else {
            return false;
        }
    }

    function _inAllowlist(address to) internal returns (bool) {
        if (address(_blocklist) != address(0) && _allowlist.inAllowlist(to)) {
            return true;
        } else {
            return false;
        }
    }

    function _releaseForUser(address to) internal {
        SwapRecord memory existingSwap = lockedSwaps[to];
        if (_inAllowlist(to)) {
            existingSwap.unlockTimestamp = block.timestamp;
        }
        if (existingSwap.amount > 0 && block.timestamp >= existingSwap.unlockTimestamp) {
            delete lockedSwaps[to];
            _sendTokens(existingSwap.amount, to);
        }
    }

    function _sendTokens(uint256 amount, address to) internal {
        if (_inBlocklist(to)) {
            target.transfer(owner(), amount);
            emit Migrated(to, owner(), target, amount);
        } else {
            target.transfer(to, amount);
            emit Migrated(to, to, target, amount);
        }
    }
}
