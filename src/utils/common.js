/**
 * This file includes common libraries and settings for them; such as axios, web3, bignumber.js.
 * import the libraries from here to use
 */
// import axios from "axios"

export const getCurrentGasPrices = async () => {
  try {
    const gasPrice = await web3.eth.getGasPrice();

    // Convert the gas price from wei to gwei, and then to a number.
    const gasPriceInGwei = Number(web3.utils.fromWei(gasPrice, "gwei"));
    // Min gas price check
    const lowGasPrice = Math.max(
      gasPriceInGwei * 0.8,
      web3.utils.fromWei("21000", "gwei")
    );

    return {
      low: lowGasPrice, // Here we're assuming low is 80% of the current gas price but a min of 2100wei.
      medium: gasPriceInGwei,
      high: gasPriceInGwei * 1.2, // Here we're assuming high is 120% of the current gas price.
      tip: {
        low: 1, // Adjust these priority fees as you see fit.
        medium: 2,
        high: 5,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      error: "Unable to retrieve current gas prices.",
    };
  }
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
import { RPC_URL } from "../store/init/onboard";
const web3 = new Web3(
  new Web3.providers.HttpProvider(RPC_URL)
);
export function toWei(value) {
  console.log(web3);
  if (!value || value == 0 || !value?.toString) return 0;
  return web3.utils.toWei(value.toString(), "ether");
}

export function toChecksumAddress(address) {
  return web3.utils.toChecksumAddress(address);
}
