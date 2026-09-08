export type ConfidenceLevel = 'high' | 'moderate' | 'low' | 'unknown';

export type EvidenceType =
  'experimental' | 'observational' | 'clinical' | 'review' | 'database' | 'editorial_normalization';

export type EvidenceReviewStatus = 'unreviewed' | 'reviewed' | 'needs_review';

export type EvidenceCausalScope = 'organism_exposure' | 'whole_material' | 'isolated_compound';

export interface Citation {
  id: string;
  slug?: string | undefined;
  aliases?: string[] | undefined;
  title: string;
  authors?: string[] | undefined;
  publisher?: string | undefined;
  publicationYear?: number | undefined;
  url?: string | undefined;
  doi?: string | undefined;
  accessedAt?: string | undefined;
  visibility?: 'public' | 'internal' | undefined;
  sourceType:
    'journal_article' | 'database' | 'government' | 'museum' | 'university' | 'book' | 'other';
}

export interface EvidenceAssessment {
  id: string;
  confidence: ConfidenceLevel;
  evidenceType: EvidenceType;
  notes?: string | undefined;
  citationIds: string[];
  reviewedAt?: string | undefined;
  reviewStatus?: EvidenceReviewStatus | undefined;
  causalScope?: EvidenceCausalScope | undefined;
  publicUncertaintyStatement?: string | undefined;
}

export interface Taxonomy {
  id: string;
  organismId: string;
  kingdom?: string | undefined;
  phylum?: string | undefined;
  className?: string | undefined;
  order?: string | undefined;
  family?: string | undefined;
  genus?: string | undefined;
  species?: string | undefined;
}

export type ExposureRoute =
  'sting' | 'bite' | 'spine' | 'spur' | 'ingestion' | 'contact' | 'inhalation' | 'production' | 'unknown';

export type ToxicStrategy = 'venomous' | 'poisonous' | 'both' | 'toxin_producing';

export interface DeliveryMechanism {
  id: string;
  organismId: string;
  route: ExposureRoute;
  summary: string;
  sequence: string[];
  evidence: EvidenceAssessment;
}

export interface Organism {
  id: string;
  slug?: string | undefined;
  scientificName: string;
  commonName: string;
  overview: string;
  naturalHistory: string[];
  toxicStrategy: ToxicStrategy;
  taxonomyId?: string | undefined;
  deliveryMechanismId?: string | undefined;
  evidence: EvidenceAssessment;
}

export type BiologicalMaterialKind = 'venom' | 'poison' | 'secretion' | 'isolated_toxin';

export interface BiologicalMaterial {
  id: string;
  organismId: string;
  kind: BiologicalMaterialKind;
  name: string;
  description: string;
  evidence: EvidenceAssessment;
}

export interface ToxicMaterial {
  id: string;
  slug?: string | undefined;
  organismId: string;
  biologicalMaterialId: string;
  name: string;
  description: string;
  ecologicalRoleSummary: string;
  materialKind: BiologicalMaterialKind;
  featuredToxinSlug?: string | undefined;
  evidence: EvidenceAssessment;
}

export interface Toxin {
  id: string;
  slug?: string | undefined;
  toxicMaterialId: string;
  displayName: string;
  family?: string | undefined;
  notes?: string | undefined;
  evidence: EvidenceAssessment;
}

export interface ToxinComponent {
  id: string;
  toxicMaterialId: string;
  toxinId?: string | undefined;
  componentCategory: string;
  abundanceQualifier?: 'major' | 'moderate' | 'minor' | 'present' | 'not_quantified' | undefined;
  summary?: string | undefined;
  evidence: EvidenceAssessment;
}

export type MolecularClass = 'small_molecule' | 'peptide' | 'protein' | 'complex';

export interface MolecularEntity {
  id: string;
  toxinId: string;
  displayName: string;
  molecularClass: MolecularClass;
  formula: string | null;
  molecularWeight: number | null;
  structureDataSource: string | null;
  evidence: EvidenceAssessment;
}

export interface MolecularStructureAsset {
  id: string;
  molecularEntityId: string;
  localPath: string;
  format: 'sdf' | 'mol' | 'mol2' | 'pdb' | 'mmcif' | 'svg';
  sourceUrl?: string | undefined;
  sourceDatabase?: string | undefined;
  sourceIdentifier?: string | undefined;
  citationId?: string | undefined;
  structureStatus?: 'experimental' | 'computed' | 'illustrative' | 'placeholder' | undefined;
  verified: boolean;
  license?: string | undefined;
  notes?: string | undefined;
}

