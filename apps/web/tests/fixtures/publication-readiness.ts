import type { ContentRecords } from '../../src/lib/content';

export const emptyContent = (): ContentRecords => ({
  organisms: [], toxicMaterials: [], toxins: [], compoundOccurrences: [], mechanisms: [], physiology: [], geography: [], citations: [], media: [],
});

/** Fictional, manually authored records: never load or upgrade real scientific YAML. */
export const readyDossier = (slug = 'test-organism'): ContentRecords => {
  const evidence = (section: string) => ({
    id: `ev-${slug}-${section}`, confidence: 'moderate' as const,
    evidenceType: 'database' as const, citationIds: [`cit-${slug}-${section}`],
  });
  return {
    organisms: [{
      id: `org-${slug}`, slug, scientificName: 'Testus syntheticus', commonName: 'Synthetic test organism',
      toxicStrategy: 'poisonous', overview: 'This fictional organism produces a documented test compound.',
      naturalHistory: ['This fictional organism occupies a described test habitat.'], taxonomy: { kingdom: 'Animalia' },
      deliveryMechanism: { route: 'ingestion', summary: 'Exposure follows ingestion of the fictional material.', sequence: [] },
      habitats: [], ecologicalRoles: [], geographyVisualizations: [], evidence: evidence('summary'),
    }],
    toxicMaterials: [{
      id: `mat-${slug}`, slug: `${slug}-material`, organismSlug: slug,
      biologicalMaterial: { id: `bio-${slug}`, kind: 'poison', name: 'Test material', description: 'Fictional biological test material.' },
      name: 'Test material', description: 'The fictional material contains a characterized test compound.',
      ecologicalRoleSummary: 'The material has a documented defensive test role.', featuredToxinSlug: `${slug}-toxin`,
      components: [{ id: `component-${slug}`, componentCategory: 'test alkaloid', summary: 'A characterized compound is present in this material.', evidence: evidence('chemistry') }],
      evidence: evidence('chemistry'),
    }],
    toxins: [{
      id: `toxin-${slug}`, slug: `${slug}-toxin`, toxicMaterialId: `mat-${slug}`, displayName: 'Test compound',
      notes: 'This synthetic compound represents a characterized molecular identity.',
      molecularEntity: {
        id: `molecule-${slug}`, displayName: 'Test compound', molecularClass: 'small_molecule',
        formula: 'C2H6O', molecularWeight: 46.07, structureDataSource: 'Synthetic test database', evidence: evidence('chemistry'),
      },
      structureAssets: [],
      targets: [{ id: `target-${slug}`, targetName: 'Test enzyme', targetType: 'enzyme', summary: 'This compound inhibits a fictional test enzyme.', evidence: evidence('chemistry') }],
      evidence: evidence('chemistry'),
    }],
    compoundOccurrences: [],
    mechanisms: [{
      id: `mechanism-${slug}`, slug: `${slug}-mechanism`, subject: { kind: 'organism_exposure', slug },
      steps: [{ id: `step-${slug}`, order: 1, level: 'molecular', title: 'Test interaction',
        description: 'The compound interacts with a fictional test target.', targetId: `target-${slug}`, evidence: evidence('chemistry') }],
    }],
    physiology: [{
      id: `physiology-${slug}`, slug: `${slug}-physiology`, subject: { kind: 'organism_exposure', slug },
      applicability: { scope: 'human', summary: 'This fictional example describes human exposure applicability.' },
      anatomicalSystems: [{ id: `system-${slug}`, name: 'Test system', description: 'A fictional affected anatomical system.' }],
      symptoms: [{ id: `symptom-${slug}`, name: 'Test symptom', description: 'A fictional symptom follows the described exposure.', evidence: evidence('medical-effects') }],
      effects: [{ id: `effect-${slug}`, order: 1, anatomicalSystemId: `system-${slug}`, symptomId: `symptom-${slug}`,
        pathwayType: 'direct_toxin', title: 'Test effect', description: 'Exposure alters function in the fictional affected system.', evidence: evidence('medical-effects') }],
    }],
    geography: [{
      id: `geography-${slug}`, slug: `${slug}-geography`, organismSlug: slug, geographyKind: 'terrestrial',
      sourceAudit: { decision: 'native_range_not_established', precision: 'occurrence_only',
        evidenceIds: [`ev-${slug}-geography`], citationIds: [`cit-${slug}-geography`],
        note: 'These fictional observations do not establish native boundaries.' },
      ranges: [{ id: `range-${slug}`, layerType: 'confirmed_occurrence',
        summary: 'Fictional observations document occurrence in a test region.', evidence: evidence('geography') }],
    }],
    citations: ['summary', 'geography', 'chemistry', 'medical-effects'].map((section) => ({
      id: `cit-${slug}-${section}`, slug: `${slug}-${section}-source`, aliases: [],
      title: `Synthetic ${section} source`, url: `https://example.org/${slug}/${section}`, sourceType: 'database',
    })),
    media: [],
  };
};

export const dossierWithAssets = (): ContentRecords => {
  const content = readyDossier();
  content.organisms[0]!.externalProfile = {
    sourceLabel: 'Synthetic image source', sourceUrl: 'https://example.org/photo', summaryPoints: [], imagePaths: ['/images/test.svg'],
  };
  content.media = [{ id: 'media-test', kind: 'organism_photo', localPath: '/images/test.svg', redistributionVerified: true,
    license: 'CC0-1.0', attributionText: 'Synthetic test author', citationId: 'cit-test-organism-summary' }];
  content.toxins[0]!.structureAssets = [{ id: 'structure-test', localPath: '/structures/test.sdf', format: 'sdf',
    structureStatus: 'computed', verified: true, sourceUrl: 'https://example.org/structure', citationId: 'cit-test-organism-chemistry' }];
  content.geography[0]!.ranges[0]!.geometryAssetPath = '/geography/test-occurrences.geojson';
  content.geography[0]!.ranges[0]!.sourceGeometryAssetPath = '/geography/test-source.geojson';
  content.geography[0]!.distribution = { sourceRanges: [{ layerType: 'uncertain', geometryAssetPath: '/geography/test-range.geojson',
    evidenceIds: ['ev-test-organism-geography'], confidence: 'low' }] };
  return content;
};

export const mergeContent = (...inputs: ContentRecords[]): ContentRecords => ({
  organisms: inputs.flatMap((content) => content.organisms), toxicMaterials: inputs.flatMap((content) => content.toxicMaterials),
  toxins: inputs.flatMap((content) => content.toxins), compoundOccurrences: inputs.flatMap((content) => content.compoundOccurrences),
  mechanisms: inputs.flatMap((content) => content.mechanisms),
  physiology: inputs.flatMap((content) => content.physiology), geography: inputs.flatMap((content) => content.geography),
  citations: inputs.flatMap((content) => content.citations), media: inputs.flatMap((content) => content.media),
});