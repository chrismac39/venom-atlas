# VenomAtlas: repository audit and product action plan

**Audit date:** 2026-09-08  
**Branch examined:** Scaffolding  
**Status:** Active product roadmap. Milestone 0 scope decisions approved and recorded on 2026-09-08 at the owner's request; GitHub Pages explicitly selected. Milestone 1A was separately authorized and implemented; its content gate still reports blockers (see 1A validation notes). Remaining milestones are planned, not authorized for implementation by this document.
**Product principle:** **One organism, the full toxin story.**

Checkbox convention: `[x]` means observed, completed, or explicitly approved as identified in the accompanying status notes; `[ ]` means proposed, awaiting a decision, or not yet verified. Scope approval does not certify scientific review or release readiness. Estimates are relative effort, not delivery promises. Scientific source review is a separate workload from implementation.

## 1. Executive recommendation

**Keep the static-first Astro/React architecture, OpenLayers, and the existing molecular-renderer boundary. Do not restart the application or restore the legacy backend.** The architecture already supports inexpensive public hosting. The main shortfall is the distance between available infrastructure and a convincing, deeply sourced organism dossier.

The site currently has broad organism coverage but shallow chemistry and effects coverage. Geography has substantial infrastructure, but its presentation, payload size, evidence precision, and missing introduced-range data explain why another round of map features alone will not complete the product.

Recommended direction:

1. Fix evidence integrity and restore reliable chemistry development before adding more organisms.
2. Establish a reusable claim-to-source publication pipeline rather than putting additional uncited prose or numbers into UI components.
3. Deliver one compelling organism-first reading experience with four primary sections: **Organism, Geography, Chemistry, Effects**. Make sources accessible throughout and collected at the end.
4. Use Fire Ant as the integration reference and Golden Poison Frog/Batrachotoxin as the chemistry reference. Add a specifically identified botulinum toxin subtype/structure later to test protein and clinical depth.
5. Time-box the first geography improvement pass around correctness, clear native/introduced distinctions, useful framing, smaller assets, and good interaction—not a complete global biogeography platform.
6. Prove deployment from both a root URL and a GitHub Pages project path before calling the site portable.

“Full” should mean **the known story, its supporting evidence, its uncertainty, and its documented gaps**. It should not mean inventing completeness, requiring the same fields for every organism, or padding a bibliography to hit a quota.

## 2. Scope and verification performed

### 2.1 Repository areas examined

- [x] Active Astro routes, React islands, orchestration hooks, composition, shared styles, and URL helpers.
- [x] Organism chooser/catalog, summary data, media publication, and canonical monopage flow.
- [x] Domain types, shared schemas, the separate active YAML schemas/loader, validators, and generated data boundaries.
- [x] Geography sources, source audits, GBIF importer, ADM1 registry builder, marine-cell pipeline, map implementation, and asset sizes.
- [x] Molecular asset selection, 2D generation, 3Dmol adapter, Mol* boundary, interaction annotations, and chemistry UI.
- [x] Mechanism/physiology content, causal scopes, anatomy schematic, and effects presentation.
- [x] Citation catalogs, reference propagation, duplicate records, source mix, and publication filtering.
- [x] Static JSON, search, SQLite generation, workspace packages, CI, deployment configuration, and existing tests.
- [x] Legacy feature/orchestration code and architecture/migration/quality documentation as historical context.
- [x] Targeted browser inspection of development and production Fire Ant chemistry, terrestrial mapping, and a mobile Reef Stonefish map.

This is a repository/product audit, **not a completed scientific fact-check of every external source, a security audit, or a comprehensive accessibility assessment**. In particular, taxonomy synonyms and unexpected occurrence coordinates require source-level investigation, not automatic deletion.

### 2.2 Checks actually run

| Check | Observed result | Important qualification |
| --- | --- | --- |
| Working tree before audit | Clean | No pre-existing uncommitted changes reported. |
| Scientific validation (`pnpm validate`) | Passed | Reports 61 planned routes, 39 referenced citation IDs, 15 geography audits, 8 media records. Referential validity does not prove scientific support. |
| Unit tests (`pnpm test`) | Passed | 41 web tests across 11 files; 2 schema tests. Domain and visualization-contract packages report no tests. |
| Lint (`pnpm lint`) | Passed | Node warns about the root ESLint configuration's module type. |
| Type checks (`pnpm typecheck`) | Passed | Astro reports no diagnostics; content synchronization still logs a missing content-directory warning. |
| Web-only production build | Passed | 127 static pages generated. Existing 3Dmol `eval` and large-chunk warnings remain. |
| Existing development server | Chemistry failure observed | Dynamic import of the optimized 3Dmol module fails; target interaction fallback also appears. Root cause not established. |
| Isolated production preview | 2D and 3D Fire Ant structure visible | A rendered molecule was visually inspected, not merely inferred from canvas existence. |
| Mobile marine spot check | Map rendered; no horizontal overflow measured | Only occurrence and marine-cell controls appear, correctly suppressing terrestrial controls. Does not establish full mobile usability. |

**Not rerun:** the root build/data-generation pipeline, a GBIF refresh, the complete Playwright suite, or a project-base-path build. Data-generation scripts write checked-in assets; this first-pass audit deliberately avoided refreshing scientific data. The existing Playwright configuration starts its own server on the already occupied development port. Browser spot checks used a separate production preview instead of disrupting that server.

The validator's **61-route inventory is not the same as the 127-page production output**: its route list does not cover all source-detail and atlas pages. Treat “route validation passed” as narrower than “every published URL was validated.”

## 3. Measured current content coverage

Counts below come from source YAML and current generated assets, not the older migration reports.

| Area | Current state | Product implication |
| --- | --- | --- |
| Organisms | 15 | Good starting breadth across animals, plants, fungi, and bacteria. |
| Geography records | 15; 4 explicitly marine | Preserve the existing terrestrial/marine distinction. The bacterium is correctly marked as lacking a meaningful bounded native range. |
| Toxic-material records | 12 | Three organisms have no material dossier; do not imply these profiles are complete. |
| Toxin records | 6 | These include group-level entries, not six fully characterized individual molecules. |
| Toxins with structure assets | 2: Solenopsin A and Batrachotoxin | Most chemistry pages cannot currently offer a structure. |
| Referenced molecular assets | 5 across those two toxins | Two 2D SVGs, two SDFs, one illustrative PDB; not five independently validated molecular structures. |
| Mechanism source files | 4, but only 3 distinct subject bundles | Fire Ant occurs twice as identical exposure content; Batrachotoxin is compound-specific; botulism is exposure-specific. |
| Physiology source files | 3, but only 2 distinct subject bundles | Identical Fire Ant exposure content occurs twice; botulism is the other dossier. |
| Clinical effect depth | Fire Ant: 4 effects; botulism: 2 effects | Much less than the intended MD-level explanatory detail. |
| Citation rows | 49; 48 marked public/default-public | Rows are not unique sources: a duplicate public citation ID exists. |
| Citation mix | 20 database, 9 museum, 6 government, 2 journal articles, 1 book, 11 other | Already dozens of references, but not dozens of well-matched sources per deep dossier. Nine URLs are Wikipedia; two records have DOIs. |
| Media catalog | 8 assets; 2 redistribution-verified | The verified records are molecular assets. **No organism photograph in the catalog is approved for publication.** |
| Current distribution registry | 392 records: 240 native, 152 recorded presence | **Zero introduced or uncertain classifications**, despite support for these categories in the code. |
| Curated source-range polygon inputs | None in current geography YAML | Native shading exists through explicit ADM1 assignments and scope expansion; polygon-derived range coverage is not populated. |

