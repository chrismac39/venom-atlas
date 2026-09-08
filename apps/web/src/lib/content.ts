import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { z } from 'zod';
import { buildRouteInventory } from './content-routes';
import type {
  Citation,
  EvidenceAssessment,
  GeographicRange,
  MechanismStep,
  MolecularEntity,
  MolecularStructureAsset,
  MolecularTarget,
  Organism,
  PhysiologicalEffect,
  Symptom,
  Toxin,
  ToxinComponent,
  ToxicMaterial,
  AnatomicalSystem,
  Habitat,
  EcologicalRole,
  MediaAsset,
} from '@venom-atlas/domain';

const repoRoot = existsSync(path.join(process.cwd(), 'content-source'))
  ? process.cwd()
  : path.resolve(process.cwd(), '../..');
const contentRoot = path.join(repoRoot, 'content-source');

const evidenceSchema = z.object({
  id: z.string(),
  confidence: z.enum(['high', 'moderate', 'low', 'unknown']),
  evidenceType: z.enum([
    'experimental',
    'observational',
    'clinical',
    'review',
    'database',
    'editorial_normalization',
  ]),
  notes: z.string().optional(),
  citationIds: z.array(z.string()),
  reviewedAt: z.string().optional(),
  reviewStatus: z.enum(['unreviewed', 'reviewed', 'needs_review']).optional(),
  causalScope: z.enum(['organism_exposure', 'whole_material', 'isolated_compound']).optional(),
  publicUncertaintyStatement: z.string().trim().min(1).optional(),
});

const organismRecordSchema = z.object({
  id: z.string(),
  slug: z.string(),
  scientificName: z.string(),
  commonName: z.string(),
  toxicStrategy: z.enum(['venomous', 'poisonous', 'both', 'toxin_producing']),
  overview: z.string(),
  naturalHistory: z.array(z.string()),
  taxonomy: z.object({
    kingdom: z.string().nullable().optional(),
    phylum: z.string().nullable().optional(),
    className: z.string().nullable().optional(),
    order: z.string().nullable().optional(),
    family: z.string().nullable().optional(),
    genus: z.string().nullable().optional(),
    species: z.string().nullable().optional(),
  }),
  deliveryMechanism: z.object({
    route: z.enum([
      'sting',
      'bite',
      'spine',
      'spur',
      'ingestion',
      'contact',
      'inhalation',
      'production',
      'unknown',
    ]),
    summary: z.string(),
    sequence: z.array(z.string()),
  }),
  habitats: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      summary: z.string(),
    }),
  ),
  ecologicalRoles: z.array(
    z.object({
      id: z.string(),
      role: z.string(),
      summary: z.string(),
    }),
  ),
  geographyVisualizations: z
    .array(
      z.object({
        id: z.string(),
        kind: z.literal('external_embed'),
        provider: z.string(),
        label: z.string(),
        url: z.url(),
      }),
    )
    .default([]),
  externalProfile: z
    .object({
      sourceLabel: z.string(),
      sourceUrl: z.url(),
      summaryPoints: z.array(z.string()),
      imagePaths: z.array(z.string()),
    })
    .optional(),
  evidence: evidenceSchema,
});

const toxicMaterialRecordSchema = z.object({
  id: z.string(),
  slug: z.string(),
  organismSlug: z.string(),
  biologicalMaterial: z.object({
    id: z.string(),
    kind: z.enum(['venom', 'poison', 'secretion', 'isolated_toxin']),
    name: z.string(),
    description: z.string(),
  }),
  name: z.string(),
  description: z.string(),
  ecologicalRoleSummary: z.string(),
  featuredToxinSlug: z.string().optional(),
  components: z.array(
    z.object({
      id: z.string(),
      componentCategory: z.string(),
      abundanceQualifier: z
        .enum(['major', 'moderate', 'minor', 'present', 'not_quantified'])
        .optional(),
      summary: z.string().optional(),
      evidence: evidenceSchema,
    }),
  ),
  evidence: evidenceSchema,
});

