import { describe, expect, it } from 'vitest';
import { atlasSeedData } from '../../domain/src/seedData';
import { atlasSeedSchema } from '../src';

describe('atlas seed schema', () => {
  it('validates seeded organism and molecule data', () => {
    const parsed = atlasSeedSchema.parse(atlasSeedData);
    const organism = parsed.organisms.find((entry) => entry.id === 'org-solenopsis-invicta');
    const molecule = parsed.molecularEntities.find((entry) => entry.id === 'mol-solenopsin-a');
    const toxicMaterial = parsed.toxicMaterials.find((entry) => entry.id === 'ven-fire-ant-primary');
    const toxin = parsed.toxins.find((entry) => entry.id === 'tox-solenopsin-a');

    expect(organism?.scientificName).toBe('Solenopsis invicta');
    expect(molecule?.displayName).toBe('Solenopsin A');
    expect(molecule?.formula).toBeNull();
    expect(toxicMaterial?.materialKind).toBe('venom');
    expect(toxin?.toxicMaterialId).toBe(toxicMaterial?.id);
    expect(parsed).not.toHaveProperty('venoms');
  });
});
