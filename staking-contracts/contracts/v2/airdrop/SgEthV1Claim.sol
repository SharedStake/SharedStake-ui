// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @title SgEthV1Claim
/// @notice Non-transferable-by-default receipt token for selected sgETH V1 loss recipients.
/// @dev Claims use OpenZeppelin StandardMerkleTree-compatible double-hash leaves:
///      keccak256(bytes.concat(keccak256(abi.encode(index, account, amount)))).
contract SgEthV1Claim is ERC20, AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant GOV = keccak256("GOV");
    bytes32 public constant GUARDIAN = keccak256("GUARDIAN");

    // solhint-disable-next-line immutable-vars-naming
    bytes32 public immutable merkleRoot;
    bool public transfersEnabled;
    uint256 public totalClaimed;

    mapping(uint256 => uint256) private claimedBitMap;

    event Claimed(uint256 indexed index, address indexed account, uint256 amount);
    event TransfersEnabledSet(bool enabled);

    error AlreadyClaimed(uint256 index);
    error ClaimantMismatch(address caller, address account);
    error InvalidMerkleProof();
    error InvalidAmount();
    error TransfersDisabled();
    error ZeroAddress();
    error ZeroMerkleRoot();

    constructor(
        bytes32 _merkleRoot,
        address _gov,
        address _guardian,
        bool _transfersEnabled
    ) ERC20("sgethV1Claim", "sgethV1Claim") {
        if (_merkleRoot == bytes32(0)) revert ZeroMerkleRoot();
        if (_gov == address(0) || _guardian == address(0)) revert ZeroAddress();

        merkleRoot = _merkleRoot;
        transfersEnabled = _transfersEnabled;

        _grantRole(DEFAULT_ADMIN_ROLE, _gov);
        _grantRole(GOV, _gov);
        _grantRole(GUARDIAN, _guardian);
    }

    /// @notice Pause new claims. Does not affect already minted receipt balances.
    function pause() external onlyRole(GUARDIAN) {
        _pause();
    }

    /// @notice Resume claims after a pause.
    function unpause() external onlyRole(GOV) {
        _unpause();
    }

    /// @notice Governance can enable or disable normal ERC20 transfers.
    /// @dev Claims, mints, and burns remain possible while transfers are disabled.
    function setTransfersEnabled(bool enabled) external onlyRole(GOV) {
        transfersEnabled = enabled;
        emit TransfersEnabledSet(enabled);
    }

    /// @notice Claim receipt tokens for the caller using their Merkle proof.
    /// @dev The account must be msg.sender, preventing third-party claim side effects.
    function claim(
        uint256 index,
        address account,
        uint256 amount,
        bytes32[] calldata proof
    ) external whenNotPaused nonReentrant {
        if (msg.sender != account) revert ClaimantMismatch(msg.sender, account);
        if (account == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();
        if (isClaimed(index)) revert AlreadyClaimed(index);

        bytes32 leaf = claimLeaf(index, account, amount);
        if (!MerkleProof.verify(proof, merkleRoot, leaf)) revert InvalidMerkleProof();

        _setClaimed(index);
        totalClaimed += amount;
        _mint(account, amount);

        emit Claimed(index, account, amount);
    }

    function isClaimed(uint256 index) public view returns (bool) {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        uint256 claimedWord = claimedBitMap[claimedWordIndex];
        uint256 mask = (1 << claimedBitIndex);
        return claimedWord & mask == mask;
    }

    function claimLeaf(uint256 index, address account, uint256 amount) public pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encode(index, account, amount))));
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
        if (from != address(0) && to != address(0) && !transfersEnabled) revert TransfersDisabled();
        super._beforeTokenTransfer(from, to, amount);
    }

    function _setClaimed(uint256 index) private {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        claimedBitMap[claimedWordIndex] = claimedBitMap[claimedWordIndex] | (1 << claimedBitIndex);
    }
}
