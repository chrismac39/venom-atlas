import { defineConfig } from '@playwright/test';

const production = process.env.MOLECULAR_TEST_MODE === 'production';
const port = production ? 5206 : 5205;
export default defineConfig({
  testDir: './tests',
  testMatch: 'molecular-rendering.e2e.spec.ts',
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    headless: true,
    viewport: { width: 1280, height: 900 },
    launchOptions: { args: ['--enable-unsafe-swiftshader'] },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: production
      ? `pnpm exec astro build --config astro.renderer.config.mjs && pnpm exec astro preview --config astro.renderer.config.mjs --host 127.0.0.1 --port ${port}`
      : `pnpm exec astro dev --config astro.renderer.config.mjs --host 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    env: { MOLECULAR_TEST_CACHE: `node_modules/.vite-molecular-${process.pid}-${Date.now()}` },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});