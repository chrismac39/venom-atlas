TRUNCATE TABLE venom_atlas.entity_citations;
TRUNCATE TABLE venom_atlas.media_assets;
TRUNCATE TABLE venom_atlas.ecological_roles;
TRUNCATE TABLE venom_atlas.habitats;
TRUNCATE TABLE venom_atlas.organism_ranges;
TRUNCATE TABLE venom_atlas.physiological_effects;
TRUNCATE TABLE venom_atlas.symptoms;
TRUNCATE TABLE venom_atlas.anatomical_systems;
TRUNCATE TABLE venom_atlas.mechanism_steps;
TRUNCATE TABLE venom_atlas.molecular_targets;
TRUNCATE TABLE venom_atlas.molecular_structure_assets;
TRUNCATE TABLE venom_atlas.molecular_entities;
TRUNCATE TABLE venom_atlas.venom_components;
TRUNCATE TABLE venom_atlas.toxins;
TRUNCATE TABLE venom_atlas.venoms;
TRUNCATE TABLE venom_atlas.biological_materials;
TRUNCATE TABLE venom_atlas.organisms;
TRUNCATE TABLE venom_atlas.delivery_mechanisms;
TRUNCATE TABLE venom_atlas.taxonomy;
TRUNCATE TABLE venom_atlas.evidence_assessments;
TRUNCATE TABLE venom_atlas.citations;

INSERT INTO venom_atlas.citations (id, title, authors, publisher, publication_year, url, doi, accessed_at, source_type)
VALUES
('cit-fire-ant-review-2007', 'The Fire Ants (Solenopsis) in Perspective', ['W. R. Tschinkel'], 'Harvard University Press', 2006, NULL, NULL, NULL, 'book'),
('cit-cdc-fire-ant-stings', 'Imported Fire Ants', [], 'CDC', NULL, 'https://www.cdc.gov/niosh/topics/fireants/default.html', NULL, '2026-07-23', 'government'),
('cit-poison-control-fire-ant', 'Fire Ant Stings', [], 'Poison Control', NULL, 'https://www.poison.org/articles/fire-ant-stings-201', NULL, '2026-07-23', 'other'),
('cit-antwiki-sinvicta', 'Solenopsis invicta', [], 'AntWiki', NULL, 'https://www.antwiki.org/wiki/Solenopsis_invicta', NULL, '2026-07-23', 'database'),
('cit-editorial-placeholder', 'Editorial normalization for scaffold continuity', [], NULL, NULL, NULL, NULL, NULL, 'other');

INSERT INTO venom_atlas.evidence_assessments (id, confidence, evidence_type, notes, citation_ids)
VALUES
('ev-taxonomy', 'moderate', 'database', NULL, ['cit-antwiki-sinvicta']),
('ev-delivery-sequence', 'moderate', 'review', 'Delivery sequence is simplified schematic for educational purposes.', ['cit-fire-ant-review-2007', 'cit-antwiki-sinvicta']),
('ev-venom-mixture', 'moderate', 'review', NULL, ['cit-fire-ant-review-2007']),
('ev-solenopsin-feature', 'low', 'editorial_normalization', 'Featured representative compound. Quantitation and exact composition pending.', ['cit-editorial-placeholder']),
('ev-local-clinical', 'moderate', 'clinical', NULL, ['cit-poison-control-fire-ant', 'cit-cdc-fire-ant-stings']),
('ev-systemic-allergy', 'moderate', 'clinical', 'Systemic allergic reactions are possible but not universal outcomes.', ['cit-poison-control-fire-ant', 'cit-cdc-fire-ant-stings']),
('ev-geography-pending', 'unknown', 'editorial_normalization', 'Validated range geometry files are pending curation.', ['cit-editorial-placeholder']);

INSERT INTO venom_atlas.taxonomy (id, organism_id, kingdom, phylum, class_name, order_name, family, genus, species)
VALUES
('tax-sinvicta', 'org-solenopsis-invicta', 'Animalia', 'Arthropoda', 'Insecta', 'Hymenoptera', 'Formicidae', 'Solenopsis', 'Solenopsis invicta');

INSERT INTO venom_atlas.delivery_mechanisms (id, organism_id, route, summary, sequence, evidence_assessment_id)
VALUES
('deliv-fire-ant-sting', 'org-solenopsis-invicta', 'sting', 'Mandibles anchor while the abdomen rotates to place the stinger and inject venom.', ['Mandibles grip skin or substrate.', 'Abdomen rotates under the body axis.', 'Stinger penetrates tissue.', 'Venom is injected into local tissue.'], 'ev-delivery-sequence');

INSERT INTO venom_atlas.organisms (id, scientific_name, common_name, overview, natural_history, taxonomy_id, delivery_mechanism_id, evidence_assessment_id)
VALUES
('org-solenopsis-invicta', 'Solenopsis invicta', 'Red imported fire ant', 'Solenopsis invicta is an ant species widely studied for defensive sting behavior, rapid colony recruitment, and ecological impact where established.', ['Workers can rapidly recruit nestmates when disturbed.', 'Colonies occupy disturbed soils, lawns, fields, and urban interfaces.', 'Defensive behavior commonly involves grip-and-sting sequences.'], 'tax-sinvicta', 'deliv-fire-ant-sting', 'ev-taxonomy');

