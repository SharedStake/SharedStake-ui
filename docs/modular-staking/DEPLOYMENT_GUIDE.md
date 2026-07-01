# SharedStake V2 — Governance & Referral Deployment Guide

**Date:** 2026-05-11
**Branch:** `feat/sharedstake-v2-modular-staking-master`

## Required Non-Local Env Config

Before running `deploy/v2-modular-staking/*` on non-local networks, set:

- `V2_GOVERNANCE_ADDRESS`
- `V2_OPERATOR_ADDRESS` for fee-operator split recipient
- `V2_ORACLE_SUBMITTERS` (comma-separated)
- `V2_NODE_OPERATOR_ADDRESS` if node-operator is not governance
- `V2_SGT_ADDRESS` for governance deployment
- `V2_VALIDATOR_MINT_CAP_ETH` and `V2_DVT_MINT_CAP_ETH`
- Optional quorum override: `V2_QUORUM_ORACLE_QUORUM`
- `V2_STETH_ADDRESS` for StEthPriceOracle Chainlink integration
- `V2_CHAINLINK_STETH_ETH_FEED` for Chainlink stETH/ETH price feed address
- `V2_SGT_ADDRESS` for OperatorRegistry outside local networks
- Optional NFT operator bond credit: `V2_OPERATOR_NFT_ADDRESS` or `NFT_CONTRACT_ADDRESS`, plus `V2_OPERATOR_NFT_SGT_CREDIT`
- Optional operator bond overrides: `V2_OPERATOR_ETH_BOND_PER_SLOT`, `V2_OPERATOR_SGT_BOND_PER_SLOT`, `V2_OPERATOR_MAX_SLOTS`
- Optional dark-launch controls: `V2_MODULES_DARK_LAUNCH`, `V2_VALIDATOR_MODULE_PAUSED`, `V2_DVT_MODULE_PAUSED`, `V2_LST_WRAP_MODULE_PAUSED`
- Optional ERC-4626 wrapper seed override: `V2_WRAPPER_SEED_AMOUNT` in stToken units, default `0.001` on non-local networks. Set to `0` only for an intentionally unseeded wrapper deployment.

Deployment scripts now fail closed on non-local networks when these are missing or inconsistent. Non-local module deployments default to `pauseAfterRegistration=true` unless overridden, so modules can be deployed and verified before governance enables user inflow.

## Deployment Order

### Phase 1: Core Contracts (already deployed)

1. `StToken`
2. `StakingRouter`
3. `StakingCore`
4. `WithdrawalQueueV2`
5. `FeeController`
6. `ValidatorModule` / `LSTWrapModule` / `DVTModule`
7. `OracleAdapter` / `QuorumOracleAdapter`
8. `StTokenERC4626Wrapper`


### Phase 1.1: ERC-4626 Wrapper (included in modular-staking deploy)

`011_stTokenERC4626Wrapper.ts` deploys `StTokenERC4626Wrapper`, a permissionless ERC-4626 vault over `StToken`. It requires no role grants and does not mint, burn, route, or custody ETH on behalf of the protocol. It only wraps user-provided `stToken` into a non-rebasing vault share and unwraps back to `stToken`. ETH exits remain the `WithdrawalQueueV2` request/finalize/claim flow.

The wrapper is shipped as the standards-composable surface for DeFi integrations that expect ERC-4626. It advertises ERC-165 support for `IERC4626` so integrators can detect the vault interface without changing router or withdrawal-queue safety semantics.

On non-local networks the deploy script seeds the wrapper with `V2_WRAPPER_SEED_AMOUNT` stToken, defaulting to `0.001`. The wrapper already inherits OpenZeppelin ERC-4626 virtual assets/shares, which makes donation-inflation attacks non-profitable; the seed further raises the cost of griefing small deposits into zero-share reverts. The deployer must hold at least the seed amount of stToken, or the deploy fails with an explicit funding error. Local hardhat/localhost deploys skip this seed.

