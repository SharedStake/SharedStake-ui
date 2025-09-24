import { test, expect } from '@playwright/test';

test.describe('Stake page', () => {
	test('navigates to /stake and shows Stake UI elements', async ({ page }) => {
		await page.goto('/stake');
		await expect(page.locator('.stake .StakeButton')).toBeVisible();
		await expect(page.locator('input.token-amount-input').first()).toBeVisible();
		await expect(page.locator('#get-wsgETH')).toBeVisible();
	});
});