### 3.1 GBIF display coverage is a sample

The importer requests up to 300 results per query, with extra native-country queries for Fire Ant, filters licenses, and keeps one record per rounded 0.5-degree cell. It does not paginate through the complete result set.

Examples of currently retained points:

| Organism | Displayed records in local occurrence asset |
| --- | ---: |
| Fire Ant | 151 |
| Geography Cone | 109 |
| Reef Stonefish | 38 |
| Death Cap | 18 |
| Gila Monster | 8 |
| Golden Poison Frog | 2 |

These are neither GBIF's complete counts nor estimates of abundance, prevalence, risk, or present-day occupancy. Increasing the number of dots without fixing sampling provenance would not solve that distinction.

### 3.2 Measured weight

Raw local files, rounded to decimal MB:

- National boundary asset: **8.26 MB**.
- Global ADM1 asset: **15.84 MB**.
- Public geography directory: **96.80 MB** across 43 files, including large country source assets.
- Production browser inspection fetched both boundary files for a terrestrial dossier: approximately **24.1 MB before occurrence data** in that local preview.

Selected production chunks reported by the build, gzip:

- Map panel/OpenLayers chunk: approximately **85.67 kB**.
- 3Dmol chunk: approximately **169.70 kB**.
- Vega chart chunk: approximately **297.22 kB**.
- React client chunk: approximately **58.54 kB**.

These are chunk measurements, not total-page transfer budgets. Hosting compression can differ; reducing unnecessary geometry and eager loads remains necessary even with compression.

## 4. Findings that should drive the work

### F1 — The hosting architecture is already appropriate

Astro generates static pages, React provides interactive islands, content is local at build time, and no production API/database is required. Cloudflare Pages is the documented deployment target; GitHub Pages is a reasonable alternative, not a reason to rewrite the app.

**Keep:** static HTML, per-organism URLs, optional heavy visualization code, offline-generated data, and the archived status of Fastify/ClickHouse infrastructure.

### F2 — The monopage is not yet the four-part product narrative

The active island presents up to seven sections, including separate mechanisms, categorization, and charts. The profile contains a largely empty “At a glance” panel and a coverage/taxonomy-heavy layout. Repeated summary surfaces and “Open dedicated…” links compete with the main reading flow; some purported dedicated links just return to the same atlas section.

The view model carries some natural-history/ecological information that the monopage does not fully use. It computes licensed-media availability but drops image paths from the profile payload. Even after licenses are resolved, adding photos to YAML alone would not produce the requested gallery.

**Action:** reorganize around four major sections without removing useful specialist material. Fold exposure/delivery into the organism/effects story; put mixture composition and toxin categorization inside Chemistry.

### F3 — Citations exist, but the evidence chain is incomplete

The current pattern is primarily **authored data with evidence fields**, not facts derived from cited, reviewable source assertions. Several individual prose fields inherit an organism-level assessment. The map view model drops range evidence/source-audit detail. Mechanism rows display evidence badges without directly resolving their citations. Molecular identity citations, not all relevant toxin/structure citations, populate the chemistry bibliography.

The production Fire Ant chemistry panel displays **“No source citations linked”** beside a formula, molecular weight, and PubChem identifier because the molecular entity is still backed by internal editorial-normalization evidence. Hiding the internal citation is correct; publishing apparently sourced facts without a public source trail is the remaining problem.

**Action:** preserve claim-level provenance through source, validation, view model, rendering, and export. A general list of references at the bottom is insufficient.

### F4 — Passing validators currently miss real duplication

- The public citation ID `cit-australian-museum-redback` occurs twice, with different slugs pointing to the same URL.
- Fire Ant mechanism content is duplicated identically between the compound-named and exposure-named source files.
- Fire Ant physiology content has the same duplicate pattern.
- The loader reads all files; subject lookup uses first-match selection. Duplicates can silently diverge later.

**Action:** canonicalize these records and validate citation IDs/slugs, evidence IDs, scientific subjects, nested record IDs, and references across the entire content graph. Retain explicit rules if multiple independently identified studies for one subject are intentionally allowed.

### F5 — Native map shading is not uniformly ADM1-quality evidence

Source audits and separate native/occurrence derivations already exist. However, country-level claims can expand to every ADM1 in that country, while other records assign a small selected list of ADM1 units to broad regional prose. For example, Death Cap's audit describes a European native context but marks selected ADM1 units; Castor Bean's audit describes a conservative India context with selected states. These require source verification and visible precision limits—not a conclusion here that every assignment is false.

The map's reduced record type omits derivation, confidence, notes, and evidence IDs. The registry builder assigns high confidence to explicit native ADM1 entries without a per-entry source-confidence input. Thus visually identical fills can conceal very different evidence.

**Action:** distinguish **map resolution** from **source precision**, validate the actual source-to-region mapping, and expose provenance on region selection. Country-level evidence must not look like independently confirmed occupancy throughout every state/province.

### F6 — Introduced geography is a data gap, not just a missing toggle

The registry supports introduced status but currently contains none. Observations outside an asserted native range remain recorded presence, correctly. Do not recolor them as introduced simply because the user expects an introduced layer.

**Action:** source introduced/established status explicitly. Represent unresolved, disputed, transient, or historical records separately when the literature warrants it. Add symmetric source-backed introduced-region authoring rather than relying only on future polygon files.

### F7 — Map loading/framing contradict some earlier documentation

The component registers a zoom-triggered ADM1 load **and immediately calls the same loader**, so detail is not actually deferred until zoom. The terrestrial fit extent includes the full neutral boundary layer, causing world framing rather than organism-focused framing. The large files are loaded even when arriving directly at Chemistry.

There are also asynchronous lifecycle risks: detail loading marks itself complete before successful fetch, lacks a retry reset, and can continue adding layers after disposal. Map reconstruction can leave uncontrolled checkbox presentation out of sync with newly created visible layers.

**Action:** smaller display assets, explicit load policy, species-aware initial extent, cancellation, recoverable partial failures, and controlled layer state.

