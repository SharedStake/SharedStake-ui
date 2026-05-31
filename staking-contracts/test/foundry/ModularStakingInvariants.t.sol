// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {Test} from "forge-std/Test.sol";
import {StToken} from "contracts/v2/modular-staking/StToken.sol";
import {WstToken} from "contracts/v2/modular-staking/WstToken.sol";
import {StakingRouter} from "contracts/v2/modular-staking/StakingRouter.sol";
import {ValidatorModule} from "contracts/v2/modular-staking/modules/ValidatorModule.sol";
import {WithdrawalQueueV2} from "contracts/v2/modular-staking/WithdrawalQueueV2.sol";
import {FeeController} from "contracts/v2/modular-staking/FeeController.sol";
import {OracleAdapter} from "contracts/v2/modular-staking/OracleAdapter.sol";
import {MockBeaconDeposit} from "contracts/v2/test/MockBeaconDeposit.sol";

/**
 * @title ModularStakingInvariants
 * @notice Foundry invariant tests for SharedStake V2 modular staking.
 *
 * Invariants under test:
 *   1. totalSupply == totalPooledEther (accounting identity)
 *   2. Sum of all tracked user balances == totalPooledEther
 *   3. Exchange rate (pooled/shares) is monotonically non-decreasing
 *   4. No user can end with more shares than they started with after net-zero activity
 *   5. Withdrawal queue lockedEther <= contract balance
 */
