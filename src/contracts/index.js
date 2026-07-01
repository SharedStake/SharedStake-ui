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

import withdrawalsABI from './abis/withdrawals.json'
import rolloversABI from './abis/rollovers.json'
import sgETHABI from './abis/sgETH.json'
import wsgETHABI from './abis/wsgETH.json'
import stTokenABI from './abis/stToken.json'
import wstTokenABI from './abis/wstToken.json'
import stTokenERC4626WrapperABI from './abis/stTokenERC4626Wrapper.json'
import stakingRouterABI from './abis/stakingRouter.json'
import withdrawalQueueV2ABI from './abis/withdrawalQueueV2.json'
import oldVeth2WithdrawalQueueABI from './abis/oldVeth2WithdrawalQueue.json'
import validatorModuleABI from './abis/validatorModule.json'
import operatorRegistryABI from './abis/operatorRegistry.json'
import sgethV1ClaimABI from './abis/sgethV1Claim.json'

// Chain-specific contract addresses
import mainnetAddresses from './addresses/mainnet.json'
import goerliAddresses from './addresses/goerli.json'
import sepoliaAddresses from './addresses/sepolia.json'
import localAddresses from './addresses/local.json'

let _addresses = {};

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

const ADDRESS_OVERRIDES_QUERY_KEY = "e2eContracts";
const ADDRESS_OVERRIDES_STORAGE_KEY = "e2eContractAddresses";

const normalizeChainId = (chainId) => {
    if (!chainId && chainId !== 0) return "";
    if (typeof chainId === "number") return `0x${chainId.toString(16)}`;
    if (typeof chainId === "bigint") return `0x${chainId.toString(16)}`;
    if (typeof chainId !== "string") return "";
    if (chainId.startsWith("0x")) {
        const parsed = parseInt(chainId, 16);
        if (!Number.isNaN(parsed)) return `0x${parsed.toString(16)}`;
        return chainId.toLowerCase();
    }
    const parsed = Number(chainId);
    if (!Number.isNaN(parsed)) return `0x${parsed.toString(16)}`;
    return chainId.toLowerCase();
};

const parseAddressOverrides = (rawValue) => {
    if (!rawValue) return null;
    try {
        const parsed = JSON.parse(rawValue);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            return parsed;
        }
    } catch (error) {
        console.warn("Failed to parse e2e contract address overrides:", error);
    }
    return null;
};

// Contract address overrides are intentionally restricted to local dev chains.
// Allowing them on mainnet/testnet would let an attacker craft URLs that point
// users at malicious contracts and steal deposited funds.
const getAddressOverrides = (isLocalChain) => {
    if (!isLocalChain) return null;
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const queryOverride = parseAddressOverrides(params.get(ADDRESS_OVERRIDES_QUERY_KEY));
    if (queryOverride) return queryOverride;
    const localStorageValue = window.localStorage?.getItem(ADDRESS_OVERRIDES_STORAGE_KEY);
    return parseAddressOverrides(localStorageValue);
};

const getAddressMapForChain = (chainId) => {
    const normalizedChainId = normalizeChainId(chainId);
    const isLocalChain = normalizedChainId === CHAIN_IDS.LOCALHOST || normalizedChainId === CHAIN_IDS.LOCALHOST_ALT;
    const baseAddresses = normalizedChainId === CHAIN_IDS.MAINNET
        ? mainnetAddresses
        : normalizedChainId === CHAIN_IDS.GOERLI
            ? goerliAddresses
            : normalizedChainId === CHAIN_IDS.SEPOLIA
                ? sepoliaAddresses
                : isLocalChain
                    ? { ...sepoliaAddresses, ...localAddresses }
                    : {};

    const overrides = getAddressOverrides(isLocalChain);
    return overrides ? { ...baseAddresses, ...overrides } : baseAddresses;
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
    wsgETH: wsgETHABI,
    stToken: stTokenABI,
    wstToken: wstTokenABI,
    stTokenERC4626Wrapper: stTokenERC4626WrapperABI,
    stakingRouter: stakingRouterABI,
    withdrawalQueueV2: withdrawalQueueV2ABI,
    oldVeth2WithdrawalQueue: oldVeth2WithdrawalQueueABI,
    validatorModule: validatorModuleABI,
    operatorRegistry: operatorRegistryABI,
    sgethV1Claim: sgethV1ClaimABI
}

let connErr = () => {
    console.log("Err: Fn not defined correctly. Is window.ethereum available? Is the right chain selected? Connect wallet to continue");
    return null; // Return null instead of undefined
};
let createContract = () => connErr();
let createContractDefault = () => connErr();
let isValidChain = (cid) => Object.values(CHAIN_IDS).includes(normalizeChainId(cid));
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

