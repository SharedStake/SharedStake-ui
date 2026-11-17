// export GOERLIPK='private key';
// npx hardhat run --network goerli --verbose deploy/deploy_minterv2.js
let {DeployHelper} = require("../lib/DeployHelper.js");
let {deployMinterV2, setWithdrawalCredential, addMinter} = require("../lib/minter_deploy_utils.js");
let genParams = require("../lib/opts.js");
let OA = require("../lib/onchain_actions.js");

require("dotenv").config();

async function main() {
  let dh = new DeployHelper(network.name);
  await dh.init();

  let oa = new OA(dh);
  let params = genParams(dh);
  dh.multisig_address = params.multisigAddr;

  /** Deploy core of v2 system
   * 3a. Add minter to sgETH
   */
  await deployMinterV2(dh, params);
  let minter = dh.addressOf(params.names.minter);
  params.minter = minter;

  // await addMinter(dh, params); // moved to end

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

  // Setup the non-custodial staking pipeline incl 1,2,3
  params = await oa.deployNonCustodialStakingPipeline(params);
  await dh.waitIfNotLocalHost();
  // Set the withdrawal contract now that we have it - i.e the rewards recvr
  await setWithdrawalCredential(dh, params); //moved to end

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