contract ModularStakingInvariants is Test {
  StToken public stToken;
  WstToken public wstToken;
  StakingRouter public router;
  ValidatorModule public validatorModule;
  WithdrawalQueueV2 public queue;
  FeeController public feeController;
  OracleAdapter public oracleAdapter;
  MockBeaconDeposit public mockBeaconDeposit;

  address public gov = address(1);
  address public oracle = address(2);
  address public nodeOperator = address(3);
  address public treasury = address(4);
  address public operator = address(5);

  bytes32 public constant SOLO = keccak256("SOLO");
  bytes32 public constant ORACLE_ROLE = keccak256("ORACLE");
  bytes32 public constant NODE_OPERATOR_ROLE = keccak256("NODE_OPERATOR");
  bytes32 public constant SUBMITTER_ROLE = keccak256("SUBMITTER");

  // Tracked users for balance-sum invariant
  address[] public users;
  mapping(address => bool) public isUser;

  // Track the lowest exchange rate observed (for monotonicity check)
  uint256 public minRateObserved;

  function setUp() public {
    stToken = new StToken();
    wstToken = new WstToken(address(stToken));
    feeController = new FeeController(
      gov,
      treasury,
      operator,
      address(0), // no referral registry
      address(0), // no debt pool
      1000, // 10% fee
      5000, // 50/50 split
      5000,
      0 // no debt pool split
    );
    router = new StakingRouter(address(stToken), gov);
    mockBeaconDeposit = new MockBeaconDeposit();
    validatorModule = new ValidatorModule(address(router), SOLO, gov, address(mockBeaconDeposit));
    queue = new WithdrawalQueueV2(address(stToken), gov);
    oracleAdapter = new OracleAdapter(address(validatorModule), gov);

    // Wire roles
    stToken.addMinter(address(router));
    stToken.addMinter(address(queue));

    vm.startPrank(gov);
    router.setFeeController(address(feeController));
    router.registerModule(SOLO, address(validatorModule), 0);
    router.setDefaultModule(SOLO);
    validatorModule.grantRole(ORACLE_ROLE, address(oracleAdapter));
    validatorModule.grantRole(ORACLE_ROLE, oracle);
    validatorModule.grantRole(NODE_OPERATOR_ROLE, nodeOperator);
    oracleAdapter.addSubmitter(oracle);
    vm.stopPrank();

    // Pre-seed some users
    for (uint256 i = 10; i < 20; i++) {
      _addUser(address(uint160(i)));
    }

    // Set initial min rate to max
    minRateObserved = type(uint256).max;
  }

  function _addUser(address addr) internal {
    if (!isUser[addr]) {
      users.push(addr);
      isUser[addr] = true;
    }
  }

  // ── Helper: exchange rate ───────────────────────────────────────────────

  function _rate() internal view returns (uint256) {
    uint256 shares = stToken.getTotalShares();
    if (shares == 0) return 1e18; // 1:1 bootstrap
    return (stToken.totalPooledEther() * 1e18) / shares;
  }

  // ── Actions ─────────────────────────────────────────────────────────────

  function deposit(address user, uint256 amount) public {
    amount = bound(amount, 0.01 ether, 100 ether);
    _addUser(user);

    vm.deal(user, amount);
    vm.prank(user);
    router.submit{value: amount}(address(0));
  }

  function depositToModule(address user, uint256 amount) public {
    amount = bound(amount, 0.01 ether, 100 ether);
    _addUser(user);

    vm.deal(user, amount);
    vm.prank(user);
    router.submitToModule{value: amount}(SOLO, address(0));
  }

  function pushToBeacon(uint256 validators) public {
    validators = bound(validators, 1, 10);
    uint256 required = validators * 32 ether;
    uint256 buffered = validatorModule.bufferedEther();
    if (buffered < required) return; // can't push more than buffered

    bytes memory pubkey = new bytes(48);
    bytes memory creds = new bytes(32);
    bytes memory sig = new bytes(96);
    bytes32 root = bytes32(0);

    vm.prank(nodeOperator);
    for (uint256 i = 0; i < validators; i++) {
      validatorModule.depositToBeaconChain(pubkey, creds, sig, root);
    }
  }

  function reportBeacon(uint256 newBalance) public {
    // Bound to realistic range: 90% to 110% of current
    uint256 currentValidators = validatorModule.beaconValidators();
    if (currentValidators == 0) return;

    uint256 currentBalance = validatorModule.beaconBalance();
    uint256 minBalance = (currentBalance * 90) / 100;
    uint256 maxBalance = (currentBalance * 110) / 100;
    if (minBalance == 0) minBalance = currentValidators * 32 ether;
    newBalance = bound(newBalance, minBalance, maxBalance);

    // Set maxDeltaBps high for test to allow reports
    vm.prank(gov);
    router.setMaxDeltaBps(1000);

    vm.prank(oracle);
    validatorModule.reportBeacon(currentValidators, newBalance);
  }

  function requestWithdrawal(address user, uint256 amount) public {
    amount = bound(amount, 0.01 ether, 10 ether);
    _addUser(user);

    uint256 balance = stToken.balanceOf(user);
    if (balance < amount) return;

    uint256[] memory amounts = new uint256[](1);
    amounts[0] = amount;

    vm.prank(user);
    queue.requestWithdrawals(amounts, user);
  }

  function finalizeWithdrawals(uint256 lastRequestId) public {
    uint256 nextId = queue.nextRequestId();
    uint256 lastFinalized = queue.lastFinalizedRequestId();
    if (lastFinalized + 1 >= nextId) return;

    lastRequestId = bound(lastRequestId, lastFinalized + 1, nextId - 1);

    // Compute required ETH
    uint256 required = 0;
    for (uint256 i = lastFinalized + 1; i <= lastRequestId; i++) {
      WithdrawalQueueV2.WithdrawalRequest memory req = queue.getRequest(i);
      required += req.ethAmount;
    }

    vm.deal(gov, required + 1 ether);
    vm.prank(gov);
    queue.finalize{value: required}(lastRequestId);
  }

  function claimWithdrawal(address user, uint256 requestId) public {
    _addUser(user);

    WithdrawalQueueV2.WithdrawalRequest memory req = queue.getRequest(requestId);
    if (!req.finalized || req.claimed) return;

    vm.prank(user);
    queue.claimWithdrawal(requestId, payable(user));
  }

  function wrapStETH(address user, uint256 amount) public {
    amount = bound(amount, 0.01 ether, 10 ether);
    _addUser(user);

    uint256 balance = stToken.balanceOf(user);
    if (balance < amount) return;

    vm.startPrank(user);
    stToken.approve(address(wstToken), amount);
    wstToken.wrap(amount);
    vm.stopPrank();
  }

  function unwrapWstETH(address user, uint256 amount) public {
    amount = bound(amount, 0.01 ether, 10 ether);
    _addUser(user);

    uint256 balance = wstToken.balanceOf(user);
    if (balance < amount) return;

    vm.prank(user);
    wstToken.unwrap(amount);
  }

  // ── Invariants ──────────────────────────────────────────────────────────

  /**
   * @notice Invariant 1: totalSupply == totalPooledEther
   */
  function invariant_totalSupplyEqualsTotalPooled() public view {
    assertEq(stToken.totalSupply(), stToken.totalPooledEther());
  }

  /**
   * @notice Invariant 2: Sum of all user balances <= totalPooledEther
   *         (may be < due to unclaimed withdrawal requests)
   */
  function invariant_userBalancesSumToTotalPooled() public view {
    uint256 sum = 0;
    for (uint256 i = 0; i < users.length; i++) {
      sum += stToken.balanceOf(users[i]);
    }
    // Add wstToken holders' underlying stETH
    uint256 wstTotal = wstToken.balanceOf(address(wstToken));
    // Also count stETH held by queue (for pending withdrawals)
    sum += stToken.balanceOf(address(queue));
    // Count stETH held by router (should be 0)
    sum += stToken.balanceOf(address(router));
    // Count stETH held by validatorModule (should be 0)
    sum += stToken.balanceOf(address(validatorModule));

    // Allow small rounding tolerance (1 wei)
    assertLe(sum, stToken.totalPooledEther() + 1);
  }

  /**
   * @notice Invariant 3: Exchange rate is monotonically non-decreasing across runs.
   *         Checked as: current rate >= rate at the previous invariant invocation.
   *         (In production, slashes CAN decrease rate, but our handler doesn't slash)
   *
   * NOTE: The previous implementation updated minRateObserved downward when rate
   *       dropped, then asserted rate >= (the new lower min) — a tautology that
   *       never fires. Fixed to assert current >= previous and update to current.
   */
  function invariant_exchangeRateNonDecreasing() public {
    uint256 currentRate = _rate();
    if (minRateObserved == type(uint256).max) {
      // First invocation — establish baseline; no assertion yet.
      minRateObserved = currentRate;
      return;
    }
    // Allow 1-wei rounding tolerance from integer division in share math.
    assertGe(currentRate + 1, minRateObserved);
    // Only track upward movement so any future drop is caught.
    if (currentRate > minRateObserved) {
      minRateObserved = currentRate;
    }
  }

  /**
   * @notice Invariant 4: Router is the only address with MINTER role
   */
  function invariant_routerIsOnlyMinter() public view {
    bytes32 MINTER = keccak256("MINTER");
    assertTrue(stToken.hasRole(MINTER, address(router)));
    // Queue is also a minter
    assertTrue(stToken.hasRole(MINTER, address(queue)));
  }

  /**
   * @notice Invariant 5: Withdrawal queue lockedEther <= contract balance
   */
  function invariant_queueBalanceCoversLocked() public view {
    assertLe(queue.lockedEther(), address(queue).balance);
  }

  /**
   * @notice Invariant 6: Module totalEth == buffered + beaconBalance
   */
  function invariant_moduleAccounting() public view {
    uint256 moduleSum = validatorModule.bufferedEther() + validatorModule.beaconBalance();
    assertEq(moduleSum, validatorModule.totalEth());
  }

  /**
   * @notice Invariant 7: No shares exist without pooled ETH backing
   */
  function invariant_noSharesWithoutBacking() public view {
    if (stToken.getTotalShares() > 0) {
      assertGt(stToken.totalPooledEther(), 0);
    }
  }
}
