# Venom Atlas Reliability Roadmap

> **Historical roadmap — superseded 2026-09-08.** The [product audit and action plan](venomatlas-product-audit-and-action-plan.md) is the sole active product roadmap. Milestone 0 selects GitHub Pages, four primary sections (Organism, Geography, Chemistry, Effects), and “One organism, the full toxin story” across toxic strategies. New-organism expansion is frozen while Fire Ant and Golden Poison Frog/Batrachotoxin reference slices are completed. The checklists below preserve earlier observations, not current test results, authorization, or release acceptance; the Milestone 1A scientific gate currently has blockers.

## Reconciliation with the active roadmap

| Earlier open work | Current home / disposition |
| --- | --- |
| Chemistry cold load and failure coverage | Milestone 1B |
| Claim citations, reviewed dates, clinical metadata | Milestones 1C, 2, and 3 |
| Native/introduced range and marine checks | Bounded reference pass in Milestone 4; global range perfection deferred |
| Progressive disclosure and licensed organism media | Four-section composition in Milestone 5 |
| URLs, project-path CI, accessibility, performance, tooling maintenance | Milestone 6; earlier portability/performance checkmarks are not proof of current release readiness |
| Anatomy and broader catalog promotion | Milestone 7; 3D anatomy and new-organism expansion deferred under Milestone 0 |

Do not execute the historical delivery order below as a separate backlog. Scope and reference acceptance come from the active roadmap, including its expansion gate and unresolved owner decisions.

## North Star

Venom Atlas should deliver "one organism, the complete venom story" at progressive levels of detail:

1. Scan: identity, range, exposure route, major hazards, and representative compounds.
2. Understand: venom composition, biological mechanisms, symptom progression, and uncertainty.
3. Investigate: molecular structures, renderer controls, claim-level evidence, and source provenance.

"Complete" describes the product direction, not permission to hide missing evidence. Every organism dossier must expose its coverage and uncertainty honestly.

## Current Status

Status legend: `- [x]` addressed and verified; `- [ ]` still open or not yet verified.

Completed in the first remediation tranche:

- [x] Mechanism and physiology records use explicit `organism_exposure`, `whole_material`, or `isolated_compound` subjects.
- [x] Fire Ant sting progression and clinical effects are organism-exposure claims, not Solenopsin A claims.
- [x] Unsupported compound mechanism and physiology routes are not generated and are covered by browser tests.
- [x] Featured compounds are explicitly curated on toxic-material records and validated against material membership.
- [x] Unquantified composition uses an evidence list instead of a quantitative-looking chart.
- [x] Physiology uses structured pathway types; generated fallback sequences and prose classification are removed.
- [x] Internal editorial citations are retained for validation but excluded from public lists and routes.
- [x] Five starter profiles cover insects, amphibians, reptiles, fishes, and mammals across sting, contact, bite, spine, and spur exposure.
- [x] Sparse dossiers are valid: missing capabilities are shown in a coverage matrix and do not generate placeholder routes.
- [x] Placeholder Fire Ant geography and the broken AntMaps embed are suppressed.
- [x] Static first-party occurrence maps use reusable-license GBIF records over a Natural Earth basemap for all five starter profiles.
- [x] Shared domain, schema, source, search, and generated JSON contracts use neutral `ToxicMaterial`, `toxicMaterialId`, and `whole_material` terminology.
- [x] `/organisms/<slug>/toxic-material` is canonical; `/venom` is generated only as a redirect for actual venom materials.

Still blocking the reference-slice definition of done:

- [ ] Curate modeled native and introduced range boundaries; occurrence maps must not be interpreted as complete ranges.
- [ ] Model claim-level reviewed dates and clinical review metadata.
- [ ] Implement base-path-safe URL generation and project-path CI coverage.
- [ ] Add dedicated browser coverage for chemistry development loading and interaction behavior.
- [ ] Remove deprecated `baseUrl` inheritance and complete the TypeScript 7 migration.

Neutral material contract acceptance criteria (complete):

