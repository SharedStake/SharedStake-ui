// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Errors} from "../lib/Errors.sol";

/// @title OperatorRegistry - bond-based operator eligibility system
/// @notice Node operators bond ETH + SGT to earn validator slots. Bond requirements
///         are configurable per named config so future modules can use different tiers.
///         The registry is optional - if not set, modules fall back to role-based access.
///
/// Roles:
///   GOV    - configure bond configs, slash operators, manage CALLER role
///   CALLER - modules (e.g., ValidatorModule) that query eligibility and update active counts
contract OperatorRegistry is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── Roles ─────────────────────────────────────────────────────────────────
    bytes32 public constant GOV = keccak256("GOV");
    bytes32 public constant CALLER = keccak256("CALLER");

    // ── Structs ───────────────────────────────────────────────────────────────

    /// @notice Bond configuration for a named tier
    struct BondConfig {
        uint256 ethBondPerSlot;      // ETH required per validator slot
        uint256 sgtBondPerSlot;      // SGT required per validator slot
        uint256 maxSlots;            // Maximum slots per operator in this tier
    }

    /// @notice Operator state
    struct Operator {
        uint256 ethBonded;           // ETH currently bonded
        uint256 sgtBonded;           // SGT currently bonded
        uint256 activeValidators;    // Currently active validators
        uint256 totalSlots;          // Total slots earned (bond capacity)
        bytes32 configName;          // Bond config used for registration
    }

    // ── State ─────────────────────────────────────────────────────────────────
    IERC20 public immutable sgtToken;

    /// @notice Optional SharedStake NFT contract whose escrowed tokens reduce SGT bond requirements.
    IERC721 public nftContract;

    /// @notice SGT-denominated credit applied per escrowed NFT.
    uint256 public nftSgtCredit;
    
    /// @notice Named bond configurations (e.g., "default", "premium")
    mapping(bytes32 => BondConfig) public bondConfigs;
    
    /// @notice Operator data by address
    mapping(address => Operator) public operators;
    
    /// @notice Default config name for new registrations
    bytes32 public defaultConfigName;

    /// @notice Slash lock expiration timestamp per operator
    mapping(address => uint256) public slashLockUntil;

    /// @notice Total NFTs currently held in escrow.
    uint256 public totalEscrowedNfts;

    /// @notice Escrowed NFTs per operator.
    mapping(address => uint256[]) public escrowedNfts;

    /// @notice Original operator owner for an escrowed NFT tokenId.
    mapping(uint256 => address) private _nftEscrowOwner;

    // ── Events ────────────────────────────────────────────────────────────────
    event BondConfigSet(bytes32 indexed name, uint256 ethBondPerSlot, uint256 sgtBondPerSlot, uint256 maxSlots);
    event DefaultConfigSet(bytes32 indexed name);
    event BondRegistered(address indexed operator, bytes32 indexed config, uint256 ethAmount, uint256 sgtAmount);
    event SlotsExpanded(address indexed operator, uint256 additionalSlots, uint256 ethAmount, uint256 sgtAmount);
    event BondExited(address indexed operator, uint256 ethReturned, uint256 sgtReturned);
    event OperatorSlashed(address indexed operator, uint256 sgtAmount);
    event CallerGranted(address indexed caller);
    event CallerRevoked(address indexed caller);
    event ActiveIncremented(address indexed operator, uint256 newActiveCount);
    event ActiveDecremented(address indexed operator, uint256 newActiveCount);
    event SlashLockSet(address indexed operator, uint256 until);
    event NftContractSet(address indexed nft, uint256 sgtCredit);
    event NftLocked(address indexed operator, uint256 tokenId, uint256 credit);
    event NftUnlocked(address indexed operator, uint256 tokenId);

    // ── Errors ────────────────────────────────────────────────────────────────
    error ConfigNotFound(bytes32 name);
    error InsufficientBond(uint256 required, uint256 provided);
    error MaxSlotsExceeded(uint256 max, uint256 requested);
    error NoSlotsAvailable();
    error ActiveValidatorsExist();
    error NotCaller(address caller);
    error InvalidConfig();
    error SlashLockActive(uint256 until);
    error NftNotOwned();
    error NftAlreadyEscrowed();

    constructor(address _sgtToken, address gov) {
        if (_sgtToken == address(0) || gov == address(0)) revert Errors.ZeroAddress();
        sgtToken = IERC20(_sgtToken);

        _grantRole(DEFAULT_ADMIN_ROLE, gov);
        _grantRole(GOV, gov);
        _grantRole(CALLER, gov); // Gov can call for testing
    }

    // ── Configuration ────────────────────────────────────────────────────────

    /// @notice Set or update a bond configuration
    /// @param name Config name (e.g., keccak256("default"))
    /// @param ethBondPerSlot ETH required per slot
    /// @param sgtBondPerSlot SGT required per slot
    /// @param maxSlots Maximum slots per operator in this tier
    function setBondConfig(
        bytes32 name,
        uint256 ethBondPerSlot,
        uint256 sgtBondPerSlot,
        uint256 maxSlots
    ) external onlyRole(GOV) {
        if (name == bytes32(0)) revert Errors.InvalidAmount();
        if (ethBondPerSlot == 0 || sgtBondPerSlot == 0) revert Errors.InvalidAmount();
        if (maxSlots == 0) revert Errors.InvalidAmount();

        bondConfigs[name] = BondConfig({
            ethBondPerSlot: ethBondPerSlot,
            sgtBondPerSlot: sgtBondPerSlot,
            maxSlots: maxSlots
        });

        emit BondConfigSet(name, ethBondPerSlot, sgtBondPerSlot, maxSlots);
    }

    /// @notice Set the default config for new registrations
    function setDefaultConfig(bytes32 name) external onlyRole(GOV) {
        if (bondConfigs[name].maxSlots == 0) revert ConfigNotFound(name);
        defaultConfigName = name;
        emit DefaultConfigSet(name);
    }

    /// @notice Configure the optional NFT escrow credit.
    /// @param nft ERC-721 contract address. Use address(0) to disable new NFT locks.
    /// @param sgtCredit SGT-denominated credit per escrowed NFT.
    function setNftContract(address nft, uint256 sgtCredit) external onlyRole(GOV) {
        if (totalEscrowedNfts > 0 && (nft != address(nftContract) || sgtCredit != nftSgtCredit)) {
            revert InvalidConfig();
        }
        if (nft == address(0)) {
            nftContract = IERC721(address(0));
            nftSgtCredit = 0;
            emit NftContractSet(address(0), 0);
            return;
        }
        if (nft.code.length == 0) revert Errors.NotAContract();
        if (sgtCredit == 0) revert Errors.InvalidAmount();

        nftContract = IERC721(nft);
        nftSgtCredit = sgtCredit;
        emit NftContractSet(nft, sgtCredit);
    }

    // ── Operator actions ─────────────────────────────────────────────────────

    /// @notice Escrow a SharedStake NFT for SGT bond credit.
    /// @dev The operator must approve this registry for `tokenId` first.
    function lockNftForCredit(uint256 tokenId) external nonReentrant {
        IERC721 nft = nftContract;
        uint256 credit = nftSgtCredit;
        if (address(nft) == address(0) || credit == 0) revert InvalidConfig();
        if (_nftEscrowOwner[tokenId] != address(0)) revert NftAlreadyEscrowed();
        if (nft.ownerOf(tokenId) != msg.sender) revert NftNotOwned();

        _nftEscrowOwner[tokenId] = msg.sender;
        escrowedNfts[msg.sender].push(tokenId);
        totalEscrowedNfts += 1;
        nft.transferFrom(msg.sender, address(this), tokenId);

        emit NftLocked(msg.sender, tokenId, credit);
    }

    /// @notice Register with ETH + SGT bond (only valid registration path)
    function registerBondWithSgt(
        bytes32 configName,
        uint256 slots,
        uint256 sgtAmount
    ) external payable nonReentrant {
        _bond(configName, slots, msg.value, sgtAmount);
        sgtToken.safeTransferFrom(msg.sender, address(this), sgtAmount);
        emit BondRegistered(msg.sender, configName, msg.value, sgtAmount);
    }

    /// @notice Expand slots with ETH + SGT (only valid expansion path)
    function expandSlotsWithSgt(uint256 slots, uint256 sgtAmount) external payable nonReentrant {
        Operator storage op = operators[msg.sender];
        if (op.totalSlots == 0) revert Errors.InvalidAmount();

        bytes32 configName = _inferConfig(op);
        _bond(configName, slots, msg.value, sgtAmount);
        sgtToken.safeTransferFrom(msg.sender, address(this), sgtAmount);
        emit SlotsExpanded(msg.sender, slots, msg.value, sgtAmount);
    }

    /// @notice Exit bond and return funds (only if no active validators)
    function exitBond() external nonReentrant {
        Operator storage op = operators[msg.sender];
        if (block.timestamp < slashLockUntil[msg.sender]) revert SlashLockActive(slashLockUntil[msg.sender]);
        if (op.activeValidators > 0) revert ActiveValidatorsExist();
        uint256[] storage nftIds = escrowedNfts[msg.sender];
        if (op.ethBonded == 0 && op.sgtBonded == 0 && nftIds.length == 0) revert Errors.InvalidAmount();

        uint256 ethToReturn = op.ethBonded;
        uint256 sgtToReturn = op.sgtBonded;

        op.ethBonded = 0;
        op.sgtBonded = 0;
        op.totalSlots = 0;
        op.configName = bytes32(0);

        _returnEscrowedNfts(msg.sender, nftIds);

        if (ethToReturn > 0) {
            (bool success, ) = msg.sender.call{value: ethToReturn}("");
            if (!success) revert Errors.FailedCall();
        }

        if (sgtToReturn > 0) {
            sgtToken.safeTransfer(msg.sender, sgtToReturn);
        }

        emit BondExited(msg.sender, ethToReturn, sgtToReturn);
    }

    // ── Module callbacks ─────────────────────────────────────────────────────

    /// @notice Check if an operator is eligible to deposit
    /// @param operator Operator address
    /// @return True if operator has available slots
    function canDeposit(address operator) external view returns (bool) {
        Operator storage op = operators[operator];
        return op.activeValidators < op.totalSlots;
    }

    /// @notice Increment active validator count (called after successful deposit)
    /// @param operator Operator address
    function incrementActive(address operator) external onlyRole(CALLER) {
        Operator storage op = operators[operator];
        if (op.activeValidators >= op.totalSlots) revert MaxSlotsExceeded(op.totalSlots, op.activeValidators + 1);
        op.activeValidators += 1;
        emit ActiveIncremented(operator, op.activeValidators);
    }

    /// @notice Decrement active validator count (called after validator exit)
    /// @param operator Operator address
    function decrementActive(address operator) external onlyRole(CALLER) {
        Operator storage op = operators[operator];
        if (op.activeValidators == 0) revert Errors.InvalidAmount();
        op.activeValidators -= 1;
        emit ActiveDecremented(operator, op.activeValidators);
    }

    // ── Governance ───────────────────────────────────────────────────────────

    /// @notice Slash SGT from an operator (penalty for misbehavior)
    /// @param operator Operator to slash
    /// @param sgtAmount Amount of SGT to slash
    function slash(address operator, uint256 sgtAmount) external onlyRole(GOV) {
        Operator storage op = operators[operator];
        if (sgtAmount > op.sgtBonded) revert InsufficientBond(op.sgtBonded, sgtAmount);
        op.sgtBonded -= sgtAmount;

        // Burn slashed SGT or send to treasury - for now burn
        sgtToken.safeTransfer(address(0xdEaD), sgtAmount);

        // Reduce totalSlots to match justified slots based on remaining SGT bond
        BondConfig storage cfg = bondConfigs[op.configName];
        uint256 collateral = op.sgtBonded + _nftCreditOf(operator);
        uint256 justified = (cfg.sgtBondPerSlot > 0) ? collateral / cfg.sgtBondPerSlot : 0;
        if (justified < op.totalSlots) op.totalSlots = justified;

        // Set 7-day slash lock on exitBond
        slashLockUntil[operator] = block.timestamp + 7 days;

        emit OperatorSlashed(operator, sgtAmount);
    }

    /// @notice Grant CALLER role to a module
    function grantCaller(address caller) external onlyRole(GOV) {
        _grantRole(CALLER, caller);
        emit CallerGranted(caller);
    }

    /// @notice Revoke CALLER role
    function revokeCaller(address caller) external onlyRole(GOV) {
        _revokeRole(CALLER, caller);
        emit CallerRevoked(caller);
    }

    /// @notice Set slash lock expiration for an operator
    /// @param operator Operator address
    /// @param until Unix timestamp when lock expires
    function setSlashLock(address operator, uint256 until) external onlyRole(GOV) {
        slashLockUntil[operator] = until;
        emit SlashLockSet(operator, until);
    }

    // ── Internal helpers ─────────────────────────────────────────────────────

    function _bond(bytes32 configName, uint256 slots, uint256 ethAmount, uint256 sgtAmount) internal {
        BondConfig storage config = bondConfigs[configName];
        if (config.maxSlots == 0) revert ConfigNotFound(configName);

        Operator storage op = operators[msg.sender];

        uint256 newTotalSlots = op.totalSlots + slots;
        if (newTotalSlots > config.maxSlots) revert MaxSlotsExceeded(config.maxSlots, newTotalSlots);

        uint256 requiredEth = config.ethBondPerSlot * slots;
        uint256 requiredSgt = _requiredSgtDelta(config, msg.sender, op.sgtBonded, newTotalSlots);

        if (ethAmount != requiredEth) revert InsufficientBond(requiredEth, ethAmount);
        if (sgtAmount != requiredSgt) revert InsufficientBond(requiredSgt, sgtAmount);

        op.ethBonded += ethAmount;
        op.sgtBonded += sgtAmount;
        op.totalSlots = newTotalSlots;

        // Store configName on initial registration
        if (op.totalSlots == slots) {
            op.configName = configName;
        }
    }

    function _inferConfig(Operator storage op) internal view returns (bytes32) {
        return op.configName;
    }


    function _returnEscrowedNfts(address operator, uint256[] storage nftIds) internal {
        uint256 nftCount = nftIds.length;
        if (nftCount == 0) return;

        uint256[] memory idsToReturn = new uint256[](nftCount);
        for (uint256 i = 0; i < nftCount; i++) {
            uint256 tokenId = nftIds[i];
            idsToReturn[i] = tokenId;
            delete _nftEscrowOwner[tokenId];
        }
        delete escrowedNfts[operator];
        totalEscrowedNfts -= nftCount;

        IERC721 nft = nftContract;
        for (uint256 i = 0; i < nftCount; i++) {
            nft.transferFrom(address(this), operator, idsToReturn[i]);
            emit NftUnlocked(operator, idsToReturn[i]);
        }
    }

    function _nftCreditOf(address operator) internal view returns (uint256) {
        uint256 credit = nftSgtCredit;
        if (address(nftContract) == address(0) || credit == 0) return 0;
        return escrowedNfts[operator].length * credit;
    }

    function _requiredSgtDelta(
        BondConfig storage config,
        address operator,
        uint256 existingSgtBonded,
        uint256 newTotalSlots
    ) internal view returns (uint256) {
        uint256 requiredTotal = config.sgtBondPerSlot * newTotalSlots;
        uint256 credit = _nftCreditOf(operator);
        uint256 targetSgtBond = requiredTotal > credit ? requiredTotal - credit : 0;
        if (existingSgtBonded >= targetSgtBond) return 0;
        return targetSgtBond - existingSgtBonded;
    }

    // ── Views ────────────────────────────────────────────────────────────────

    /// @notice Get operator details
    function getOperator(address operator) external view returns (
        uint256 ethBonded,
        uint256 sgtBonded,
        uint256 activeValidators,
        uint256 totalSlots,
        bytes32 configName
    ) {
        Operator storage op = operators[operator];
        return (op.ethBonded, op.sgtBonded, op.activeValidators, op.totalSlots, op.configName);
    }

    /// @notice Get available slots for an operator
    function availableSlots(address operator) external view returns (uint256) {
        Operator storage op = operators[operator];
        if (op.totalSlots > op.activeValidators) {
            return op.totalSlots - op.activeValidators;
        }
        return 0;
    }

    /// @notice Number of NFTs currently escrowed for an operator.
    function escrowedNftCount(address operator) external view returns (uint256) {
        return escrowedNfts[operator].length;
    }

    receive() external payable {
        // Accept ETH for bond expansions
    }
}