### F8 — Occurrence interaction and interpretation need a focused pass

Hover currently exposes date, dataset, and record basis. It only recognizes features with a nonempty `occurrenceID`, although a GBIF feature key/source URL is also available. Some legitimate retained records may therefore be uninspectable. Hover is not an adequate touch/keyboard experience; tooltip positions are not clamped to map edges.

The importer preserves useful metadata and already requests present records without reported geospatial issues. It does not yet retain a complete reproducible query/result-quality report or coordinate-uncertainty policy. BOLD labels and taxonomic synonyms appear in current assets; these need accepted-taxon resolution rather than naive name equality checks.

**Action:** keep concise hover, add persistent selection/detail, improve occurrence QA and sampling disclosure, and never interpret point density as abundance or medical risk.

### F9 — Marine behavior is intentionally different and partly working

Four marine organisms have evidence-cell support. The mobile Reef Stonefish check correctly showed only occurrence/cell controls, with no terrestrial controls and no horizontal page overflow. ISEA3H cells summarize observations, not biological range.

**Do not “fix” marine range by coloring coastal countries or adding an Indo-Pacific country list.** Native marine range needs an appropriate marine source/geometry. The bacterium also needs its existing “native range not meaningful” explanation instead of a forced native/introduced map.

### F10 — Chemistry code survived; development reliability and scientific capability lag

Production Fire Ant 2D/3D rendering works in the spot check. The existing development server fails a dynamic 3Dmol import. Legacy feature code is useful for controls/flow comparison, but it is not evidence that a previous production-quality protein renderer or richer scientific catalog exists to restore.

Mol* is a scaffold, not an installed working macromolecular renderer. Do not describe its planned features as current capabilities. Choose a renderer after obtaining an appropriate, specifically identified protein/peptide structure.

### F11 — Advanced molecular controls overstate implemented analysis

The 3Dmol adapter currently maps “gaussian” to a VDW surface, renders hydrophobicity mode with a uniform color, and does not load/construct an electrostatic volume from its annotation metadata. Contact labels use a fixed origin rather than computed contact positions. These are implementation placeholders, not validated scientific displays.

The illustrative Solenopsin/channel example is explicitly labeled and gated, which is good, but its residue-contact narrative must not become evidence for this small molecule's mechanism. Move the demonstration out of the normal scientific dossier unless it has genuine explanatory value and scientifically reviewed semantics.

**Action:** publish only supported capabilities; source method/conditions for actual analyses. A colored surface is not automatically electrostatics or hydrophobicity.

### F12 — The chemistry domain is too small for expert depth

Current molecular identity primarily offers class, formula, molecular weight, and structure source. There is no structured expert property/study catalog. A toxin has a single material owner, which will not scale well when the same compound occurs in multiple organisms or materials. Group entries such as amatoxins and broad protein names must not masquerade as a single exact molecule.

**Action:** stable chemical identity plus explicit organism/material associations; class-specific expert data with individual evidence and measurement conditions.

### F13 — Effects has sound scope separation but insufficient depth

Organism exposure, whole material, and isolated compound are already distinct scientific subjects. Current physiological effects already have structured pathway types. Do not spend a migration recreating those features.

The missing pieces are detailed causal links, tissue/target specificity, applicability to humans versus animal/in-vitro studies, onset/duration, clinical variability, quantified-study context, and medical review metadata. The small anatomy schematic falls back to the same generic rectangle for unknown system IDs; adding new systems does not automatically add accurate anatomy.

### F14 — There is still hardcoded scientific presentation

Examples include symptom-ID-triggered emergency prose in the monopage and the fixed four-step delivery-diagram adapter, which can discard longer sequences. A legacy-style physiology timeline helper still classifies text by keywords, although the active monopage uses structured effects instead.

**Action:** source clinical context as content; render variable-length/branching evidence sequences; remove unused heuristic helpers only after checking callers. Distinguish unused legacy-style code from active behavior.

### F15 — Portability and CI are not proven end to end

Base-path configuration and an internal path helper exist, but the monopage still sends raw root-relative dedicated links, 2D asset paths, 3D structure paths, and annotation paths to consumers. Maps apply the base prefix independently. Root deployment can hide these inconsistencies.

CI currently runs validation/unit/build checks, not Playwright or project-path crawling. Its Node/pnpm bootstrap and cache order should be verified on a clean runner; local success on Node 24 does not prove the configured Node 20 job. Existing browser tests include map controls, wheel gating, empty states, and basic mobile overflow, but not enough rendered chemistry or marine assertions.

### F16 — Content contracts and documentation have drifted

Source schemas are defined inside the web loader as well as in the shared schema package. Build scripts import the web loader. Generated SQLite contains only basic organisms/toxins, not a full searchable scientific evidence graph. The optional explorer is a scaffold.

README and roadmaps contain outdated ports, five-organism statements, placeholder-geography descriptions, and already-completed tasks. The thin React page instruction remains valid for its stated files; it is not a reason to convert correct Astro routes into React pages.

## 5. Target experience and architecture

### 5.1 Four sections, three reading depths

| Section | Immediate reading | Expanded specialist reading |
| --- | --- | --- |
| Organism | Identity, selected real images, concise natural history, exposure route | Taxonomy, ecology, toxin acquisition/production, delivery apparatus, variability, source links |
| Geography | Clearly keyed native/introduced context plus GBIF dots | ADM1 provenance, source precision, selected observation details, source dates, limitations, optional filters |
| Chemistry | Known toxic material/mixture, toxin selector, identity, 2D/3D | Properties, stereochemistry, structures, targets, selectivity, study tables, validated interaction structures |
| Effects | What exposure does, major affected systems, clear scope | Molecular-to-clinical causal pathways, timing, variability, evidence applicability, severe outcome mechanisms, clinical references |

At every depth: distinguish **not yet researched**, **not found in reviewed sources**, **not applicable**, **disputed**, and **available**. Current binary coverage labels cannot express these differences.

Preserve deep links to the organism, selected toxin, section, and eventually individual claims. Dedicated toxin/source pages can remain useful supporting destinations; do not duplicate the complete application across many competing routes.

### 5.2 Evidence-backed static publication

Recommended flow:

**Source discovery → cached source metadata/data → candidate assertions → human review → canonical content → validation → generated static pages/assets.**

The visitor receives static content. Network access belongs mainly in explicit authoring/refresh jobs, not in every page visit. This provides rich internet-sourced data without paying for a runtime research backend or making the site depend on third-party availability.

A scientific claim/property should be able to carry:

- Stable claim ID and subject: organism exposure, material, compound, target, anatomical effect, or geographic assertion.
- Text or typed value with units; measurement conditions where relevant.
- Source IDs plus locator: table, figure, section, database field, accession/version, or a limited supporting excerpt when permitted.
- Evidence type, applicability/model organism, uncertainty, limitations, and causal scope.
- Measured versus calculated/predicted/inferred status and method.
- Source retrieval date, source version, scientific review status/date, and reviewer role.
- Conflicting assertions and the rationale for any preferred display value.

Do not automatically stamp inherited evidence as claim-level verification. Do not upgrade review status merely because a URL responds or a parser succeeds.

### 5.3 Source acquisition policy

- **Chemistry identity/properties:** PubChem and appropriate authoritative chemical databases, following their provenance back to original measurements where relevant.
- **Proteins/structures/targets:** RCSB PDB/PDBe, UniProt, original structural/functional studies; predicted models labeled distinctly.
- **Literature metadata:** PubMed/Europe PMC/Crossref as discovery/metadata aids, not proof that the article supports the proposed claim.
- **Clinical effects:** authoritative clinical/public-health sources and carefully matched reviews/primary studies. Case reports, mechanistic experiments, and clinical series are different evidence types.
- **Taxonomy/ecology/geography:** taxonomic authorities, government/IUCN where available, museums, floras/faunas, specialist literature; GBIF for occurrences rather than native status.
- **Wikipedia:** useful discovery/fallback context with explicit limits; follow underlying sources where possible. Do not indiscriminately reject strong museum/database sources just because they are not journal papers.

Keep external URL checks separate from deterministic builds. Report inaccessible/blocked/paywalled sources for review rather than treating every 403 or timeout as a false citation. Respect licenses, attribution, rate limits, and access restrictions; do not mirror full copyrighted papers.

## 6. Active delivery roadmap

### Milestone 0 — Agree on scope and freeze expansion

**Priority:** P0. **Effort:** small. **Dependency:** owner review. **Status:** completed 2026-09-08 (scope decisions and documentation only).

- [x] Approve **Organism, Geography, Chemistry, Effects** as the four primary sections and **“One organism, the full toxin story”** across poisonous, venomous, and toxin-producing organisms. Sources remain accessible throughout and collected at the end; specialist content belongs within these sections.
- [x] Select **GitHub Pages** as the primary static host, retaining correctness requirements for both `/` and `/venom-atlas/`. Cloudflare Pages is an alternative only. Deployment setup and verification remain Milestone 6 work, not completed hosting claims.
- [x] Approve **Fire Ant (*Solenopsis invicta*)** as the integration reference and **Golden Poison Frog (*Phyllobates terribilis*) / Batrachotoxin** as the chemistry reference. A specifically identified botulinum toxin subtype/structure and its clinical dossier follow; protein rendering does not block the first slice.
- [x] Freeze new-organism additions until both reference slices meet the applicable depth and reliability criteria in section 9 and the owner explicitly reopens expansion. Preserve the existing 15-organism catalog; evidence corrections, integrity fixes, and honest gap labeling remain allowed across existing records. Prioritize new dossier depth and assets for the two references rather than adding breadth.
- [x] Defer **3D anatomy, global range perfection, SQLite exploration, and broad comparative rankings**. Keep the bounded reference-map pass and supported molecular 2D/3D work in scope; neither is a mandate for global biogeography or 3D anatomy. Universal toxicity rankings remain scientifically inappropriate, not a promised stretch feature.
- [x] Establish **this document as the sole active product roadmap**. The README points here; the earlier reliability roadmap, biological-expansion checklist, and static-site migration plan are historical records, not parallel work queues. Their old checkmarks do not certify current validation or publication readiness.

#### First-release boundaries and expansion gate

- Deliver a static-first, four-section reference experience with inspectable sources, explicit uncertainty, supported chemistry, educational effects, bounded geography, licensed media, and root/project-path release checks. Retain Astro/React, OpenLayers, and the molecular-renderer boundary; do not restore a runtime backend.
- Use section 9 as the shared acceptance checklist, with the chemistry and effects exits in Milestone 3 and geography stop rule in section 7. Fire Ant proves the integrated reading path; Golden Poison Frog/Batrachotoxin proves chemistry depth without attributing whole-exposure effects to an isolated compound. Document genuinely inapplicable criteria rather than inventing content or silently waiving checks.
- Expansion requires recorded reference-slice acceptance, chemistry/medical review with no blocking issues, passing scientific and technical release gates, and explicit owner approval. Reviewer participation is not yet confirmed. Current Milestone 1A source blockers must be resolved before release; they do not prevent recording Milestone 0's scope decisions.
- Diagnosis/management content, source-precision policy, reviewer arrangements, license preferences, and other open decisions in section 8 remain pending. Scope approval does not authorize clinical advice, invent reviewer approval, or approve every later implementation task.

**Exit met:** reference organisms, GitHub Pages hosting choice, expansion freeze, deferred work, and first-release acceptance boundaries are recorded. No application behavior, scientific data, hosting settings, or deployment workflows were changed for Milestone 0.

### Milestone 1 — Trust and chemistry reliability foundation

**Priority:** P0. **Effort:** medium; several focused changes. **Dependency:** milestone 0.

#### 1A. Eliminate integrity ambiguities

- [x] Canonicalize the duplicate Redback citation, updating references without breaking meaningful public source URLs.
- [x] Remove/merge duplicate Fire Ant mechanism and physiology source records; preserve exposure scope.
- [x] Add uniqueness tests for citation IDs/slugs, evidence IDs where globally addressed, nested entities, and scientific subject bundles.
- [x] Validate anatomy/symptom/target references, geography evidence references, structure citations, and media citations through a consistent graph audit.
- [x] Reject unapproved scientific claims supported solely by internal/editorial records, while allowing explicit public statements of uncertainty.
- [x] Add a report distinguishing source rows, unique sources, cited sources, unsupported claims, and reviewed claims.
- [x] Extend route inventory/collision checking to actual generated atlas and source pages.

**Validation update (2026-09-08):** These checkboxes record implemented and tested safeguards, **not a clean scientific dataset or completion of Milestone 1**. Passed: 77 web unit tests (36 new), 2 schema tests, lint, type checks, 127 built-route comparisons, and 3 isolated production integrity tests. The strict `pnpm validate` gate correctly rejects **2 unsupported Solenopsin A claim records plus 26 dangling references to 14 geography assessments**. No review status or source support was invented to silence those failures. Source curation, chemistry reliability, and all other milestones remain untouched. See [Milestone 1A validation and remaining blockers](milestone-1a-validation.md) for reproducible reporting, evidence identity rules, and validation limits.

#### 1B. Restore dependable molecular rendering