ERC-7540 is intentionally not implemented in core V2. `WithdrawalQueueV2` is ERC-7540-inspired but keeps SharedStake-specific request-time value locking, guardian-backed finalization, TURBO/BUNKER modes, and batch claim behavior. If a future integration requires ERC-7540, add a separate adapter/facade over the existing queue instead of rewriting the queue itself.

### Phase 1.2: Withdrawal Queue Accounting Sync (required for router deployments)

Router deployments must wire `WithdrawalQueueV2.accountingSyncer` to `StakingRouter`. The `007_stakingRouter.ts` deploy step does this automatically when `WithdrawalQueueV2` is deployed. This makes withdrawal requests call `StakingRouter.syncAccounting()` before request-time share math, so LST module rebases/depegs are reflected before shares are burned and ETH amounts are locked.

Post-deploy verification checks this wiring. If it is missing, call:

```solidity
withdrawalQueueV2.setAccountingSyncer(address(stakingRouter));
```

### Phase 1.5: Router Module Admission Hardening (required)

Before each module registration, allowlist the module runtime code hash by module type:

```solidity
bytes32 moduleType = module.moduleType();
bytes32 codeHash = extcodehash(address(module));
stakingRouter.setModuleCodeHashAllowed(moduleType, codeHash, true);
```

Enable strict enforcement once at least one module code hash is allowlisted:

```solidity
stakingRouter.enableCodeHashEnforcement();
```

Notes:

- `registerModule(...)` reverts when enforcement is enabled and the module code hash is not allowlisted.
- Router callback surface is now module-type gated:
  - validator-only: `reportModuleBeaconBalance`, `notifyBeaconDeposit`
  - LST-only: `wrapFromModule`, `unwrapToModule`

### Phase 1.6: Dark-Launch Module State (recommended for non-local)

The deploy scripts support deploying modules before opening them to user inflow. On non-local networks, `V2_MODULES_DARK_LAUNCH` defaults to enabled; set a module-specific override only when a module should launch immediately.

| Env var                      | Scope                                  | Default                            |
| ---------------------------- | -------------------------------------- | ---------------------------------- |
| `V2_MODULES_DARK_LAUNCH`     | Global pause-after-registration switch | `true` on non-local, `false` local |
| `V2_VALIDATOR_MODULE_PAUSED` | ValidatorModule override               | inherits global/default            |
| `V2_DVT_MODULE_PAUSED`       | DVTModule override                     | inherits global/default            |
| `V2_LST_WRAP_MODULE_PAUSED`  | LSTWrapModule override                 | inherits global/default            |

Important: `mintCapEth == 0` means unlimited, not disabled. To keep a module off, pause it after registration and avoid making it the default route until governance intentionally enables it.

Governed activation sequence:

```solidity
stakingRouter.setMintCap(moduleId, conservativeCapWei);
stakingRouter.setModuleInflowLimit(moduleId, 86400, dailyLimitWei);
stakingRouter.unpauseModule(moduleId);
// Only for the module that should receive plain submit() flow:
stakingRouter.setDefaultModule(moduleId);
```

`pauseModule` remains a fast `GUARDIAN` action. `unpauseModule`, cap changes, inflow windows, and default-route changes remain `GOV` actions and should execute through Governor/Timelock after handover.

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

#### Vote Escrow Operating Model

VoteEscrowV2 follows the Curve-inspired vote-escrow pattern:

- SGT locks mint non-transferable veSGT voting power.
- The maximum lock is four years (`MAXDAYS = 1460`).
- Duration locks round up to whole-week increments; absolute unlock timestamps round down to whole-week epochs.
- Voting power decays linearly from `locked SGT * remaining lock time / 4 years` to zero.
- Users can add SGT with `increase_amount`, extend duration with `increase_unlock_time`, or extend to an absolute epoch with `increase_unlock_time_to`.
- `getLockStats(account)` exposes personal lock amount, start, end, remaining time, projected voting power, checkpointed voting power, and max power.
- `globalLockStats()` exposes total locked SGT, open lock count, total locks created, aggregate lock commitment, weighted average lock duration, checkpointed voting supply, and max voting supply.
- Keepers or users should call `checkpoint(account)` or `checkpointMany(accounts)` before governance snapshots so checkpointed ERC20Votes power matches projected lock power.

