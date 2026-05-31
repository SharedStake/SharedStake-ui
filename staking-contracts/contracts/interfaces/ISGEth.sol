// SPDX-License-Identifier: MIT
// @ChimeraDefi Jun 2023
pragma solidity ^0.8.0;

interface ISGEth {
  function burn(address addr, uint256 amt) external;
  function approve(address spender, uint256 amount) external returns (bool);
  function mint(address addr, uint256 amt) external;
}

//  |  SharedDepositMinterV2                    ·       8.78  │