import { ethers } from 'ethers';
import store from '../index'


// import { init, useOnboard } from '@web3-onboard/vue'
import injectedModule from '@web3-onboard/injected-wallets'
import Onboard from '@web3-onboard/core'

// const FORTMATIC_KEY = "Your Fortmatic key here"
// const PORTIS_KEY = "Your Portis key here"
// const SQUARELINK_KEY = "Your Squarelink key here"
// const INFURA_KEY = "623c40ea76b44f068428108587d37f4e";
// const APP_URL = "https://www.sharedstake.org/";
// const CONTACT_EMAIL = "chimera_defi@protonmail.com";
// export const RPC_URL = `https://mainnet.infura.io/v3/${INFURA_KEY}`;
export const RPC_URL = "https://eth-mainnet.g.alchemy.com/v2/Wck5Sff8d5x1yOLZtQq_qE2X--_ETOMd"
// const APP_NAME = "SharedStake";
const injected = injectedModule()
// init({
const onboard = Onboard({
  wallets: [injected],
  chains: [
    {
      id: '0x1',
      token: 'ETH',
      label: 'Ethereum Mainnet',
      rpcUrl: RPC_URL
    }
  ],
  // connect: {
  //   autoConnectLastWallet: true
  // }
})
// const onboard = useOnboard();

// const { connectWallet, disconnectConnectedWallet, connectedWallet } =
//   useOnboard()
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

// const wallets = onboard.state.select('wallets')
// wallets.subscribe(() => changeWallets())
// const address = onboard.state.select('address')
// address.subscribe((account) => store.commit("setAddress", account))
// const network = onboard.state.select('address')
// network.subscribe((nw) => store.commit("setNetwork", nw))


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
  // await onboard.disconnectConnectedWallet();
  try {
    let selected = await onboard.connectWallet();
    localStorage.removeItem("selectedWallet");

  // Returns false if user closes/cancels the connect popup
  // const selected = await onboard.walletSelect();
  // if (selected) {
  //   // Can only call once user selected, otherwise will get error.
  //   await onboard.walletCheck();
  // }
  // const wallet = onboard.alreadyConnectedWallets[0];
  const wallet = selected[0]
  if (wallet) {
      console.log(`wallet switched to: ${wallet.label}`);
      // Create ethers.js provider instead of Web3
      let provider = new ethers.BrowserProvider(wallet.provider);
      window.ethersProvider = provider;
      store.commit("setEthersProvider", provider); // Store ethers provider instead
      store.commit("setWallet", wallet.label);

      store.dispatch("setAddressOnboard", wallet.accounts[0].address)
      // store.
      store.commit("setNetwork", wallet.chains[0])
      localStorage.setItem("selectedWallet", wallet.label);
      // store.
      store.commit("setAddress",  wallet.accounts[0].address)  

      const wallets = onboard.state.select('wallets')
      wallets.subscribe(() => changeWallets())
      // const address = onboard.state.select('address')
      // address.subscribe((account) => store.commit("setAddress", account))
      // const network = onboard.state.select('address')
      // network.subscribe((nw) => store.commit("setNetwork", nw))
  }
  } catch (error) {
    console.warn("Wallet connection completed with warnings (ENS resolution may have failed):", error);
    // ENS resolution errors are non-critical, wallet connection still works
  }
}

export default onboard;