- [ ] Reproduce the development-only 3Dmol import failure on a clean dependency state; inspect optimization/HMR/module interop before changing libraries.
- [ ] Test development cold load, reload, production load, and returning to Chemistry after navigation.
- [ ] Verify visible molecule pixels, rotation, reset, resize, keyboard focus, and wheel/page-scroll coexistence.
- [ ] Test failed dynamic import, failed structure request, malformed structure, and unavailable WebGL with usable text/2D fallbacks.
- [ ] Disable or accurately label unsupported advanced surface/analysis controls.
- [ ] Keep illustrative complex demonstrations outside the normal evidence narrative; do not use their fictional contacts as mechanism data.
- [ ] Preserve 2D stereochemical meaning; review the SVG generator's removal of enantiomer/R/S annotations against source structures.

#### 1C. Close immediately visible source gaps

- [ ] Verify Solenopsin A's exact chemical identity, source accession, stereochemistry, mass units, and structure provenance; attach real public evidence before replacing its editorial assessment.
- [ ] Carry relevant structure-asset citations/status through the chemistry view model, not only molecular-entity citations.
- [ ] Add visible citations to mechanism rows and geography source explanations.
- [ ] Move emergency-context prose into reviewed source content rather than triggering hardcoded copy from a symptom ID.

**Exit:** duplicates fail validation; Fire Ant chemistry works in clean development and production; published basic chemistry facts have inspectable source support. No broad map redesign is required to finish this milestone.

### Milestone 2 — Evidence schema and practical research workflow

**Priority:** P0/P1. **Effort:** large. **Dependency:** integrity work in milestone 1. Begin with one property and one clinical claim end to end, not a universal ontology rewrite.

- [ ] Define a minimal reusable claim/property assertion model with scope, units, source locators, conditions, provenance, and review status.
- [ ] Separate retrieval date from scientific review date and source publication/version date.
- [ ] Add applicability for human clinical evidence, animal evidence, in-vitro/ex-vivo studies, and inference; retain species/model details.
- [ ] Support conflicting findings and missing-data reasons without selecting an unjustifiably precise single value.
- [ ] Consolidate authoritative source schemas outside the web UI layer; keep domain/view-model boundaries clear and test migrations.
- [ ] Model a compound's occurrence in multiple organisms/materials as explicit associations; avoid duplicating the chemical identity to satisfy single ownership.
- [ ] Separate compound groups, exact stereoisomers, salts/protonation states, protein isoforms/serotypes, and biological mixtures.
- [ ] Implement source-metadata import for DOI/PMID/accessions with caching, duplicate detection, provider rate limits, and reviewable diffs.
- [ ] Implement a bounded PubChem identity/structure import first; refuse ambiguous identity matches rather than guessing.
- [ ] Store import method/version and source checksums or identifiers where redistribution permits; keep reproducible snapshots of permissible data.
- [ ] Route automated/AI-assisted extraction into a candidate queue, never automatic scientific publication.
- [ ] Add a repeatable authoring checklist: discover → inspect actual source → extract assertion → assign applicability → review → validate → publish.
- [ ] Create a shared claim-citation display usable in both Astro and React, with an accessible source disclosure and backlinks from sources to claims.
- [ ] Keep URL health/retraction/update checks as explicit or scheduled maintenance, separate from ordinary offline builds.
- [ ] Provide a build-time coverage report by organism, section, claim, and review status.

**Exit:** one imported chemical property and one manually reviewed clinical assertion can be traced from rendered UI to a precise source location; conflicting/unknown values remain explicit; rebuilding requires no public API credentials or live research service.

### Milestone 3 — The reference chemistry and effects dossiers

**Priority:** P1, central product value. **Effort:** large, with substantial research. **Dependency:** milestones 1–2; can proceed alongside the bounded geography work below.

#### 3A. Chemistry-major depth

- [ ] Define a reference dossier outline before gathering fields: identity, chemical family, structure, properties, targets, activity evidence, ecological context, and known gaps.
- [ ] Add identity fields where relevant: preferred names/synonyms, authoritative IDs, isomeric SMILES, InChI/InChIKey, formula, stereochemistry, formal charge, average versus exact mass with units.
- [ ] Add source-backed physical/chemical properties only when meaningful: pKa, solubility, lipophilicity, polar surface area, stability, and condition-dependent measurements.
- [ ] Distinguish computed descriptors from measured values; preserve pH, solvent, temperature, method, and uncertainty where the source reports them.
- [ ] Link organism/material variability and toxin-acquisition biology without implying a representative compound explains the entire mixture.
- [ ] Show targets with subtype/species, action, selectivity, study system, supporting measurements, and uncertainty—not just a target name.
- [ ] Keep 2D and 3D side by side where practical; add readable atom colors, provenance/status, model reset, and optional downloadable licensed structure data.
- [ ] Make controls capability-driven. Hide unavailable analysis rather than substituting a plausible-looking colored surface.
- [ ] Publish spectra or primary analytical data only when genuine sourced, licensed data is available; distinguish predicted from experimental spectra.
- [ ] For protein/peptide reference work, identify the exact molecular species and cover sequence/accession, domains, chains, maturation, disulfides/PTMs, and structural coverage where available.
- [ ] Evaluate 3Dmol versus a lazy-loaded Mol* implementation against a real sourced protein fixture; implement only the justified renderer path.
- [ ] Require provenance and biological relevance for toxin-target complexes; not every toxin needs a bound experimental structure.
- [ ] Show mixture components as sourced lists/tables; enable quantitative charts only when compatible abundance measurements justify them. Never convert “major/minor” into invented percentages.

**Chemistry exit:** a chemistry-trained reviewer can move from identity → structure → properties → target evidence without hitting misleading controls or losing citations, and can clearly see what is unknown.

#### 3B. MD-level effects depth

- [ ] Create linked causal records for exposure → distribution/access to target → molecular action → cellular disruption → tissue/organ dysfunction → clinical manifestations.
- [ ] Represent branches, parallel mechanisms, susceptible populations, and uncertainty; do not imply every exposure progresses linearly to severe disease.
- [ ] Preserve distinct organism-exposure, whole-material, and isolated-compound evidence in every link.
- [ ] Expand clinically relevant systems as justified: neuromuscular, autonomic/CNS, cardiovascular, respiratory, hepatic, renal, coagulation, local tissue, immune/allergic.
- [ ] Add sourced onset/duration and route-dependent context, distinguishing narrative sequence order from measured elapsed time.
- [ ] Separate common effects, unusual complications, and severe outcome mechanisms; do not equate a mechanistic possibility with clinical frequency.
- [ ] Link symptoms/signs, laboratory/pathophysiological findings, and mechanisms only where evidence supports the connection.
- [ ] Add contextual toxicity/pharmacology study records where useful: endpoint, unit, tested material, species/model, exposure route, method, conditions, and uncertainty.
- [ ] Do not extrapolate animal LD50 into a human lethal-dose claim or rank incompatible studies on one “deadliest” scale.
- [ ] Define whether treatment context is in scope. If included, keep it educational, guideline-linked, reviewed, and separate from personalized diagnosis or dosing guidance.
- [ ] Add visible clinical review status and review date. Never imply the MD friend reviewed content without actual review.
- [ ] Render variable-length exposure sequences and causal branches without the current four-item truncation.
- [ ] Make chemistry-to-effects navigation bidirectional, retaining the selected organism and compound context.

