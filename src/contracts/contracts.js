/**
 * This file includes the contract informations such as abi's constants and addresses imported from contracts folder.
 * import any contract to use from here
 */
import Web3 from 'web3';
import sharedStake from './abis/sharedStake.json'
import vEth2Token from './abis/vEth2Token.json'

const web3 = new Web3(window.ethereum);

let chainId = window.ethereum.chainId;
let addressTemp;

if (chainId == "0x1") {
    addressTemp = {
        validator: "0xbca3b7b87dcb15f0efa66136bc0e4684a3e5da4d",
        beth: "0x898bad2774eb97cf6b94605677f43b41871410b1",
    }
} else {
    addressTemp = {
        validator: "0xF7930fA4cddbf00Ea495f9A522010734580909f8",
        beth: "0x64A0ED7f89d9F6de790F7d77022017be9Dcb405A",
    }
}

export const addresses = addressTemp;

export const ABIs = {
    validator: sharedStake,
    beth: vEth2Token
}

export const validator = new web3.eth.Contract(ABIs["validator"], addresses["validator"]);
export const bETH = new web3.eth.Contract(ABIs["beth"], addresses["beth"]);
