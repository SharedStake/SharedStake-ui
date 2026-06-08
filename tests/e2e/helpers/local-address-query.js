import { readFileSync } from 'node:fs';
import { rpcRequest } from './impersonator.js';

export const LOCAL_ADDRESSES = JSON.parse(
  readFileSync(new URL('../../../src/contracts/addresses/local.json', import.meta.url), 'utf8')
);

export const localAddressQuery = (address) =>
  new URLSearchParams({
    e2eAddress: address,
    e2eContracts: JSON.stringify(LOCAL_ADDRESSES)
  }).toString();

export const REQUIRED_V2_CONTRACT_KEYS = [
  'stakingRouter',
  'stToken',
  'wstToken',
  'withdrawalQueueV2',
  'validatorModule',
];

const isAddress = (value) => /^0x[a-fA-F0-9]{40}$/.test(value || '');

export const assertLocalContractsDeployed = async (
  rpcUrl,
  keys = REQUIRED_V2_CONTRACT_KEYS
) => {
  for (const key of keys) {
    const address = LOCAL_ADDRESSES[key];
    if (!isAddress(address)) {
      throw new Error(`Missing local contract address for ${key}`);
    }

    const code = await rpcRequest(rpcUrl, 'eth_getCode', [address, 'latest']);
    if (!code || code === '0x') {
      throw new Error(`No contract code at local ${key} address ${address}`);
    }
  }
};
