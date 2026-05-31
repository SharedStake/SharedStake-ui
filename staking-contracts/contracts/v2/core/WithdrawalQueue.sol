// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.20;

import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

import {FIFOQueue} from "../lib/FIFOQueue.sol";
import {Errors} from "../lib/Errors.sol";
import {OperatorSettable} from "../lib/OperatorSettable.sol";
import {GranularPause} from "../lib/GranularPause.sol";
import {SharedDepositMinterV2} from "./SharedDepositMinterV2.sol";

/**
 * @title WithdrawalQueue
 * @author @ChimeraDefi - chimera_defi@protonmail.com | sharedstake.org
 * @dev -
 * ERC-7540 inspired withdrawal contract
 * This contract is designed to be used with SharedDepositMinterV2 contract
 * As a module extension that adds 7540 methods requestRedeem and redeem
 * Example flow ->
 * user calls requestRedeem(user, user, userShares)
 * user calls setOperator(admin OR protocol provided keeper, true)
 * admin can now call redeem on the users behalf if needed after epoch
 * user calls redeem(user, user, userShares) after waiting for epoch
 * Caveats:
 * If the user requests another redemption, before fulfillment,
 * this resets the epoch length clock for their request
 * Basic upgrade path:
 * 1. Call togglePause(1), this disables the requestRedeem fn so no new requests
 * 2. Deploy new contract, direct users to it
 * 3. Fulfill any remaining redeemRequests i.e. totalPendingRequest,
 * for all RedeemRequest events from requestsFulfilled to requestsCreated
 */
