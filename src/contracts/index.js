/**
 * This file includes the contract informations 
 * such as abi's, addresses and constants imported from contracts folder.
 * Import any contract to use from here.
 * DELETE USELESS INFO 
**/

import { ethers } from 'ethers';
import { notifyNotification } from '@/utils/common';
import sharedStake from './abis/sharedStake.json'
import vEth2Token from './abis/vEth2Token.json'
import erc20 from './abis/erc20.json'
import erc20_uniswap from './abis/erc20_uniswap.json'
import geyserABI from './abis/geyser.json'
import geyserABI_new from './abis/geyserV2.json'
import sgtABI from './abis/erc20.json'
import airdrop_distributor from './abis/distributor.json'
import migratorABI from './abis/migrator.json' 

// https://github.com/chimera-defi/SharedDeposit/blob/main/data/abi/Withdrawals.json
import withdrawalsABI from './abis/withdrawals.json'
import rolloversABI from './abis/rollovers.json'
import sgETHABI from './abis/sgETH.json'
import wsgETHABI from './abis/wsgETH.json'

// Chain-specific contract addresses
import mainnetAddresses from './addresses/mainnet.json'
import goerliAddresses from './addresses/goerli.json'
import sepoliaAddresses from './addresses/sepolia.json'

let _addresses = {};

let _geyser_vEth2_old;
let _geyser_SGT_old;
let _geyser_SGT_uniswap_old;
let _geyser_vEth2_saddle_old;

// V2 changes
const chainIdGoerli = "0x5";
const chainIdMainnet = "0x1";

const CHAIN_IDS = {
    GOERLI: chainIdGoerli,
    MAINNET: chainIdMainnet,
    SEPOLIA: "0xaa36a7",
    // Common development networks
    LOCALHOST: "0x7a69", // 31337 - Hardhat default
    LOCALHOST_ALT: "0x539", // 1337 - Ganache default
};


let _ABIs = {
    validator: sharedStake,
    vEth2: vEth2Token,
    SGT: sgtABI,
    geyser: geyserABI,
    erc20,
    erc20_uniswap,
    airdrop_distributor,
    geyser_new: geyserABI_new, 
    migrator:migratorABI,
    withdrawals: withdrawalsABI,
    rollovers: rolloversABI,
    sgETH: sgETHABI,
    wsgETH: wsgETHABI
}

let connErr = () => {
    console.log("Err: Fn not defined correctly. Is window.ethereum available? Is the right chain selected? Connect wallet to continue");
    return null; // Return null instead of undefined
};
let createContract = () => connErr();
let createContractDefault = () => connErr();
let isValidChain = (cid) => Object.values(CHAIN_IDS).indexOf(cid) > -1;
// makes sure all addresses are checksumed (not needed with ethers.js as it handles this automatically)
// let checksumAddresses = (_addresses, web3) => {
//     for (const x in _addresses) {
//         _addresses[x] = web3.utils.toChecksumAddress(_addresses[x]);
//     }
//     return _addresses;
// }


// Initialize ethers.js and contracts when window.ethereum is available
let provider = null;
let signer = null;
let isInitialized = false;

// Helper function to get provider/signer based on useSigner flag
// Moved to module scope so it can be reused by createContractWithAddress
const getContractProvider = (useSigner = false) => {
    return useSigner && signer ? signer : provider;
};