Governance activation proposals for staking modules should be submitted only by sufficiently locked veSGT holders and should execute through Governor -> GovernanceTimelock -> protocol GOV roles.

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

#### Step 8: Deploy ReferralRegistry (via deploy script 017_referralRegistry.ts)

Required environment variables:

- `V2_GOVERNANCE_ADDRESS` (for ReferralRegistry GOV role)
- StToken address (resolved from deployment)

The deploy script:

1. Deploys ReferralRegistry with governance and stToken addresses
2. Grants ROUTER role to StakingCore and StakingRouter
3. Grants FEE_CTRL role to FeeController
4. Wires ReferralRegistry into StakingCore and StakingRouter via setReferralCodeRegistry

```solidity
ReferralRegistry registry = new ReferralRegistry(
    address(timelock), // GOV = timelock
    address(stToken)   // fee token
);
```

#### Step 9: Wire ReferralRegistry to FeeController

Note: This is now handled automatically by deploy script 017_referralRegistry.ts

#### Step 10: Optional Fee Token Rotation (governance only)

```solidity
registry.setFeeToken(address(stToken));
```

#### Step 11: Deploy Referral Backend API

Run the referral backend service (`services/referral-service`) for code lifecycle management:

- create/revoke/list/resolve short codes
- normalize referrer addresses to checksum format
- enforce API-key auth and rate limits

Minimum local bootstrap:

```bash
cd services/referral-service
cp .env.example .env
bun install
bun run prisma:generate
bun run prisma:migrate
bun run seed
bun run dev
```

#### Step 12: Configure Referral Backend Environment

Required env for API:

- `DATABASE_URL`
- `API_KEYS` (comma-separated admin keys)

Required env for read-only onchain sync worker:

- `RPC_URL`
- `ONCHAIN_REFERRAL_REGISTRY_ADDRESS`
- `CHAIN_ID`
- `SYNC_MAX_BLOCK_RANGE` (provider-specific log range limit; default `2000`)

#### Step 13: Run Onchain Sync Worker

The worker is read-only and ingests `DepositRecorded` events for observability:

```bash
cd services/referral-service
bun run worker:sync
```

It logs divergence when onchain referrers exist without active backend code mappings.

### Phase 3.5: DebtPool Deployment

#### Step 14: Deploy DebtPool (via deploy script 018_debtPool.ts)

Required environment variables:

- `V2_GOVERNANCE_ADDRESS` (for DebtPool GOV and admin roles)
- StToken address (resolved from deployment)
- WstToken address (resolved from deployment)
- FeeController address (resolved from deployment)

The deploy script:

1. Deploys DebtPool with stToken, wstToken, governance, admin, and feeController addresses
2. Updates FeeController.setRecipients() to include DebtPool address

```solidity
DebtPool debtPool = new DebtPool(
    address(stToken),     // stToken for share transfers
    address(wstToken),    // wstToken for WSTETH claims
    address(timelock),    // GOV role (gates createDistribution)
    address(timelock),    // admin role
    address(feeController) // fee controller for split updates
);
```

#### Step 15: Configure FeeController DebtPool Split

After deployment, ensure FeeController has the debtPool recipient configured with appropriate split BPS:

```solidity
feeController.setRecipients(
    treasuryAddress,
    operatorAddress,
    address(referralRegistry),
    address(debtPool)
);
```

### Phase 3.5.1: sgETH V1 Claim Receipt Airdrop

Deploy `SgEthV1Claim` with an audited Merkle root for selected sgETH V1 loss recipients:

- `SGETH_V1_CLAIM_ROOT` or `V2_SGETH_V1_CLAIM_ROOT`: required on non-local networks
- `SGETH_V1_CLAIM_GUARDIAN` or `V2_SGETH_V1_CLAIM_GUARDIAN`: optional pause guardian, defaults to governance
- `SGETH_V1_CLAIM_TRANSFERS_ENABLED` or `V2_SGETH_V1_CLAIM_TRANSFERS_ENABLED`: optional boolean, defaults to `false`

