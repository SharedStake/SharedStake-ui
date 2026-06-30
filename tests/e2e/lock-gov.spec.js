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

test.describe('Lock/Gov panels — UI rendering', () => {
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

    // Wait for the main heading so the app has loaded.
    await expect(page.getByRole('heading', { name: 'SharedStake V2' })).toBeVisible({
      timeout: 20_000,
    });
  });

  // ── Lock tab ────────────────────────────────────────────────────────────────

  test('Lock tab is present in the nav bar', async ({ page }) => {
    const tabs = page.locator('div.border-b.border-border > button');
    await expect(tabs).toHaveCount(5); // Stake, Wrap, Withdraw, Governance, Lock
    await expect(page.getByRole('button', { name: 'Lock', exact: true })).toBeVisible();
  });

  test('LockPanel renders veSGT lock form', async ({ page }) => {
    await page.getByRole('button', { name: 'Lock', exact: true }).click();

    await expect(page.getByText('veSGT Governance Lock')).toBeVisible({ timeout: 10_000 });

    // Stat cards
    await expect(page.getByText('SGT Balance', { exact: true })).toBeVisible();
    await expect(page.getByText('Projected veSGT', { exact: true })).toBeVisible();
    await expect(page.getByText('Total Locked', { exact: true })).toBeVisible();

    // Create lock form (shown when no active lock)
    await expect(page.getByText('Create New Lock')).toBeVisible();
    await expect(page.locator('input[placeholder="0.0"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lock SGT for veSGT' })).toBeVisible();
  });

  test('Lock SGT button is disabled when wallet not connected or no balance', async ({ page }) => {
    await page.getByRole('button', { name: 'Lock', exact: true }).click();

    const lockBtn = page.getByRole('button', { name: 'Lock SGT for veSGT' });
    await expect(lockBtn).toBeVisible({ timeout: 10_000 });
    await expect(lockBtn).toBeDisabled();
  });

  test('LockPanel shows governance lock info text', async ({ page }) => {
    await page.getByRole('button', { name: 'Lock', exact: true }).click();

    await expect(
      page.getByText('veSGT is non-transferable governance power.'),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Checkpoint before proposal snapshots/)).toBeVisible();
  });

  // ── Gov tab ─────────────────────────────────────────────────────────────────

  test('Gov tab is present in the nav bar', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Governance', exact: true })).toBeVisible();
  });

  test('GovernancePanel renders protocol parameter cards', async ({ page }) => {
    await page.getByRole('button', { name: 'Governance', exact: true }).click();

    await expect(page.locator('.text-lg.font-semibold').filter({ hasText: 'Governance' })).toBeVisible({
      timeout: 10_000
    });
    await expect(page.getByText('Voting Delay')).toBeVisible();
    await expect(page.getByText('Voting Period')).toBeVisible();
    await expect(page.getByText('Proposal Threshold')).toBeVisible();
    await expect(page.getByText('Quorum')).toBeVisible();
    // Quorum value is live from contract (shows '—' when not connected, 'X veSGT' when connected)
    const quorumCard = page.locator('.rounded-lg.bg-muted').filter({ hasText: 'Quorum' });
    await expect(quorumCard).toBeVisible();
  });

  test('GovernancePanel shows Active Proposals section', async ({ page }) => {
    await page.getByRole('button', { name: 'Governance', exact: true }).click();

    await expect(page.getByText('Active Proposals')).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText('No governance proposals found in the recent event window.'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('GovernancePanel Create Proposal button is disabled without a valid proposal', async ({ page }) => {
    await page.getByRole('button', { name: 'Governance', exact: true }).click();

    await expect(page.getByText('Create Proposal', { exact: true })).toBeVisible({ timeout: 10_000 });
    const proposeBtn = page.getByRole('button', { name: 'Propose' });
    await expect(proposeBtn).toBeVisible();
    await expect(proposeBtn).toBeDisabled();
  });
});
