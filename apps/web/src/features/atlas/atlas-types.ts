import type { Citation, EvidenceAssessment, MechanismStep, ToxinComponent } from '@venom-atlas/domain';
import type { MoleculeRenderModel } from '../../molecular/types';

export interface GeographyVisualization {
  id: string;
  kind: 'external_embed';
  provider: string;
  label: string;
  url: string;
}

export interface AtlasOrganismData {
  slug: string;
  scientificName: string;
  commonName: string;
  toxicStrategy: 'venomous' | 'poisonous' | 'both';
  overview: string;
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
  };
  habitats: Array<{ id: string; name: string; summary: string }>;
  ecologicalRoles: Array<{ id: string; role: string; summary: string }>;
  geographyRanges: Array<{
    id: string;
    layerType: string;
    summary: string;
    geometryAssetId?: string;
    geometryFeatureCount?: number;
  }>;
  toxicMaterial: {
    slug: string;
    name: string;
    description: string;
    ecologicalRoleSummary: string;
    materialKind: 'venom' | 'poison' | 'secretion' | 'isolated_toxin';
    evidence: EvidenceAssessment;
    components: ToxinComponent[];
  } | null;
  coverage: {
    identity: 'available';
    geography: 'available' | 'missing';
    toxicMaterial: 'available' | 'missing';
    chemistry: 'available' | 'missing';
    physiology: 'available' | 'missing';
    media: 'available' | 'missing';
  };
  toxins: Array<{
    id: string;
    slug: string;
    displayName: string;
    family?: string;
    molecularClass: MoleculeRenderModel['molecularClass'];
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
  mechanismSteps: MechanismStep[];
  physiology: {
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
      pathwayType: 'direct_venom' | 'inflammatory_immune' | 'systemic_allergic';
      anatomicalSystemId: string;
      evidence: EvidenceAssessment;
      citations: Citation[];
    }>;
  } | null;
  citations: Citation[];
}