contract WithdrawalQueue is AccessControl, ReentrancyGuard, GranularPause, FIFOQueue, OperatorSettable {
    using Address for address payable;

    struct Request {
        address requester;
        uint256 shares;
    }
    // SharedDepositMinterV2 public immutable MINTER;
    address public immutable MINTER;
    address public immutable WSGETH;

    uint256 internal totalPendingRequest;
    uint256 internal requestsCreated;
    uint256 internal requestsFulfilled;
    uint256 public totalAssetsOut;

    bytes32 public constant GOV = keccak256("GOV"); // Governance for settings - normally timelock controlled by multisig

    mapping(uint256 => Request) internal requests;
    mapping(address => uint256) public redeemRequests;

    event RedeemRequest(
        address indexed requester,
        address indexed owner,
        uint256 indexed requestId,
        address operator,
        uint256 assets
    );
    event Redeem(address indexed requester, address indexed receiver, uint256 shares, uint256 assets);
    event CancelRedeem(address indexed requester, address indexed receiver, uint256 shares, uint256 assets);

    constructor(address _minter, address _wsgEth, uint256 _epochLength, address _governance) FIFOQueue(_epochLength) {
        if (_minter == address(0) || _wsgEth == address(0) || _governance == address(0)) {
            revert Errors.ZeroAddress();
        }

        MINTER = _minter;
        WSGETH = _wsgEth;

        uint256 maxUint256 = 2 ** 256 - 1;

        IERC20(WSGETH).approve(_minter, maxUint256);

        _grantRole(GOV, _governance);
    }

    /// @notice Requests a redemption of vault assets.
    /// @dev This function must be called by either the owner or an operator of the vault, and is only allowed when the contract is not paused.

    /// @param shares The number of shares to redeem.
    /// @param requester The address requesting the redemption.
    /// @param owner The owner of the vault being redeemed from.

    /// @return requestId The unique ID assigned to this redemption request.
    function requestRedeem(
        uint256 shares,
        address requester,
        address owner
    ) external onlyOwnerOrOperator(owner) nonReentrant whenNotPaused(uint16(1)) returns (uint256 requestId) {
        if (shares == 0) {
            revert Errors.InvalidAmount();
        }
        IERC20(WSGETH).transferFrom(owner, address(this), shares); // asset here is the Vault underlying asset

        requestId = requestsCreated++;
        requests[requestId] = Request({requester: requester, shares: shares});
        // use assets for tracking
        uint256 assets = IERC4626(WSGETH).previewRedeem(shares);

        _stakeForWithdrawal(owner, assets);
        totalPendingRequest += assets;
        redeemRequests[requester] += assets; // underflow would revert if not enough claimable shares

        emit RedeemRequest(requester, owner, requestId, msg.sender, shares);
    }

    /// @notice Allows a user to redeem their vault shares.
    /// @dev This function must be called by either the owner or an operator of the requester's vault, and is only allowed when the contract is not paused.

    /// @param shares The number of shares to redeem.
    /// @param receiver The address that will receive the redeemed assets.
    /// @param requester The address requesting the redemption.

    /// @return assets The amount of assets that were successfully redeemed.
    function redeem(
        uint256 shares,
        address receiver,
        address requester
    ) external onlyOwnerOrOperator(requester) nonReentrant whenNotPaused(uint16(2)) returns (uint256 assets) {
        if (shares == 0) {
            revert Errors.InvalidAmount();
        }

        assets = IERC4626(WSGETH).previewRedeem(shares);

        // checks if we have enough assets to fulfill the request and if epoch has passed
        if (claimableRedeemRequest(requester) < assets) {
            _checkWithdraw(requester, totalBalance(), assets);
            return 0; // should never happen. previous fn will generate a rich error
        }

        _withdraw(requester, assets);
        // Treat everything as claimableRedeemRequest and validate here if there's adequate funds
        redeemRequests[requester] -= assets; // underflow would revert if not enough claimable shares
        totalPendingRequest -= assets;
        // Track total returned
        totalAssetsOut += assets;
        requestsFulfilled++;

        uint256 minterBalance = MINTER.balance;
        // This feels suboptimal, but is the easiest way to always burn the token on redemptions
        if (assets > minterBalance) {
            uint256 diff = assets - minterBalance;
            // We need to use donate/transfer etc. cant deposit and mint more shares as that messes up accouting
            payable(MINTER).transfer(diff);
        }

        // Always burn redeemed tokens
        SharedDepositMinterV2(payable(MINTER)).unstakeAndWithdraw(shares, receiver);

        emit Redeem(requester, receiver, shares, assets);
    }

    /// @notice Cancel a redeem request and return funds to owner. Can only be done after the epoch has expired
    function cancelRedeem(
        address receiver,
        address requester
    ) external onlyOwnerOrOperator(requester) nonReentrant whenNotPaused(uint16(3)) returns (uint256 assets) {
        uint256 shares = pendingRedeemRequest(requester);
        assets = IERC4626(WSGETH).previewRedeem(shares);

        if (shares == 0) {
            revert Errors.InvalidAmount();
        }

        _verifyEpochHasElapsed(requester);

        // checks if we have enough assets to fulfill the request and if epoch has passed
        if (claimableRedeemRequest(requester) < assets) {
            _checkWithdraw(requester, totalBalance(), assets);
            return 0; // should never happen. previous fn will generate a rich error
        }

        // Treat everything as claimableRedeemRequest and validate here if there's adequate funds
        redeemRequests[requester] -= assets; // underflow would revert if not enough claimable shares
        totalPendingRequest -= assets;
        _withdraw(requester, assets);
        IERC20(WSGETH).transfer(receiver, shares); // asset here is the Vault underlying asset

        emit CancelRedeem(requester, receiver, shares, assets);
    }

    function togglePause(uint16 func) external onlyRole(GOV) {
        bool paused = paused[func];
        if (paused) {
            _unpause(func);
        } else {
            _pause(func);
        }
    }

    function setEpochLength(uint256 value) external onlyRole(GOV) {
        _setEpochLength(value);
    }

    function pendingRedeemRequest(address owner) public view returns (uint256 shares) {
        return redeemRequests[owner];
    }

    // claimableRedeemRequest - returns owners shares in claimable state,
    // i.e. epoch has elapsed and sufficient funds exist
    function claimableRedeemRequest(address owner) public view returns (uint256 shares) {
        if (redeemRequests[owner] > 0 && _isWithdrawalAllowed(owner, totalBalance(), redeemRequests[owner])) {
            return redeemRequests[owner];
        } else {
            return 0;
        }
    }

    function totalBalance() internal view returns (uint256) {
        return address(this).balance + MINTER.balance;
    }

    receive() external payable {} // solhint-disable-line

    fallback() external payable {} // solhint-disable-line
}
