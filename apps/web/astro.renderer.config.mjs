// TEST-ONLY SITE. Never imported by astro.config.mjs or the deployment build.
// Exercise real rendering with retained offline structures, not public dossiers.
import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

const publicDir = new URL('./.tmp/renderer-public/', import.meta.url);
rmSync(publicDir, { recursive: true, force: true });
for (const slug of ['solenopsin-a', 'batrachotoxin']) {
  for (const asset of [`structures/${slug}.sdf`, `images/${slug}-2d.svg`]) {
    const destination = new URL(asset, publicDir);
    mkdirSync(new URL('./', destination), { recursive: true });
    copyFileSync(new URL(`./public/${asset}`, import.meta.url), destination);
  }
}

export default defineConfig({
  output: 'static',
  srcDir: './tests/renderer-site',
  publicDir: fileURLToPath(publicDir),
  outDir: './.tmp/renderer-dist',
  cacheDir: './.tmp/renderer-astro',
  integrations: [react()],
  trailingSlash: 'never',
  vite: {
    optimizeDeps: { include: ['3dmol'], needsInterop: ['3dmol'] },
    ...(process.env.MOLECULAR_TEST_CACHE ? { cacheDir: process.env.MOLECULAR_TEST_CACHE } : {}),
  },
});