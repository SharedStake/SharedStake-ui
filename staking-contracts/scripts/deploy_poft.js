const LZ_ENDPOINTS = require("./constants/lzEndpts.json"); // https://github.com/LayerZero-Labs/solidity-examples/blob/main/constants/layerzeroEndpoints.json
/**
 * Deploy script for SGT poft based on layer zero labs
 */

// export GOERLIPK='private key';
// npx hardhat run --network goerli --verbose deploy/deploy_minterv2.js
let {DeployHelper} = require("./deploy_utils.js");

require("dotenv").config();
async function main() {
  deployer = new ethers.Wallet(network.name == "goerli" ? process.env.GOERLIPK : process.env.LOCALPK, ethers.provider);

  let dh = new DeployHelper(network.name, deployer.address);
  await dh.init(deployer.address, deployer);
  let target = "ethereum"; // dh.hre.network.name

  console.log(LZ_ENDPOINTS[target]);

  const lzEndpointAddress = LZ_ENDPOINTS[target];
  console.log(`[${target}] Endpoint Address: ${lzEndpointAddress}`);

  await dh.deployContract("ProxyOFT", "ProxyOFT", [lzEndpointAddress, "0x24c19f7101c1731b85f1127eaa0407732e36ecdd"]);
  await dh.postRun();
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