const toxinRecordSchema = z.object({
  id: z.string(),
  slug: z.string(),
  toxicMaterialId: z.string(),
  displayName: z.string(),
  family: z.string().optional(),
  notes: z.string().optional(),
  molecularEntity: z.object({
    id: z.string(),
    displayName: z.string(),
    molecularClass: z.enum(['small_molecule', 'peptide', 'protein', 'complex']),
    formula: z.string().nullable(),
    molecularWeight: z.number().nullable(),
    structureDataSource: z.string().nullable(),
    evidence: evidenceSchema,
  }),
  structureAssets: z.array(
    z.object({
      id: z.string(),
      localPath: z.string(),
      format: z.enum(['sdf', 'mol', 'mol2', 'pdb', 'mmcif', 'svg']),
      sourceDatabase: z.string().nullable().optional(),
      sourceIdentifier: z.string().nullable().optional(),
      sourceUrl: z.string().nullable().optional(),
      citationId: z.string().nullable().optional(),
      structureStatus: z.enum(['experimental', 'computed', 'illustrative', 'placeholder']),
      verified: z.boolean(),
      license: z.string().nullable().optional(),
      notes: z.string().nullable().optional(),
    }),
  ),
  targets: z.array(
    z.object({
      id: z.string(),
      targetName: z.string(),
      targetType: z.enum([
        'receptor',
        'ion_channel',
        'enzyme',
        'membrane',
        'signaling_process',
        'other',
        'unknown',
      ]),
      summary: z.string(),
      evidence: evidenceSchema,
    }),
  ),
  interactionVisualization: z
    .object({
      id: z.string(),
      label: z.string(),
      annotationPath: z.string(),
      structureAssetPath: z.string(),
      structureFormat: z.enum(['pdb', 'mmcif']),
      evidence: z.object({
        level: z.enum(['experimental', 'computed', 'illustrative']),
        source: z.string(),
        notes: z.string().optional(),
      }),
    })
    .optional(),
  evidence: evidenceSchema,
});

const mechanismRecordSchema = z.object({
  id: z.string(),
  slug: z.string(),
  subject: z.object({
    kind: z.enum(['organism_exposure', 'whole_material', 'isolated_compound']),
    slug: z.string(),
  }),
  steps: z.array(
    z.object({
      id: z.string(),
      order: z.number().int(),
      level: z.enum(['exposure', 'molecular', 'cellular', 'tissue', 'organ_system', 'clinical']),
      title: z.string(),
      description: z.string(),
      targetId: z.string().optional(),
      evidence: evidenceSchema,
    }),
  ),
});

const physiologyRecordSchema = z.object({
  id: z.string(),
  slug: z.string(),
  subject: z.object({
    kind: z.enum(['organism_exposure', 'whole_material', 'isolated_compound']),
    slug: z.string(),
  }),
  anatomicalSystems: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
    }),
  ),
  symptoms: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      evidence: evidenceSchema,
    }),
  ),
  effects: z.array(
    z.object({
      id: z.string(),
      order: z.number().int(),
      anatomicalSystemId: z.string(),
      symptomId: z.string().optional(),
      pathwayType: z.enum(['direct_venom', 'direct_toxin', 'inflammatory_immune', 'systemic_allergic']),
      title: z.string(),
      description: z.string(),
      evidence: evidenceSchema,
    }),
  ),
});

