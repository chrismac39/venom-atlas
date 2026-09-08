import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

const base = process.env.PUBLIC_BASE_PATH ?? '/';

export default defineConfig({
  output: 'static',
  integrations: [react()],
  base,
  trailingSlash: 'never',
  vite: {
    // 3Dmol ships a UMD/CommonJS bundle. Prebundle before the lazy viewer loads,
    // with explicit interop rather than a late optimizer/HMR rediscovery.
    optimizeDeps: { include: ['3dmol'], needsInterop: ['3dmol'] },
    // Isolate cold-start browser checks from a developer's running server/cache.
    ...(process.env.MOLECULAR_TEST_CACHE ? { cacheDir: process.env.MOLECULAR_TEST_CACHE } : {}),
  },
  server: {
    host: '127.0.0.1',
    port: 5199,
  },
  preview: {
    host: '127.0.0.1',
    port: 5199,
  },
});
