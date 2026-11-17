const hre = require("hardhat");
const fs = require("fs");
const {ethers} = hre;

// const WAITGAS = 15000; 

const WAITGAS = 0;

const log = (txt, ...etc) => {
  txt = txt + [' ', ...etc].join(' ') + "  \n";
  console.log(txt);
  fs.writeFileSync("log.txt", txt, { flag: "a" });
};

const _parsePrivateKeyToDeployer = () => {
  pk = ''
  if (network.name == "goerli") {
    pk = process.env.GOERLIPK;
  } else if (network.name == "sepolia") {
    pk = process.env.SEPOLIAPK;
  } else {
    pk = process.env.LOCALPK;
  }
  return new ethers.Wallet(pk);
}

const isMainnet = launchNetwork => {
  // some behaviours need to be tested with a mainnet fork which behaves the same as mainnet
  return launchNetwork == "localhost" || launchNetwork == "mainnet";
};
const _wait = async ms => {
  log(`Waiting ${ms} ms`);
  await new Promise(resolve => setTimeout(resolve, ms));
}
const _printOverrides = o => {
  return {
    type: 2,
    maxFeePerGas: o.maxFeePerGas.toString(),
    maxPriorityFeePerGas: o.maxPriorityFeePerGas.toString(),
    gasLimit: o.gasLimit,
  };
};

const asMill = (n) => n * 1e7;

const defaultGas = {
  type: 2,
  maxFeePerGas: ethers.parseUnits("25", "gwei"),
  maxPriorityFeePerGas: ethers.parseUnits("1", "gwei"),
};

