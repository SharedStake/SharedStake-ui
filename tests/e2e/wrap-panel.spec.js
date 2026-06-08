import { test, expect } from '@playwright/test';
import {
  installInjectedImpersonatorProvider,
  rpcRequest,
  seedAndImpersonate,
} from './helpers/impersonator.js';
import {
  assertLocalContractsDeployed,
  localAddressQuery
} from './helpers/local-address-query.js';

const DEFAULT_IMPERSONATOR_ADDRESS = '0x1111111111111111111111111111111111111111';
const RPC_URL = process.env.E2E_IMPERSONATOR_RPC_URL || 'http://127.0.0.1:8545';
const IMPERSONATOR_ADDRESS =
  process.env.E2E_IMPERSONATOR_ADDRESS || DEFAULT_IMPERSONATOR_ADDRESS;

test.describe('WrapPanel — UI rendering', () => {
  let chainIdHex;

  test.beforeAll(async () => {
    chainIdHex = await rpcRequest(RPC_URL, 'eth_chainId');
    await assertLocalContractsDeployed(RPC_URL);
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

  test('Wrap tab is present at index 1', async ({ page }) => {
    const tabs = page.locator('div.border-b.border-border > button');
    await expect(tabs).toHaveCount(5);
    await expect(tabs.nth(1)).toContainText('Wrap');
  });

  // ── WrapPanel rendering ─────────────────────────────────────────────────────

  test('WrapPanel renders exchange rate, input, and output fields', async ({ page }) => {
    const tabs = page.locator('div.border-b.border-border > button');
    await tabs.nth(1).click();

    // Exchange rate display
    await expect(page.getByText('1 wstETH =')).toBeVisible({ timeout: 10_000 });

    // Amount input
    await expect(page.locator('input[placeholder="0.0"]')).toBeVisible({ timeout: 10_000 });

    // Output section
    await expect(page.getByText('You receive (estimated)')).toBeVisible({ timeout: 10_000 });
  });

  test('WrapPanel has Wrap/Unwrap mode toggle with Wrap active by default', async ({ page }) => {
    const tabs = page.locator('div.border-b.border-border > button');
    await tabs.nth(1).click();

    // Both mode buttons present
    await expect(page.getByRole('button', { name: 'Wrap' }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Unwrap' })).toBeVisible({ timeout: 10_000 });

    // In wrap mode the input label says stETH
    await expect(page.getByText('You give (stETH)')).toBeVisible({ timeout: 10_000 });
  });

  test('WrapPanel mode toggle switches input label to wstETH on Unwrap', async ({ page }) => {
    const tabs = page.locator('div.border-b.border-border > button');
    await tabs.nth(1).click();

    await page.getByRole('button', { name: 'Unwrap' }).click();

    await expect(page.getByText('You give (wstETH)')).toBeVisible({ timeout: 10_000 });
  });

  test('Wrap stETH button is disabled without a valid amount entered', async ({ page }) => {
    const tabs = page.locator('div.border-b.border-border > button');
    await tabs.nth(1).click();

    // The submit button should be disabled when no amount is entered
    // (label shows "Enter Amount" when connected but no value, or "Connect Wallet" when not)
    const submitBtn = page.locator('button:has-text("Enter Amount"), button:has-text("Connect Wallet"), button[disabled]').last();
    await expect(submitBtn).toBeDisabled({ timeout: 10_000 });
  });

  test('WrapPanel shows Balance shortcut button for max amount', async ({ page }) => {
    const tabs = page.locator('div.border-b.border-border > button');
    await tabs.nth(1).click();

    await expect(page.getByText(/Balance:/)).toBeVisible({ timeout: 10_000 });
  });

  test('WrapPanel output estimate updates when amount is entered', async ({ page }) => {
    const tabs = page.locator('div.border-b.border-border > button');
    await tabs.nth(1).click();

    // Wait for panel to load, then type amount
    await expect(page.locator('input[placeholder="0.0"]')).toBeVisible({ timeout: 10_000 });
    await page.locator('input[placeholder="0.0"]').fill('10');

    // Output span (text-2xl font-medium) should update from 0.0 to a non-zero value
    const outputSpan = page.locator('.text-2xl.font-medium').last();
    await expect(outputSpan).not.toHaveText('0.0', { timeout: 5_000 });
  });
});
