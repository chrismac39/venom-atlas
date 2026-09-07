import { describe, expect, it } from 'vitest';
import {
  getAllOrganisms,
  getGeographyByOrganismSlug,
  getMechanismByOrganismExposureSlug,
  getToxicMaterialByOrganismSlug,
} from '../src/lib/content';
import { buildAtlasMonopageOrganisms } from '../src/lib/atlas-monopage-data';

describe('biological coverage expansion', () => {
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

  it('keeps optional geography absent while retaining linked toxin records', () => {
    const slug = 'clostridium-botulinum';
    const material = getToxicMaterialByOrganismSlug(slug);
    const atlasOrganism = buildAtlasMonopageOrganisms().find((entry) => entry.slug === slug);

    expect(getGeographyByOrganismSlug(slug)).toBeUndefined();
    expect(material?.toxicMaterial.featuredToxinSlug).toBe('botulinum-neurotoxin');
    expect(getMechanismByOrganismExposureSlug(slug)?.steps).toHaveLength(2);
    expect(atlasOrganism?.coverage.geography).toBe('missing');
    expect(atlasOrganism?.coverage.chemistry).toBe('available');
  });

  it('represents new organism materials without inventing chemistry records', () => {
    const newOrganismSlugs = [
      'amanita-phalloides',
      'datura-stramonium',
      'ricinus-communis',
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
  });
});
