// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {ValidatorModule} from "./ValidatorModule.sol";

/// @title DVTModule - Distributed Validator Technology variant of ValidatorModule
/// @notice Extends ValidatorModule with an on-chain DVT cluster registry.
///         `depositToBeaconChainInCluster` gates 32-ETH beacon deposits behind a
///         registered, active cluster so governance can track which operator ensembles
///         (Obol, SSV, Diva, …) are permitted to key validators.
///
///         `depositToBeaconChain` (base) is overridden to revert — all deposits
///         must go through `depositToBeaconChainInCluster` for cluster attribution.
contract DVTModule is ValidatorModule {
    // ── Structs ───────────────────────────────────────────────────────────────
    struct Cluster {
        address[] operators;
        uint8 threshold;
        bool active;
    }

    // ── State ─────────────────────────────────────────────────────────────────
    mapping(bytes32 => Cluster) public clusters;
    mapping(bytes32 => uint256) public clusterDepositCount;
    mapping(bytes32 => mapping(address => bool)) internal _clusterOperatorSet;
    bytes32[] internal _clusterIds;
    mapping(bytes32 => uint256) internal _clusterIdToIndex; // 1-based; 0 = not registered

    // ── Events ────────────────────────────────────────────────────────────────
    event ClusterRegistered(bytes32 indexed clusterId, address[] operators, uint8 threshold);
    event ClusterDeactivated(bytes32 indexed clusterId);
    event ClusterReactivated(bytes32 indexed clusterId);
    event ClusterDeposit(bytes32 indexed clusterId, uint256 depositIndex, bytes pubkey);

    // ── Errors ────────────────────────────────────────────────────────────────
    error ClusterAlreadyRegistered(bytes32 clusterId);
    error ClusterNotFound(bytes32 clusterId);
    error ClusterNotActive(bytes32 clusterId);
    error InvalidThreshold(uint8 threshold, uint256 operatorCount);
    error UnsupportedThreshold(uint8 threshold);
    error EmptyOperators();
    error InvalidOperator(address operator);
    error DuplicateOperator(address operator);
    error OperatorNotInCluster(bytes32 clusterId, address operator);
    error UseClusteredDeposit();
    error IndexOutOfBounds(uint256 index, uint256 length);

    constructor(address router, bytes32 moduleId, address gov, address beaconDepositContract)
        ValidatorModule(router, moduleId, gov, beaconDepositContract)
    {}

    // ── IStakingModule overrides ─────────────────────────────────────────────

    function moduleType() external pure override returns (bytes32) {
        return keccak256("DVT_VALIDATOR");
    }

    /// @notice Blocked: DVTModule requires cluster-attributed deposits.
    ///         Call `depositToBeaconChainInCluster` instead.
    function depositToBeaconChain(
        bytes calldata,
        bytes calldata,
        bytes calldata,
        bytes32
    ) external override onlyRole(NODE_OPERATOR) nonReentrant whenNotPaused(PAUSE_RECEIVE) {
        revert UseClusteredDeposit();
    }

    // ── Cluster registry (GOV only) ──────────────────────────────────────────

    /// @notice Register a new DVT cluster. `threshold` must be ≥ 1 and ≤ operators.length.
    /// @dev Current implementation supports single-operator execution only.
    ///      Multi-operator threshold approvals must be implemented before allowing threshold > 1.
    function registerCluster(bytes32 clusterId, address[] calldata operators, uint8 threshold)
        external
        onlyRole(GOV)
    {
        if (operators.length == 0) revert EmptyOperators();
        if (threshold == 0 || threshold > operators.length) revert InvalidThreshold(threshold, operators.length);
        if (threshold != 1) revert UnsupportedThreshold(threshold);
        if (_clusterIdToIndex[clusterId] != 0) revert ClusterAlreadyRegistered(clusterId);

        for (uint256 i = 0; i < operators.length; ++i) {
            address op = operators[i];
            if (op == address(0)) revert InvalidOperator(op);
            if (_clusterOperatorSet[clusterId][op]) revert DuplicateOperator(op);
            _clusterOperatorSet[clusterId][op] = true;
        }

        clusters[clusterId] = Cluster({operators: operators, threshold: threshold, active: true});
        _clusterIds.push(clusterId);
        _clusterIdToIndex[clusterId] = _clusterIds.length; // 1-based

        emit ClusterRegistered(clusterId, operators, threshold);
    }

    /// @notice Deactivate a cluster — blocks future `depositToBeaconChainInCluster` calls.
    function deactivateCluster(bytes32 clusterId) external onlyRole(GOV) {
        if (_clusterIdToIndex[clusterId] == 0) revert ClusterNotFound(clusterId);
        Cluster storage c = clusters[clusterId];
        if (c.active) {
            c.active = false;
            emit ClusterDeactivated(clusterId);
        }
    }

    /// @notice Reactivate a previously deactivated cluster.
    function reactivateCluster(bytes32 clusterId) external onlyRole(GOV) {
        if (_clusterIdToIndex[clusterId] == 0) revert ClusterNotFound(clusterId);
        Cluster storage c = clusters[clusterId];
        if (!c.active) {
            c.active = true;
            emit ClusterReactivated(clusterId);
        }
    }

    // ── Cluster-gated beacon deposit (NODE_OPERATOR) ─────────────────────────

    /// @notice Push 32 ETH to the beacon deposit contract, attributed to `clusterId`.
    ///         Reverts if the cluster is not registered or not active.
    function depositToBeaconChainInCluster(
        bytes32 clusterId,
        bytes calldata pubkey,
        bytes calldata withdrawal_credentials,
        bytes calldata signature,
        bytes32 deposit_data_root
    ) external onlyRole(NODE_OPERATOR) nonReentrant whenNotPaused(PAUSE_RECEIVE) {
        if (_clusterIdToIndex[clusterId] == 0 || !clusters[clusterId].active) {
            revert ClusterNotActive(clusterId);
        }
        if (!_clusterOperatorSet[clusterId][msg.sender]) {
            revert OperatorNotInCluster(clusterId, msg.sender);
        }
        uint256 depositIndex = clusterDepositCount[clusterId]++;
        emit ClusterDeposit(clusterId, depositIndex, pubkey);
        _doBeaconDeposit(pubkey, withdrawal_credentials, signature, deposit_data_root);
    }

    // ── Views ────────────────────────────────────────────────────────────────

    function clusterCount() external view returns (uint256) {
        return _clusterIds.length;
    }

    function clusterIdAt(uint256 index) external view returns (bytes32) {
        if (index >= _clusterIds.length) revert IndexOutOfBounds(index, _clusterIds.length);
        return _clusterIds[index];
    }

    function getCluster(bytes32 clusterId)
        external
        view
        returns (address[] memory operators, uint8 threshold, bool active)
    {
        Cluster storage c = clusters[clusterId];
        return (c.operators, c.threshold, c.active);
    }
}
