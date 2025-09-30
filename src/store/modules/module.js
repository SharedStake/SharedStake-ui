import { changeWallets } from "../init/onboard"

const state = {
    address: null,
    ethersProvider: null, // Modern ethers.js provider (was web3)
    walletname: null,
    network: null,
};
const networks = {
    0: "Olympic",
    1: "Mainnet",
    2: "Expanse",
    3: "Ropsten",
    4: "Rinkeby",
    5: "Goerli",
    6: "Kotti Classic",
    7: "Mordor Classic",
    8: "Ubiq",
    10: "Quorum",
    42: "Kovan",
    60: "GoChain",
    77: "Sokol",
    99: "Core",
    100: "xDai",
}

const getters = {
    userAddress: state => state.address,
    isAuth: state => { return state.address ? true : false },
    ethersProvider: state => state.ethersProvider, // Modern ethers.js provider
    getNetwork: state => networks[state.network],
    getNetworkId: state => state.network,
};

const actions = {
    async setAddress() {
        await changeWallets()
    },
    setAddressOnboard({ commit }, address) {
        commit('setAddress', address);
    },
    exit({ commit }) {
        commit('removeAddress');
    },
    setEthersProvider({ commit }, newProvider) {
        commit('setEthersProvider', newProvider);
    },
    setWallet({ commit }, wallet) {
        commit('setWallet', wallet);
    },
    setNetwork({ commit }, network) {
        commit('setNetwork', network);
    }
};

const mutations = {
    setAddress: (state, address) => {
        state.address = address
    },
    removeAddress: (state) => {//remove address from local storage
        state.address = null;
    },
    setEthersProvider: (state, newProvider) => (state.ethersProvider = newProvider),
    setWallet: (state, wallet) => (state.walletname = wallet),
    setNetwork: (state, network) => (state.network = network),
    setOnboard: (state, onboard) => (state.onboard = onboard),
}

export default {
    state,
    getters,
    actions,
    mutations
};