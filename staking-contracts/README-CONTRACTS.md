# SharedDeposit

Contracts powering https://sharedstake.org / https://sharedstake.finance

Ethereum liquid staking derivatives.
Docs: https://docs.sharedstake.finance/

V2 core auditable contracts and guidance/README in `contracts/v2/core`.

# Deployed mainnet contracts

## Nov 12 2023

See deploy_log.md for new deployed contract addresses

# Quickstart and developer notes

- Following env best practices from https://github.com/paulrberg/solidity-template
- Pre-run checks:

```
yarn install
npm run setup:foundry
yarn sol
yarn test
npm run test:invariants
```

- Tooling dependency: Foundry (`forge`, `cast`, `anvil`, `chisel`) is required for invariant/fuzz suites under `test/foundry`.
- Bootstrap Foundry from repo scripts:

```bash
npm run setup:foundry
```

- Run modular staking invariant suite:

```bash
npm run test:invariants
```

- Deployments and hardhat
  Run anvil for local host deploy

```
anvil --fork-url https://rpc.sharedtools.org/rpc
 npx hardhat run --network ...
```

```
export GOERLIPK='Goerli private key'
export ETHERSCAN_API='xx'
export ALCHEMY_GOERLI_KEY='xx'
// see deploy_minterv2.js or deploy tasks in package.json for hardhat deploy usage
```

## V2 deployment security defaults

- For non-`hardhat` deployments you must set `V2_GOVERNANCE_ADDRESS`.
- Optional `V2_NODE_OPERATOR_ADDRESS` sets the `NOR` role on `SharedDepositMinterV2`. If omitted, `NOR` defaults to governance.
- `WithdrawalQueue.GOV`, `FeeCalc.owner`, and `RewardsReceiver.owner` are now wired to governance at deployment.
- `sgETH` admin is transferred from deployer to governance during `minter` deployment.
- The `deploymentSecurity.spec.ts` suite asserts these invariants and should be treated as a release gate.

# Slither

Slither run results and howto:

- start venv
- `pip3 install slither-analyzer`
- `slither . --ignore-compile`
  ./contracts/
  --compile-force-framework hardhat
  --solc-remaps @openzeppelin/=$(pwd)/node_modules/@openzeppelin/
  --solc solc-0.8.10 --solc-args "--optimize --optimize-runs 200"`

# Archival

# Errors

A note on errors
To reduce bytecode size and gas costs, error strings are shortened following UNIv3 as an example.
The template is: {origin contract}:reason
Common reasons:

```
CBL0 - contract balance will be less than 0 after this operation
VL0 - Value less than or equal to 0 and needs to be greater than 0
VLC - Value less than cap or check amount
AGC - Amount greater than cap or some stored value or requirement
NA - No Access / Not allowed
AE - Already exists
0AD - 0 address
```

# SharedDeposit V2

Spec:

- TODO

# SharedDeposit V3

Spec:

- Use CLI options to set ETH1 exit as this upgradeable contract - contract needs to be upgradeable
- This allows trustless staking as ETH cannot to be taken by an admin
- Disable any future migrations or minting and control minting roles
- Build a large broader community multisig with partners and set it as owner of the contract
- Require a withdrawal queue to prevent bot arbitrage
- Create a oracle for single token value tracking for VETH2 price appreciation that can be updated with offchain calc on validators
- Bonus:
- Auto buy SGT from generated fees and send to master chef type contracts for rewards boost
- Require the user to have some SGT for solo staking or withdrawing VETH2 into ETH at a discounted market rate
- Allow the contract to be deployed via a factory allowing others to reuse the scaffolding to create their own ETH2 staking solutions i.e. staking server providers such as certus one
- Minting support to allow adding a new minter to support swapping a share token into a yield bearing sharing token controlled by the oracle module
  e.g. swapping veth2 to a yield bearing eth2 validator share derivative token
- Support for stable coins
- Address blocklist; currently deploying a new eth2 validator takes effort. one can assume exiting one would also take effort. a blocklist would prevent a malicious address from forcing continous entries and exits e.g. an address adding and exiting 1000s of eth every epoch. some parameters should be set to prevent user concers such as a final exit allowance

# Gas profiling

Gas profiling on goerli with different optimizations.
Transfer costs:
Optimizations | Cost
5000000 | 51481
200 | 51553

This represents a 0.13% improvement in the cost of a transfer, arguably the most frequent interaction.
Deploy costs:
Optimizations | Cost
5000000 | 27645256739592190
200 | 22124896691748864

This represents a 24% increase in deployment costs with 5000000 optimizer runs vs 200.

This was carried out on Goerli using a gas price avg of 4.5 Gwei.
Based on this a 200 run base is chosen.

Gas costs of large lists in args:
With around ~100 addresses in a constructor arg gas price of the entire deploy stack increased by around 10%.

Added gas observations - may '23

- OZ methods are not always optimal / most effecient. e.g. see address.sendValue vs examples from solidity docs to achieve same
- 30% call cost reduction for 2% more contract size
  Optimization increases deployment of withdrawals.sol by 10k gas units, but shows a call cost reduction of 3k / call or ~3% on empty loops i.e redeem without any staked collateral
- loading calldata into mem e.g. via `address usr = msg.sender;` vs loading directly from msg.sender where needed
- setting global vars to immutable

# Deploying gov v2 to prod

- First we build to lint everything and make sure everything is standard
- Then clean to prevent etherscan verify issues
- Then we run the deploy gov script which will deploy main contracts and allocate specific funding to them all. This script will also then run etherscan verify
- **Manual followups are needed**
- Create a Sushiswap LP position
- Create a vote escrow token for these lP positions using the vote escrow factory
- Add these LP tokens and vote escrow tokens to the masterchef contract
- Set burn address for the vote escrow contract to 0x..dead
- Make sure vote escrow contract works
- Make sure farming master chef contract works
- Burn initial LP tokens manually or via unicrypt

```
npm run-script deploy_gov_prod
```

# Extended Deploy logs Sep 1 2021

```
Deployed SGTv2 to 0x24C19F7101c1731b85F1127EaA0407732E36EcDD on mainnet

