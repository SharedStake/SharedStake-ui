import { readFileSync } from 'node:fs';

export const LOCAL_ADDRESSES = JSON.parse(
  readFileSync(new URL('../../../src/contracts/addresses/local.json', import.meta.url), 'utf8')
);

export const localAddressQuery = (address) =>
  new URLSearchParams({
    e2eAddress: address,
    e2eContracts: JSON.stringify(LOCAL_ADDRESSES)
  }).toString();
