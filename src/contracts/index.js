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
import geyserABI_new from './abis/geyserV2.json'
import sgtABI from './abis/erc20.json' //change this
import airdrop_distributor from './abis/distributor.json' //change this
import migratorABI from './abis/migrator.json' 

// https://github.com/chimera-defi/SharedDeposit/blob/main/data/abi/Withdrawals.json
import withdrawalsABI from './abis/withdrawals.json'
import rolloversABI from './abis/rollovers.json'
import sgETHABI from './abis/sgETH.json'

let _addresses;
let _ABIs;
let _validator;
let _vEth2;
let _SGT;
let _SGT_uniswap;
let _SGT_vEth2_uniswap;
let _vEth2_saddle;
let _geyser_vEth2_saddle;
let _geyser_vEth2;
let _geyser_SGT;
let _geyser_SGT_uniswap;
let _geyser_SGT_vEth2_uniswap;
let _airdrop;

let _geyser_vEth2_old;
let _geyser_SGT_old;
let _geyser_SGT_uniswap_old;
let _geyser_vEth2_saddle_old;

// V2 changes
let _migrator;
let createContract = () => null;

const chainIdGoerli = "0x5";
const chainIdMainnet = "0x1";

const CHAIN_IDS = {
    GOERLI: chainIdGoerli,
    MAINNET: chainIdMainnet
};

if (window.ethereum) {

    const web3 = new Web3(window.ethereum);

    // @TODO: Figure out what causes FF to not connect the wallet correctly. 
    let chainId = window.ethereum.chainId;
    let addressTemp;

    if (chainId == CHAIN_IDS.MAINNET) {
        addressTemp = {
            validator: "0xbca3b7b87dcb15f0efa66136bc0e4684a3e5da4d",//🆗
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
            masterchef: '0x84B7644095d9a8BFDD2e5bfD8e41740bc1f4f412'
        }
    } else if (chainId == CHAIN_IDS.GOERLI) {
        addressTemp = {
            validator: "0x5464Eb94ECf019d5b05099A89dB302cF7ac3e863",// 
            // Protocol Tokens
            vEth2: "0x0D3C0916B0DF1Ae387eDa7fD1cb77d2e244826E6",// 
            SGT: "0x523371408DCc722e70cb53C3800b355fd9485e05", // 
            // Geysers
            geyser_SGT: "0x02815a0df29858a41c9fb948103f7aa496d13e02",// 
            geyser_vEth2: "0x02815a0df29858a41c9fb948103f7aa496d13e02",// no need to edit
            geyser_SGT_uniswap: "0x02815a0df29858a41c9fb948103f7aa496d13e02",// no need to edit
            
            // New withdrawals contract.
            withdrawals: "0xd70201Ea40c12cFE6Bf69Dc9A2ca9FB14bb8DB0b",
            rollovers: "0xaa93EF92Ef8663902BeE679B9B8bFB60c966d50C",

            sgETH: "0x453B459249F82ba3f369651aD485Fa11C6F082F8",
            wsgETH: "0xbFA813C3266Af70A5Ddc15d9253655281e2bCd23"
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
        airdrop_distributor,
        geyser_new: geyserABI_new, //use this one for 
        migrator:migratorABI,
        withdrawals: withdrawalsABI,
        rollovers: rolloversABI,
        sgETH: sgETHABI
    }

    /************************************* CONTRACTS ****************************************/

    // VALIDATOR
    _validator = new web3.eth.Contract(_ABIs["validator"], _addresses["validator"]);

    // Protocol Tokens
    _vEth2 = new web3.eth.Contract(_ABIs["vEth2"], _addresses["vEth2"]);
    _SGT = new web3.eth.Contract(_ABIs["SGT"], _addresses["SGT"]);

    // OTHER Tokens HERE
    _SGT_uniswap = new web3.eth.Contract(_ABIs["erc20_uniswap"], _addresses["SGT_uniswap"]);
    _SGT_vEth2_uniswap = new web3.eth.Contract(_ABIs["erc20_uniswap"], _addresses["SGT_vEth2_uniswap"]);
    _vEth2_saddle = new web3.eth.Contract(_ABIs["erc20"], _addresses["vEth2_saddle"]);
    // // Geysers
    _geyser_vEth2 = new web3.eth.Contract(_ABIs["geyser"], _addresses["geyser_vEth2"]);
    _geyser_SGT = new web3.eth.Contract(_ABIs["geyser"], _addresses["geyser_SGT"]);
    _geyser_SGT_uniswap = new web3.eth.Contract(_ABIs["geyser"], _addresses["geyser_SGT_uniswap"]);
    _geyser_SGT_vEth2_uniswap = new web3.eth.Contract(_ABIs["geyser"], _addresses["geyser_SGT_vEth2_uniswap"]);
    _geyser_vEth2_saddle = new web3.eth.Contract(_ABIs["geyser_new"], _addresses["geyser_vEth2_saddle"]);


    // OLD Geysers HERE
    _geyser_vEth2_old = new web3.eth.Contract(_ABIs["geyser"], _addresses["geyser_vEth2_old"]);
    _geyser_SGT_old = new web3.eth.Contract(_ABIs["geyser"], _addresses["geyser_SGT_old"]);
    _geyser_SGT_uniswap_old = new web3.eth.Contract(_ABIs["geyser"], _addresses["geyser_SGT_uniswap_old"]);
    _geyser_vEth2_saddle_old = new web3.eth.Contract(_ABIs["geyser"], _addresses["geyser_vEth2_saddle_old"]);

    //Airdrop
    _airdrop = new web3.eth.Contract(_ABIs["airdrop_distributor"], _addresses["airdrop_distributor"]);

    //Migrator
    _migrator=new web3.eth.Contract(_ABIs["migrator"], _addresses["migrator"]);

    // NEW farm

    createContract = (abi, address) => {
        return new web3.eth.Contract(_ABIs[abi], _addresses[address]);
    }
    /*********************************** DELETE USELESS INFO *******************************/
}

export const addresses = _addresses
export const ABIs = _ABIs
export const validator = _validator
export const vEth2 = _vEth2
export const SGT = _SGT
export const SGT_uniswap = _SGT_uniswap
export const SGT_vEth2_uniswap = _SGT_vEth2_uniswap
export const geyser_vEth2 = _geyser_vEth2
export const vEth2_saddle = _vEth2_saddle
export const geyser_vEth2_saddle = _geyser_vEth2_saddle
export const geyser_SGT = _geyser_SGT
export const geyser_SGT_uniswap = _geyser_SGT_uniswap
export const geyser_SGT_vEth2_uniswap = _geyser_SGT_vEth2_uniswap
export const airdrop = _airdrop;
export const migrator = _migrator;
export const masterchef = createContract('geyser_new', 'masterchef');
export const SGT_sushiswap = createContract('erc20_uniswap', 'SGT_sushiswap');
export const veSGT = createContract('erc20', 'veSGT');
export const vETH2_CRV = createContract('erc20', 'vETH2_CRV');
export const withdrawals = createContract('withdrawals', 'withdrawals');
export const rollovers = createContract("rollovers", "rollovers");
export const sgETH = createContract('sgETH', 'sgETH');
export const wsgETH = createContract("sgETH", "wsgETH"); // re-use sgeth abi as we just need approve
export const oldPools = {
    geyser_SGT: _geyser_SGT_old,
    geyser_SGT_uniswap: _geyser_SGT_uniswap_old,
    geyser_vEth2: _geyser_vEth2_old,
    geyser_vEth2_saddle: _geyser_vEth2_saddle_old
}
