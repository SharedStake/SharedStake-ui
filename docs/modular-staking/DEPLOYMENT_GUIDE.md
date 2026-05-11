# SharedStake V2 — Governance & Referral Deployment Guide

**Date:** 2026-05-11
**Branch:** `feat/sharedstake-v2-modular-staking-master`

## Deployment Order

### Phase 1: Core Contracts (already deployed)
1. `StToken`
2. `StakingRouter`
3. `StakingCore`
4. `WithdrawalQueueV2`
5. `FeeController`
6. `ValidatorModule` / `LSTWrapModule` / `DVTModule`
7. `OracleAdapter` / `QuorumOracleAdapter`

### Phase 2: Governance Infrastructure

#### Step 1: Deploy SGTv2 (if not already deployed)
```solidity
SGTv2 sgt = new SGTv2(
    "SharedStake Governance Token",
    "SGT",
    100_000_000e18, // 100M initial supply
    deployer        // owner
);
```

#### Step 2: Deploy GovernanceTimelock
```solidity
address[] memory proposers = new address[](1);
address[] memory executors = new address[](1);
// Initially empty — Governor will be granted PROPOSER after deploy
GovernanceTimelock timelock = new GovernanceTimelock(
    48 * 60 * 60,   // 48 hour min delay
    proposers,      // empty initially
    executors,      // empty initially
    deployer        // admin for setup
);
```

#### Step 3: Deploy VoteEscrowV2
```solidity
VoteEscrowV2 veSgt = new VoteEscrowV2(
    "Vote Escrow SGT",
    "veSGT",
    address(sgt),
    1e18,           // minLockedAmount: 1 SGT
    address(timelock) // GOV = timelock from day one
);
```

#### Step 4: Deploy SharedStakeGovernor
```solidity
SharedStakeGovernor governor = new SharedStakeGovernor(
    IVotes(address(veSgt)),
    timelock
);
```

#### Step 5: Wire Timelock Roles
```solidity
timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));
timelock.grantRole(timelock.EXECUTOR_ROLE(), address(governor));
// Optional: grant EXECUTOR to guardian multisig for emergency execution
timelock.grantRole(timelock.EXECUTOR_ROLE(), guardianMultisig);
timelock.grantRole(timelock.CANCELLER_ROLE(), guardianMultisig);
```

#### Step 6: Renounce Timelock Admin
```solidity
timelock.renounceRole(timelock.TIMELOCK_ADMIN_ROLE(), deployer);
```

#### Step 7: Transfer Protocol GOV Roles to Timelock

For EACH protocol contract:
```solidity
stakingRouter.grantRole(stakingRouter.GOV(), address(timelock));
stakingRouter.renounceRole(stakingRouter.DEFAULT_ADMIN_ROLE(), deployer);

stakingCore.grantRole(stakingCore.GOV(), address(timelock));
stakingCore.renounceRole(stakingCore.DEFAULT_ADMIN_ROLE(), deployer);

withdrawalQueue.grantRole(withdrawalQueue.GOV(), address(timelock));
withdrawalQueue.renounceRole(withdrawalQueue.DEFAULT_ADMIN_ROLE(), deployer);

feeController.grantRole(feeController.GOV(), address(timelock));
feeController.renounceRole(feeController.DEFAULT_ADMIN_ROLE(), deployer);

oracleAdapter.grantRole(oracleAdapter.GOV(), address(timelock));
oracleAdapter.renounceRole(oracleAdapter.DEFAULT_ADMIN_ROLE(), deployer);

validatorModule.grantRole(validatorModule.GOV(), address(timelock));
validatorModule.renounceRole(validatorModule.DEFAULT_ADMIN_ROLE(), deployer);

// StToken special case — transferAdmin handles MINTER revocation
stToken.transferAdmin(address(timelock));
```

### Phase 3: Referral System

#### Step 8: Deploy ReferralRegistry
```solidity
ReferralRegistry registry = new ReferralRegistry(
    address(timelock) // GOV = timelock
);
```

#### Step 9: Wire ReferralRegistry to FeeController
```solidity
feeController.setRecipients(
    treasuryAddress,
    operatorAddress,
    address(registry)
);
```

