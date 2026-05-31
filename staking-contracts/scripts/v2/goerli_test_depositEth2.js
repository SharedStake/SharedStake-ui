// export GOERLIPK='private key';
// npx hardhat run --network goerli --verbose deploy/deploy_minterv2.js
let {DeployHelper} = require("../deploy_utils.js");
let genParams = require("./lib/opts.js");
let creds = require("./lib/goerli_deposit_data.json");

require("dotenv").config();

async function main() {
  deployer = new ethers.Wallet(network.name == "goerli" ? process.env.GOERLIPK : process.env.LOCALPK, ethers.provider);

  let dh = new DeployHelper(network.name, deployer.address);
  await dh.init(deployer.address, deployer);

  let params = genParams(dh);

  let validators = creds;

  await dh.depositEth2(params, validators);

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
