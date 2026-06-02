/**
 * This file includes common libraries and settings for them; such as axios, ethers.js, bignumber.js.
 * import the libraries from here to use
 */
// import axios from "axios"
import { ethers } from "ethers";
import { useToast } from "vue-toastification";

export const getCurrentGasPrices = async () => {
  try {
    // Use ethers.js native gas estimation instead of @web3-onboard/gas
    const provider = window.ethersProvider || new ethers.JsonRpcProvider(import.meta.env.VITE_RPC_URL);
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

const ETHERSCAN_HOST_BY_CHAIN = {
  "0x1": "etherscan.io",
  "0x5": "goerli.etherscan.io",
  "0xaa36a7": "sepolia.etherscan.io",
};

const getToast = () => useToast();

const txUrlForHash = (hash) => {
  const chainId = window.ethereum?.chainId?.toLowerCase?.() || "0x1";
  const host = ETHERSCAN_HOST_BY_CHAIN[chainId] || ETHERSCAN_HOST_BY_CHAIN["0x1"];
  return `https://${host}/tx/${hash}`;
};

const shortHash = (hash) => `${hash.slice(0, 10)}...${hash.slice(-8)}`;

export const notify = {
  hash(hash) {
    const toast = getToast();
    toast.info(`Transaction submitted: ${shortHash(hash)}`, {
      timeout: 8000,
      onClick: () => window.open(txUrlForHash(hash), "_blank", "noopener,noreferrer"),
    });

    const emitter = {
      on(event, handler) {
        if (event === "all" && typeof handler === "function") {
          window.setTimeout(() => handler({ hash }), 0);
        }
        return emitter;
      },
    };

    return { emitter };
  },
  notification(notificationObject) {
    return notifyNotification(notificationObject.message, notificationObject.type);
  },
};

export function notifyHandler(hash) {
  notify.hash(hash);
}

export function notifyNotification(message, type = "pending") {
  const toast = getToast();
  const normalizedType = type === "error" || type === "success" || type === "info" ? type : "info";
  return toast[normalizedType](message);
}

export function toWei(value) {
  if (!value || value == 0 || !value?.toString) return "0";
  return ethers.parseEther(value.toString()).toString();
}

export function toChecksumAddress(address) {
  try {
    return ethers.getAddress(address);
  } catch (error) {
    console.error("Invalid address:", address, error);
    return address;
  }
}
