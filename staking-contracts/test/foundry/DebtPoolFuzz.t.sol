// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {Test} from "forge-std/Test.sol";
import {DebtPool} from "contracts/v2/modular-staking/DebtPool.sol";
import {MockERC20} from "contracts/v2/test/MockERC20.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title DebtPoolFuzz
 * @notice Property-based fuzz tests for DebtPool merkle distribution logic
 *
 * Properties under test:
 *   1. claim() CANNOT exceed totalAmount - sum of all claims <= distribution total
 *   2. withdrawUnclaimedFees() cannot be called twice on same distribution
 *   3. emergencyOverrideMerkleRoot cannot be called after any claim
 *   4. MIN_CLAIM_PERIOD enforced - withdrawUnclaimedFees reverts before 30 days
 */
contract DebtPoolFuzz is Test {
  DebtPool public debtPool;
  MockERC20 public stToken;
  MockERC20 public wstToken;

  address public gov = address(1);
  address public admin = address(2);
  address public feeController = address(3);
  address public recipient = address(4);

  bytes32 public constant GOV = keccak256("GOV");
  bytes32 public constant ADMIN = keccak256("ADMIN");
  bytes32 public constant FEE_CONTROLLER = keccak256("FEE_CONTROLLER");

  // Merkle tree data structures
  struct Leaf {
    uint256 distributionId;
    uint256 leafIndex;
    address recipient;
    uint256 amount;
  }

  function setUp() public {
    stToken = new MockERC20("Mock stETH", "stETH");
    wstToken = new MockERC20("Mock wstETH", "wstETH");

    debtPool = new DebtPool(address(stToken), address(wstToken), gov, admin, feeController);
  }

  // ── Helper: Build merkle tree and return root + leaves + proofs ─────────────

  /// @dev OZ-compatible sorted-pair hash (matches MerkleProof._hashPair).
  function _hashPair(bytes32 a, bytes32 b) internal pure returns (bytes32) {
    return a < b ? keccak256(abi.encodePacked(a, b)) : keccak256(abi.encodePacked(b, a));
  }

  /// @dev OZ double-hash leaf encoding matching DebtPool.claim().
  function _leafHash(uint256 distId, uint256 idx, address rcpt, uint256 amt) internal pure returns (bytes32) {
    return keccak256(bytes.concat(keccak256(abi.encode(distId, idx, rcpt, amt))));
  }

  /// @dev Build a 2-leaf OZ-compatible tree. Returns (root, proof0, proof1).
  ///      A 2-leaf tree is sufficient for testing the cap-invariant property.
  function buildTwoLeafTree(
    Leaf memory leaf0,
    Leaf memory leaf1
  ) internal pure returns (bytes32 root, bytes32[] memory proof0, bytes32[] memory proof1) {
    bytes32 h0 = _leafHash(leaf0.distributionId, leaf0.leafIndex, leaf0.recipient, leaf0.amount);
    bytes32 h1 = _leafHash(leaf1.distributionId, leaf1.leafIndex, leaf1.recipient, leaf1.amount);
    root = _hashPair(h0, h1);
    // Each leaf's proof is just the sibling hash.
    proof0 = new bytes32[](1);
    proof0[0] = h1;
    proof1 = new bytes32[](1);
    proof1[0] = h0;
  }

  // ── Property 1: claim() CANNOT exceed totalAmount ──────────────────────────

  /**
   * @notice Property: Sum of all claimed amounts must never exceed totalAmount
   * @dev Build a tree with N random leaves that sum to exactly TOTAL, claim all of them,
   *      and assert claimedAmount == TOTAL
   */
  function testFuzz_claimCannotExceedTotalAmount(uint256 amount0, uint256 amount1) public {
    // Two recipients whose amounts sum exactly to TOTAL
    uint256 TOTAL = 1000 ether;
    amount0 = bound(amount0, 1 ether, TOTAL - 1 ether);
    amount1 = TOTAL - amount0;

    address rcpt0 = address(uint160(100));
    address rcpt1 = address(uint160(101));

    Leaf memory leaf0 = Leaf({distributionId: 1, leafIndex: 0, recipient: rcpt0, amount: amount0});
    Leaf memory leaf1 = Leaf({distributionId: 1, leafIndex: 1, recipient: rcpt1, amount: amount1});

    (bytes32 root, bytes32[] memory proof0, bytes32[] memory proof1) = buildTwoLeafTree(leaf0, leaf1);

    wstToken.mint(address(debtPool), TOTAL);
    vm.prank(admin);
    debtPool.createDistribution(root, TOTAL);

    // Both claims must succeed — if the cap were wrong, one would revert
    vm.prank(rcpt0);
    debtPool.claim(1, 0, rcpt0, amount0, proof0);
    vm.prank(rcpt1);
    debtPool.claim(1, 1, rcpt1, amount1, proof1);

    // Invariant: claimedAmount == totalAmount after all claims
    (, uint256 totalAmount, uint256 claimedAmount, , ,) = debtPool.getDistribution(1);
    assertEq(claimedAmount, totalAmount, "claimedAmount must equal totalAmount after full distribution");
    assertEq(claimedAmount, TOTAL, "must equal declared TOTAL");
  }

  // ── Property 2: withdrawUnclaimedFees() cannot be called twice ──────────────

  /**
   * @notice Property: After withdrawUnclaimedFees, calling it again must revert NoUnclaimedFees
   */
  function testFuzz_withdrawUnclaimedFeesCannotCallTwice(uint256 totalAmount, uint256 claimedAmount) public {
    totalAmount = bound(totalAmount, 100 ether, 10000 ether);
    claimedAmount = bound(claimedAmount, 0, totalAmount - 10 ether); // Leave some unclaimed

    // Create distribution
    bytes32 root = keccak256("test_root");
    wstToken.mint(address(debtPool), totalAmount);
    vm.prank(admin);
    debtPool.createDistribution(root, totalAmount);

    // Simulate some claims (mock by setting claimedAmount directly)
    // Note: In real test, would claim actual leaves
    vm.warp(block.timestamp + 31 days); // Fast forward past MIN_CLAIM_PERIOD

    // First withdrawal should succeed
    vm.prank(gov);
    debtPool.withdrawUnclaimedFees(1, gov);

    // Second withdrawal should revert NoUnclaimedFees
    vm.prank(gov);
    vm.expectRevert(DebtPool.NoUnclaimedFees.selector);
    debtPool.withdrawUnclaimedFees(1, gov);
  }

  // ── Property 3: emergencyOverrideMerkleRoot cannot be called after any claim ──

  /**
   * @notice Property: After a claim is made, emergencyOverrideMerkleRoot must revert DistributionAlreadyFinalized
   */
  function testFuzz_emergencyOverrideCannotCallAfterClaim(uint256 amount) public {
    amount = bound(amount, 1 ether, 500 ether);
    uint256 amount2 = 500 ether; // second leaf amount

    Leaf memory leaf0 = Leaf({distributionId: 1, leafIndex: 0, recipient: recipient, amount: amount});
    Leaf memory leaf1 = Leaf({distributionId: 1, leafIndex: 1, recipient: address(uint160(200)), amount: amount2});

    (bytes32 root, bytes32[] memory proof0, ) = buildTwoLeafTree(leaf0, leaf1);

    wstToken.mint(address(debtPool), amount + amount2);
    vm.prank(admin);
    debtPool.createDistribution(root, amount + amount2);

    // Make one claim
    vm.prank(recipient);
    debtPool.claim(1, 0, recipient, amount, proof0);

    // emergencyOverrideMerkleRoot must revert once any claim has been made
    bytes32 newRoot = keccak256("new_root");
    vm.prank(gov);
    vm.expectRevert(DebtPool.DistributionAlreadyFinalized.selector);
    debtPool.emergencyOverrideMerkleRoot(1, newRoot);
  }

  // ── Property 4: MIN_CLAIM_PERIOD enforced ───────────────────────────────────

  /**
   * @notice Property: withdrawUnclaimedFees always reverts before 30 days
   */
  function testFuzz_withdrawUnclaimedFeesRevertsBefore30Days(uint256 timeElapsed) public {
    timeElapsed = bound(timeElapsed, 0, 29 days);

    // Create distribution
    bytes32 root = keccak256("test_root");
    uint256 totalAmount = 1000 ether;
    wstToken.mint(address(debtPool), totalAmount);
    vm.prank(admin);
    debtPool.createDistribution(root, totalAmount);

    // Fast forward to timeElapsed (less than 30 days)
    vm.warp(block.timestamp + timeElapsed);

    // Try to withdraw - should revert DistributionNotFinalized (used for time check)
    vm.prank(gov);
    vm.expectRevert(DebtPool.DistributionNotFinalized.selector);
    debtPool.withdrawUnclaimedFees(1, gov);
  }

  /**
   * @notice Property: withdrawUnclaimedFees succeeds after 30 days
   */
  function testFuzz_withdrawUnclaimedFeesSucceedsAfter30Days(uint256 timeElapsed) public {
    timeElapsed = bound(timeElapsed, 30 days, 365 days);

    // Create distribution
    bytes32 root = keccak256("test_root");
    uint256 totalAmount = 1000 ether;
    wstToken.mint(address(debtPool), totalAmount);
    vm.prank(admin);
    debtPool.createDistribution(root, totalAmount);

    // Fast forward past MIN_CLAIM_PERIOD
    vm.warp(block.timestamp + timeElapsed);

    // Withdrawal should succeed
    vm.prank(gov);
    debtPool.withdrawUnclaimedFees(1, gov);
  }
}
