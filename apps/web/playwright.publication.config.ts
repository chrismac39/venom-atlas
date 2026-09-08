import { defineConfig } from '@playwright/test';

const production = process.env.PUBLICATION_TEST_MODE === 'production';
const port = production ? 5208 : 5207;
export default defineConfig({
  testDir: './tests',
  testMatch: 'publication-artifacts.e2e.spec.ts',
  workers: 1,
  timeout: 60_000,
  use: { baseURL: `http://127.0.0.1:${port}`, headless: true },
  webServer: {
    command: production
      ? `pnpm exec astro build && pnpm exec astro preview --host 127.0.0.1 --port ${port}`
      : `pnpm exec astro dev --host 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}${process.env.PUBLIC_BASE_PATH ?? '/'}`,
    env: { PUBLIC_SITE_URL: 'https://publication.example.org' },
    reuseExistingServer: false,
    timeout: 180_000,
  },
});