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

test.describe('DVTStakePanel - fork rendering', () => {
  let chainIdHex;

  test.beforeAll(async () => {
    chainIdHex = await rpcRequest(RPC_URL, 'eth_chainId');
    await assertLocalContractsDeployed(RPC_URL, ['dvtModule']);
  });

  test.beforeEach(async ({ page }) => {
    await seedAndImpersonate(RPC_URL, IMPERSONATOR_ADDRESS, '5');
    await installInjectedImpersonatorProvider({
      page,
      rpcUrl: RPC_URL,
      address: IMPERSONATOR_ADDRESS,
      chainIdHex,
    });

    await page.goto(`/dvt-stake?${localAddressQuery(IMPERSONATOR_ADDRESS)}`, {
      waitUntil: 'networkidle',
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
  });

  test('renders module stats and empty cluster state', async ({ page }) => {
    await expect(page.getByText('DVT Module', { exact: true })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText('Buffered Ether')).toBeVisible();
    await expect(page.getByText('Beacon Validators')).toBeVisible();
    await expect(page.getByText('Deposited Validators')).toBeVisible();

    await expect(page.getByText('My Clusters')).toBeVisible();
    await expect(page.getByText('You are not a member of any DVT cluster')).toBeVisible({
      timeout: 20_000,
    });
  });
});
