// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2 <0.9.0;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {Handlers} from "./handlers/Handlers.sol";

/// @notice Contract to be used for quick testing with Foundry
contract FoundryTester is Test, Handlers {
    modifier asActor() override {
        vm.startPrank(actor);
        _;
        vm.stopPrank();
    }

    function setUp() public {
        setup();
    }

    // forge test --match-test test_sequence -vvv
    function test_sequence() public {
        stakingRouter_submit_clamped(0, 32 ether);
        validatorModule_depositToBeaconChain_clamped(1);
        validatorModule_reportBeacon_clamped(100);
        wstToken_wrap_clamped(0, 1 ether);
        wstToken_unwrap_clamped(0, 0.5 ether);
        withdrawalQueueV2_requestWithdrawals_clamped(0, 0.25 ether, 2);
        withdrawalQueueV2_finalizeWithRefund_clamped(1, 0.1 ether);
        withdrawalQueueV2_withdrawRefund();
        withdrawalQueueV2_claimWithdrawals_clamped(0, 1, 2);

        assertTrue(property_totalSupplyEqualsTotalPooled());
        assertTrue(property_queueUnclaimedMatchesPendingPlusLocked());
        assertTrue(property_queueBalanceCoversFinalizedClaims());
        assertTrue(property_moduleAccountingMatchesBufferedPlusBeacon());
        assertTrue(property_zeroBackingRequiresRecordedInsolvency());
        assertTrue(property_postInsolvencyDepositsBlocked());
        assertTrue(property_actorClaimsDoNotExceedPool());
    }

    // ── Violation Repros ──────────────────────────────────────────────
    // Add test_repro_* functions here when a fuzzer produces a shrunk call
    // sequence that violates a property. Run all with:
    //   forge test --match-contract FoundryTester -vvv
}
