import { describe, expect, it } from 'vitest';
import { atlasSeedData } from '../../domain/src/seedData';
import { atlasSeedSchema, evidenceAssessmentSchema } from '../src';

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

  it('preserves claim review metadata and causal scope', () => {
    const evidence = evidenceAssessmentSchema.parse({
      id: 'ev-reviewed-claim',
      confidence: 'high',
      evidenceType: 'clinical',
      citationIds: ['cit-clinical-example'],
      reviewedAt: '2026-09-07',
      reviewStatus: 'reviewed',
      causalScope: 'organism_exposure',
    });

    expect(evidence.reviewedAt).toBe('2026-09-07');
    expect(evidence.reviewStatus).toBe('reviewed');
    expect(evidence.causalScope).toBe('organism_exposure');
  });
});
