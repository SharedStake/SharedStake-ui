// export GOERLIPK='private key';
// npx hardhat run --network goerli --verbose deploy/deploy_minterv2.js
let {DeployHelper} = require("./lib/deploy_utils.js");
let {deployMinterV2, setWithdrawalCredential, addMinter} = require("./lib/minter_deploy_utils.js");
let genParams = require("./lib/opts.js");

require("dotenv").config();

async function main() {
  deployer = new ethers.Wallet(network.name == "goerli" ? process.env.GOERLIPK : process.env.LOCALPK, ethers.provider);

  let dh = new DeployHelper(network.name, deployer.address);
  await dh.init(deployer.address, deployer);

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
  // Set the withdrawal contract now that we have it - i.e the rewards recvr
  await setWithdrawalCredential(dh, params);

  await dh.waitIfNotLocalHost();

  // Transfer ownership of any owned components to the multisig
  await dh.transferRewardsRecvrToMultisig(params);
  await dh.waitIfNotLocalHost();

  await dh.transferSgETHToMultisig(params);
  await dh.waitIfNotLocalHost();

  // test deposit withdraw flow
  await dh.e2e(params);

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
