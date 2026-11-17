/*
common core contracts are: 
blocklist
vote escrow factory
*/
const hre = require("hardhat");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-deploy");
const constants = require("../constants.js");
module.exports = async ({getNamedAccounts, deployments}) => {
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();
  await main(deploy, deployer)
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
};

async function main() {
  let {DeployHelper} = require("./deploy_utils.js");

  let dh = new DeployHelper(network.name);

  let vef = "VoteEscrowFactory";
  let bl = "Blocklist";
  await dh.deployInitializableContract(bl, bl, [constants.blocklist]);
  await dh.deployContract(vef, vef);

  await dh.postRun();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
