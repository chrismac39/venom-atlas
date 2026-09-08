import { defineConfig, devices } from '@playwright/test';

const production = process.env.ATLAS_UI_TEST_MODE === 'production';
const port = production ? 5211 : 5210;
export default defineConfig({
  testDir: './tests',
  testMatch: 'atlas-milestone0a.e2e.spec.ts',
  outputDir: './test-results/atlas-ui',
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
    { name: 'mobile-narrow', use: { ...devices['iPhone SE'], defaultBrowserType: 'chromium', viewport: { width: 320, height: 740 } } },
  ],
  webServer: {
    command: production
      ? `pnpm exec astro build --config astro.atlas-ui.config.mjs && pnpm exec astro preview --config astro.atlas-ui.config.mjs --host 127.0.0.1 --port ${port}`
      : `pnpm exec astro dev --config astro.atlas-ui.config.mjs --host 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});