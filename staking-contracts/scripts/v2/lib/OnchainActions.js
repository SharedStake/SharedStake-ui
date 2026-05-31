// onchain actions 
// Helpers for triggering transactions for deploy/test 
// we keep passing params in as they may change during execution
// instead of caching them in the class
class OnchainActions {
  constructor(dh) {
    this.dh = dh;
    // this.minter = this.dh.getContract('SharedDepositMinterV2');
  }

  async deposit(params = {
    names: {
      minter: 'SharedDepositMinterV2'
    }
  }, amt) {
    let dh = this.dh;
    let c = params.names.minter;
    await dh.getContract(c).deposit({ value: amt, ...dh.overrides });
  };

  async withdraw(params = {
    names: {
      minter: 'SharedDepositMinterV2'
    }
  }, amt) {
    let dh = this.dh;
    let c = params.names.minter;
    await dh.getContract(c).withdraw(amt,  dh.overrides);
  };

  async withdrawAdminFee(params = {
    names: {
      minter: 'SharedDepositMinterV2'
    }
  }, amt) {
    let dh = this.dh;
    let c = params.names.minter;
    await dh.getContract(c).withdrawAdminFee(amt,  dh.overrides);
  }

  async depositAndStake(params = {
    names: {
      minter: 'SharedDepositMinterV2'
    }
  }, amt) {
    let dh = this.dh;
    let c = params.names.minter;
    await dh.getContract(c).depositAndStake({ value: amt, ...dh.overrides });
  };

  async unstakeAndWithdraw(params = {
    names: {
      minter: 'SharedDepositMinterV2'
    },
    wsgETH: 'addr'
  }, amt) {
    let dh = this.dh;
    let c = params.names.minter;
    let wsgeth = await dh.getContractAt(params.names.wsgETH, params.wsgETH);
    await wsgeth.approve(dh.addressOf(c), amt);
    await dh.getContract(c).unstakeAndWithdraw(amt, dh.address,  dh.overrides);
  };

  async getWSGEthBal(params) {
    let wsgeth = await this.dh.getContractAt(params.names.wsgETH, params.wsgETH);
    let bal = await wsgeth.balanceOf(this.dh.address);
    return bal;
  }

  async getSGEthBal(params) {
    let sgeth = await this.dh.getContractAt("SgETH", params.sgETH);
    let bal = await sgeth.balanceOf(this.dh.address);
    return bal;
  }

  async getSGEthTotal(params) {
    let sgeth = await this.dh.getContractAt("SgETH", params.sgETH);
    let bal = await sgeth.totalSupply();
    return bal;  
  }

  async e2e(params = {
    names: {
      minter: 'SharedDepositMinterV2'
    },
    principal: 0
  }) {
    params.wsgETH = params.wsgETH?.length > 0 ? params.wsgETH : this.dh.addressOf(params.names.minter)
    let amt = params.principal > 0 ? params.principal : this.dh.parseEther("0.01");
    let recv;
    let dh = this.dh;
    let m = this.dh.getContract(params.names.minter);

    recv = await this.getSGEthBal(params);
    dh.log("starting sgeth bal", this.dh.formatEther(recv));

    await m.deposit({ value: amt, ...dh.overrides });

    recv = await this.getSGEthBal(params);
    dh.log("Deposited Eth, got sgETH:", this.dh.formatEther(amt), this.dh.formatEther(recv));

    await m.withdraw(amt,  dh.overrides);
    recv = await this.getSGEthBal(params);
    dh.log("new sgETH bal post withdraw", this.dh.formatEther(recv));
    dh.log("warmed up deposit/withdraw");
    await new Promise(resolve => setTimeout(resolve, 10000)); // avoid upstream timeouts / rate limits

    recv = await this.getWSGEthBal(params);
    dh.log("starting wsgeth bal", this.dh.formatEther(recv));
    await this.depositAndStake(params, amt);
    recv = await this.getWSGEthBal(params);
    dh.log("Staked Eth, got wsgETH:", this.dh.formatEther(amt), this.dh.formatEther(recv));
    await this.unstakeAndWithdraw(params, amt.toString() / 2); // leave  abit int the wsgeth
    recv = await this.getWSGEthBal(params);

    // check admin fee
    await m.withdrawAdminFee(this.dh.parseEther("0"), dh.overrides);
    
    dh.log("Unstaked wsgETH, new wsgETH bal:", this.dh.formatEther(recv));
    dh.log("warmed up stake/unstake");
  }

