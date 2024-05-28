import Web3 from 'web3';
import store from '../index'


import { init } from '@web3-onboard/vue'
import injectedModule from '@web3-onboard/injected-wallets'
import { useOnboard } from '@web3-onboard/vue'

// const FORTMATIC_KEY = "Your Fortmatic key here"
// const PORTIS_KEY = "Your Portis key here"
// const SQUARELINK_KEY = "Your Squarelink key here"
const INFURA_KEY = "623c40ea76b44f068428108587d37f4e";
// const APP_URL = "https://www.sharedstake.org/";
// const CONTACT_EMAIL = "chimera_defi@protonmail.com";
export const RPC_URL = `https://mainnet.infura.io/v3/${INFURA_KEY}`;
// const APP_NAME = "SharedStake";

init({
  wallets: [injectedModule()],
  chains: [
    {
      id: '0x1',
      token: 'ETH',
      label: 'Ethereum Mainnet',
      rpcUrl: RPC_URL
    }
  ]
})
const onboard = useOnboard();
// const wallets = [
//   injected,
//   { walletName: "metamask", preferred: true },
//   { walletName: "trust", preferred: true, rpcUrl: RPC_URL },
//   { walletName: "coinbase", preferred: true },
//   { walletName: "dapper" },
//   {
//     walletName: "trezor",
//     appUrl: APP_URL,
//     email: CONTACT_EMAIL,
//     rpcUrl: RPC_URL,
//     preferred: true,
//   },
//   {
//     walletName: "ledger",
//     rpcUrl: RPC_URL,
//     preferred: true,
//   },
//   {
//     walletName: "lattice",
//     rpcUrl: RPC_URL,
//     appName: APP_NAME,
//   },
//   { walletName: "authereum" },
//   {
//     walletName: "walletConnect",
//     infuraKey: INFURA_KEY,
//   },
//   {
//     walletName: "opera",
//     infuraKey: INFURA_KEY,
//   },
//   { walletName: "operaTouch" },
//   { walletName: "torus" },
//   { walletName: "status" },
//   { walletName: "unilogin" },
//   { walletName: "walletLink", rpcUrl: RPC_URL, appName: APP_NAME },
//   { walletName: "imToken", rpcUrl: RPC_URL },
//   { walletName: "meetone" },
//   { walletName: "mykey", rpcUrl: RPC_URL },
//   { walletName: "huobiwallet", rpcUrl: RPC_URL },
//   { walletName: "hyperpay" },
//   { walletName: "wallet.io", rpcUrl: RPC_URL },
// ];

// const onboard = Onboard({
//   dappId: "5f2bd7eb-6a4d-43d0-8569-8de42386cb2d", // [String] The API key created by step one above
//   networkId: 1, // [Integer] The Ethereum network ID your Dapp uses.
//   darkMode: true,
//   subscriptions: {
//     wallet: (wallet) => {
//       console.log(`wallet switched to: ${wallet.name}`);
//       let W3 = (window.web3 = new Web3(wallet.provider));
//       store.commit("setWeb3", W3);
//       store.commit("setWallet", wallet.name);
//       localStorage.setItem("selectedWallet", wallet.name);
//     },
//     address: (account) => {
//       store.commit("setAddress", account);
//     },
//     network: (nw) => {
//       store.commit("setNetwork", nw);
//       console.log(nw);
//     },
//   },
//   walletSelect: {
//     wallets: wallets,
//   },
//   walletCheck: [
//     { checkName: "derivationPath" },
//     { checkName: "connect" },
//     { checkName: "accounts" },
//     { checkName: "network" },
//   ],
// });

window.onboard = onboard;
export async function changeWallets() {
  await onboard.disconnectConnectedWallet();
  await onboard.connectWallet();
  localStorage.removeItem("selectedWallet");

  // Returns false if user closes/cancels the connect popup
  const selected = await onboard.walletSelect();
  if (selected) {
    // Can only call once user selected, otherwise will get error.
    await onboard.walletCheck();
  }
  const wallet = onboard.connectedWallet()
  if (wallet) {
      console.log(`wallet switched to: ${wallet.name}`);
      let W3 = (window.web3 = new Web3(wallet.provider));
      store.commit("setWeb3", W3);
      store.commit("setWallet", wallet.name);
      localStorage.setItem("selectedWallet", wallet.name);
  }
}

export default onboard;
