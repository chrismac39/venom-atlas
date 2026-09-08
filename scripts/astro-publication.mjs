import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const stage = new URL('../apps/web/.publication-public/', import.meta.url);
const regenerate = () => execFileSync(process.execPath, ['--import', 'tsx', path.join(repoRoot, 'scripts/prepare-publication.ts')], {
  cwd: repoRoot, stdio: 'inherit',
});

export const publicationIntegration = () => ({
  name: 'publication-artifact-gate',
  hooks: {
    'astro:config:setup': ({ command, updateConfig }) => {
      if (command === 'dev' || command === 'build') regenerate();
      updateConfig({
        publicDir: fileURLToPath(stage),
        vite: {
          server: {
            fs: {
              // publicDir alone is insufficient: Vite's /@fs and /public URLs
              // must not expose the retained offline inputs either.
              deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/public/**', '**/content-source/**', '**/dist/**', '**/.tmp/**'],
            },
          },
        },
      });
    },
    'astro:server:setup': ({ server, logger }) => {
      const contentRoot = path.join(repoRoot, 'content-source');
      const rawPublic = path.join(repoRoot, 'apps/web/public');
      server.watcher.add([contentRoot, rawPublic]);
      let timer;
      let unavailable = false;
      server.middlewares.use((_req, res, next) => {
        if (!unavailable) return next();
        res.statusCode = 503;
        res.end('Publication data is rebuilding.');
      });
      const onChange = (_event, file) => {
        const absolute = path.resolve(file);
        const isContent = absolute.startsWith(`${contentRoot}${path.sep}`);
        const isInput = absolute.startsWith(`${rawPublic}${path.sep}`)
          && !absolute.startsWith(`${path.join(rawPublic, 'data')}${path.sep}`)
          && !absolute.endsWith('national-boundaries.geojson');
        if (!isContent && !isInput) return;
        unavailable = true;
        rmSync(stage, { recursive: true, force: true });
        clearTimeout(timer);
        timer = setTimeout(() => {
          try {
            regenerate();
            server.moduleGraph.invalidateAll();
            unavailable = false;
            server.ws.send({ type: 'full-reload' });
          } catch (error) {
            logger.error(`Publication regeneration failed; serving is blocked: ${error.message}`);
          }
        }, 100);
      };
      server.watcher.on('all', onChange);
      server.httpServer?.once('close', () => {
        clearTimeout(timer);
        server.watcher.off('all', onChange);
      });
    },
  },
});