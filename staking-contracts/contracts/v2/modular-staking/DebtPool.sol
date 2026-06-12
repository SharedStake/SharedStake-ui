// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {Errors} from "../lib/Errors.sol";

interface IStETH is IERC20 {
    function getPooledEthByShares(uint256 sharesAmount) external view returns (uint256);
}

/// @title DebtPool - Merkle tree distribution pool for debt repayment
/// @notice Accumulates stETH shares from FeeController, unwraps to wstETH, and distributes via merkle tree claims
/// @dev This contract receives stETH shares, unwraps to wstETH, and allows specific addresses to claim
///      their share using merkle proofs. Admin can trigger new distributions by updating merkle roots.
contract DebtPool is AccessControl, Pausable {
    using MerkleProof for bytes32[];

    bytes32 public constant GOV = keccak256("GOV");
    bytes32 public constant ADMIN = keccak256("ADMIN");
    bytes32 public constant FEE_CONTROLLER = keccak256("FEE_CONTROLLER");

    // Minimum claim period before unclaimed fees can be withdrawn (30 days)
    uint256 public constant MIN_CLAIM_PERIOD = 30 days;

    IERC20 public immutable ST_TOKEN;
    IERC20 public immutable WSTETH;

    // Distribution tracking
    uint256 public distributionId; // Incremented on each new distribution
    uint256 public totalStETHSharesReceived; // stETH shares from FeeController (pre-wrap)
    uint256 public totalWSTETHClaimed; // wstETH transferred to claimants

    /// @notice Total wstETH allocated across active distributions but not yet claimed.
    ///         Used to prevent overbooking — createDistribution checks free balance only.
    uint256 public totalAllocatedUnclaimed;

    // Per-distribution tracking
    struct Distribution {
        bytes32 merkleRoot;
        uint256 totalAmount;
        uint256 claimedAmount;
        uint256 timestamp;
        bool finalized;
        bool swept; // set by withdrawUnclaimedFees so claim() gives a clear error instead of InsufficientBalance
    }
    mapping(uint256 => Distribution) public distributions;

    // Per-leaf tracking to prevent double-claim
    mapping(uint256 => mapping(uint256 => bool)) public claimed; // distributionId => leafIndex => claimed

    // Events
    event DistributionCreated(uint256 indexed distributionId, bytes32 merkleRoot, uint256 totalAmount);
    event Claimed(uint256 indexed distributionId, address indexed recipient, uint256 amount);
    event StETHReceived(uint256 amount);
    event WstETHUnwrapped(uint256 stETHAmount, uint256 wstETHAmount);
    event MerkleRootUpdated(uint256 indexed distributionId, bytes32 newRoot);
    event UnclaimedFeesWithdrawn(uint256 amount);
    event WrapFailed(uint256 shares, uint256 stEthAmount);

    error InvalidMerkleProof();
    error AlreadyClaimed();
    error DistributionNotFinalized();
    error DistributionAlreadyFinalized();
    error NoUnclaimedFees();
    error InsufficientBalance();
    error InvalidAmount();
    error UnwrapFailed();
    error InsufficientWstETHReceived();
    error NotFeeController();
    /// @notice Claim amount would exceed the distribution's declared total (bad merkle tree).
    error ExceedsDistributionTotal(uint256 requested, uint256 remaining);
    /// @notice Distribution has been swept by governance; remaining funds were recovered.
    error DistributionSwept();

    modifier onlyDistributionFinalized(uint256 _distributionId) {
        if (!distributions[_distributionId].finalized) revert DistributionNotFinalized();
        _;
    }

    modifier onlyFeeController() {
        if (!hasRole(FEE_CONTROLLER, msg.sender)) revert NotFeeController();
        _;
    }

    constructor(address _stToken, address _wstETH, address _gov, address _admin, address _feeController) {
        if (
            _stToken == address(0) ||
            _wstETH == address(0) ||
            _gov == address(0) ||
            _admin == address(0) ||
            _feeController == address(0)
        ) revert Errors.ZeroAddress();

        ST_TOKEN = IERC20(_stToken);
        WSTETH = IERC20(_wstETH);

        _grantRole(DEFAULT_ADMIN_ROLE, _gov);
        _grantRole(GOV, _gov);
        _grantRole(ADMIN, _admin);
        _grantRole(FEE_CONTROLLER, _feeController);
    }

    // ── Admin Functions ─────────────────────────────────────────────────────

    /// @notice Pause the contract - emergency stop
    function pause() external onlyRole(GOV) {
        _pause();
    }

    /// @notice Unpause the contract
    function unpause() external onlyRole(GOV) {
        _unpause();
    }

    /// @notice Create a new distribution with a merkle root
    /// @dev Only ADMIN can call. Increments distributionId and stores merkle root.
    function createDistribution(bytes32 _merkleRoot, uint256 _totalAmount) external onlyRole(ADMIN) whenNotPaused {
        if (_totalAmount == 0) revert InvalidAmount();
        // Check free (unallocated) balance to prevent overbooking across concurrent distributions.
        if (WSTETH.balanceOf(address(this)) - totalAllocatedUnclaimed < _totalAmount) revert InsufficientBalance();
        totalAllocatedUnclaimed += _totalAmount;

        distributionId++;
        distributions[distributionId] = Distribution({
            merkleRoot: _merkleRoot,
            totalAmount: _totalAmount,
            claimedAmount: 0,
            timestamp: block.timestamp,
            finalized: true,
            swept: false
        });

        emit DistributionCreated(distributionId, _merkleRoot, _totalAmount);
        emit MerkleRootUpdated(distributionId, _merkleRoot);
    }

    /// @notice Emergency: override merkle root on a finalized distribution before any claims.
    /// @dev Only GOV can call. Can only be called if no claims have been made yet (claimedAmount == 0).
    ///      This is the escape hatch when createDistribution() was called with an incorrect root.
    function emergencyOverrideMerkleRoot(uint256 _distributionId, bytes32 _newRoot) external onlyRole(GOV) {
        Distribution storage dist = distributions[_distributionId];
        if (!dist.finalized) revert DistributionNotFinalized();
        if (dist.claimedAmount > 0) revert DistributionAlreadyFinalized();

        dist.merkleRoot = _newRoot;

        emit MerkleRootUpdated(_distributionId, _newRoot);
    }

    /// @notice Withdraw unclaimed fees from old distributions
    /// @dev Only GOV can call. Allows recovery of unclaimed funds after MIN_CLAIM_PERIOD.
    function withdrawUnclaimedFees(uint256 _distributionId, address _recipient) external onlyRole(GOV) {
        Distribution storage dist = distributions[_distributionId];
        if (!dist.finalized) revert DistributionNotFinalized();

        // Enforce minimum claim period before allowing withdrawal
        if (block.timestamp < dist.timestamp + MIN_CLAIM_PERIOD) revert DistributionNotFinalized();

        uint256 unclaimed = dist.totalAmount - dist.claimedAmount;
        if (unclaimed == 0) revert NoUnclaimedFees();

        totalAllocatedUnclaimed -= unclaimed;
        dist.totalAmount = dist.totalAmount - unclaimed;
        dist.swept = true; // mark swept so claim() surfaces a clear error, not InsufficientBalance

        bool success = WSTETH.transfer(_recipient, unclaimed);
        if (!success) revert InsufficientBalance();

        emit UnclaimedFeesWithdrawn(unclaimed);
    }

    // ── Claim Functions ─────────────────────────────────────────────────────

    /// @notice Claim wstETH using merkle proof
    /// @dev Leaf must encode (distributionId, leafIndex, recipient, amount) to prevent double-claim
    function claim(
        uint256 _distributionId,
        uint256 _leafIndex,
        address _recipient,
        uint256 _amount,
        bytes32[] calldata _proof
    ) external onlyDistributionFinalized(_distributionId) whenNotPaused {
        if (claimed[_distributionId][_leafIndex]) revert AlreadyClaimed();
        if (_amount == 0) revert InvalidAmount();

        // Reject claims on swept distributions with a clear error (not InsufficientBalance).
        Distribution storage dist = distributions[_distributionId];
        if (dist.swept) revert DistributionSwept();

        // Verify merkle proof with OZ standard double-hash leaf encoding
        // Leaf format: keccak256(bytes.concat(keccak256(abi.encode(distributionId, leafIndex, recipient, amount))))
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(_distributionId, _leafIndex, _recipient, _amount))));
        if (!MerkleProof.verify(_proof, dist.merkleRoot, leaf)) {
            revert InvalidMerkleProof();
        }

        // Cap check — merkle leaf amounts must not exceed declared distribution total.
        if (dist.claimedAmount + _amount > dist.totalAmount) {
            revert ExceedsDistributionTotal(_amount, dist.totalAmount - dist.claimedAmount);
        }

        // Mark as claimed (all checks passed — state change before external transfer)
        claimed[_distributionId][_leafIndex] = true;
        dist.claimedAmount += _amount;
        totalWSTETHClaimed += _amount;
        totalAllocatedUnclaimed -= _amount;

        // Transfer wstETH
        bool success = WSTETH.transfer(_recipient, _amount);
        if (!success) revert InsufficientBalance();

        emit Claimed(_distributionId, _recipient, _amount);
    }

    // ── Query Functions ─────────────────────────────────────────────────────

    /// @notice Check if a leaf can be claimed
    function canClaim(
        uint256 _distributionId,
        uint256 _leafIndex,
        address _recipient,
        uint256 _amount,
        bytes32[] calldata _proof
    ) external view returns (bool) {
        if (claimed[_distributionId][_leafIndex]) return false;
        if (!distributions[_distributionId].finalized) return false;
        if (paused()) return false;

        // Use same double-hash leaf encoding as claim()
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(_distributionId, _leafIndex, _recipient, _amount))));
        return MerkleProof.verify(_proof, distributions[_distributionId].merkleRoot, leaf);
    }

    /// @notice Check if a specific leaf has been claimed
    function isClaimed(uint256 _distributionId, uint256 _leafIndex) external view returns (bool) {
        return claimed[_distributionId][_leafIndex];
    }

    /// @notice Get distribution details
    function getDistribution(
        uint256 _distributionId
    )
        external
        view
        returns (bytes32 root, uint256 totalAmount, uint256 claimedAmount, uint256 timestamp, bool finalized, bool swept)
    {
        Distribution storage dist = distributions[_distributionId];
        return (dist.merkleRoot, dist.totalAmount, dist.claimedAmount, dist.timestamp, dist.finalized, dist.swept);
    }

    /// @notice Get pool statistics
    function getStats()
        external
        view
        returns (
            uint256 currentBalance,
            uint256 _totalStETHSharesReceived,
            uint256 _totalWSTETHClaimed,
            uint256 _currentDistributionId,
            bool _paused
        )
    {
        return (
            WSTETH.balanceOf(address(this)),
            totalStETHSharesReceived,
            totalWSTETHClaimed,
            distributionId,
            paused()
        );
    }

    // ── Internal Functions ─────────────────────────────────────────────────

    function _getClaimedAmount(uint256 _distributionId) internal view returns (uint256) {
        return distributions[_distributionId].claimedAmount;
    }

    // ── Receive and Unwrap Functions ───────────────────────────────────────

    /// @notice Receive stETH from FeeController and unwrap to wstETH
    /// @dev Only FEE_CONTROLLER can call this function. Shares are minted directly to DebtPool by StakingCore/StakingRouter,
    ///      so no transferFrom is needed. The DebtPool already holds the shares when this function is called.
    function receiveStETHAndUnwrap(uint256 _amount) external onlyFeeController whenNotPaused {
        if (_amount == 0) revert InvalidAmount();

        // DebtPool already holds the minted shares - no transferFrom needed.
        // Convert shares to stETH token amount (ETH-denominated) for approve+wrap.
        // WSTETH.wrap(stAmount) expects the token balance amount, not raw shares.
        uint256 stEthAmount = IStETH(address(ST_TOKEN)).getPooledEthByShares(_amount);
        if (stEthAmount == 0) revert InvalidAmount();

        // Approve WSTETH to spend the ETH-denominated stETH amount
        bool success = ST_TOKEN.approve(address(WSTETH), stEthAmount);
        if (!success) revert UnwrapFailed();

        uint256 wstETHAmountBefore = WSTETH.balanceOf(address(this));

        (bool wrapSuccess, ) = address(WSTETH).call(abi.encodeWithSignature("wrap(uint256)", stEthAmount));

        // If wrap fails, shares remain in DebtPool — approve zero to clean up.
        // Counter is NOT incremented on failure to avoid permanent accounting inconsistency (M9 fix).
        if (!wrapSuccess) {
            ST_TOKEN.approve(address(WSTETH), 0);
            emit WrapFailed(_amount, stEthAmount);
            return;
        }

        uint256 wstETHAmountAfter = WSTETH.balanceOf(address(this));
        uint256 wstETHReceived = wstETHAmountAfter - wstETHAmountBefore;

        // wstETH is always worth more than stETH (rate > 1 and growing), so comparing
        // raw wstETH amounts to stETH amounts is wrong — wstETHReceived will always be
        // numerically less than stEthAmount. Just verify the wrap produced non-zero output.
        if (wstETHReceived == 0) revert InsufficientWstETHReceived();

        // Increment counter only after confirmed successful wrap (CEI fix).
        totalStETHSharesReceived += _amount;
        emit StETHReceived(_amount);
        emit WstETHUnwrapped(stEthAmount, wstETHReceived);
    }
}
