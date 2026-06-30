// export GOERLIPK='private key';
// npx hardhat run --network goerli --verbose deploy/deploy_minterv2.js
let {DeployHelper} = require("../lib/DeployHelper.js");
let genParams = require("../lib/opts.js");

require("dotenv").config();

async function main() {
  let dh = new DeployHelper(network.name);
  await dh.init();
  let params = genParams(dh.address);

  /**
   * Servicing for v2
   * 1. Deploy ETH Withdrawals queue processing contract
   * 2. Swap out old contract on MinterV2
   */
  await dh.deployContract("WithdrawalQueue", "WithdrawalQueue", [params.minter, params.wsgETH]);
  params.withdrawals = dh.addressOf("WithdrawalQueue");

  await dh.deployContract("RewardsReceiver", "RewardsReceiver", [
    params.withdrawals,
    [params.sgETH, params.wsgETH, params.daoFeeSplitter, params.minter],
  ]);
  params.rewardsReceiver = dh.addressOf("RewardsReceiver");

  await setWithdrawalCredential(dh, params);
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