Deployed TokenMigrator to 0x9615460582Efa2a9b1d8D21e7E02afE43A415E13 on mainnet

Deployed VoteEscrowFactory to 0xeE5bd4b9C875BE3958b1255D181B8B3E978903b9 on mainnet

Deployed SimpleVesting to 0x0279eBC54179EBc5E5e65A9f036Db351233adDc6 on mainnet

Deployed SimpleVesting to 0x2Cb4bdc030975f2ABdbbb984e87715505C51D5BC on mainnet

Deployed SimpleTimelock to 0xC0AAB794F9D2aA7cE56B8BEB6cFfc71BC05c21FC on mainnet

Deployed FundDistributor to 0x38aa4CC003D9Ad84505bc7b096122402Db31f708 on mainnet
Initialized FundDistributor with 0x24C19F7101c1731b85F1127EaA0407732E36EcDD

Tokens transferred: From 0x24C19F7101c1731b85F1127EaA0407732E36EcDD to TokenMigrator at 0x9615460582Efa2a9b1d8D21e7E02afE43A415E13 : 3200000000000000000000000
Tokens transferred: From 0x24C19F7101c1731b85F1127EaA0407732E36EcDD to treasuryVesting at 0x2Cb4bdc030975f2ABdbbb984e87715505C51D5BC : 2380000000000000000000000
Tokens transferred: From 0x24C19F7101c1731b85F1127EaA0407732E36EcDD to founderVesting at 0x0279eBC54179EBc5E5e65A9f036Db351233adDc6 : 1020000000000000000000000
Tokens transferred: From 0x24C19F7101c1731b85F1127EaA0407732E36EcDD to FundDistributor at 0x38aa4CC003D9Ad84505bc7b096122402Db31f708 : 2040000000000000000000000
Tokens transferred: From 0x24C19F7101c1731b85F1127EaA0407732E36EcDD to SimpleTimelock at 0xC0AAB794F9D2aA7cE56B8BEB6cFfc71BC05c21FC : 1360000000000000000000000
Setup farming
Granting ACL rights to 0xcB9D78CB76a86844667eAF3Ac62CB5D377b3ce5C
Granting ACL rights to 0x610c92c70Eb55dFeAFe8970513D13771Da79f2e0
Granting ACL rights to 0xa1feaF41d843d53d0F6bEd86a8cF592cE21C409e
ACL Sentinels added
Ownership transferred for treasuryVesting at 0x2Cb4bdc030975f2ABdbbb984e87715505C51D5BC to 0xeBc37F4c20C7F8336E81fB3aDf82f6372BEf777E
Ownership transferred for SimpleTimelock at 0xC0AAB794F9D2aA7cE56B8BEB6cFfc71BC05c21FC to 0xeBc37F4c20C7F8336E81fB3aDf82f6372BEf777E
Ownership transferred for FundDistributor at 0x38aa4CC003D9Ad84505bc7b096122402Db31f708 to 0xeBc37F4c20C7F8336E81fB3aDf82f6372BEf777E
Ownership transferred for TokenMigrator at 0x9615460582Efa2a9b1d8D21e7E02afE43A415E13 to 0xeBc37F4c20C7F8336E81fB3aDf82f6372BEf777E
Ownership transferred for Blocklist at <redacted> to 0xeBc37F4c20C7F8336E81fB3aDf82f6372BEf777E
Ownership transferred for Allowlist at <redacted> to 0xeBc37F4c20C7F8336E81fB3aDf82f6372BEf777E
```

Here's the corrected README section:

---

## Using Development Kit

### Deploy Contracts

You can run the deploy script by specifying tags for the deploy script:

```bash
yarn deploy:sepolia --tags minter
```

The tag should exist in the deploy scripts:

```typescript
import {DeployFunction} from "hardhat-deploy/types";

const func: DeployFunction = async function (hre) {
  // deployment code
};

export default func;
func.tags = ["minter"];
func.dependencies = ["sgEth", "wsgEth"];
```

When deploying contracts, the dependency scripts will run first.

### Verify Contracts

You can verify contracts by specifying the name of the contract:

```bash
yarn verify:sepolia SharedDepositMinterV2
```

Ensure you provide the correct contract name.

---

### Explanation

- **Deploying Contracts**: The `yarn deploy:sepolia --tags minter` command runs the deploy script with the specified tag (`minter`). The tag must be defined in the deploy script. Dependencies specified in `func.dependencies` will run before the tagged script.

- **Verifying Contracts**: The `yarn verify:sepolia SharedDepositMinterV2` command verifies the contract on the `sepolia` network by its name (`SharedDepositMinterV2`). Ensure the contract name is accurate to avoid verification errors.