**Effects exit:** a medically trained reviewer can follow the causal explanation and its applicability, distinguish direct effects from inflammation/allergy, and inspect the supporting sources and review status.

#### 3C. Research acceptance rather than citation quotas

- [ ] Build a source matrix for each reference dossier: required topics, candidate sources, actual supporting locators, unresolved contradictions, and gaps.
- [ ] Search beyond the existing broad database/government summaries for relevant chemical, mechanistic, structural, and clinical literature.
- [ ] Expect dozens of relevant references across mature reference dossiers, but reject redundant/irrelevant references added only to increase counts.
- [ ] Track claim support and topic coverage as the principal metrics; count unique publications separately from repeated citations.
- [ ] Ask the chemistry-trained brother and MD friend to review their respective reading paths, recording concrete missing information and confusing interactions.

### Milestone 4 — Bounded geography improvement pass

**Priority:** P1. **Effort:** medium-to-large; separate display engineering from source curation. **Dependency:** integrity work plus the evidence contract for new claims. Do not hold chemistry/effects completion hostage to global geographic perfection.

#### 4A. Correctness and source precision

- [ ] Curate introduced/established evidence for the reference organism instead of relabeling all non-native observations.
- [ ] Support direct introduced ADM1/country assertions with the same provenance discipline as native assertions.
- [ ] Re-audit broad-source-to-ADM1 assignments, including selected-region subsets; retain source precision separately from rendering resolution.
- [ ] Distinguish direct regional evidence, country-derived context, and polygon intersection in styling, legend, and selected-region detail.
- [ ] Preserve source confidence instead of automatically assigning high confidence to every explicit ADM1 ID.
- [ ] Validate region ID existence/uniqueness, unmatched assertions, evidence resolution, and deterministic conflict handling.
- [ ] Reject empty/invalid curated geometries and report zero intersections appropriately; do not impose terrestrial-intersection requirements on legitimate marine ranges.
- [ ] Keep marine evidence cells separate from any future modeled range. Source marine geometries independently if available.
- [ ] Show the bacterium's “native range not meaningful” decision directly in the map explanation.

#### 4B. A lighter, clearer OpenLayers map

- [ ] Create simplified display boundaries at explicit detail levels, keeping large source geometries out of published assets unless needed.
- [ ] Replace the unconditional global-detail fetch with genuine deferred/region-specific loading and cache reuse.
- [ ] Fit to species evidence or an explicitly curated view extent; provide **Reset to organism** and **World** actions.
- [ ] Handle antimeridian extents and polar/projection limitations deliberately.
- [ ] Start with native/introduced fills and occurrence dots; move neutral ADM1/national-border details into secondary controls.
- [ ] Differentiate recorded-presence aggregation from observation dots and from introduced status. Do not overload yellow/orange for unrelated meanings.
- [ ] Add useful place/context labels without requiring a paid runtime basemap; retain first-party static operation as the default.
- [ ] Keep controls and tooltips from obscuring evidence, especially on narrow screens; improve sticky-header/section-anchor clearance.
- [ ] Add cancellable loads, partial-layer failure messages, retry, and layer-state persistence through reconstruction.
- [ ] Keep scroll zoom opt-in; verify touch panning/pinch, keyboard access, focus escape, and page scrolling.
- [ ] Expose source/license attribution for boundary data, occurrence datasets, and derived layers. A software license is not sufficient attribution for source observations.

#### 4C. Better GBIF evidence, not merely more dots

- [ ] Record accepted taxon key, query parameters, retrieval time, requested/returned/retained counts, filtering rules, and sampling limits.
- [ ] Add pagination or a documented stratified sample policy appropriate to static hosting; make limits configurable and reproducible.
- [ ] Retain record identity separately from grid aggregation, and retain aggregate counts without implying biological abundance.
- [ ] Review coordinate uncertainty, specimen versus observation basis, georeferencing issues, captive/cultivated context when available, and suspect outliers.
- [ ] Resolve taxonomic synonyms/accepted-name matches; do not delete BOLD-coded or synonym records solely on string mismatch.
- [ ] Use GBIF record key/source URL for selection even when `occurrenceID` is absent.
- [ ] Provide concise hover plus touch/keyboard-selectable record detail with source link and dataset attribution.
- [ ] Keep date-unknown records visible and labeled; add date/basis filters only after sampling and quality semantics are clear.

**Exit:** the reference map clearly distinguishes sourced native/introduced context from sampled observations, exposes regional evidence, loads without the current 24 MB boundary pair, and remains usable on desktop/mobile. Broader range coverage stays a separate backlog.

### Milestone 5 — Polished organism-first composition and licensed media

**Priority:** P1. **Effort:** medium. **Dependency:** agreed information architecture; can prototype while reference content is researched.

- [ ] Recompose the existing island into typed section hosts/components while retaining orchestration hooks; keep route wrappers thin rather than moving business logic into pages.
- [ ] Use the four primary sections; retain detailed subanchors for structures, targets, mixture composition, and mechanisms.
- [ ] Replace empty/repetitive summary surfaces with a concise organism introduction and a genuinely useful fact panel.
- [ ] Keep organism switching obvious and selection/bookmarked toxin state stable, including browser Back/Forward and invalid query values.
- [ ] Use progressive disclosure: readable overview first, specialist tables/controls one action away, no forced detour through taxonomy or renderer settings.
- [ ] Source two or three high-quality, redistribution-approved organism images per reference profile with captions, creator, license, source link, alt text, and dates.
- [ ] Pass typed media metadata through the view model and render a real gallery; make coverage status reflect what is actually published.
- [ ] Optimize image dimensions/formats and responsive variants; avoid shipping unreferenced originals.
- [ ] Make coverage status nuanced and secondary to the reading experience; do not hide scientifically important unknowns.
- [ ] Replace misleading “dedicated page” links and apply the shared URL/asset helper consistently.
- [ ] Establish heading hierarchy, keyboard/focus behavior, reduced-motion handling, and contrast across supported themes.
- [ ] Verify section anchor visibility beneath sticky elements at desktop, tablet, and narrow/mobile sizes.
- [ ] Preserve useful static text, citations, and structure alternatives with JavaScript disabled or failed.

**Exit:** a first-time reader sees one coherent organism story, not a collection of disconnected demos. Photographs and science visuals are distinguishable and correctly attributed.

### Milestone 6 — Static-host release gates and maintainability

**Priority:** P1, required before public release. **Effort:** medium. **Dependency:** testable reference slice; basic CI corrections can begin earlier.

