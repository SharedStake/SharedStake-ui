import { test, expect } from '@playwright/test';
import {
  installInjectedImpersonatorProvider,
  rpcRequest,
  seedAndImpersonate,
} from './helpers/impersonator.js';
import { localAddressQuery } from './helpers/local-address-query.js';

const DEFAULT_IMPERSONATOR_ADDRESS = '0x1111111111111111111111111111111111111111';
const RPC_URL = process.env.E2E_IMPERSONATOR_RPC_URL || 'http://127.0.0.1:8545';
const IMPERSONATOR_ADDRESS =
  process.env.E2E_IMPERSONATOR_ADDRESS || DEFAULT_IMPERSONATOR_ADDRESS;

test.describe('WithdrawPanel — UI rendering', () => {
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
      chainIdHex,
    });

    await page.goto(`/v2?${localAddressQuery(IMPERSONATOR_ADDRESS)}`, {
      waitUntil: 'networkidle',
    });

    await expect(page.getByRole('heading', { name: 'SharedStake V2' })).toBeVisible({
      timeout: 20_000,
    });
  });

  // ── Tab navigation ──────────────────────────────────────────────────────────

  test('Withdraw tab is present at index 2', async ({ page }) => {
    const tabs = page.locator('div.border-b.border-border > button');
    await expect(tabs).toHaveCount(5);
    await expect(tabs.nth(2)).toContainText('Withdraw');
  });

  // ── WithdrawPanel rendering ─────────────────────────────────────────────────

  test('WithdrawPanel renders Request/My Requests sub-tabs and amount input', async ({ page }) => {
    const tabs = page.locator('div.border-b.border-border > button');
    await tabs.nth(2).click();

    // Sub-tab navigation
    await expect(page.getByRole('button', { name: 'Request', exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'My Requests' })).toBeVisible({ timeout: 10_000 });

    // Amount input
    await expect(page.locator('input[placeholder="0.0"]')).toBeVisible({ timeout: 10_000 });
  });

  test('Request Withdrawal button is disabled without an amount', async ({ page }) => {
    const tabs = page.locator('div.border-b.border-border > button');
    await tabs.nth(2).click();

    const requestBtn = page.getByRole('button', {
      name: /^(Min 0\.01 stETH|Connect Wallet|Not Deployed|Request Withdrawal)$/
    });
    await expect(requestBtn).toBeVisible({ timeout: 10_000 });
    await expect(requestBtn).toBeDisabled({ timeout: 10_000 });
  });

  test('WithdrawPanel shows stETH balance shortcut', async ({ page }) => {
    const tabs = page.locator('div.border-b.border-border > button');
    await tabs.nth(2).click();

    await expect(page.getByText(/Balance:/)).toBeVisible({ timeout: 10_000 });
  });

  test('My Requests tab shows empty state when no pending withdrawals', async ({ page }) => {
    const tabs = page.locator('div.border-b.border-border > button');
    await tabs.nth(2).click();

    await page.getByRole('button', { name: 'My Requests' }).click();

    await expect(page.getByText('No withdrawal requests yet.')).toBeVisible({ timeout: 10_000 });
  });

  test('WithdrawPanel shows two-step queue info text on Request tab', async ({ page }) => {
    const tabs = page.locator('div.border-b.border-border > button');
    await tabs.nth(2).click();

    await expect(
      page.getByText('Burn stETH and join the withdrawal queue.')
    ).toBeVisible({ timeout: 10_000 });
  });
});
