import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { publicationAssetPaths, publicationDataPaths, stagePublication } from './publication-artifacts';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const publicRoot = path.join(repoRoot, 'apps/web/public');
const stageRoot = path.join(repoRoot, 'apps/web/.publication-public');

const main = async (): Promise<void> => {
  // A failed regeneration must never leave yesterday's published roster served.
  rmSync(stageRoot, { recursive: true, force: true });
  for (const script of ['build-static-json', 'build-search-index', 'build-sqlite', 'build-geography-registry', 'build-national-boundaries']) {
    execFileSync(process.execPath, ['--import', 'tsx', path.join(repoRoot, `scripts/${script}.ts`)], {
      cwd: repoRoot, stdio: 'inherit',
    });
  }
  const { getPublicContentRecords } = await import('../apps/web/src/lib/content');
  const content = getPublicContentRecords();
  const paths = [...publicationDataPaths(content), ...publicationAssetPaths(content)];
  stagePublication(publicRoot, stageRoot, paths);
  console.log(`[publication] staged ${paths.length} artifacts for ${content.organisms.length} eligible organisms`);
};

main().catch((error) => {
  rmSync(stageRoot, { recursive: true, force: true });
  console.error(error);
  process.exitCode = 1;
});