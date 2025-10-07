import { defineStore } from 'pinia'
import { changeWallets } from "../store/init/onboard"

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
        networkName: (state) => networks[state.network] || 'Unknown',
    },
    
    actions: {
        setAddress(address) {
            this.address = address
        },
        
        setProvider(provider) {
            this.ethersProvider = provider
        },
        
        setWalletName(walletname) {
            this.walletname = walletname
        },
        
        setNetwork(network) {
            this.network = network
        },
        
        async connectWallet() {
            try {
                // This would integrate with the existing onboard logic
                await changeWallets()
            } catch (error) {
                console.error('Failed to connect wallet:', error)
                throw error
            }
        },
        
        disconnectWallet() {
            this.address = null
            this.ethersProvider = null
            this.walletname = null
            this.network = null
        }
    }
})