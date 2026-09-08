import { z } from 'zod';

export const citationSchema = z.object({
  id: z.string(),
  slug: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  title: z.string(),
  authors: z.array(z.string()).optional(),
  publisher: z.string().optional(),
  publicationYear: z.number().int().optional(),
  url: z.string().url().optional(),
  doi: z.string().optional(),
  pmid: z.string().regex(/^\d+$/).optional(),
  accession: z.string().trim().min(1).optional(),
  accessedAt: z.string().optional(),
  sourceType: z.enum([
    'journal_article',
    'database',
    'government',
    'museum',
    'university',
    'book',
    'other',
  ]),
});

export const evidenceAssessmentSchema = z.object({
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

export const claimAssertionSchema = z.object({
  id: z.string().trim().min(1),
  claimType: z.enum(['property', 'clinical']),
  label: z.string().trim().min(1),
  value: z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal('number'),
      amount: z.number(),
      unit: z.string().trim().min(1),
    }),
    z.object({
      kind: z.literal('text'),
      text: z.string().trim().min(1),
    }),
    z.object({
      kind: z.literal('unknown'),
      reason: z.enum(['not_reported', 'not_studied', 'insufficient_evidence', 'not_applicable']),
      detail: z.string().trim().min(1).optional(),
    }),
  ]),
  scope: z.object({
    subjectKind: z.enum(['organism_exposure', 'whole_material', 'isolated_compound']),
    subjectSlug: z.string().trim().min(1),
    property: z.string().trim().min(1).optional(),
  }),
  conditions: z.array(z.object({ name: z.string().trim().min(1), value: z.string().trim().min(1) })).default([]),
  applicability: z.object({
    evidenceContext: z.enum(['human_clinical', 'animal', 'in_vitro', 'ex_vivo', 'inference']),
    species: z.string().trim().min(1).optional(),
    model: z.string().trim().min(1).optional(),
    summary: z.string().trim().min(1),
  }),
  sourceLocators: z.array(z.object({
    citationId: z.string().trim().min(1),
    locator: z.string().trim().min(1),
    sourceIdentifier: z.string().trim().min(1).optional(),
    sourceVersionDate: z.string().date().optional(),
  })).min(1),
  provenance: z.object({
    method: z.enum(['manual', 'metadata_import', 'pubchem_import', 'ai_extraction', 'ai_summary']),
    methodVersion: z.string().trim().min(1),
    retrievedAt: z.string().datetime({ offset: true }),
    generatedAt: z.string().datetime({ offset: true }).optional(),
    checkedAt: z.string().datetime({ offset: true }),
    sourceChecksum: z.string().regex(/^sha256:[a-f0-9]{64}$/).optional(),
    model: z.string().trim().min(1).optional(),
    promptVersion: z.string().trim().min(1).optional(),
  }).superRefine((value, context) => {
    if ((value.method === 'ai_extraction' || value.method === 'ai_summary')
      && (!value.generatedAt || !value.model || !value.promptVersion)) {
      context.addIssue({
        code: 'custom',
        message: 'AI-derived assertions require generatedAt, model, and promptVersion.',
      });
    }
  }),
  validation: z.object({
    status: z.enum(['passed', 'failed', 'quarantined']),
    checkedAt: z.string().datetime({ offset: true }),
    checks: z.array(z.string().trim().min(1)).min(1),
  }),
  alternatives: z.array(z.object({
    value: z.string().trim().min(1),
    citationIds: z.array(z.string().trim().min(1)).min(1),
    note: z.string().trim().min(1),
  })).optional(),
});

export const taxonomySchema = z.object({
  id: z.string(),
  organismId: z.string(),
  kingdom: z.string().optional(),
  phylum: z.string().optional(),
  className: z.string().optional(),
  order: z.string().optional(),
  family: z.string().optional(),
  genus: z.string().optional(),
  species: z.string().optional(),
});

export const organismSchema = z.object({
  id: z.string(),
  slug: z.string().optional(),
  scientificName: z.string(),
  commonName: z.string(),
  overview: z.string(),
  naturalHistory: z.array(z.string()),
  taxonomyId: z.string().optional(),
  deliveryMechanismId: z.string().optional(),
  evidence: evidenceAssessmentSchema,
});

export const deliveryMechanismSchema = z.object({
  id: z.string(),
  organismId: z.string(),
  route: z.enum(['sting', 'bite', 'spine', 'spur', 'ingestion', 'contact', 'inhalation', 'unknown']),
  summary: z.string(),
  sequence: z.array(z.string()),
  evidence: evidenceAssessmentSchema,
});

