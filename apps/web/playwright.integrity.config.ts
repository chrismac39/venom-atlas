import { defineConfig } from '@playwright/test';

// Isolated production preview: do not stop or reuse the user's dev server.
export default defineConfig({
  testDir: './tests',
  testMatch: ['content-integrity.e2e.spec.ts'],
  use: { baseURL: 'http://127.0.0.1:5203', headless: true },
  webServer: {
    command: 'pnpm exec astro preview --host 127.0.0.1 --port 5203',
    url: 'http://127.0.0.1:5203',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});