const _getOverrides = async () => {
  const overridesForEIP1559 = {
    type: 2,
    maxFeePerGas: ethers.parseUnits("25", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
    // gasLimit: asMill(15),
  };
  // const gasPrice = await hre.ethers.provider.getGasPrice();
  // overridesForEIP1559.maxFeePerGas = gasPrice;

  let gas = await ethers.provider.getFeeData();
  // todo we want to keep waiting for gas to drop. or some max time.
  // manually set expected max gas
  // check and wait if gas spike is hit
  let omfpg = overridesForEIP1559.maxFeePerGas;
  let mfpg = gas.maxFeePerGas;
  if (mfpg >= (omfpg)) {
    let waitTime = WAITGAS; 
    console.log("gas spike hit?! current gas in gwei:", ethers.formatUnits(mfpg.toString(), "gwei"));
    console.log("waiting for ", waitTime);
    await _wait(waitTime);

    gas = await ethers.provider.getFeeData();
    mfpg = gas.maxFeePerGas;
    // if (mfpg >= defaultGas.maxFeePerGas) {
    //   gas = defaultGas;
    // }
    console.log("Done waiting for gas resolution; new gas settings: ", ethers.formatUnits(mfpg.toString(), "gwei"));
  }
  overridesForEIP1559.maxPriorityFeePerGas = overridesForEIP1559.maxPriorityFeePerGas >= (gas.maxPriorityFeePerGas)
    ? gas.maxPriorityFeePerGas
    : overridesForEIP1559.maxPriorityFeePerGas;

  overridesForEIP1559.maxFeePerGas = gas.maxFeePerGas;

  return overridesForEIP1559;
};

const _verifyBase = async (contract, launchNetwork, cArgs) => {
  try {
    await hre.run("verify:verify", {
      address: contract.address,
      constructorArguments: cArgs,
      network: launchNetwork,
    });
    log(`Verified ${JSON.stringify(contract)} on network: ${launchNetwork} with constructor args ${cArgs.join(", ")}`);
    log("\n");
    return true;
  } catch (e) {
    log(`Etherscan verification failed w/ ${e} | Args: ${cArgs} | on ${launchNetwork} for ${contract.address}`);
    return false;
  }
};

const _estimateDeploymentGasLimit = async (contractDeployTx) => {
  // const deploymentData = contract.interface.encodeDeploy(cArgs)
  // const estimatedGas = await ethers.provider.estimateGas({ data: deploymentData });
  const estimatedGas = await ethers.provider.estimateGas(contractDeployTx)
  log(`Estimated gas for cdtx: ${Object.keys(contractDeployTx).join(' ')} \n ${Object.values(contractDeployTx).join(' ')}`);
  log(`Estimated gas: ${Object.keys(estimatedGas).join(' ')} \n ${Object.values(estimatedGas).join(' ')}`);

  return estimatedGas;
}

const _verify = async (contract, launchNetwork, cArgs) => {
  if (!launchNetwork || launchNetwork == "hardhat") return;
  await new Promise(resolve => setTimeout(resolve, 10000));
  await _verifyBase(contract, launchNetwork, cArgs);
};

const _deployContract = async (name, launchNetwork = false, cArgs = [], cachedOverrides) => {
  log(`\n Deploying ${name} \n on ${launchNetwork}.  `);
  const overridesForEIP1559 = cachedOverrides ? cachedOverrides : await _getOverrides();
  const factory = await ethers.getContractFactory(name);
  // const factory = await ethers.ContractFactory
  // let cdtx = await factory.getDeployTransaction(...cArgs, overridesForEIP1559);
  // let estimate = await _estimateDeploymentGasLimit(cdtx);
  // log(` estimate with settings: \n ${Object.keys(estimate).join(' ')} \n ${Object.values(estimate).join(' ')} from ${cdtx}`)
  // over write our custom gas limit with what the tx should take
  // overridesForEIP1559.gasLimit =  cdtx.gasLimit  > 0 && cdtx.gasLimit < overridesForEIP1559.gasLimit ? cdtx.gasLimit : overridesForEIP1559.gasLimit;
  // log(` Deploying with settings: \n ${Object.keys(overridesForEIP1559).join(' ')} \n ${Object.values(overridesForEIP1559).join(' ')}`)

  const contract = await factory.deploy(...cArgs, overridesForEIP1559);
  await _wait(10000);
  console.log("deployment done, now to waitForDeployment")
  await contract.waitForDeployment();
  log(`\n waitForDeployment wait for ${name} \n on ${launchNetwork}.  `);
  await contract.deploymentTransaction().wait(1);
  log(`\n deploymentTransaction wait for ${name} \n on ${launchNetwork}.  `);
  contract.address = contract.target;

  log(`\n Deployed ${name} to ${contract.address} \n on ${launchNetwork}.  `);
  return Promise.resolve({ contract: contract, args: cArgs, initialized: false, srcName: name });
};

function chunkArray(array, size) {
  if (array.length <= size) {
    return [array];
  }
  return [array.slice(0, size), ...chunkArray(array.slice(size), size)];
}

const _verifyAll = async (allContracts, launchNetwork) => {
  log("starting verifyall");
  if (!launchNetwork || launchNetwork == "hardhat" || launchNetwork == "localhost") return;
  let num = 60000; // 60s
  log(`Waiting ${num} ms to make sure everything has propagated on etherscan`);
  await _wait(num);

  let contractArr = [],
    verifyAttemtLog = {};
  Object.keys(allContracts).forEach(k => {
    let obj = allContracts[k];
    let contractMin = {
      address: obj.contract.address,
      args: obj.args,
      initialized: obj.initialized,
      name: k,
    };
    contractArr.push(contractMin);
    verifyAttemtLog[k] = contractMin;
  });

  contractArr = chunkArray(contractArr, 5);
  let verificationsPassed = 0;
  let verificationsFailed = 0;

  for (const arr of contractArr) {
    await Promise.all(
      arr.map(async contract => {
        log(`Verifying ${JSON.stringify(contract)} at ${contract.address} `);
        let res = await _verifyBase(contract, launchNetwork, contract.initialized ? [] : contract.args);
        res ? verificationsPassed++ : verificationsFailed++;
        verifyAttemtLog[contract.name].verifified = res;
      }),
    );
    log("Waiting 2 + 2 s for Etherscan API limit of 5 calls/s");
    await new Promise(resolve => setTimeout(resolve, 4000));
  }
  fs.writeFileSync("verify_attempt_log.json", JSON.stringify(verifyAttemtLog));
  log(`Verifications finished: ${verificationsPassed} / ${verificationsFailed + verificationsPassed} `);
};

const _deployInitializableContract = async (name, launchNetwork = false, initArgs = []) => {
  const overridesForEIP1559 = await _getOverrides();
  const { contract, _ } = await _deployContract(name, launchNetwork, []);
  if (initArgs.length > 0) {
    await contract.initialize(...initArgs, overridesForEIP1559);
  } else {
    await contract.initialize(initArgs, overridesForEIP1559);
  }
  log(`Initialized ${name} with ${initArgs.toString()} \n`);
  return Promise.resolve({ contract: contract, args: initArgs, initialized: true, srcName: name });
};

const _getAddress = obj => {
  return obj == undefined || obj.contract == undefined
    ? "0x0000000000000000000000000000000000000000"
    : obj.contract.address;
};

const _postRun = (contracts, launchNetwork) => {
  log("\n\nDeployment finished. Contracts deployed: \n\n");
  let prefix = "https://";
  if (!isMainnet(launchNetwork)) {
    prefix += `${launchNetwork}.`;
  }
  prefix += "etherscan.io/address/";

  Object.keys(contracts).map(k => {
    let url = prefix + contracts[k].contract.address;
    log(`\n ${k} deployed to ${contracts[k].contract.address} at \n ${url}  `);
  });
  fs.writeFileSync("deploy_log.json", JSON.stringify(contracts), { flag: "a" });
};

const _sendTokens = async (contract, name, to, amount) => {
  let res = await _transact(contract.transfer, to, amount);
  log(`Tokens transferred: From ${contract.address} to ${name} at ${to} : ${amount}`);
  return res;
};

const _transferOwnership = async (name, contract, to) => {
  let owner = contract?.owner ? await _transact(contract.owner) : false;
  let res;
  if (to != owner) {
    res = await _transact(contract.transferOwnership, to);
    log(`Ownership transferred for ${name} at ${contract.address} to ${to}`);
  } else {
    log(`Ownership transfer skipped. Both addresses are the same`)
  }
  return res;
};

const _transact = async (tx, ...args) => {
  let overrides = await _getOverrides();
  // console.log(...args);
  // Txs with no args are reads and dont need overrides or waits. 
  if (args?.length == 0) {
    let trace = await tx(overrides);
    return trace;
  }
  let trace = await tx(...args, overrides);
  await trace.wait(); // throws on tx failure
  return trace;
};

const _getContract = (contracts, name) => {
  return contracts[name]?.contract;
};

async function advanceTimeAndBlock(time, ethers) {
  await advanceTime(time, ethers);
  await advanceBlock(ethers);
}

async function advanceTime(time, ethers) {
  await ethers.provider.send("evm_increaseTime", [time]);
}

async function advanceBlock(ethers) {
  await ethers.provider.send("evm_mine");
}

module.exports = {
  _deployInitializableContract: _deployInitializableContract,
  _deployContract: _deployContract,
  _getAddress: _getAddress,
  _verify: _verify,
  _verifyAll: _verifyAll,
  _postRun: _postRun,
  _getOverrides: _getOverrides,
  _printOverrides: _printOverrides,
  log: log,
  isMainnet: isMainnet,
  _transact: _transact,
  _sendTokens: _sendTokens,
  _transferOwnership: _transferOwnership,
  _getContract: _getContract,
  advanceTimeAndBlock: advanceTimeAndBlock,
  _parsePrivateKeyToDeployer: _parsePrivateKeyToDeployer,
  _wait: _wait
};