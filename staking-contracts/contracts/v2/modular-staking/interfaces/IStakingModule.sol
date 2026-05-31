// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {IStakingRouter} from "./IStakingRouter.sol";

/// @title IStakingModule - common interface implemented by every Router-managed module
/// @notice The Router only knows about modules through this interface. Each module is
///         responsible for its own ETH custody, validator orchestration (if any), and
///         oracle integration. The Router enforces global mint caps and routes deposits.
///
///         `receiveDeposit()` is invoked by the Router when a user submits ETH; the
///         module must accept the value and update its internal accounting.
///
///         `totalEth()` returns the module's contribution to `totalPooledEther`. For a
///         validator module that's `bufferedEther + beaconBalance`; for an LST wrap
///         module it's `priceOracle.getEthValue(lstHeld)`.
///
///         `moduleType()` is a tag used by tooling (kept opaque from the Router).
interface IStakingModule {
    /// @notice Immutable module id expected by router callbacks.
    function MODULE_ID() external view returns (bytes32);

    /// @notice Router this module is wired to.
    /// @dev Registration-time compatibility checks rely on this getter.
    function ROUTER() external view returns (IStakingRouter);

    /// @notice Called by the Router when a user deposits ETH. Module credits its buffer.
    function receiveDeposit() external payable;

    /// @notice Total ETH attributable to this module — buffered + beacon (or LST-equivalent).
    function totalEth() external view returns (uint256);

    /// @notice Static identifier (e.g. keccak256("SOLO_VALIDATOR")).
    function moduleType() external pure returns (bytes32);
}