export interface MolecularTarget {
  id: string;
  toxinId: string;
  targetName: string;
  targetType:
    'receptor' | 'ion_channel' | 'enzyme' | 'membrane' | 'signaling_process' | 'other' | 'unknown';
  summary: string;
  evidence: EvidenceAssessment;
}

export type ScientificSubjectKind = 'organism_exposure' | 'whole_material' | 'isolated_compound';

export interface ScientificSubjectReference {
  kind: ScientificSubjectKind;
  slug: string;
}

export interface MechanismStep {
  id: string;
  subject: ScientificSubjectReference;
  order: number;
  level: 'exposure' | 'molecular' | 'cellular' | 'tissue' | 'organ_system' | 'clinical';
  title: string;
  description: string;
  targetId?: string | undefined;
  evidence: EvidenceAssessment;
}

export interface AnatomicalSystem {
  id: string;
  name: string;
  description: string;
}

export interface Symptom {
  id: string;
  name: string;
  description: string;
  evidence: EvidenceAssessment;
}

export interface PhysiologicalEffect {
  id: string;
  subject: ScientificSubjectReference;
  anatomicalSystemId: string;
  symptomId?: string | undefined;
  pathwayType: 'direct_venom' | 'direct_toxin' | 'inflammatory_immune' | 'systemic_allergic';
  title: string;
  description: string;
  order: number;
  evidence: EvidenceAssessment;
}

export type GeographicLayerType =
  | 'native_range'
  | 'introduced_range'
  | 'confirmed_occurrence'
  | 'marine_evidence_cell'
  | 'habitat_context'
  | 'uncertain_range';

export type DistributionStatus =
  | 'native'
  | 'introduced'
  | 'uncertain'
  | 'recorded_presence';

export interface AdministrativeRegion {
  regionId: string;
  countryCode: string;
  regionCode?: string | undefined;
  regionName: string;
  adminLevel: 1;
  geometryAssetId: string;
  geometryDataset: 'geoBoundaries';
  geometryDatasetVersion: string;
}

export interface DistributionRecord {
  speciesId: string;
  regionId: string;
  distributionStatus: DistributionStatus;
  evidenceIds: string[];
  derivation:
    | 'curated_source'
    | 'occurrence_point_aggregation'
    | 'source_native_admin1'
    | 'source_native_scope_to_admin1'
    | 'expert_review';
  confidence: 'high' | 'moderate' | 'low';
  sourceRecordCount?: number | undefined;
  note?: string | undefined;
}

export interface GeographicRange {
  id: string;
  organismId: string;
  layerType: GeographicLayerType;
  geometryAssetId?: string | undefined;
  sourceGeometryAssetId?: string | undefined;
  geometryFeatureCount?: number | undefined;
  summary: string;
  evidence: EvidenceAssessment;
}

export interface Habitat {
  id: string;
  organismId: string;
  name: string;
  summary: string;
  evidence: EvidenceAssessment;
}

export interface EcologicalRole {
  id: string;
  organismId: string;
  role: string;
  summary: string;
  evidence: EvidenceAssessment;
}

export interface MediaAsset {
  id: string;
  slug?: string | undefined;
  kind:
    | 'organism_photo'
    | 'anatomical_photo'
    | 'scientific_illustration'
    | 'molecular_2d'
    | 'molecular_3d'
    | 'range_geometry';
  localPath: string;
  sourceUrl?: string | undefined;
  creator?: string | undefined;
  license?: string | undefined;
  attributionText?: string | undefined;
  citationId?: string | undefined;
  redistributionVerified: boolean;
  modificationAllowed?: boolean | undefined;
  accessedAt?: string | undefined;
  notes?: string | undefined;
}

export interface AtlasSeedData {
  citations: Citation[];
  evidenceAssessments: EvidenceAssessment[];
  taxonomy: Taxonomy[];
  organisms: Organism[];
  deliveryMechanisms: DeliveryMechanism[];
  biologicalMaterials: BiologicalMaterial[];
  toxicMaterials: ToxicMaterial[];
  toxins: Toxin[];
  toxinComponents: ToxinComponent[];
  molecularEntities: MolecularEntity[];
  molecularStructureAssets: MolecularStructureAsset[];
  molecularTargets: MolecularTarget[];
  mechanismSteps: MechanismStep[];
  anatomicalSystems: AnatomicalSystem[];
  symptoms: Symptom[];
  physiologicalEffects: PhysiologicalEffect[];
  geographicRanges: GeographicRange[];
  habitats: Habitat[];
  ecologicalRoles: EcologicalRole[];
  mediaAssets: MediaAsset[];
}
