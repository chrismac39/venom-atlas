import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['*.e2e.spec.ts'],
  testIgnore: ['molecular-rendering.e2e.spec.ts', 'publication-artifacts.e2e.spec.ts', 'atlas-milestone0a.e2e.spec.ts'],
  use: {
    baseURL: 'http://localhost:5199',
    headless: true,
  },
  webServer: {
    command: 'pnpm exec astro dev --port 5199',
    url: 'http://localhost:5199',
    timeout: 120_000,
    reuseExistingServer: false,
  },
});