// Function to initialize ethers.js and contracts
const initializeEthers = async () => {
    if (window.ethereum && !isInitialized) {
        try {
            provider = new ethers.BrowserProvider(window.ethereum);
            signer = null; // Will be set when user connects wallet
            isInitialized = true;
            
            // Listen for network changes and reinitialize
            if (window.ethereum.on) {
                window.ethereum.on('chainChanged', (newChainId) => {
                    console.log('Network changed to:', newChainId);
                    // Reset initialization flag to allow reinitialization
                    isInitialized = false;
                    // Reinitialize with new network
                    setTimeout(() => {
                        initializeEthers().catch(error => {
                            console.error("Error reinitializing after network change:", error);
                        });
                    }, 100);
                });
            }
            
            // Get chain ID properly using ethers.js provider with fallback
            let chainId;
            try {
                const network = await provider.getNetwork();
                chainId = "0x" + network.chainId.toString(16);
            } catch (networkError) {
                // Fallback to window.ethereum.chainId if ethers.js fails
                chainId = window.ethereum.chainId;
                console.warn("Ethers.js network detection failed, using window.ethereum.chainId:", chainId, "Error:", networkError);
            }
            
            // Ensure chainId is in hex format
            if (chainId && !chainId.startsWith('0x')) {
                chainId = "0x" + parseInt(chainId).toString(16);
            }
            
            let addressTemp = {};

            if (chainId == CHAIN_IDS.MAINNET) {
                addressTemp = mainnetAddresses;
            } else if (chainId == CHAIN_IDS.GOERLI) {
                addressTemp = goerliAddresses;
            } else if (chainId == CHAIN_IDS.SEPOLIA) {
                addressTemp = sepoliaAddresses;
            }

            // Always define contract creation functions
            createContract = (abi, address, useSigner = false) => {
                if (
                    _addresses && _ABIs &&
                    _addresses[address] && _ABIs[abi]
                ) {
                    const contractProvider = getContractProvider(useSigner);
                    if (!contractProvider) {
                        console.warn("Provider not available for contract:", abi, "->", address);
                        return null;
                    }
                    return new ethers.Contract(_addresses[address], _ABIs[abi], contractProvider);
                }
                    console.warn("Contract creation failed for:", abi, "->", address);
                return null;
            }
            createContractDefault = (name, useSigner = false) => createContract(name, name, useSigner)

            if (isValidChain(chainId)) {
                _addresses = addressTemp; // ethers.js handles checksumming automatically
                console.info("Contracts initialized for chain:", chainId);
            } else {
                const chainDecimal = parseInt(chainId, 16);
                console.warn(`Unsupported chain detected: ${chainId} (${chainDecimal}). Supported chains: Mainnet (0x1), Goerli (0x5), Sepolia (0xaa36a7). App will run in limited mode.`);
                
                // Show user-friendly notification
                try {
                    notifyNotification(
                        `Unsupported network detected (Chain ID: ${chainDecimal}). Please switch to Ethereum Mainnet, Goerli, or Sepolia for full functionality.`,
                        "error"
                    );
                } catch (e) {
                    console.log("Could not show notification:", e);
                }
                
                // For development networks (high chain IDs), use Sepolia as fallback
                if (chainDecimal > 1000) { 
                    console.info("Using Sepolia addresses as fallback for development network");
                    addressTemp = sepoliaAddresses;
                    _addresses = addressTemp;
                    console.warn("⚠️ Using fallback addresses - contracts may not function correctly on this network");
                } else {
                    // Set empty addresses to prevent contract creation
                    _addresses = {};
                }
            }

            /************************************* CONTRACTS ****************************************/
        } catch (error) {
            console.error("Error initializing ethers.js:", error);
            connErr();
        }
    }
};

// Initialize immediately if window.ethereum is available
if (window.ethereum) {
    initializeEthers().catch(error => {
        console.error("Error during contract initialization:", error);
    });
} else {
    // Wait for window.ethereum to be available
    const checkEthereum = () => {
        if (window.ethereum) {
            initializeEthers().catch(error => {
                console.error("Error during contract initialization:", error);
            });
        } else {
            setTimeout(checkEthereum, 100);
        }
    };
    checkEthereum();
}

// Function to get signer
export const getSigner = async () => {
    if (provider && !signer) {
        try {
            signer = await provider.getSigner();
        } catch (error) {
            console.error("Error getting signer:", error);
        }
    }
    return signer;
};

export const addresses = _addresses
export const ABIs = _ABIs

// Contract factory functions
export const validator = (useSigner = false) => createContractDefault('validator', useSigner);
export const vEth2 = (useSigner = false) => createContractDefault('vEth2', useSigner);
export const SGT = (useSigner = false) => createContractDefault('SGT', useSigner);

