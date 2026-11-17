// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2 <0.9.0;

import {Properties} from "../Properties.sol";
import {vm} from "../utils/Hevm.sol";

abstract contract ValidatorModuleHandler is Properties {
    function validatorModule_depositToBeaconChain_clamped(uint256 validatorsSeed) public {
        uint256 maxByBuffer = validatorModule.bufferedEther() / 32 ether;
        if (maxByBuffer == 0) return;
        uint256 validators = clampBetween(validatorsSeed, 1, maxByBuffer > 4 ? 4 : maxByBuffer);

        for (uint256 i; i < validators; i++) {
            uint256 seed = ghosts.validatorsPushed + 1;
            bytes memory pubkey = makeBytes(seed, 48);
            bytes memory creds = withdrawalCredentialsBytes();
            bytes memory signature = makeBytes(seed + 10_000, 96);
            bytes32 root = keccak256(abi.encode(seed, "deposit-root"));

            vm.prank(gov);
            validatorModule.approvePubkey(pubkey);
            vm.prank(nodeOperator);
            validatorModule.depositToBeaconChain(pubkey, creds, signature, root);
            ghosts.validatorsPushed += 1;
        }
    }

    function validatorModule_reportBeacon_clamped(uint256 gainBpsSeed) public {
        uint256 validators = validatorModule.beaconValidators();
        if (validators == 0) validators = ghosts.validatorsPushed;
        if (validators == 0) return;

        uint256 currentBalance = validatorModule.beaconBalance();
        if (currentBalance == 0) currentBalance = stakingRouter.moduleBeaconBalance(SOLO);
        if (currentBalance == 0) return;

        uint256 gainBps = clampBetween(gainBpsSeed, 0, 1000);
        uint256 newBalance = currentBalance + ((currentBalance * gainBps) / 10000);
        bool insolvent = _wouldMakePoolInsolvent(newBalance);

        vm.prank(gov);
        stakingRouter.setMaxDeltaBps(1000);
        vm.prank(oracle);
        validatorModule.reportBeacon(validators, newBalance);
        if (insolvent) ghosts.insolvencyObserved = true;
        ghosts.successfulReports += 1;
    }

    function validatorModule_reportBeaconLoss_clamped(uint256 lossBpsSeed, uint256 exitSeed) public {
        uint256 validators = validatorModule.beaconValidators();
        if (validators == 0) validators = ghosts.validatorsPushed;
        if (validators == 0) return;

        uint256 currentBalance = validatorModule.beaconBalance();
        if (currentBalance == 0) currentBalance = stakingRouter.moduleBeaconBalance(SOLO);
        if (currentBalance == 0) return;

        uint256 exitedValidators = clampBetween(exitSeed, 0, validators);
        uint256 newValidators = validators - exitedValidators;
        uint256 lossBps = clampBetween(lossBpsSeed, 1, 10000);
        uint256 balanceAfterLoss = currentBalance - ((currentBalance * lossBps) / 10000);
        uint256 maxPlausible = newValidators == 0 ? 0 : (newValidators * 32 ether * 3) / 2;
        uint256 newBalance = balanceAfterLoss > maxPlausible ? maxPlausible : balanceAfterLoss;
        bool insolvent = _wouldMakePoolInsolvent(newBalance);

        vm.prank(oracle);
        validatorModule.reportBeacon(newValidators, newBalance);
        if (insolvent) ghosts.insolvencyObserved = true;
        ghosts.successfulReports += 1;
    }

    function validatorModule_depositToBeaconChain(
        bytes memory pubkey,
        bytes memory withdrawalCredentials,
        bytes memory signature,
        bytes32 depositDataRoot
    ) public {
        if (validatorModule.bufferedEther() < 32 ether) return;
        if (pubkey.length != 48) pubkey = makeBytes(ghosts.validatorsPushed + 1, 48);
        if (withdrawalCredentials.length != 32) withdrawalCredentials = withdrawalCredentialsBytes();
        if (signature.length != 96) signature = makeBytes(ghosts.validatorsPushed + 10_001, 96);

        vm.prank(gov);
        validatorModule.approvePubkey(pubkey);
        vm.prank(nodeOperator);
        validatorModule.depositToBeaconChain(pubkey, withdrawalCredentials, signature, depositDataRoot);
        ghosts.validatorsPushed += 1;
    }

    function validatorModule_reportBeacon(uint256 validators, uint256 balance) public {
        uint256 currentValidators = validatorModule.beaconValidators();
        if (currentValidators == 0) currentValidators = ghosts.validatorsPushed;
        if (currentValidators == 0) return;
        validators = clampBetween(validators, 0, currentValidators);
        uint256 currentBalance = validatorModule.beaconBalance();
        if (currentBalance == 0) currentBalance = stakingRouter.moduleBeaconBalance(SOLO);
        if (currentBalance == 0) return;
        uint256 maxByGain = currentBalance + ((currentBalance * 1000) / 10000);
        uint256 maxPlausible = validators == 0 ? 0 : (validators * 32 ether * 3) / 2;
        uint256 maxBalance = maxByGain > maxPlausible ? maxPlausible : maxByGain;
        balance = clampBetween(balance, 0, maxBalance);
        bool insolvent = _wouldMakePoolInsolvent(balance);

        vm.prank(gov);
        stakingRouter.setMaxDeltaBps(1000);
        vm.prank(oracle);
        validatorModule.reportBeacon(validators, balance);
        if (insolvent) ghosts.insolvencyObserved = true;
        ghosts.successfulReports += 1;
    }

    function _wouldMakePoolInsolvent(uint256 newBeaconBalance) internal view returns (bool) {
        uint256 prior = stakingRouter.moduleBeaconBalance(SOLO);
        if (newBeaconBalance >= prior) return false;
        return stToken.totalPooledEther() <= prior - newBeaconBalance;
    }
}
