// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;
pragma experimental ABIEncoderV2;

import {AddressUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

import {UpgradeableSafeContractBase} from "./UpgradeableSafeContractBase.sol";
import {MintableBurnableTokenManagerUpgradeable} from "./MintableBurnableTokenManagerUpgradeable.sol";
import {SafeMathUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import {VaultWithSharesAndCapUpgradeable} from "./VaultWithSharesAndCapUpgradeable.sol";
import {WithdrawQueueUpgradeable} from "./WithdrawQueueUpgradeable.sol";

// import {PriceOracleUpgradeable} from "./PriceOracleUpgradeable.sol";

contract VaultWithAdminFeeUpgradeable is
    UpgradeableSafeContractBase,
    VaultWithSharesAndCapUpgradeable,
    MintableBurnableTokenManagerUpgradeable,
    WithdrawQueueUpgradeable
{
    using SafeMathUpgradeable for uint256;
    using AddressUpgradeable for address;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    uint256 public ADMIN_FEE; // as a %, in bips. i.e. 1 = 0.01%,
    uint256 public BIPS_DENOM;
    bool public DISABLE_WITHDRAW_REFUND; //initialized to false

    // Total accrued admin fee
    uint256 public adminFeeTotal; //initialized to 0

    // Flash loan tokenomic protection in case of changes in admin fee with future lots
    bool public disableWithdrawRefund; //initialized to false

    event Deposit(address indexed _from, uint256 _value);
    event Withdraw(address indexed _from, uint256 _value);
    event AdminFeeChanged(uint256 _oldFee, uint256 _newFee, uint256 timestamp);
    event AdminParamsChanged(
        uint256 cap,
        uint256 buffer,
        uint256 currentShares,
        uint256 costPerShare,
        uint256 adminFee,
        bool withdrawRefundBool,
        address token,
        uint256 timestamp,
        uint256 epochLength
    );

    function __VaultWithAdminFeeUpgradeable_init(
        uint256 _cap,
        uint256 _buffer,
        uint256 _currentShares,
        uint256 _costPerShare,
        uint256 _adminFee,
        bool _withdrawRefundBool,
        address _tokenAddress,
        uint256 _epochLength
    ) internal initializer {
        __UpgradeableSafeContractBase_init();

        __VaultWithSharesAndCapUpgradeable_init(_costPerShare);
        __MintableBurnableTokenManagerUpgradeable_init_unchained(_tokenAddress);
        _setup(_cap, _buffer, _currentShares, _costPerShare, _adminFee, _withdrawRefundBool, _epochLength);
    }

    function __VaultWithAdminFeeUpgradeable_init_unchained(
        uint256 _cap,
        uint256 _buffer,
        uint256 _currentShares,
        uint256 _costPerShare,
        uint256 _adminFee,
        bool _withdrawRefundBool,
        address _tokenAddress,
        uint256 _epochLength
    ) internal initializer {
        __UpgradeableSafeContractBase_init();
        __VaultWithSharesAndCapUpgradeable_init_unchained(_costPerShare);
        __MintableBurnableTokenManagerUpgradeable_init_unchained(_tokenAddress);
        _setup(_cap, _buffer, _currentShares, _costPerShare, _adminFee, _withdrawRefundBool, _epochLength);
    }

    function _setup(
        uint256 _cap,
        uint256 _buffer,
        uint256 _currentShares,
        uint256 _costPerShare,
        uint256 _adminFee,
        bool _withdrawRefundDisabled,
        uint256 _epochLengthForWithdrawalQueue
    ) internal {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(PAUSER_ROLE, _msgSender());
        _setupRole(GOVERNANCE_ROLE, _msgSender());

        setAdminParams(
            _cap,
            _buffer,
            _currentShares,
            _costPerShare,
            _adminFee,
            _withdrawRefundDisabled,
            tokenAddress,
            _epochLengthForWithdrawalQueue
        );
        BIPS_DENOM = 10000;
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "onlyAdmin");
        _;
    }

    modifier onlyAdminOrOwner(address acc) {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()) || acc == _msgSender(), "onlyAdmin");
        _;
    }

    function ensureAdminFeeIsRetainedInContractBalanceETH(uint256 amount) public view {
        require(
            address(this).balance.sub(amount) > adminFeeTotal,
            "Eth2Staker:withdraw:Not enough balance in contract to satisfy admin fee"
        );
    }

    function getFeeGivenAmountAndAdminPrct(uint256 amount, uint256 adminFeeBIPS) public view returns (uint256) {
        return amount.mul(adminFeeBIPS).div(BIPS_DENOM);
    }

    function getAdminFeeOnDeposit(uint256 amount) public view returns (uint256) {
        if (ADMIN_FEE == 0) {
            return amount;
        }
        return getFeeGivenAmountAndAdminPrct(amount, ADMIN_FEE);
    }

    function getAdminFeeRefundOnWithdrawal(uint256 amount) public view returns (uint256) {
        if (disableWithdrawRefund || ADMIN_FEE == 0) {
            return 0;
        }
        uint256 original = amount.mul(BIPS_DENOM).div(uint256(1).mul(BIPS_DENOM).sub(ADMIN_FEE));
        return original.sub(amount);
    }

    function _deposit(uint256 value) internal returns (uint256) {
        uint256 adminFeeHere = getAdminFeeOnDeposit(value);
        uint256 valMinusAdmin = value.sub(adminFeeHere);
        uint256 newShares = _depositAndAccountShares(valMinusAdmin);
        adminFeeTotal = adminFeeTotal.add(adminFeeHere);
        emit Deposit(_msgSender(), msg.value);

        return newShares;
    }

    function _withdrawEth(uint256 amount) internal returns (uint256) {
        uint256 newAmount = getAmountGivenShares(amount);
        uint256 adminFeeHere = getAdminFeeRefundOnWithdrawal(newAmount);
        uint256 valBeforeAdmin = newAmount.add(adminFeeHere);

        require(
            address(this).balance.sub(valBeforeAdmin) > 0,
            "Eth2Staker:withdraw:Not enough balance in contract to satisfy admin fee"
        );
        ensureAdminFeeIsRetainedInContractBalanceETH(valBeforeAdmin);

        _decrementShares(amount);
        adminFeeTotal = adminFeeTotal.sub(adminFeeHere);
        emit Withdraw(_msgSender(), msg.value);

        return valBeforeAdmin;
    }

    function setAdminParams(
        uint256 _cap,
        uint256 _buffer,
        uint256 _currentShares,
        uint256 _costPerShare,
        uint256 _adminFee,
        bool _withdrawRefundBool,
        address _tokenAddress,
        uint256 _epochLength
    ) public onlyAdmin {
        _setCap(_cap);
        _setBuffer(_buffer);
        curShares = _currentShares;
        costPerShare = _costPerShare;
        setAdminFee(_adminFee);
        disableWithdrawRefund = _withdrawRefundBool;
        _setTokenAddress(_tokenAddress);
        _setEpochLength(_epochLength);

        emit AdminParamsChanged(
            _cap,
            _buffer,
            _currentShares,
            _costPerShare,
            _adminFee,
            _withdrawRefundBool,
            _tokenAddress,
            _epochLength,
            block.timestamp
        );
    }

    function setAdminFee(uint256 amount) public onlyAdmin {
        emit AdminFeeChanged(ADMIN_FEE, amount, block.timestamp);
        require(amount >= 0, "VaultWithAdminFeeUpgradeable: Admin fee cannot be negative");
        ADMIN_FEE = amount;
    }

    function mint(address reciever, uint256 amount) public onlyRole(MINTER_ROLE) {
        super._mint(reciever, amount);
    }

    function burn(address reciever, uint256 amount) public onlyRole(MINTER_ROLE) {
        super._burn(reciever, amount);
    }

    function pause() external onlyAdmin {
        super._pause();
    }

    function unpause() external onlyAdmin {
        super._unpause();
    }

    function toggleWithdrawAdminFeeRefund() external onlyAdmin {
        // in case the pool of tokens gets too large it will attract flash loans if the price of the pool token dips below x-admin fee
        // in that case or if the admin fee changes in cases of 1k+ validators
        // we may need to disable the withdraw refund

        // We also need to toggle this on if post migration we want to allow users to withdraw funds
        disableWithdrawRefund = !disableWithdrawRefund;
    }

    function withdrawAdminFee(uint256 amount) external onlyAdmin nonReentrant {
        address payable sender = payable(_msgSender());
        if (amount == 0) {
            amount = adminFeeTotal;
        }
        require(amount <= adminFeeTotal, "VaultWithAdminFeeUpgradeable:: More than adminFeeTotal cannot be withdrawn");
        adminFeeTotal = adminFeeTotal.sub(amount);
        AddressUpgradeable.sendValue(sender, amount);
    }

    uint256[50] private ______gap;
}