const geographyRecordSchema = z.object({
  id: z.string(),
  slug: z.string(),
  organismSlug: z.string(),
  geographyKind: z.enum(['terrestrial', 'marine']).default('terrestrial'),
  sourceAudit: z.object({
    decision: z.enum(['native_range_supported', 'native_range_not_established', 'native_range_not_meaningful']),
    precision: z.enum(['admin1', 'country', 'macroregion', 'occurrence_only']),
    evidenceIds: z.array(z.string()).min(1),
    citationIds: z.array(z.string()).min(1),
    note: z.string(),
  }),
  distribution: z
    .object({
      tier: z.enum(['occurrence_intersection', 'curated_source']).optional(),
      nativeAdmin1RegionIds: z.array(z.string()).optional(),
      nativeEvidenceIds: z.array(z.string()).optional(),
      nativeScopes: z.array(
        z.object({
          type: z.enum(['country', 'macroregion']),
          id: z.string(),
          evidenceIds: z.array(z.string()),
          confidence: z.enum(['moderate', 'high']),
          note: z.string().optional(),
        }),
      ).optional(),
      sourceRanges: z
        .array(
          z.object({
            layerType: z.enum(['native', 'introduced', 'uncertain']),
            geometryAssetPath: z.string(),
            evidenceIds: z.array(z.string()),
            confidence: z.enum(['high', 'moderate', 'low']),
          }),
        )
        .optional(),
    })
    .optional(),
  ranges: z.array(
    z.object({
      id: z.string(),
      layerType: z.enum([
        'native_range',
        'introduced_range',
        'confirmed_occurrence',
        'marine_evidence_cell',
        'habitat_context',
        'uncertain_range',
      ]),
      geometryAssetPath: z.string().optional(),
      sourceGeometryAssetPath: z.string().optional(),
      summary: z.string(),
      evidence: evidenceSchema,
    }),
  ),
});

const citationFileSchema = z.object({
  citations: z.array(
    z.object({
      id: z.string(),
      slug: z.string(),
      aliases: z.array(z.string()).default([]),
      title: z.string(),
      authors: z.array(z.string()).optional(),
      publisher: z.string().nullable().optional(),
      publicationYear: z.number().nullable().optional(),
      url: z.string().nullable().optional(),
      doi: z.string().nullable().optional(),
      accessedAt: z.string().nullable().optional(),
      visibility: z.enum(['public', 'internal']).optional(),
      sourceType: z.enum([
        'journal_article',
        'database',
        'government',
        'museum',
        'university',
        'book',
        'other',
      ]),
    }),
  ),
});

const mediaFileSchema = z.object({
  media: z.array(
    z.object({
      id: z.string(),
      slug: z.string().optional(),
      kind: z.enum([
        'organism_photo',
        'anatomical_photo',
        'scientific_illustration',
        'molecular_2d',
        'molecular_3d',
        'range_geometry',
      ]),
      localPath: z.string(),
      sourceUrl: z.string().nullable().optional(),
      creator: z.string().nullable().optional(),
      license: z.string().nullable().optional(),
      attributionText: z.string().nullable().optional(),
      citationId: z.string().nullable().optional(),
      redistributionVerified: z.boolean(),
      modificationAllowed: z.boolean().nullable().optional(),
      accessedAt: z.string().nullable().optional(),
      notes: z.string().nullable().optional(),
    }),
  ),
});

type OrganismRecord = z.infer<typeof organismRecordSchema>;
type ToxicMaterialRecord = z.infer<typeof toxicMaterialRecordSchema>;
type ToxinRecord = z.infer<typeof toxinRecordSchema>;
type MechanismRecord = z.infer<typeof mechanismRecordSchema>;
type PhysiologyRecord = z.infer<typeof physiologyRecordSchema>;
type GeographyRecord = z.infer<typeof geographyRecordSchema>;

const readYamlFile = <T extends z.ZodTypeAny>(filePath: string, schema: T): z.infer<T> => {
  const parsed = yaml.load(readFileSync(filePath, 'utf8'));
  return schema.parse(parsed);
};

const readDirectory = (dirName: string): string[] => {
  const absolute = path.join(contentRoot, dirName);
  if (!existsSync(absolute)) {
    return [];
  }

  return readdirSync(absolute)
    .filter((entry) => entry.endsWith('.yaml') || entry.endsWith('.yml'))
    .map((entry) => path.join(absolute, entry));
};

// Audit authored records before bundle mapping can drop IDs, provenance, or orphans.
const contentRecords = {
  organisms: readDirectory('organisms').map((file) => readYamlFile(file, organismRecordSchema)),
  toxicMaterials: readDirectory('toxic-materials').map((file) => readYamlFile(file, toxicMaterialRecordSchema)),
  toxins: readDirectory('toxins').map((file) => readYamlFile(file, toxinRecordSchema)),
  mechanisms: readDirectory('mechanisms').map((file) => readYamlFile(file, mechanismRecordSchema)),
  physiology: readDirectory('physiology').map((file) => readYamlFile(file, physiologyRecordSchema)),
  geography: readDirectory('geography').map((file) => readYamlFile(file, geographyRecordSchema)),
  citations: readDirectory('citations').flatMap((file) => readYamlFile(file, citationFileSchema).citations),
  media: readDirectory('media').flatMap((file) => readYamlFile(file, mediaFileSchema).media),
};

