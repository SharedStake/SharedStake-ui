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

const RPC_URL = process.env.E2E_IMPERSONATOR_RPC_URL || 'http://127.0.0.1:8545';
const IMPERSONATOR_ADDRESS =
  process.env.E2E_OLD_VETH2_EMPTY_ADDRESS || ethers.Wallet.createRandom().address;
const FUNDED_IMPERSONATOR_ADDRESS =
  process.env.E2E_OLD_VETH2_FUNDED_ADDRESS || ethers.Wallet.createRandom().address;
const LOCAL_ADDRESSES = JSON.parse(
  readFileSync(new URL('../../src/contracts/addresses/local.json', import.meta.url), 'utf8')
);
const localAddressQuery = (address) =>
  new URLSearchParams({
    e2eAddress: address,
    e2eContracts: JSON.stringify(LOCAL_ADDRESSES)
  }).toString();
const OLD_VETH2_QUEUE_ADDRESS =
  process.env.E2E_OLD_VETH2_QUEUE_ADDRESS || LOCAL_ADDRESSES.oldVeth2WithdrawalQueue;
const OLD_VETH2_TOKEN_ADDRESS =
  process.env.E2E_OLD_VETH2_TOKEN_ADDRESS || LOCAL_ADDRESSES.vEth2;
const OLD_VETH2_SOURCE_ADDRESS = process.env.E2E_OLD_VETH2_SOURCE_ADDRESS;
const OLD_VETH2_GUARDIAN_ADDRESS =
  process.env.E2E_OLD_VETH2_GUARDIAN_ADDRESS || LOCAL_ADDRESSES.governanceTimelock;
const OLD_VETH2_FUND_AMOUNT_ETH = process.env.E2E_OLD_VETH2_FUND_AMOUNT_ETH || '1.25';
const isAddress = (value) => /^0x[a-fA-F0-9]{40}$/.test(value || '');
const TOKEN_IFACE = new ethers.Interface([
  'function mint(address to, uint256 amount)',
  'function transfer(address to, uint256 amount) returns (bool)'
]);
const QUEUE_IFACE = new ethers.Interface([
  'event WithdrawalRequested(address indexed requester,address indexed owner,uint256 indexed requestId,uint256 vEth2Amount,uint256 ethAmount)',
  'function GUARDIAN() view returns (bytes32)',
  'function hasRole(bytes32 role,address account) view returns (bool)',
  'function finalize(uint256 lastRequestId) payable',
  'function lastFinalizedRequestId() view returns (uint256)',
  'function getRequest(uint256 requestId) view returns (address owner,uint256 vEth2Amount,uint256 ethAmount,uint256 requestedAt,bool finalized,bool claimed,bool canceled)'
]);

const getOldVeth2Queue = () => {
  if (!OLD_VETH2_QUEUE_ADDRESS) {
    throw new Error('Missing local old-vETH2 queue address for old-vETH2 E2E');
  }
  return new ethers.Contract(
    OLD_VETH2_QUEUE_ADDRESS,
    QUEUE_IFACE,
    new ethers.JsonRpcProvider(RPC_URL)
  );
};

const fundOldVeth2 = async (address, amountEth) => {
  if (!OLD_VETH2_TOKEN_ADDRESS) {
    throw new Error('Missing local vEth2 address for old-vETH2 E2E');
  }

  const amount = parseEther(amountEth);
  let from = address;
  let data = TOKEN_IFACE.encodeFunctionData('mint', [address, amount]);

  if (OLD_VETH2_SOURCE_ADDRESS) {
    from = OLD_VETH2_SOURCE_ADDRESS;
    await seedAndImpersonate(RPC_URL, from, '1');
    data = TOKEN_IFACE.encodeFunctionData('transfer', [address, amount]);
  }

  const hash = await rpcRequest(RPC_URL, 'eth_sendTransaction', [
    {
      from,
      to: OLD_VETH2_TOKEN_ADDRESS,
      data
    }
  ]);
  const receipt = await waitForReceipt(RPC_URL, hash, 45_000);
  expect(receipt.status).toBe('0x1');
};

const extractRequestId = (receipts) => {
  const queueAddress = OLD_VETH2_QUEUE_ADDRESS.toLowerCase();
  for (const receipt of Array.isArray(receipts) ? receipts : [receipts]) {
    for (const log of receipt.logs || []) {
      if (log.address?.toLowerCase() !== queueAddress) continue;
      try {
        const parsed = QUEUE_IFACE.parseLog(log);
        if (parsed?.name === 'WithdrawalRequested') {
          return Number(parsed.args.requestId);
        }
      } catch {
        /* ignore non-queue logs */
      }
    }
  }
  throw new Error('WithdrawalRequested event not found in request receipt');
};

