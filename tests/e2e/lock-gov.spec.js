import { test, expect } from '@playwright/test';
import {
  installInjectedImpersonatorProvider,
  rpcRequest,
  seedAndImpersonate,
} from './helpers/impersonator.js';

const DEFAULT_IMPERSONATOR_ADDRESS = '0x1111111111111111111111111111111111111111';
const RPC_URL = process.env.E2E_IMPERSONATOR_RPC_URL || 'http://127.0.0.1:8545';
const IMPERSONATOR_ADDRESS =
  process.env.E2E_IMPERSONATOR_ADDRESS || DEFAULT_IMPERSONATOR_ADDRESS;

test.describe('Lock/Gov panels — UI rendering', () => {
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

    await page.goto(`/v2?e2eAddress=${IMPERSONATOR_ADDRESS}`, {
      waitUntil: 'networkidle',
    });

    // Wait for the main heading so the app has loaded.
    await expect(page.getByRole('heading', { name: 'SharedStake V2' })).toBeVisible({
      timeout: 20_000,
    });
  });

  // ── Lock tab ────────────────────────────────────────────────────────────────

  test('Lock tab is present in the nav bar', async ({ page }) => {
    const tabs = page.locator('div.border-b.border-border > button');
    await expect(tabs).toHaveCount(5); // Stake, Wrap, Withdraw, Lock, Gov
    await expect(tabs.nth(3)).toContainText('Lock');
  });

  test('LockPanel renders veSGT lock form', async ({ page }) => {
    const tabs = page.locator('div.border-b.border-border > button');
    await tabs.nth(3).click();

    await expect(page.getByText('veSGT Governance Lock')).toBeVisible({ timeout: 10_000 });

    // Stat cards
    await expect(page.getByText('SGT Balance', { exact: true })).toBeVisible();
    await expect(page.getByText('veSGT Balance', { exact: true })).toBeVisible();

    // Create lock form (shown when no active lock)
    await expect(page.getByText('Create New Lock')).toBeVisible();
    await expect(page.locator('input[placeholder="0.0"]')).toBeVisible();
    await expect(page.locator('input[placeholder="365"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lock SGT → veSGT' })).toBeVisible();
  });

  test('Lock SGT button is disabled when wallet not connected or no balance', async ({ page }) => {
    const tabs = page.locator('div.border-b.border-border > button');
    await tabs.nth(3).click();

    const lockBtn = page.getByRole('button', { name: 'Lock SGT → veSGT' });
    await expect(lockBtn).toBeVisible({ timeout: 10_000 });
    // Button should be disabled: contractsDeployed is false (governance addresses are zero on local)
    // OR wallet not connected yet; either way it must not be enabled without a valid amount.
    await expect(lockBtn).toBeDisabled();
  });

  test('LockPanel shows governance lock info text', async ({ page }) => {
    const tabs = page.locator('div.border-b.border-border > button');
    await tabs.nth(3).click();

    await expect(
      page.getByText('veSGT is vote-escrowed SGT used for governance voting.'),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Longer locks = more voting power/)).toBeVisible();
  });

  // ── Gov tab ─────────────────────────────────────────────────────────────────

  test('Gov tab is present in the nav bar', async ({ page }) => {
    const tabs = page.locator('div.border-b.border-border > button');
    await expect(tabs.nth(4)).toContainText('Gov');
  });

  test('GovernancePanel renders protocol parameter cards', async ({ page }) => {
    const tabs = page.locator('div.border-b.border-border > button');
    await tabs.nth(4).click();

    await expect(page.getByText('Governance', { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Voting Delay')).toBeVisible();
    await expect(page.getByText('Voting Period')).toBeVisible();
    await expect(page.getByText('Proposal Threshold')).toBeVisible();
    await expect(page.getByText('Quorum')).toBeVisible();
    // Quorum value is live from contract (shows '—' when not connected, 'X veSGT' when connected)
    const quorumCard = page.locator('.rounded-lg.bg-muted').filter({ hasText: 'Quorum' });
    await expect(quorumCard).toBeVisible();
  });

  test('GovernancePanel shows Active Proposals section', async ({ page }) => {
    const tabs = page.locator('div.border-b.border-border > button');
    await tabs.nth(4).click();

    await expect(page.getByText('Active Proposals')).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText('Proposals will appear here once governance is live.'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('GovernancePanel Create Proposal button is disabled (Coming Soon)', async ({ page }) => {
    const tabs = page.locator('div.border-b.border-border > button');
    await tabs.nth(4).click();

    await expect(page.getByText('Create Proposal', { exact: true })).toBeVisible({ timeout: 10_000 });
    const comingSoonBtn = page.getByRole('button', { name: 'Coming Soon' });
    await expect(comingSoonBtn).toBeVisible();
    await expect(comingSoonBtn).toBeDisabled();
  });
});
