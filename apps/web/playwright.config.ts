import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['*.smoke.spec.ts'],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    headless: true,
  },
  webServer: {
    command: 'pnpm --filter @venom-atlas/web dev',
    url: 'http://127.0.0.1:5173',
    timeout: 120_000,
    reuseExistingServer: true,
    env: {
      VITE_DATA_MODE: 'mock',
    },
  },
});
