import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	 testDir: './tests/e2e',
	 fullyParallel: true,
	 retries: 0,
	 reporter: [['list']],
	 use: {
		 baseURL: 'http://localhost:8080',
		 headless: true,
	 },
	 webServer: {
		 command: 'yarn serve',
		 port: 8080,
		 reuseExistingServer: true,
		 timeout: 180000,
	 },
	 projects: [
		 { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
	 ],
});