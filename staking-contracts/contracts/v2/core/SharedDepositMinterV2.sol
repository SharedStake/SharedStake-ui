// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

/// @title SharedDepositMinterV2 - minter for ETH LSD
/// @author @ChimeraDefi - chimera_defi@protonmail.com | sharedstake.org
// v1 sharedstake veth2 minter with some code removed
// user deposits eth to get minted token
// The contract cannot move user ETH outside unless
// 1. the user redeems 1:1
// 2. the depositToEth2 or depositToEth2Batch fns are called which allow moving ETH to the mainnet deposit contract only
// 3. The contract allows permissioned external actors to supply validator public keys
// 4. Who's allowed to deposit how many validators is governed outside this contract
// 5. The ability to provision validators for user ETH is portioned out by the DAO

// Changes
/**
- Custom errors instead of revert strings
- Granular management via AccessControl with GOV and NOR roles. Node operator can only deploy validators
- Refactored to allow users to specify destination address for fns - for zaps
- Added deposit+stake/unstake+withdraw combo convenience routes
- Refactored fee calc out to external contract
*/
import {IFeeCalc} from "../interfaces/IFeeCalc.sol";
import {IERC20MintableBurnable} from "../interfaces/IERC20MintableBurnable.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

import {ETH2DepositWithdrawalCredentials} from "../lib/ETH2DepositWithdrawalCredentials.sol";

