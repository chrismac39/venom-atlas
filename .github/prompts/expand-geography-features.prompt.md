---
name: "Expand Venom Atlas Geography Features"
description: "Extend evidence-backed occurrence, native-range, regional, and marine geography layers without overstating distribution"
argument-hint: "Optional organism slug or geography feature to focus on"
agent: "agent"
---

Implement geography improvements in the Venom Atlas repository. Work from the existing static-first
pipeline and thin-page architecture. Do not replace OpenLayers, add a runtime basemap, or turn sparse
observations into complete range boundaries.

## Current implementation baseline

The source-backed geography workflow is implemented for all fifteen current organisms. Continue from
the repository state, not from a blank design exercise. The authoritative source records are in
`content-source/geography/*.yaml`; each record now requires a `sourceAudit` block with:

- `decision`: `native_range_supported`, `native_range_not_established`, or `native_range_not_meaningful`;
- `precision`: `admin1`, `country`, `macroregion`, or `occurrence_only`;
- non-empty evidence and citation IDs; and
- a note explaining the geographic decision and its limits.

Runtime geography bundles expose this audit through `apps/web/src/lib/content.ts`. The validator
`scripts/validate-geography-sources.ts` confirms that all organism slugs have an audit and that every
audit citation resolves across `content-source/citations/*.yaml`. Do not remove this contract or infer
native status from GBIF points.

Current intentional boundary: `clostridium-botulinum` is marked `native_range_not_meaningful` because
the organism is an environmental bacterium without a defensible bounded native biogeographic range.
Marine organisms may have a cited broad native context while remaining occurrence-only in terrestrial
ADM1 shading; their ISEA3H cells are evidence aggregation, not modeled marine range boundaries.

Before changing generated files, edit source YAML or generator code, then run `pnpm build:data`.
Generated geography JSON, the distribution registry, search data, and SQLite are checked-in artifacts.

## Resumable checklist

Use `[x]` only after the repository and focused validation confirm the item.

### Occurrence evidence

- [x] Confirm every organism has a `confirmed_occurrence` geography range and a generated local
  occurrence GeoJSON asset.
- [x] Keep GBIF records limited to reusable-license records and preserve source/citation metadata.
- [x] Keep occurrence points as documented presence, not proof of a complete native or introduced range.
- [x] Expose concise occurrence hover metadata: no more than approximately three fields, including the
  recorded date when available, with an honest fallback for missing dates.
- [x] Ensure OpenLayers listeners are typed and cleaned up when the component unmounts.

### Native and administrative geography

- [x] Perform a native-range source check for every organism before deciding that native geography is
  unavailable. Use this source ladder in order: primary literature, IUCN or government agency, museum or
  university collection, taxonomic database, then a well-cited Wikipedia distribution section as a fallback.
  Record the source check even when it concludes that native status is uncertain.
- [x] Do not stop at GBIF. Occurrence records establish documented presence, not native status; use a
  distribution or range statement from the source check to support native claims.
- [x] Store native-country and curated-range provenance in geography source YAML and link it to existing
  citations or evidence records. Add a citation when the source check finds a source that is not already
  represented; Wikipedia is acceptable when its cited range statement is the best available source.
- [x] Classify source geographic precision as `admin1`, `country`, `macroregion`, or `occurrence_only`, and
  record `occurrence_only` plus an uncertainty note when the source check cannot support a native claim.
- [x] Use the geography scope registry for source claims such as Australia-wide or Western Europe, and
  preserve a distinct `source_native_scope_to_admin1` derivation after expansion.
- [x] Fail generation when a scope identifier or country code matches no local ADM1 features.
- [x] Generate native ADM1 shading from source-backed country/range evidence even when no GBIF point falls
  in a particular administrative unit.
- [x] Keep derivations distinct: occurrence aggregation, source-to-ADM1 extrapolation, and curated geometry.
- [x] Never label all observed occurrences native without explicit source support.
- [x] Preserve accessible textual evidence and honest loading, empty, and error states.

### Marine geography

- [x] Identify every `geographyKind: marine` record.
- [x] Generate a local ISEA3H evidence-cell asset for each marine organism from its occurrence asset.
- [x] Preserve antimeridian-wrapping marine cells while retaining strict geometry checks for ordinary
  administrative and curated range assets.
- [x] Make the marine cell layer available through the same map controls for every marine organism.
- [x] Keep ISEA3H cells as evidence aggregation, not a modeled marine range boundary.

### Pipeline and validation

- [x] Include occurrence and marine-cell generation in the documented data build path.
- [x] Run content, citation, media, structure, and geography validation.
- [x] Run web typecheck and focused tests for hover metadata, native cells without occurrence points, and
  marine-cell coverage.
- [ ] Run the relevant web unit tests, production build, and geography-route browser checks.
- [ ] Inspect desktop and mobile rendering for geometry distortion, tooltip overflow, control overlap, and
  map/page scroll behavior.
- [x] Keep generated static JSON, search, SQLite, occurrence, registry, and marine assets synchronized.

## Next-session protocol

1. Read this baseline and inspect `git status --short`; preserve unrelated working-tree changes.
2. Run `pnpm validate`, `pnpm typecheck`, and the focused biological coverage test before broad edits.
3. If adding or revising a species, update its geography YAML and citation catalog first. Keep the
  source audit explicit even when the result is uncertain or occurrence-only.
4. Run `pnpm build:data`, then the focused test and production build. Do not hand-edit generated JSON.
5. The remaining checklist item is visual/browser verification of geography routes at desktop and mobile
  sizes; report any existing warnings separately from regressions caused by the change.

## Acceptance criteria

The geography data and provenance implementation is complete when every organism has an occurrence-tier
map, every marine organism has an ISEA3H option, source-backed native shading can include unobserved ADM1
units, occurrence hover metadata is concise and date-aware, every source audit is citation-resolved, and
focused plus repository validation passes. The remaining completion gate is browser verification of the
geography routes. Report organisms whose native range remains intentionally unknown or uncertain,
including the sources checked and why they did not support a native claim. Do not leave the decision
implicit or fill the gap with a generic occurrence-derived claim.
