// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2 <0.9.0;

import {Properties} from "../Properties.sol";
import {vm} from "../utils/Hevm.sol";

abstract contract StakingRouterHandler is Properties {
    function stakingRouter_submit_clamped(uint256 actorSeed, uint256 amount) public {
        address selected = selectActor(actorSeed);
        amount = clampBetween(amount, 0.01 ether, MAX_HANDLER_DEPOSIT);
        vm.deal(selected, amount);

        uint256 sharesBefore = stToken.sharesOf(selected);
        snapshotBefore();
        vm.prank(selected);
        stakingRouter.submit{value: amount}(address(0));
        snapshotAfter();

        ghosts.totalDeposited += amount;
        prop_depositIncreasesActorShares(sharesBefore);
    }

    function stakingRouter_submitToModule_clamped(uint256 actorSeed, uint256 amount) public {
        address selected = selectActor(actorSeed);
        amount = clampBetween(amount, 0.01 ether, MAX_HANDLER_DEPOSIT);
        vm.deal(selected, amount);

        uint256 sharesBefore = stToken.sharesOf(selected);
        snapshotBefore();
        vm.prank(selected);
        stakingRouter.submitToModule{value: amount}(SOLO, address(0));
        snapshotAfter();

        ghosts.totalDeposited += amount;
        prop_depositIncreasesActorShares(sharesBefore);
    }

    function stakingRouter_secondary(uint8 selector, uint256 arg0) public {
        selector = uint8(selector % 2);
        if (selector == 0) _stakingRouter_setMaxDeltaBps(arg0);
        else _stakingRouter_enableCodeHashEnforcement();
    }

    function stakingRouter_submit(address referral) public payable {
        if (msg.value == 0) return;
        snapshotBefore();
        stakingRouter.submit{value: msg.value}(referral);
        snapshotAfter();
        ghosts.totalDeposited += msg.value;
    }

    function stakingRouter_submitToModule(bytes32 moduleId, address referral) public payable {
        if (msg.value == 0 || moduleId != SOLO) return;
        snapshotBefore();
        stakingRouter.submitToModule{value: msg.value}(moduleId, referral);
        snapshotAfter();
        ghosts.totalDeposited += msg.value;
    }

    function _stakingRouter_setMaxDeltaBps(uint256 bps) internal {
        bps = clampBetween(bps, 0, 1000);
        vm.prank(gov);
        stakingRouter.setMaxDeltaBps(bps);
    }

    function _stakingRouter_enableCodeHashEnforcement() internal {
        if (stakingRouter.enforceModuleCodeHashAllowlist()) return;

        bytes32 moduleType = validatorModule.moduleType();
        bytes32 codeHash = validatorModule.implementationCodeHash();
        vm.prank(gov);
        stakingRouter.setModuleCodeHashAllowed(moduleType, codeHash, true);
        vm.prank(gov);
        stakingRouter.enableCodeHashEnforcement();
    }
}
