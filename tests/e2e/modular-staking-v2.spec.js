import { test, expect } from '@playwright/test';
import {
  installInjectedImpersonatorProvider,
  pollTxRecordAt,
  rpcRequest,
  seedAndImpersonate,
  waitForReceipt
} from './helpers/impersonator.js';

const DEFAULT_IMPERSONATOR_ADDRESS = '0x1111111111111111111111111111111111111111';
const RPC_URL = process.env.E2E_IMPERSONATOR_RPC_URL || 'http://127.0.0.1:8545';
const IMPERSONATOR_ADDRESS =
  process.env.E2E_IMPERSONATOR_ADDRESS || DEFAULT_IMPERSONATOR_ADDRESS;
const IMPERSONATOR_SEED_ETH = process.env.E2E_IMPERSONATOR_SEED_ETH || '5';
const STAKE_AMOUNT_ETH = process.env.E2E_V2_STAKE_AMOUNT_ETH || '0.05';
const WRAP_AMOUNT_STETH = process.env.E2E_V2_WRAP_AMOUNT_STETH || '0.02';
const WITHDRAW_REQUEST_AMOUNT_STETH =
  process.env.E2E_V2_WITHDRAW_REQUEST_AMOUNT_STETH || '0.01';

const isHexChainId = (value) => /^0x[0-9a-f]+$/i.test(value || '');

test.describe('modular staking v2 flow', () => {
  test('stake, wrap, and request withdrawal on /v2', async ({ page }) => {
    test.setTimeout(240_000);

    const chainIdHex = await rpcRequest(RPC_URL, 'eth_chainId');
    expect(isHexChainId(chainIdHex)).toBeTruthy();

    await seedAndImpersonate(RPC_URL, IMPERSONATOR_ADDRESS, IMPERSONATOR_SEED_ETH);

    await installInjectedImpersonatorProvider({
      page,
      rpcUrl: RPC_URL,
      address: IMPERSONATOR_ADDRESS,
      chainIdHex
    });

    await page.goto(`/v2?e2eAddress=${IMPERSONATOR_ADDRESS}`, {
      waitUntil: 'networkidle'
    });

    await page.evaluate(
      async ({ address, chainIdHexValue }) => {
        const [{ useWalletStore }, { useModularStakingStore }] = await Promise.all([
          import('/src/stores/wallet.js'),
          import('/src/stores/modularStaking.js')
        ]);
        const walletStore = useWalletStore();
        walletStore.setNetwork(String(chainIdHexValue).toLowerCase());
        walletStore.setAddressOnboard(address);
        const modularStore = useModularStakingStore();
        await modularStore.init(walletStore.network, walletStore.address);
      },
      { address: IMPERSONATOR_ADDRESS, chainIdHexValue: chainIdHex }
    );

    await expect
      .poll(
        async () =>
          page.evaluate(async () => {
            const { useModularStakingStore } = await import('/src/stores/modularStaking.js');
            return useModularStakingStore().contractsDeployed;
          }),
        { timeout: 20_000 }
      )
      .toBeTruthy();

    await expect(page.getByRole('heading', { name: 'SharedStake V2' })).toBeVisible({
      timeout: 20_000
    });

    // Stake tab (default)
    const amountInput = page.locator('input[type="number"]').first();
    await expect(amountInput).toBeVisible({ timeout: 20_000 });
    await amountInput.fill(STAKE_AMOUNT_ETH);

    const stakeButton = page.getByRole('button', { name: 'Stake ETH' });
    await expect(stakeButton).toBeVisible({ timeout: 20_000 });
    const stakeTxIndex = await page.evaluate(() => window.__e2eTxLog?.length || 0);
    await stakeButton.click();

    const stakeTx = await pollTxRecordAt(page, stakeTxIndex, 60_000);
    const stakeReceipt = await waitForReceipt(RPC_URL, stakeTx.hash, 90_000);
    expect(stakeReceipt.status).toBe('0x1');

    // Wrap tab
    const topTabs = page.locator('div.border-b.border-border > button');
    await expect(topTabs).toHaveCount(5); // Stake, Wrap, Withdraw, Lock, Gov
    await topTabs.nth(1).click();

    const wrapInput = page.locator('input[type="number"]').first();
    await expect(wrapInput).toBeVisible({ timeout: 20_000 });
    await wrapInput.fill(WRAP_AMOUNT_STETH);

    const wrapButton = page.getByRole('button', { name: 'Wrap stETH' });
    await expect(wrapButton).toBeVisible({ timeout: 20_000 });
    const wrapTxStartIndex = await page.evaluate(() => window.__e2eTxLog?.length || 0);
    await wrapButton.click();

    // Wrap path executes approve then wrap.
    const approveTx = await pollTxRecordAt(page, wrapTxStartIndex, 60_000);
    const wrapTx = await pollTxRecordAt(page, wrapTxStartIndex + 1, 60_000);
    const approveReceipt = await waitForReceipt(RPC_URL, approveTx.hash, 90_000);
    const wrapReceipt = await waitForReceipt(RPC_URL, wrapTx.hash, 90_000);
    expect(approveReceipt.status).toBe('0x1');
    expect(wrapReceipt.status).toBe('0x1');

    // Withdraw tab (request path)
    await topTabs.nth(2).click();

    const withdrawInput = page.locator('input[type="number"]').first();
    await expect(withdrawInput).toBeVisible({ timeout: 20_000 });
    await withdrawInput.fill(WITHDRAW_REQUEST_AMOUNT_STETH);

    const requestButton = page.getByRole('button', { name: 'Request Withdrawal' });
    await expect(requestButton).toBeVisible({ timeout: 20_000 });
    const requestTxIndex = await page.evaluate(() => window.__e2eTxLog?.length || 0);
    await requestButton.click();

    const requestTx = await pollTxRecordAt(page, requestTxIndex, 60_000);
    const requestReceipt = await waitForReceipt(RPC_URL, requestTx.hash, 90_000);
    expect(requestReceipt.status).toBe('0x1');

    await page.getByRole('button', { name: 'My Requests' }).click();
    await expect(page.getByText('Request #').first()).toBeVisible({ timeout: 20_000 });
  });
});