INSERT INTO venom_atlas.biological_materials (id, organism_id, kind, name, description, evidence_assessment_id)
VALUES
('bio-fire-ant-venom', 'org-solenopsis-invicta', 'venom', 'Fire-ant venom', 'A venomous secretion associated with sting delivery.', 'ev-venom-mixture');

INSERT INTO venom_atlas.venoms (id, organism_id, biological_material_id, name, description, ecological_role_summary, evidence_assessment_id)
VALUES
('ven-fire-ant-primary', 'org-solenopsis-invicta', 'bio-fire-ant-venom', 'Solenopsis invicta venom', 'A biologically active mixture with alkaloid-rich components and protein fractions relevant to allergic responses.', 'Likely supports defense, prey subduing, and competitive ecological interactions.', 'ev-venom-mixture');

INSERT INTO venom_atlas.toxins (id, venom_id, display_name, family, notes, evidence_assessment_id)
VALUES
('tox-solenopsin-a', 'ven-fire-ant-primary', 'Solenopsin A', 'Piperidine alkaloids (solenopsins)', 'Featured representative compound. Not claimed as sole mediator of all clinical effects.', 'ev-solenopsin-feature');

INSERT INTO venom_atlas.venom_components (id, venom_id, toxin_id, component_category, abundance_qualifier, summary, evidence_assessment_id)
VALUES
('comp-alkaloids', 'ven-fire-ant-primary', NULL, 'Piperidine alkaloids', 'not_quantified', 'Qualitatively prominent class in many fire-ant venom descriptions.', 'ev-venom-mixture'),
('comp-proteins', 'ven-fire-ant-primary', NULL, 'Protein fractions/allergens', 'not_quantified', 'Associated with immune-mediated responses in sensitized individuals.', 'ev-systemic-allergy');

INSERT INTO venom_atlas.molecular_entities (id, toxin_id, display_name, molecular_class, formula, molecular_weight, structure_data_source, evidence_assessment_id)
VALUES
('mol-solenopsin-a', 'tox-solenopsin-a', 'Solenopsin A', 'small_molecule', NULL, NULL, NULL, 'ev-solenopsin-feature');

INSERT INTO venom_atlas.molecular_structure_assets (id, molecular_entity_id, format, local_path, source_url, citation_id, verified)
VALUES
('asset-mol3d-solenopsin-a', 'mol-solenopsin-a', 'sdf', '/structures/solenopsin-a.sdf', NULL, NULL, false),
('asset-mol2d-solenopsin-a', 'mol-solenopsin-a', 'svg', '/images/solenopsin-a-2d.svg', NULL, NULL, false);

INSERT INTO venom_atlas.molecular_targets (id, toxin_id, target_name, target_type, summary, evidence_assessment_id)
VALUES
('target-local-cell-membrane-process', 'tox-solenopsin-a', 'Local tissue and cell-response processes', 'unknown', 'Specific primary molecular targets are represented conservatively as unresolved in this seed.', 'ev-solenopsin-feature');

INSERT INTO venom_atlas.mechanism_steps (id, toxin_id, step_order, level, title, description, target_id, evidence_assessment_id)
VALUES
('mech-1-exposure', 'tox-solenopsin-a', 1, 'exposure', 'Sting exposure', 'Ant anchors with mandibles and delivers venom through the stinger.', NULL, 'ev-delivery-sequence'),
('mech-2-tissue-deposition', 'tox-solenopsin-a', 2, 'tissue', 'Local venom deposition', 'Venom components are deposited in superficial tissue at sting sites.', NULL, 'ev-local-clinical'),
('mech-3-immediate-pain', 'tox-solenopsin-a', 3, 'clinical', 'Immediate pain and burning sensation', 'Many sting events produce rapid local pain or burning sensation.', NULL, 'ev-local-clinical'),
('mech-4-inflammatory-local', 'tox-solenopsin-a', 4, 'tissue', 'Local inflammatory response', 'Inflammatory and immune processes contribute to visible local lesions.', NULL, 'ev-local-clinical'),
('mech-5-lesion-outcome', 'tox-solenopsin-a', 5, 'clinical', 'Wheal/pustule development where applicable', 'A local lesion can develop over time, and presentation varies by individual and exposure.', NULL, 'ev-local-clinical'),
('mech-6-persistent-discomfort', 'tox-solenopsin-a', 6, 'clinical', 'Persistent local discomfort in some cases', 'Some individuals report prolonged local discomfort after initial sting effects.', NULL, 'ev-local-clinical');

