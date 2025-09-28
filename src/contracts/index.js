/**
 * This file includes the contract informations 
 * such as abi's, addresses and constants imported from contracts folder.
 * Import any contract to use from here.
 * DELETE USELESS INFO 
**/

import { ethers } from 'ethers';
import sharedStake from './abis/sharedStake.json'
import vEth2Token from './abis/vEth2Token.json'
import erc20 from './abis/erc20.json'
import erc20_uniswap from './abis/erc20_uniswap.json'
import geyserABI from './abis/geyser.json'
import geyserABI_new from './abis/geyserV2.json'
import sgtABI from './abis/erc20.json' //change this
import airdrop_distributor from './abis/distributor.json' //change this
import migratorABI from './abis/migrator.json' 

// https://github.com/chimera-defi/SharedDeposit/blob/main/data/abi/Withdrawals.json
import withdrawalsABI from './abis/withdrawals.json'
import rolloversABI from './abis/rollovers.json'
import sgETHABI from './abis/sgETH.json'
import wsgETHABI from './abis/wsgETH.json'

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
    SEPOLIA: "0xaa36a7"
};


let _ABIs = {
    validator: sharedStake,
    vEth2: vEth2Token,
    SGT: sgtABI, //change this and abi
    geyser: geyserABI,
    erc20,
    erc20_uniswap,
    airdrop_distributor,
    geyser_new: geyserABI_new, //use this one for 
    migrator:migratorABI,
    withdrawals: withdrawalsABI,
    rollovers: rolloversABI,
    sgETH: sgETHABI,
    wsgETH: wsgETHABI
}

let connErr = () => console.log("Err: Fn not defined correctly. Is window.ethereum available? Is the right chain selected? Connect wallet to continue")
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

