import { describe, expect, it } from 'vitest';
import { atlasSeedData } from '../../domain/src/seedData';
import { atlasSeedSchema, claimAssertionSchema, evidenceAssessmentSchema } from '../src';

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

  it('requires complete AI provenance while keeping source and processing dates separate', () => {
    const assertion = {
      id: 'claim-clinical-example', claimType: 'clinical', label: 'Clinical example',
      value: { kind: 'text', text: 'A bounded clinical summary.' },
      scope: { subjectKind: 'organism_exposure', subjectSlug: 'example' }, conditions: [],
      applicability: { evidenceContext: 'human_clinical', species: 'Homo sapiens', summary: 'Human reports only.' },
      sourceLocators: [{ citationId: 'cit-clinical-example', locator: 'Results', sourceVersionDate: '2024-01-02' }],
      provenance: {
        method: 'ai_summary', methodVersion: 'summary-v1', retrievedAt: '2026-09-08T00:00:00Z',
        generatedAt: '2026-09-08T00:01:00Z', checkedAt: '2026-09-08T00:02:00Z',
        model: 'fixture-model', promptVersion: 'fixture-prompt-v1',
      },
      validation: { status: 'passed', checkedAt: '2026-09-08T00:02:00Z', checks: ['source_locator_present'] },
    } as const;

    expect(claimAssertionSchema.parse(assertion).sourceLocators[0]?.sourceVersionDate).toBe('2024-01-02');
    expect(() => claimAssertionSchema.parse({ ...assertion, provenance: { ...assertion.provenance, model: undefined } })).toThrow(
      'AI-derived assertions require generatedAt, model, and promptVersion.',
    );
  });
});
