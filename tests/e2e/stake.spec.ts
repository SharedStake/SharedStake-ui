import { test, expect } from '@playwright/test';

test.describe('Stake page', () => {
    test('navigates to /stake and shows Stake UI elements', async ({ page }) => {
        await page.route('https://api.blocknative.com/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) }));
        await page.route('https://api.coingecko.com/**', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
        });
        await page.goto('/stake');
        await expect(page.locator('input.token-amount-input').first()).toBeVisible();
        await expect(page.locator('#get-wsgETH')).toBeVisible();
	});
});

