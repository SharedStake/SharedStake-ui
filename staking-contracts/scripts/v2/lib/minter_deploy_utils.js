

async function deployMinterV2(dh, params = {
  numValidators: 100,
  adminFee: 0,
  feeCalcAddr: '',
  sgETH: '',
  wsgETH: '',
  multisigAddr: '',
  names: {
    minter: 'SharedDepositMinterV2'
  }
}) {
  let name = params.names.minter;

  let args = [
    params.numValidators,
    params.adminFee,
    [params.feeCalcAddr, params.sgETH, params.wsgETH, params.multisigAddr, params.depositContractAddr]
  ]

  await dh.deployContract(name, name, args);
  params.minter = dh.addressOf(name);
  console.log("Minter deployed");
  return params;
}

async function deploy_timelock(params) {

  /**
   * Pre-req: Deploy Timelock for use as gov later
   */

  let tl = params.names.timelock;
  await dh.deployContract(tl, tl, [
    params.timelockParams.delay,
    params.timelockParams.proposers, // proposers
    params.timelockParams.executors,
    params.timelockParams.admin,
  ]);
  params.timelock = dh.addressOf(tl);
  return timelock;
}

function makeWithdrawalCred(params = {
  rewardsReceiver: 'addr'
}) {
  // see https://github.com/ethereum/consensus-specs/pull/2149/files & https://github.com/stakewise/contracts/blob/0e51a35e58676491060df84d665e7ebb0e735d17/test/pool/depositDataMerkleRoot.js#L140
  // pubkey is 0x01 + (11 bytes?) 20 0s + eth1 addr 20 bytes (40 characters)  ? = final length 66
  //
  let withdrawalCredsPrefix = `0x010000000000000000000000`;
  eth1Withdraw = `${withdrawalCredsPrefix}${params.rewardsReceiver.split("x")[1]}`;
  console.log(`setWithdrawalCredential ${eth1Withdraw}`);

  return eth1Withdraw;
}

async function setWithdrawalCredential(dh, params = {
  rewardsReceiver: '0xaddr'
}) {
  let eth1Withdraw = makeWithdrawalCred(params);
  let sc = await dh.getContract(params.names.minter);
  await sc.setWithdrawalCredential(eth1Withdraw, dh.overrides);
  console.log("Updated withdrawal creds");
}

async function addMinter(dh, params = {
  sgETH: 'addr',
  names: {
    minter: 'SharedDepositMinterV2'
  }
}) {
  let se = await dh.getContractAt("SgETH", params.sgETH);

  let minter = params.minter ? params.minter : dh.addressOf(params.names.minter);

  // await dh.transact(se.addMinter, minter);
  await se.addMinter(minter, dh.overrides);
  dh.log(`Added new minter at ${minter} to ${params.sgETH}`);
};

async function upgradeGoerliMinter(dh, params) {
  params = await deployMinterV2(dh, params);
  await addMinter(dh, params);

  await setWithdrawalCredential(dh, params);
  console.log("WC set");

  await oa.e2e(params);
  params.minter = dh.addressOf(dh.names.minter);
  return params;
}


module.exports = {
  deployMinterV2: deployMinterV2,
  setWithdrawalCredential: setWithdrawalCredential,
  addMinter: addMinter,
  upgradeGoerliMinter: upgradeGoerliMinter,
}
