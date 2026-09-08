import type { Citation } from '@venom-atlas/domain';
import type { AtlasMechanismStep, AtlasOrganismData, AtlasProvenance } from '../../src/features/atlas/atlas-types';

// Synthetic UI records, not scientific claims or publication-ready content.
export const fixtureCitation = (id: string): Citation => ({
  id, title: `${id} reference`, url: `https://example.org/${id}`, sourceType: 'other', visibility: 'public',
});

export const fixtureProvenance = (id: string): AtlasProvenance => ({
  evidence: { id: `ev-${id}`, confidence: 'moderate', evidenceType: 'observational', citationIds: [id] },
  citations: [fixtureCitation(id)],
});

export const fixtureStep = (
  id: string, level: AtlasMechanismStep['level'], order: number,
  kind: AtlasMechanismStep['subject']['kind'] = 'organism_exposure',
): AtlasMechanismStep => ({
  id, title: `${id} title`, description: `${id} description`, level, order,
  subject: { kind, slug: kind === 'isolated_compound' ? 'fixture-toxin' : 'fixture-organism' },
  evidence: fixtureProvenance(id).evidence, provenance: fixtureProvenance(id),
});

export const atlasUiFixture = (): AtlasOrganismData => ({
  slug: 'fixture-organism', scientificName: 'Fixture organism', commonName: 'Fixture common name',
  toxicStrategy: 'venomous', overview: 'Fixture organism overview.',
  provenance: fixtureProvenance('organism'),
  taxonomy: { kingdom: 'Fixture kingdom', species: 'Fixture organism' },
  naturalHistory: ['Fixture natural history.'],
  externalProfile: {
    sourceLabel: 'Fixture external reference', sourceUrl: 'https://example.org/profile',
    summaryPoints: ['Fixture reference summary.'],
  },
  geographyVisualizations: [],
  deliveryMechanism: {
    route: 'sting', summary: 'Fixture delivery summary.',
    sequence: Array.from({ length: 6 }, (_, i) => `Fixture delivery step ${i + 1}.`),
    provenance: fixtureProvenance('delivery'),
  },
  habitats: [{ id: 'habitat', name: 'Fixture habitat', summary: 'Fixture habitat description.', provenance: fixtureProvenance('habitat') }],
  ecologicalRoles: [{ id: 'role', role: 'Fixture ecology', summary: 'Fixture ecology description.', provenance: fixtureProvenance('ecology') }],
  geographyRanges: [{
    id: 'range', layerType: 'native_range', summary: 'Fixture range description.',
    geometryAssetId: '/geography/fixture.geojson', sourceGeometryAssetId: '/geography/source.geojson',
    provenance: fixtureProvenance('range'),
  }],
  geographyKind: 'terrestrial',
  geographySourceAudit: {
    decision: 'native_range_supported', precision: 'country', note: 'Fixture source precision limitation.',
    evidenceIds: ['ev-range'], citationIds: ['audit'], citations: [fixtureCitation('audit')],
  },
  toxicMaterial: {
    slug: 'fixture-material', name: 'Fixture material', description: 'Fixture material description.',
    ecologicalRoleSummary: 'Fixture material role.', materialKind: 'venom',
    evidence: fixtureProvenance('material').evidence, provenance: fixtureProvenance('material'),
    components: [{
      id: 'component', toxicMaterialId: 'fixture-material', componentCategory: 'Fixture category',
      abundanceQualifier: 'not_quantified', summary: 'Fixture component description.',
      evidence: fixtureProvenance('component').evidence, provenance: fixtureProvenance('component'),
    }],
  },
  coverage: {
    identity: 'available', geography: 'available', toxicMaterial: 'available', chemistry: 'available',
    structures: 'available', physiology: 'available', media: 'missing',
  },
  toxins: [{
    id: 'fixture-toxin', slug: 'fixture-toxin', displayName: 'Fixture toxin', family: 'Fixture family',
    notes: 'Fixture toxin description.', molecularClass: 'small_molecule', formula: 'C2H6',
    molecularWeight: 30, structureDataSource: 'Fixture structure source',
    structure2dUrl: '/structures/fixture.svg',
    provenance: fixtureProvenance('toxin'), identityProvenance: fixtureProvenance('identity'),
    evidence: fixtureProvenance('identity').evidence, citations: [fixtureCitation('identity')],
    targets: [{ id: 'target', targetName: 'Fixture target', summary: 'Fixture target description.', provenance: fixtureProvenance('target') }],
    mechanismSteps: [fixtureStep('compound-step', 'molecular', 1, 'isolated_compound')],
    structureSources: [{ id: 'structure', format: 'svg', status: 'computed', sourceUrl: 'https://example.org/structure', citations: [fixtureCitation('structure')] }],
  }],
  featuredToxin: null,
  mechanismSteps: [fixtureStep('exposure-step', 'exposure', 1), fixtureStep('molecular-step', 'molecular', 2), fixtureStep('clinical-step', 'clinical', 3)],
  physiology: {
    anatomicalSystems: [{ id: 'system', name: 'Fixture system', description: 'Fixture system description.' }],
    symptoms: [{ id: 'sym-systemic-allergy', name: 'Fixture symptom', description: 'Fixture symptom description.', ...fixtureProvenance('symptom') }],
    effects: [{
      id: 'effect', order: 1, title: 'Fixture effect', description: 'Fixture effect description.',
      pathwayType: 'direct_venom', anatomicalSystemId: 'system', ...fixtureProvenance('effect'),
    }],
  },
  citations: [fixtureCitation('organism')],
});