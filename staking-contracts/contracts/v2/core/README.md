# v2 core overview

- Users deposit ETH into the SharedDepositMinter
- Minters mints sgETH
- The minter has a max cap for user deposits
- Can be paused
- ETH in the minter can only exit via 1 of 2 ways
- 1. User redeems using their minted tokens
- 2. It is deposited to the ETH staking contract
- ETH is deposited with a preset ETH1 addresses making it non-custodial - RewardsReciever acts as the exit router
- All EL, CL rewards are also routed to RewardsReceiver
- If the RewardsReceiver is set to deposits:
- - All rewards are auto-compounded, turned into sgETH via minting
- - 60% is routed directly to wsgETH to accrue interest
- - 40% is routed to another router which handles reflections, node operator fees, protocol fees etc
- If the RewardsReceiver is set to Withdrawals
- - All rewards are routed to the withdrawals contract which lets users redeem sgETH
- For more complex payout schemes the DAO deploys a merkle airdrop with funds from the simpler fee splitters

# Components

- sgETH - ETH LSD - 1:1 pegged to ETH
- wsgETH - interest bearing wrapper for sgETH. Recieves interest earned on staked eth in the form of sgETH
- SharedDepositMinterv2 - v1 core minter with minor modifications. Pre-set withdrawal credentials for non-custodial staking.
- FeeSplitter - OZ payment splitter - Routes fees to NOR + DAO + reflections back to wsgETH
- RewardsReciever - acts as the withdrawal address and EL+CL rewards, converts incoming ETH into sgETH via the minter, router for the system. Forwards ETH to wsgETH and dao feesplitter or withdrawals
- Withdrawals - Allows redemptions of sgETH for ETH at scale when validators need to be exited and regular buffers arent adequate
- Rollover - Used to ferry vETH2 to sgETH for v1 user upgrades

# Audit guidelines

Just the above components in v2/core and custom libs used in lib are under review.  
Some libs are just copied from other sources so a full audit is not needed as the sources are audited. Likewise for opensource deps such as OZ/solmate/xERC4626