INSERT INTO venom_atlas.anatomical_systems (id, name, description)
VALUES
('anat-skin', 'Skin', 'Primary local site of venom deposition and lesion development.'),
('anat-peripheral-nerves', 'Peripheral sensory nerves', 'Supports local pain and burning perception.'),
('anat-circulatory', 'Circulatory system', 'Potential systemic involvement context.'),
('anat-respiratory', 'Respiratory system', 'Relevant in severe allergic responses.'),
('anat-immune', 'Immune/inflammatory response', 'Mediator of local and allergic reaction pathways.');

INSERT INTO venom_atlas.symptoms (id, name, description, evidence_assessment_id)
VALUES
('sym-pain', 'Pain/Burning', 'Rapid local pain sensation after sting.', 'ev-local-clinical'),
('sym-local-lesion', 'Local wheal/pustule or lesion', 'Localized lesion response that may evolve after sting.', 'ev-local-clinical'),
('sym-systemic-allergy', 'Systemic allergic reaction (possible pathway)', 'Potential severe allergic response in sensitized individuals.', 'ev-systemic-allergy');

INSERT INTO venom_atlas.physiological_effects (id, toxin_id, anatomical_system_id, symptom_id, pathway_type, title, description, effect_order, evidence_assessment_id)
VALUES
('phys-local-skin', 'tox-solenopsin-a', 'anat-skin', 'sym-local-lesion', 'direct_venom', 'Local skin tissue impact', 'Direct local tissue effects at sting site.', 1, 'ev-local-clinical'),
('phys-local-nerves', 'tox-solenopsin-a', 'anat-peripheral-nerves', 'sym-pain', 'direct_venom', 'Sensory nerve-associated pain', 'Local pain and burning sensations are commonly reported.', 2, 'ev-local-clinical'),
('phys-inflammatory', 'tox-solenopsin-a', 'anat-immune', 'sym-local-lesion', 'inflammatory_immune', 'Local inflammatory response', 'Inflammatory response contributes to evolving lesion patterns.', 3, 'ev-local-clinical'),
('phys-systemic-allergy', 'tox-solenopsin-a', 'anat-respiratory', 'sym-systemic-allergy', 'systemic_allergic', 'Systemic allergic pathway (non-default)', 'A separate pathway representing possible allergic systemic reactions.', 4, 'ev-systemic-allergy');

INSERT INTO venom_atlas.organism_ranges (id, organism_id, layer_type, geometry_asset_id, summary, evidence_assessment_id)
VALUES
('geo-native-range', 'org-solenopsis-invicta', 'native_range', NULL, 'Native range geometry not yet bundled, source-backed geometry pending.', 'ev-geography-pending'),
('geo-introduced-range', 'org-solenopsis-invicta', 'introduced_range', NULL, 'Introduced range geometry not yet bundled, source-backed geometry pending.', 'ev-geography-pending');

INSERT INTO venom_atlas.habitats (id, organism_id, name, summary, evidence_assessment_id)
VALUES
('hab-disturbed-soils', 'org-solenopsis-invicta', 'Disturbed soils and anthropogenic landscapes', 'Often established in open disturbed habitats, lawns, and managed landscapes.', 'ev-taxonomy');

INSERT INTO venom_atlas.ecological_roles (id, organism_id, role, summary, evidence_assessment_id)
VALUES
('eco-defense', 'org-solenopsis-invicta', 'Defense and competitive interactions', 'Venom-associated sting behavior is relevant to defense and interference competition.', 'ev-venom-mixture');

INSERT INTO venom_atlas.media_assets (id, kind, local_path, source_url, creator, license, attribution_text, citation_id, verified)
VALUES
('media-organism-photo-placeholder', 'organism_photo', '/images/organism-photo-placeholder.txt', NULL, NULL, NULL, 'Placeholder only. Production image pending license verification.', NULL, false),
('media-mandibles-placeholder', 'anatomical_photo', '/images/mandibles-placeholder.txt', NULL, NULL, NULL, 'Placeholder only. Close-up source pending.', NULL, false),
('media-stinger-placeholder', 'anatomical_photo', '/images/stinger-placeholder.txt', NULL, NULL, NULL, 'Placeholder only. Close-up source pending.', NULL, false),
('media-habitat-placeholder', 'organism_photo', '/images/habitat-placeholder.txt', NULL, NULL, NULL, 'Placeholder only. Habitat image pending source verification.', NULL, false),
('media-2d-solenopsin-placeholder', 'molecular_2d', '/images/solenopsin-a-2d.svg', NULL, NULL, NULL, 'Placeholder marker. Scientifically sourced 2D structure pending.', NULL, false),
('media-3d-solenopsin-placeholder', 'molecular_3d', '/structures/solenopsin-a.sdf', NULL, NULL, NULL, 'Placeholder marker. Verified 3D structure file pending.', NULL, false),
('media-range-geometry-placeholder', 'range_geometry', '/geography/solenopsis-invicta-range.geojson', NULL, NULL, NULL, 'Placeholder marker. Source-backed geometry pending.', NULL, false);
