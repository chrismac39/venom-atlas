# Venom Atlas Reliability Roadmap

## North Star

Venom Atlas should deliver "one organism, the complete venom story" at progressive levels of detail:

1. Scan: identity, range, exposure route, major hazards, and representative compounds.
2. Understand: venom composition, biological mechanisms, symptom progression, and uncertainty.
3. Investigate: molecular structures, renderer controls, claim-level evidence, and source provenance.

"Complete" describes the product direction, not permission to hide missing evidence. Every organism dossier must expose its coverage and uncertainty honestly.

## Current Status

Completed in the first remediation tranche:

- Mechanism and physiology records use explicit `organism_exposure`, `whole_material`, or `isolated_compound` subjects.
- Fire Ant sting progression and clinical effects are organism-exposure claims, not Solenopsin A claims.
- Unsupported compound mechanism and physiology routes are not generated and are covered by browser tests.
- Featured compounds are explicitly curated on venom records and validated against venom membership.
- Unquantified composition uses an evidence list instead of a quantitative-looking chart.
- Physiology uses structured pathway types; generated fallback sequences and prose classification are removed.
- Internal editorial citations are retained for validation but excluded from public lists and routes.
- Five starter profiles now cover insects, amphibians, reptiles, fishes, and mammals across sting, contact, bite, spine, and spur exposure.
- Sparse dossiers are valid: missing capabilities are shown in a coverage matrix and do not generate placeholder routes.
- Placeholder Fire Ant geography and the broken AntMaps embed are suppressed until sourced first-party geography is available.
- Static first-party occurrence maps now use reusable-license GBIF records over a Natural Earth basemap for all five starter profiles.
- Shared domain, schema, source, search, and generated JSON contracts use neutral `ToxicMaterial`, `toxicMaterialId`, and `whole_material` terminology.
- `/organisms/<slug>/toxic-material` is canonical; `/venom` is generated only as a redirect for actual venom materials.

Still blocking the reference-slice definition of done:

- Modeled native and introduced range boundaries are not yet curated; occurrence maps must not be interpreted as complete ranges.
- Claim-level reviewed dates and clinical review metadata are not modeled.
- Base-path-safe URL generation and project-path CI coverage are not implemented.
- The chemistry development-load failure and interaction behavior need dedicated browser coverage.
- Package TypeScript configs still inherit deprecated `baseUrl` behavior and need a TypeScript 7 migration.

Neutral material contract acceptance criteria (complete):

- Active shared and application types use `ToxicMaterial`; generic materials are not typed as `Venom`.
- Compound and component ownership uses an explicit `toxicMaterialId` relationship.
- Whole-mixture scientific subjects use `whole_material`.
- Canonical source and generated JSON directories are named `toxic-materials`.
- Search records use `toxic_material` and link to the canonical toxic-material route.
- A `/venom` route is emitted only as a compatibility redirect for a material whose kind is `venom`.

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

- Every mechanism and physiology record declares its subject kind and subject ID.
- Whole-material allergic effects are not presented as Solenopsin A effects.
- A featured compound is explicitly curated, never inferred from array order.
- Build validation rejects subject/reference mismatches.

### Stop presenting placeholders as coverage

Problem: placeholder geography, illustrative complexes, and editorial-normalization records currently make sections appear complete.

Acceptance criteria:

- Placeholder records do not activate public sections.
- Illustrative structures carry an always-visible label before interaction.
- Editorial-only claims cannot appear in the pinned toxicology summary.
- Each dossier displays a coverage summary for identity, geography, toxic material, chemistry, physiology, and media.

### Claim-level evidence

Problem: evidence is attached mainly to entities or panels, while individual claims can have different support.

Acceptance criteria:

- User-facing claims can expose citation IDs, evidence type, confidence, reviewed date, and causal scope.
- Every clinical safety statement has a non-editorial source.
- Placeholder citations are excluded from public evidence lists.

## Severity 1: Broken Or Misleading Experiences

### First-party geography

Problem: the AntMaps iframe currently throws a provider-side runtime error and can display a blank viewport.

Target:

