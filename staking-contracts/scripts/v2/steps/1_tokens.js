// export GOERLIPK='private key';
// npx hardhat run --network goerli --verbose deploy/deploy_minterv2.js
let {DeployHelper} = require("../lib/DeployHelper.js");
let genParams = require("../lib/opts.js");

require("dotenv").config();

async function main() {
  let dh = new DeployHelper(network.name);
  await dh.init();

  let params = genParams(dh);
  dh.multisig_address = params.multisigAddr;

  /** Deploy core of v2 system
   * 1. Deploy sgETH
   * 2. Deploy wsgETH
   * 3. Deploy minter for sgETH - SharedDepositMinterV2
   * 3a. Add minter to sgETH
   */
  let sgETH = params.names.sgETH;
  await dh.deployContract(sgETH, sgETH, []);
  let sgETHAddrs = dh.addressOf(sgETH);
  params.sgETH = sgETHAddrs;

  // let wsgETH = params.names.wsgETH;
  // await dh.deployContract(wsgETH, wsgETH, [sgETHAddrs, params.epochLen]);
  // let wsgETHAddr = dh.addressOf(wsgETH);
  // params.wsgETH = wsgETHAddr;

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
