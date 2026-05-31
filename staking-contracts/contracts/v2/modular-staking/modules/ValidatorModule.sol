// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IStakingRouter} from "../interfaces/IStakingRouter.sol";
import {IStakingModule} from "../interfaces/IStakingModule.sol";
import {IDepositContract} from "../interfaces/IDepositContract.sol";
import {GranularPause} from "../../lib/GranularPause.sol";
import {Errors} from "../../lib/Errors.sol";

/// @title ValidatorModule - solo-validator staking module behind StakingRouter
/// @notice Refactor of `StakingCore`. The Router is now the sole MINTER on StToken,
///         so this module never touches share supply directly. Instead it:
///           1. Buffers ETH on `receiveDeposit()` (router-only entry).
///           2. Pushes 32-ETH chunks to the canonical beacon-chain deposit contract.
///           3. Forwards oracle-validated beacon balance reports to the Router so the
///              Router can rebase StToken.
///
/// Roles:
///   GOV          — config
///   ORACLE       — submit beacon balance reports (typically `OracleAdapter`)
///   GUARDIAN     — emergency pause
///   NODE_OPERATOR— call `depositToBeaconChain` with a validator's deposit data
contract ValidatorModule is AccessControl, ReentrancyGuard, GranularPause, IStakingModule {
    // ── Roles ─────────────────────────────────────────────────────────────────
    bytes32 public constant GOV = keccak256("GOV");
    bytes32 public constant ORACLE = keccak256("ORACLE");
    bytes32 public constant GUARDIAN = keccak256("GUARDIAN");
    bytes32 public constant NODE_OPERATOR = keccak256("NODE_OPERATOR");

    // ── Pause IDs ─────────────────────────────────────────────────────────────
    /// @notice Blocks `receiveDeposit`, `reportBeacon`, and `depositToBeaconChain`.
    uint16 public constant PAUSE_RECEIVE = 0;

    // ── Constants ─────────────────────────────────────────────────────────────
    /// @notice Default mainnet beacon-chain deposit contract address. Used when
    ///         the constructor receives `address(0)` for `beaconDepositContract`.
    address public constant DEFAULT_BEACON_DEPOSIT_CONTRACT = 0x00000000219ab540356cBB839Cbe05303d7705Fa;
    uint256 public constant DEPOSIT_AMOUNT = 32 ether;

    // ── Immutables ────────────────────────────────────────────────────────────
    IStakingRouter public immutable ROUTER;
    bytes32 public immutable MODULE_ID;
    /// @notice Configurable beacon-chain deposit contract. Defaults to the mainnet
    ///         address when constructor arg is `address(0)`. Holesky/Hoodi and
    ///         hardhat tests pass alternative addresses.
    address public immutable BEACON_DEPOSIT_CONTRACT;

    // ── State ─────────────────────────────────────────────────────────────────
    uint256 internal _bufferedEther;     // ETH held here, pending validator assignment
    uint256 internal _beaconBalance;     // last reported sum of validator balances
    uint256 internal _beaconValidators;  // last reported validator count
    uint256 internal _depositedValidatorCount; // number of validator deposits ever pushed on beacon
    bytes32 public expectedWithdrawalCredentials; // validated withdrawal creds prefix
    mapping(bytes32 => bool) internal _depositedPubkeys; // keccak256(pubkey) → already deposited

    // ── Events ────────────────────────────────────────────────────────────────
    event DepositReceived(uint256 amount, uint256 newBufferedEther);
    event BeaconReported(uint256 beaconValidators, uint256 beaconBalance);
    event BeaconChainDeposit(bytes pubkey, uint256 amount, uint256 newBufferedEther);
    event ExpectedWithdrawalCredentialsSet(bytes32 indexed expected);

    // ── Errors ────────────────────────────────────────────────────────────────
    error NotRouter(address caller);
    error InsufficientBuffer(uint256 available, uint256 required);
    error BeaconBalanceSanityFailed(uint256 reported, uint256 maxAllowed);
    error BeaconValidatorCountSanityFailed(uint256 reported, uint256 maxAllowed);
    error InvalidBeaconReportTuple(uint256 beaconValidators, uint256 beaconBalance);
    error WithdrawalCredentialsNotConfigured();
    error InvalidWithdrawalCredentials();
    error BeaconDepositContractUnavailable(address beaconDepositContract);
    error DuplicatePubkey(bytes32 pubkeyHash);

    constructor(address router, bytes32 moduleId, address gov, address beaconDepositContract) {
        if (router == address(0) || gov == address(0)) revert Errors.ZeroAddress();
        if (moduleId == bytes32(0)) revert Errors.InvalidAmount();
        ROUTER = IStakingRouter(router);
        MODULE_ID = moduleId;
        BEACON_DEPOSIT_CONTRACT = beaconDepositContract == address(0)
            ? DEFAULT_BEACON_DEPOSIT_CONTRACT
            : beaconDepositContract;

        _grantRole(DEFAULT_ADMIN_ROLE, gov);
        _grantRole(GOV, gov);
        _grantRole(GUARDIAN, gov);
    }

    // ── Module hooks (router-only) ───────────────────────────────────────────

    modifier onlyRouter() {
        if (msg.sender != address(ROUTER)) revert NotRouter(msg.sender);
        _;
    }

    /// @inheritdoc IStakingModule
    function receiveDeposit() external payable virtual override onlyRouter whenNotPaused(PAUSE_RECEIVE) {
        _bufferedEther += msg.value;
        emit DepositReceived(msg.value, _bufferedEther);
    }

    /// @inheritdoc IStakingModule
    function totalEth() external view virtual override returns (uint256) {
        return _bufferedEther + _beaconBalance;
    }

    /// @inheritdoc IStakingModule
    function moduleType() external pure virtual override returns (bytes32) {
        return keccak256("SOLO_VALIDATOR");
    }

    // ── Oracle reporting ─────────────────────────────────────────────────────

    /// @notice ORACLE forwards a (already sanity-checked at adapter) report. We add
    ///         a defensive cap here too in case the adapter is misconfigured.
    function reportBeacon(uint256 newBeaconValidators, uint256 newBeaconBalance)
        external
        onlyRole(ORACLE)
        whenNotPaused(PAUSE_RECEIVE)
    {
        if (newBeaconValidators == 0 && newBeaconBalance != 0) {
            revert InvalidBeaconReportTuple(newBeaconValidators, newBeaconBalance);
        }

        // Reported active validators cannot exceed validators ever deposited by this module.
        // This blocks count-manipulation reports (e.g. huge validator count with unchanged
        // balance) that can weaken later per-validator drift checks.
        uint256 depositedValidators = _depositedValidatorCount;
        if (newBeaconValidators > depositedValidators) {
            revert BeaconValidatorCountSanityFailed(newBeaconValidators, depositedValidators);
        }

        if (_beaconValidators > 0) {
            // Validator count cannot more than double per report (defense-in-depth)
            uint256 maxValidators = _beaconValidators * 2;
            if (newBeaconValidators > maxValidators)
                revert BeaconValidatorCountSanityFailed(newBeaconValidators, maxValidators);
            // Balance cap scales with the new validator count
            uint256 maxPlausible = newBeaconValidators * 32 ether * 3 / 2;
            if (newBeaconBalance > maxPlausible)
                revert BeaconBalanceSanityFailed(newBeaconBalance, maxPlausible);
        }

        _beaconValidators = newBeaconValidators;
        _beaconBalance = newBeaconBalance;

        ROUTER.reportModuleBeaconBalance(MODULE_ID, newBeaconBalance);
        emit BeaconReported(newBeaconValidators, newBeaconBalance);
    }

    // ── Beacon-chain deposit (NODE_OPERATOR) ─────────────────────────────────

    /// @notice Push exactly 32 ETH from the buffer into the canonical beacon deposit
    ///         contract using the supplied validator credentials. Notifies the Router
    ///         so its `moduleBeaconBalance` baseline tracks the principal.
    function depositToBeaconChain(
        bytes calldata pubkey,
        bytes calldata withdrawal_credentials,
        bytes calldata signature,
        bytes32 deposit_data_root
    ) external virtual onlyRole(NODE_OPERATOR) nonReentrant whenNotPaused(PAUSE_RECEIVE) {
        _doBeaconDeposit(pubkey, withdrawal_credentials, signature, deposit_data_root);
    }

    /// @dev Core deposit logic extracted so subclasses (e.g. DVTModule) can reuse
    ///      it without duplicating reentrancy guards.
    function _doBeaconDeposit(
        bytes calldata pubkey,
        bytes calldata withdrawal_credentials,
        bytes calldata signature,
        bytes32 deposit_data_root
    ) internal {
        if (_bufferedEther < DEPOSIT_AMOUNT) {
            revert InsufficientBuffer(_bufferedEther, DEPOSIT_AMOUNT);
        }

        // Validate withdrawal credentials belong to the protocol
        bytes32 expected = expectedWithdrawalCredentials;
        if (expected == bytes32(0)) revert WithdrawalCredentialsNotConfigured();
        if (withdrawal_credentials.length != 32) revert InvalidWithdrawalCredentials();
        bytes32 provided;
        assembly {
            provided := calldataload(add(withdrawal_credentials.offset, 0))
        }
        if (provided != expected) revert InvalidWithdrawalCredentials();

        if (BEACON_DEPOSIT_CONTRACT.code.length == 0) {
            revert BeaconDepositContractUnavailable(BEACON_DEPOSIT_CONTRACT);
        }

        bytes32 pkHash = keccak256(pubkey);
        if (_depositedPubkeys[pkHash]) revert DuplicatePubkey(pkHash);
        _depositedPubkeys[pkHash] = true;
        _depositedValidatorCount += 1;

        _bufferedEther -= DEPOSIT_AMOUNT;

        IDepositContract(BEACON_DEPOSIT_CONTRACT).deposit{value: DEPOSIT_AMOUNT}(
            pubkey,
            withdrawal_credentials,
            signature,
            deposit_data_root
        );

        ROUTER.notifyBeaconDeposit(MODULE_ID, DEPOSIT_AMOUNT);
        emit BeaconChainDeposit(pubkey, DEPOSIT_AMOUNT, _bufferedEther);
    }

    // ── Admin ────────────────────────────────────────────────────────────────

    function setExpectedWithdrawalCredentials(bytes32 _expected) external onlyRole(GOV) {
        if (_expected == bytes32(0)) revert InvalidWithdrawalCredentials();
        expectedWithdrawalCredentials = _expected;
        emit ExpectedWithdrawalCredentialsSet(_expected);
    }

    // ── Pause ────────────────────────────────────────────────────────────────

    function pause(uint16 fnId) external onlyRole(GUARDIAN) {
        _pause(fnId);
    }

    function unpause(uint16 fnId) external onlyRole(GOV) {
        _unpause(fnId);
    }

    // ── Views ────────────────────────────────────────────────────────────────

    function bufferedEther() external view returns (uint256) {
        return _bufferedEther;
    }

    function beaconBalance() external view returns (uint256) {
        return _beaconBalance;
    }

    function beaconValidators() external view returns (uint256) {
        return _beaconValidators;
    }

    function depositedValidatorCount() external view returns (uint256) {
        return _depositedValidatorCount;
    }

    /// @dev Direct ETH transfers are accepted but do NOT update _bufferedEther.
    ///      Only Router-mediated deposits via receiveDeposit() update accounting.
    ///      This prevents unbacked ETH from inflating totalEth() and breaking the
    ///      Router accounting invariant (totalPooledEther == sum module.totalEth()).
    receive() external payable virtual {
        emit DepositReceived(msg.value, _bufferedEther);
    }
}
