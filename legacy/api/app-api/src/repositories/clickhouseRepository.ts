import type { ClickHouseClient } from '@clickhouse/client';
import type {
  AnatomicalSystem,
  Citation,
  DeliveryMechanism,
  EvidenceAssessment,
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
import type {
  AtlasRepository,
  OrganismDetail,
  ToxinDetail,
  ToxinMechanismDetail,
  ToxinPhysiologyDetail,
  VenomDetail,
} from './types';

interface RowObject {
  [key: string]: unknown;
}

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

const asNullableString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

const asNullableNumber = (value: unknown): number | null =>
  typeof value === 'number' ? value : null;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];

export class ClickHouseAtlasRepository implements AtlasRepository {
  constructor(private readonly client: ClickHouseClient) {}

  private async query<T extends RowObject>(
    query: string,
    query_params?: Record<string, unknown>,
  ): Promise<T[]> {
    const result = await this.client.query({
      query,
      ...(query_params ? { query_params } : {}),
      format: 'JSONEachRow',
    });
    return result.json<T>();
  }

  private async getEvidenceById(id: string): Promise<EvidenceAssessment> {
    const rows = await this.query<RowObject>(
      `SELECT id, confidence, evidence_type, notes, citation_ids
       FROM venom_atlas.evidence_assessments
       WHERE id = {id:String}
       LIMIT 1`,
      { id },
    );

    const row = rows[0];
    if (!row) {
      return {
        id,
        confidence: 'unknown',
        evidenceType: 'editorial_normalization',
        notes: 'Evidence record missing.',
        citationIds: [],
      };
    }

    return {
      id: asString(row.id),
      confidence: (asString(row.confidence) as EvidenceAssessment['confidence']) || 'unknown',
      evidenceType:
        (asString(row.evidence_type) as EvidenceAssessment['evidenceType']) ||
        'editorial_normalization',
      notes: asNullableString(row.notes),
      citationIds: asStringArray(row.citation_ids),
    };
  }

  async health(): Promise<{ ok: boolean; clickhouse: 'up' | 'down'; mode: 'clickhouse' | 'mock' }> {
    try {
      await this.client.query({ query: 'SELECT 1', format: 'JSONEachRow' });
      return { ok: true, clickhouse: 'up', mode: 'clickhouse' };
    } catch {
      return { ok: false, clickhouse: 'down', mode: 'clickhouse' };
    }
  }

  async listOrganisms(): Promise<Organism[]> {
    const rows = await this.query<RowObject>(
      `SELECT id, scientific_name, common_name, overview, natural_history, taxonomy_id, delivery_mechanism_id, evidence_assessment_id
       FROM venom_atlas.organisms
       ORDER BY scientific_name ASC`,
    );

    return Promise.all(
      rows.map(async (row) => ({
        id: asString(row.id),
        scientificName: asString(row.scientific_name),
        commonName: asString(row.common_name),
        overview: asString(row.overview),
        naturalHistory: asStringArray(row.natural_history),
        taxonomyId: asNullableString(row.taxonomy_id),
        deliveryMechanismId: asNullableString(row.delivery_mechanism_id),
        evidence: await this.getEvidenceById(asString(row.evidence_assessment_id)),
      })),
    );
  }

  private async getTaxonomy(organismId: string): Promise<Taxonomy | null> {
    const rows = await this.query<RowObject>(
      `SELECT id, organism_id, kingdom, phylum, class_name, order_name, family, genus, species
       FROM venom_atlas.taxonomy
       WHERE organism_id = {organismId:String}
       LIMIT 1`,
      { organismId },
    );
    const row = rows[0];
    if (!row) {
      return null;
    }
    return {
      id: asString(row.id),
      organismId: asString(row.organism_id),
      kingdom: asNullableString(row.kingdom),
      phylum: asNullableString(row.phylum),
      className: asNullableString(row.class_name),
      order: asNullableString(row.order_name),
      family: asNullableString(row.family),
      genus: asNullableString(row.genus),
      species: asNullableString(row.species),
    };
  }

