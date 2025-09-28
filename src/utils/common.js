/**
 * This file includes common libraries and settings for them; such as axios, ethers.js, bignumber.js.
 * import the libraries from here to use
 */
// import axios from "axios"
import gas from '@web3-onboard/gas'

export const getCurrentGasPrices = async () => {
  try { // Using the blocknative gas platform api https://docs.blocknative.com/gas-prediction/gas-platform
    const gasBlockPrices = await gas.get({
      chains: ['0x1'],
      // apiKey: '<OPTIONAL_API_KEY>',
      endpoint: 'blockPrices'
    });
    // console.log(gasBlockPrices[0].blockPrices[0].estimatedPrices)

    const estimatedPrices = gasBlockPrices[0].blockPrices[0].estimatedPrices;
    // console.log(estimatedPrices)
    return {
      low: {
        maxFeePerGas: estimatedPrices[4].maxFeePerGas,
        maxPriorityFeePerGas: estimatedPrices[4].maxPriorityFeePerGas,
      },
      medium: {
        maxFeePerGas: estimatedPrices[2].maxFeePerGas,
        maxPriorityFeePerGas: estimatedPrices[2].maxPriorityFeePerGas,
      },
      high: {
        maxFeePerGas: estimatedPrices[0].maxFeePerGas,
        maxPriorityFeePerGas: estimatedPrices[0].maxPriorityFeePerGas,
      }
    };
    
  } catch (error) {
    console.error(error);
    // If the API call fails, return hardcoded gas prices
    return {
      // Change hardcoded failover gas fees as and when required
      low: {
        maxFeePerGas: 29, //  Gwei
        maxPriorityFeePerGas: 1, //  Gwei
      },
      medium: {
        maxFeePerGas: 58, //  Gwei
        maxPriorityFeePerGas: 2, //  Gwei
      },
      high: {
        maxFeePerGas: 117, //  Gwei
        maxPriorityFeePerGas: 3, //  Gwei
      }
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

import { ethers } from "ethers";

export function toWei(value) {
  if (!value || value == 0 || !value?.toString) return "0";
  return ethers.parseEther(value.toString()).toString();
}

export function toChecksumAddress(address) {
  try {
    return ethers.getAddress(address);
  } catch (error) {
    console.error("Invalid address:", address);
    return address;
  }
}