- Render sourced local GeoJSON/TopoJSON as the default static map.
- Enhance with pan, zoom, and layer controls only on request.
- Keep provider links as secondary "Explore source" actions.
- Test visible map pixels/features, not only iframe existence.

### Chemistry reliability

Problem: production 3D rendering works, but development dependency invalidation can fail dynamic imports and the full-canvas interaction overlay makes a valid render look blank.

Target:

- Show the molecule immediately.
- Enable pointer rotation immediately; gate wheel capture on focus.
- Put specialist controls under an advanced disclosure.
- Test cold development load, production load, nonblank canvas pixels, and structure fetch failures.

### Honest visualizations

Problem: qualitative categories are presented as composition charts, and pathway classifications are inferred from prose.

Acceptance criteria:

- Composition charts require sourced quantitative or ordinal abundance data.
- Qualitative composition uses an evidence table or list.
- Physiology pathways come from structured fields, never string matching.
- Vega and Vega-Lite runtime/spec versions match without console warnings.

## Severity 2: Information Architecture

### Progressive disclosure

Target layers:

- Summary: hero, key facts, range, exposure, common effects.
- Detail: expandable organism, venom, mechanism, and physiology narratives.
- Expert: chemistry workbench, structures, annotations, and evidence tables.

Acceptance criteria:

- A general reader can understand the organism without passing renderer controls.
- Deep sections remain directly linkable.
- The page does not repeat the same organism summary in multiple sticky surfaces.

### Clinical communication

Acceptance criteria:

- Distinguish common local effects, delayed local effects, and uncommon systemic emergencies.
- Include sourced onset/duration ranges where available.
- Present emergency warning signs without diagnosis or personalized treatment advice.
- Show medical review status and review date.

### Licensed visual identity

Acceptance criteria:

- Hero, organism, habitat, and anatomy media have verified redistribution rights and attribution.
- Unverified files are pruned and never referenced by generated pages.
- Temporary visual treatments are clearly internal design devices, not scientific diagrams.

## Severity 3: Platform Quality

### Static-host portability

- Centralize internal URL and asset-path generation.
- Apply Astro's base path to navigation, images, structures, annotations, and generated links.
- Build and crawl with `PUBLIC_BASE_PATH=/venom-atlas/` in CI.

### Accessibility and resilience

- Keyboard operation for maps, structures, disclosures, and section navigation.
- Reduced-motion behavior for scrolling and visual transitions.
- Text/table equivalents for every visualization.
- Local error boundaries with actionable fallback links.

### Performance budgets

- Chooser: no visualization runtimes or third-party requests.
- Dossier initial route: less than 75 KB gzip of route-specific JavaScript.
- Vega, 3Dmol, and map engines load only on intent/proximity.
- Track bundle sizes and browser request budgets in CI.

## Delivery Order

1. Completed: introduce causal-scope contracts and migrate Fire Ant clinical data to exposure/venom scope.
2. Completed: remove placeholder-driven sections and add dossier coverage reporting.
3. Completed: replace the broken map embed with first-party, source-backed geography.
4. Completed: introduce a neutral toxic-material route and relationship contract, then publish the first poison material and isolated compound dossier.
5. Make the chemistry viewer visibly interactive and development-stable.
6. Replace heuristic/meaningless charts with structured representations.
7. Recompose the page into summary, detail, and expert layers.
8. Add claim-level citations and clinical editorial metadata.
9. Add licensed organism/anatomy media.
10. Make every URL base-path aware and add GitHub Pages CI coverage.
11. Promote starter organism profiles through the publication levels in `docs/scientific-model/organism-dossier-authoring.md`.

## Definition Of Done For The Fire Ant Reference Slice

- No public placeholder claims or blank primary visualizations.
- No console errors or warnings during the canonical reading path.
- Correct separation of sting effects, whole-venom effects, and compound-specific mechanisms.
- Sourced geography remains useful if external providers are unavailable.
- 2D and 3D chemistry renderers work in development and production.
- Summary, intermediate, and expert reading depths are obvious and linkable.
- All content validation, type checking, unit tests, production build, and Playwright tests pass.