// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;
pragma experimental ABIEncoderV2;
// pragma experimental SMTChecker;

import {OwnershipRolesTemplate} from "./util/OwnershipRolesTemplate.sol";
import {MintableBurnableTokenManagerUpgradeable} from "./util/MintableBurnableTokenManagerUpgradeable.sol";

// A token manager proxy
// - Controls minting and burning of underlying token
// - Allow role based permissions for emergency stops
// - Allow role based permissions for adding smart contracts that can mint/burn the token
// - This should theoretically allow reuse of the pre-deployed vETH2 contract if deemed suitable
contract TokenManager is OwnershipRolesTemplate, MintableBurnableTokenManagerUpgradeable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    bool public minterTransferPetrified;

    event RecievedControlOfMinterRights(address indexed _from, uint256 amount);
    event TokenMinterRightsTransfer(address indexed _to);

    modifier onlyMinter() {
        require(hasRole(MINTER_ROLE, _msgSender()), "TM:NA");
        _;
    }

    function initialize(address _tokenAddress) external initializer {
        __OwnershipRolesTemplate_init();
        __MintableBurnableTokenManagerUpgradeable_init_unchained(_tokenAddress);
        _setupRole(MINTER_ROLE, _msgSender());
    }

    // migration function to accept old monies and copy over state
    // users should not use this as it just donates the money without minting veth or tracking donations
    // Edit: Was found to be a vulnerability in audits/immunefi bug bounties so it doesnt do anything but is reqd to pass minter control
    function donate(uint256 shares) external payable nonReentrant {
        emit RecievedControlOfMinterRights(_msgSender(), shares);
    }

    function setTokenAddress(address _address) external onlyAdminOrGovernance {
        _setTokenAddress(_address);
    }

    function mint(address recv, uint256 amt) external onlyMinter whenNotPaused nonReentrant {
        _mint(recv, amt);
    }

    function burn(address recv, uint256 amt) external onlyMinter whenNotPaused nonReentrant {
        _burn(recv, amt);
    }

    function petrifyMinterTransfer() external onlyAdminOrGovernance {
        minterTransferPetrified = true;
    }

    function transferTokenMinterRights(address payable minter_) external onlyAdminOrGovernance {
        require(!minterTransferPetrified, "TM:NA");
        require(minter_ != address(0), "TM:0A");
        mintableBurnableToken.setMinter(minter_);
        emit TokenMinterRightsTransfer(minter_);
    }
}
