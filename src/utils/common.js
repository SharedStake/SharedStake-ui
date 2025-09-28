/**
 * This file includes common libraries and settings for them; such as axios, ethers.js, bignumber.js.
 * import the libraries from here to use
 */
// import axios from "axios"
import { ethers } from "ethers";

export const getCurrentGasPrices = async () => {
  try {
    // Use ethers.js native gas estimation instead of @web3-onboard/gas
    const provider = window.ethersProvider || new ethers.JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/Wck5Sff8d5x1yOLZtQq_qE2X--_ETOMd");
    const feeData = await provider.getFeeData();
    
    if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
      throw new Error("EIP-1559 not supported, falling back to hardcoded values");
    }

    // Convert from wei to gwei for easier handling
    const maxFeeGwei = Number(ethers.formatUnits(feeData.maxFeePerGas, "gwei"));
    const maxPriorityGwei = Number(ethers.formatUnits(feeData.maxPriorityFeePerGas, "gwei"));
    
    // Provide low, medium, high options based on current network fees
    return {
      low: {
        maxFeePerGas: Math.max(Math.round(maxFeeGwei * 0.9), 10), // 90% of current, min 10 Gwei
        maxPriorityFeePerGas: Math.max(Math.round(maxPriorityGwei * 0.8), 1), // 80% of current, min 1 Gwei
      },
      medium: {
        maxFeePerGas: Math.round(maxFeeGwei), // Current network fee
        maxPriorityFeePerGas: Math.round(maxPriorityGwei), // Current priority fee
      },
      high: {
        maxFeePerGas: Math.round(maxFeeGwei * 1.2), // 120% of current for faster confirmation
        maxPriorityFeePerGas: Math.round(maxPriorityGwei * 1.5), // 150% of current priority
      }
    };
    
  } catch (error) {
    console.error("Error fetching gas prices, using fallback:", error);
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
