export type MolecularRepresentation =
  | 'two_dimensional_skeletal'
  | 'ball_and_stick'
  | 'stick'
  | 'space_filling'
  | 'molecular_surface'
  | 'electrostatic_surface'
  | 'ribbon'
  | 'cartoon'
  | 'amino_acid_sequence'
  | 'target_complex';

export type MolecularSurfaceKind = 'ses' | 'sas' | 'vdw' | 'gaussian';

export type MolecularSurfaceColorMode =
  | 'element'
  | 'uniform'
  | 'hydrophobicity'
  | 'electrostatic';

export type StructureEvidenceLevel = 'experimental' | 'computed' | 'illustrative';

export type InteractionContactType =
  | 'hydrogen_bond'
  | 'ionic'
  | 'hydrophobic'
  | 'contact'
  | 'other';

export interface InteractionResidueRef {
  chain: string;
  residueName: string;
  residueNumber: number;
}

export interface InteractionCameraPreset {
  id: string;
  label: string;
  description?: string | undefined;
  selection?: Record<string, unknown> | undefined;
}

export interface StructureInteractionAnnotation {
  id: string;
  label: string;
  target: {
    name: string;
    structureId: string;
    chains: string[];
  };
  venomComponent: {
    name: string;
    chains: string[];
  };
  evidence: {
    level: StructureEvidenceLevel;
    source: string;
    notes?: string | undefined;
  };
  ions?: Array<{
    element: string;
    chain?: string | undefined;
    residueNumber?: number | undefined;
    label?: string | undefined;
  }>;
  interactions: Array<{
    id: string;
    type: InteractionContactType;
    toxinResidue: InteractionResidueRef;
    targetResidue: InteractionResidueRef;
    distanceAngstroms?: number | undefined;
    evidenceNote?: string | undefined;
  }>;
  cameraPresets: InteractionCameraPreset[];
  electrostaticPotential?: {
    localPath: string;
    format: 'dx' | 'cube';
    notes?: string | undefined;
  } | undefined;
}

export type MolecularClass = 'small_molecule' | 'peptide' | 'protein' | 'complex';

export type GeographicLayerType =
  | 'native_range'
  | 'introduced_range'
  | 'confirmed_occurrence'
  | 'marine_evidence_cell'
  | 'habitat_context'
  | 'uncertain_range';

export interface AtlasSelection {
  organismId: string;
  toxicMaterialId?: string | undefined;
  toxinId?: string | undefined;
  molecularRepresentation?: MolecularRepresentation | undefined;
  mechanismStepId?: string | undefined;
  anatomicalSystemId?: string | undefined;
  geographicLayer?: GeographicLayerType | undefined;
}

export interface MolecularAnnotation {
  id: string;
  label: string;
  description: string;
}

export interface MoleculeRenderModel {
  entityId: string;
  displayName: string;
  molecularClass: MolecularClass;
  structureFormat?: 'sdf' | 'mol' | 'mol2' | 'pdb' | 'mmcif' | undefined;
  structureUrl?: string | undefined;
  defaultRepresentation: MolecularRepresentation;
  supportedRepresentations: MolecularRepresentation[];
  atomColorScheme?: 'cpk' | 'element' | 'custom' | undefined;
  annotations: MolecularAnnotation[];
}

export interface MolecularRenderOptions {
  representation?: MolecularRepresentation;
  backgroundColor?: string;
  surface?: {
    enabled: boolean;
    kind: MolecularSurfaceKind;
    opacity: number;
    colorMode: MolecularSurfaceColorMode;
    uniformColor?: string | undefined;
  };
  interactionView?: {
    annotation?: StructureInteractionAnnotation | undefined;
    selectedPresetId?: string | undefined;
    showResidueLabels?: boolean | undefined;
    showContactHighlights?: boolean | undefined;
  };
}

export interface MolecularRendererHandle {
  update(model: MoleculeRenderModel, options?: MolecularRenderOptions): Promise<void>;
  resize(): void;
  dispose(): void;
}

export interface MolecularRendererAdapter {
  readonly rendererId: string;
  supports(model: MoleculeRenderModel): boolean;
  mount(
    container: HTMLElement,
    model: MoleculeRenderModel,
    options?: MolecularRenderOptions,
  ): Promise<MolecularRendererHandle>;
}

export interface AnatomyHighlight {
  systemId: string;
  intensity: 'primary' | 'secondary' | 'context';
  label: string;
  explanation: string;
}
