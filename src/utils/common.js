/**
 * This file includes common libraries and settings for them; such as axios, web3, bignumber.js.
 * import the libraries from here to use
 */
// import axios from "axios"

export const getCurrentGasPrices = async () => {
  // todo fix me
  // let response = await axios.get('https://www.gasnow.org/api/v3/gas/price')
  // let response = await axios.get('https://ethgasstation.info/api/ethgasAPI.json?');
  // console.log('getCurrentGasPrices', response);
  // if (!response || response.status !== 200) {
  return {
    low: 2,
    medium: 30,
    high: 200,
    tip: {
      low: 0.1,
      medium: 1,
      high: 2,
    },
  };
  // }
  // return {
  //     low: response.data.data.slow / 1e9,
  //     medium: response.data.data.standard / 1e9,
  //     high: response.data.data.fast / 1e9
  // }
};
import Notify from "bnc-notify";

export const notify = Notify({
  dappId: "ba574938-2a97-44e8-812f-653f9a6a499b", // [String] The API key created by step one above
  networkId: 5, // [Integer] The Ethereum network ID your Dapp uses.
  darkMode: true,
  desktopPosition: "topRight",
});

export function notifyHandler(hash) {
  let { emitter } = notify.hash(hash);
  let chain = window.ethereum.chainId == "0x5" ? "goerli." : "";
  emitter.on("all", (transaction) => ({
    onclick: () =>
      window.open(
        `https://${chain}etherscan.io/tx/${transaction.hash}`,
        "_blank",
        "noopener norefferer"
      ) && console.log("notify handler tx", transaction),
  }));
}

export function notifyNotification(message, type = "pending") {
  let notificationObject = {
    eventCode: "notification",
    type: type,
    message: message,
  };

  return notify.notification(notificationObject);
}

import Web3 from "web3";
const web3 = new Web3();
export function toWei(value) {
  console.log(web3);
  if (!value || value == 0 || !value?.toString) return 0;
  return web3.utils.toWei(value.toString(), "ether");
}

export function toChecksumAddress(address) {
  return web3.utils.toChecksumAddress(address);
}
