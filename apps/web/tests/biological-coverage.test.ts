import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getAllOrganisms,
  getAllRoutes,
  getGeographyByOrganismSlug,
  getMechanismByOrganismExposureSlug,
  getToxinBySlug,
  getToxicMaterialByOrganismSlug,
} from '../src/lib/content';
import { buildAtlasMonopageOrganisms } from '../src/lib/atlas-monopage-data';
import { filterOrganisms } from '../src/features/catalog/hooks/useOrganismCatalogOrchestration';
import { exposureRouteLabel, toxicStrategyLabel } from '../src/lib/organism-labels';

describe('biological coverage expansion', () => {
  const repoRoot = existsSync(path.join(process.cwd(), 'content-source'))
    ? process.cwd()
    : path.resolve(process.cwd(), '../..');

  it('loads fifteen organisms across multiple kingdoms', () => {
    const organisms = getAllOrganisms();
    const kingdoms = new Set(
      organisms
        .map((entry) => entry.taxonomy.kingdom)
        .filter((kingdom): kingdom is string => Boolean(kingdom)),
    );
    const slugs = new Set(organisms.map((entry) => entry.organism.slug));

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
    const organism = getAllOrganisms().find(
      (entry) => entry.organism.slug === 'clostridium-botulinum',
    );

    expect(organism?.organism.toxicStrategy).toBe('toxin_producing');
    expect(organism?.taxonomy.kingdom).toBe('Bacteria');
    expect(organism?.deliveryMechanism.route).toBe('production');
  });

  it('keeps occurrence geography present while retaining linked toxin records', () => {
    const slug = 'clostridium-botulinum';
    const material = getToxicMaterialByOrganismSlug(slug);
    const atlasOrganism = buildAtlasMonopageOrganisms().find((entry) => entry.slug === slug);

    expect(getGeographyByOrganismSlug(slug)?.ranges[0]?.layerType).toBe('confirmed_occurrence');
    expect(material?.toxicMaterial.featuredToxinSlug).toBe('botulinum-neurotoxin');
    expect(getMechanismByOrganismExposureSlug(slug)?.steps).toHaveLength(2);
    expect(atlasOrganism?.coverage.geography).toBe('available');
    expect(atlasOrganism?.coverage.chemistry).toBe('available');
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
    const atlasOrganisms = buildAtlasMonopageOrganisms();

    for (const slug of newOrganismSlugs) {
      const organism = atlasOrganisms.find((entry) => entry.slug === slug);
      expect(organism?.coverage.toxicMaterial).toBe('available');
      expect(organism?.coverage.chemistry).toBe('missing');
    }

    const datura = atlasOrganisms.find((organism) => organism.slug === 'datura-stramonium');
    expect(datura?.coverage.toxicMaterial).toBe('available');
    expect(datura?.coverage.chemistry).toBe('available');

    const amanita = atlasOrganisms.find((organism) => organism.slug === 'amanita-phalloides');
    expect(amanita?.coverage.toxicMaterial).toBe('available');
    expect(amanita?.coverage.chemistry).toBe('available');

    const ricinus = atlasOrganisms.find((organism) => organism.slug === 'ricinus-communis');
    expect(ricinus?.coverage.toxicMaterial).toBe('available');
    expect(ricinus?.coverage.chemistry).toBe('available');
  });

  it('keeps every organism present in atlas, static JSON, and search output', () => {
    const organismSlugs = new Set(getAllOrganisms().map((entry) => entry.organism.slug));
    const atlasOrganisms = buildAtlasMonopageOrganisms();
    const atlasSlugs = new Set(atlasOrganisms.map((entry) => entry.slug));
    const staticSlugs = new Set(
      readdirSync(path.join(repoRoot, 'apps/web/public/data/organisms'))
        .filter((fileName) => /^[^.]+\.json$/.test(fileName))
        .map((fileName) => fileName.replace(/\.json$/, '')),
    );
    const searchRecords = JSON.parse(
      readFileSync(path.join(repoRoot, 'apps/web/public/data/search-index.json'), 'utf8'),
    ) as Array<{ entityType: string; route: string }>;
    const searchSlugs = new Set(
      searchRecords
        .filter((record) => record.entityType === 'organism')
        .map((record) => record.route.replace(/^\/organisms\//, '')),
    );

    expect(atlasOrganisms).toHaveLength(organismSlugs.size);
    expect(atlasSlugs).toEqual(organismSlugs);
    expect(staticSlugs).toEqual(organismSlugs);
    expect(searchSlugs).toEqual(organismSlugs);
  });

  it('gives every organism at least an occurrence-tier geography layer', () => {
    for (const organism of buildAtlasMonopageOrganisms()) {
      expect(organism.coverage.geography).toBe('available');
      expect(organism.geographyRanges.some((range) => range.layerType === 'confirmed_occurrence')).toBe(true);
    }
  });

  it('keeps native administrative shading independent from occurrence points', () => {
    const registry = JSON.parse(
      readFileSync(path.join(repoRoot, 'apps/web/public/data/geography/distribution-registry.json'), 'utf8'),
    ) as { records: Array<{ speciesId: string; derivation: string; sourceRecordCount: number; distributionStatus: string }> };
    expect(registry.records.some((record) =>
      record.speciesId === 'heloderma-suspectum' &&
      record.distributionStatus === 'native' &&
      record.derivation === 'source_native_admin1' &&
      record.sourceRecordCount === 0,
    )).toBe(true);
  });

  it('expands a source-backed country scope to ADM1 records with distinct provenance', () => {
    const registry = JSON.parse(
      readFileSync(path.join(repoRoot, 'apps/web/public/data/geography/distribution-registry.json'), 'utf8'),
    ) as { records: Array<{ speciesId: string; countryCode: string; distributionStatus: string; derivation: string }> };
    const redbackRecords = registry.records.filter((record) => record.speciesId === 'latrodectus-hasselti');
    expect(redbackRecords.length).toBeGreaterThan(5);
    expect(redbackRecords.every((record) =>
      record.countryCode === 'AUS' &&
      record.distributionStatus === 'native' &&
      record.derivation === 'source_native_scope_to_admin1',
    )).toBe(true);
  });

  it('provides ISEA3H evidence cells for every marine organism', () => {
    for (const geography of getAllOrganisms()
      .flatMap((entry) => entry.organism.slug ? [getGeographyByOrganismSlug(entry.organism.slug)] : [])
      .filter((entry): entry is NonNullable<typeof entry> => entry?.geographyKind === 'marine')) {
      expect(geography.ranges.some((range) => range.layerType === 'marine_evidence_cell')).toBe(true);
      expect(existsSync(path.join(
        repoRoot,
        'apps/web/public/geography',
        `${geography.organismSlug}-isea3h-evidence.geojson`,
      ))).toBe(true);
    }
  });

  it('searches catalog text and filters by kingdom and toxic strategy', () => {
    const organisms = buildAtlasMonopageOrganisms();

    expect(filterOrganisms(organisms, { query: 'formicidae', kingdom: '', toxicStrategy: '' }).map((organism) => organism.slug))
      .toEqual(['solenopsis-invicta']);
    expect(filterOrganisms(organisms, { query: '', kingdom: 'Plantae', toxicStrategy: '' }).map((organism) => organism.slug))
      .toEqual(['datura-stramonium', 'ricinus-communis']);
    expect(filterOrganisms(organisms, { query: '', kingdom: '', toxicStrategy: 'toxin_producing' }).map((organism) => organism.slug))
      .toEqual(['clostridium-botulinum']);
  });

  it('preserves baseline organism routes and toxin-producing terminology', () => {
    const routes = new Set(getAllRoutes());
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
    const mechanism = getMechanismByOrganismExposureSlug('clostridium-botulinum');
    const toxin = getToxinBySlug('botulinum-neurotoxin');

    expect(mechanism?.subject).toEqual({ kind: 'organism_exposure', slug: 'clostridium-botulinum' });
    expect(mechanism?.steps.map((step) => step.level)).toEqual(['exposure', 'clinical']);
    expect(toxin?.toxin.toxicMaterialId).toBe('mat-clostridium-botulinum-toxin');
    expect(toxin?.toxin.id).not.toBe('org-clostridium-botulinum');
  });
});
