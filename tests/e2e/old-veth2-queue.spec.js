import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { ethers, parseEther } from 'ethers';
import {
  installInjectedImpersonatorProvider,
  pollTxRecordAt,
  rpcRequest,
  seedAndImpersonate,
  waitForReceipt
} from './helpers/impersonator.js';

const DEFAULT_IMPERSONATOR_ADDRESS = '0x3333333333333333333333333333333333333333';
const FUNDED_IMPERSONATOR_ADDRESS = '0x4444444444444444444444444444444444444444';
const RPC_URL = process.env.E2E_IMPERSONATOR_RPC_URL || 'http://127.0.0.1:8545';
const IMPERSONATOR_ADDRESS =
  process.env.E2E_OLD_VETH2_QUEUE_ADDRESS || DEFAULT_IMPERSONATOR_ADDRESS;
const LOCAL_ADDRESSES = JSON.parse(
  readFileSync(new URL('../../src/contracts/addresses/local.json', import.meta.url), 'utf8')
);
const OLD_VETH2_TOKEN_ADDRESS =
  process.env.E2E_OLD_VETH2_TOKEN_ADDRESS || LOCAL_ADDRESSES.vEth2;
const MINT_IFACE = new ethers.Interface(['function mint(address to, uint256 amount)']);

const mintOldVeth2 = async (address, amountEth) => {
  if (!OLD_VETH2_TOKEN_ADDRESS) {
    throw new Error('Missing local vEth2 address for old-vETH2 E2E');
  }

  const data = MINT_IFACE.encodeFunctionData('mint', [address, parseEther(amountEth)]);
  const hash = await rpcRequest(RPC_URL, 'eth_sendTransaction', [
    {
      from: address,
      to: OLD_VETH2_TOKEN_ADDRESS,
      data
    }
  ]);
  await waitForReceipt(RPC_URL, hash, 45_000);
};

test.describe('old-vETH2 FIFO queue UI', () => {
  let chainIdHex;

  test.beforeAll(async () => {
    chainIdHex = await rpcRequest(RPC_URL, 'eth_chainId');
  });

  const openQueuePage = async (page, address) => {
    await seedAndImpersonate(RPC_URL, address, '5');
    await installInjectedImpersonatorProvider({
      page,
      rpcUrl: RPC_URL,
      address,
      chainIdHex
    });

    await page.goto(`/withdraw-from-deprecated?e2eAddress=${address}`, {
      waitUntil: 'networkidle'
    });

    await expect(
      page.getByRole('heading', { name: 'Withdraw from Deprecated Contracts', exact: true })
    ).toBeVisible({ timeout: 20_000 });
  };

  const getQueuePanel = (page) =>
    page
      .getByRole('heading', { name: 'Old vETH2 FIFO Redemption Queue', exact: true })
      .locator('xpath=ancestor::section[1]');

  test('renders configured FIFO queue state and disabled request controls for empty vETH2 balance', async ({
    page
  }) => {
    await openQueuePage(page, IMPERSONATOR_ADDRESS);
    const queuePanel = getQueuePanel(page);

    await expect(queuePanel).toBeVisible({ timeout: 20_000 });
    await expect(queuePanel.getByText('Configured')).toBeVisible({ timeout: 20_000 });
    await expect(
      queuePanel.getByText(
        'Escrow returned vETH2, wait for guardian FIFO finalization, then claim ETH to your wallet.'
      )
    ).toBeVisible();

    await expect(queuePanel.getByText('Your vETH2')).toBeVisible();
    await expect(queuePanel.getByText('Redemption rate')).toBeVisible();
    await expect(queuePanel.getByText(/Next #\d+ .* Finalized #\d+/)).toBeVisible();

    await expect(queuePanel.getByLabel('Request redemption')).toBeVisible();
    await expect(queuePanel.getByRole('button', { name: 'Max' })).toBeVisible();
    await expect(queuePanel.getByRole('button', { name: 'Request Redemption' })).toBeDisabled();
    await expect(
      queuePanel.getByText('No old-vETH2 queue requests found for this wallet.')
    ).toBeVisible();
  });

  test('validates request amount against wallet vETH2 balance', async ({ page }) => {
    await openQueuePage(page, IMPERSONATOR_ADDRESS);
    const queuePanel = getQueuePanel(page);

    const amountInput = queuePanel.getByLabel('Request redemption');
    await amountInput.fill('1');

    await expect(queuePanel.getByText('Amount exceeds your vETH2 balance.')).toBeVisible({
      timeout: 10_000
    });
    await expect(queuePanel.getByRole('button', { name: 'Request Redemption' })).toBeDisabled();
  });

  test('requests a redemption with local mock vETH2 through the UI', async ({ page }) => {
    test.setTimeout(120_000);

    await seedAndImpersonate(RPC_URL, FUNDED_IMPERSONATOR_ADDRESS, '5');
    await mintOldVeth2(FUNDED_IMPERSONATOR_ADDRESS, '2');
    await openQueuePage(page, FUNDED_IMPERSONATOR_ADDRESS);

    const queuePanel = getQueuePanel(page);
    await expect(queuePanel.getByText('Configured')).toBeVisible({ timeout: 20_000 });

    await queuePanel.getByLabel('Request redemption').fill('1');
    await expect(queuePanel.getByText('Estimated ETH after finalization: 1')).toBeVisible({
      timeout: 10_000
    });

    const requestButton = queuePanel.getByRole('button', { name: 'Request Redemption' });
    await expect(requestButton).toBeEnabled({ timeout: 10_000 });

    const txStartIndex = await page.evaluate(() => window.__e2eTxLog?.length || 0);
    await requestButton.click();

    const approveTx = await pollTxRecordAt(page, txStartIndex, 60_000);
    const requestTx = await pollTxRecordAt(page, txStartIndex + 1, 60_000);
    const approveReceipt = await waitForReceipt(RPC_URL, approveTx.hash, 60_000);
    const requestReceipt = await waitForReceipt(RPC_URL, requestTx.hash, 60_000);
    expect(approveReceipt.status).toBe('0x1');
    expect(requestReceipt.status).toBe('0x1');

    await expect(queuePanel.getByText('Request #').first()).toBeVisible({ timeout: 20_000 });
    await expect(queuePanel.getByText('Pending finalization').first()).toBeVisible();
  });
});
