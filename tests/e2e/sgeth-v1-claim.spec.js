import { test, expect } from '@playwright/test';
import { ethers } from 'ethers';
import {
  installInjectedImpersonatorProvider,
  pollTxRecordAt,
  rpcRequest,
  seedAndImpersonate,
  waitForReceipt
} from './helpers/impersonator.js';
import {
  assertLocalContractsDeployed,
  LOCAL_ADDRESSES,
  localAddressQuery
} from './helpers/local-address-query.js';

const CLAIM_RECIPIENT = '0x3333333333333333333333333333333333333333';
const CLAIM_AMOUNT = ethers.parseEther('1000');
const RPC_URL = process.env.E2E_IMPERSONATOR_RPC_URL || 'http://127.0.0.1:8545';

const SGETH_V1_CLAIM_IFACE = new ethers.Interface([
  'function balanceOf(address owner) view returns (uint256)',
  'function isClaimed(uint256 index) view returns (bool)'
]);

test.describe('sgethV1Claim receipt airdrop', () => {
  let chainIdHex;

  test.beforeAll(async () => {
    chainIdHex = await rpcRequest(RPC_URL, 'eth_chainId');
    await assertLocalContractsDeployed(RPC_URL, ['sgethV1Claim']);
  });

  test('eligible recipient claims receipt token through the UI', async ({ page }) => {
    test.setTimeout(120_000);

    await seedAndImpersonate(RPC_URL, CLAIM_RECIPIENT, '5');
    await installInjectedImpersonatorProvider({
      page,
      rpcUrl: RPC_URL,
      address: CLAIM_RECIPIENT,
      chainIdHex
    });

    await page.goto(`/sgeth-v1-claim?${localAddressQuery(CLAIM_RECIPIENT)}`, {
      waitUntil: 'networkidle'
    });

    await expect(page.getByRole('heading', { name: 'sgethV1Claim' })).toBeVisible({
      timeout: 20_000
    });
    await expect(page.getByTestId('sgeth-v1-claim-status')).toContainText('Available', {
      timeout: 20_000
    });
    await expect(page.getByTestId('sgeth-v1-claim-available')).toContainText('1,000');

    const claimStartIndex = await page.evaluate(() => window.__e2eTxLog?.length || 0);
    await page.getByRole('button', { name: 'Claim sgethV1Claim' }).click();
    const claimTx = await pollTxRecordAt(page, claimStartIndex, 60_000);
    const claimReceipt = await waitForReceipt(RPC_URL, claimTx.hash, 90_000);
    expect(claimReceipt.status).toBe('0x1');

    await expect(page.getByTestId('sgeth-v1-claim-status')).toContainText('Claimed', {
      timeout: 20_000
    });

    const claimedHex = await rpcRequest(RPC_URL, 'eth_call', [
      {
        to: LOCAL_ADDRESSES.sgethV1Claim,
        data: SGETH_V1_CLAIM_IFACE.encodeFunctionData('isClaimed', [0])
      },
      'latest'
    ]);
    expect(SGETH_V1_CLAIM_IFACE.decodeFunctionResult('isClaimed', claimedHex)[0]).toBe(true);

    const balanceHex = await rpcRequest(RPC_URL, 'eth_call', [
      {
        to: LOCAL_ADDRESSES.sgethV1Claim,
        data: SGETH_V1_CLAIM_IFACE.encodeFunctionData('balanceOf', [CLAIM_RECIPIENT])
      },
      'latest'
    ]);
    expect(SGETH_V1_CLAIM_IFACE.decodeFunctionResult('balanceOf', balanceHex)[0]).toBe(CLAIM_AMOUNT);
  });
});
