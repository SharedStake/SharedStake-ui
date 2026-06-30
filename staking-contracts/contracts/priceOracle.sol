// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;
pragma experimental ABIEncoderV2;
// pragma experimental SMTChecker;

import {OwnershipRolesTemplate} from "./util/OwnershipRolesTemplate.sol";
import {PriceOracleUpgradeable} from "./util/PriceOracleUpgradeable.sol";

contract PriceOracle is OwnershipRolesTemplate, PriceOracleUpgradeable {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    modifier canSetPrice() {
        _checkCanSetPrice();
        _;
    }

    function initialize(uint256 _costPerShare) external initializer {
        __OwnershipRolesTemplate_init();
        __PriceOracleUpgradeable_init_unchained(_costPerShare);
        _setupRole(ORACLE_ROLE, _msgSender());
    }

    // Set the virtual price in the oracle
    function setCostPerShare(uint256 _costPerShare) external canSetPrice whenNotPaused {
        _setCostPerShare(_costPerShare);
    }

    function _checkCanSetPrice() private view {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()) ||
                hasRole(GOVERNANCE_ROLE, _msgSender()) ||
                hasRole(ORACLE_ROLE, _msgSender()),
            "PO:NA"
        );
    }
}
