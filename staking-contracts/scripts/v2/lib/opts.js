const CHIMERA = "0x610c92c70eb55dfeafe8970513d13771da79f2e0";
const GOERLIDEPOSIT = "0xff50ed3d0ec03aC01D4C79aAd74928BFF48a7b2b";
const MAINNETDEPOSIT = "0x00000000219ab540356cBB839Cbe05303d7705Fa";
const NOR='0xa1feaF41d843d53d0F6bEd86a8cF592cE21C409e';
const ZEROADDRESS="0x0000000000000000000000000000000000000000"
const MAINNET_MULTISIG = "0xebc37f4c20c7f8336e81fb3adf82f6372bef777e";
const LOCALHOST="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const DEFAULTS = {
  feeCalcAddr: ZEROADDRESS // 0x00 address since initial fees = 0
}
function genParams(dh, newParams = {}) {
  deployer = dh.deployer.address;
  let params = Object.assign({}, DEFAULTS);
  params.network = dh.launchNetwork;
  let addresses = {
    multisigAddr: CHIMERA, // todo: mainnet fix, currently deployer addr
    nor: deployer,
    deployer: deployer
  };

  let MainnetDeployedAddresses = {
    sgETH: '0x9e52dB44d62A8c9762FA847Bd2eBa9d0585782d1',
    wsgETH: '0x31AA035313b1D2109e61Ee0E3662A86A8615fF1d',
    minter: '0x85Bc06f4e3439d41f610a440Ba0FbE333736B310',
    daoFeeSplitter: '0x11017593C9BfD1E173ac0c59E2fCca260b10d467',
    rewardsReceiver: '0x4B9BF4DcA2fbF2C6D5266d51254638820243bFaD',
    withdrawals: '0xB4AAd1Fe1AD6153525bAf687e1f200183a030E30',
    withdrawalsVeth2: '0xed4e21BD620F3C1Fd1853b1C52A9D023C33D83d4',
    rollover: '0x68a31dfD0c81A411C5adadc8A40225425777466C',

    vETH2Addr: '0x898bad2774eb97cf6b94605677f43b41871410b1',
    depositContractAddr: MAINNETDEPOSIT,
    multisigAddr: MAINNET_MULTISIG,
    nor: NOR,
    deployer: CHIMERA,
  }

  let GoerliDeployedAddresses = {
    vETH2Addr: "0x0d3c0916b0df1ae387eda7fd1cb77d2e244826e6",
    sgETH: "0x453B459249F82ba3f369651aD485Fa11C6F082F8",
    wsgETH: "0xbFA813C3266Af70A5Ddc15d9253655281e2bCd23",
    rewardsReceiver: "0x67c2F94F308F7fe6Dd1bf1bD7BF55715E1b1579b",
    withdrawals: '0x807EB95706E365115adAbeb4884c1Eb39D062A6d',
    minter: "0x1C974Ef3993152eCB53FdCF8b543b39f82122447",
    daoFeeSplitter: '0xa609E0Dd2475739ac705fc17f38D9F5584c2c28D',
    depositContractAddr: GOERLIDEPOSIT
  }

  let SepoliaDeployedAddresses = {
    sgETH: '0x0F917a7F6c41e5e86a0F3870bAaDf512a4742dD2',
    wsgETH: '0x88110316C5F96F3544cEF90389e924c69eb8146d',
    depositContractAddr: MAINNETDEPOSIT
  }

  params = {
    epochLen: 24 * 60 * 60, // 1 day
    numValidators: 10000,
    adminFee: 0,
    sgETHVirtualPrice: "1000000000000000000",
    rolloverVirtual: "1080000000000000000",
    names: {
      minter: "SharedDepositMinterV2",
      sgETH: "SgETH",
      wsgETH: "WSGETH",
      withdrawals: "Withdrawals",
      rewardsReceiver: "RewardsReceiver",
      daoFeeSplitter: "PaymentSplitter",
      timelock: "TimelockController",
    },
    ...DEFAULTS,
    ...params
    // ...MainnetDeployedAddresses,
    // ...addresses,
    // ...GoerliDeployedAddresses,
  };

  if (params.network == "goerli") {
    params = {
     ...GoerliDeployedAddresses,
     ...params
    }
  } else if (params.network == "mainnet") {
    params = {
     ...MainnetDeployedAddresses,
     ...params
    }
  } else if  (params.network == "sepolia") {
    params = {
     ...SepoliaDeployedAddresses,
     ...addresses,
     ...params
    }
  } else if (params.network == "localhost") {
    params = {
     ...MainnetDeployedAddresses,
     ...addresses,
     ...params,
    }
  } else {
    throw new Error(`Unknown network: ${params.network}`);
  }

  params = {
    ...params,
    ...newParams
  }

  params.daoFeeSplitterDistro = genFeeDistro(params);
  params.timelockParams = genTimelockParams(params);

  // dh.log(`Using params: ${JSON.stringify(params)}`)
  // console.log(params)

  return params;
}

let genTimelockParams = (params) => {
  let timelockParams = {
    delay: 60,
    proposers: [params.multisigAddr, params.deployer],
    executors: [params.multisigAddr],
    admin: params.multisigAddr
  }

  return timelockParams;
}

let genFeeDistro = (params) => {
  // 9% Fees to start. 
  // 5% to node operator, 
  // 1% to founder, 
  // 3% to dao multisig, 
  // rest reflected back to stakers
  let daoFeeSplitterDistro = {
    founder: 1,
    nor: 5,
    dao: 3,
    reflection: 31,
  };
  let currentYieldPercentageReceived = 40; // max fees can go to this % of yield theoretically as its recvd by the dao fee splitter
  daoFeeSplitterDistro.values = prctGlobalToPartOfPrctLocal(daoFeeSplitterDistro, currentYieldPercentageReceived);
  daoFeeSplitterDistro.addresses = [
    params.deployer,
    params.multisigAddr,
    params.wsgETH
  ]

  return daoFeeSplitterDistro;
}

let prctGlobalToPartOfPrctLocal = (argsObj, partOf) => {
  // call with daoFeeSplitterDistro and partOf = what perct the splitter gets. e.g. 40 if it gets 40%
  // converts daoFeeSplitterDistro as a part of 100% of fees
  // to args for the splitter as part of fees
  // 6% of 100% is (6 * 5) or 30% or (6 * 100 / part) of 20%
  // $6 = (100 * 0.3 * 0.2)
  let scalingFactor = (100 / partOf) * 10; // 300 if partof is 20
  argsObj = {
    operator: (argsObj.founder + argsObj.nor) * scalingFactor,
    daoPay: argsObj.dao * scalingFactor,
    reflectionPay: argsObj.reflection * scalingFactor,
  };
  return [argsObj.operator, argsObj.daoPay, argsObj.reflectionPay];
};

module.exports = genParams;