// Token contracts
export const SGT_uniswap = (useSigner = false) => createContract("erc20_uniswap", "SGT_uniswap", useSigner);
export const SGT_vEth2_uniswap = (useSigner = false) => createContract("erc20_uniswap", "SGT_vEth2_uniswap", useSigner);
export const vEth2_saddle = (useSigner = false) => createContract("erc20", "vEth2_saddle", useSigner);
// Geyser contracts
export const geyser_vEth2 = (useSigner = false) => createContract("geyser", "geyser_vEth2", useSigner);
export const geyser_SGT = (useSigner = false) => createContract("geyser", "geyser_SGT", useSigner);
export const geyser_SGT_uniswap = (useSigner = false) => createContract("geyser", "geyser_SGT_uniswap", useSigner);
export const geyser_SGT_vEth2_uniswap = (useSigner = false) => createContract("geyser", "geyser_SGT_vEth2_uniswap", useSigner);
export const geyser_vEth2_saddle = (useSigner = false) => createContract("geyser_new", "geyser_vEth2_saddle", useSigner);

// Legacy geyser contracts
export const geyser_vEth2_old = (useSigner = false) => createContract("geyser", "geyser_vEth2_old", useSigner);
export const geyser_SGT_old = (useSigner = false) => createContract("geyser", "geyser_SGT_old", useSigner);
export const geyser_SGT_uniswap_old = (useSigner = false) => createContract("geyser", "geyser_SGT_uniswap_old", useSigner);
export const geyser_vEth2_saddle_old = (useSigner = false) => createContract("geyser", "geyser_vEth2_saddle_old", useSigner);

// Utility contracts
export const airdrop = (useSigner = false) => createContractDefault("airdrop_distributor", useSigner);
export const migrator = (useSigner = false) => createContractDefault("migrator", useSigner);

export const masterchef = (useSigner = false) => createContract('geyser_new', 'masterchef', useSigner);
export const SGT_sushiswap = (useSigner = false) => createContract('erc20_uniswap', 'SGT_sushiswap', useSigner);
export const veSGT = (useSigner = false) => createContract('erc20', 'veSGT', useSigner);
export const vETH2_CRV = (useSigner = false) => createContract('erc20', 'vETH2_CRV', useSigner);

export const withdrawals = (useSigner = false) => createContractDefault('withdrawals', useSigner);
export const rollovers = (useSigner = false) => createContractDefault("rollovers", useSigner);
export const sgETH = (useSigner = false) => createContractDefault('sgETH', useSigner);
export const wsgETH = (useSigner = false) => createContractDefault("wsgETH", useSigner);

// Deprecated withdrawals contracts - returns array of contract addresses
export const getDeprecatedWithdrawalsAddresses = () => {
    // Array of deprecated contract addresses
    const deprecatedAddresses = [];
    
    // Add deprecated contract addresses if they exist and are not empty
    if (_addresses) {
        // Check all withdrawals_deprecated_v{N} keys
        Object.keys(_addresses).forEach((key) => {
            if (key.startsWith('withdrawals_deprecated_')) {
                const address = _addresses[key];
                if (address && address.trim() !== '' && address.startsWith('0x')) {
                    deprecatedAddresses.push(address);
                }
            }
        });
    }
    
    return deprecatedAddresses;
};

// Helper function to create contract with address directly (reuses createContract provider/signer logic)
const createContractWithAddress = (address, abi, useSigner = false) => {
    if (!address || !_ABIs || !_ABIs[abi]) {
        console.warn("Cannot create contract:", abi, "->", address);
        return null;
    }
    // Reuse the same provider/signer logic as createContract
    const contractProvider = getContractProvider(useSigner);
    if (!contractProvider) {
        console.warn("Provider not available for contract:", abi, "->", address);
        return null;
    }
    // Use the same contract creation pattern as createContract
    return new ethers.Contract(address, _ABIs[abi], contractProvider);
};

// Create contract instance for a specific address (for deprecated contracts)
// Reuses createContract logic via createContractWithAddress helper
export const createDeprecatedWithdrawalsContract = (address, useSigner = false) => {
    return createContractWithAddress(address, 'withdrawals', useSigner);
};

export const oldPools = {
    geyser_SGT: _geyser_SGT_old,
    geyser_SGT_uniswap: _geyser_SGT_uniswap_old,
    geyser_vEth2: _geyser_vEth2_old,
    geyser_vEth2_saddle: _geyser_vEth2_saddle_old
}
