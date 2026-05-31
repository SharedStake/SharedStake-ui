// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {Test} from "forge-std/Test.sol";
import {MigrationHelper} from "contracts/v2/modular-staking/MigrationHelper.sol";

/**
 * @title  MigrationHelperFuzz
 * @notice Integration / fuzz tests for MigrationHelper.
 *
 * Scenarios covered:
 *   1. announceMigration reverts for non-GOV callers
 *   2. announceMigration reverts when a migration is already pending
 *   3. activateMigration reverts before the 14-day notice period elapses
 *   4. activateMigration succeeds after 14 days
 *   5. cancelMigration resets migrationActiveAt to 0
 *   6. announceMigration(_newRouter == OLD_ROUTER) reverts (same-address guard)
 *   7. activateMigration reverts when no migration is pending
 */
contract MigrationHelperFuzz is Test {
    // ─── mirror events (for expectEmit) ──────────────────────────────────────
    event MigrationAnnounced(address indexed newRouter, uint256 activeAt);
    event MigrationActivated();
    event MigrationCancelled();

    // ─── actors ──────────────────────────────────────────────────────────────

    address internal constant GOV     = address(0x600);
    address internal constant OLD_ROUTER = address(0x01D); // arbitrary non-zero
    address internal constant NEW_ROUTER = address(0xBEEF);
    address internal constant ATTACKER = address(0xBAD);

    // ─── system under test ────────────────────────────────────────────────────

    MigrationHelper internal helper;

    // ─── setup ───────────────────────────────────────────────────────────────

    function setUp() public {
        helper = new MigrationHelper(OLD_ROUTER, GOV);
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    /// Announce a migration as GOV and return the migrationActiveAt timestamp.
    function _announce(address newRouter) internal returns (uint256 activeAt) {
        vm.prank(GOV);
        helper.announceMigration(newRouter);
        activeAt = helper.migrationActiveAt();
    }

    /// Warp past the full notice period and activate as GOV.
    function _activateAfterPeriod() internal {
        vm.warp(helper.migrationActiveAt());
        vm.prank(GOV);
        helper.activateMigration();
    }

    // =========================================================================
    // 1. announceMigration reverts for non-GOV callers
    // =========================================================================

    function test_announceMigration_revertsIfNotGov() public {
        vm.prank(ATTACKER);
        vm.expectRevert(MigrationHelper.NotGov.selector);
        helper.announceMigration(NEW_ROUTER);
    }

    function testFuzz_announceMigration_revertsIfNotGov(address caller) public {
        vm.assume(caller != GOV);
        vm.prank(caller);
        vm.expectRevert(MigrationHelper.NotGov.selector);
        helper.announceMigration(NEW_ROUTER);
    }

    // =========================================================================
    // 2. announceMigration reverts when a migration is already pending
    // =========================================================================

    function test_announceMigration_revertsIfAlreadyPending() public {
        _announce(NEW_ROUTER);

        address anotherRouter = address(0xDEAD);
        vm.prank(GOV);
        vm.expectRevert(MigrationHelper.MigrationAlreadyPending.selector);
        helper.announceMigration(anotherRouter);
    }

    // =========================================================================
    // 3. activateMigration reverts before notice period elapses
    // =========================================================================

    function test_activateMigration_revertsBeforeNoticePeriod() public {
        uint256 activeAt = _announce(NEW_ROUTER);

        // Warp to one second before the notice period ends
        vm.warp(activeAt - 1);

        vm.prank(GOV);
        vm.expectRevert(
            abi.encodeWithSelector(
                MigrationHelper.MigrationNoticePeriodNotMet.selector,
                activeAt
            )
        );
        helper.activateMigration();
    }

    function testFuzz_activateMigration_revertsBeforeNoticePeriod(uint256 warpOffset) public {
        uint256 activeAt = _announce(NEW_ROUTER);
        // Any timestamp strictly before activeAt should revert
        uint256 ts = bound(warpOffset, 0, activeAt - 1);
        vm.warp(ts);

        vm.prank(GOV);
        vm.expectRevert(
            abi.encodeWithSelector(
                MigrationHelper.MigrationNoticePeriodNotMet.selector,
                activeAt
            )
        );
        helper.activateMigration();
    }

    // =========================================================================
    // 4. activateMigration succeeds after 14 days
    // =========================================================================

    function test_activateMigration_succeedsAtExactBoundary() public {
        uint256 activeAt = _announce(NEW_ROUTER);

        // Warp to exactly the ready timestamp
        vm.warp(activeAt);

        vm.prank(GOV);
        vm.expectEmit(false, false, false, false);
        emit MigrationActivated();
        helper.activateMigration();

        assertTrue(helper.migrationActive(), "migrationActive should be true");
        assertEq(helper.newRouter(), NEW_ROUTER, "newRouter mismatch");
    }

    function test_activateMigration_succeedsAfterNoticePeriod() public {
        _announce(NEW_ROUTER);

        vm.warp(block.timestamp + 14 days + 1);

        vm.prank(GOV);
        helper.activateMigration();

        assertTrue(helper.migrationActive());
    }

    function testFuzz_activateMigration_succeedsAfterNoticePeriod(uint256 extraTime) public {
        uint256 activeAt = _announce(NEW_ROUTER);
        // Warp to at least activeAt
        uint256 ts = bound(extraTime, activeAt, type(uint64).max);
        vm.warp(ts);

        vm.prank(GOV);
        helper.activateMigration();

        assertTrue(helper.migrationActive());
        assertFalse(helper.isMigrationPending());
    }

    // =========================================================================
    // 5. cancelMigration resets migrationActiveAt to 0
    // =========================================================================

    function test_cancelMigration_resetsMigrationActiveAt() public {
        _announce(NEW_ROUTER);
        assertNotEq(helper.migrationActiveAt(), 0, "should be set after announce");

        vm.prank(GOV);
        vm.expectEmit(false, false, false, false);
        emit MigrationCancelled();
        helper.cancelMigration();

        assertEq(helper.migrationActiveAt(), 0, "migrationActiveAt should be reset to 0");
        assertEq(helper.newRouter(), address(0), "newRouter should be reset to 0");
        assertFalse(helper.migrationActive(), "migrationActive should remain false");
        assertFalse(helper.isMigrationPending(), "isMigrationPending should be false");
    }

    function test_cancelMigration_revertsIfNoPendingMigration() public {
        vm.prank(GOV);
        vm.expectRevert(MigrationHelper.NoMigrationPending.selector);
        helper.cancelMigration();
    }

    function test_cancelMigration_revertsIfAlreadyActive() public {
        _announce(NEW_ROUTER);
        _activateAfterPeriod();

        vm.prank(GOV);
        vm.expectRevert(MigrationHelper.MigrationAlreadyActive.selector);
        helper.cancelMigration();
    }

    function test_cancelMigration_revertsIfNotGov() public {
        _announce(NEW_ROUTER);

        vm.prank(ATTACKER);
        vm.expectRevert(MigrationHelper.NotGov.selector);
        helper.cancelMigration();
    }

    // =========================================================================
    // 6. announceMigration(_newRouter == OLD_ROUTER) reverts
    // =========================================================================

    function test_announceMigration_revertsIfSameAsOldRouter() public {
        vm.prank(GOV);
        vm.expectRevert(bytes("MigrationHelper: same router"));
        helper.announceMigration(OLD_ROUTER);
    }

    function test_announceMigration_revertsIfZeroNewRouter() public {
        vm.prank(GOV);
        vm.expectRevert(bytes("MigrationHelper: zero newRouter"));
        helper.announceMigration(address(0));
    }

    // =========================================================================
    // 7. activateMigration reverts when no migration is pending
    // =========================================================================

    function test_activateMigration_revertsIfNoPendingMigration() public {
        vm.prank(GOV);
        vm.expectRevert(MigrationHelper.NoMigrationPending.selector);
        helper.activateMigration();
    }

    function test_activateMigration_revertsIfAlreadyActive() public {
        _announce(NEW_ROUTER);
        _activateAfterPeriod();

        // Second call should revert with MigrationAlreadyActive
        vm.prank(GOV);
        vm.expectRevert(MigrationHelper.MigrationAlreadyActive.selector);
        helper.activateMigration();
    }

    // =========================================================================
    // Additional: full happy-path state machine
    // =========================================================================

    function test_fullHappyPath_stateTransitions() public {
        // Initial state
        assertEq(helper.migrationActiveAt(), 0);
        assertFalse(helper.migrationActive());
        assertFalse(helper.isMigrationPending());
        assertEq(helper.migrationReadyAt(), 0);

        // Announce
        uint256 announceTime = block.timestamp;
        uint256 activeAt = _announce(NEW_ROUTER);
        assertEq(activeAt, announceTime + 14 days);
        assertTrue(helper.isMigrationPending());
        assertEq(helper.migrationReadyAt(), activeAt);
        assertEq(helper.newRouter(), NEW_ROUTER);

        // Activate
        vm.warp(activeAt);
        vm.prank(GOV);
        helper.activateMigration();

        assertTrue(helper.migrationActive());
        assertFalse(helper.isMigrationPending());
        assertEq(helper.newRouter(), NEW_ROUTER);
    }

    function test_cancelAndReannounce() public {
        _announce(NEW_ROUTER);

        // Cancel
        vm.prank(GOV);
        helper.cancelMigration();

        assertEq(helper.migrationActiveAt(), 0);
        assertFalse(helper.isMigrationPending());

        // Re-announce with a different router
        address yetAnotherRouter = address(0xC0FFEE);
        uint256 activeAt = _announce(yetAnotherRouter);

        assertTrue(helper.isMigrationPending());
        assertEq(helper.newRouter(), yetAnotherRouter);

        // Activate
        vm.warp(activeAt);
        vm.prank(GOV);
        helper.activateMigration();

        assertTrue(helper.migrationActive());
        assertEq(helper.newRouter(), yetAnotherRouter);
    }

    // =========================================================================
    // Immutable invariants
    // =========================================================================

    function test_immutables() public view {
        assertEq(helper.OLD_ROUTER(), OLD_ROUTER);
        assertEq(helper.GOV(), GOV);
        assertEq(helper.MIGRATION_NOTICE_PERIOD(), 14 days);
    }

    function test_constructor_revertsOnZeroRouter() public {
        vm.expectRevert(bytes("MigrationHelper: zero router"));
        new MigrationHelper(address(0), GOV);
    }

    function test_constructor_revertsOnZeroGov() public {
        vm.expectRevert(bytes("MigrationHelper: zero gov"));
        new MigrationHelper(OLD_ROUTER, address(0));
    }
}