  async deployNonCustodialStakingPipeline(params = {
    sgETH: 'addr',
    daoFeeSplitterDistro: {
      addresses: [],
      values: []
    },
    names: {
      yd: '',
      rewardsReceiver: '',
      withdrawals: '',
      daoFeeSplitter: ''
    }
  }) {
    let dh = this.dh;

    await dh.deployContract(params.names.daoFeeSplitter, params.names.daoFeeSplitter, [
      params.daoFeeSplitterDistro.addresses,
      params.daoFeeSplitterDistro.values,
    ]);
    params.daoFeeSplitter = dh.addressOf(params.names.daoFeeSplitter);

    await dh.deployContract("Withdrawals", "Withdrawals", [params.sgETH, params.sgETHVirtualPrice]);
    params.withdrawals = dh.addressOf("Withdrawals");

    await dh.deployContract("RewardsReceiver", "RewardsReceiver", [params.withdrawals,  [params.sgETH, params.wsgETH, params.daoFeeSplitter, params.minter]]);
    params.rewardsReceiver = dh.addressOf("RewardsReceiver");

    return params;
  }

  async transferRewardsRecvrToMultisig(params = {
    names: {
      rewardsReceiver: ''
    },
    rewardsReceiver: '0xaddr',
    multisigAddr: '0xaddr'
  }) {
    let dh = this.dh;
    await dh.transferOwnershipToMultisig(params.names.rewardsReceiver)
    dh.log(`Ownership for ${params.names.rewardsReceiver} transferred to Multisig at: ${params.multisigAddr}`);
    return params;
  }

  async transferSgETHToMultisig(params = {
    names: {
      sgeth: ''
    },
    sgeth: '0xaddr',
    multisigAddr: '0xaddr'
  }) {
    let dh = this.dh;
    await dh.transferOwnershipToMultisig(params.names.sgETH)
    dh.log(`Ownership for ${params.names.sgETH} transferred to Multisig at: ${params.multisigAddr}`);
    return params;
  }

  async calcSeedRewardAmt(params) {
    let total = await getSGEthTotal(params.wsgETH)
    // convert total to expected 5% yield
    total = this.dh.parseEther(total.toString())
    total = total.dividedBy(20);
    // convert from 5% apr to daily 
    total = total.dividedBy(365);
    return total;
  }

  async seedRewards(params, amt) {
    let dh = this.dh;
    amt = this.dh.parseEther(amt);
    let rr = await dh.getContractAt(params.names.rewardsReceiver, params.rewardsReceiver)
    let daoFeeSplitter = await dh.getContractAt(params.names.daoFeeSplitter, params.daoFeeSplitter)
    let wsgETH = await dh.getContractAt(params.names.wsgETH, params.wsgETH);
    let pps = await wsgETH.pricePerShare();
    dh.log('Initial price per share:', pps.toString() / 1e18);
    await rr.work({value: amt});

    // https://github.com/ethers-io/ethers.js/discussions/2345
    // need to spec full fn sig since OZ contract has 2 release fns
    let fnSig = 'release(address,address)';
    await daoFeeSplitter[fnSig](params.sgETH, params.wsgETH)
    pps = await wsgETH.pricePerShare();
    dh.log("seeded rewards; Amt: ", amt.toString() / 1e18, "Price per share: ", pps.toString() / 1e18)
  }

  async depositEth2(params, validators) {
    let _make = (validators) => {
      let o = {
        pubkeys: [],
        sigs: [],
        ddrs: []
      }

      validators.forEach(v => {
        o.pubkeys.push(this.dh.prepend0x(v.pubkey));
        o.sigs.push(this.dh.prepend0x(v.signature));
        o.ddrs.push(this.dh.prepend0x(v.deposit_data_root));
      });

      return o;
    }

    let args = _make(validators);

    let minter = await this.dh.getContractAt(params.names.minter, params.minter);
    let bal = await this.dh.getBalance(params.minter);

    await minter.batchDepositToEth2(args.pubkeys, args.sigs, args.ddrs)

    let bal2 = await this.dh.getBalance(params.minter)

    dh.log(`Starting Balance: ${bal.toString() / 1e18} \n Ending Balance: ${bal2.toString() / 1e18}`)
  }
}

module.exports = {OnchainActions};
