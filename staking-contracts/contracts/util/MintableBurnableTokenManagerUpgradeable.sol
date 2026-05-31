// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;
pragma experimental ABIEncoderV2;

import {IERC20MintableBurnable} from "../interfaces/IERC20MintableBurnable.sol";
import {AddressUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract MintableBurnableTokenManagerUpgradeable is Initializable {
    /* ========== STATE VARIABLES ========== */
    address public tokenAddress;
    IERC20MintableBurnable public mintableBurnableToken;

    event MintableBurnableTokenAddressChanged(address oldAddrs, address newAddrs);

    function __MintableBurnableTokenManagerUpgradeable_init(address _tokenAddress) internal initializer {
        __MintableBurnableTokenManagerUpgradeable_init_unchained(_tokenAddress);
    }

    function __MintableBurnableTokenManagerUpgradeable_init_unchained(address _tokenAddress) internal initializer {
        _setTokenAddress(_tokenAddress);
    }

    function _setTokenAddress(address _tokenAddress) internal {
        emit MintableBurnableTokenAddressChanged(tokenAddress, _tokenAddress);
        tokenAddress = _tokenAddress;
        mintableBurnableToken = IERC20MintableBurnable(tokenAddress);
    }

    function _mint(address reciever, uint256 amount) internal {
        mintableBurnableToken.mint(reciever, amount);
    }

    function _burn(address reciever, uint256 amount) internal {
        require(
            mintableBurnableToken.balanceOf(reciever) >= amount,
            "VaultWithMintableTokenUpgradeable: Sender balance not enough"
        );
        mintableBurnableToken.burn(reciever, amount);
    }

    uint256[50] private ______gap;
}
