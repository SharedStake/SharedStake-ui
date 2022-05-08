import { changeWallets } from "../init/onboard"

const state = {
    address: null,
    web3: null,
    walletname: null,
    network: null,
    udDomainName: window.localStorage.getItem("udDomainName")
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
    udDomainName: (state) => state.udDomainName,
    userAddress: state => state.address,
    isAuth: state => { return state.address ? true : false },
    web3: state => state.web3,
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
    setWeb3({ commit }, newWeb3) {
        commit('setWeb3', newWeb3);
    },
    setWallet({ commit }, wallet) {
        commit('setWallet', wallet);
    },
    setNetwork({ commit }, network) {
        commit('setNetwork', network);
    },
    setUdDomainName({ commit }, domainName) {
        commit("setUdDomainName", domainName);
    }
};

const mutations = {
    setAddress: (state, address) => {
        state.address = address
    },
    removeAddress: (state) => {//remove address from local storage
        state.address = null;
    },
    setUdDomainName: (state, domainName) => {
        state.udDomainName = domainName;
    },
    setWeb3: (state, newWeb3) => (state.web3 = newWeb3),
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