- [ ] Fix all root-relative links/assets across Astro, React, structures, annotations, and downloads using one tested URL contract.
- [ ] Build and crawl both `/` and `/venom-atlas/`, including deep links, source pages, images, molecules, map layers, and 404 behavior.
- [ ] Add a GitHub Pages deployment workflow if selected, or verify Cloudflare production/preview setup if retained. Deploy static artifacts, not the development server.
- [ ] Verify Node/pnpm compatibility, bootstrap/cache order, frozen installs, and a fresh-clone build in CI.
- [ ] Run the full data pipeline in an isolated/clean environment; detect unexpected changes to checked-in generated assets and validate after generation as well as before it.
- [ ] Make Playwright configurable for isolated development and built-site preview ports; run relevant browser suites in CI.
- [ ] Add rendered chemistry/failure-path, introduced-range, marine-cell, mobile interaction, source-disclosure, and project-path tests.
- [ ] Add automated accessibility checks plus manual keyboard, screen-reader, touch, and reduced-motion review of reference paths.
- [ ] Gate initial route requests: no chemistry/Vega/map engines or geography asset fetches before the chosen intent/proximity trigger.
- [ ] Establish measured gzip JS, image, map, and total published-artifact budgets; start with baseline reports and agree enforceable limits after optimization.
- [ ] Measure user-facing loading/interactivity on a defined mid-range mobile/network profile; target good Core Web Vitals rather than a desktop-only synthetic score.
- [ ] Inventory published assets so build-only boundaries and unapproved media are not copied into the deploy output.
- [ ] Review the 3Dmol `eval` warning and dependency/security policy; do not hide it merely by increasing the chunk warning threshold.
- [ ] Check Vega runtime/spec compatibility when charts are exercised; do not load a large chart runtime for a qualitative list.
- [ ] Add canonical URLs, metadata/social previews, sitemap/robots behavior, and static-host-safe sharing links.
- [ ] Document source refresh cadence, review responsibilities, correction reporting, license compliance, deployment rollback, and stale-content handling.
- [ ] Update README/architecture roadmaps to reflect real ports, 15 organisms, actual renderer support, and current mapping behavior.
- [ ] Remove redundant legacy-style helpers only after checking usage; leave archived backend work clearly outside the production boundary.

**Exit:** the deploy artifact passes scientific validation, tests, real browser checks, base-path crawling, accessibility review, and agreed performance limits without a runtime backend.

### Milestone 7 — Stretch goals, deliberately deferred

**Priority:** P2. **Dependency:** public reference slice and reviewer feedback.

- [ ] Replace the schematic body rectangles with a licensed, medically reviewed SVG system illustration; explicitly handle unmapped systems rather than generic fallback anatomy.
- [ ] Add accessible system selection linked to effects/causal pathways, with a complete text equivalent.
- [ ] Evaluate 3D anatomy only if it explains something the SVG/text cannot, and only with suitable licenses, performance budget, and review support.
- [ ] Expand reference-quality organism coverage in small research batches, reusing established schemas/workflows.
- [ ] Consider local search over claims/targets/effects; use the generated search index before expanding a SQLite explorer.
- [ ] Consider transparent comparison tools only for compatible, contextualized studies—not a universal toxicity ranking.
- [ ] Add richer marine range sources, temporal occurrence exploration, and broader global ADM1 coverage when evidence and user need justify them.

## 7. Recommended sequencing and stop conditions

| Work package | Start after | Relative effort | Stop/acceptance condition |
| --- | --- | --- | --- |
| Scope + reference selection | Review | Small | Owner decisions recorded; no new-organism expansion. |
| Citation/source deduplication + regression tests | Scope | Small–medium | Ambiguous IDs and duplicate subject bundles fail validation. |
| Chemistry dev/production reliability | Scope | Medium | Cold-load and failure-path browser checks pass. |
| Evidence vertical slice | Integrity cleanup | Medium | One property and one clinical claim trace end to end. |
| Expert reference content | Evidence slice | Large; research-heavy | Chemistry and clinical reviewers accept depth/support. |
| Map correction/performance pass | Integrity + source contract | Medium–large | Reference native/introduced/dot experience accepted; further geography deferred. |
| UI/gallery composition | Scope + content outline | Medium | Four-section flow and licensed images accepted. |
| Host/CI/accessibility release gates | Begin early; finish after integration | Medium | Built reference pages pass root/project-path checks. |
| Protein renderer/anatomy/catalog expansion | Reference slice stable | Variable | Real assets/evidence/user feedback justify each addition. |

**First implementation batch proposed for approval:** duplicate-record cleanup and regression tests; 3Dmol development-load reproduction/fix; visible source support for existing chemistry; a minimal claim/source contract. This provides immediate trust and chemistry progress before any further geography expansion.

**Geography stop rule:** once the reference organism has a clear evidence-backed native/introduced map, honest occurrence sampling, a useful initial view, smaller display assets, and tested interactions, return effort to chemistry/effects. Do not make worldwide completeness a prerequisite for the product.

## 8. Owner decision register

Milestone 0 decisions below were recorded on 2026-09-08. The remaining choices still require owner review before the affected work proceeds:

- [x] **Host:** GitHub Pages selected explicitly by the owner; no VM or runtime backend. Root and `/venom-atlas/` correctness remain required. Verify service limits and production deployment in Milestone 6; a custom domain is not selected here.
- [x] **Reference organisms:** Fire Ant integration + Golden Poison Frog/Batrachotoxin chemistry first; specifically identified botulinum protein/clinical depth follows. Four sections, terminology, expansion freeze, deferred work, and roadmap authority are recorded in Milestone 0.
- [ ] **Map dissatisfaction:** rank inaccurate/unclear ranges, sparse dots, framing, visual styling, control clutter, mobile behavior, or load time. Recommendation: correctness/precision, framing, and payload first.
- [ ] **Country-to-ADM1 policy:** is visibly labeled coarse native context acceptable where state/province evidence is unavailable? Recommendation: yes, but never styled/labeled as independently proven state-level occupancy.
- [ ] **Clinical boundary:** mechanism/pathophysiology only, or also guideline-linked diagnosis/management context? Recommendation: deep educational mechanisms first; management only with a sustainable clinical review process.
- [ ] **Review access:** can the chemistry-trained brother and MD friend review reference slices, and should named reviewer credit be public only with consent?
- [ ] **Media licensing:** are attribution/share-alike assets acceptable? Recommendation: allow compatible reusable licenses with accurate credits; never treat free-to-view as free-to-redistribute.
- [ ] **Research automation:** approve cached API imports and candidate-claim extraction with human publication review. Recommendation: yes; no live autonomous fact generation for visitors.
- [ ] **Design direction:** retain/refine the current dark scientific look, or provide two or three visual references before a broader restyle? Recommendation: refine first, then validate with real imagery and expert content.

