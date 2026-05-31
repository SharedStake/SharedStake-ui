// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;
pragma experimental ABIEncoderV2;
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {SafeMathUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";

contract PriceOracleUpgradeable is Initializable {
    uint256 public costPerShare; // cost per share in 1e18
    uint256 public lastCostPerShare;
    event SharePriceChanged(uint256 lastPrice, uint256 newPrice);

    function getCostPerShare() public view returns (uint256 _costPerShare) {
        return costPerShare;
    }

    function __PriceOracleUpgradeable_init(uint256 _costPerShare) internal initializer {
        __PriceOracleUpgradeable_init_unchained(_costPerShare);
    }

    function __PriceOracleUpgradeable_init_unchained(uint256 _costPerShare) internal initializer {
        _setCostPerShare(_costPerShare);
    }

    function _setCostPerShare(uint256 amount) internal {
        require(amount > 0, "PriceOralce: need costPerShare>0");
        lastCostPerShare = costPerShare;
        costPerShare = amount;
        emit SharePriceChanged(lastCostPerShare, costPerShare);
    }

    uint256[50] private ______gap;
}