export const biologicalMaterialSchema = z.object({
  id: z.string(),
  organismId: z.string(),
  kind: z.enum(['venom', 'poison', 'secretion', 'isolated_toxin']),
  name: z.string(),
  description: z.string(),
  evidence: evidenceAssessmentSchema,
});

export const toxicMaterialSchema = z.object({
  id: z.string(),
  slug: z.string().optional(),
  organismId: z.string(),
  biologicalMaterialId: z.string(),
  name: z.string(),
  description: z.string(),
  ecologicalRoleSummary: z.string(),
  materialKind: z.enum(['venom', 'poison', 'secretion', 'isolated_toxin']),
  evidence: evidenceAssessmentSchema,
});

export const toxinSchema = z.object({
  id: z.string(),
  slug: z.string().optional(),
  toxicMaterialId: z.string(),
  displayName: z.string(),
  family: z.string().optional(),
  notes: z.string().optional(),
  evidence: evidenceAssessmentSchema,
});

export const toxinComponentSchema = z.object({
  id: z.string(),
  toxicMaterialId: z.string(),
  toxinId: z.string().optional(),
  componentCategory: z.string(),
  abundanceQualifier: z
    .enum(['major', 'moderate', 'minor', 'present', 'not_quantified'])
    .optional(),
  summary: z.string().optional(),
  evidence: evidenceAssessmentSchema,
});

export const molecularIdentitySchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('compound_group'), groupName: z.string().trim().min(1) }),
  z.object({
    kind: z.literal('exact_stereoisomer'),
    stereochemistry: z.string().trim().min(1),
    isomericSmiles: z.string().trim().min(1),
    inchi: z.string().startsWith('InChI='),
    inchiKey: z.string().regex(/^[A-Z]{14}-[A-Z]{10}-[A-Z]$/),
  }),
  z.object({ kind: z.literal('salt'), parentMolecularEntityId: z.string().trim().min(1), saltForm: z.string().trim().min(1) }),
  z.object({ kind: z.literal('protonation_state'), parentMolecularEntityId: z.string().trim().min(1), formalCharge: z.number().int() }),
  z.object({ kind: z.literal('protein_isoform'), accession: z.string().trim().min(1), isoform: z.string().trim().min(1) }),
  z.object({ kind: z.literal('protein_serotype'), accession: z.string().trim().min(1), serotype: z.string().trim().min(1) }),
  z.object({ kind: z.literal('biological_mixture'), components: z.array(z.string().trim().min(1)).min(2) }),
]);

export const compoundOccurrenceSchema = z.object({
  id: z.string().trim().min(1),
  molecularEntityId: z.string().trim().min(1),
  organismSlug: z.string().trim().min(1),
  toxicMaterialId: z.string().trim().min(1),
  relationship: z.enum(['confirmed_component', 'reported_component', 'trace_component', 'not_quantified']),
  summary: z.string().trim().min(1),
  evidence: evidenceAssessmentSchema,
});

export const aiExtractionDraftSchema = z.object({
  label: z.string().trim().min(1),
  text: z.string().trim().min(1),
  conditions: z.array(z.object({ name: z.string().trim().min(1), value: z.string().trim().min(1) })).default([]),
  applicability: z.object({
    evidenceContext: z.enum(['human_clinical', 'animal', 'in_vitro', 'ex_vivo', 'inference']),
    species: z.string().trim().min(1).optional(),
    model: z.string().trim().min(1).optional(),
    summary: z.string().trim().min(1),
  }),
  locator: z.string().trim().min(1),
  alternatives: z.array(z.object({ value: z.string().trim().min(1), note: z.string().trim().min(1) })).optional(),
});

export const molecularEntitySchema = z.object({
  id: z.string(),
  toxinId: z.string(),
  displayName: z.string(),
  molecularClass: z.enum(['small_molecule', 'peptide', 'protein', 'complex']),
  formula: z.string().nullable(),
  molecularWeight: z.number().nullable(),
  structureDataSource: z.string().nullable(),
  identity: molecularIdentitySchema.optional(),
  evidence: evidenceAssessmentSchema,
  assertions: z.array(claimAssertionSchema).default([]),
});

