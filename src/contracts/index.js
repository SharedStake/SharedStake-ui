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
import airdrop_distributor from './abis/distributor.json' //change this

let _addresses;
let _ABIs;
let _validator;
let _vEth2;
let _SGT;
let _SGT_uniswap;
let _vEth2_snowswap;
let _geyser_vEth2;
let _geyser_SGT;
let _geyser_SGT_uniswap;
let _airdrop;
console.log(window.ethereum)
if (window.ethereum) {

    const web3 = new Web3(window.ethereum);

    let chainId = window.ethereum.chainId;

    // Hotfix for firefox. TODO: Figure out what causes FF to not connect the wallet correctly.
    chainId = "0x1";

    let addressTemp;

    if (chainId == "0x1") {
        addressTemp = {
            validator: "0xbca3b7b87dcb15f0efa66136bc0e4684a3e5da4d",
            // Protocol Tokens
            vEth2: "0x898bad2774eb97cf6b94605677f43b41871410b1",
            SGT: "0x84810bcF08744d5862B8181f12d17bfd57d3b078", //changed 🆗
            // OTHER Tokens
            SGT_uniswap: "0x3d07f6e1627DA96B8836190De64c1aED70e3FC55",//changed 🆗
            vETH2_snowswap: "0xCd6713970828B32113d12B2dE0872a3CaFAf65b5",//  🆗
            // Geysers
            geyser_vEth2: "0xA919D7a5fb7ad4ab6F2aae82b6F39d181A027d35",// change this address
            geyser_vEth2_snowswap: "0x6208D3fdfC396eB065c8FFc291e6BC1902b8b1bf",// change this address when snowswap ended
            geyser_SGT: "0xc637dB981e417869814B2Ea2F1bD115d2D993597",// change this address 
            geyser_SGT_uniswap: "0x64A1DB33f68695df773924682D2EFb1161B329e8",// change this address 
            // OLD Geysers
            // SGT airdrop
            airdrop_distributor: "0x342eb0fc69c2e20e2ae6338579af572b81cdbdf8",

        }
    } else {
        //Goerli = WHO CARES ANYMORE?
        addressTemp = {
            validator: "0xF7930fA4cddbf00Ea495f9A522010734580909f8",// 🆗
            // Protocol Tokens
            vEth2: "0x64A0ED7f89d9F6de790F7d77022017be9Dcb405A",// 🆗
            SGT: "0x523371408DCc722e70cb53C3800b355fd9485e05", // 🆗
            // Geysers
            geyser_SGT: "0x02815a0df29858a41c9fb948103f7aa496d13e02",// 🆗
            geyser_vEth2: "0x02815a0df29858a41c9fb948103f7aa496d13e02",// no need to edit
            geyser_vEth2_snowswap: "0x02815a0df29858a41c9fb948103f7aa496d13e02",//no need to edit
            geyser_SGT_uniswap: "0x02815a0df29858a41c9fb948103f7aa496d13e02",// no need to edit
            // OLD Geysers
        }
    }

    _addresses = addressTemp;
    // makes sure all addresses are checksumed
    for (const x in _addresses) {
        _addresses[x] = web3.utils.toChecksumAddress(_addresses[x])
    }

    _ABIs = {
        validator: sharedStake,
        vEth2: vEth2Token,
        SGT: sgtABI, //change this and abi
        geyser: geyserABI,
        erc20,
        erc20_uniswap,
        airdrop_distributor
    }

    /************************************* CONTRACTS ****************************************/

    // VALIDATOR
    _validator = new web3.eth.Contract(_ABIs["validator"], _addresses["validator"]);

    // Protocol Tokens
    _vEth2 = new web3.eth.Contract(_ABIs["vEth2"], _addresses["vEth2"]);
    _SGT = new web3.eth.Contract(_ABIs["SGT"], _addresses["SGT"]);

    // OTHER Tokens HERE
    _SGT_uniswap = new web3.eth.Contract(_ABIs["erc20_uniswap"], _addresses["SGT_uniswap"]);
    _vEth2_snowswap = new web3.eth.Contract(_ABIs["erc20_uniswap"], _addresses["SGT_uniswap"]);

    // // Geysers
    _geyser_vEth2 = new web3.eth.Contract(_ABIs["geyser"], _addresses["geyser_vEth2"]);
    _geyser_SGT = new web3.eth.Contract(_ABIs["geyser"], _addresses["geyser_SGT"]);
    _geyser_SGT_uniswap = new web3.eth.Contract(_ABIs["geyser"], _addresses["geyser_SGT_uniswap"]);


    // OLD Geysers HERE

    //Airdrop
    _airdrop = new web3.eth.Contract(_ABIs["airdrop_distributor"], _addresses["airdrop_distributor"]);

    /*********************************** DELETE USELESS INFO *******************************/
}
export const addresses = _addresses
export const ABIs = _ABIs
export const validator = _validator
export const vEth2 = _vEth2
export const SGT = _SGT
export const SGT_uniswap = _SGT_uniswap
export const vEth2_snowswap = _vEth2_snowswap
export const geyser_vEth2 = _geyser_vEth2
export const geyser_SGT = _geyser_SGT
export const geyser_SGT_uniswap = _geyser_SGT_uniswap
export const airdrop = _airdrop