# Milestone 1A implementation and validation

**Date:** 2026-09-08. **Scope:** Milestone 1A only, explicitly authorized by the owner. Implementation checks are complete; scientific-content validation is **blocked**, not green. No other milestone was begun.

## Completed changes

- Kept one Redback citation with the existing ID `cit-australian-museum-redback`. Existing ID references therefore remain valid without rewriting them. The canonical source slug is `australian-museum-redback-spider`; `australian-museum-redback` remains a generated redirect. The external museum URL is unchanged.
- Removed only the identical compound-named Fire Ant mechanism/physiology files. Their exposure-named counterparts retain all steps, effects, stable IDs, and `organism_exposure` subjects. No isolated-compound mechanism or physiology was invented.
- Added a [raw-record graph audit](../../apps/web/src/lib/content-graph-audit.ts) before display mapping can conceal IDs, orphan records, or geography distribution references. The loader and audit now use one parsed source snapshot.
- Enforced citation IDs/slugs/aliases, nested entity IDs, per-kind slugs, one mechanism/physiology bundle per scoped subject, owner uniqueness, safe route slugs, and mapped organism foreign-key integrity.
- Documented the existing evidence reuse contract in code: an evidence ID names an assessment, not an individual claim. Identical repeated assessments remain legal; divergent definitions fail. Separated conflicting Solenopsin and Eunice assessment IDs without changing evidence confidence, citations, or scientific review status. Synchronized only the two affected checked-in JSON bundles.
- Audited anatomy/symptom links locally, target references against the subject's organism/material/compound, causal scopes, all four authored geography evidence-reference surfaces, and citations on evidence, source audits, structures, and media.
- Added fail-closed support checking: positive claims need public non-editorial evidence. A `reviewed` label alone is not a substitute for public sources. Explicit uncertainty is permitted only when its declaration matches the displayed summary/description, confidence is low/unknown, and it is not attached to positive molecular properties. The existing unresolved Solenopsin target statement is declared as uncertainty, not upgraded to a verified finding.
- Replaced the 61-route subset with the [complete route inventory](../../apps/web/src/lib/content-routes.ts). Web builds now compare the inventory to actual generated HTML, including source aliases, atlas pages, static redirects, and the 404 document.
- Added [36 unit regressions](../../apps/web/tests/content-graph-audit.test.ts) and [3 production integrity tests](../../apps/web/tests/content-integrity.e2e.spec.ts).

## Commands and observed results

| Check | Result |
| --- | --- |
| `pnpm test` | Passed: 77 web tests across 12 files; 2 schema tests. Other two packages have no tests. |
| `pnpm lint` | Passed; existing root module-type warning remains. |
| `pnpm typecheck` | Passed; Astro reports 0 errors/warnings/hints. Existing missing content-directory synchronization warning remains. |
| `pnpm --filter @venom-atlas/web build` | Passed: 127 HTML routes exactly match the inventory. Existing 3Dmol eval/chunk-size warnings remain. |
| `pnpm --filter @venom-atlas/web test:integrity:e2e` | Passed: 3 tests on isolated production preview port 5203. All 126 non-404 planned URLs return HTML; browser verifies Redback alias navigation/canonical source; exposure-only compound URLs and internal citation URL return 404. |
| `pnpm validate` | **Rejected 28 content issues**, detailed below; this is intentional enforcement, not a successful content validation. |
| Independent geography-source, media, and structure validators | Passed separately because the strict graph gate stops the chained command first. Six media assets still lack redistribution verification, as before. |
| `git diff --check` | Passed. |

The root release build still runs `pnpm validate` first and is blocked. A web-only build is a rendering/route check, **not publication approval**. No root data-generation pipeline, GBIF refresh, deployment, complete Playwright suite, or project-base-path run was performed. The production test preview was stopped automatically; existing development servers were not stopped or reused. The starting working tree was clean; edits were restricted to 1A and its two directly affected generated JSON records.

## Reproducible report

