// export GOERLIPK='private key';
// npx hardhat run --network goerli --verbose deploy/deploy_minterv2.js
let {DeployHelper} = require("../lib/DeployHelper.js");
let genParams = require("../lib/opts.js");
let OA = require("../lib/onchain_actions.js");

require("dotenv").config();

async function main() {
  let dh = new DeployHelper(network.name);
  await dh.init();

  let oa = new OA(dh);
  let params = genParams(dh);
  dh.multisig_address = params.multisigAddr;

  /**
   * Servicing for v1
   * 1. Deploy ETH Withdrawals processing contract for v1 veth2
   * 2. Deploy veth2 to sgETH rollover contract for v1
   */
  await dh.deployContract("WithdrawalsvETH2", "Withdrawals", [params.vETH2Addr, params.rolloverVirtual]);

  // await dh.deployContract("Rollover", "Rollover", [params.vETH2Addr, sgETHAddrs, params.rolloverVirtual]);
  await dh.deployContract("WithdrawalQueue", "WithdrawalQueue", [params.minter, params.wsgETH]);

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
