# Organism Dossier Authoring

## Publication Levels

### Level 1: Starter profile

Required:

- Stable ID and slug.
- Accepted scientific and common names.
- Taxonomy through species where available.
- Explicit `toxicStrategy`.
- Evidence-backed delivery route and sequence.
- Habitat and ecological role summaries.
- At least one public citation from an accountable source.

Allowed to be absent:

- Local range geometry.
- Toxic material composition.
- Isolated compounds and structures.
- Exposure mechanism records.
- Clinical physiology records.
- Redistributable media.

Missing modules must remain absent. Do not create placeholder records to make the dossier appear complete.

### Level 2: Evidence dossier

Adds source-backed geography, a biological material profile, exposure mechanisms, and physiology. Claims must identify whether their subject is organism exposure, whole venom, or an isolated compound.

### Level 3: Molecular dossier

Adds curated compounds, verified structures, molecular targets, interaction annotations, and claim-level citations. A featured compound must be explicit and must belong to the organism's toxic material.

## Authoring Workflow

1. Add citations first under `content-source/citations/`.
2. Add the organism profile under `content-source/organisms/<slug>.yaml`.
3. Run `pnpm validate` and `pnpm typecheck`.
4. Confirm the chooser and `/atlas/<slug>` route render with no unsupported sections.
5. Add geography only when source-backed geometry or a reliable provider record exists.
6. Add toxic material and compound records only when their ownership and causal scope are clear.
	Compound records must link to the material's exact `id` through `toxicMaterialId`.
7. Add physiology only at the supported subject scope.
8. Add media only after redistribution rights and attribution are verified.
9. Run unit tests, production build, and Playwright before publication.

## Naming Rules

- Organism files use the normalized scientific-name slug.
- Exposure mechanism and physiology files use `<organism-slug>-exposure.yaml`.
- Whole-material claims use the material slug.
- Isolated-compound claims use the compound slug.
- `/organisms/<slug>/toxic-material` is the canonical material route for poison, venom, and other toxic materials.
- A legacy `/organisms/<slug>/venom` route may redirect only when the material kind is `venom`; it must not exist for poison records.
- File names must not imply stronger causal scope than the record declares.

## Validation Expectations

Validation must reject duplicate slugs, dangling citations, invalid subject references, featured compounds outside their material, missing referenced assets, and public placeholder evidence. It must allow incomplete dossiers when missing capabilities are represented as absent data.

## Review Checklist

- Poison and venom terminology is correct.
- Delivery anatomy and route agree.
- Clinical effects are not silently attributed to a featured compound.
- Potency is not equated with real-world danger.
- Common and severe outcomes are distinguished.
- Every safety statement has a non-editorial source.
- Coverage indicators match the records actually published.
- External services are optional enhancements, never the only usable representation.