  private async getDeliveryMechanism(organismId: string): Promise<DeliveryMechanism | null> {
    const rows = await this.query<RowObject>(
      `SELECT id, organism_id, route, summary, sequence, evidence_assessment_id
       FROM venom_atlas.delivery_mechanisms
       WHERE organism_id = {organismId:String}
       LIMIT 1`,
      { organismId },
    );
    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      id: asString(row.id),
      organismId: asString(row.organism_id),
      route: asString(row.route) as DeliveryMechanism['route'],
      summary: asString(row.summary),
      sequence: asStringArray(row.sequence),
      evidence: await this.getEvidenceById(asString(row.evidence_assessment_id)),
    };
  }

  private async getHabitats(organismId: string): Promise<Habitat[]> {
    const rows = await this.query<RowObject>(
      `SELECT id, organism_id, name, summary, evidence_assessment_id
       FROM venom_atlas.habitats
       WHERE organism_id = {organismId:String}`,
      { organismId },
    );

    return Promise.all(
      rows.map(async (row) => ({
        id: asString(row.id),
        organismId: asString(row.organism_id),
        name: asString(row.name),
        summary: asString(row.summary),
        evidence: await this.getEvidenceById(asString(row.evidence_assessment_id)),
      })),
    );
  }

  async getOrganism(organismId: string): Promise<OrganismDetail | null> {
    const rows = await this.query<RowObject>(
      `SELECT id, scientific_name, common_name, overview, natural_history, taxonomy_id, delivery_mechanism_id, evidence_assessment_id
       FROM venom_atlas.organisms
       WHERE id = {organismId:String}
       LIMIT 1`,
      { organismId },
    );
    const row = rows[0];
    if (!row) {
      return null;
    }
    const organism: Organism = {
      id: asString(row.id),
      scientificName: asString(row.scientific_name),
      commonName: asString(row.common_name),
      overview: asString(row.overview),
      naturalHistory: asStringArray(row.natural_history),
      taxonomyId: asNullableString(row.taxonomy_id),
      deliveryMechanismId: asNullableString(row.delivery_mechanism_id),
      evidence: await this.getEvidenceById(asString(row.evidence_assessment_id)),
    };

    return {
      organism,
      taxonomy: await this.getTaxonomy(organismId),
      deliveryMechanism: await this.getDeliveryMechanism(organismId),
      habitats: await this.getHabitats(organismId),
    };
  }

  async getOrganismVenoms(organismId: string): Promise<Venom[]> {
    const rows = await this.query<RowObject>(
      `SELECT id, organism_id, biological_material_id, name, description, ecological_role_summary, evidence_assessment_id
       FROM venom_atlas.venoms
       WHERE organism_id = {organismId:String}`,
      { organismId },
    );
    return Promise.all(
      rows.map(async (row) => ({
        id: asString(row.id),
        organismId: asString(row.organism_id),
        biologicalMaterialId: asString(row.biological_material_id),
        name: asString(row.name),
        description: asString(row.description),
        ecologicalRoleSummary: asString(row.ecological_role_summary),
        evidence: await this.getEvidenceById(asString(row.evidence_assessment_id)),
      })),
    );
  }

  async getVenom(venomId: string): Promise<VenomDetail | null> {
    const venomRows = await this.query<RowObject>(
      `SELECT id, organism_id, biological_material_id, name, description, ecological_role_summary, evidence_assessment_id
       FROM venom_atlas.venoms
       WHERE id = {venomId:String}
       LIMIT 1`,
      { venomId },
    );
    const venomRow = venomRows[0];
    if (!venomRow) {
      return null;
    }

    const venom: Venom = {
      id: asString(venomRow.id),
      organismId: asString(venomRow.organism_id),
      biologicalMaterialId: asString(venomRow.biological_material_id),
      name: asString(venomRow.name),
      description: asString(venomRow.description),
      ecologicalRoleSummary: asString(venomRow.ecological_role_summary),
      evidence: await this.getEvidenceById(asString(venomRow.evidence_assessment_id)),
    };

    const toxinRows = await this.query<RowObject>(
      `SELECT id, venom_id, display_name, family, notes, evidence_assessment_id
       FROM venom_atlas.toxins
       WHERE venom_id = {venomId:String}`,
      { venomId },
    );

    const componentRows = await this.query<RowObject>(
      `SELECT id, venom_id, toxin_id, component_category, abundance_qualifier, summary, evidence_assessment_id
       FROM venom_atlas.venom_components
       WHERE venom_id = {venomId:String}`,
      { venomId },
    );

    const toxins: Toxin[] = await Promise.all(
      toxinRows.map(async (row) => ({
        id: asString(row.id),
        venomId: asString(row.venom_id),
        displayName: asString(row.display_name),
        family: asNullableString(row.family),
        notes: asNullableString(row.notes),
        evidence: await this.getEvidenceById(asString(row.evidence_assessment_id)),
      })),
    );

    const components: ToxinComponent[] = await Promise.all(
      componentRows.map(async (row) => ({
        id: asString(row.id),
        venomId: asString(row.venom_id),
        toxinId: asNullableString(row.toxin_id),
        componentCategory: asString(row.component_category),
        abundanceQualifier: asNullableString(
          row.abundance_qualifier,
        ) as ToxinComponent['abundanceQualifier'],
        summary: asNullableString(row.summary),
        evidence: await this.getEvidenceById(asString(row.evidence_assessment_id)),
      })),
    );

    return { venom, toxins, components };
  }

  async getToxin(toxinId: string): Promise<ToxinDetail | null> {
    const toxinRows = await this.query<RowObject>(
      `SELECT id, venom_id, display_name, family, notes, evidence_assessment_id
       FROM venom_atlas.toxins
       WHERE id = {toxinId:String}
       LIMIT 1`,
      { toxinId },
    );
    const toxinRow = toxinRows[0];
    if (!toxinRow) {
      return null;
    }

    const toxin: Toxin = {
      id: asString(toxinRow.id),
      venomId: asString(toxinRow.venom_id),
      displayName: asString(toxinRow.display_name),
      family: asNullableString(toxinRow.family),
      notes: asNullableString(toxinRow.notes),
      evidence: await this.getEvidenceById(asString(toxinRow.evidence_assessment_id)),
    };

    const entityRows = await this.query<RowObject>(
      `SELECT id, toxin_id, display_name, molecular_class, formula, molecular_weight, structure_data_source, evidence_assessment_id
       FROM venom_atlas.molecular_entities
       WHERE toxin_id = {toxinId:String}
       LIMIT 1`,
      { toxinId },
    );

    const entityRow = entityRows[0];
    const molecularEntity: MolecularEntity | null = entityRow
      ? {
          id: asString(entityRow.id),
          toxinId: asString(entityRow.toxin_id),
          displayName: asString(entityRow.display_name),
          molecularClass: asString(entityRow.molecular_class) as MolecularEntity['molecularClass'],
          formula: (entityRow.formula as string | null) ?? null,
          molecularWeight: asNullableNumber(entityRow.molecular_weight),
          structureDataSource: (entityRow.structure_data_source as string | null) ?? null,
          evidence: await this.getEvidenceById(asString(entityRow.evidence_assessment_id)),
        }
      : null;

    const structureAssets = molecularEntity
      ? await this.query<RowObject>(
          `SELECT id, molecular_entity_id, format, local_path, source_url, citation_id, verified
           FROM venom_atlas.molecular_structure_assets
           WHERE molecular_entity_id = {molecularEntityId:String}`,
          { molecularEntityId: molecularEntity.id },
        )
      : [];

    const mappedStructureAssets: MolecularStructureAsset[] = structureAssets.map((row) => ({
      id: asString(row.id),
      molecularEntityId: asString(row.molecular_entity_id),
      format: asString(row.format) as MolecularStructureAsset['format'],
      localPath: asNullableString(row.local_path),
      sourceUrl: asNullableString(row.source_url),
      citationId: asNullableString(row.citation_id),
      verified: Boolean(row.verified),
    }));

    const targetRows = await this.query<RowObject>(
      `SELECT id, toxin_id, target_name, target_type, summary, evidence_assessment_id
       FROM venom_atlas.molecular_targets
       WHERE toxin_id = {toxinId:String}`,
      { toxinId },
    );

    const targets: MolecularTarget[] = await Promise.all(
      targetRows.map(async (row) => ({
        id: asString(row.id),
        toxinId: asString(row.toxin_id),
        targetName: asString(row.target_name),
        targetType: asString(row.target_type) as MolecularTarget['targetType'],
        summary: asString(row.summary),
        evidence: await this.getEvidenceById(asString(row.evidence_assessment_id)),
      })),
    );

    return {
      toxin,
      molecularEntity,
      structureAssets: mappedStructureAssets,
      targets,
    };
  }

  async getToxinStructure(toxinId: string): Promise<MolecularStructureAsset[] | null> {
    const toxinDetail = await this.getToxin(toxinId);
    if (!toxinDetail) {
      return null;
    }
    return toxinDetail.structureAssets;
  }

  async getToxinMechanism(toxinId: string): Promise<ToxinMechanismDetail | null> {
    const toxinDetail = await this.getToxin(toxinId);
    if (!toxinDetail) {
      return null;
    }

    const stepRows = await this.query<RowObject>(
      `SELECT id, toxin_id, step_order, level, title, description, target_id, evidence_assessment_id
       FROM venom_atlas.mechanism_steps
       WHERE toxin_id = {toxinId:String}
       ORDER BY step_order ASC`,
      { toxinId },
    );

    const mechanismSteps: MechanismStep[] = await Promise.all(
      stepRows.map(async (row) => ({
        id: asString(row.id),
        toxinId: asString(row.toxin_id),
        order: Number(row.step_order),
        level: asString(row.level) as MechanismStep['level'],
        title: asString(row.title),
        description: asString(row.description),
        targetId: asNullableString(row.target_id),
        evidence: await this.getEvidenceById(asString(row.evidence_assessment_id)),
      })),
    );

    return {
      toxin: toxinDetail.toxin,
      mechanismSteps,
      targets: toxinDetail.targets,
    };
  }

  async getToxinPhysiology(toxinId: string): Promise<ToxinPhysiologyDetail | null> {
    const toxinDetail = await this.getToxin(toxinId);
    if (!toxinDetail) {
      return null;
    }

    const effectRows = await this.query<RowObject>(
      `SELECT id, toxin_id, anatomical_system_id, symptom_id, pathway_type, title, description, effect_order, evidence_assessment_id
       FROM venom_atlas.physiological_effects
       WHERE toxin_id = {toxinId:String}
       ORDER BY effect_order ASC`,
      { toxinId },
    );

    const physiologicalEffects: PhysiologicalEffect[] = await Promise.all(
      effectRows.map(async (row) => ({
        id: asString(row.id),
        toxinId: asString(row.toxin_id),
        anatomicalSystemId: asString(row.anatomical_system_id),
        symptomId: asNullableString(row.symptom_id),
        pathwayType: asString(row.pathway_type) as PhysiologicalEffect['pathwayType'],
        title: asString(row.title),
        description: asString(row.description),
        order: Number(row.effect_order),
        evidence: await this.getEvidenceById(asString(row.evidence_assessment_id)),
      })),
    );

    const systemsRows = await this.query<RowObject>(
      `SELECT id, name, description
       FROM venom_atlas.anatomical_systems`,
    );

    const systems: AnatomicalSystem[] = systemsRows.map((row) => ({
      id: asString(row.id),
      name: asString(row.name),
      description: asString(row.description),
    }));

    const referencedIds = new Set(physiologicalEffects.map((effect) => effect.anatomicalSystemId));

    return {
      toxin: toxinDetail.toxin,
      physiologicalEffects,
      anatomicalSystems: systems.filter((system) => referencedIds.has(system.id)),
    };
  }

  async getOrganismRange(organismId: string): Promise<GeographicRange[]> {
    const rows = await this.query<RowObject>(
      `SELECT id, organism_id, layer_type, geometry_asset_id, summary, evidence_assessment_id
       FROM venom_atlas.organism_ranges
       WHERE organism_id = {organismId:String}`,
      { organismId },
    );

    return Promise.all(
      rows.map(async (row) => ({
        id: asString(row.id),
        organismId: asString(row.organism_id),
        layerType: asString(row.layer_type) as GeographicRange['layerType'],
        geometryAssetId: asNullableString(row.geometry_asset_id),
        summary: asString(row.summary),
        evidence: await this.getEvidenceById(asString(row.evidence_assessment_id)),
      })),
    );
  }

  async getCitation(citationId: string): Promise<Citation | null> {
    const rows = await this.query<RowObject>(
      `SELECT id, title, authors, publisher, publication_year, url, doi, accessed_at, source_type
       FROM venom_atlas.citations
       WHERE id = {citationId:String}
       LIMIT 1`,
      { citationId },
    );

    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      id: asString(row.id),
      title: asString(row.title),
      authors: asStringArray(row.authors),
      publisher: asNullableString(row.publisher),
      publicationYear: typeof row.publication_year === 'number' ? row.publication_year : undefined,
      url: asNullableString(row.url),
      doi: asNullableString(row.doi),
      accessedAt: asNullableString(row.accessed_at),
      sourceType: asString(row.source_type) as Citation['sourceType'],
    };
  }
}