- [x] Active shared and application types use `ToxicMaterial`; generic materials are not typed as `Venom`.
- [x] Compound and component ownership uses an explicit `toxicMaterialId` relationship.
- [x] Whole-mixture scientific subjects use `whole_material`.
- [x] Canonical source and generated JSON directories are named `toxic-materials`.
- [x] Search records use `toxic_material` and link to the canonical toxic-material route.
- [x] A `/venom` route is emitted only as a compatibility redirect for a material whose kind is `venom`.

## Release Principles

- Scientific scope is explicit: organism exposure, whole toxic material, material component, and isolated compound claims are never interchangeable.
- Missing evidence is omitted or labeled; production UI never generates scientific claims from generic fallback prose.
- A visualization is published only when it adds information beyond a well-structured text or table representation.
- External providers are optional enhancements. Their failure cannot leave a primary section blank.
- The initial page remains statically generated and useful without JavaScript.
- Expensive runtimes load only after user intent or proximity to the relevant section.
- Every public route and asset works from both a root domain and a GitHub Pages project base path.

## Severity 0: Scientific Trust

### Separate causal scopes

Problem: clinical effects of a sting are currently stored under a featured compound, allowing the UI to imply molecule-level causality that the evidence does not establish.

Required model:

- `ExposureProfile`: observed effects of an organism encounter.
- `ToxicMaterialEffect`: effects attributable to the biological mixture.
- `CompoundMechanism`: effects demonstrated or proposed for an isolated compound.

Acceptance criteria:

- [x] Every mechanism and physiology record declares its subject kind and subject ID.
- [x] Whole-material allergic effects are not presented as Solenopsin A effects.
- [x] A featured compound is explicitly curated, never inferred from array order.
- [x] Build validation rejects subject/reference mismatches.

### Stop presenting placeholders as coverage

Problem: placeholder geography, illustrative complexes, and editorial-normalization records currently make sections appear complete.

Acceptance criteria:

- [x] Placeholder records do not activate public sections.
- [x] Illustrative structures carry an always-visible label before interaction.
- [x] Editorial-only claims cannot appear in the pinned toxicology summary.
- [x] Each dossier displays a coverage summary for identity, geography, toxic material, chemistry, physiology, and media.

### Claim-level evidence

Problem: evidence is attached mainly to entities or panels, while individual claims can have different support.

Acceptance criteria:

- [ ] User-facing claims can expose citation IDs, evidence type, confidence, reviewed date, and causal scope.
- [x] Every published clinical safety statement has a non-editorial source.
- [x] Placeholder citations are excluded from public evidence lists.

## Severity 1: Broken Or Misleading Experiences

### First-party geography

Problem: the AntMaps iframe currently throws a provider-side runtime error and can display a blank viewport.

Target:

- [x] Render sourced local GeoJSON/TopoJSON as the default static map.
- [x] Enhance with pan, zoom, and layer controls only on request.
- [x] Keep provider links as secondary "Explore source" actions.
- [x] Test visible map features, not only iframe existence.
- [x] Support marine geography with independent GBIF observation dots and evidence-only OGC ISEA3H cells.
- [x] Keep marine evidence cells separate from the neutral landmass layer and omit empty ocean cells.
- [x] Generate and publish Synanceia ISEA3H cells reproducibly from grid-deduplicated GBIF observations.
- [ ] Add dedicated browser coverage for marine cell visibility and terrestrial-control suppression.

Marine cells are evidence aggregation, not complete distribution boundaries. Modeled native,
introduced, or uncertain range boundaries remain a separate curation task and must not be
inferred from either occurrence dots or ISEA3H evidence cells.

### Chemistry reliability

Problem: production 3D rendering works, but development dependency invalidation can fail dynamic imports and the full-canvas interaction overlay makes a valid render look blank.

Target:

- [x] Show the molecule immediately beneath a non-blocking loading state.
- [x] Enable pointer rotation immediately; gate wheel capture on viewer focus.
- [x] Put specialist controls under an advanced disclosure.
- [ ] Test cold development load, production load, nonblank canvas pixels, and structure fetch failures.

### Honest visualizations

