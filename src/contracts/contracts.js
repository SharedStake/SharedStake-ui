/**
 * This file includes the contract informations 
 * such as abi's, addresses and constants imported from contracts folder.
 * Import any contract to use from here.
 * DELETE USELESS INFO 
**/

import Web3 from 'web3';
import sharedStake from './abis/sharedStake.json'
import vEth2Token from './abis/vEth2Token.json'
import geyserABI from './abis/geyser.json'
import sgtABI from './abis/geyser.json' //change this

const web3 = new Web3(window.ethereum);

let chainId = window.ethereum.chainId;
let addressTemp;

if (chainId == "0x1") {
    addressTemp = {
        validator: "0xbca3b7b87dcb15f0efa66136bc0e4684a3e5da4d",
        vEth2: "0x898bad2774eb97cf6b94605677f43b41871410b1",
        SGT: "0x898bad2774eb97cf6b94605677f43b41871410b1", //change this address and abi
        geyser_vEth2: "0x898bad2774eb97cf6b94605677f43b41871410b1",//change this address and abi
        geyser_SGT: "0x898bad2774eb97cf6b94605677f43b41871410b1",//change this address and abi
        geyser_SGT_uniswap: "0x898bad2774eb97cf6b94605677f43b41871410b1",//change this address and abi
    }
} else {
    addressTemp = {
        validator: "0xF7930fA4cddbf00Ea495f9A522010734580909f8",
        vEth2: "0x64A0ED7f89d9F6de790F7d77022017be9Dcb405A",
    }
}

export const addresses = addressTemp;

export const ABIs = {
    validator: sharedStake,
    vEth2: vEth2Token,
    SGT: sgtABI,//change this address and abi
    geyser: geyserABI//change this address and abi
}

// VALIDATOR
export const validator = new web3.eth.Contract(ABIs["validator"], addresses["validator"]);

// Protocol Tokens
export const vEth2 = new web3.eth.Contract(ABIs["vEth2"], addresses["vEth2"]);
export const SGT = new web3.eth.Contract(ABIs["SGT"], addresses["SGT"]);

// Geysers
export const geyser_vEth2 = new web3.eth.Contract(ABIs["geyser"], addresses["geyser_vEth2"]);
export const geyser_SGT = new web3.eth.Contract(ABIs["geyser"], addresses["geyser_SGT"]);
export const geyser_uniswap = new web3.eth.Contract(ABIs["geyser"], addresses["geyser_SGT_uniswap"]);

// OLD Geysers HERE

// OTHER Tokens HERE


/************************************* DELETE USELESS INFO ****************************************/