`pnpm audit:content` emits the complete JSON report with per-claim paths and issue paths. It exits nonzero when any issue remains, just like `pnpm validate`. The compatibility citation validator invokes the same audit rather than maintaining a second, incomplete graph traversal.

| Metric | Current count |
| --- | ---: |
| Citation source rows / unique citation IDs | 48 / 48 |
| Unique source identities | 48 |
| Public source rows | 47 |
| Cited IDs / cited source identities | 48 / 48 |
| Authored evidence-bearing claim records | 96 |
| Unique evidence assessments | 70 |
| Unsupported claim records | 2 |
| Explicit editorial uncertainty records allowed | 1 |
| Claim records marked reviewed with a review date | 0 |
| Planned and built HTML routes | 127 |

Counts include internal citations and references from unpublished media. Source identity uses normalized DOI, otherwise normalized URL, otherwise citation ID; it is a deterministic catalog metric, not a semantic publication-deduplication service. Claim counts cover authored evidence-bearing records, **not every prose sentence**, and repeated identical assessments do not become independently verified claims. Public citation resolution does not prove that the cited source supports the statement. Review dates are not inferred from access dates.

## Remaining content blockers

1. **Two unsupported Solenopsin A records** in [the toxin source](../../content-source/toxins/solenopsin-a.yaml): molecular identity (`ev-solenopsin-molecular-identity`) and the featured-compound assessment (`ev-solenopsin-feature`). Formula, molecular weight, accession, and featured-compound support require source verification; no citation was attached by guesswork. This is the source-curation gap identified in 1C, which was not begun.
2. **26 dangling geography evidence references to 14 undefined assessments**, distributed across source audits, direct native evidence IDs, and native scopes. Fire Ant is the only geography record whose audit evidence resolves today. These are missing assessment definitions, not missing citation rows. Existing notes/citations were not automatically turned into approved range evidence, nor were native references relinked to occurrence evidence.

| Geography source | Undefined evidence ID |
| --- | --- |
| [Death Cap](../../content-source/geography/amanita-phalloides.yaml) | `ev-amanita-phalloides-native-range` |
| [Fat-tailed scorpion](../../content-source/geography/androctonus-australis.yaml) | `ev-androctonus-australis-native-range` |
| [Box jellyfish](../../content-source/geography/chironex-fleckeri.yaml) | `ev-chironex-fleckeri-native-range` |
| [Botulinum bacterium](../../content-source/geography/clostridium-botulinum.yaml) | `ev-clostridium-botulinum-environmental-distribution` |
| [Geography cone](../../content-source/geography/conus-geographus.yaml) | `ev-conus-geographus-native-range` |
| [Jimsonweed](../../content-source/geography/datura-stramonium.yaml) | `ev-datura-stramonium-native-range` |
| [Bobbit worm](../../content-source/geography/eunice-aphroditois.yaml) | `ev-eunice-aphroditois-native-range` |
| [Gila monster](../../content-source/geography/heloderma-suspectum.yaml) | `ev-heloderma-suspectum-native-range` |
| [Redback](../../content-source/geography/latrodectus-hasselti.yaml) | `ev-latrodectus-hasselti-native-range` |
| [Platypus](../../content-source/geography/ornithorhynchus-anatinus.yaml) | `ev-ornithorhynchus-anatinus-native-range` |
| [Inland taipan](../../content-source/geography/oxyuranus-microlepidotus.yaml) | `ev-oxyuranus-microlepidotus-native-range` |
| [Golden poison frog](../../content-source/geography/phyllobates-terribilis.yaml) | `ev-phyllobates-terribilis-native-range` |
| [Castor bean](../../content-source/geography/ricinus-communis.yaml) | `ev-ricinus-communis-native-range` |
| [Reef stonefish](../../content-source/geography/synanceia-verrucosa.yaml) | `ev-synanceia-verrucosa-native-range` |

Resolve these through explicit source review and authored assessments or justified removal of unsupported assertions. Do not weaken the validator, fabricate review metadata, change marine range semantics, or undertake map/chemistry redesign to obtain a green result.