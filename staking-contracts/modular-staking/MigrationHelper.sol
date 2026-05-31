// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

/// @title  MigrationHelper
/// @notice Coordination contract for StakingRouter migration.
///         The protocol is intentionally non-upgradeable (no proxy).
///         This contract is a signal + timelock primitive only — it holds
///         no funds and moves no funds.  Actual user exits happen via the
///         WithdrawalQueueV2 on the old router.
///
/// Migration flow (happy path):
///   1. GOV calls announceMigration(_newRouter)     — starts 14-day notice clock
///   2. Users withdraw via withdrawal queue          — voluntary exit window
///   3. GOV calls activateMigration()               — after notice period elapses
///   4. Front-ends switch to newRouter address       — reads migrationActive flag
///
/// Emergency flow:
///   GUARDIAN pauses deposits on the old router immediately.
///   Governance votes to call activateMigration() early (off-chain consensus;
///   this contract does not enforce an early path — use cancelMigration + fresh
///   announceMigration with a shorter notice if needed).
contract MigrationHelper {
    // ─── immutables ──────────────────────────────────────────────────────────

    /// @notice The StakingRouter this migration replaces.
    address public immutable OLD_ROUTER;

    /// @notice Governance address authorised to drive the migration.
    address public immutable GOV;

    // ─── state ───────────────────────────────────────────────────────────────

    /// @notice 14-day minimum notice period before migration can be activated.
    uint256 public constant MIGRATION_NOTICE_PERIOD = 14 days;

    /// @notice Address of the replacement router, set on announcement.
    address public newRouter;

    /// @notice Earliest timestamp at which activateMigration() may be called.
    ///         Zero when no migration is pending.
    uint256 public migrationActiveAt;

    /// @notice True once activateMigration() has been successfully called.
    bool public migrationActive;

    // ─── events ──────────────────────────────────────────────────────────────

    /// @param newRouter  Address of the replacement StakingRouter.
    /// @param activeAt   Earliest timestamp the migration can be activated.
    event MigrationAnnounced(address indexed newRouter, uint256 activeAt);

    event MigrationActivated();

    event MigrationCancelled();

    // ─── errors ──────────────────────────────────────────────────────────────

    error NotGov();
    error NoMigrationPending();
    error MigrationAlreadyPending();
    error MigrationNoticePeriodNotMet(uint256 readyAt);
    error MigrationAlreadyActive();

    // ─── modifier ────────────────────────────────────────────────────────────

    modifier onlyGov() {
        if (msg.sender != GOV) revert NotGov();
        _;
    }

    // ─── constructor ─────────────────────────────────────────────────────────

    /// @param router  The existing StakingRouter being replaced.
    /// @param gov     Governance address (multisig / DAO executor).
    constructor(address router, address gov) {
        require(router != address(0), "MigrationHelper: zero router");
        require(gov != address(0), "MigrationHelper: zero gov");
        OLD_ROUTER = router;
        GOV = gov;
    }

    // ─── governance actions ──────────────────────────────────────────────────

    /// @notice Announce a pending migration to a new router.
    ///         Starts the 14-day notice clock. Call cancelMigration() first
    ///         if a previous announcement needs to be replaced.
    /// @param _newRouter  Address of the replacement StakingRouter.
    function announceMigration(address _newRouter) external onlyGov {
        if (migrationActive) revert MigrationAlreadyActive();
        if (migrationActiveAt != 0) revert MigrationAlreadyPending();
        require(_newRouter != address(0), "MigrationHelper: zero newRouter");
        require(_newRouter != OLD_ROUTER, "MigrationHelper: same router");

        newRouter = _newRouter;
        migrationActiveAt = block.timestamp + MIGRATION_NOTICE_PERIOD;

        emit MigrationAnnounced(_newRouter, migrationActiveAt);
    }

    /// @notice Activate the migration once the notice period has elapsed.
    ///         Sets migrationActive = true so front-ends and integrators can
    ///         detect the switch and redirect to newRouter.
    function activateMigration() external onlyGov {
        if (migrationActiveAt == 0) revert NoMigrationPending();
        if (migrationActive) revert MigrationAlreadyActive();
        if (block.timestamp < migrationActiveAt) {
            revert MigrationNoticePeriodNotMet(migrationActiveAt);
        }

        migrationActive = true;
        emit MigrationActivated();
    }

    /// @notice Cancel a pending migration and reset all state.
    ///         Cannot be called after activateMigration() — activated migrations
    ///         are terminal to prevent post-activation state regression.
    function cancelMigration() external onlyGov {
        if (migrationActive) revert MigrationAlreadyActive();
        if (migrationActiveAt == 0) revert NoMigrationPending();

        newRouter = address(0);
        migrationActiveAt = 0;
        migrationActive = false;

        emit MigrationCancelled();
    }

    // ─── views ───────────────────────────────────────────────────────────────

    /// @return True if announceMigration has been called but activateMigration
    ///         has not yet been called (notice period running or elapsed).
    function isMigrationPending() external view returns (bool) {
        return migrationActiveAt != 0 && !migrationActive;
    }

    /// @return Earliest timestamp at which activateMigration() can be called.
    ///         Returns 0 if no migration has been announced.
    function migrationReadyAt() external view returns (uint256) {
        return migrationActiveAt;
    }
}
