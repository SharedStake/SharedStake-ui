// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2 <0.9.0;

import {WithdrawalQueueV2} from "contracts/v2/modular-staking/WithdrawalQueueV2.sol";
import {Snapshots} from "./Snapshots.sol";
import {PropertiesAsserts} from "./utils/PropertiesAsserts.sol";

abstract contract Properties is PropertiesAsserts, Snapshots {
    function property_totalSupplyEqualsTotalPooled() public view returns (bool) {
        uint256 totalPooled = stToken.totalPooledEther();
        uint256 pooledByShares = stToken.getPooledEthByShares(stToken.getTotalShares());
        return pooledByShares <= totalPooled && totalPooled - pooledByShares <= 1;
    }

    function property_queueUnclaimedMatchesPendingPlusLocked() public view returns (bool) {
        uint256 sum;
        uint256 nextId = withdrawalQueueV2.nextRequestId();
        for (uint256 id = 1; id < nextId; id++) {
            WithdrawalQueueV2.WithdrawalRequest memory req = withdrawalQueueV2.getRequest(id);
            if (!req.claimed) sum += req.ethAmount;
        }
        return withdrawalQueueV2.totalUnclaimedEther() == sum;
    }

    function property_queueBalanceCoversFinalizedClaims() public view returns (bool) {
        return address(withdrawalQueueV2).balance >=
            withdrawalQueueV2.lockedEther() + withdrawalQueueV2.totalPendingRefunds();
    }

    function property_oldVeth2QueueBalanceCoversFinalizedClaims() public view returns (bool) {
        return address(oldVeth2WithdrawalQueue).balance >=
            oldVeth2WithdrawalQueue.lockedEther() + oldVeth2WithdrawalQueue.totalPendingRefunds();
    }

    function property_oldVeth2PendingBackedByCustody() public view returns (bool) {
        return oldVeth2.balanceOf(address(oldVeth2WithdrawalQueue)) >= oldVeth2WithdrawalQueue.pendingVeth2();
    }

    function property_oldVeth2ClaimedAndLockedCoveredByFinalized() public view returns (bool) {
        return oldVeth2WithdrawalQueue.totalClaimedEth() + oldVeth2WithdrawalQueue.lockedEther() <=
            oldVeth2WithdrawalQueue.totalFinalizedEth();
    }

    function property_moduleAccountingMatchesBufferedPlusBeacon() public view returns (bool) {
        bytes32[] memory moduleIds = new bytes32[](1);
        moduleIds[0] = SOLO;
        uint256 routerBeaconBaseline = stakingRouter.moduleBeaconBalance(SOLO);
        uint256 moduleBeaconBalance = validatorModule.beaconBalance();
        uint256 maxPendingPrincipal = ghosts.validatorsPushed * 32 ether;
        return routerBeaconBaseline >= moduleBeaconBalance
            && routerBeaconBaseline - moduleBeaconBalance <= maxPendingPrincipal
            && stakingRouter.totalEthOf(moduleIds) == validatorModule.totalEth();
    }

    function property_zeroBackingRequiresRecordedInsolvency() public view returns (bool) {
        if (stToken.getTotalShares() == 0 || stToken.totalPooledEther() > 0) return true;
        return ghosts.insolvencyObserved;
    }

    function property_postInsolvencyDepositsBlocked() public returns (bool) {
        if (stToken.getTotalShares() == 0 || stToken.totalPooledEther() != 0) return true;

        try stakingRouter.submit{value: MIN_WITHDRAWAL}(address(0)) returns (uint256) {
            return false;
        } catch {
            return true;
        }
    }

    function property_actorClaimsDoNotExceedPool() public view returns (bool) {
        return sumActorStTokenBalances() <= stToken.totalPooledEther() + 1;
    }

    function prop_depositIncreasesActorShares(uint256 sharesBefore) internal {
        gte(stToken.sharesOf(actor), sharesBefore, "deposit must not reduce actor shares");
    }

    function prop_wrapPreservesActorClaim(uint256 stBefore, uint256 wstBefore) internal {
        uint256 stAfter = stToken.balanceOf(actor);
        uint256 wstAfter = wstToken.getStTokenByWstToken(wstToken.balanceOf(actor));
        gte(stAfter + wstAfter + 1, stBefore + wstBefore, "wrap should preserve actor claim within rounding");
    }
}