export type ContentRecords = typeof contentRecords;
export const getContentRecords = (): ContentRecords => contentRecords;

export interface OrganismBundle {
  organism: Organism;
  taxonomy: {
    kingdom?: string;
    phylum?: string;
    className?: string;
    order?: string;
    family?: string;
    genus?: string;
    species?: string;
  };
  deliveryMechanism: {
    route:
      | 'sting'
      | 'bite'
      | 'spine'
      | 'spur'
      | 'ingestion'
      | 'contact'
      | 'inhalation'
      | 'production'
      | 'unknown';
    summary: string;
    sequence: string[];
  };
  habitats: Habitat[];
  ecologicalRoles: EcologicalRole[];
  geographyVisualizations: Array<{
    id: string;
    kind: 'external_embed';
    provider: string;
    label: string;
    url: string;
  }>;
  externalProfile?: {
    sourceLabel: string;
    sourceUrl: string;
    summaryPoints: string[];
    imagePaths: string[];
  };
}

export interface ToxicMaterialBundle {
  toxicMaterial: ToxicMaterial;
  components: ToxinComponent[];
}

export interface ToxinBundle {
  toxin: Toxin;
  molecularEntity: MolecularEntity;
  structureAssets: MolecularStructureAsset[];
  targets: MolecularTarget[];
  interactionVisualization?: {
    id: string;
    label: string;
    annotationPath: string;
    structureAssetPath: string;
    structureFormat: 'pdb' | 'mmcif';
    evidence: {
      level: 'experimental' | 'computed' | 'illustrative';
      source: string;
      notes?: string;
    };
  };
}

export interface MechanismBundle {
  subject: {
    kind: 'organism_exposure' | 'whole_material' | 'isolated_compound';
    slug: string;
  };
  steps: MechanismStep[];
}

export interface PhysiologyBundle {
  subject: {
    kind: 'organism_exposure' | 'whole_material' | 'isolated_compound';
    slug: string;
  };
  anatomicalSystems: AnatomicalSystem[];
  symptoms: Symptom[];
  effects: PhysiologicalEffect[];
}

export interface GeographyBundle {
  organismSlug: string;
  geographyKind: 'terrestrial' | 'marine';
  sourceAudit: {
    decision: 'native_range_supported' | 'native_range_not_established' | 'native_range_not_meaningful';
    precision: 'admin1' | 'country' | 'macroregion' | 'occurrence_only';
    evidenceIds: string[];
    citationIds: string[];
    note: string;
  };
  ranges: GeographicRange[];
}

const mapEvidence = (value: z.infer<typeof evidenceSchema>): EvidenceAssessment => value;

const loadOrganismBundles = (): OrganismBundle[] => {
  return contentRecords.organisms.map((record: OrganismRecord) => {
    return {
      organism: {
        id: record.id,
        slug: record.slug,
        scientificName: record.scientificName,
        commonName: record.commonName,
        toxicStrategy: record.toxicStrategy,
        overview: record.overview,
        naturalHistory: record.naturalHistory,
        evidence: mapEvidence(record.evidence),
      },
      taxonomy: {
        kingdom: record.taxonomy.kingdom ?? undefined,
        phylum: record.taxonomy.phylum ?? undefined,
        className: record.taxonomy.className ?? undefined,
        order: record.taxonomy.order ?? undefined,
        family: record.taxonomy.family ?? undefined,
        genus: record.taxonomy.genus ?? undefined,
        species: record.taxonomy.species ?? undefined,
      },
      deliveryMechanism: {
        route: record.deliveryMechanism.route,
        summary: record.deliveryMechanism.summary,
        sequence: record.deliveryMechanism.sequence,
      },
      habitats: record.habitats.map((entry) => ({
        id: entry.id,
        organismId: record.id,
        name: entry.name,
        summary: entry.summary,
        evidence: mapEvidence(record.evidence),
      })),
      ecologicalRoles: record.ecologicalRoles.map((entry) => ({
        id: entry.id,
        organismId: record.id,
        role: entry.role,
        summary: entry.summary,
        evidence: mapEvidence(record.evidence),
      })),
      geographyVisualizations: record.geographyVisualizations,
      externalProfile: record.externalProfile
        ? {
            sourceLabel: record.externalProfile.sourceLabel,
            sourceUrl: record.externalProfile.sourceUrl,
            summaryPoints: record.externalProfile.summaryPoints,
            imagePaths: record.externalProfile.imagePaths,
          }
        : undefined,
    };
  });
};

