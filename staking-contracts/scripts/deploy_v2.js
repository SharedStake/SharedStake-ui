// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-deploy");

module.exports = async ({getNamedAccounts, deployments}) => {
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();
  console.log("Deploying v2");
  console.log(deploy, deployer);

  await main(deploy, deployer)
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
};

module.exports.tags = ["v2"];

async function main() {
  const {_deployInitializableContract, _deployContract} = require("./v2/lib/deploy_utils.js");
  // deploy, deployer
  const [deployer] = await hre.ethers.getSigners();
  // const {deployer} = await getNamedAccounts();

  // console.log("Account balance:", (await deployer.getBalance()).toString());
  const launchNetwork = "goerli";
  // const launchNetwork = false;
  // console.log(launchNetwork, deploy, deployer);

  const contracts = {
    veth2: {},
  };
  let address = deployer.address;

  // for testing we deploy a new veth2
  const veth2Name = "vEth2";
  const veth2_args = [address, address, Date.now() + 500];
  contracts[veth2Name] = await _deployContract(veth2Name, launchNetwork, veth2_args);

  const priceOracleName = "PriceOracle";
  const virtualPrice = BigInt(1026987197948687500).toString();
  contracts[priceOracleName] = await _deployInitializableContract(priceOracleName, launchNetwork, [virtualPrice]);

  const blocklistName = "Blocklist";
  let blocklist = ["0xf6827E678F2d8F7656E577842a84B602DB202Eec"];
  contracts[blocklistName] = await _deployInitializableContract(blocklistName, launchNetwork, [blocklist]);

  const tokenManagerName = "TokenManager";
  contracts[tokenManagerName] = await _deployInitializableContract(tokenManagerName, launchNetwork, [
    contracts[veth2Name].contract.address,
  ]);

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
  let constructorArgs = [setupStateArgs[0], setupStateArgs[1]];
  contracts[SharedDepositV2Name] = await _deployInitializableContract(
    SharedDepositV2Name,
    launchNetwork,
    constructorArgs,
  );

  // Setup

  // Transfer veth2 control to token manager
  await contracts[veth2Name].contract.setMinter(contracts[tokenManagerName].contract.address);

  // grant the shared deposit v2 a minter role on the token manager
  let minterRole = await contracts[tokenManagerName].contract.MINTER_ROLE();
  await contracts[tokenManagerName].contract.grantRole(minterRole, contracts[SharedDepositV2Name].contract.address);

  return;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