const refreshSignerFromProvider = async () => {
    if (!provider) {
        signer = null;
        return null;
    }

    try {
        const accounts = await provider.send("eth_accounts", []);
        if (Array.isArray(accounts) && accounts.length > 0) {
            signer = await provider.getSigner(accounts[0]);
            return signer;
        }
    } catch (error) {
        console.warn("Could not refresh signer from provider:", error);
    }

    signer = null;
    return null;
};

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
            signer = null; // Refreshed from provider accounts when available
            isInitialized = true;
            await refreshSignerFromProvider();
            
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

                window.ethereum.on('accountsChanged', (accounts) => {
                    console.log('Accounts changed:', accounts);
                    refreshSignerFromProvider().catch(error => {
                        console.error("Error refreshing signer after account change:", error);
                    });
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
            
            chainId = normalizeChainId(chainId);
            let addressTemp = getAddressMapForChain(chainId);

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
                console.warn(`Unsupported chain detected: ${chainId} (${chainDecimal}). Supported chains: Mainnet (0x1), Goerli (0x5), Sepolia (0xaa36a7), Localhost (0x7a69/0x539). App will run in limited mode.`);
                
                // Show user-friendly notification
                try {
                    notifyNotification(
                        `Unsupported network detected (Chain ID: ${chainDecimal}). Please switch to Ethereum Mainnet, Goerli, Sepolia, or localhost for full functionality.`,
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
export const stTokenERC4626Wrapper = (useSigner = false) => createContractDefault('stTokenERC4626Wrapper', useSigner);
// Geyser contracts
export const geyser_vEth2 = (useSigner = false) => createContract("geyser", "geyser_vEth2", useSigner);
export const geyser_SGT = (useSigner = false) => createContract("geyser", "geyser_SGT", useSigner);
export const geyser_SGT_uniswap = (useSigner = false) => createContract("geyser", "geyser_SGT_uniswap", useSigner);
export const geyser_SGT_vEth2_uniswap = (useSigner = false) => createContract("geyser", "geyser_SGT_vEth2_uniswap", useSigner);
export const geyser_vEth2_saddle = (useSigner = false) => createContract("geyser_new", "geyser_vEth2_saddle", useSigner);

// Utility contracts
const isDevMode = typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV;
const mockAirdropState = {
    claimedIndexes: new Set()
};
let mockAirdropContract = null;

const normalizeClaimIndex = (index) => {
    try {
        return BigInt(index).toString();
    } catch (error) {
        console.warn("Invalid claim index:", index, error);
        return null;
    }
};

const getMockAirdropContract = () => {
    if (mockAirdropContract) return mockAirdropContract;
    mockAirdropContract = {
        async isClaimed(index) {
            const normalized = normalizeClaimIndex(index);
            if (!normalized) return false;
            return mockAirdropState.claimedIndexes.has(normalized);
        },
        async claim(index) {
            const normalized = normalizeClaimIndex(index);
            if (!normalized) {
                throw new Error("Invalid claim index");
            }
            if (mockAirdropState.claimedIndexes.has(normalized)) {
                throw new Error("Airdrop already claimed");
            }
            mockAirdropState.claimedIndexes.add(normalized);
            const hash = ethers.hexlify(ethers.randomBytes(32));
            return {
                hash,
                wait: async () => ({ status: 1, hash })
            };
        }
    };
    return mockAirdropContract;
};

export const airdrop = (useSigner = false) => {
    const contract = createContractDefault("airdrop_distributor", useSigner);
    if (contract) return contract;
    if (!isDevMode) return null;
    return getMockAirdropContract();
};
export const migrator = (useSigner = false) => createContractDefault("migrator", useSigner);

export const masterchef = (useSigner = false) => createContract('geyser_new', 'masterchef', useSigner);
export const SGT_sushiswap = (useSigner = false) => createContract('erc20_uniswap', 'SGT_sushiswap', useSigner);
export const veSGT = (useSigner = false) => createContract('erc20', 'veSGT', useSigner);
export const vETH2_CRV = (useSigner = false) => createContract('erc20', 'vETH2_CRV', useSigner);

export const withdrawals = (useSigner = false) => createContractDefault('withdrawals', useSigner);
export const rollovers = (useSigner = false) => createContractDefault("rollovers", useSigner);
export const oldVeth2WithdrawalQueue = (useSigner = false) => createContractDefault('oldVeth2WithdrawalQueue', useSigner);
export const sgETH = (useSigner = false) => createContractDefault('sgETH', useSigner);
export const wsgETH = (useSigner = false) => createContractDefault("wsgETH", useSigner);
export const sgethV1Claim = (useSigner = false) => createContractDefault("sgethV1Claim", useSigner);

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

export const oldPools = {}