const loadToxicMaterialBundles = (): ToxicMaterialBundle[] => {
  return contentRecords.toxicMaterials.map((record: ToxicMaterialRecord) => {
    return {
      toxicMaterial: {
        id: record.id,
        slug: record.slug,
        organismId: `org-${record.organismSlug}`,
        biologicalMaterialId: record.biologicalMaterial.id,
        name: record.name,
        description: record.description,
        ecologicalRoleSummary: record.ecologicalRoleSummary,
        materialKind: record.biologicalMaterial.kind,
        featuredToxinSlug: record.featuredToxinSlug,
        evidence: mapEvidence(record.evidence),
      },
      components: record.components.map((entry) => ({
        id: entry.id,
        toxicMaterialId: record.id,
        componentCategory: entry.componentCategory,
        abundanceQualifier: entry.abundanceQualifier,
        summary: entry.summary,
        evidence: mapEvidence(entry.evidence),
      })),
    };
  });
};

const loadToxinBundles = (): ToxinBundle[] => {
  return contentRecords.toxins.map((record: ToxinRecord) => {
    return {
      toxin: {
        id: record.id,
        slug: record.slug,
        toxicMaterialId: record.toxicMaterialId,
        displayName: record.displayName,
        family: record.family,
        notes: record.notes,
        evidence: mapEvidence(record.evidence),
      },
      molecularEntity: {
        id: record.molecularEntity.id,
        toxinId: record.id,
        displayName: record.molecularEntity.displayName,
        molecularClass: record.molecularEntity.molecularClass,
        formula: record.molecularEntity.formula,
        molecularWeight: record.molecularEntity.molecularWeight,
        structureDataSource: record.molecularEntity.structureDataSource,
        evidence: mapEvidence(record.molecularEntity.evidence),
      },
      structureAssets: record.structureAssets.map((entry) => ({
        id: entry.id,
        molecularEntityId: record.molecularEntity.id,
        localPath: entry.localPath,
        format: entry.format,
        sourceDatabase: entry.sourceDatabase ?? undefined,
        sourceIdentifier: entry.sourceIdentifier ?? undefined,
        sourceUrl: entry.sourceUrl ?? undefined,
        citationId: entry.citationId ?? undefined,
        structureStatus: entry.structureStatus,
        verified: entry.verified,
        license: entry.license ?? undefined,
        notes: entry.notes ?? undefined,
      })),
      targets: record.targets.map((entry) => ({
        id: entry.id,
        toxinId: record.id,
        targetName: entry.targetName,
        targetType: entry.targetType,
        summary: entry.summary,
        evidence: mapEvidence(entry.evidence),
      })),
      ...(record.interactionVisualization
        ? {
            interactionVisualization: {
              id: record.interactionVisualization.id,
              label: record.interactionVisualization.label,
              annotationPath: record.interactionVisualization.annotationPath,
              structureAssetPath: record.interactionVisualization.structureAssetPath,
              structureFormat: record.interactionVisualization.structureFormat,
              evidence: {
                level: record.interactionVisualization.evidence.level,
                source: record.interactionVisualization.evidence.source,
                ...(record.interactionVisualization.evidence.notes
                  ? { notes: record.interactionVisualization.evidence.notes }
                  : {}),
              },
            },
          }
        : {}),
    };
  });
};