export const molecularStructureAssetSchema = z.object({
  id: z.string(),
  molecularEntityId: z.string(),
  format: z.enum(['sdf', 'mol', 'mol2', 'pdb', 'mmcif', 'svg']),
  localPath: z.string(),
  sourceUrl: z.string().url().optional(),
  sourceDatabase: z.string().optional(),
  sourceIdentifier: z.string().optional(),
  citationId: z.string().optional(),
  structureStatus: z
    .enum(['experimental', 'computed', 'illustrative', 'placeholder'])
    .optional(),
  verified: z.boolean(),
  license: z.string().optional(),
  notes: z.string().optional(),
});

export const molecularTargetSchema = z.object({
  id: z.string(),
  toxinId: z.string(),
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
  evidence: evidenceAssessmentSchema,
});

export const mechanismStepSchema = z.object({
  id: z.string(),
  subject: z.object({
    kind: z.enum(['organism_exposure', 'whole_material', 'isolated_compound']),
    slug: z.string(),
  }),
  order: z.number().int(),
  level: z.enum(['exposure', 'molecular', 'cellular', 'tissue', 'organ_system', 'clinical']),
  title: z.string(),
  description: z.string(),
  targetId: z.string().optional(),
  evidence: evidenceAssessmentSchema,
});

export const anatomicalSystemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
});

export const symptomSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  evidence: evidenceAssessmentSchema,
});

export const physiologicalEffectSchema = z.object({
  id: z.string(),
  subject: z.object({
    kind: z.enum(['organism_exposure', 'whole_material', 'isolated_compound']),
    slug: z.string(),
  }),
  anatomicalSystemId: z.string(),
  symptomId: z.string().optional(),
  pathwayType: z.enum(['direct_venom', 'inflammatory_immune', 'systemic_allergic']),
  title: z.string(),
  description: z.string(),
  order: z.number().int(),
  evidence: evidenceAssessmentSchema,
  assertions: z.array(claimAssertionSchema).default([]),
});

export const geographicRangeSchema = z.object({
  id: z.string(),
  organismId: z.string(),
  layerType: z.enum([
    'native_range',
    'introduced_range',
    'confirmed_occurrence',
    'marine_evidence_cell',
    'habitat_context',
    'uncertain_range',
  ]),
  geometryAssetId: z.string().optional(),
  summary: z.string(),
  evidence: evidenceAssessmentSchema,
});

export const habitatSchema = z.object({
  id: z.string(),
  organismId: z.string(),
  name: z.string(),
  summary: z.string(),
  evidence: evidenceAssessmentSchema,
});

export const ecologicalRoleSchema = z.object({
  id: z.string(),
  organismId: z.string(),
  role: z.string(),
  summary: z.string(),
  evidence: evidenceAssessmentSchema,
});

export const mediaAssetSchema = z.object({
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
  sourceUrl: z.string().url().optional(),
  creator: z.string().optional(),
  license: z.string().optional(),
  attributionText: z.string().optional(),
  citationId: z.string().optional(),
  redistributionVerified: z.boolean(),
  modificationAllowed: z.boolean().optional(),
  accessedAt: z.string().optional(),
  notes: z.string().optional(),
});

export const atlasSeedSchema = z.object({
  citations: z.array(citationSchema),
  evidenceAssessments: z.array(evidenceAssessmentSchema),
  taxonomy: z.array(taxonomySchema),
  organisms: z.array(organismSchema),
  deliveryMechanisms: z.array(deliveryMechanismSchema),
  biologicalMaterials: z.array(biologicalMaterialSchema),
  toxicMaterials: z.array(toxicMaterialSchema),
  toxins: z.array(toxinSchema),
  toxinComponents: z.array(toxinComponentSchema),
  compoundOccurrences: z.array(compoundOccurrenceSchema).default([]),
  molecularEntities: z.array(molecularEntitySchema),
  molecularStructureAssets: z.array(molecularStructureAssetSchema),
  molecularTargets: z.array(molecularTargetSchema),
  mechanismSteps: z.array(mechanismStepSchema),
  anatomicalSystems: z.array(anatomicalSystemSchema),
  symptoms: z.array(symptomSchema),
  physiologicalEffects: z.array(physiologicalEffectSchema),
  geographicRanges: z.array(geographicRangeSchema),
  habitats: z.array(habitatSchema),
  ecologicalRoles: z.array(ecologicalRoleSchema),
  mediaAssets: z.array(mediaAssetSchema),
});

export type AtlasSeed = z.infer<typeof atlasSeedSchema>;
