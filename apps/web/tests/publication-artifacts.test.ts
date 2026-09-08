// @vitest-environment node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { getContentRecords, type ContentRecords } from '../src/lib/content';
import { publicationAssetPaths, publicationDataPaths, resolvePublicationPath, stagePublication } from '../../../scripts/publication-artifacts';
import { buildSitemap } from '../src/lib/sitemap';

const empty = (): ContentRecords => ({
  organisms: [], toxicMaterials: [], toxins: [], geography: [], mechanisms: [], physiology: [], citations: [], media: [],
});
const temporary: string[] = [];
afterEach(() => temporary.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));

describe('publication artifact allowlist', () => {
  it('has no scientific assets with an empty public graph, but retains usable downloads', () => {
    expect(publicationAssetPaths(empty())).toEqual([]);
    expect(publicationDataPaths(empty())).toEqual([
      '/data/search-index.json', '/data/venom-atlas.sqlite', '/data/geography/distribution-registry.json',
    ]);
  });

  it('uses only graph-relevant geography, verified structures, and referenced verified images', () => {
    // Deliberately a raw test fixture, NOT an assertion that the real dossier is eligible.
    const raw = getContentRecords();
    const content = empty();
    const organism = structuredClone(raw.organisms.find((entry) => entry.slug === 'solenopsis-invicta')!);
    organism.externalProfile = { sourceLabel: 'Fixture', sourceUrl: 'https://example.org', summaryPoints: [], imagePaths: ['/images/allowed.svg', '/images/unverified.svg'] };
    content.organisms = [organism];
    content.geography = raw.geography.filter((entry) => entry.organismSlug === organism.slug);
    content.toxins = [structuredClone(raw.toxins.find((entry) => entry.slug === 'solenopsin-a')!)];
    content.toxins[0]!.structureAssets.push({ id: 'blocked', localPath: '/structures/blocked.sdf', format: 'sdf', verified: false, structureStatus: 'computed' });
    content.media = [
      { id: 'allowed', kind: 'organism_photo', localPath: '/images/allowed.svg', redistributionVerified: true },
      { id: 'unrelated', kind: 'organism_photo', localPath: '/images/unrelated.svg', redistributionVerified: true },
      { id: 'unverified', kind: 'organism_photo', localPath: '/images/unverified.svg', redistributionVerified: false },
    ];
    const paths = publicationAssetPaths(content);
    expect(paths).toContain('/geography/solenopsis-invicta-occurrences.geojson');
    expect(paths).toContain('/geography/admin1/global.geojson');
    expect(paths).toContain('/structures/solenopsin-a.sdf');
    expect(paths).toContain('/images/allowed.svg');
    for (const blocked of ['/geography/phyllobates-terribilis-occurrences.geojson', '/structures/batrachotoxin.sdf', '/structures/blocked.sdf', '/images/unrelated.svg', '/images/unverified.svg']) {
      expect(paths).not.toContain(blocked);
    }
  });

  it('replaces stale stages, never copies unlisted downloads, and leaves raw inputs intact', () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'atlas-publication-'));
    temporary.push(root);
    const source = path.join(root, 'public');
    const stage = path.join(root, 'stage');
    mkdirSync(path.join(source, 'data'), { recursive: true });
    mkdirSync(path.join(stage, 'data'), { recursive: true });
    writeFileSync(path.join(source, 'data/search-index.json'), '[]');
    writeFileSync(path.join(source, 'data/draft.json'), '{"draft":true}');
    writeFileSync(path.join(stage, 'data/previously-published.json'), '{}');
    stagePublication(source, stage, ['/data/search-index.json']);
    expect(readFileSync(path.join(stage, 'data/search-index.json'), 'utf8')).toBe('[]');
    expect(existsSync(path.join(stage, 'data/draft.json'))).toBe(false);
    expect(existsSync(path.join(stage, 'data/previously-published.json'))).toBe(false);
    expect(existsSync(path.join(source, 'data/draft.json'))).toBe(true);
    expect(() => stagePublication(source, stage, ['/data/missing.json'])).toThrow();
    expect(existsSync(stage)).toBe(false);
    expect(existsSync(source)).toBe(true);
  });

  it.each(['/data/../draft.json', '/data/%2e%2e/draft.json', '/data/a\\b', '/content-source/draft.yaml', '/data//draft.json', '/images/a.svg?raw'])('rejects unsafe paths: %s', (value) => {
    expect(() => resolvePublicationPath(os.tmpdir(), value)).toThrow();
  });
});

describe('publication sitemap', () => {
  it('emits only supplied public routes, with project base paths and XML escaping', () => {
    const sitemap = buildSitemap(['/', '/about', '/atlas/eligible', '/about'], new URL('https://example.org'), '/project/');
    expect(sitemap).toContain('<loc>https://example.org/project/</loc>');
    expect(sitemap).toContain('<loc>https://example.org/project/atlas/eligible</loc>');
    expect(sitemap.match(/<url>/g)).toHaveLength(3);
    expect(sitemap).not.toContain('draft');
    expect(buildSitemap(['/a?b=1&c=2'], new URL('https://example.org'), '/')).toContain('&amp;');
  });
  it('does not guess a deployment origin or emit localhost into production XML', () => {
    expect(buildSitemap(['/', '/about'], undefined, '/')).not.toContain('<loc>');
  });
});