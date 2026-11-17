// Used for manual testing in hardhat console
const {_deployInitializableContract, deployVeth2} = require("./deploy/deploy_v2_utils.js");

console.log(_deployInitializableContract, deployVeth2);
// deploy, deployer
const {deployments} = hre; // we get the deployments and getNamedAccounts which are provided by hardhat-deploy.
const {deploy} = deployments; // The deployments field itself contains the deploy function.
const [deployer] = await hre.ethers.getSigners();
// const {deployer} = await getNamedAccounts();

// console.log("Account balance:", (await deployer.getBalance()).toString());
//   const launchNetwork = "goerli";
const launchNetwork = false;
// console.log(launchNetwork, deploy, deployer);

const contracts = {
  veth2: {},
};
let address = deployer.address;

const veth2Name = "veth2";
const veth2_args = [address, address, Date.now() + 500];
contracts[veth2Name] = await deployVeth2(launchNetwork, veth2_args);

const priceOracleName = "PriceOracle";
const virtualPrice = BigInt(1026987197948687500).toString();
contracts[priceOracleName] = await _deployInitializableContract(priceOracleName, launchNetwork, [virtualPrice]);

const tokenManagerName = "TokenManager";
contracts[tokenManagerName] = await _deployInitializableContract(tokenManagerName, launchNetwork, [
  contracts[veth2Name].contract.address,
]);

const blocklistName = "Blocklist";
let blocklist = ["0xf6827E678F2d8F7656E577842a84B602DB202Eec"];
contracts[blocklistName] = await _deployInitializableContract(blocklistName, launchNetwork, [blocklist]);

const SharedDepositV2Name = "SharedDepositV2";
let setupStateArgs = [
  [
    500, // _validatorsCreated
    25, // _performancePercent
    1, // epoch duration in days
    1000, // _numValidators
    100, // _adminFee
    1, // _depositsEnabled
  ],
  [
    "0x00000000219ab540356cBB839Cbe05303d7705Fa", // _depositContractAddress
    contracts[priceOracleName].contract.address,
    contracts[tokenManagerName].contract.address,
    contracts[blocklistName].contract.address,
    "0x0000000000000000000000000000000000000000", // _tokenUtilityModuleAddress
    contracts[veth2Name].contract.address, // _BETHTokenAddress
  ],
];
let constructorArgs = [
  //   1000, // _numValidators
  //   1, // _adminFee
  //   // BigInt(((16000 * 99.685) / 100) * 1e18), //  _currentShares
  //   contracts[veth2Name].contract.address, // _BETHTokenAddress
  //   "0x00000000219ab540356cBB839Cbe05303d7705Fa", // _depositContractAddress
  setupStateArgs[0],
  setupStateArgs[1],
];
contracts[SharedDepositV2Name] = await _deployInitializableContract(
  SharedDepositV2Name,
  launchNetwork,
  constructorArgs,
);

let cp = fn => {
  console.log(fn.toString());
};
let sendeth = async (to, val) => {
  tx = await deployer.sendTransaction({
    to: to,
    value: ethers.utils.parseEther(val.toString()),
  });
  await ethers.provider.send("evm_mine");
};
await network.provider.send("evm_increaseTime", [3600]);
await network.provider.send("evm_mine"); // this one will have 02:00 PM as its timestamp
now = Date.now() + 1000;

await ethers.provider.send("evm_setNextBlockTimestamp", [now]);
await ethers.provider.send("evm_mine");
let overrides = {
  value: ethers.utils.parseEther("1.0"),
};
sd2 = contracts["SharedDepositV2"].contract;
veth2 = contracts["veth2"].contract;

sendeth(sd2.address, 105);
await veth2.mint(deployer.address, BigInt(1e8).toString());
await veth2.burn(deployer.address, BigInt(1e19).toString());

cp(await veth2.balanceOf(sd2.address));
cp(await veth2.balanceOf(deployer.address));

await contracts[veth2Name].contract.setMinter(contracts[tokenManagerName].contract.address);

// grant the shared deposit v2 a minter role on the token manager
let minterRole = await contracts[tokenManagerName].contract.MINTER_ROLE();
await contracts[tokenManagerName].contract.grantRole(minterRole, contracts[SharedDepositV2Name].contract.address);

await sd2.deposit(overrides);
await veth2.approve(sd2.address, BigInt(100e18));
await sd2.stakeForWithdraw(BigInt(1e17));
await sd2.withdrawETHRewardsWithQueue();
cp(await sd2.getTotalBeneficiaryGains());
cp(await ethers.provider.getBalance(sd2.address));
cp(await ethers.provider.getBalance(deployer.address));