const loadMechanismBundles = (): MechanismBundle[] => {
  return contentRecords.mechanisms.map((record: MechanismRecord) => {
    return {
      subject: record.subject,
      steps: record.steps
        .map((step) => ({
          id: step.id,
          subject: record.subject,
          order: step.order,
          level: step.level,
          title: step.title,
          description: step.description,
          targetId: step.targetId,
          evidence: mapEvidence(step.evidence),
        }))
        .sort((a, b) => a.order - b.order),
    };
  });
};

const loadPhysiologyBundles = (): PhysiologyBundle[] => {
  return contentRecords.physiology.map((record: PhysiologyRecord) => {
    return {
      subject: record.subject,
      anatomicalSystems: record.anatomicalSystems,
      symptoms: record.symptoms.map((entry) => ({
        id: entry.id,
        name: entry.name,
        description: entry.description,
        evidence: mapEvidence(entry.evidence),
      })),
      effects: record.effects
        .map((entry) => ({
          id: entry.id,
          subject: record.subject,
          anatomicalSystemId: entry.anatomicalSystemId,
          symptomId: entry.symptomId,
          pathwayType: entry.pathwayType,
          title: entry.title,
          description: entry.description,
          order: entry.order,
          evidence: mapEvidence(entry.evidence),
        }))
        .sort((a, b) => a.order - b.order),
    };
  });
};

