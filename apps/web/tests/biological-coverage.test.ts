// @vitest-environment node
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  getAllOrganisms,
  getAllRoutes,
  getContentRecords,
  getPublicContentRecords,
} from '../src/lib/content';
import { buildRouteInventory } from '../src/lib/content-routes';
import { buildAtlasMonopageOrganisms } from '../src/lib/atlas-monopage-data';
import { filterOrganisms } from '../src/features/catalog/hooks/useOrganismCatalogOrchestration';
import { exposureRouteLabel, toxicStrategyLabel } from '../src/lib/organism-labels';
import { rawCatalogEntries } from './fixtures/raw-catalog';

const searchOutput = vi.hoisted(() => ({ write: vi.fn() }));
// Capture the real generator's output without changing another agent's artifacts.
vi.mock('node:fs', async (importOriginal) => ({
  ...await importOriginal<typeof import('node:fs')>(), writeFileSync: searchOutput.write, mkdirSync: vi.fn(),
}));

describe('biological coverage expansion', () => {
  // Authored coverage is intentionally broader than the eligible public roster.
  const raw = getContentRecords();
  const repoRoot = existsSync(path.join(process.cwd(), 'content-source'))
    ? process.cwd()
    : path.resolve(process.cwd(), '../..');

  it('loads fifteen organisms across multiple kingdoms', () => {
    const organisms = raw.organisms;
    const kingdoms = new Set(
      organisms
        .map((entry) => entry.taxonomy.kingdom)
        .filter((kingdom): kingdom is string => Boolean(kingdom)),
    );
    const slugs = new Set(organisms.map((entry) => entry.slug));

    expect(organisms).toHaveLength(15);
    expect(kingdoms.size).toBeGreaterThan(1);
    expect(slugs).toEqual(
      new Set([
        'solenopsis-invicta',
        'phyllobates-terribilis',
        'oxyuranus-microlepidotus',
        'ornithorhynchus-anatinus',
        'synanceia-verrucosa',
        'clostridium-botulinum',
        'amanita-phalloides',
        'datura-stramonium',
        'ricinus-communis',
        'latrodectus-hasselti',
        'androctonus-australis',
        'conus-geographus',
        'chironex-fleckeri',
        'eunice-aphroditois',
        'heloderma-suspectum',
      ]),
    );
  });

  it('loads the toxin-producing bacterium without classifying it as venomous', () => {
    const organism = raw.organisms.find(
      (entry) => entry.slug === 'clostridium-botulinum',
    );

    expect(organism?.toxicStrategy).toBe('toxin_producing');
    expect(organism?.taxonomy.kingdom).toBe('Bacteria');
    expect(organism?.deliveryMechanism.route).toBe('production');
  });

  it('keeps occurrence geography present while retaining linked toxin records', () => {
    const slug = 'clostridium-botulinum';
    const material = raw.toxicMaterials.find((entry) => entry.organismSlug === slug);
    expect(raw.geography.find((entry) => entry.organismSlug === slug)?.ranges
      .some((range) => range.layerType === 'confirmed_occurrence')).toBe(true);
    expect(material?.featuredToxinSlug).toBe('botulinum-neurotoxin');
    expect(raw.mechanisms.find((entry) => entry.subject.kind === 'organism_exposure' && entry.subject.slug === slug)?.steps).toHaveLength(2);
    expect(raw.toxins.filter((entry) => entry.toxicMaterialId === material?.id)).toHaveLength(1);
  });

  it('represents new organism materials without inventing chemistry records', () => {
    const newOrganismSlugs = [
      'latrodectus-hasselti',
      'androctonus-australis',
      'conus-geographus',
      'chironex-fleckeri',
      'eunice-aphroditois',
      'heloderma-suspectum',
    ];
    for (const slug of newOrganismSlugs) {
      const material = raw.toxicMaterials.find((entry) => entry.organismSlug === slug);
      expect(material).toBeDefined();
      expect(raw.toxins.filter((entry) => entry.toxicMaterialId === material!.id)).toEqual([]);
    }

    for (const slug of ['datura-stramonium', 'amanita-phalloides', 'ricinus-communis']) {
      const material = raw.toxicMaterials.find((entry) => entry.organismSlug === slug);
      expect(material).toBeDefined();
      expect(raw.toxins.some((entry) => entry.toxicMaterialId === material!.id)).toBe(true);
    }
  });

  it('retains raw draft artifacts while atlas and generated search expose only the public projection', async () => {
    const organismSlugs = new Set(getAllOrganisms().map((entry) => entry.organism.slug));
    const atlasOrganisms = buildAtlasMonopageOrganisms();
    const atlasSlugs = new Set(atlasOrganisms.map((entry) => entry.slug));
    const staticSlugs = new Set(
      readdirSync(path.join(repoRoot, 'apps/web/public/data/organisms'))
        .filter((fileName) => /^[^.]+\.json$/.test(fileName))
        .map((fileName) => fileName.replace(/\.json$/, '')),
    );
    await import('../../../scripts/build-search-index');
    expect(searchOutput.write).toHaveBeenCalledOnce();
    const searchRecords = JSON.parse(searchOutput.write.mock.calls[0]![1] as string) as Array<{ entityType: string; route: string }>;
    const searchSlugs = new Set(
      searchRecords
        .filter((record) => record.entityType === 'organism')
        .map((record) => record.route.replace(/^\/organisms\//, '')),
    );

    expect(atlasOrganisms).toHaveLength(organismSlugs.size);
    expect(atlasSlugs).toEqual(organismSlugs);
    expect(staticSlugs).toEqual(organismSlugs);
    expect(organismSlugs).toEqual(new Set(getPublicContentRecords().organisms.map((entry) => entry.slug)));
    expect(searchSlugs).toEqual(organismSlugs);
  });

  it('gives every organism at least an occurrence-tier geography layer', () => {
    expect(raw.organisms.length).toBeGreaterThan(0);
    for (const organism of raw.organisms) {
      const geography = raw.geography.find((entry) => entry.organismSlug === organism.slug);
      expect(geography?.ranges.some((range) => range.layerType === 'confirmed_occurrence')).toBe(true);
    }
  });

  it('requires a cited native-range decision for every organism', () => {
    expect(raw.organisms.length).toBeGreaterThan(0);
    for (const organism of raw.organisms) {
      const geography = raw.geography.find((entry) => entry.organismSlug === organism.slug);
      expect(geography?.sourceAudit.evidenceIds.length).toBeGreaterThan(0);
      expect(geography?.sourceAudit.citationIds.length).toBeGreaterThan(0);
      expect(geography?.sourceAudit.note.length).toBeGreaterThan(0);
    }

    expect(raw.geography.find((entry) => entry.organismSlug === 'clostridium-botulinum')?.sourceAudit.decision)
      .toBe('native_range_not_meaningful');
  });

  it('keeps authored native administrative claims independent from occurrence points', () => {
    const geography = raw.geography.find((entry) => entry.organismSlug === 'heloderma-suspectum')!;
    expect(geography.distribution?.nativeAdmin1RegionIds).toEqual(['USA-US-AZ', 'MEX-MX-SON']);
    expect(geography.ranges.some((range) => range.layerType === 'native_range' && !range.geometryAssetPath)).toBe(true);
    expect(geography.ranges.some((range) => range.layerType === 'confirmed_occurrence' && !!range.geometryAssetPath)).toBe(true);
  });

  it('retains a source-backed Redback country scope for ADM1 expansion', () => {
    const geography = raw.geography.find((entry) => entry.organismSlug === 'latrodectus-hasselti')!;
    expect(geography.distribution?.nativeScopes).toEqual([expect.objectContaining({
      type: 'country', id: 'AUS', evidenceIds: ['ev-latrodectus-hasselti-native-range'], confidence: 'high',
    })]);
  });

  it('retains the fire ant country-level native claim across all cited countries', () => {
    const geography = raw.geography.find((entry) => entry.organismSlug === 'solenopsis-invicta')!;
    const fireAntCountries = new Set(
      geography.distribution?.nativeScopes?.map((scope) => scope.id),
    );

    expect(fireAntCountries).toEqual(new Set(['ARG', 'BOL', 'BRA', 'PRY', 'URY']));
    expect(geography.distribution?.nativeScopes?.every((scope) =>
      scope.evidenceIds.includes('ev-solenopsis-invicta-native-range'))).toBe(true);
  });

  it('provides ISEA3H evidence cells for every marine organism', () => {
    const marine = raw.geography.filter((entry) => entry.geographyKind === 'marine');
    expect(marine).toHaveLength(4);
    for (const geography of marine) {
      expect(geography.ranges.some((range) => range.layerType === 'marine_evidence_cell')).toBe(true);
      expect(existsSync(path.join(
        repoRoot,
        'apps/web/public/geography',
        `${geography.organismSlug}-isea3h-evidence.geojson`,
      ))).toBe(true);
    }
  });

  it('searches catalog text and filters by kingdom and toxic strategy', () => {
    const organisms = rawCatalogEntries(raw);

    expect(filterOrganisms(organisms, { query: 'formicidae', kingdom: '', toxicStrategy: '' }).map((organism) => organism.slug))
      .toEqual(['solenopsis-invicta']);
    expect(filterOrganisms(organisms, { query: '', kingdom: 'Plantae', toxicStrategy: '' }).map((organism) => organism.slug))
      .toEqual(['datura-stramonium', 'ricinus-communis']);
    expect(filterOrganisms(organisms, { query: '', kingdom: '', toxicStrategy: 'toxin_producing' }).map((organism) => organism.slug))
      .toEqual(['clostridium-botulinum']);
  });

  it('preserves raw baseline route planning and gates public routes without changing terminology', () => {
    const routes = new Set(buildRouteInventory(raw));
    expect(getAllRoutes()).toEqual(buildRouteInventory(getPublicContentRecords()));
    for (const slug of [
      'solenopsis-invicta',
      'phyllobates-terribilis',
      'oxyuranus-microlepidotus',
      'ornithorhynchus-anatinus',
      'synanceia-verrucosa',
    ]) {
      expect(routes.has(`/organisms/${slug}`)).toBe(true);
    }
    expect(routes.has('/organisms/solenopsis-invicta/venom')).toBe(true);
    expect(toxicStrategyLabel('toxin_producing')).toBe('toxin-producing');
    expect(exposureRouteLabel('production')).toBe('toxin production');
  });

  it('keeps botulinum evidence scoped across organism exposure and isolated toxin records', () => {
    const mechanism = raw.mechanisms.find((entry) => entry.subject.kind === 'organism_exposure' && entry.subject.slug === 'clostridium-botulinum');
    const toxin = raw.toxins.find((entry) => entry.slug === 'botulinum-neurotoxin');

    expect(mechanism?.subject).toEqual({ kind: 'organism_exposure', slug: 'clostridium-botulinum' });
    expect(mechanism?.steps.map((step) => step.level)).toEqual(['exposure', 'clinical']);
    expect(toxin?.toxicMaterialId).toBe('mat-clostridium-botulinum-toxin');
    expect(toxin?.id).not.toBe('org-clostridium-botulinum');
  });
});