Claims are recipient-only: `claim(index, account, amount, proof)` reverts unless `msg.sender == account`. The receipt token name and symbol are both `sgethV1Claim`. Normal ERC20 transfers are disabled by default and can only be changed by governance.

Before mainnet launch, replace `src/components/Earn/sgethV1ClaimAirdrop.js` with the audited production recipient tree that matches `SGETH_V1_CLAIM_ROOT`. The checked-in single-recipient tree is a deterministic local/fork fixture only.

### Phase 3.6: Operator Registry and Migration Helper

#### Step 16: Deploy OperatorRegistry (via deploy script 020_operatorRegistry.ts)

The deploy script:

1. Resolves SGT from the local `SGTV2` mock or `V2_SGT_ADDRESS` on non-local networks.
2. Deploys `OperatorRegistry(sgtAddress, gov)`.
3. Configures the default ETH + SGT bond tier from env defaults.
4. Optionally wires SharedStake NFT bond credit when `V2_OPERATOR_NFT_ADDRESS` or `NFT_CONTRACT_ADDRESS` is set.
5. Wires the registry to `ValidatorModule` and `DVTModule` and grants each module `CALLER`.

NFT credit is escrow based: the NFT contract cannot be changed or repriced while any NFT is locked, and NFTs are returned on `exitBond()`.

#### Step 17: Deploy MigrationHelper (via deploy script 021_migrationHelper.ts)

`MigrationHelper(oldRouter, gov)` is deployed after `staking-router` and `governance`. It does not move user funds; it publishes a governance-controlled migration notice and activation signal for frontends and integrators.

### Phase 4: ValidatorModule Hardening

#### Step 18: Set Expected Withdrawal Credentials

```solidity
// withdrawal_credentials = 32 bytes
// Example: ETH1 address 0x1234... encoded as 0x010000...1234
bytes32 expectedCreds = bytes32(uint256(0x0100000000000000000000001234...));
validatorModule.setExpectedWithdrawalCredentials(expectedCreds);
```

#### Step 19: Lower maxDeltaBps Before Accepting TVL

```solidity
// Default is 100 (1%). Tighten further if governance policy requires.
stakingRouter.setMaxDeltaBps(100);
```

### Phase 5: Operational Parameters

#### Step 20: Configure OracleAdapter

```solidity
oracleAdapter.setMaxStaleness(3600);      // 1 hour
oracleAdapter.setMaxDriftBps(100);        // 1% max gain
oracleAdapter.setMaxSlashBps(500);        // 5% max slash
```

#### Step 21: Configure Module Caps

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

| Role                 | Holder                 | Can Do                              | Cannot Do                        |
| -------------------- | ---------------------- | ----------------------------------- | -------------------------------- |
| GOV (all contracts)  | GovernanceTimelock     | Change params via Governor proposal | Pause (GUARDIAN only)            |
| GUARDIAN             | Fast-response multisig | Pause any contract                  | Change params                    |
| ORACLE               | Oracle bot             | Submit beacon reports               | Exceed maxDeltaBps               |
| NODE_OPERATOR        | Validator operator     | Deposit 32 ETH to beacon            | Use wrong withdrawal credentials |
| PROPOSER (timelock)  | SharedStakeGovernor    | Queue proposals                     | Execute without delay            |
| EXECUTOR (timelock)  | Governor + Guardian    | Execute after 48h delay             | Execute before delay             |
| CANCELLER (timelock) | Guardian               | Cancel malicious proposals          | Execute proposals                |

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
2. Default is 1% per report in current router deployment defaults
3. **Mitigation:** keep `maxDeltaBps` conservative and environment-specific
4. **Mitigation:** Use QuorumOracleAdapter with multiple independent oracles

---

**Agent:** Codex GPT-5
**Co-authored-by:** Chimera <chimera_defi@protonmail.com>