const findGuardianAccount = async () => {
  const queue = getOldVeth2Queue();
  const guardianRole = await queue.GUARDIAN();
  const accounts = await rpcRequest(RPC_URL, 'eth_accounts');
  const candidates = [
    ...accounts,
    ...(isAddress(OLD_VETH2_GUARDIAN_ADDRESS) ? [OLD_VETH2_GUARDIAN_ADDRESS] : [])
  ];
  for (const account of [...new Set(candidates.map((candidate) => candidate.toLowerCase()))]) {
    if (await queue.hasRole(guardianRole, account)) {
      return account;
    }
  }
  throw new Error('No unlocked local account has the old-vETH2 queue GUARDIAN role');
};

const finalizeOldVeth2Request = async (requestId) => {
  const queue = getOldVeth2Queue();
  const lastFinalized = Number(await queue.lastFinalizedRequestId());
  let totalRequired = 0n;
  for (let id = lastFinalized + 1; id <= requestId; id += 1) {
    const request = await queue.getRequest(id);
    if (!request.canceled) {
      totalRequired += request.ethAmount;
    }
  }
  const guardian = await findGuardianAccount();

  await seedAndImpersonate(RPC_URL, guardian, ethers.formatEther(totalRequired + parseEther('1')));
  const hash = await rpcRequest(RPC_URL, 'eth_sendTransaction', [
    {
      from: guardian,
      to: OLD_VETH2_QUEUE_ADDRESS,
      data: QUEUE_IFACE.encodeFunctionData('finalize', [requestId]),
      value: ethers.toBeHex(totalRequired)
    }
  ]);
  const receipt = await waitForReceipt(RPC_URL, hash, 60_000);
  expect(receipt.status).toBe('0x1');
};

const pollTxTo = async (page, startIndex, targetAddress, timeoutMs = 60_000) => {
  const target = targetAddress.toLowerCase();
  await expect
    .poll(
      async () =>
        page.evaluate(
          ({ fromIndex, to }) =>
            (window.__e2eTxLog || [])
              .slice(fromIndex)
              .find((tx) => tx.payload?.to?.toLowerCase() === to) || null,
          { fromIndex: startIndex, to: target }
        ),
      { timeout: timeoutMs }
    )
    .not.toBeNull();

  return page.evaluate(
    ({ fromIndex, to }) =>
      (window.__e2eTxLog || [])
        .slice(fromIndex)
        .find((tx) => tx.payload?.to?.toLowerCase() === to),
    { fromIndex: startIndex, to: target }
  );
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

    await page.goto(`/withdraw-from-deprecated?${localAddressQuery(address)}`, {
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
    await expect(queuePanel.getByText('Loading queue state...')).toBeHidden({ timeout: 20_000 });
    await expect(
      queuePanel.getByText(
        'Escrow returned vETH2, wait for guardian FIFO finalization, then claim ETH to your wallet.'
      )
    ).toBeVisible();

    await expect(queuePanel.getByText('Your vETH2')).toBeVisible({ timeout: 30_000 });
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

  test('requests, finalizes, and claims a redemption through the UI', async ({
    page
  }) => {
    test.setTimeout(120_000);

    await seedAndImpersonate(RPC_URL, FUNDED_IMPERSONATOR_ADDRESS, '5');
    await fundOldVeth2(FUNDED_IMPERSONATOR_ADDRESS, OLD_VETH2_FUND_AMOUNT_ETH);
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

    await pollTxRecordAt(page, txStartIndex, 60_000);
    const requestTx = await pollTxTo(page, txStartIndex, OLD_VETH2_QUEUE_ADDRESS, 60_000);
    const requestReceipt = await waitForReceipt(RPC_URL, requestTx.hash, 60_000);
    expect(requestReceipt.status).toBe('0x1');

    const requestId = extractRequestId(requestReceipt);
    await expect(queuePanel.getByText(`Request #${requestId}`, { exact: true })).toBeVisible({
      timeout: 20_000
    });
    await expect(queuePanel.getByText('Pending finalization').first()).toBeVisible();

    await finalizeOldVeth2Request(requestId);
    await queuePanel.getByRole('button', { name: 'Refresh' }).click();
    await expect(queuePanel.getByText('Ready to claim').first()).toBeVisible({
      timeout: 20_000
    });

    const claimStartIndex = await page.evaluate(() => window.__e2eTxLog?.length || 0);
    await queuePanel.getByRole('button', { name: 'Claim ETH' }).first().click();

    const claimTx = await pollTxTo(page, claimStartIndex, OLD_VETH2_QUEUE_ADDRESS, 60_000);
    const claimReceipt = await waitForReceipt(RPC_URL, claimTx.hash, 60_000);
    expect(claimReceipt.status).toBe('0x1');

    await queuePanel.getByRole('button', { name: 'Refresh' }).click();
    await expect(queuePanel.getByText('Claimed').first()).toBeVisible({ timeout: 20_000 });
  });
});
