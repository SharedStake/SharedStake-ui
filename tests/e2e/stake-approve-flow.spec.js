import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ethers } from 'ethers';
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
const STAKE_AMOUNT_ETH = process.env.E2E_STAKE_AMOUNT_ETH || '0.10';
const UNSTAKE_AMOUNT_WSGETH = process.env.E2E_UNSTAKE_AMOUNT_WSGETH || '0.05';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localAddressPath = path.resolve(__dirname, '../../src/contracts/addresses/local.json');
const localAddressMap = JSON.parse(readFileSync(localAddressPath, 'utf-8'));
const VALIDATOR_ADDRESS =
  process.env.E2E_VALIDATOR_ADDRESS || localAddressMap.validator;

const isHexChainId = (value) => /^0x[0-9a-f]+$/i.test(value || '');

test.describe('impersonator wallet stake + approve/unstake flow', () => {
  test('runs real tx execution with deterministic funding and gas settings', async ({ page }) => {
    test.setTimeout(180_000);

    const chainIdHex = await rpcRequest(RPC_URL, 'eth_chainId');
    expect(isHexChainId(chainIdHex)).toBeTruthy();

    await seedAndImpersonate(RPC_URL, IMPERSONATOR_ADDRESS, IMPERSONATOR_SEED_ETH);

    // Some local deployments start with zero remaining epoch capacity; open a slot for stake txs.
    const ownerProvider = new ethers.JsonRpcProvider(RPC_URL);
    const ownerAccounts = await ownerProvider.send('eth_accounts', []);
    const ownerSigner = await ownerProvider.getSigner(ownerAccounts[0]);
    const validator = new ethers.Contract(
      VALIDATOR_ADDRESS,
      [
        'function remainingSpaceInEpoch() view returns (uint256)',
        'function setNumValidators(uint256)'
      ],
      ownerSigner
    );
    const remainingBefore = await validator.remainingSpaceInEpoch();
    if (remainingBefore === 0n) {
      const setValidatorsTx = await validator.setNumValidators(1);
      await setValidatorsTx.wait();
    }

    await installInjectedImpersonatorProvider({
      page,
      rpcUrl: RPC_URL,
      address: IMPERSONATOR_ADDRESS,
      chainIdHex
    });

    await page.goto(`/stake?e2eAddress=${IMPERSONATOR_ADDRESS}`, {
      waitUntil: 'networkidle'
    });

    const contractState = await page.evaluate(async () => {
      const contracts = await import('/src/contracts/index.js');
      const validator = contracts.validator();
      if (!validator) return { target: null, remaining: null };
      const remaining = await validator.remainingSpaceInEpoch();
      return { target: validator.target, remaining: remaining.toString() };
    });
    expect(contractState.target).toBeTruthy();
    expect(BigInt(contractState.remaining)).toBeGreaterThan(0n);

    const editableAmountInput = page.locator('input[title="Token Amount"]').first();
    await expect(editableAmountInput).toBeVisible({ timeout: 20_000 });

    const gasButtons = page.locator('div#gas button.switch');
    await expect(gasButtons).toHaveCount(3);
    const modeButtons = page.locator('.staker > .chooser button.switch');
    await expect(modeButtons).toHaveCount(2);

    // Stake with low gas option.
    await gasButtons.first().click();
    await editableAmountInput.fill(STAKE_AMOUNT_ETH);
    const submitButton = page.locator('.StakeButton').first();
    await expect(submitButton).toHaveText('Stake', {
      timeout: 15_000
    });

    const txStartIndex = await page.evaluate(() => window.__e2eTxLog?.length || 0);
    await submitButton.click();

    const stakeTx = await pollTxRecordAt(page, txStartIndex, 45_000);
    const stakeReceipt = await waitForReceipt(RPC_URL, stakeTx.hash, 60_000);
    expect(stakeReceipt.status).toBe('0x1');

    const stakeMaxFee = BigInt(stakeTx.payload.maxFeePerGas || '0');
    const stakePriorityFee = BigInt(stakeTx.payload.maxPriorityFeePerGas || '0');
    expect(stakeMaxFee > 0n).toBeTruthy();
    expect(stakePriorityFee > 0n).toBeTruthy();

    // Move to unstake path and choose high gas.
    await modeButtons.last().click();
    await gasButtons.last().click();
    await editableAmountInput.fill(UNSTAKE_AMOUNT_WSGETH);

    // Approve should appear first for wsgETH unstake path.
    const approveButton = page.locator('.StakeButton').first();
    await expect(approveButton).toHaveText('Approve', { timeout: 20_000 });
    await expect(approveButton).toBeVisible({ timeout: 20_000 });

    const approveTxIndex = await page.evaluate(() => window.__e2eTxLog?.length || 0);
    await approveButton.click();
    const approveTx = await pollTxRecordAt(page, approveTxIndex, 45_000);
    const approveReceipt = await waitForReceipt(RPC_URL, approveTx.hash, 60_000);
    expect(approveReceipt.status).toBe('0x1');

    const approveMaxFee = BigInt(approveTx.payload.maxFeePerGas || '0');
    const approvePriorityFee = BigInt(approveTx.payload.maxPriorityFeePerGas || '0');
    expect(approveMaxFee > 0n).toBeTruthy();
    expect(approvePriorityFee > 0n).toBeTruthy();
    expect(approveMaxFee >= stakeMaxFee).toBeTruthy();
    expect(approvePriorityFee >= stakePriorityFee).toBeTruthy();

    // Final unstake tx after approval.
    const unstakeButton = page.locator('.StakeButton').first();
    await expect(unstakeButton).toHaveText('Unstake', { timeout: 20_000 });
    await expect(unstakeButton).toBeVisible({ timeout: 20_000 });
    const unstakeTxIndex = await page.evaluate(() => window.__e2eTxLog?.length || 0);
    await unstakeButton.click();

    const unstakeTx = await pollTxRecordAt(page, unstakeTxIndex, 45_000);
    const unstakeReceipt = await waitForReceipt(RPC_URL, unstakeTx.hash, 60_000);
    expect(unstakeReceipt.status).toBe('0x1');

    const unstakeMaxFee = BigInt(unstakeTx.payload.maxFeePerGas || '0');
    const unstakePriorityFee = BigInt(unstakeTx.payload.maxPriorityFeePerGas || '0');
    expect(unstakeMaxFee > 0n).toBeTruthy();
    expect(unstakePriorityFee > 0n).toBeTruthy();
    expect(unstakeMaxFee >= stakeMaxFee).toBeTruthy();
  });
});
