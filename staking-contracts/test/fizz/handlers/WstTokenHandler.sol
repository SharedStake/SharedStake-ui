// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2 <0.9.0;

import {Properties} from "../Properties.sol";
import {vm} from "../utils/Hevm.sol";

abstract contract WstTokenHandler is Properties {
    function wstToken_wrap_clamped(uint256 actorSeed, uint256 stAmount) public {
        address selected = selectActor(actorSeed);
        uint256 balance = stToken.balanceOf(selected);
        if (balance == 0) return;
        stAmount = clampBetween(stAmount, 1, balance);
        wstToken_wrap(stAmount);
    }

    function wstToken_unwrap_clamped(uint256 actorSeed, uint256 wstAmount) public {
        address selected = selectActor(actorSeed);
        uint256 balance = wstToken.balanceOf(selected);
        if (balance == 0) return;
        wstAmount = clampBetween(wstAmount, 1, balance);
        wstToken_unwrap(wstAmount);
    }

    function wstToken_wrap(uint256 stAmount) public {
        uint256 stBefore = stToken.balanceOf(actor);
        uint256 wstBefore = wstToken.getStTokenByWstToken(wstToken.balanceOf(actor));
        if (stBefore == 0) return;
        stAmount = clampBetween(stAmount, 1, stBefore);

        vm.startPrank(actor);
        stToken.approve(address(wstToken), stAmount);
        wstToken.wrap(stAmount);
        vm.stopPrank();

        prop_wrapPreservesActorClaim(stBefore, wstBefore);
    }

    function wstToken_unwrap(uint256 wstAmount) public {
        uint256 balance = wstToken.balanceOf(actor);
        if (balance == 0) return;
        wstAmount = clampBetween(wstAmount, 1, balance);

        vm.prank(actor);
        wstToken.unwrap(wstAmount);
    }
}
