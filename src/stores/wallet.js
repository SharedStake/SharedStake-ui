import { defineStore } from 'pinia'
import { changeWallets } from '../store/init/onboard'

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

export const useWalletStore = defineStore('wallet', {
    state: () => ({
        address: null,
        ethersProvider: null, // Modern ethers.js provider (was web3)
        walletname: null,
        network: null,
    }),

    getters: {
        userAddress: (state) => state.address,
        isAuth: (state) => !!state.address,
        ethersProvider: (state) => state.ethersProvider,
        getNetwork: (state) => networks[state.network],
        getNetworkId: (state) => state.network,
    },

    actions: {
        async setAddress() {
            await changeWallets()
        },
        setAddressOnboard(address) {
            this.address = address
        },
        exit() {
            this.address = null
        },
        setEthersProvider(newProvider) {
            this.ethersProvider = newProvider
        },
        setWallet(wallet) {
            this.walletname = wallet
        },
        setNetwork(network) {
            this.network = network
        },
        setOnboard(onboard) {
            this.onboard = onboard
        }
    }
})