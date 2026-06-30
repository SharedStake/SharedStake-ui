import { test, expect } from '@playwright/test';
import { ethers, parseEther } from 'ethers';
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

const DEFAULT_OPERATOR_ADDRESS = '0x2222222222222222222222222222222222222222';
const RPC_URL = process.env.E2E_IMPERSONATOR_RPC_URL || 'http://127.0.0.1:8545';
const OPERATOR_ADDRESS = process.env.E2E_OPERATOR_ADDRESS || DEFAULT_OPERATOR_ADDRESS;
const OPERATOR_SEED_ETH = process.env.E2E_OPERATOR_SEED_ETH || '5';
const OPERATOR_SGT_MINT_AMOUNT = process.env.E2E_OPERATOR_SGT_MINT_AMOUNT || '2500';

const ERC20_IFACE = new ethers.Interface([
  'function mint(address to, uint256 amount)',
  'function balanceOf(address owner) view returns (uint256)'
]);

const OPERATOR_REGISTRY_IFACE = new ethers.Interface([
  'function operators(address operator) view returns (uint256 ethBonded,uint256 sgtBonded,uint256 activeValidators,uint256 totalSlots,bytes32 configName)'
]);

const isHexChainId = (value) => /^0x[0-9a-f]+$/i.test(value || '');

const mintLocalSgt = async (operatorAddress, amountEth) => {
  if (!LOCAL_ADDRESSES.sgtV2) {
    throw new Error('Missing local sgtV2 address for solo-stake E2E');
  }

  const amount = parseEther(amountEth);
  const hash = await rpcRequest(RPC_URL, 'eth_sendTransaction', [
    {
      from: operatorAddress,
      to: LOCAL_ADDRESSES.sgtV2,
      data: ERC20_IFACE.encodeFunctionData('mint', [operatorAddress, amount])
    }
  ]);
  const receipt = await waitForReceipt(RPC_URL, hash, 45_000);
  expect(receipt.status).toBe('0x1');

  const balanceHex = await rpcRequest(RPC_URL, 'eth_call', [
    {
      to: LOCAL_ADDRESSES.sgtV2,
      data: ERC20_IFACE.encodeFunctionData('balanceOf', [operatorAddress])
    },
    'latest'
  ]);
  expect(BigInt(balanceHex)).toBeGreaterThanOrEqual(amount);
};

test.describe('solo operator staking UI', () => {
  let chainIdHex;

  test.beforeAll(async () => {
    chainIdHex = await rpcRequest(RPC_URL, 'eth_chainId');
    expect(isHexChainId(chainIdHex)).toBeTruthy();
    await assertLocalContractsDeployed(RPC_URL, [
      'stakingRouter',
      'stToken',
      'wstToken',
      'withdrawalQueueV2',
      'validatorModule',
      'operatorRegistry',
      'sgtV2'
    ]);
  });

  test('approves SGT and registers an operator bond through /solo-stake', async ({ page }) => {
    test.setTimeout(180_000);

    await seedAndImpersonate(RPC_URL, OPERATOR_ADDRESS, OPERATOR_SEED_ETH);
    await mintLocalSgt(OPERATOR_ADDRESS, OPERATOR_SGT_MINT_AMOUNT);

    await installInjectedImpersonatorProvider({
      page,
      rpcUrl: RPC_URL,
      address: OPERATOR_ADDRESS,
      chainIdHex
    });

    await page.goto(`/solo-stake?${localAddressQuery(OPERATOR_ADDRESS)}`, {
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
      { address: OPERATOR_ADDRESS, chainIdHexValue: chainIdHex }
    );

    await expect(page.getByText('Operator Onboarding')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('OperatorRegistry not yet deployed')).toBeHidden({
      timeout: 20_000
    });
    await expect(page.getByText('ETH Bond Required')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('SGT Bond Required')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Your SGT Balance/)).toBeVisible({ timeout: 20_000 });

    await page.getByRole('button', { name: 'Proceed to Bond' }).click();
    await expect(page.getByText('Bond Configuration')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/SGT Allowance:/)).toBeVisible({ timeout: 20_000 });

    const approveStartIndex = await page.evaluate(() => window.__e2eTxLog?.length || 0);
    await page.getByRole('button', { name: 'Approve SGT' }).click();
    const approveTx = await pollTxRecordAt(page, approveStartIndex, 60_000);
    const approveReceipt = await waitForReceipt(RPC_URL, approveTx.hash, 90_000);
    expect(approveReceipt.status).toBe('0x1');

    await expect(page.getByText('Ready to register as operator with 1 slot(s)')).toBeVisible({
      timeout: 20_000
    });

    const registerStartIndex = await page.evaluate(() => window.__e2eTxLog?.length || 0);
    await page.getByRole('button', { name: 'Register as Operator' }).click();
    const registerTx = await pollTxRecordAt(page, registerStartIndex, 60_000);
    const registerReceipt = await waitForReceipt(RPC_URL, registerTx.hash, 90_000);
    expect(registerReceipt.status).toBe('0x1');

    await expect(page.getByText('Operator Dashboard')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Operator registered successfully')).toBeVisible({
      timeout: 20_000
    });

    const operatorDataHex = await rpcRequest(RPC_URL, 'eth_call', [
      {
        to: LOCAL_ADDRESSES.operatorRegistry,
        data: OPERATOR_REGISTRY_IFACE.encodeFunctionData('operators', [OPERATOR_ADDRESS])
      },
      'latest'
    ]);
    const operatorInfo = OPERATOR_REGISTRY_IFACE.decodeFunctionResult('operators', operatorDataHex);
    expect(operatorInfo.totalSlots).toBe(1n);
    expect(operatorInfo.ethBonded).toBe(parseEther('1'));
    expect(operatorInfo.sgtBonded).toBe(parseEther('1000'));
  });
});
