import { expect } from '@playwright/test';

let rpcId = 1000;

const nextRpcId = () => {
  rpcId += 1;
  return rpcId;
};

export const toWeiHex = (ethAmount) => {
  const value = String(ethAmount).trim();
  if (!/^\d+(\.\d+)?$/.test(value)) {
    throw new Error(`Invalid ETH amount: ${ethAmount}`);
  }
  const [whole, frac = ''] = value.split('.');
  if (frac.length > 18) {
    throw new Error(`ETH amount supports max 18 decimals: ${ethAmount}`);
  }
  const wholeWei = BigInt(whole) * 10n ** 18n;
  const fracWei = BigInt((frac + '0'.repeat(18)).slice(0, 18));
  return `0x${(wholeWei + fracWei).toString(16)}`;
};

export const rpcRequest = async (rpcUrl, method, params = []) => {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: nextRpcId(),
      method,
      params
    })
  });
  if (!response.ok) {
    throw new Error(`RPC ${method} HTTP ${response.status}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(`RPC ${method} failed: ${JSON.stringify(data.error)}`);
  }
  return data.result;
};

export const seedAndImpersonate = async (rpcUrl, address, ethAmount) => {
  const weiHex = toWeiHex(ethAmount);
  await rpcRequest(rpcUrl, 'anvil_setBalance', [address, weiHex]);
  await rpcRequest(rpcUrl, 'anvil_impersonateAccount', [address]);
  return weiHex;
};

export const waitForReceipt = async (rpcUrl, txHash, timeoutMs = 45_000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const receipt = await rpcRequest(rpcUrl, 'eth_getTransactionReceipt', [txHash]);
    if (receipt) return receipt;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for receipt: ${txHash}`);
};

export const installInjectedImpersonatorProvider = async ({
  page,
  rpcUrl,
  address,
  chainIdHex
}) => {
  await page.exposeFunction('__e2eRpcRequest', async ({ method, params }) =>
    rpcRequest(rpcUrl, method, params || [])
  );

  await page.addInitScript(
    ({ injectedAddress, injectedChainIdHex }) => {
      const listeners = new Map();
      const txLog = [];

      const emit = (event, payload) => {
        const callbacks = listeners.get(event) || [];
        for (const cb of callbacks) {
          try {
            cb(payload);
          } catch (error) {
            console.warn('wallet listener error', error);
          }
        }
      };

      const on = (event, cb) => {
        const callbacks = listeners.get(event) || [];
        callbacks.push(cb);
        listeners.set(event, callbacks);
      };

      const removeListener = (event, cb) => {
        const callbacks = listeners.get(event) || [];
        listeners.set(
          event,
          callbacks.filter((fn) => fn !== cb)
        );
      };

      const provider = {
        isMetaMask: true,
        isConnected: () => true,
        selectedAddress: injectedAddress,
        chainId: injectedChainIdHex,
        on,
        removeListener,
        request: async ({ method, params = [] }) => {
          if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
            return [injectedAddress];
          }

          if (method === 'wallet_switchEthereumChain') {
            const requestedChainId = params?.[0]?.chainId;
            if (requestedChainId) {
              provider.chainId = requestedChainId;
              emit('chainChanged', requestedChainId);
            }
            return null;
          }

          if (method === 'wallet_addEthereumChain') {
            return null;
          }

          let forwardedParams = params;
          if (method === 'eth_sendTransaction' && Array.isArray(params) && params[0]) {
            forwardedParams = [{ from: injectedAddress, ...params[0] }];
          }

          const result = await window.__e2eRpcRequest({ method, params: forwardedParams });

          if (method === 'eth_sendTransaction' && forwardedParams[0]) {
            txLog.push({
              method,
              payload: forwardedParams[0],
              hash: result
            });
          }

          return result;
        }
      };

      window.ethereum = provider;
      window.ethereum.providers = [provider];
      window.__e2eTxLog = txLog;

      window.dispatchEvent(
        new CustomEvent('eip6963:announceProvider', {
          detail: {
            info: {
              rdns: 'io.sharedstake.e2e',
              uuid: 'sharedstake-e2e-impersonator',
              name: 'MetaMask',
              icon: ''
            },
            provider
          }
        })
      );
    },
    {
      injectedAddress: address,
      injectedChainIdHex: chainIdHex
    }
  );
};

export const pollTxRecordAt = async (page, index, timeoutMs = 30_000) => {
  await expect
    .poll(
      async () => page.evaluate((recordIndex) => window.__e2eTxLog?.[recordIndex] || null, index),
      { timeout: timeoutMs }
    )
    .not.toBeNull();

  return page.evaluate((recordIndex) => window.__e2eTxLog[recordIndex], index);
};
