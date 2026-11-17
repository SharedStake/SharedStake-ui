// export GOERLIPK='private key';
// npx hardhat run --network goerli --verbose deploy/deploy_minterv2.js
let {DeployHelper} = require("../deploy_utils.js");
let {
  deployMinterV2,
  setWithdrawalCredential,
  addMinter,
  deployWithdrawalsCredentialPipeline,
} = require("./lib/minter_deploy_utils.js");
let genParams = require("./lib/opts.js");
require("dotenv").config();

async function main() {
  deployer = new ethers.Wallet(network.name == "goerli" ? process.env.GOERLIPK : process.env.LOCALPK, ethers.provider);

  let dh = new DeployHelper(network.name, deployer.address);
  await dh.init(deployer.address, deployer);

  let params = genParams(dh);

  params = await deployMinterV2(dh, params);
  await addMinter(dh, params);

  // params = await oa.deployWithdrawalsCredentialPipeline(params);

  await setWithdrawalCredential(dh, params);
  console.log("WC set");

  await dh.waitIfNotLocalHost();
  await dh.e2e(params);

  await dh.waitIfNotLocalHost();
  // await oa.seedRewards(params, "0.005");

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