Problem: qualitative categories are presented as composition charts, and pathway classifications are inferred from prose.

Acceptance criteria:

- [x] Composition charts require sourced quantitative or ordinal abundance data.
- [x] Qualitative composition uses an evidence table or list.
- [x] Physiology pathways come from structured fields, never string matching.
- [ ] Verify Vega and Vega-Lite runtime/spec versions match without console warnings in browser coverage.

## Severity 2: Information Architecture

### Progressive disclosure

Target layers:

- Summary: hero, key facts, range, exposure, common effects.
- Detail: expandable organism, venom, mechanism, and physiology narratives.
- Expert: chemistry workbench, structures, annotations, and evidence tables.

Acceptance criteria:

- [x] A general reader can understand the organism without passing renderer controls.
- [x] Deep sections remain directly linkable.
- [ ] Verify the page does not repeat the same organism summary in multiple sticky surfaces.

### Clinical communication

Acceptance criteria:

- [ ] Distinguish common local effects, delayed local effects, and uncommon systemic emergencies.
- [ ] Include sourced onset/duration ranges where available.
- [x] Present emergency warning signs without diagnosis or personalized treatment advice.
- [ ] Show medical review status and review date.

### Licensed visual identity

Acceptance criteria:

- [ ] Hero, organism, habitat, and anatomy media have verified redistribution rights and attribution.
- [x] Unverified files are pruned and never referenced by generated pages.
- [ ] Verify temporary visual treatments are clearly identified as design devices rather than scientific diagrams.

## Severity 3: Platform Quality

### Static-host portability

- [x] Centralize internal URL and asset-path generation for active internal links.
- [x] Apply Astro's base path to active navigation and page links; project-path build verified with `PUBLIC_BASE_PATH=/venom-atlas/`.
- [ ] Build and crawl with `PUBLIC_BASE_PATH=/venom-atlas/` in CI.

### Accessibility and resilience

- [ ] Verify keyboard operation for maps, structures, disclosures, and section navigation.
- [ ] Add and verify reduced-motion behavior for scrolling and visual transitions.
- [x] Provide text/table equivalents for published scientific visualizations.
- [ ] Add local error boundaries with actionable fallback links.

### Performance budgets

- [x] Chooser makes no visualization-runtime or third-party requests.
- [x] Dossier initial route remains below 75 KB gzip of route-specific JavaScript.
- [ ] Ensure Vega, 3Dmol, and map engines load only on intent or proximity.
- [ ] Track bundle sizes and browser request budgets in CI.

## Delivery Order

- [x] Introduce causal-scope contracts and migrate Fire Ant clinical data to exposure/material scope.
- [x] Remove placeholder-driven sections and add dossier coverage reporting.
- [x] Replace the broken map embed with first-party, source-backed geography.
- [x] Add evidence-only marine mapping with reproducible OGC ISEA3H cell generation.
- [x] Introduce a neutral toxic-material route and relationship contract, then publish the first poison material and isolated compound dossier.
- [ ] Complete cold-development, canvas-pixel, and structure-failure coverage for the chemistry viewer.
- [x] Replace heuristic or meaningless charts with structured representations.
- [ ] Recompose the page into summary, detail, and expert layers.
- [ ] Add claim-level citations and clinical editorial metadata.
- [ ] Add licensed organism and anatomy media.
- [ ] Make every URL base-path aware and add GitHub Pages CI coverage.
- [ ] Promote starter organism profiles through the publication levels in `docs/scientific-model/organism-dossier-authoring.md`.

## Definition Of Done For The Fire Ant Reference Slice

- [x] No public placeholder claims or blank primary visualizations.
- [ ] No console errors or warnings during the canonical reading path.
- [x] Correct separation of sting effects, whole-material effects, and compound-specific mechanisms.
- [x] Sourced geography remains useful if external providers are unavailable.
- [ ] 2D and 3D chemistry renderers have verified cold-development, production, and failure-path coverage.
- [ ] Summary, intermediate, and expert reading depths are obvious and linkable.
- [x] All content validation, type checking, unit tests, production build, and Playwright tests pass.