// Function to initialize ethers.js and contracts
const initializeEthers = () => {
    if (window.ethereum && !isInitialized) {
        try {
            provider = new ethers.BrowserProvider(window.ethereum);
            signer = null; // Will be set when user connects wallet
            isInitialized = true;
            
            // @TODO: Figure out what causes FF to not connect the wallet correctly. 
            let chainId = window.ethereum.chainId;
            let addressTemp = {};

            if (chainId == CHAIN_IDS.MAINNET) {
                addressTemp = {
                    validator: "0x85Bc06f4e3439d41f610a440Ba0FbE333736B310",// break for now - on mainnet, till we deploy audited new v2
                    // Protocol Tokens
                    vEth2: "0x898bad2774eb97cf6b94605677f43b41871410b1",
                    SGT: "0x84810bcF08744d5862B8181f12d17bfd57d3b078",
                    // OTHER Tokens
                    SGT_uniswap: "0x3d07f6e1627DA96B8836190De64c1aED70e3FC55",
                    SGT_vEth2_uniswap: "0xC794746Df95C4B7043E8d6B521cFECaB1b14C6cE",
                    vEth2_saddle: "0xe37E2a01feA778BC1717d72Bd9f018B6A6B241D5",
                    // Geysers
                    geyser_vEth2: "0x2b228842b97ab8a1f3dcd216ec5d553ada957915",// change this address
                    geyser_vEth2_saddle: "0x6f27C4E4888A7090CAD2e1b82D6e02eBb4FA06EC",
                    geyser_SGT: "0x3FD816A5943a77FA10DE73B44d891676bD818C9C",// change this address 
                    geyser_SGT_uniswap: "0x77d03ecC4d6a15C320dd3849973aA3a599cBB07F",// change this address 
                    geyser_SGT_vEth2_uniswap: "0x53dc9D5deB3B7f5cD9A3E4D19A2beCda559D57Aa",
                    // OLD Geysers
                    geyser_vEth2_old: "0xA919D7a5fb7ad4ab6F2aae82b6F39d181A027d35",
                    geyser_SGT_old: "0xc637dB981e417869814B2Ea2F1bD115d2D993597",
                    geyser_SGT_uniswap_old: "0x64A1DB33f68695df773924682D2EFb1161B329e8",
                    geyser_vEth2_saddle_old: "0xCF91812631e37C01c443a4fa02DfB59ee2DDbA7c",

                    // SGT airdrop
                    airdrop_distributor: "0x5d918012f56C7EF4c9b78fCA97c126ae13C0F639",
                    
                    //V2
                    migrator:"0x9615460582Efa2a9b1d8D21e7E02afE43A415E13",
                    SGT_sushiswap: '0x41bfba56b9ba48d0a83775d89c247180617266bc',
                    veSGT: '0x21b555305e9d65c8b8ae232e60fd806edc9c5d78',
                    vETH2_CRV: '0xf03bD3cfE85f00bF5819AC20f0870cE8a8d1F0D8',
                    masterchef: '0x84B7644095d9a8BFDD2e5bfD8e41740bc1f4f412',

                    // New contracts. shareddeposit v2
                    withdrawals: "0xa308f4a980c4a2960e9e87fc51dbf2b0b50ca432",
                    rollovers: "0x68a31dfD0c81A411C5adadc8A40225425777466C",

                    sgETH: "0x9e52dB44d62A8c9762FA847Bd2eBa9d0585782d1",
                    wsgETH: "0x31AA035313b1D2109e61Ee0E3662A86A8615fF1d"
                }
            } else if (chainId == CHAIN_IDS.GOERLI) {
                addressTemp = {
                    validator: "0xb6F4a4ae69df1EB0d7dE4141CAd600104FAC28f6",// 
                    // Protocol Tokens
                    vEth2: "0x0D3C0916B0DF1Ae387eDa7fD1cb77d2e244826E6",// 
                    SGT: "0x523371408DCc722e70cb53C3800b355fd9485e05", // 
                    // Geysers
                    geyser_SGT: "0x02815a0df29858a41c9fb948103f7aa496d13e02",// 
                    geyser_vEth2: "0x02815a0df29858a41c9fb948103f7aa496d13e02",// no need to edit
                    geyser_SGT_uniswap: "0x02815a0df29858a41c9fb948103f7aa496d13e02",// no need to edit
                    
                    // New withdrawals contract.
                    withdrawals: "0x330B12204596812946d010c24b0Da3c8Af37B37c",
                    rollovers: "0x8CcE3694d698cb5DF1e1bD8A948899449Ea94ffB",

                    sgETH: "0x0056390361289CAFc3E10b65AC4C49e44C08B7df",
                    wsgETH: "0x7b569f6eC245403B5fbF68aDa4aef95cb26b6351"
                }
            } else if (chainId == CHAIN_IDS.SEPOLIA) {
                addressTemp =
                {
                    sgETH: '0xCF4831EBE785437DC54a90018b1b410Bd16c8533',
                    wsgETH: '0x514dfd2d10eC6775f030BA2abcf7A2445C0CA6Fb',
                    validator: '0xd6Ad9a646330F1a937347a5cfaaDE57990109b5C',
                    PaymentSplitter: '0x38E86964A811Ee66D1139CD97C838B713F63779B',
                    withdrawals: '0x93Ec5A17176336C95Bfb537A71130d6eEA6eF73D',
                    RewardsReceiver: '0xAeBD9A9b883f539894A28CBCD866d50ca34000FD'
                }
            }

            if (isValidChain(chainId)) {
                _addresses = addressTemp; // ethers.js handles checksumming automatically

                // Utils
                createContract = (abi, address, useSigner = false) => {
                    if (
                        _addresses && _ABIs &&
                        _addresses[address] && _ABIs[abi]
                    ) {
                        const contractProvider = useSigner && signer ? signer : provider;
                        return new ethers.Contract(_addresses[address], _ABIs[abi], contractProvider);
                    }
                    return connErr();
                }
                createContractDefault = (name, useSigner = false) => createContract(name, name, useSigner)
            } else {
                console.log("invalid chain detected. PLEASE SWITCH TO ETH MAINNET OR TESTNET");
            }

            /************************************* CONTRACTS ****************************************/
        } catch (error) {
            console.error("Error initializing Web3:", error);
            connErr();
        }
    }
};

