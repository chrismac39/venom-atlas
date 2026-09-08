// @vitest-environment node
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dossierWithAssets, readyDossier } from './fixtures/publication-readiness';

const mocks = vi.hoisted(() => ({
  content: vi.fn(), readFile: vi.fn(), readDirectory: vi.fn(), fileEmpty: vi.fn(),
  publicGetter: vi.fn(() => { throw new Error('Validators must not read gated public getters'); }),
  validateGeometry: vi.fn(), log: vi.fn(),
}));
vi.mock('../src/lib/content', () => ({
  getContentRecords: mocks.content, getAllOrganisms: mocks.publicGetter, getAllToxins: mocks.publicGetter,
  getGeographyByOrganismSlug: mocks.publicGetter, getPublicAssetAbsolutePath: (asset: string) => asset, isFileEmpty: mocks.fileEmpty,
}));
vi.mock('node:fs', () => ({ readFileSync: mocks.readFile, readdirSync: mocks.readDirectory }));
vi.mock('../../../scripts/geography-asset-validation', () => ({ validateFeatureCollection: mocks.validateGeometry }));

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  mocks.publicGetter.mockImplementation(() => { throw new Error('Validators must not read gated public getters'); });
  mocks.fileEmpty.mockReturnValue(false);
  vi.spyOn(console, 'log').mockImplementation(mocks.log);
});
afterEach(() => vi.restoreAllMocks());

describe('raw geography source validator', () => {
  const prepare = () => {
    const content = readyDossier();
    mocks.content.mockReturnValue(content);
    mocks.readDirectory.mockReturnValue(['fixture.yaml']);
    mocks.readFile.mockImplementation((file: string) => JSON.stringify(path.basename(path.dirname(file)) === 'citations'
      ? { citations: content.citations } : content.geography[0]));
    return content;
  };

  it('validates the authored organism roster without consulting empty public selectors', async () => {
    prepare();
    await import('../../../scripts/validate-geography-sources');
    expect(mocks.content).toHaveBeenCalledOnce();
    expect(mocks.publicGetter).not.toHaveBeenCalled();
    expect(mocks.log).toHaveBeenCalledWith('Geography source validation passed (1 organism audits).');
  });

  it('rejects a draft organism whose geography audit is absent', async () => {
    const content = prepare();
    content.organisms.push(...readyDossier('draft-without-geography').organisms);
    await expect(import('../../../scripts/validate-geography-sources')).rejects.toThrow('Organism is missing a geography source audit: draft-without-geography');
    expect(mocks.publicGetter).not.toHaveBeenCalled();
  });

  it('rejects an orphan geography audit against raw organism ownership', async () => {
    prepare().organisms = [];
    await expect(import('../../../scripts/validate-geography-sources')).rejects.toThrow('Geography source audit has no organism record: test-organism');
  });

  it('still rejects unresolved citations in a draft source audit', async () => {
    prepare().geography[0]!.sourceAudit.citationIds = ['missing-citation'];
    await expect(import('../../../scripts/validate-geography-sources')).rejects.toThrow('references unknown citation: missing-citation');
  });
});

describe('raw structure and geometry validator', () => {
  const prepare = () => {
    const content = dossierWithAssets();
    // Incomplete physiology means these assets belong to an unpublished draft.
    content.physiology = [];
    mocks.content.mockReturnValue(content);
    mocks.readFile.mockReturnValue(JSON.stringify({ type: 'FeatureCollection', features: [{ type: 'Feature',
      geometry: { type: 'Point', coordinates: [10, 20] }, properties: { license: 'CC0-1.0', sourceUrl: 'https://example.org/observation' } }] }));
    return content;
  };

  it('visits draft structures and raw geometryAssetPath instead of bundle-only geometryAssetId', async () => {
    prepare();
    await import('../../../scripts/validate-structures');
    expect(mocks.content).toHaveBeenCalledOnce();
    expect(mocks.publicGetter).not.toHaveBeenCalled();
    expect(mocks.fileEmpty).toHaveBeenCalledWith('/structures/test.sdf');
    expect(mocks.readFile).toHaveBeenCalledWith('/geography/test-occurrences.geojson', 'utf8');
    expect(mocks.validateGeometry).toHaveBeenCalledWith(expect.objectContaining({ assetPath: '/geography/test-occurrences.geojson', allowedGeometryTypes: ['Point'] }));
  });

  it('rejects an empty structure file even if its owner cannot publish', async () => {
    prepare();
    mocks.fileEmpty.mockReturnValue(true);
    await expect(import('../../../scripts/validate-structures')).rejects.toThrow('structure asset file is empty: /structures/test.sdf');
  });

  it('rejects missing source metadata in a draft structure', async () => {
    delete prepare().toxins[0]!.structureAssets[0]!.sourceUrl;
    await expect(import('../../../scripts/validate-structures')).rejects.toThrow('structure asset missing source metadata: structure-test');
  });

  it('rejects empty supported draft geometry', async () => {
    prepare();
    mocks.readFile.mockReturnValue(JSON.stringify({ type: 'FeatureCollection', features: [] }));
    await expect(import('../../../scripts/validate-structures')).rejects.toThrow('Publishable range geometry has no features');
  });

  it('propagates geometry validation failures for drafts', async () => {
    prepare();
    mocks.validateGeometry.mockImplementation(() => { throw new Error('Invalid authored geometry'); });
    await expect(import('../../../scripts/validate-structures')).rejects.toThrow('Invalid authored geometry');
  });
});