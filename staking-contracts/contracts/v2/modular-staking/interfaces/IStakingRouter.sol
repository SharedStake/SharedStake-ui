// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

/// @title IStakingRouter - module-facing surface of the Router
/// @notice Modules call back into the Router for two purposes:
///           1. Reporting beacon balance changes (validator modules).
///           2. Notifying that buffered ETH was just sent to the beacon deposit
///              contract — used by the Router to update its `moduleBeaconBalance`
///              baseline so subsequent oracle reports represent only rewards/losses.
///         For LST modules, `wrapFromModule` and `unwrapToModule` mint/burn shares
///         on entry/exit since LST flows do not use the standard `submit()` path.
interface IStakingRouter {
    struct ModuleInfo {
        address addr;
        bytes32 moduleType;
        uint256 mintCapEth;
        bool active;
        bool paused;
    }

    /// @notice Called by a validator module after the oracle's sanity-checked report.
    ///         Router computes the delta vs. its stored baseline and rebases stToken.
    function reportModuleBeaconBalance(bytes32 moduleId, uint256 newBeaconBalance) external;

    /// @notice Called by a validator module immediately after pushing ETH to the beacon
    ///         deposit contract. Updates the Router's beacon-balance baseline so the
    ///         next oracle report does not double-count the principal.
    function notifyBeaconDeposit(bytes32 moduleId, uint256 amount) external;

    /// @notice Called by an LST module to mint stToken shares on LST deposit.
    function wrapFromModule(bytes32 moduleId, address recipient, uint256 ethEquiv) external;

    /// @notice Called by an LST module to burn stToken shares on LST withdrawal.
    function unwrapToModule(bytes32 moduleId, address caller, uint256 stTokenAmount)
        external
        returns (uint256 ethValue);

    /// @notice Module registry getter.
    function modules(bytes32 moduleId)
        external
        view
        returns (address addr, bytes32 moduleType, uint256 mintCapEth, bool active, bool paused);
}
