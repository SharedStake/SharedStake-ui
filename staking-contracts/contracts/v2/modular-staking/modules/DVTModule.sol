// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {ValidatorModule} from "./ValidatorModule.sol";
import {IDepositContract} from "../../interfaces/IDepositContract.sol";

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

    // ── Deposit proposal queue ─────────────────────────────────────────────
    struct DepositProposal {
        bytes32 clusterId;
        bytes pubkey;
        bytes withdrawal_credentials;
        bytes signature;
        bytes32 deposit_data_root;
        uint256 approvalCount;
        bool executed;
        bool cancelled;
        address proposer;
    }

    mapping(bytes32 => DepositProposal) public depositProposals;
    mapping(bytes32 => bytes32[]) internal _clusterProposals;

    // ── Epoch-aware approval state (replaces flat hasApproved mapping) ────────
    // Each cancelProposal() bumps the epoch, invalidating prior approvals.
    mapping(bytes32 => uint256) internal _proposalEpoch;
    mapping(bytes32 => mapping(address => bool)) internal _hasApprovedEpoched;

    // ── Events ────────────────────────────────────────────────────────────────
    event ClusterRegistered(bytes32 indexed clusterId, address[] operators, uint8 threshold);
    event ClusterDeactivated(bytes32 indexed clusterId);
    event ClusterReactivated(bytes32 indexed clusterId);
    event ClusterDeposit(bytes32 indexed clusterId, uint256 depositIndex, bytes pubkey);
    event DepositProposed(bytes32 indexed clusterId, bytes32 indexed proposalId, address indexed proposer, bytes pubkey);
    event DepositApproved(bytes32 indexed proposalId, address indexed approver, uint256 approvalCount, uint8 threshold);
    event DepositProposalCancelled(bytes32 indexed proposalId, address indexed by);

    // ── Errors ────────────────────────────────────────────────────────────────
    error ClusterAlreadyRegistered(bytes32 clusterId);
    error ClusterNotFound(bytes32 clusterId);
    error ClusterNotActive(bytes32 clusterId);
    error InvalidThreshold(uint8 threshold, uint256 operatorCount);
    error EmptyOperators();
    error InvalidOperator(address operator);
    error DuplicateOperator(address operator);
    error OperatorNotInCluster(bytes32 clusterId, address operator);
    error UseClusteredDeposit();
    error UseProposalQueue();
    error IndexOutOfBounds(uint256 index, uint256 length);
    error ProposalAlreadyExists(bytes32 proposalId);
    error ProposalNotActive(bytes32 proposalId);
    error AlreadyApproved(bytes32 proposalId, address approver);
    error ProposalNotFound(bytes32 proposalId);
    error NotProposerOrGov(bytes32 proposalId, address caller);

    // ── UUPS constructor / initializer ────────────────────────────────────────

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() ValidatorModule() {}

    function initialize(address router, bytes32 moduleId, address gov, address beaconDepositContract)
        public
        override
        initializer
    {
        super.initialize(router, moduleId, gov, beaconDepositContract);
    }

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
    /// @dev Multi-operator threshold approvals use the proposeDeposit/approveDeposit flow.
    function registerCluster(bytes32 clusterId, address[] calldata operators, uint8 threshold) external onlyRole(GOV) {
        if (operators.length == 0) revert EmptyOperators();
        if (threshold == 0 || threshold > operators.length) revert InvalidThreshold(threshold, operators.length);
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
    /// @dev Deprecated: Use proposeDeposit/approveDeposit instead for all deposits.
    function depositToBeaconChainInCluster(
        bytes32,
        bytes calldata,
        bytes calldata,
        bytes calldata,
        bytes32
    ) external onlyRole(NODE_OPERATOR) nonReentrant whenNotPaused(PAUSE_RECEIVE) {
        revert UseProposalQueue();
    }

    // ── Deposit proposal queue (NODE_OPERATOR) ─────────────────────────────

    /// @notice Propose a 32-ETH beacon deposit for a cluster. The proposer's approval is counted.
    ///         If the cluster threshold is 1, the deposit executes immediately.
    function proposeDeposit(
        bytes32 clusterId,
        bytes calldata pubkey,
        bytes calldata withdrawal_credentials,
        bytes calldata signature,
        bytes32 deposit_data_root
    ) external onlyRole(NODE_OPERATOR) nonReentrant whenNotPaused(PAUSE_RECEIVE) {
        if (_clusterIdToIndex[clusterId] == 0 || !clusters[clusterId].active) revert ClusterNotActive(clusterId);
        if (!_clusterOperatorSet[clusterId][msg.sender]) revert OperatorNotInCluster(clusterId, msg.sender);

        // Check OperatorRegistry if set (inherited from ValidatorModule)
        if (address(operatorRegistry) != address(0)) {
            if (!operatorRegistry.canDeposit(msg.sender)) revert OperatorNotEligible(msg.sender);
        }

        bytes32 proposalId = keccak256(abi.encode(clusterId, pubkey, withdrawal_credentials, signature, deposit_data_root));
        if (depositProposals[proposalId].approvalCount > 0) revert ProposalAlreadyExists(proposalId);

        depositProposals[proposalId] = DepositProposal({
            clusterId: clusterId,
            pubkey: pubkey,
            withdrawal_credentials: withdrawal_credentials,
            signature: signature,
            deposit_data_root: deposit_data_root,
            approvalCount: 1,
            executed: false,
            cancelled: false,
            proposer: msg.sender
        });
        _hasApprovedEpoched[_approvalKey(proposalId)][msg.sender] = true;
        _clusterProposals[clusterId].push(proposalId);
        emit DepositProposed(clusterId, proposalId, msg.sender, pubkey);

        if (clusters[clusterId].threshold == 1) {
            _executeProposal(proposalId, msg.sender);
        } else {
            emit DepositApproved(proposalId, msg.sender, 1, clusters[clusterId].threshold);
        }
    }

    /// @notice Approve an existing proposal. Executes when approvalCount reaches threshold.
    function approveDeposit(bytes32 proposalId) external onlyRole(NODE_OPERATOR) nonReentrant whenNotPaused(PAUSE_RECEIVE) {
        DepositProposal storage p = depositProposals[proposalId];
        if (p.approvalCount == 0) revert ProposalNotFound(proposalId);
        if (p.executed || p.cancelled) revert ProposalNotActive(proposalId);
        if (!_clusterOperatorSet[p.clusterId][msg.sender]) revert OperatorNotInCluster(p.clusterId, msg.sender);
        if (_hasApprovedEpoched[_approvalKey(proposalId)][msg.sender]) revert AlreadyApproved(proposalId, msg.sender);

        _hasApprovedEpoched[_approvalKey(proposalId)][msg.sender] = true;
        p.approvalCount++;
        emit DepositApproved(proposalId, msg.sender, p.approvalCount, clusters[p.clusterId].threshold);

        if (p.approvalCount >= clusters[p.clusterId].threshold) {
            _executeProposal(proposalId, msg.sender);
        }
    }

    /// @notice Cancel a proposal. Only cluster operators or GOV can cancel.
    function cancelProposal(bytes32 proposalId) external {
        DepositProposal storage p = depositProposals[proposalId];
        if (p.approvalCount == 0) revert ProposalNotFound(proposalId);
        if (p.executed) revert ProposalNotActive(proposalId);
        // Restrict to proposer or GOV: any cluster operator having cancel power creates
        // a grief path where one rogue/compromised member perpetually cancels peers' proposals.
        // Other members who disagree with a proposal simply withhold approval — threshold
        // not reached means deposit never executes, so cancel is unnecessary for them.
        if (msg.sender != p.proposer && !hasRole(GOV, msg.sender)) revert NotProposerOrGov(proposalId, msg.sender);
        p.cancelled = true;
        // Bump epoch so prior hasApproved entries are invalidated — re-proposal with the
        // same deposit data can proceed and collect fresh approvals from all cluster members.
        _proposalEpoch[proposalId]++;
        // Reset approvalCount so the same pubkey+sig combo can be re-proposed after
        // cancellation. Without this, proposeDeposit's `approvalCount > 0` guard would
        // permanently block re-use of the same deposit data.
        p.approvalCount = 0;
        emit DepositProposalCancelled(proposalId, msg.sender);
    }

    /// @notice View all proposal IDs for a cluster (for UI enumeration).
    function clusterProposalCount(bytes32 clusterId) external view returns (uint256) {
        return _clusterProposals[clusterId].length;
    }

    function clusterProposalAt(bytes32 clusterId, uint256 index) external view returns (bytes32) {
        uint256 len = _clusterProposals[clusterId].length;
        if (index >= len) revert IndexOutOfBounds(index, len);
        return _clusterProposals[clusterId][index];
    }

    /// @notice Returns whether `approver` has approved the current epoch of `proposalId`.
    ///         Resets after cancellation+re-proposal.
    function hasApproved(bytes32 proposalId, address approver) external view returns (bool) {
        return _hasApprovedEpoched[_approvalKey(proposalId)][approver];
    }

    function _executeProposal(bytes32 proposalId, address executor) internal {
        DepositProposal storage p = depositProposals[proposalId];
        p.executed = true;
        uint256 depositIndex = clusterDepositCount[p.clusterId]++;
        emit ClusterDeposit(p.clusterId, depositIndex, p.pubkey);

        // Copy storage to memory for calldata compatibility
        bytes memory pubkeyMem = p.pubkey;
        bytes memory withdrawalCredsMem = p.withdrawal_credentials;
        bytes memory signatureMem = p.signature;
        bytes32 depositDataRootMem = p.deposit_data_root;

        // Inline deposit logic to handle storage->calldata conversion
        if (_bufferedEther < DEPOSIT_AMOUNT) {
            revert InsufficientBuffer(_bufferedEther, DEPOSIT_AMOUNT);
        }

        _validateWithdrawalCredentials(withdrawalCredsMem);

        if (BEACON_DEPOSIT_CONTRACT.code.length == 0) {
            revert BeaconDepositContractUnavailable(BEACON_DEPOSIT_CONTRACT);
        }

        bytes32 pkHash = keccak256(pubkeyMem);
        if (!approvedPubkeys[pkHash]) revert PubkeyNotApproved(pkHash);
        // Clear approval before external call — each pubkey can only be deposited once
        delete approvedPubkeys[pkHash];
        if (_depositedPubkeys[pkHash]) revert DuplicatePubkey(pkHash);

        _bufferedEther -= DEPOSIT_AMOUNT;

        IDepositContract(BEACON_DEPOSIT_CONTRACT).deposit{value: DEPOSIT_AMOUNT}(
            pubkeyMem,
            withdrawalCredsMem,
            signatureMem,
            depositDataRootMem
        );

        // Mark deposited only after confirmed success — prevents permanent blacklist if
        // the beacon deposit reverts (e.g. malformed BLS data), matching ValidatorModule fix.
        _depositedPubkeys[pkHash] = true;
        _depositedValidatorCount += 1;

        ROUTER.notifyBeaconDeposit(MODULE_ID, DEPOSIT_AMOUNT);
        emit BeaconChainDeposit(pubkeyMem, DEPOSIT_AMOUNT, _bufferedEther);

        if (address(operatorRegistry) != address(0)) {
            // One beacon deposit = one validator slot consumed by the executor.
            // Do not increment the proposer's active count: they are not running an
            // independent validator for this deposit — the cluster runs one shared
            // validator. Charging both proposer and executor would (a) double-count
            // active validators and (b) cause a permanent revert if the proposer's
            // slot was filled between proposal creation and final approval.
            //
            // NOTE: decrementActive is the keeper's responsibility on validator exit.
            // It must be called (via OperatorRegistry.decrementActive or the GOV escape
            // hatch adminDecrementActive) once the validator has fully exited the beacon
            // chain (EL withdrawal received + validator balance = 0). Omitting this call
            // will permanently exhaust canDeposit() slots and block exitBond().
            operatorRegistry.incrementActive(executor);
        }
    }

    function _validateWithdrawalCredentials(bytes memory withdrawalCredsMem) internal view {
        bytes32 expected = expectedWithdrawalCredentials;
        if (expected == bytes32(0)) revert WithdrawalCredentialsNotConfigured();
        if (withdrawalCredsMem.length != 32) revert InvalidWithdrawalCredentials();
        bytes32 provided;
        assembly {
            provided := mload(add(withdrawalCredsMem, 32))
        }
        if (provided != expected) revert InvalidWithdrawalCredentials();
    }

    /// @dev Returns a unique key for the current approval epoch of a proposal.
    function _approvalKey(bytes32 proposalId) internal view returns (bytes32) {
        return keccak256(abi.encode(proposalId, _proposalEpoch[proposalId]));
    }

    // ── Views ────────────────────────────────────────────────────────────────

    function clusterCount() external view returns (uint256) {
        return _clusterIds.length;
    }

    function clusterIdAt(uint256 index) external view returns (bytes32) {
        if (index >= _clusterIds.length) revert IndexOutOfBounds(index, _clusterIds.length);
        return _clusterIds[index];
    }

    function getCluster(
        bytes32 clusterId
    ) external view returns (address[] memory operators, uint8 threshold, bool active) {
        Cluster storage c = clusters[clusterId];
        return (c.operators, c.threshold, c.active);
    }

    // ── Storage gap ─────────────────────────────────────────────────────────────
    uint256[45] private __gap;
}
