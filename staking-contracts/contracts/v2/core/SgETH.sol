// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;
import {ERC20MintableBurnableByMinter} from "../lib/ERC20MintableBurnableByMinter.sol";
import {Errors} from "../lib/Errors.sol";

/// @title SgETH - SharedStake Governed Staked Ether
/// @author @ChimeraDefi - admin@sharedstake.org - chimera_defi@protonmail.com
contract SgETH is ERC20MintableBurnableByMinter {
    constructor() ERC20MintableBurnableByMinter("SharedStake Governed Staked Ether", "sgETH") {
        // Set the admin of the minter role; this causes the grant and revole role fns to gaurd to this admin role
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // Adds whitelisted minters - only callable by DEFAULT_ADMIN_ROLE enforced in OZ dep
    function addMinter(address minterAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (minterAddress != address(0)) {
            grantRole(MINTER, minterAddress);
        } else {
            revert Errors.ZeroAddress();
        }
    }

    // Remove a minter - only callable by DEFAULT_ADMIN_ROLE enforced internally
    function removeMinter(address minterAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        // oz uses maps so 0 address will return true but does not break anything
        revokeRole(MINTER, minterAddress);
    }

    // Transfer ownership of who can add/rm minters
    function transferOwnership(address newOwner) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newOwner == address(0)) {
            revert Errors.ZeroAddress();
        }

        grantRole(DEFAULT_ADMIN_ROLE, newOwner);
        renounceRole(DEFAULT_ADMIN_ROLE, msg.sender); // permission gaurded via revert if called lacks role
    }
}
