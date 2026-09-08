import type { ClaimAssertion, Citation, EvidenceAssessment, MechanismStep, ToxinComponent } from '@venom-atlas/domain';
import type { MoleculeRenderModel } from '../../molecular/types';

export interface AtlasProvenance {
  evidence: EvidenceAssessment;
  citations: Citation[];
}

export type AtlasClaimAssertion = ClaimAssertion & { citations: Citation[] };

export type AtlasMechanismStep = MechanismStep & {
  subject: { kind: 'organism_exposure' | 'whole_material' | 'isolated_compound'; slug: string };
  provenance: AtlasProvenance;
};

export const atlasSections = [
  { id: 'section-summary', title: 'Summary' },
  { id: 'section-geography', title: 'Geography' },
  { id: 'section-chemistry', title: 'Chemistry' },
  { id: 'section-medical-effects', title: 'Medical Effects' },
] as const;

export type AtlasSectionId = (typeof atlasSections)[number]['id'];

export interface GeographyVisualization {
  id: string;
  kind: 'external_embed';
  provider: string;
  label: string;
  url: string;
}

export interface AtlasOrganismData {
  slug: string;
  publication?: {
    eligible: boolean;
    incompleteSections: Array<'summary' | 'geography' | 'chemistry' | 'medical-effects'>;
  };
  scientificName: string;
  commonName: string;
  toxicStrategy: 'venomous' | 'poisonous' | 'both' | 'toxin_producing';
  overview: string;
  provenance: AtlasProvenance;
  taxonomy: {
    kingdom?: string;
    phylum?: string;
    className?: string;
    order?: string;
    family?: string;
    genus?: string;
    species?: string;
  };
  naturalHistory: string[];
  externalProfile?: {
    sourceLabel: string;
    sourceUrl: string;
    summaryPoints: string[];
  };
  geographyVisualizations: GeographyVisualization[];
  deliveryMechanism: {
    route: string;
    summary: string;
    sequence: string[];
    provenance: AtlasProvenance;
  };
  habitats: Array<{ id: string; name: string; summary: string; provenance: AtlasProvenance }>;
  ecologicalRoles: Array<{ id: string; role: string; summary: string; provenance: AtlasProvenance }>;
  geographyRanges: Array<{
    id: string;
    layerType: string;
    summary: string;
    provenance: AtlasProvenance;
    geometryAssetId?: string;
    sourceGeometryAssetId?: string;
    geometryFeatureCount?: number;
  }>;
  geographySourceAudit: {
    decision: 'native_range_supported' | 'native_range_not_established' | 'native_range_not_meaningful';
    precision: 'admin1' | 'country' | 'macroregion' | 'occurrence_only';
    evidenceIds: string[];
    citationIds: string[];
    note: string;
    citations: Citation[];
  } | null;
  geographyKind: 'terrestrial' | 'marine';
  toxicMaterial: {
    slug: string;
    name: string;
    description: string;
    ecologicalRoleSummary: string;
    materialKind: 'venom' | 'poison' | 'secretion' | 'isolated_toxin';
    evidence: EvidenceAssessment;
    provenance: AtlasProvenance;
    components: Array<ToxinComponent & { provenance: AtlasProvenance }>;
  } | null;
  coverage: {
    identity: 'available';
    geography: 'available' | 'missing';
    toxicMaterial: 'available' | 'missing';
    chemistry: 'available' | 'missing';
    structures: 'available' | 'missing';
    physiology: 'available' | 'missing';
    media: 'available' | 'missing';
  };
  toxins: Array<{
    id: string;
    slug: string;
    displayName: string;
    family?: string;
    notes?: string;
    provenance: AtlasProvenance;
    identityProvenance: AtlasProvenance;
    assertions: AtlasClaimAssertion[];
    targets: Array<{ id: string; targetName: string; summary: string; provenance: AtlasProvenance }>;
    mechanismSteps: AtlasMechanismStep[];
    structureSources: Array<{
      id: string;
      format: string;
      status: string;
      sourceUrl?: string;
      citations: Citation[];
    }>;
    molecularClass: MoleculeRenderModel['molecularClass'];
    identity?: import('@venom-atlas/domain').MolecularIdentity;
    occurrences: Array<{
      id: string;
      organismSlug: string;
      toxicMaterialId: string;
      relationship: string;
      summary: string;
      provenance: AtlasProvenance;
    }>;
    formula: string | null;
    molecularWeight: number | null;
    structureDataSource: string | null;
    structure3dUrl?: string;
    structure3dFormat?: 'sdf' | 'mol' | 'mol2' | 'pdb' | 'mmcif';
    structure2dUrl?: string;
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
    evidence: {
      confidence: EvidenceAssessment['confidence'];
      evidenceType: EvidenceAssessment['evidenceType'];
      id: string;
      citationIds: string[];
      notes?: string;
    };
    citations: Citation[];
  }>;
  featuredToxin: {
    slug: string;
    displayName: string;
    molecularClass: MoleculeRenderModel['molecularClass'];
    formula: string | null;
    molecularWeight: number | null;
    structureDataSource: string | null;
    evidence: {
      confidence: EvidenceAssessment['confidence'];
      evidenceType: EvidenceAssessment['evidenceType'];
      id: string;
      citationIds: string[];
      notes?: string;
    };
    structureUrl?: string;
    structureFormat?: 'sdf' | 'mol' | 'mol2' | 'pdb' | 'mmcif';
  } | null;
  mechanismSteps: AtlasMechanismStep[];
  physiology: {
    applicability?: { scope: 'human' | 'non_human'; summary: string };
    anatomicalSystems: Array<{ id: string; name: string; description: string }>;
    symptoms: Array<{
      id: string;
      name: string;
      description: string;
      evidence: EvidenceAssessment;
      citations: Citation[];
    }>;
    effects: Array<{
      id: string;
      order: number;
      title: string;
      description: string;
      pathwayType: 'direct_venom' | 'direct_toxin' | 'inflammatory_immune' | 'systemic_allergic';
      anatomicalSystemId: string;
      evidence: EvidenceAssessment;
      citations: Citation[];
      assertions: AtlasClaimAssertion[];
    }>;
  } | null;
  citations: Citation[];
}