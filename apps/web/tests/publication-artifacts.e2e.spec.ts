import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { getContentRecords, getPublicContentRecords, type ContentRecords } from '../src/lib/content';
import { publicationAssetPaths, publicationDataPaths } from '../../../scripts/publication-artifacts';
import { expectSubstantiveDossier } from './helpers/atlas-dossier-browser';

const rawRoot = fileURLToPath(new URL('../public/', import.meta.url));
const base = (process.env.PUBLIC_BASE_PATH ?? '/').replace(/\/$/, '');
const url = (route: string) => `${base}${route}`;
const graph: ContentRecords = getPublicContentRecords();
const assets = new Set([...publicationAssetPaths(graph), ...publicationDataPaths(graph)]);
const files = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const file = path.join(directory, entry.name);
  return entry.isDirectory() ? files(file) : [file];
});

// Deliberately enumerate the public getter, never raw/draft content or a gate override.
// With an empty roster these cases are absent; the isolated UI suite runs the same contract nonvacuously.
for (const organism of graph.organisms) {
  test(`public dossier ${organism.slug} has four ordered, substantive, locally sourced sections`, async ({ page }) => {
    const response = await page.goto(url(`/atlas/${organism.slug}`));
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(organism.scientificName);
    await expectSubstantiveDossier(page);
    await expect(page.locator('#section-summary .atlas-organism-lede')).toHaveText(organism.overview);
  });
}

test('root and gated downloads remain usable, including the empty roster', async ({ request }) => {
  const root = await request.get(url('/'));
  expect(root.status()).toBe(200);
  if (!graph.organisms.length) expect(await root.text()).toContain('No organism dossiers currently meet');
  for (const artifact of assets) {
    expect((await request.get(url(artifact))).status(), artifact).toBe(200);
  }
  const search = await (await request.get(url('/data/search-index.json'))).json() as Array<{ entityType: string; route: string }>;
  expect(search.filter((entry) => entry.entityType === 'organism').map((entry) => entry.route.replace('/organisms/', '')).sort())
    .toEqual(graph.organisms.map(({ slug }) => slug).sort());
  const registry = await (await request.get(url('/data/geography/distribution-registry.json'))).json() as { records: Array<{ speciesId: string }> };
  for (const record of registry.records) expect(graph.organisms.some(({ slug }) => slug === record.speciesId)).toBe(true);
});

test('direct scientific asset URLs cannot bypass the public stage', async ({ request }) => {
  for (const file of files(rawRoot)) {
    const relative = `/${path.relative(rawRoot, file).replace(/\\/g, '/')}`;
    if (assets.has(relative)) continue;
    const response = await request.get(url(relative));
    expect([403, 404], relative).toContain(response.status());
  }
  const rawAsset = '/geography/solenopsis-invicta-occurrences.geojson';
  const absolute = path.join(rawRoot, rawAsset.slice(1)).replace(/\\/g, '/');
  const source = fileURLToPath(new URL('../../../content-source/organisms/solenopsis-invicta.yaml', import.meta.url)).replace(/\\/g, '/');
  for (const bypass of [`/public${rawAsset}`, `/public%2fgeography%2fsolenopsis-invicta-occurrences.geojson`, `/@fs/${absolute}`, `/@fs/${absolute}?raw`, `/@fs/${source}`]) {
    expect([403, 404], bypass).toContain((await request.get(url(bypass))).status());
  }
});

test('draft dossier, supporting, toxin and source URLs are absent from pages and sitemap', async ({ request }) => {
  const raw = getContentRecords();
  const blocked = [
    ...raw.organisms.filter(({ slug }) => !graph.organisms.some((entry) => entry.slug === slug))
      .flatMap(({ slug }) => [`/atlas/${slug}`, `/organisms/${slug}`, `/organisms/${slug}/geography`, `/organisms/${slug}/toxic-material`]),
    ...raw.toxins.filter(({ slug }) => !graph.toxins.some((entry) => entry.slug === slug)).map(({ slug }) => `/toxins/${slug}`),
    ...raw.citations.filter(({ id }) => !graph.citations.some((entry) => entry.id === id))
      .flatMap(({ slug, aliases }) => [slug, ...aliases].map((entry) => `/sources/${entry}`)),
  ];
  const sitemap = await request.get(url('/sitemap.xml'));
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain(`https://publication.example.org${url('/')}`);
  for (const route of blocked) {
    expect((await request.get(url(route))).status(), route).toBe(404);
    expect(xml).not.toContain(`${url(route)}</loc>`);
  }
});