/**
 * This file includes the contract informations 
 * such as abi's, addresses and constants imported from contracts folder.
 * Import any contract to use from here.
 * DELETE USELESS INFO 
**/

import Web3 from 'web3';
import sharedStake from './abis/sharedStake.json'
import vEth2Token from './abis/vEth2Token.json'
import erc20 from './abis/erc20.json'
import erc20_uniswap from './abis/erc20_uniswap.json'
import geyserABI from './abis/geyser.json'
import sgtABI from './abis/erc20.json' //change this

const web3 = new Web3(window.ethereum);

let chainId = window.ethereum.chainId;
let addressTemp;

if (chainId == "0x1") {
    addressTemp = {
        validator: "0xbca3b7b87dcb15f0efa66136bc0e4684a3e5da4d",
        // Protocol Tokens
        vEth2: "0x898bad2774eb97cf6b94605677f43b41871410b1",
        SGT: "0x0a2395cA473c3c756738905574F71A20A19e8dB2", //changed 🆗
        // OTHER Tokens
        SGT_uniswap: "0xE4f8F3CB9b33247789e4984A457bb69A1a621Df3",// change this address
        vETH2_snowswap: "0xCd6713970828B32113d12B2dE0872a3CaFAf65b5",//  🆗
        // Geysers
        geyser_vEth2: "0x7d2c8B58032844F222e2c80219975805DcE1921c",// change this address
        geyser_vEth2_snowswap: "0x6208D3fdfC396eB065c8FFc291e6BC1902b8b1bf",// change this address when snowswap ended
        geyser_SGT: "0x7d2c8B58032844F222e2c80219975805DcE1921c",// change this address 
        geyser_SGT_uniswap: "0x4f1aD17E22f919fFf12bC936C1CaA9c5d49BF504",// change this address 
        // OLD Geysers
    }
} else {
    //Goerli
    addressTemp = {
        validator: "0xF7930fA4cddbf00Ea495f9A522010734580909f8",// 🆗
        // Protocol Tokens
        vEth2: "0x64A0ED7f89d9F6de790F7d77022017be9Dcb405A",// 🆗
        SGT: "0x523371408DCc722e70cb53C3800b355fd9485e05", // 🆗
        // Geysers
        geyser_SGT: "0xFD126CE5887AD11618cfBbdc59F1F382C528d761",// 🆗
        geyser_vEth2: "0xFD126CE5887AD11618cfBbdc59F1F382C528d761",// no need to edit
        geyser_vEth2_snowswap: "0xFD126CE5887AD11618cfBbdc59F1F382C528d761",//no need to edit
        geyser_SGT_uniswap: "0xFD126CE5887AD11618cfBbdc59F1F382C528d761",// no need to edit
        // OLD Geysers
    }
}

export const addresses = addressTemp;
// makes sure all addresses are checksumed
for (const x in addresses) {
    addresses[x] = web3.utils.toChecksumAddress(addresses[x])
}

export const ABIs = {
    validator: sharedStake,
    vEth2: vEth2Token,
    SGT: sgtABI, //change this and abi
    geyser: geyserABI,
    erc20,
    erc20_uniswap,
}

/************************************* CONTRACTS ****************************************/

// VALIDATOR
export const validator = new web3.eth.Contract(ABIs["validator"], addresses["validator"]);

// Protocol Tokens
export const vEth2 = new web3.eth.Contract(ABIs["vEth2"], addresses["vEth2"]);
export const SGT = new web3.eth.Contract(ABIs["SGT"], addresses["SGT"]);

// OTHER Tokens HERE
export const SGT_uniswap = new web3.eth.Contract(ABIs["erc20_uniswap"], addresses["SGT_uniswap"]);
export const vEth2_snowswap = new web3.eth.Contract(ABIs["erc20_uniswap"], addresses["SGT_uniswap"]);

// // Geysers
export const geyser_vEth2 = new web3.eth.Contract(ABIs["geyser"], addresses["geyser_vEth2"]);
export const geyser_SGT = new web3.eth.Contract(ABIs["geyser"], addresses["geyser_SGT"]);
export const geyser_SGT_uniswap = new web3.eth.Contract(ABIs["geyser"], addresses["geyser_SGT_uniswap"]);


// OLD Geysers HERE
/*********************************** DELETE USELESS INFO *******************************/