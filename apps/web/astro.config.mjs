import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { fileURLToPath } from 'node:url';
import { publicationIntegration } from '../../scripts/astro-publication.mjs';

const base = process.env.PUBLIC_BASE_PATH ?? '/';
const publicationPublicDir = fileURLToPath(new URL('./.publication-public/', import.meta.url));

export default defineConfig({
  output: 'static',
  publicDir: publicationPublicDir,
  devToolbar: { enabled: false },
  integrations: [publicationIntegration(), react()],
  ...(process.env.PUBLIC_SITE_URL ? { site: process.env.PUBLIC_SITE_URL } : {}),
  base,
  trailingSlash: 'never',
  vite: {
    server: {
      fs: {
        deny: [
          '.env',
          '.env.*',
          '*.{crt,pem}',
          '**/.git/**',
          '**/content-source/**',
          '**/apps/web/public/**',
          '**/apps/web/dist/**',
          '**/apps/web/.tmp/**',
        ],
      },
    },
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
