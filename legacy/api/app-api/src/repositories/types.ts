import type {
  AnatomicalSystem,
  Citation,
  DeliveryMechanism,
  GeographicRange,
  Habitat,
  MechanismStep,
  MolecularEntity,
  MolecularStructureAsset,
  MolecularTarget,
  Organism,
  PhysiologicalEffect,
  Taxonomy,
  Toxin,
  ToxinComponent,
  Venom,
} from '@venom-atlas/domain';

export interface OrganismDetail {
  organism: Organism;
  taxonomy: Taxonomy | null;
  deliveryMechanism: DeliveryMechanism | null;
  habitats: Habitat[];
}

export interface VenomDetail {
  venom: Venom;
  toxins: Toxin[];
  components: ToxinComponent[];
}

export interface ToxinDetail {
  toxin: Toxin;
  molecularEntity: MolecularEntity | null;
  structureAssets: MolecularStructureAsset[];
  targets: MolecularTarget[];
}

export interface ToxinMechanismDetail {
  toxin: Toxin;
  mechanismSteps: MechanismStep[];
  targets: MolecularTarget[];
}

export interface ToxinPhysiologyDetail {
  toxin: Toxin;
  physiologicalEffects: PhysiologicalEffect[];
  anatomicalSystems: AnatomicalSystem[];
}

export interface AtlasRepository {
  health(): Promise<{ ok: boolean; clickhouse: 'up' | 'down'; mode: 'clickhouse' | 'mock' }>;
  listOrganisms(): Promise<Organism[]>;
  getOrganism(organismId: string): Promise<OrganismDetail | null>;
  getOrganismVenoms(organismId: string): Promise<Venom[]>;
  getVenom(venomId: string): Promise<VenomDetail | null>;
  getToxin(toxinId: string): Promise<ToxinDetail | null>;
  getToxinStructure(toxinId: string): Promise<MolecularStructureAsset[] | null>;
  getToxinMechanism(toxinId: string): Promise<ToxinMechanismDetail | null>;
  getToxinPhysiology(toxinId: string): Promise<ToxinPhysiologyDetail | null>;
  getOrganismRange(organismId: string): Promise<GeographicRange[]>;
  getCitation(citationId: string): Promise<Citation | null>;
}
