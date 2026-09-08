// TEST ONLY: a separate route root and public directory; never imported by the publication config.
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  output: 'static',
  srcDir: './tests/atlas-ui-site',
  publicDir: './tests/atlas-ui-site/public',
  outDir: './.tmp/atlas-ui-dist',
  cacheDir: './.tmp/atlas-ui-astro',
  integrations: [react()],
  trailingSlash: 'never',
  devToolbar: { enabled: false },
  vite: { cacheDir: './node_modules/.vite-atlas-ui' },
});