const loadGeographyBundles = (): GeographyBundle[] => {
  return contentRecords.geography.map((record: GeographyRecord) => {
    return {
      organismSlug: record.organismSlug,
      geographyKind: record.geographyKind,
      sourceAudit: record.sourceAudit,
      ranges: record.ranges.map((entry) => {
        const geometryFeatureCount = entry.geometryAssetPath
          ? (() => {
              const assetPath = path.join(repoRoot, 'apps', 'web', 'public', entry.geometryAssetPath.replace(/^\//, ''));
              const asset = JSON.parse(readFileSync(assetPath, 'utf8')) as { features?: unknown[] };
              return Array.isArray(asset.features) ? asset.features.length : 0;
            })()
          : undefined;

        return {
          id: entry.id,
          organismId: `org-${record.organismSlug}`,
          layerType: entry.layerType,
          geometryAssetId: entry.geometryAssetPath,
          ...(entry.sourceGeometryAssetPath ? { sourceGeometryAssetId: entry.sourceGeometryAssetPath } : {}),
          geometryFeatureCount,
          summary: entry.summary,
          evidence: mapEvidence(entry.evidence),
        };
      }),
    };
  });
};

const loadCitations = (): Citation[] => {
  return contentRecords.citations.map((entry) => ({
      id: entry.id,
      slug: entry.slug,
      aliases: entry.aliases,
      title: entry.title,
      authors: entry.authors,
      publisher: entry.publisher ?? undefined,
      publicationYear: entry.publicationYear ?? undefined,
      url: entry.url ?? undefined,
      doi: entry.doi ?? undefined,
      accessedAt: entry.accessedAt ?? undefined,
      visibility: entry.visibility ?? 'public',
      sourceType: entry.sourceType,
  }));
};

const loadMediaAssets = (): MediaAsset[] => {
  return contentRecords.media.map((entry) => ({
      id: entry.id,
      slug: entry.slug,
      kind: entry.kind,
      localPath: entry.localPath,
      sourceUrl: entry.sourceUrl ?? undefined,
      creator: entry.creator ?? undefined,
      license: entry.license ?? undefined,
      attributionText: entry.attributionText ?? undefined,
      citationId: entry.citationId ?? undefined,
      redistributionVerified: entry.redistributionVerified,
      modificationAllowed: entry.modificationAllowed ?? undefined,
      accessedAt: entry.accessedAt ?? undefined,
      notes: entry.notes ?? undefined,
  }));
};

const cached = {
  organisms: loadOrganismBundles(),
  toxicMaterials: loadToxicMaterialBundles(),
  toxins: loadToxinBundles(),
  mechanisms: loadMechanismBundles(),
  physiology: loadPhysiologyBundles(),
  geography: loadGeographyBundles(),
  citations: loadCitations(),
  mediaAssets: loadMediaAssets(),
};

export const getAllOrganisms = (): OrganismBundle[] => cached.organisms;

export const getOrganismBySlug = (slug: string): OrganismBundle | undefined =>
  cached.organisms.find((entry) => entry.organism.slug === slug);

export const getToxicMaterialByOrganismSlug = (
  organismSlug: string,
): ToxicMaterialBundle | undefined => {
  const organism = getOrganismBySlug(organismSlug);
  if (!organism) {
    return undefined;
  }

  return cached.toxicMaterials.find(
    (entry) => entry.toxicMaterial.organismId === organism.organism.id,
  );
};

export const getAllToxins = (): ToxinBundle[] => cached.toxins;

export const getToxinBySlug = (slug: string): ToxinBundle | undefined =>
  cached.toxins.find((entry) => entry.toxin.slug === slug);

export const getOrganismSlugByToxinSlug = (slug: string): string | undefined => {
  const toxin = getToxinBySlug(slug);
  if (!toxin) {
    return undefined;
  }

  const toxicMaterial = cached.toxicMaterials.find(
    (entry) => entry.toxicMaterial.id === toxin.toxin.toxicMaterialId,
  );
  if (!toxicMaterial) {
    return undefined;
  }

  return cached.organisms.find(
    (entry) => entry.organism.id === toxicMaterial.toxicMaterial.organismId,
  )?.organism.slug;
};

export const getMechanismByToxinSlug = (slug: string): MechanismBundle | undefined =>
  cached.mechanisms.find(
    (entry) => entry.subject.kind === 'isolated_compound' && entry.subject.slug === slug,
  );

export const getPhysiologyByToxinSlug = (slug: string): PhysiologyBundle | undefined =>
  cached.physiology.find(
    (entry) => entry.subject.kind === 'isolated_compound' && entry.subject.slug === slug,
  );

export const getMechanismByOrganismExposureSlug = (slug: string): MechanismBundle | undefined =>
  cached.mechanisms.find(
    (entry) => entry.subject.kind === 'organism_exposure' && entry.subject.slug === slug,
  );

export const getPhysiologyByOrganismExposureSlug = (slug: string): PhysiologyBundle | undefined =>
  cached.physiology.find(
    (entry) => entry.subject.kind === 'organism_exposure' && entry.subject.slug === slug,
  );

export const getAllMechanisms = (): MechanismBundle[] => cached.mechanisms;

export const getAllPhysiology = (): PhysiologyBundle[] => cached.physiology;

export const getGeographyByOrganismSlug = (slug: string): GeographyBundle | undefined =>
  cached.geography.find((entry) => entry.organismSlug === slug);

export const getCitationById = (citationId: string): Citation | undefined =>
  cached.citations.find((entry) => entry.id === citationId);

export const getCitationBySlug = (citationSlug: string): Citation | undefined =>
  cached.citations.find((entry) => entry.slug === citationSlug || entry.aliases?.includes(citationSlug));

export const getCitationsByIds = (citationIds: string[]): Citation[] =>
  citationIds
    .map((citationId) => getCitationById(citationId))
    .filter((entry): entry is Citation => Boolean(entry));

export const getAllCitations = (): Citation[] => cached.citations;

export const getPublicCitations = (): Citation[] =>
  cached.citations.filter((entry) => entry.visibility !== 'internal');

export const getAllMediaAssets = (): MediaAsset[] => cached.mediaAssets;

export const getPublishedMediaAssets = (): MediaAsset[] =>
  cached.mediaAssets.filter((entry) => entry.redistributionVerified);

export const getAllRoutes = (): string[] => {
  return buildRouteInventory(contentRecords);
};

export const getPublicAssetAbsolutePath = (publicPath: string): string =>
  path.join(repoRoot, 'apps', 'web', 'public', publicPath.replace(/^\//, ''));

export const isFileEmpty = (absolutePath: string): boolean => {
  if (!existsSync(absolutePath)) {
    return true;
  }

  const stats = statSync(absolutePath);
  return stats.size <= 2;
};
