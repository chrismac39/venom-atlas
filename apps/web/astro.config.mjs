import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

const base = process.env.PUBLIC_BASE_PATH ?? '/';

export default defineConfig({
  output: 'static',
  integrations: [react()],
  base,
  trailingSlash: 'never',
  server: {
    host: '127.0.0.1',
    port: 5199,
  },
  preview: {
    host: '127.0.0.1',
    port: 5199,
  },
});