## 9. Reference-slice definition of done

- [ ] One organism can be explored through Organism → Geography → Chemistry → Effects without losing context or taking mandatory detours.
- [ ] Summary/natural history is coherent, illustrated with approved images, and claim-linked to sources.
- [ ] Native and introduced status comes from appropriate sources; GBIF dots are visibly a sampled observation layer.
- [ ] Source geographic precision and derivation are inspectable, not concealed behind ADM1 fills.
- [ ] 2D and 3D work in development and production, preserve chemical identity, and have meaningful failure alternatives.
- [ ] Expert chemistry contains relevant properties, structure/target detail, conditions, provenance, and clearly marked gaps.
- [ ] Effects explains supported causal pathways and clinical applicability at the requested depth, including uncertainty and review status.
- [ ] Every material factual claim/property has a public supporting source or an explicit unpublished/unknown status; internal scaffold citations never masquerade as support.
- [ ] Unsupported analytical controls and scientifically misleading demonstration artifacts are absent from the normal reading path.
- [ ] Root and GitHub-project-path deployments work; the site needs no production server, secret, or database.
- [ ] Mobile/keyboard/reduced-motion behavior is reviewed; static text remains useful when interactive engines fail.
- [ ] Validation, unit tests, browser tests, generated-data checks, and production build are green within agreed performance budgets.
- [ ] Chemistry and medical reviewers identify no blocking scientific/presentation issue in the reference paths.

## 10. Source map for implementation follow-up

Links below point to inspected repository files, not external scientific validation. Older planning documents are context, not proof that their checkboxes remain correct.

### Product and page architecture

- [Main monopage composition](../../apps/web/src/islands/AtlasMonopageIsland.tsx#L1)
- [Monopage orchestration, selection, section availability, and URLs](../../apps/web/src/features/atlas/hooks/useAtlasMonopageOrchestration.ts#L1)
- [Source-to-monopage view model](../../apps/web/src/lib/atlas-monopage-data.ts#L1)
- [Shared route/base-path helper](../../apps/web/src/lib/paths.ts#L1)
- [Global styling](../../apps/web/src/styles/global.css#L1)
- [Thin-page architecture](../architecture/ui-thin-pages.md#L1)

### Scientific data and provenance

- [Domain types](../../packages/domain/src/types.ts#L1)
- [Shared schemas](../../packages/schemas/src/index.ts#L1)
- [Active source schemas, loading, and first-match lookups](../../apps/web/src/lib/content.ts#L1)
- [Content validator](../../scripts/validate-content.ts#L1)
- [Citation-reference validator](../../scripts/validate-citations.ts#L1)
- [Main citation catalog](../../content-source/citations/solenopsis-citations.yaml#L1)
- [Coverage-expansion citation catalog](../../content-source/citations/biological-coverage-expansion-citations.yaml#L1)
- [Fire Ant exposure mechanisms](../../content-source/mechanisms/solenopsis-invicta-exposure.yaml#L1) — duplicate compound-named file removed in Milestone 1A.
- [Fire Ant exposure physiology](../../content-source/physiology/solenopsis-invicta-exposure.yaml#L1) — duplicate compound-named file removed in Milestone 1A.
- [Media catalog and publication flags](../../content-source/media/solenopsis-media.yaml#L1)
- [Existing dossier-authoring guidance](../scientific-model/organism-dossier-authoring.md#L1)

### Geography

- [OpenLayers loading, framing, interaction, and controls](../../apps/web/src/visualizations/maps/OpenLayersGeographyMap.tsx#L1)
- [Map panel and explanatory text](../../apps/web/src/visualizations/maps/RangeMapPanel.tsx#L1)
- [GBIF importer and sampling](../../scripts/fetch-gbif-occurrences.ts#L1)
- [Distribution registry builder](../../scripts/build-geography-registry.ts#L1)
- [Geographic scope registry](../../scripts/geography-scope-registry.ts#L1)
- [Geography source validator](../../scripts/validate-geography-sources.ts#L1)
- [Marine evidence-cell generator](../../scripts/generate-marine-evidence-cells.ts#L1)
- [Death Cap geography assertions](../../content-source/geography/amanita-phalloides.yaml#L1)
- [Castor Bean geography assertions](../../content-source/geography/ricinus-communis.yaml#L1)
- [Fire Ant geography assertions](../../content-source/geography/solenopsis-invicta.yaml#L1)
- [Current geography continuation prompt](../../.github/prompts/expand-geography-features.prompt.md#L1)

### Chemistry and effects

- [3Dmol adapter and advanced surface behavior](../../apps/web/src/molecular/adapters/ThreeDmolAdapter.ts#L1)
- [Mol* scaffold boundary](../../apps/web/src/molecular/adapters/MolstarAdapter.ts#L1)
- [Molecular viewer](../../apps/web/src/molecular/components/MoleculeViewer.tsx#L1)
- [Illustrative-complex viewer](../../apps/web/src/molecular/components/StructureComplexViewer.tsx#L1)
- [2D structure generation](../../scripts/generate-structure-svgs.ts#L1)
- [Solenopsin source record](../../content-source/toxins/solenopsin-a.yaml#L1)
- [Batrachotoxin source record](../../content-source/toxins/batrachotoxin.yaml#L1)
- [Anatomy schematic and fallback geometry](../../apps/web/src/visualizations/svg/AnatomySvg.tsx#L1)
- [Legacy-style timeline helper requiring usage review](../../apps/web/src/visualizations/vega/physiologyTimelineSpec.ts#L1)
- [Historical molecule-page orchestration](../../legacy/web-spa/features/molecule/hooks/useMoleculePageOrchestration.ts#L1)

### Build, release, and maintenance

- [Workspace scripts and dependencies](../../package.json#L1)
- [Astro static/base-path configuration](../../apps/web/astro.config.mjs#L1)
- [CI workflow](../../.github/workflows/ci.yml#L1)
- [Existing browser tests](../../apps/web/tests/static-routes.e2e.spec.ts#L1)
- [Playwright server configuration](../../apps/web/playwright.config.ts#L1)
- [Static JSON generation](../../scripts/build-static-json.ts#L1)
- [SQLite generation](../../scripts/build-sqlite.ts#L1)
- [Cloudflare deployment guide](../deployment/cloudflare-pages.md#L1)
- [Historical reliability roadmap (superseded)](elite-reliability-roadmap.md#L1)
- [README requiring a current-state refresh](../../README.md#L1)

---

**Review outcome:** Milestone 0 scope decisions are approved and documented; Milestone 1A safeguards were separately implemented, with source blockers still open. Other proposed boxes remain unchecked until approved and verified. This document is the active roadmap; implementation proceeds only in separately authorized, reviewable batches. Milestone 0 makes no application or scientific-content changes.