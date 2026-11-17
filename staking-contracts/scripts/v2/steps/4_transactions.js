// export GOERLIPK='private key';
// npx hardhat run --network goerli --verbose deploy/deploy_minterv2.js
let {DeployHelper} = require("../DeployHelper.js");
let {setWithdrawalCredential, addMinter} = require("./lib/minter_deploy_utils.js");
let genParams = require("./lib/opts.js");
let OA = require("./lib/onchain_actions.js");

require("dotenv").config();

async function main() {
  let dh = new DeployHelper(network.name);
  await dh.init();

  let oa = new OA(dh);
  let params = genParams(dh);
  dh.multisig_address = params.multisigAddr;

  /**
   * Rewards and withdrawals processing system for non custodial staking
   * 1. Deploy Dao payment splitter feeSplitter
   * 2. Deploy Withdrawals processing contract
   * 3. Deploy withdrawal pubkey - RewardsReceiver - receives and routes all rewards and exits
   * 4. Set the  RewardsReceiver as setWithdrawalCredential  on sgETH minter - SharedDepositMinter
   */

  // update dao fee splitter addresses
  params = genParams(dh, params);
  console.log("Fee splitter distro: ", params.daoFeeSplitterDistro);

  await addMinter(dh, params);
  // Set the withdrawal contract now that we have it - i.e the rewards recvr
  await setWithdrawalCredential(dh, params);

  await dh.waitIfNotLocalHost();

  // Transfer ownership of any owned components to the multisig
  await oa.transferRewardsRecvrToMultisig(params);
  await dh.waitIfNotLocalHost();

  await oa.transferSgETHToMultisig(params);
  await dh.waitIfNotLocalHost();

  // test deposit withdraw flow
  await oa.e2e(params);

  await dh.waitIfNotLocalHost();

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
