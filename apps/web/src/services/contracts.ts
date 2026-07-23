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

export interface ApiEnvelope<T> {
  data: T;
  meta?: {
    generatedAt: string;
  };
}

export interface AtlasApi {
  listOrganisms(): Promise<Organism[]>;
  getOrganism(organismId: string): Promise<OrganismDetail>;
  getOrganismVenoms(organismId: string): Promise<Venom[]>;
  getVenom(venomId: string): Promise<VenomDetail>;
  getToxin(toxinId: string): Promise<ToxinDetail>;
  getToxinMechanism(toxinId: string): Promise<ToxinMechanismDetail>;
  getToxinPhysiology(toxinId: string): Promise<ToxinPhysiologyDetail>;
  getOrganismRange(organismId: string): Promise<GeographicRange[]>;
  getCitation(citationId: string): Promise<Citation>;
}