/// @title SharedDepositMinterV2
/// @author ChimeraDefi - chimera_defi@protonmail.com | sharedstake.org
/// @notice Mints LSD tokens for ETH deposited to the contract. Handles the depositing of ETH to the ETH2 deposit contract and validator creation
/// @dev Deployment params:
/// - addresses : [feeCalc, sgeth, wsgeth, gov, depositContract, optionalNodeOperator]
contract SharedDepositMinterV2 is AccessControl, Pausable, ReentrancyGuard, ETH2DepositWithdrawalCredentials {
    /* ========== STATE VARIABLES ========== */
    uint256 public adminFee;
    uint256 public numValidators;
    uint256 public costPerValidator;

    // The validator shares created by this shared stake contract. 1 share costs >= 1 eth
    uint256 public curValidatorShares; //initialized to 0

    // The number of times the deposit to eth2 contract has been called to create validators
    uint256 public validatorsCreated; //initialized to 0

    // Total accrued admin fee
    uint256 public adminFeeTotal; //initialized to 0

    // Its hard to exactly hit the max deposit amount with small shares. this allows a small bit of overflow room
    // Eth in the buffer cannot be withdrawn by an admin, only by burning the underlying token via a user withdraw
    uint256 public buffer;

    // Flash loan tokenomic protection in case of changes in admin fee with future lots
    bool public refundFeesOnWithdraw; //initialized to false

    // NEW
    IERC20MintableBurnable private immutable _SGETH;
    IERC4626 private immutable _WSGETH;
    IFeeCalc private _feeCalc;

    bytes32 public constant NOR = keccak256("NOR"); // Node operator for deploying validators
    bytes32 public constant GOV = keccak256("GOV"); // Governance for settings - normally timelock controlled by multisig

    //errors
    error AmountTooHigh();
    error NoValidators();
    error InvalidAddressConfig();
    error ZeroAddress();

    function _depositContractFromConfig(address[] memory addresses) private pure returns (address) {
        if (addresses.length < 5) {
            revert InvalidAddressConfig();
        }
        return addresses[4];
    }

    constructor(
        uint256 _numValidators,
        uint256 _adminFee,
        address[] memory addresses
    ) AccessControl() Pausable() ReentrancyGuard() ETH2DepositWithdrawalCredentials(_depositContractFromConfig(addresses)) {
        if (addresses.length < 5) {
            revert InvalidAddressConfig();
        }
        if (addresses[1] == address(0) || addresses[2] == address(0) || addresses[3] == address(0)) {
            revert ZeroAddress();
        }

        address governance = addresses[3];
        address nodeOperator = addresses.length > 5 && addresses[5] != address(0) ? addresses[5] : governance;

        _feeCalc = IFeeCalc(addresses[0]);
        _SGETH = IERC20MintableBurnable(addresses[1]);
        _WSGETH = IERC4626(addresses[2]);

        _SGETH.approve(address(_WSGETH), 2 ** 256 - 1); // max approve wsgeth for deposit and stake

        adminFee = _adminFee; // Admin and infra fees
        numValidators = _numValidators; // The number of validators to create in this lot. Sets a max limit on deposits

        // Eth in the buffer cannot be withdrawn by an admin, only by burning the underlying token
        buffer = 10 * 1e18; // roughly equal to 10 eth.

        costPerValidator = (32 * 1e18) + adminFee;

        _grantRole(NOR, nodeOperator);
        _grantRole(GOV, governance);
    }

    /*//////////////////////////////////////////////////////////////
                        DEPOSIT/WITHDRAWAL LOGIC
    //////////////////////////////////////////////////////////////*/

    // USER INTERACTIONS
    /*
        Shares minted = Z
        Principal deposit input = P
        AdminFee = a
        costPerValidator = 32 + a
        AdminFee as percent in 1e18 = a% =  (a / costPerValidator) * 1e18
        AdminFee on tx in 1e18 = (P * a% / 1e18)

        on deposit:
        P - (P * a%) = Z

        on withdraw with admin fee refund:
        P = Z / (1 - a%)
        P = Z - Z*a%
    */

    function deposit() external payable {
        _deposit(msg.sender);
    }

    function depositFor(address dest) external payable {
        _deposit(dest);
    }

    function depositAndStake() external payable {
        _WSGETH.deposit(_deposit(address(this)), msg.sender);
    }

    function depositAndStakeFor(address dest) external payable {
        _WSGETH.deposit(_deposit(address(this)), dest);
    }

    function withdraw(uint256 amount) external {
        _withdraw(amount, msg.sender, msg.sender);
    }

    function withdrawTo(uint256 amount, address dest) external {
        _withdraw(amount, msg.sender, dest);
    }

    function unstakeAndWithdraw(uint256 amount, address dest) external {
        _withdraw(_WSGETH.redeem(amount, address(this), msg.sender), address(this), dest);
    }

    // migration function to accept old monies and copy over state
    // users should not use this as it just donates the money without minting veth or tracking donations
    function donate() external payable {} // solhint-disable-line

    /*//////////////////////////////////////////////////////////////
                            ADMIN LOGIC
    //////////////////////////////////////////////////////////////*/

    // Batch deposit eth to the eth2 contract with preset creds
    // Data needs to be verified offchain to save gas
    function batchDepositToEth2(
        bytes[] calldata pubkeys,
        bytes[] calldata signatures,
        bytes32[] calldata depositDataRoots
    ) external onlyRole(NOR) {
        if (address(this).balance < (_depositAmount * pubkeys.length)) {
            revert AmountTooHigh(); // Not enough bal in contract to deploy all validators
        }
        _batchDeposit(pubkeys, signatures, depositDataRoots);
        validatorsCreated = validatorsCreated + pubkeys.length;
    }

    function setWithdrawalCredential(bytes memory _newWithdrawalCreds) external onlyRole(NOR) {
        // can only be called once
        _setWithdrawalCredential(_newWithdrawalCreds);
    }

    // Slashes the onchain staked sgETH to mirror CL validator slashings
    // modifies wsgeth virtual price
    function slash(uint256 amt) external onlyRole(GOV) {
        if (amt > curValidatorShares) {
            revert AmountTooHigh(); // Cannot slash more than minted
        }
        _SGETH.burn(address(_WSGETH), amt);
    }

    // Set fee calc address. if addr = 0 then fees are assumed to be 0
    function setFeeCalc(address _feeCalculatorAddr) external onlyRole(GOV) {
        _feeCalc = IFeeCalc(_feeCalculatorAddr);
    }

    function togglePause() external onlyRole(GOV) {
        bool paused = paused();
        if (paused) {
            _unpause();
        } else {
            _pause();
        }
    }

    // Used to migrate state over to new contract
    function migrateShares(uint256 shares) external onlyRole(GOV) {
        curValidatorShares = shares;
    }

    function toggleWithdrawRefund() external onlyRole(GOV) {
        refundFeesOnWithdraw = !refundFeesOnWithdraw;
    }

    function setNumValidators(uint256 _numValidators) external onlyRole(GOV) {
        if (_numValidators > 0) {
            numValidators = _numValidators;
        } else {
            revert NoValidators();
        }
    }

    function withdrawAdminFee(uint256 amount) external onlyRole(GOV) {
        address payable sender = payable(msg.sender);
        if (amount == 0) {
            amount = adminFeeTotal;
        }
        if (amount > adminFeeTotal) {
            revert AmountTooHigh();
        }
        adminFeeTotal = adminFeeTotal - amount;
        Address.sendValue(sender, amount);
    }

    /*//////////////////////////////////////////////////////////////
                            ACCOUNTING LOGIC
    //////////////////////////////////////////////////////////////*/

    function remainingSpaceInEpoch() external view returns (uint256) {
        // Helpful view function to gauge how much the user can send to the contract when it is near full
        uint256 remainingShares = maxValidatorShares() - curValidatorShares;
        uint256 valBeforeAdmin = (remainingShares * 1e18) / (((1 * 1e18) - (adminFee * 1e18) / costPerValidator));
        return valBeforeAdmin;
    }

    function maxValidatorShares() public view returns (uint256) {
        return 32 * 1e18 * numValidators;
    }

    function _depositAccounting() internal returns (uint256 value) {
        // input is whole, not / 1e18 , i.e. in 1 = 1 eth send when from etherscan
        value = msg.value;
        uint256 fee;

        if (address(_feeCalc) != address(0)) {
            (value, fee) = _feeCalc.processDeposit(value, msg.sender);
            adminFeeTotal = adminFeeTotal + fee;
        }

        uint256 newShareTotal = curValidatorShares + value;

        if (newShareTotal > buffer + maxValidatorShares()) {
            revert AmountTooHigh();
        }
        curValidatorShares = newShareTotal;
    }

    function _withdrawAccounting(uint256 amount) internal returns (uint256) {
        uint256 fee;
        if (address(_feeCalc) != address(0)) {
            (amount, fee) = _feeCalc.processWithdraw(amount, msg.sender);
            if (refundFeesOnWithdraw) {
                adminFeeTotal = adminFeeTotal - fee;
            } else {
                adminFeeTotal = adminFeeTotal + fee;
            }
        }
        if (address(this).balance < (amount + adminFeeTotal)) {
            revert AmountTooHigh();
        }

        curValidatorShares = curValidatorShares - amount;
        return amount;
    }

    function _deposit(address dest) internal nonReentrant whenNotPaused returns (uint256 amt) {
        amt = _depositAccounting();
        _SGETH.mint(dest, amt);
    }

    function _withdraw(uint256 amount, address origin, address dest) internal nonReentrant whenNotPaused {
        _SGETH.burn(origin, amount); // reverts if amount is too high
        uint256 assets = _withdrawAccounting(amount);

        address payable recv = payable(dest);
        Address.sendValue(recv, assets);
    }

    receive() external payable {} // solhint-disable-line

    fallback() external payable {} // solhint-disable-line
}
