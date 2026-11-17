let {
    _parsePrivateKeyToDeployer,
    _deployContract,
    _deployInitializableContract,
    _getAddress,
    _getContract,
    _getOverrides,
    _transact,
    _sendTokens,
    _transferOwnership,
    _verifyAll,
    _postRun,
    _printOverrides,
    _wait,
    log,
} = require("./deploy_utils.js");

let {OnchainActions} = require("./OnchainActions.js");

class DeployHelper extends OnchainActions {
    constructor(launchNetwork, multisig_address = '') {
        super(null);
        this.contracts = {};
        this.launchNetwork = launchNetwork;
        this.initialBalance = 0;
        this.currentBlockTime = 0;
        this.distribution = {};
        this.multisig_address = multisig_address;
        this.deployer = _parsePrivateKeyToDeployer();
        this.hre = hre;
        this.dh = this; // used to float the deploy helper methods to the onchain actions lib 
    }
    async init(address='') {
        this.address = address?.length > 0 ? address : this.deployer.address;
        this.multisig_address = this.multisig_address?.length > 0 ? this.multisig_address : this.address;

        this.initialBalance = await hre.ethers.provider.getBalance(this.address);
        this.currentBlockTime = (await hre.ethers.provider.getBlock()).timestamp;
        this.gas = await hre.ethers.provider.getFeeData();
        this.overrides = await this.getOverrides(); // cache the overrides inititally to reduce api calls

        log(
            `Initial balance of deployer at ${this.address} is: ${ethers.formatUnits(this.initialBalance)?.toString()} ETH at block timestamp : ${this.currentBlockTime
            } on network: ${this.launchNetwork}`,
        );

        if (this.launchNetwork === "sepolia") {
            // we can get away with less gas on sepolia maybe
            this.overrides.maxFeePerGas = this.overrides.maxFeePerGas / ethers.getUint(2);
            this.overrides.maxPriorityFeePerGas = this.overrides.maxPriorityFeePerGas /  ethers.getUint(2);
        }

        log(`Using gas settings: ${ethers.formatUnits((this.overrides.maxFeePerGas).toString(), "gwei")} gwei & bribe: ${ethers.formatUnits(this.overrides.maxPriorityFeePerGas, "gwei")} gwei`);
    }
    async deployContract(name, ctrctName, args) {
        this.contracts[name] = await _deployContract(ctrctName, this.launchNetwork, args, this.overrides);
        await this.waitIfNotLocalHost();
    }
    async deployInitializableContract(name, ctrctName, args) {
        this.contracts[name] = await _deployInitializableContract(ctrctName, this.launchNetwork, args);
    }
    addressOf(name) {
        return _getAddress(this.contracts[name]);
    }
    getContract(name) {
        return _getContract(this.contracts, name);
    }
    async getOverrides() {
        return await _getOverrides();
    }
    async transact(tx, ...args) {
        return await _transact(tx, args);
    }

    // Token distro
    addDist(name, amount) {
        this.distribution[name] = amount;
    }
    getContract(name) {
        return _getContract(this.contracts, name);
    }
    async getContractAt(name, address) {
        let try_cache = this.getContract(name);
        if (try_cache && try_cache?.address == address) return try_cache;
        let factory = await hre.ethers.getContractFactory(name);
        let contract = await factory.attach(address);
        if (this.deployer?.address) await contract.connect(this.deployer);
        // this.contracts[name] = contract;
        return contract;
    }
    async _checkEnoughTokensToDistribute(token) {
        let total = Object.values(this.distribution).reduce((a, b) => a + b);
        let diff = (await this.getContract(token).balanceOf(this.address)) - (total);
        if (diff !== 0) {
            log(`Distribution difference: ${diff.toString()}`);
            if (isMainnet(this.launchNetwork) && diff < 0) {
                throw "Not enough total balance";
            }
        }
    }
    async distribute(token) {
        await this._checkEnoughTokensToDistribute(token);
        for (let name in this.distribution) {
            await _sendTokens(this.getContract(token), name, this.addressOf(name), this.distribution[name]);
        }
    }

    // ownership transfer
    async transferOwnershipToMultisig(name) {
        await _transferOwnership(name, this.getContract(name), this.multisig_address);
    }
    async transferOwnershipToMultisigMultiple(arrOfNames) {
        for (let name of arrOfNames) {
            await transferOwnershipToMultisig(name);
        }
    }
    async verify() {
        await _verifyAll(this.contracts, this.launchNetwork);
    }
    async mine() {
        advanceTimeAndBlock(20, hre.ethers);
    }

    async postRun() {
        await _postRun(this.contracts, this.launchNetwork);
        let finalBalance = await hre.ethers.provider.getBalance(this.address);
        let finalBlockTime = (await hre.ethers.provider.getBlock()).timestamp;
        let overrides = await this.getOverrides(this.launchNetwork);
        log(
            `Total cost of deploys: ${this.formatEther(this.initialBalance - finalBalance)} Eth
             with gas settings: ${JSON.stringify(_printOverrides(overrides))}. Took ${finalBlockTime - this.currentBlockTime
            } seconds`,
        );
        await this.verify();
        this.genDeployJson();
    }

    genDeployJson() {
        // Helper fn to deploy a json of the deployed contracts and addresses for porting to the frontend
        let o = {};
        for (let key in this.contracts) {
            o[key] = this.addressOf(key);
        }
        log("All deployed contracts in JSON:");
        log(JSON.stringify(o));
        console.log(o);
    }

    log(txt, ...etc) {
        log(txt, ...etc);
    }

    parseEther(n) {
        return hre.ethers.parseEther(n);
    }

    formatEther(n) {
        return hre.ethers.formatEther(n && n?.toString() ? n.toString() : n);
    }

    async waitIfNotLocalHost() {
        if (this.launchNetwork !== "localhost") {
            let t = 10 * 1000; // 10s
            await _wait(t);
            log(`Waiting ${t} ms for non-local deploy for rate limit risks`);
        }
    }

    async getBalance(address) {
        let bal = await hre.ethers.provider.getBalance(address);
        return bal;
    }
    prepend0x(text) {
        return `0x${text}`;
    }
    //https://ethereum.stackexchange.com/questions/94664/arrayify-error-when-passing-a-string-as-an-argument-to-a-transaction
    web3StringToBytes32(text) {
        // text = this.prepend0x(text);
        var result = ethers.hexlify(ethers.toUtf8Bytes(text));
        while (result.length < 66) {
            result += "0";
        }
        if (result.length !== 66) {
            throw new Error(`invalid web3 implicit bytes32", ${result}, ${text}`);
        }
        return result;
    }
    addToParams(params, name) {
        let realname = params.names[name];
        params[name] = this.addressOf(realname);
        params.contracts[name] = this.getContract(realname);
        return params;
    }
}

module.exports = { DeployHelper }