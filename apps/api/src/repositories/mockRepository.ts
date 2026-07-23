import {
  atlasSeedData,
  type AtlasSeedData,
  type Citation,
  type GeographicRange,
  type Organism,
  type Toxin,
  type Venom,
} from '@venom-atlas/domain';
import type {
  AtlasRepository,
  OrganismDetail,
  ToxinDetail,
  ToxinMechanismDetail,
  ToxinPhysiologyDetail,
  VenomDetail,
} from './types';

const sortByOrder = <T extends { order: number }>(items: T[]): T[] =>
  [...items].sort((a, b) => a.order - b.order);

export class MockAtlasRepository implements AtlasRepository {
  private readonly data: AtlasSeedData;

  constructor(seedData: AtlasSeedData = atlasSeedData) {
    this.data = seedData;
  }

  async health(): Promise<{ ok: boolean; clickhouse: 'up' | 'down'; mode: 'clickhouse' | 'mock' }> {
    return { ok: true, clickhouse: 'down', mode: 'mock' };
  }

  async listOrganisms(): Promise<Organism[]> {
    return this.data.organisms;
  }

  async getOrganism(organismId: string): Promise<OrganismDetail | null> {
    const organism = this.data.organisms.find((entry) => entry.id === organismId);
    if (!organism) {
      return null;
    }

    return {
      organism,
      taxonomy: this.data.taxonomy.find((entry) => entry.id === organism.taxonomyId) ?? null,
      deliveryMechanism:
        this.data.deliveryMechanisms.find((entry) => entry.id === organism.deliveryMechanismId) ??
        null,
      habitats: this.data.habitats.filter((entry) => entry.organismId === organismId),
    };
  }

  async getOrganismVenoms(organismId: string): Promise<Venom[]> {
    return this.data.venoms.filter((entry) => entry.organismId === organismId);
  }

  async getVenom(venomId: string): Promise<VenomDetail | null> {
    const venom = this.data.venoms.find((entry) => entry.id === venomId);
    if (!venom) {
      return null;
    }

    return {
      venom,
      toxins: this.data.toxins.filter((entry) => entry.venomId === venomId),
      components: this.data.toxinComponents.filter((entry) => entry.venomId === venomId),
    };
  }

  async getToxin(toxinId: string): Promise<ToxinDetail | null> {
    const toxin = this.data.toxins.find((entry) => entry.id === toxinId);
    if (!toxin) {
      return null;
    }

    return {
      toxin,
      molecularEntity:
        this.data.molecularEntities.find((entry) => entry.toxinId === toxinId) ?? null,
      structureAssets: this.data.molecularStructureAssets.filter((entry) => {
        const entity = this.data.molecularEntities.find(
          (item) => item.id === entry.molecularEntityId,
        );
        return entity?.toxinId === toxinId;
      }),
      targets: this.data.molecularTargets.filter((entry) => entry.toxinId === toxinId),
    };
  }

  async getToxinStructure(toxinId: string) {
    const toxin = this.data.toxins.find((entry) => entry.id === toxinId);
    if (!toxin) {
      return null;
    }
    const molecularEntity = this.data.molecularEntities.find((entry) => entry.toxinId === toxinId);
    if (!molecularEntity) {
      return [];
    }
    return this.data.molecularStructureAssets.filter(
      (entry) => entry.molecularEntityId === molecularEntity.id,
    );
  }

  async getToxinMechanism(toxinId: string): Promise<ToxinMechanismDetail | null> {
    const toxin: Toxin | undefined = this.data.toxins.find((entry) => entry.id === toxinId);
    if (!toxin) {
      return null;
    }

    return {
      toxin,
      mechanismSteps: sortByOrder(
        this.data.mechanismSteps.filter((entry) => entry.toxinId === toxinId),
      ),
      targets: this.data.molecularTargets.filter((entry) => entry.toxinId === toxinId),
    };
  }

  async getToxinPhysiology(toxinId: string): Promise<ToxinPhysiologyDetail | null> {
    const toxin = this.data.toxins.find((entry) => entry.id === toxinId);
    if (!toxin) {
      return null;
    }
    const effects = sortByOrder(
      this.data.physiologicalEffects.filter((entry) => entry.toxinId === toxinId),
    );
    const anatomicalSystemIds = new Set(effects.map((entry) => entry.anatomicalSystemId));

    return {
      toxin,
      physiologicalEffects: effects,
      anatomicalSystems: this.data.anatomicalSystems.filter((entry) =>
        anatomicalSystemIds.has(entry.id),
      ),
    };
  }

  async getOrganismRange(organismId: string): Promise<GeographicRange[]> {
    return this.data.geographicRanges.filter((entry) => entry.organismId === organismId);
  }

  async getCitation(citationId: string): Promise<Citation | null> {
    return this.data.citations.find((entry) => entry.id === citationId) ?? null;
  }
}
