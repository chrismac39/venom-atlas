import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as content from '../src/lib/content';
import { buildAtlasMonopageOrganisms } from '../src/lib/atlas-monopage-data';
import { atlasUiFixture, fixtureCitation, fixtureProvenance, fixtureStep } from './fixtures/atlas-ui-fixture';

// The content owner supplies the gate. These tests model its public getters, not real readiness.
vi.mock('../src/lib/content', () => ({
  getAllOrganisms: vi.fn(), getAllToxins: vi.fn(), getAllMechanisms: vi.fn(),
  getCitationsByIds: vi.fn(), getGeographyByOrganismSlug: vi.fn(),
  getMechanismByToxinSlug: vi.fn(), getPhysiologyByOrganismExposureSlug: vi.fn(),
  getPublishedMediaAssets: vi.fn(), getToxicMaterialByOrganismSlug: vi.fn(),
  getContentRecords: vi.fn(() => { throw new Error('UI must not bypass the public roster'); }),
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('BASE_URL', '/project/');
  const fixture = atlasUiFixture();
  const toxin = fixture.toxins[0]!;
  vi.mocked(content.getCitationsByIds).mockImplementation((ids) => ids.map((id) => ({
    ...fixtureCitation(id), visibility: id === 'internal' ? 'internal' : 'public',
  })));
  vi.mocked(content.getAllOrganisms).mockReturnValue([{
    organism: { ...fixture, id: 'org-fixture-organism', evidence: fixture.provenance.evidence },
    taxonomy: fixture.taxonomy,
    deliveryMechanism: { ...fixture.deliveryMechanism, route: 'sting' },
    habitats: fixture.habitats.map((habitat) => ({ ...habitat, organismId: 'org-fixture-organism', evidence: habitat.provenance.evidence })),
    ecologicalRoles: fixture.ecologicalRoles.map((role) => ({ ...role, organismId: 'org-fixture-organism', evidence: role.provenance.evidence })),
    geographyVisualizations: [],
  }]);
  vi.mocked(content.getPublishedMediaAssets).mockReturnValue([]);
  vi.mocked(content.getToxicMaterialByOrganismSlug).mockReturnValue({
    toxicMaterial: {
      ...fixture.toxicMaterial!, id: 'fixture-material', organismId: 'org-fixture-organism',
      biologicalMaterialId: 'biological-material', featuredToxinSlug: 'fixture-toxin',
    },
    components: fixture.toxicMaterial!.components,
  });
  vi.mocked(content.getAllToxins).mockReturnValue([{
    toxin: { ...toxin, toxicMaterialId: 'fixture-material', evidence: toxin.provenance.evidence },
    molecularEntity: {
      ...toxin, id: 'molecule', toxinId: 'fixture-toxin',
      evidence: { ...toxin.identityProvenance.evidence, citationIds: ['identity', 'internal', 'identity'] },
    },
    targets: toxin.targets.map((target) => ({ ...target, toxinId: 'fixture-toxin', targetType: 'unknown', evidence: target.provenance.evidence })),
    structureAssets: [
      { id: '2d', molecularEntityId: 'molecule', localPath: '/structures/fixture.svg', format: 'svg', verified: true, citationId: '2d', structureStatus: 'computed' },
      { id: '3d', molecularEntityId: 'molecule', localPath: '/structures/fixture.sdf', format: 'sdf', verified: true, citationId: '3d', sourceUrl: 'https://example.org/3d', structureStatus: 'experimental' },
    ],
    interactionVisualization: {
      id: 'complex', label: 'Fixture interaction', annotationPath: '/structures/annotations.json',
      structureAssetPath: '/structures/complex.pdb', structureFormat: 'pdb',
      evidence: { level: 'illustrative', source: 'Fixture demonstration' },
    },
  }]);
  vi.mocked(content.getAllMechanisms).mockReturnValue([
    { subject: { kind: 'organism_exposure', slug: fixture.slug }, steps: [...fixture.mechanismSteps].reverse() },
    { subject: { kind: 'whole_material', slug: 'fixture-material' }, steps: [fixtureStep('material-step', 'molecular', 1, 'whole_material')] },
    { subject: { kind: 'organism_exposure', slug: 'unrelated' }, steps: [fixtureStep('unrelated', 'clinical', 1)] },
  ]);
  vi.mocked(content.getMechanismByToxinSlug).mockReturnValue({
    subject: { kind: 'isolated_compound', slug: toxin.slug }, steps: toxin.mechanismSteps,
  });
  vi.mocked(content.getGeographyByOrganismSlug).mockReturnValue({
    organismSlug: fixture.slug, geographyKind: 'terrestrial', sourceAudit: fixture.geographySourceAudit!,
    ranges: [{
      ...fixture.geographyRanges[0]!, organismId: 'org-fixture-organism', layerType: 'native_range',
      evidence: fixtureProvenance('range').evidence,
    }],
  });
  vi.mocked(content.getPhysiologyByOrganismExposureSlug).mockReturnValue({
    subject: { kind: 'organism_exposure', slug: fixture.slug },
    applicability: fixture.physiology!.applicability!,
    anatomicalSystems: fixture.physiology!.anatomicalSystems,
    symptoms: fixture.physiology!.symptoms,
    effects: fixture.physiology!.effects.map((effect) => ({ ...effect, subject: { kind: 'organism_exposure', slug: fixture.slug } })),
  });
});
afterEach(() => vi.unstubAllEnvs());

describe('atlas UI view-model boundary', () => {
  it.each(['human', 'non_human', undefined] as const)('preserves optional physiology applicability: %s', (scope) => {
    const physiology = vi.mocked(content.getPhysiologyByOrganismExposureSlug).getMockImplementation()!('fixture-organism')!;
    delete physiology.applicability;
    if (scope) physiology.applicability = { scope, summary: 'Fixture applicability summary.' };
    vi.mocked(content.getPhysiologyByOrganismExposureSlug).mockReturnValue(physiology);
    const mapped = buildAtlasMonopageOrganisms()[0]!.physiology!;
    expect(mapped.applicability).toEqual(physiology.applicability);
    expect(Object.hasOwn(mapped, 'applicability')).toBe(Boolean(scope));
  });

  it('preserves claim-local provenance instead of borrowing the featured toxin bibliography', () => {
    const [organism] = buildAtlasMonopageOrganisms();
    expect(organism?.provenance.citations.map((citation) => citation.id)).toEqual(['organism']);
    expect(organism?.deliveryMechanism.provenance).toEqual(organism?.provenance);
    expect(organism?.geographyRanges[0]?.provenance.citations.map((citation) => citation.id)).toEqual(['range']);
    expect(organism?.geographyRanges[0]?.sourceGeometryAssetId).toBe('/geography/source.geojson');
    expect(organism?.geographySourceAudit?.citations.map((citation) => citation.id)).toEqual(['audit']);
    expect(organism?.geographySourceAudit?.precision).toBe('country');
    expect(organism?.toxicMaterial?.provenance.citations.map((citation) => citation.id)).toEqual(['material']);
    expect(organism?.toxicMaterial?.components[0]?.provenance.citations.map((citation) => citation.id)).toEqual(['component']);
    expect(organism?.mechanismSteps.map((step) => step.id)).toEqual(['exposure-step', 'molecular-step', 'clinical-step', 'material-step']);
    expect(organism?.mechanismSteps.at(-1)?.subject).toEqual({ kind: 'whole_material', slug: 'fixture-material' });
    expect(organism?.mechanismSteps[0]?.provenance.citations[0]?.id).toBe('exposure-step');
    expect(organism?.toxins[0]?.mechanismSteps[0]?.provenance.citations[0]?.id).toBe('compound-step');
    expect(organism?.toxins[0]?.targets[0]?.provenance.citations[0]?.id).toBe('target');
    expect(organism?.physiology?.effects[0]?.citations[0]?.id).toBe('effect');
    expect(organism?.physiology?.symptoms[0]?.citations[0]?.id).toBe('symptom');
    expect(content.getContentRecords).not.toHaveBeenCalled();
  });

  it('keeps toxin, molecular identity and structure sources distinct, public and base-path aware', () => {
    const toxin = buildAtlasMonopageOrganisms()[0]?.toxins[0];
    expect(toxin?.provenance.citations.map((citation) => citation.id)).toEqual(['toxin']);
    expect(toxin?.identityProvenance.citations.map((citation) => citation.id)).toEqual(['identity']);
    expect(toxin?.citations.map((citation) => citation.id)).toEqual(['toxin', 'identity', '2d', '3d']);
    expect(toxin?.structureSources.map((source) => [source.format, source.status, source.citations[0]?.id])).toEqual([
      ['svg', 'computed', '2d'], ['sdf', 'experimental', '3d'],
    ]);
    expect(toxin?.structure2dUrl).toBe('/project/structures/fixture.svg');
    expect(toxin?.structure3dUrl).toBe('/project/structures/fixture.sdf');
    expect(toxin?.interactionVisualization?.annotationPath).toBe('/project/structures/annotations.json');
    expect(toxin?.interactionVisualization?.structureAssetPath).toBe('/project/structures/complex.pdb');
  });

  it('allows an empty public roster without recovering draft organisms from raw records', () => {
    vi.mocked(content.getAllOrganisms).mockReturnValue([]);
    expect(buildAtlasMonopageOrganisms()).toEqual([]);
    expect(content.getContentRecords).not.toHaveBeenCalled();
    expect(content.getToxicMaterialByOrganismSlug).not.toHaveBeenCalled();
  });

  it('does not recover gated toxins or discard an eligible organism when its featured toxin is gated', () => {
    vi.mocked(content.getAllToxins).mockReturnValue([]);
    const organisms = buildAtlasMonopageOrganisms();
    expect(organisms).toHaveLength(1);
    expect(organisms[0]?.toxins).toEqual([]);
    expect(organisms[0]?.featuredToxin).toBeNull();
    expect(content.getMechanismByToxinSlug).not.toHaveBeenCalled();
    expect(content.getContentRecords).not.toHaveBeenCalled();
  });
});