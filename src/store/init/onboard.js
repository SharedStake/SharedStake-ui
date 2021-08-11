import Web3 from "web3";
import Onboard from '@gnosis.pm/safe-apps-onboard'
import store from '../index'

// const FORTMATIC_KEY = "Your Fortmatic key here"
// const PORTIS_KEY = "Your Portis key here"
// const SQUARELINK_KEY = "Your Squarelink key here"
const INFURA_KEY = "623c40ea76b44f068428108587d37f4e"
const APP_URL = "https://www.sharedstake.org/"
const CONTACT_EMAIL = "chimera_defi@protonmail.com"
const RPC_URL = "https://mainnet.infura.io/v3/623c40ea76b44f068428108587d37f4e"
const APP_NAME = "SharedStake"

const wallets = [
    { walletName: "metamask", preferred: true },
    { walletName: "trust", preferred: true, rpcUrl: RPC_URL },
    { walletName: "coinbase", preferred: true },
    { walletName: "dapper", },
    {
        walletName: 'trezor',
        appUrl: APP_URL,
        email: CONTACT_EMAIL,
        rpcUrl: RPC_URL, preferred: true
    },
    {
        walletName: 'ledger',
        rpcUrl: RPC_URL, preferred: true
    },
    {
        walletName: 'lattice',
        rpcUrl: RPC_URL,
        appName: APP_NAME
    },
    { walletName: "authereum" },
    {
        walletName: "walletConnect",
        infuraKey: INFURA_KEY
    },
    {
        walletName: "opera",
        infuraKey: INFURA_KEY
    },
    { walletName: "operaTouch" },
    { walletName: "torus" },
    { walletName: "status" },
    { walletName: "unilogin" },
    { walletName: "walletLink", rpcUrl: RPC_URL, appName: APP_NAME },
    { walletName: "imToken", rpcUrl: RPC_URL },
    { walletName: "meetone" },
    { walletName: "mykey", rpcUrl: RPC_URL },
    { walletName: "huobiwallet", rpcUrl: RPC_URL },
    { walletName: "hyperpay" },
    { walletName: "wallet.io", rpcUrl: RPC_URL }
]

const onboard = Onboard({
    dappId: "5f2bd7eb-6a4d-43d0-8569-8de42386cb2d",       // [String] The API key created by step one above
    networkId: 1,  // [Integer] The Ethereum network ID your Dapp uses.
    darkMode: true,
    subscriptions: {
        wallet: (wallet) => {
            console.log(`wallet switched to: ${wallet.name}`);
            let W3 = window.web3 = new Web3(wallet.provider)
            // console.log(window.web3)
            store.commit('setWeb3', W3);
            store.commit('setWallet', wallet.name);
            localStorage.setItem("selectedWallet", wallet.name);
        },
        address: (account) => {
            store.commit('setAddress', account)
        },
        network: (nw) => {
            store.commit('setNetwork', nw)
            console.log(nw)
        }
    },
    walletSelect: {
        wallets: wallets
    },
    walletCheck: [
        { checkName: "derivationPath" },
        { checkName: "connect" },
        { checkName: "accounts" },
        { checkName: "network" },
    ],
})
window.onboard = onboard;
export async function changeWallets() {
    await onboard.walletReset();
    localStorage.removeItem("selectedWallet");
    // let userSelectedWallet = await onboard.walletSelect();
    await onboard.walletSelect();
    await onboard.walletCheck();
}

export default onboard;