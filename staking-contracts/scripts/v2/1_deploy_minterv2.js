// export GOERLIPK='private key';
// npx hardhat run --network goerli --verbose deploy/deploy_minterv2.js
let {DeployHelper} = require("./lib/DeployHelper.js");
let {deployMinterV2, setWithdrawalCredential, addMinter} = require("./lib/minter_deploy_utils.js");
let genParams = require("./lib/opts.js");
const {network} = require("hardhat");

require("dotenv").config();

async function main() {
  let dh = new DeployHelper(network.name);
  deployer = dh.deployer;
  await dh.init();

  let params = genParams(dh);
  dh.multisig_address = params.multisigAddr;

  // if testnet deploy a mock deposit contract
  if (network.name !== "mainnet") {
    await dh.deployContract("DepositContract", "DepositContract", []);
    params.depositContractAddr = dh.addressOf("DepositContract");
  }

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

  let wsgETH = params.names.wsgETH;
  await dh.deployContract(wsgETH, wsgETH, [sgETHAddrs, params.epochLen]);
  let wsgETHAddr = dh.addressOf(wsgETH);
  params.wsgETH = wsgETHAddr;

  await dh.deployContract("FeeCalc", "FeeCalc", [
    {
      adminFee: 10,
      exitFee: 0,
      refundFeesOnWithdraw: true,
      chargeOnDeposit: true,
      chargeOnExit: false,
    },
  ]);
  params.feeCalcAddr = dh.addressOf("FeeCalc");

  await deployMinterV2(dh, params);
  let minter = dh.addressOf(params.names.minter);
  params.minter = minter;

  await dh.waitIfNotLocalHost();

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
  await dh.deployContract(params.names.daoFeeSplitter, params.names.daoFeeSplitter, [
    params.daoFeeSplitterDistro.addresses,
    params.daoFeeSplitterDistro.values,
  ]);
  params.daoFeeSplitter = dh.addressOf(params.names.daoFeeSplitter);

  await dh.deployContract("Withdrawals", "Withdrawals", [params.sgETH, params.sgETHVirtualPrice]);
  params.withdrawals = dh.addressOf("Withdrawals");

  await dh.deployContract("RewardsReceiver", "RewardsReceiver", [
    params.withdrawals,
    [params.sgETH, params.wsgETH, params.daoFeeSplitter, params.minter],
  ]);
  params.rewardsReceiver = dh.addressOf("RewardsReceiver");

  await dh.waitIfNotLocalHost();

  /**
   * Servicing for v1
   * 1. Deploy ETH Withdrawals processing contract for v1 veth2
   * 2. Deploy veth2 to sgETH rollover contract for v1
   */
  // await dh.deployContract("WithdrawalsvETH2", "Withdrawals", [params.vETH2Addr, params.rolloverVirtual]);

  // await dh.deployContract("Rollover", "Rollover", [params.vETH2Addr, sgETHAddrs, params.rolloverVirtual]);

  // await dh.waitIfNotLocalHost();

  // // Transfer ownership of any owned components to the multisig
  // await oa.transferRewardsRecvrToMultisig(params);
  // await dh.waitIfNotLocalHost();

  // await oa.transferSgETHToMultisig(params);
  // await dh.waitIfNotLocalHost();

  // // test deposit withdraw flow
  // // await oa.e2e(params);

  // await dh.waitIfNotLocalHost();

  await dh.postRun();

  // put the txs after so contracts can be verified properly
  // run the followup script if any of these txs fail
  await dh.waitIfNotLocalHost();

  await addMinter(dh, params);
  // Set the withdrawal contract now that we have it - i.e the rewards recvr
  await setWithdrawalCredential(dh, params);

  await dh.transferRewardsRecvrToMultisig(params);
  await dh.waitIfNotLocalHost();

  await dh.transferSgETHToMultisig(params);
  await dh.waitIfNotLocalHost();

  // test deposit withdraw flow
  await dh.e2e(params);

  // starting sgeth bal 0.0
  // Deposited Eth, got sgETH: 0.01 0.01
  // new sgETH bal post withdraw 0.0
  // warmed up deposit/withdraw
  // starting wsgeth bal 0.0
  // Staked Eth, got wsgETH: 0.01 0.01
  // Unstaked wsgETH, new wsgETH bal: 0.005
  // warmed up stake/unstake
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
