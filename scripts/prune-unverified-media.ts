import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAllMediaAssets } from '../apps/web/src/lib/content';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const distRoot = path.join(repoRoot, 'apps', 'web', 'dist');

const blockedAssets = getAllMediaAssets().filter((entry) => !entry.redistributionVerified);

for (const asset of blockedAssets) {
  const outputPath = path.join(distRoot, asset.localPath.replace(/^\//, ''));
  if (existsSync(outputPath)) {
    rmSync(outputPath, { force: true });
  }
}

console.log(`Pruned ${blockedAssets.length} unverified media assets from static dist output.`);
