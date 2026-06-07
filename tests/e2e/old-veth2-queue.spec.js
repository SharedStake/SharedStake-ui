import { test, expect } from '@playwright/test';
import {
  installInjectedImpersonatorProvider,
  rpcRequest,
  seedAndImpersonate
} from './helpers/impersonator.js';

const DEFAULT_IMPERSONATOR_ADDRESS = '0x3333333333333333333333333333333333333333';
const RPC_URL = process.env.E2E_IMPERSONATOR_RPC_URL || 'http://127.0.0.1:8545';
const IMPERSONATOR_ADDRESS =
  process.env.E2E_OLD_VETH2_QUEUE_ADDRESS || DEFAULT_IMPERSONATOR_ADDRESS;

test.describe('old-vETH2 FIFO queue UI', () => {
  let chainIdHex;

  test.beforeAll(async () => {
    chainIdHex = await rpcRequest(RPC_URL, 'eth_chainId');
  });

  test.beforeEach(async ({ page }) => {
    await seedAndImpersonate(RPC_URL, IMPERSONATOR_ADDRESS, '5');
    await installInjectedImpersonatorProvider({
      page,
      rpcUrl: RPC_URL,
      address: IMPERSONATOR_ADDRESS,
      chainIdHex
    });

    await page.goto(`/withdraw-from-deprecated?e2eAddress=${IMPERSONATOR_ADDRESS}`, {
      waitUntil: 'networkidle'
    });

    await expect(
      page.getByRole('heading', { name: 'Withdraw from Deprecated Contracts', exact: true })
    ).toBeVisible({ timeout: 20_000 });
  });

  test('renders configured FIFO queue state and disabled request controls for empty vETH2 balance', async ({
    page
  }) => {
    const queuePanel = page
      .getByRole('heading', { name: 'Old vETH2 FIFO Redemption Queue', exact: true })
      .locator('xpath=ancestor::section[1]');

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
    const queuePanel = page
      .getByRole('heading', { name: 'Old vETH2 FIFO Redemption Queue', exact: true })
      .locator('xpath=ancestor::section[1]');

    const amountInput = queuePanel.getByLabel('Request redemption');
    await amountInput.fill('1');

    await expect(queuePanel.getByText('Amount exceeds your vETH2 balance.')).toBeVisible({
      timeout: 10_000
    });
    await expect(queuePanel.getByRole('button', { name: 'Request Redemption' })).toBeDisabled();
  });
});
