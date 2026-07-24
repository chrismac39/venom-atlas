import { atlasSeedData } from '@venom-atlas/domain';
import type {
  AtlasApi,
  OrganismDetail,
  ToxinDetail,
  ToxinMechanismDetail,
  ToxinPhysiologyDetail,
  VenomDetail,
} from './contracts';

const ensure = <T>(value: T | undefined | null, label: string): T => {
  if (!value) {
    throw new Error(`${label} missing in mock dataset.`);
  }
  return value;
};

export const mockApi: AtlasApi = {
  async listOrganisms() {
    return atlasSeedData.organisms;
  },
  async getOrganism(organismId) {
    const organism = ensure(
      atlasSeedData.organisms.find((entry) => entry.id === organismId),
      'Organism',
    );
    const result: OrganismDetail = {
      organism,
      taxonomy: atlasSeedData.taxonomy.find((entry) => entry.id === organism.taxonomyId) ?? null,
      deliveryMechanism:
        atlasSeedData.deliveryMechanisms.find(
          (entry) => entry.id === organism.deliveryMechanismId,
        ) ?? null,
      habitats: atlasSeedData.habitats.filter((entry) => entry.organismId === organismId),
    };
    return result;
  },
  async getOrganismVenoms(organismId) {
    return atlasSeedData.venoms.filter((entry) => entry.organismId === organismId);
  },
  async getVenom(venomId) {
    const venom = ensure(
      atlasSeedData.venoms.find((entry) => entry.id === venomId),
      'Venom',
    );
    const result: VenomDetail = {
      venom,
      toxins: atlasSeedData.toxins.filter((entry) => entry.venomId === venomId),
      components: atlasSeedData.toxinComponents.filter((entry) => entry.venomId === venomId),
    };
    return result;
  },
  async getToxin(toxinId) {
    const toxin = ensure(
      atlasSeedData.toxins.find((entry) => entry.id === toxinId),
      'Toxin',
    );
    const molecularEntity =
      atlasSeedData.molecularEntities.find((entry) => entry.toxinId === toxinId) ?? null;
    const result: ToxinDetail = {
      toxin,
      molecularEntity,
      structureAssets: molecularEntity
        ? atlasSeedData.molecularStructureAssets.filter(
            (entry) => entry.molecularEntityId === molecularEntity.id,
          )
        : [],
      targets: atlasSeedData.molecularTargets.filter((entry) => entry.toxinId === toxinId),
    };
    return result;
  },
  async getToxinMechanism(toxinId) {
    const toxin = ensure(
      atlasSeedData.toxins.find((entry) => entry.id === toxinId),
      'Toxin',
    );
    const result: ToxinMechanismDetail = {
      toxin,
      mechanismSteps: atlasSeedData.mechanismSteps
        .filter((entry) => entry.toxinId === toxinId)
        .sort((a, b) => a.order - b.order),
      targets: atlasSeedData.molecularTargets.filter((entry) => entry.toxinId === toxinId),
    };
    return result;
  },
  async getToxinPhysiology(toxinId) {
    const toxin = ensure(
      atlasSeedData.toxins.find((entry) => entry.id === toxinId),
      'Toxin',
    );
    const physiologicalEffects = atlasSeedData.physiologicalEffects
      .filter((entry) => entry.toxinId === toxinId)
      .sort((a, b) => a.order - b.order);
    const referenced = new Set(physiologicalEffects.map((entry) => entry.anatomicalSystemId));
    const result: ToxinPhysiologyDetail = {
      toxin,
      physiologicalEffects,
      anatomicalSystems: atlasSeedData.anatomicalSystems.filter((entry) =>
        referenced.has(entry.id),
      ),
    };
    return result;
  },
  async getOrganismRange(organismId) {
    return atlasSeedData.geographicRanges.filter((entry) => entry.organismId === organismId);
  },
  async getCitation(citationId) {
    return ensure(
      atlasSeedData.citations.find((entry) => entry.id === citationId),
      `Citation ${citationId}`,
    );
  },
};
