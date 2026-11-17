// SPDX-License-Identifier: MIT

// Cloned from fei/rari ERC4626 impl https://github.com/fei-protocol/ERC4626/blob/main/src/interfaces/IxERC4626.sol
// @ChimeraDefi Jun 2023

// Rewards logic inspired by xERC20 (https://github.com/ZeframLou/playpen/blob/main/src/xERC20.sol)

pragma solidity ^0.8.0;

interface IWSGEth {
    // Takes X(n=assets) ETH and returns Y(n=shares) wsgETH
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);

    // Takes assets wsgETH and returns shares sgETH
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);
}