#### Step 10: Grant Router Role to StakingRouter
```solidity
registry.grantRole(registry.ROUTER(), address(stakingRouter));
registry.grantRole(registry.FEE_CTRL(), address(stakingRouter));
```

#### Step 11: Set Fee Token
```solidity
registry.setFeeToken(address(stToken));
```

### Phase 4: ValidatorModule Hardening

#### Step 12: Set Expected Withdrawal Credentials
```solidity
// withdrawal_credentials = 32 bytes
// Example: ETH1 address 0x1234... encoded as 0x010000...1234
bytes32 expectedCreds = bytes32(uint256(0x0100000000000000000000001234...));
validatorModule.setExpectedWithdrawalCredentials(expectedCreds);
```

#### Step 13: Lower maxDeltaBps Before Accepting TVL
```solidity
// Default is 1000 (10%). Lower to 100 (1%) before mainnet.
stakingRouter.setMaxDeltaBps(100);
```

### Phase 5: Operational Parameters

#### Step 14: Configure OracleAdapter
```solidity
oracleAdapter.setMaxStaleness(3600);      // 1 hour
oracleAdapter.setMaxDriftBps(100);        // 1% max gain
oracleAdapter.setMaxSlashBps(500);        // 5% max slash
```

#### Step 15: Configure Module Caps
```solidity
stakingRouter.setMintCap(moduleId, 1000 ether);        // 1K ETH cap per module
stakingRouter.setModuleInflowLimit(moduleId, 86400, 100 ether); // 100 ETH/day
```

---

## Socialized Loss Behavior

`StakingRouter._applyBeaconDelta()` handles beacon balance decreases (slashes, penalties):

```solidity
if (newTotalPooledEther <= totalFee) {
    // Pool is insolvent — all ETH gone
    newTotalPooledEther = 0;
    emit PoolInsolvent(moduleId, loss, currentPooled);
}
```

**What this means:**
- If validators are slashed by 100% (extremely rare), the exchange rate drops to 0
- All share holders are wiped out proportionally
- The next depositor resets the pool at 1:1 (bootstrap behavior)
- This is identical to Lido's socialized loss model

**Why it's designed this way:**
- Reverting on insolvency would freeze ALL withdrawals forever
- Clamping to 0 allows recovery (new deposits restart the pool)
- The alternative (pro-rata withdrawal reduction) is implemented in `WithdrawalQueueV2.finalize()`

**BUNKER Mode (future improvement):**
For large slashes (>X%), consider pausing finalization and socializing loss over a longer period, giving the protocol time to recover via MEV or future rewards.

---

## Role Summary After Deployment

| Role | Holder | Can Do | Cannot Do |
|---|---|---|---|
| GOV (all contracts) | GovernanceTimelock | Change params via Governor proposal | Pause (GUARDIAN only) |
| GUARDIAN | Fast-response multisig | Pause any contract | Change params |
| ORACLE | Oracle bot | Submit beacon reports | Exceed maxDeltaBps |
| NODE_OPERATOR | Validator operator | Deposit 32 ETH to beacon | Use wrong withdrawal credentials |
| PROPOSER (timelock) | SharedStakeGovernor | Queue proposals | Execute without delay |
| EXECUTOR (timelock) | Governor + Guardian | Execute after 48h delay | Execute before delay |
| CANCELLER (timelock) | Guardian | Cancel malicious proposals | Execute proposals |

---

## Emergency Procedures

### Guardian Compromise
1. Guardian can pause everything
2. GUARDIAN cannot unpause — only GOV (timelock) can
3. If guardian is compromised, GOV can transfer GUARDIAN to new address via 48h timelock

### GOV/Timelock Compromise
1. Attacker needs 1000+ veSGT to propose
2. Proposal needs 4% quorum (more veSGT votes)
3. 48h timelock before execution
4. Guardian CANCELLER can cancel malicious proposals
5. If timelock is bypassed, GUARDIAN can still pause all contracts

### Oracle Compromise
1. Attacker can inflate beacon balance by up to `maxDeltaBps` per report
2. Default 10% per report, daily reports = rapid compounding possible
3. **Mitigation:** Lower `maxDeltaBps` to 1% before mainnet
4. **Mitigation:** Use QuorumOracleAdapter with multiple independent oracles

---

**Agent:** Codex GPT-5
**Co-authored-by:** Chimera <chimera_defi@protonmail.com>