// Initialize immediately if window.ethereum is available
if (window.ethereum) {
    initializeEthers();
} else {
    // Wait for window.ethereum to be available
    const checkEthereum = () => {
        if (window.ethereum) {
            initializeEthers();
        } else {
            setTimeout(checkEthereum, 100);
        }
    };
    checkEthereum();
}

// Function to get signer and update contracts
export const getSigner = async () => {
    if (provider && !signer) {
        try {
            signer = await provider.getSigner();
            // Update all contracts with signer for write operations
            updateContractsWithSigner();
        } catch (error) {
            console.error("Error getting signer:", error);
        }
    }
    return signer;
};

// Function to update contracts with signer
const updateContractsWithSigner = () => {
    if (signer) {
        // Recreate contracts with signer for write operations
        // This will be called when user connects wallet
    }
};

export const addresses = _addresses
export const ABIs = _ABIs


// Export contract getters that return contracts when available
export const validator = (useSigner = false) => createContractDefault('validator', useSigner);
export const vEth2 = (useSigner = false) => createContractDefault('vEth2', useSigner);
export const SGT = (useSigner = false) => createContractDefault('SGT', useSigner);

    // OTHER Tokens HERE
export const SGT_uniswap = (useSigner = false) => createContract("erc20_uniswap", "SGT_uniswap", useSigner);
export const SGT_vEth2_uniswap = (useSigner = false) => createContract("erc20_uniswap", "SGT_vEth2_uniswap", useSigner);
export const vEth2_saddle = (useSigner = false) => createContract("erc20", "vEth2_saddle", useSigner);
    // // Geysers
export const geyser_vEth2 = (useSigner = false) => createContract("geyser", "geyser_vEth2", useSigner);
export const geyser_SGT = (useSigner = false) => createContract("geyser", "geyser_SGT", useSigner);
export const geyser_SGT_uniswap = (useSigner = false) => createContract("geyser", "geyser_SGT_uniswap", useSigner);
export const geyser_SGT_vEth2_uniswap = (useSigner = false) => createContract("geyser", "geyser_SGT_vEth2_uniswap", useSigner);
export const geyser_vEth2_saddle = (useSigner = false) => createContract("geyser_new", "geyser_vEth2_saddle", useSigner);


    // OLD Geysers HERE
export const geyser_vEth2_old = (useSigner = false) => createContract("geyser", "geyser_vEth2_old", useSigner);
export const geyser_SGT_old = (useSigner = false) => createContract("geyser", "geyser_SGT_old", useSigner);
export const geyser_SGT_uniswap_old = (useSigner = false) => createContract("geyser", "geyser_SGT_uniswap_old", useSigner);
export const geyser_vEth2_saddle_old = (useSigner = false) => createContract("geyser", "geyser_vEth2_saddle_old", useSigner);

    //Airdrop
export const airdrop = (useSigner = false) => createContractDefault("airdrop_distributor", useSigner);

    //Migrator
export const migrator = (useSigner = false) => createContractDefault("migrator", useSigner);

export const masterchef = (useSigner = false) => createContract('geyser_new', 'masterchef', useSigner);
export const SGT_sushiswap = (useSigner = false) => createContract('erc20_uniswap', 'SGT_sushiswap', useSigner);
export const veSGT = (useSigner = false) => createContract('erc20', 'veSGT', useSigner);
export const vETH2_CRV = (useSigner = false) => createContract('erc20', 'vETH2_CRV', useSigner);

export const withdrawals = (useSigner = false) => createContractDefault('withdrawals', useSigner);
export const rollovers = (useSigner = false) => createContractDefault("rollovers", useSigner);
export const sgETH = (useSigner = false) => createContractDefault('sgETH', useSigner);
export const wsgETH = (useSigner = false) => createContractDefault("wsgETH", useSigner);
export const oldPools = {
    geyser_SGT: _geyser_SGT_old,
    geyser_SGT_uniswap: _geyser_SGT_uniswap_old,
    geyser_vEth2: _geyser_vEth2_old,
    geyser_vEth2_saddle: _geyser_vEth2_saddle_old
}
