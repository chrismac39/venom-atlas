import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs from 'sql.js';
import { getAllRoutes, getPublicContentRecords } from '../apps/web/src/lib/content';
import { publicationAssetPaths, publicationDataPaths } from './publication-artifacts';

const root = fileURLToPath(new URL('../apps/web/', import.meta.url));
const publicRoot = path.join(root, 'public');
const stageRoot = path.join(root, '.publication-public');
const readJson = (relative: string) => JSON.parse(readFileSync(path.join(publicRoot, relative), 'utf8'));
const files = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const file = path.join(directory, entry.name);
  return entry.isDirectory() ? files(file) : [file];
});

const main = async (): Promise<void> => {
  const graph = getPublicContentRecords();
  const organismSlugs = graph.organisms.map(({ slug }) => slug).sort();
  const toxinSlugs = graph.toxins.map(({ slug }) => slug).sort();
  const allowed = [...publicationDataPaths(graph), ...publicationAssetPaths(graph)].sort();
  assert.deepEqual(files(stageRoot).map((file) => `/${path.relative(stageRoot, file).replace(/\\/g, '/')}`).sort(), allowed);
  for (const directory of ['organisms', 'toxins', 'toxic-materials', 'mechanisms']) {
    const expected = allowed.filter((file) => file.startsWith(`/data/${directory}/`));
    const actual = files(path.join(publicRoot, 'data', directory)).map((file) => `/${path.relative(publicRoot, file).replace(/\\/g, '/')}`);
    assert.deepEqual(actual.sort(), expected.sort(), `Stale or missing generated ${directory} downloads`);
  }
  const search = readJson('data/search-index.json') as Array<{ entityType: string; route: string }>;
  assert.deepEqual(search.filter((entry) => entry.entityType === 'organism').map((entry) => entry.route.replace('/organisms/', '')).sort(), organismSlugs);
  assert.deepEqual(search.filter((entry) => entry.entityType === 'toxin').map((entry) => entry.route.replace('/toxins/', '')).sort(), toxinSlugs);
  const routes = new Set(getAllRoutes());
  for (const record of search) {
    assert(routes.has(record.route.split('#')[0]!), `Unpublished search route: ${record.route}`);
    assert(!/#section-(organism-profile|human-physiology|mechanisms|toxin-)/.test(record.route), `Noncanonical search anchor: ${record.route}`);
  }
  const registry = readJson('data/geography/distribution-registry.json') as { records: Array<{ speciesId: string }> };
  for (const record of registry.records) assert(organismSlugs.includes(record.speciesId), `Draft registry species: ${record.speciesId}`);
  const SQL = await initSqlJs();
  const db = new SQL.Database(readFileSync(path.join(publicRoot, 'data/venom-atlas.sqlite')));
  try {
    for (const [table, expected] of [['organisms', organismSlugs], ['toxins', toxinSlugs]] as const) {
      const result = db.exec(`SELECT slug FROM ${table} ORDER BY slug`);
      assert.deepEqual(result[0]?.values.map((row: unknown[]) => row[0]) ?? [], expected, `Draft or stale SQLite ${table}`);
    }
  } finally {
    db.close();
  }
  for (const asset of allowed) {
    assert(readFileSync(path.join(stageRoot, asset.slice(1))).equals(readFileSync(path.join(publicRoot, asset.slice(1)))), `Stale stage: ${asset}`);
  }
  if (process.argv.includes('--dist')) {
    const dist = path.join(root, 'dist');
    const artifacts = ['data', 'geography', 'images', 'structures'].flatMap((directory) => {
      const location = path.join(dist, directory);
      return existsSync(location) ? files(location) : [];
    });
    assert.deepEqual(artifacts.map((file) => `/${path.relative(dist, file).replace(/\\/g, '/')}`).sort(), allowed, 'Built output contains missing, stale, or unapproved artifacts; rebuild the site');
    for (const asset of allowed) {
      assert(readFileSync(path.join(dist, asset.slice(1))).equals(readFileSync(path.join(stageRoot, asset.slice(1)))), `Stale built download: ${asset}; rebuild the site`);
    }
    console.log('[publication] built static downloads match the current publication stage');
  }
  console.log(`[publication] verified JSON, search, SQLite, registry and ${allowed.length} staged artifacts`);
};

main().catch((error) => { console.error(error); process.exitCode = 1; });