CREATE DATABASE IF NOT EXISTS venom_atlas;

CREATE TABLE IF NOT EXISTS venom_atlas.citations (
  id String,
  title String,
  authors Array(String),
  publisher Nullable(String),
  publication_year Nullable(UInt16),
  url Nullable(String),
  doi Nullable(String),
  accessed_at Nullable(Date),
  source_type LowCardinality(String),
  created_at DateTime DEFAULT now(),
  updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY id;

CREATE TABLE IF NOT EXISTS venom_atlas.evidence_assessments (
  id String,
  confidence LowCardinality(String),
  evidence_type LowCardinality(String),
  notes Nullable(String),
  citation_ids Array(String),
  created_at DateTime DEFAULT now(),
  updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY id;

CREATE TABLE IF NOT EXISTS venom_atlas.organisms (
  id String,
  scientific_name String,
  common_name String,
  overview String,
  natural_history Array(String),
  taxonomy_id Nullable(String),
  delivery_mechanism_id Nullable(String),
  evidence_assessment_id String,
  created_at DateTime DEFAULT now(),
  updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY id;

CREATE TABLE IF NOT EXISTS venom_atlas.taxonomy (
  id String,
  organism_id String,
  kingdom Nullable(String),
  phylum Nullable(String),
  class_name Nullable(String),
  order_name Nullable(String),
  family Nullable(String),
  genus Nullable(String),
  species Nullable(String),
  created_at DateTime DEFAULT now(),
  updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY id;

CREATE TABLE IF NOT EXISTS venom_atlas.delivery_mechanisms (
  id String,
  organism_id String,
  route LowCardinality(String),
  summary String,
  sequence Array(String),
  evidence_assessment_id String,
  created_at DateTime DEFAULT now(),
  updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY id;

CREATE TABLE IF NOT EXISTS venom_atlas.biological_materials (
  id String,
  organism_id String,
  kind LowCardinality(String),
  name String,
  description String,
  evidence_assessment_id String,
  created_at DateTime DEFAULT now(),
  updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY id;

CREATE TABLE IF NOT EXISTS venom_atlas.venoms (
  id String,
  organism_id String,
  biological_material_id String,
  name String,
  description String,
  ecological_role_summary String,
  evidence_assessment_id String,
  created_at DateTime DEFAULT now(),
  updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY id;

CREATE TABLE IF NOT EXISTS venom_atlas.toxins (
  id String,
  venom_id String,
  display_name String,
  family Nullable(String),
  notes Nullable(String),
  evidence_assessment_id String,
  created_at DateTime DEFAULT now(),
  updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY id;

CREATE TABLE IF NOT EXISTS venom_atlas.venom_components (
  id String,
  venom_id String,
  toxin_id Nullable(String),
  component_category String,
  abundance_qualifier Nullable(String),
  summary Nullable(String),
  evidence_assessment_id String,
  created_at DateTime DEFAULT now(),
  updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY id;

CREATE TABLE IF NOT EXISTS venom_atlas.molecular_entities (
  id String,
  toxin_id String,
  display_name String,
  molecular_class LowCardinality(String),
  formula Nullable(String),
  molecular_weight Nullable(Float64),
  structure_data_source Nullable(String),
  evidence_assessment_id String,
  created_at DateTime DEFAULT now(),
  updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY id;

CREATE TABLE IF NOT EXISTS venom_atlas.molecular_structure_assets (
  id String,
  molecular_entity_id String,
  format LowCardinality(String),
  local_path Nullable(String),
  source_url Nullable(String),
  citation_id Nullable(String),
  verified Bool,
  created_at DateTime DEFAULT now(),
  updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY id;

CREATE TABLE IF NOT EXISTS venom_atlas.molecular_targets (
  id String,
  toxin_id String,
  target_name String,
  target_type LowCardinality(String),
  summary String,
  evidence_assessment_id String,
  created_at DateTime DEFAULT now(),
  updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY id;

CREATE TABLE IF NOT EXISTS venom_atlas.mechanism_steps (
  id String,
  toxin_id String,
  step_order UInt8,
  level LowCardinality(String),
  title String,
  description String,
  target_id Nullable(String),
  evidence_assessment_id String,
  created_at DateTime DEFAULT now(),
  updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (toxin_id, step_order, id);

CREATE TABLE IF NOT EXISTS venom_atlas.anatomical_systems (
  id String,
  name String,
  description String,
  created_at DateTime DEFAULT now(),
  updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY id;

CREATE TABLE IF NOT EXISTS venom_atlas.symptoms (
  id String,
  name String,
  description String,
  evidence_assessment_id String,
  created_at DateTime DEFAULT now(),
  updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY id;

CREATE TABLE IF NOT EXISTS venom_atlas.physiological_effects (
  id String,
  toxin_id String,
  anatomical_system_id String,
  symptom_id Nullable(String),
  pathway_type LowCardinality(String),
  title String,
  description String,
  effect_order UInt8,
  evidence_assessment_id String,
  created_at DateTime DEFAULT now(),
  updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (toxin_id, effect_order, id);

CREATE TABLE IF NOT EXISTS venom_atlas.organism_ranges (
  id String,
  organism_id String,
  layer_type LowCardinality(String),
  geometry_asset_id Nullable(String),
  summary String,
  evidence_assessment_id String,
  created_at DateTime DEFAULT now(),
  updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY id;

CREATE TABLE IF NOT EXISTS venom_atlas.habitats (
  id String,
  organism_id String,
  name String,
  summary String,
  evidence_assessment_id String,
  created_at DateTime DEFAULT now(),
  updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY id;

CREATE TABLE IF NOT EXISTS venom_atlas.ecological_roles (
  id String,
  organism_id String,
  role String,
  summary String,
  evidence_assessment_id String,
  created_at DateTime DEFAULT now(),
  updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY id;

CREATE TABLE IF NOT EXISTS venom_atlas.media_assets (
  id String,
  kind LowCardinality(String),
  local_path Nullable(String),
  source_url Nullable(String),
  creator Nullable(String),
  license Nullable(String),
  attribution_text Nullable(String),
  citation_id Nullable(String),
  verified Bool,
  created_at DateTime DEFAULT now(),
  updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY id;

CREATE TABLE IF NOT EXISTS venom_atlas.entity_citations (
  id String,
  entity_type LowCardinality(String),
  entity_id String,
  citation_id String,
  created_at DateTime DEFAULT now(),
  updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (entity_type, entity_id, citation_id);
