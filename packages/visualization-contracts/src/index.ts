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

export type MolecularClass = 'small_molecule' | 'peptide' | 'protein' | 'complex';

export type GeographicLayerType =
  | 'native_range'
  | 'introduced_range'
  | 'confirmed_occurrence'
  | 'habitat_context'
  | 'uncertain_range';

export interface AtlasSelection {
  organismId: string;
  venomId?: string | undefined;
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
